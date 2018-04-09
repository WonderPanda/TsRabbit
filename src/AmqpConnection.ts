import * as amqplib from 'amqplib';
import * as uuid from 'uuid';

export class AmqpConnection {
  private uri: string;
  private connection!: amqplib.Connection;
  public channel!: amqplib.Channel;

  constructor(uri: string) {
    this.uri = uri;
  }

  async init() {
    this.connection = await amqplib.connect(this.uri);
    this.channel = await this.connection.createChannel();
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

  async publish(exchange: string, bindingKey: string, message: object) {
    await this.channel.publish(exchange, bindingKey, new Buffer(JSON.stringify(message)));
  }

  async respond<T, U extends object>(handler: (msg: T) => Promise<U>, options: IRpcOptions) {
    const rpcQueue = uuid.v4();
    await this.channel.assertQueue(rpcQueue);
    await this.channel.bindQueue(rpcQueue, options.exchange, options.bindingKey);

    return this.channel.consume(rpcQueue, async (msg) => {
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
        `${msg.fields.routingKey}.accepted.${msg.properties.replyTo}` : `${msg.fields.routingKey}.accepted`;

      await this.publish(replyExchange, replyRoutingKey, response);
      this.channel.ack(msg);
    });
  }

  async request() {
  
  }
}

interface IRpcOptions {
  exchange: string;
  bindingKey: string;
  inSchemaPath?: string;
  outSchemaPath?: string;
}