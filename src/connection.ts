import * as amqplib from 'amqplib';

export class AmqpSession {
  private uri: string;
  private connection!: amqplib.Connection;
  private channel!: amqplib.Channel;

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
}