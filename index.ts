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

type CancelableExecutor<T>  = (
  resolve: (value?: T | PromiseLike<T>) => void,
  reject: (reason?: any) => void,
  cancel: (reason?: any) => void
) => void;

enum State { PENDING, FULFILLED, REJECTED, CANCELED};

export class CancelablePromise<T> extends Promise<T> {

  // Static method to create a canceled promise, used for what?
  static cancel(detail) { return new this((resolve, reject, cancel) => cancel(detail)); }

  private state: State = State.PENDING;
  private cancelDetail: any;
  private onCancels: Function[] = [];

  constructor(executor: CancelableExecutor<T>, canceler?: Promise<any>) {
    super((resolve, reject) => {
      if (canceler) canceler.then(detail => this.cancel(detail));

      // Wait a tick, then maybe call the executor.
      Promise.resolve().then(() => {
        if (this.state === State.CANCELED) return;

        executor(
          value  => { if (this.state === State.PENDING) { this.state = State.FULFILLED; resolve(value); } },
          reason => { if (this.state === State.PENDING) { this.state = State.REJECTED;  reject(reason); } },
          detail => { this.cancel(detail); });
      });
    });
  }

  // Callback for cancellation.
  public onCancel(handler: Function): CancelablePromise<T> {
    if (this.state === State.CANCELED) handler(this.cancelDetail);
    else this.onCancels.push(handler);
    return this;
  }

  // Convenience property for a promise which fulfills on cancellation.
  public get canceled() { return new Promise(resolved => this.onCancel(resolved)); }

  // Internal routine to handle canceling either via `canceler` or call to `cancel` parameter to executor.
  private cancel(detail) {
    if (this.state === State.PENDING) {
      this.cancelDetail = detail;
      this.state = State.CANCELED;
      this.onCancels.forEach(handler => handler(this.cancelDetail));
    }
  };

}
