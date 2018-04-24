export const FailureSymbol = Symbol('Failure');

export interface IFailure {
    symbol: Symbol;
}

export type Success<T> = T

export type Failure<T extends IFailure> = T

export type Either<T, U extends IFailure> = Success<T> | Failure<U>

export function isFailure<T, U extends IFailure>(either: Either<T, U>): either is Failure<U> {
    const candidateFailure = either as Failure<U>;
    return candidateFailure.symbol && candidateFailure.symbol === FailureSymbol;
}

export function makeFailure<T extends object>(failureObj: T) : T & IFailure {
    let result = <T & IFailure>{};
    for (let id in failureObj) {
        (<any>result)[id] = (<any>failureObj)[id];
    }

    (<any>result).symbol = FailureSymbol;

    return result;
}
