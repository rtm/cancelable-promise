// cancelable-promise/index.ts
//
// Cancelable promises.
//
// Usage:
// ```
// import {CancelablePromise} from '@rtm/cancelable-promise';
//
// Construct a new promise:
// new CancelablePromise((resolve, reject[, cancel]) => {...})
//
// Cancel a promise via a canceler:
// new CancelablePromise((resolve, reject) => {...}, canceler])
//
// Be alerted when a promise is canceled:
// cancelablePromise.onCancel(...).then(...)
// ```
"use strict";
var State;
(function (State) {
    State[State["PENDING"] = 0] = "PENDING";
    State[State["FULFILLED"] = 1] = "FULFILLED";
    State[State["REJECTED"] = 2] = "REJECTED";
    State[State["CANCELED"] = 3] = "CANCELED";
})(State || (State = {}));
;
class CancelablePromise extends Promise {
    constructor(executor, canceler) {
        super((resolve, reject) => {
            if (canceler)
                canceler.then(detail => this.cancel(detail));
            // Wait a tick, then maybe call the executor.
            Promise.resolve().then(() => {
                if (this.state === State.CANCELED)
                    return;
                executor(value => { if (this.state === State.PENDING) {
                    this.state = State.FULFILLED;
                    resolve(value);
                } }, reason => { if (this.state === State.PENDING) {
                    this.state = State.REJECTED;
                    reject(reason);
                } }, detail => { this.cancel(detail); });
            });
        });
        this.state = State.PENDING;
        this.onCancels = [];
    }
    // Static method to create a canceled promise, used for what?
    static cancel(detail) { return new this((resolve, reject, cancel) => cancel(detail)); }
    // Callback for cancellation.
    onCancel(handler) {
        if (this.state === State.CANCELED)
            handler(this.cancelDetail);
        else
            this.onCancels.push(handler);
        return this;
    }
    // Convenience property for a promise which fulfills on cancellation.
    get canceled() { return new Promise(resolved => this.onCancel(resolved)); }
    // Internal routine to handle canceling either via `canceler` or call to `cancel` parameter to executor.
    cancel(detail) {
        if (this.state === State.PENDING) {
            this.cancelDetail = detail;
            this.state = State.CANCELED;
            this.onCancels.forEach(handler => handler(this.cancelDetail));
        }
    }
    ;
}
exports.CancelablePromise = CancelablePromise;
