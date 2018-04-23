import * as amqplib from 'amqplib';

import { AmqpSession } from '../src/AmqpSession';

const rabbitUri = 'amqp://rabbitmq:rabbitmq@localhost:5672';
const queueName = 'testQueue';

interface BasicRequest {
  name: string;
}

interface BasicResponse {
  msg: string;
}

(async () => {
  const session = new AmqpSession(rabbitUri);
  
  await session.init();

  const exchange = 'main';

  // FOR QUOKKA
  await session.channel.deleteExchange(exchange);

  // Set up RPC (replier)
  await session.respond<BasicRequest, BasicResponse>(async (req) => {
    console.log(req);
    return { msg: `Hello ${req.name}` };
  }, { exchange, bindingKey: 'basicrpc' });

  // Send    

  await session.publish(exchange, 'basicrpc', { message: 'hello' });

  let response = await session.request({ bindingKey: 'basicrpc', exchange }, { name: 'jesse' });
  response

})();