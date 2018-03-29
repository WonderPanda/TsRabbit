import * as amqp from 'amqplib';

type Success<T> = T
type Failure = { errorCode: number; errorDescription: string; }

type RpcResponse<T> = Success<T> | Failure

type RpcHandler<T, U> = (msg: T) => RpcResponse<U>

export class RpcListener<T, U> {
  private handler: RpcHandler<T, U>;

  constructor(handler: RpcHandler<T, U>, exchange: string, bindingKey: string) {
    this.handler = handler;
  }
}

