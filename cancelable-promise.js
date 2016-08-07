// cancelable-promise.js
//
// Implement lightweight cancelable promises.
//
// Usage:
// ```
// require('./cancelable-promise');
//
// new Promise(function(resolve, reject) { ... }, canceler).then(...).catch(...);
// ```

const {PromiseCanceledError} = require('./promise-canceled-error');
const oldPromise = Promise;

class CancelablePromise extends oldPromise {

  constructor(executor, canceler) {
    super(function(resolve, reject) {
      // If the canceler has been canceled now, reject immediately.
      if (canceler && canceler.cancelReason) reject(new PromiseCanceledError(canceler.cancelReason));

      const onCancel = executor(resolve, reject);

      if (canceler) canceler.then(cancelReason => onCancel.then(
        () => reject(new PromiseCanceledError(cancelReason))));
    });
  }

  // Used for promises used as cancelers.
  cancelNow(reason) { this.cancelReason = reason; }

}

// Hackery to replace Promise with CancelablePromise.
Promise = CancelablePromise;
['all', 'race', 'resolve', 'reject'].forEach(method => Promise[method] = oldPromise[method].bind(oldPromise));
Promise.prototype = oldPromise.prototype;
