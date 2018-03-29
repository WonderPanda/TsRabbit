import * as amqplib from 'amqplib';

import { AmqpSession } from '../src/connection';

const rabbitUri = 'amqp://rabbitmq:rabbitmq@localhost:5672';
const queueName = 'testQueue';

(async () => {
  const session = new AmqpSession(rabbitUri);
  await session.init();

  await session.consume('consumer', 'main', 'something.*', async (msg) => {
    console.log(msg.content.toString());
  });


  await session.publish('main', 'something.another', {
    body: {
      message: 'a message'
    }
  })
  // const connection = await amqplib.connect(rabbitConnection);
  // const channel = await connection.createChannel();
  // await channel.assertQueue(queueName);

  // await channel.consume(queueName, msg => {
  //   if (msg === null) return;
  //   console.log(msg.content.toString());
  //   //channel.nack(msg);
  //   channel.ack(msg)
  // })

  // await channel.sendToQueue(queueName, new Buffer(
  //   JSON.stringify({
  //     body: 'this is something cool',
  //     aNumber: 42
  //   })
  // ));

  // await channel.sendToQueue(queueName, new Buffer(
  //   JSON.stringify({
  //     body: 'this is something cooler',
  //     aNumber: 42
  //   })
  // ));

})();



