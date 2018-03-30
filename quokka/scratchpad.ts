import * as amqplib from 'amqplib';

import { AmqpSession } from '../src/connection';

const rabbitUri = 'amqp://rabbitmq:rabbitmq@localhost:5672';
const queueName = 'testQueue';

(async () => {
  const session = new AmqpSession(rabbitUri);
  await session.init();

  const exchange = 'main';

  // FOR QUOKKA
  await session.channel.deleteExchange(exchange);

  await session.consume('consumer', exchange, 'some', async (msg) => {
    console.log(msg);
    console.log(msg.content.toString());
  });


  await session.publish(exchange, 'something.whatever', {
    body: {
      message: 'a message'
    }
  })

})();



