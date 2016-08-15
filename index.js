// cancelable-promise/index.ts
//
// Implement lightweight cancelable promises.
//
// Usage:
// ```
// import {CancelablePromise} from 'cancelable-promise';
//
// new CancelablePromise(function(resolve, reject[, cancel]) {...}[, canceler])[ { ... }.onCancel(...).then(...).catch(...);
//                                                  ^^^^^^           ^^^^^^^^
// ```
"use strict";
class CancelablePromise extends Promise {
    constructor(executor, canceler) {
        let canceled = false; // Promise is in pending/canceled state.
        let cancelReason; // Reason given at cancellation time.
        let settled = false; // Promise has been settled; may no longer be canceled.
        let onCancels = []; // `onCancel` handlers registered before cancellation.
        // Cancel the promise. Mark it as such. Invoke pre-registered handlers if any.
        function cancel(v) {
            if (settled || canceled)
                return;
            cancelReason = v;
            onCancels.forEach(handler => handler(cancelReason));
            canceled = true;
        }
        // Resolve or reject the promise, marking it as settled to prevent cancellation.
        function settle(cb) { return v => { settled = true; if (!canceled)
            cb(v); }; }
        // Create the underlying native promise.
        // Set up `canceler` to possibly cancel.
        // Call the executor with an extra `cancel` parameter.
        super(function (resolve, reject) {
            if (canceler)
                canceler.then(cancel);
            Promise.resolve().then(() => {
                if (!canceled)
                    executor(settle(resolve), settle(reject), cancel);
            });
        });
        Object.defineProperties(this, {
            // Event callback for canceled promises.
            // This taps into the promise chain, leaving it intact.
            onCancel: {
                value(handler) {
                    if (canceled)
                        handler(cancelReason);
                    else
                        onCancels.push(handler);
                    return this;
                }
            },
            canceled: { get() { return new Promise(resolved => this.onCancel(resolved)); } }
        });
    }
    // Static method to immediately create a canceled promise.
    static cancel(reason) {
        return new CancelablePromise(function (_, __, cancel) { cancel(reason); });
    }
}
exports.CancelablePromise = CancelablePromise;
