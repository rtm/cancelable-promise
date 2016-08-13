// cancelable-promise/index.js
//
// Implement lightweight cancelable promises.
//
// Usage:
// ```
// require('cancelable-promise');
//
// new Promise(function(resolve, reject, cancel) { ... }.onCancel(...).then(...).catch(...);
// new Promise(function(resolve, reject) { ... }, canceler).onCancel(...).then(...).catch(...);
// ```

const oldPromise = Promise;

Promise = class extends oldPromise {

  constructor(executor, canceler) {
    var canceled = false;
    var cancelReason;
    var settled = false;
    var onCancelHandlers = [];

    function cancel(v) {
      if (settled || canceled) return;
      canceled = true;
      cancelReason = v;
      onCancelHandlers.forEach(handler => handler(cancelReason));
    }

    function settle(cb) { return v => { settled = true; if (!canceled) cb(v); }; }

    super(function(resolve, reject) {
      if (canceler) canceler.then(cancel);

      Promise.resolve().then(() => {
        if (!canceled) executor(settle(resolve), settle(reject), cancel);
      });
    });

    this.onCancel = function(handler) {
      if (canceled) handler(cancelReason);
      else onCancelHandlers.push(handler);
      return this;
    };

    this.onCancelThrow = function() {
      if (canceled) throw cancelReason;
      return this;
    };

  }

}

Promise.all = oldPromise.all.bind(oldPromise);
Promise.race = oldPromise.race.bind(oldPromise);
Promise.reject = oldPromise.reject.bind(oldPromise);
Promise.resolve = oldPromise.resolve.bind(oldPromise);
Promise.cancel = v => new Promise(function(_, _, cancel) { cancel(v); });
Promise.prototype = oldPromise.prototype;
