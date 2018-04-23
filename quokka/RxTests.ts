import { Observable } from 'rxjs/Rx';
import { mapTo, delay } from 'rxjs/operators';
import { race } from 'rxjs/observable/race';


// const future = Observable.interval(200)
//     .skip(3)
//     .first()
//     .toPromise();

// const queue = new Observable<number>((observer) => {
//     (async () => {
//         try {
//             let result = await future;
//             observer.next(result);
//             observer.complete();
//         } catch (error) {
//             observer.error(error);
//         }
//     })();

// })

// queue.map(x => x + 10)
//     .catch(x => { return Observable.of(0) })
//     .subscribe(x => console.log(x));


// const SuccessSymbol = Symbol('Success');
const FailureSymbol = Symbol('Failure');

interface IFailure {
    symbol: Symbol;
}

type Success<T> = T
type Failure<T extends IFailure> = T

type Either<T, U extends IFailure> = Success<T> | Failure<U>

function isFailure<T, U extends IFailure>(either: Either<T, U>): either is Failure<U> {
    const candidateFailure = either as Failure<U>;
    return candidateFailure.symbol && candidateFailure.symbol === FailureSymbol;
}

interface Data {
    data: string;
}

interface CustomFailure {
    symbol: Symbol;
    errorMessage: string;
}

let either: Either<Data, CustomFailure> = { symbol: FailureSymbol, errorMessage: 'error' }; 

if (isFailure<Data, CustomFailure>(either)) {
    // inside this branch the type of either is shown to be: Data & CustomFailure
    console.log('failure', either);
} else {
    // inside this branch the type of either is show to be: Data
    console.log('success', either)
}

function test(either: Either<Data, CustomFailure>) {
    if (isFailure<Data, CustomFailure>(either)) {
        // here either is CustomFailure
        console.log('failure', either);
    } else {
        // inside this branch the type of either is show to be: Data
        console.log('success', either)
    }
  }

// type Response<T extends { result?: Symbol }> = T

// interface Timeout { error: string };

// type RequestResponse<T> = Response<T> | Timeout

// let timeout: Observable<RequestResponse<string>> = Observable
//     .interval(1500)
//     .first()
//     .map(x => { return ""; });

// let workPromise: Promise<RequestResponse<string>> = new Promise((resolve, reject) => {
//     setTimeout(() => {
//         resolve('ping');
//     }, 1000);
// });

// let work = Observable.fromPromise(workPromise);

// let winner = race(timeout, work);

// (async () => {
//     // console.log('async')
//     let result = await race(timeout, work).take(1).toPromise();
//     result;
// })();


// function 

