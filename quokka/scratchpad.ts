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

  session.messageSubject.subscribe(x => console.log('logger', x));

  // FOR QUOKKA
  //await session.channel.deleteExchange(exchange);

  // Set up RPC (replier)
  await session.respond<BasicRequest, BasicResponse>(async (req) => {
    return { msg: `Hello ${req.name}` };
  }, { exchange, bindingKey: 'basicrpc' });

  await session.respondDirect<BasicRequest, BasicResponse>(async (req) => {
    return { msg: `Hello ${req.name}` };
  }, { exchange, bindingKey: 'directrpc' }, (msg) => console.log('server', msg));

  await session.requestDirect<{ msg: string }>({ bindingKey: 'directrpc', exchange }, { name: 'randy' }); /* ? */
  await session.requestDirect<{ msg: string }>({ bindingKey: 'directrpc', exchange }, { name: 'jesse' }); /* ? */
  await session.requestDirect<{ msg: string }>({ bindingKey: 'directrpc', exchange }, { name: 'james' }); /* ? */
  await session.requestDirect<{ msg: string }>({ bindingKey: 'directrpc', exchange }, { name: 'mike' }); /* ? */


  let promises = [1, 2, 3].map(x => {
    return session.requestDirect<{ msg: string }>({ bindingKey: 'directrpc', exchange }, { name: `msg${x}` });
  });

  await Promise.all(promises); /* ? */

})();