import * as amqplib from 'amqplib';
import * as uuid from 'uuid';
import { Observable, Subject } from 'rxjs';
import { first, filter, map } from 'rxjs/operators';

interface CorrelationMessage {
  correlationId: string;
  message: {};
}

const DIRECT_REPLY_QUEUE = 'amq.rabbitmq.reply-to';

export class AmqpSession {
  private uri: string;
  private connection!: amqplib.Connection;
  public messageSubject = new Subject<CorrelationMessage>();
  //private directReplyReady: Promise<void>;
  public channel!: amqplib.Channel;

  constructor(uri: string) {
    this.uri = uri;
  }

  async init() {
    this.connection = await amqplib.connect(this.uri);
    this.channel = await this.connection.createChannel();
  
    // TODO: Reconsider how we approach initialization logic (ie. proper singleton style)
    await this.channel.consume(DIRECT_REPLY_QUEUE, async (msg) => {
      if (msg === null || !msg.properties.correlationId) {
        //observer.error(new Error('Received a null response'));
        return;
      }

      const correlationMessage: CorrelationMessage = {
        correlationId: msg.properties.correlationId.toString(),
        message: JSON.parse(msg.content.toString())
      }

      this.messageSubject.next(correlationMessage);
    }, { noAck: true });
  }

  async consume(
    queue: string, 
    exchange: string, 
    bindingKey: string, 
    callback: (msg: amqplib.Message) => Promise<void>) 
  {
    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    const queueOk = await this.channel.assertQueue(queue);
    await this.channel.bindQueue(queue, exchange, bindingKey);

    return this.channel.consume(queue, async (msg) => {
      if (msg === null) {
        throw Error('Received null message');
      }

      await callback(msg);
      this.channel.ack(msg);
    });
  }

  async publish(exchange: string, bindingKey: string, message: object, options?: amqplib.Options.Publish | undefined) {
    await this.channel.publish(exchange, bindingKey, new Buffer(JSON.stringify(message)), options);
  }

  async respond<T, U extends object>(handler: (msg: T) => Promise<U>, options: IRpcOptions) {
    await this.channel.assertExchange(options.exchange, 'topic');
    const rpcQueue = await this.channel.assertQueue('');
    await this.channel.bindQueue(rpcQueue.queue, options.exchange, options.bindingKey);

    await this.channel.consume(rpcQueue.queue, async (msg) => {
      if (msg === null) {
        throw Error('Received null message');
      }

      // TODO: Run this message through the In Schema if one was provided

      // TODO: Investigate if there's a better way to support msg -> T translation if schema wasn't provided
      const message = JSON.parse(msg.content.toString()) as T;
      const response = await handler(message);

      // TODO: Make this more generic with less assumptions about topology
      const replyExchange = msg.fields.exchange;
      const replyRoutingKey = msg.properties.replyTo ? 
        `${msg.fields.routingKey}.accepted.${msg.properties.replyTo}` : 
        `${msg.fields.routingKey}.accepted`;

      await this.publish(replyExchange, replyRoutingKey, response);
      this.channel.ack(msg);
    });
  }

  async respondDirect<T, U extends object>(handler: (msg: T) => Promise<U>, options: IRpcOptions, logger?: ({}) => void) {
    await this.channel.assertExchange(options.exchange, 'topic');
    const rpcQueue = await this.channel.assertQueue('');
    await this.channel.bindQueue(rpcQueue.queue, options.exchange, options.bindingKey);

    await this.channel.consume(rpcQueue.queue, async (msg) => {
      if (msg === null) {
        throw Error('Received null message');
      }

      if (logger) {
        logger(msg.content.toString());
      }
      
      const message = JSON.parse(msg.content.toString()) as T;
      const response = await handler(message);

      await this.publish('', msg.properties.replyTo, response, {
        correlationId: msg.properties.correlationId
      });

      this.channel.ack(msg);
    });
  }

  async request<T>(options: IRpcOptions, payload: object, timeout?: number): Promise<T | any> {
    const replyTo = uuid.v4();
    const correlationId = uuid.v4();
    const responseKey = `${options.bindingKey}.*.*`;
    const responseQueue = await this.channel.assertQueue('');
    await this.channel.bindQueue(responseQueue.queue, options.exchange, responseKey);
    
    const response = new Observable<T>((observer) => {
      (async () => {
        await this.channel.consume(responseQueue.queue, async (msg) => {
          if (msg === null) {
            observer.error(new Error('Received a null response'));
            return;
          }

          // TODO: Find something better than casting to T or add the ability to set validation middlewares
          observer.next(JSON.parse(msg.content.toString()) as T);
          observer.complete();

          //await this.channel.deleteQueue(responseQueue.queue);
        });

        await this.publish(options.exchange, options.bindingKey, payload, { replyTo, correlationId });
      })();
    });

    return response.pipe(first()).toPromise();
  }

  async requestDirect<T extends {}>(options: IRpcOptions, payload: object, timeout?: number): Promise<T | any> {
    const correlationId = uuid.v4();

    await this.publish(options.exchange, options.bindingKey, payload, { 
      replyTo: DIRECT_REPLY_QUEUE,
      correlationId
    });

    return this.messageSubject.pipe(
        filter(x => x.correlationId === correlationId),
        map(x => x.message),
        first()
      )
      .toPromise();
  }
}

export interface IRpcOptions {
  exchange: string;
  bindingKey: string;
  inSchemaPath?: string;
  outSchemaPath?: string;
}