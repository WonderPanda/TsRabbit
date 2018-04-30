//import { Observable } from 'rxjs/Rx';
//import { mapTo, delay } from 'rxjs/operators';
//import { race } from 'rxjs/observable/race';


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

