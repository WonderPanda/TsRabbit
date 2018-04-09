import * as amqplib from 'amqplib';

import { AmqpConnection } from '../src/AmqpConnection';

const rabbitUri = 'amqp://rabbitmq:rabbitmq@localhost:5672';
const queueName = 'testQueue';

interface BasicRequest {
  name: string;
}

interface BasicResponse {
  msg: string;
}

(async () => {
  const session = new AmqpConnection(rabbitUri);
  await session.init();

  const exchange = 'main';

  // FOR QUOKKA
  await session.channel.deleteExchange(exchange);

  // Set up consumer (requester)
  await session.consume('consumer', exchange, 'basicrpc.*', async (msg) => {
    console.log(msg.content.toString());
  });

  await session.consume('consumer2', exchange, 'basicrpc.accepted', async (msg) => {
    console.log(msg.content.toString());
  });

  // Set up RPC (replier)
  await session.respond<BasicRequest, BasicResponse>(async (req) => {
    return { msg: `Hello ${req.name}` };
  }, { exchange, bindingKey: 'basicrpc' });

  // Send    

  await session.publish(exchange, 'basicrpc', {
    name: 'test'
  });

  await session.publish(exchange, 'basicrpc', {
    name: 'jesse'
  });

})();