// tests/reject-canceler.test.js
//
// Set up a promise with a canceler,
// but have the `onCancel` promise reject,
// which nullifies the cancellation.

require('..');
const test = require('tape');

// Executor to create a (cancelable) timer-based promise,
// but whose `onCacnel` handler rejects.
function timeout(ms, value) {
  return function(resolve) {
    const timer = setTimeout(() => resolve(value), ms);

    // Return the `onCancel` promise, emulating clean-up failure.
    // This reject reason will be thrown away.
    return () => Promise.reject(`onCancel handler rejected`);
  };
}

test("onCancel handler rejects, nullfying cancellation", function(t) {

  t.plan(1);

  // Fire the canceler after 100ms.
  const canceler = new Promise(timeout(100, "canceled"));

  // Create the underlying promise with canceler.
  const promise = new Promise(timeout(200, "elapsed"), canceler);

  promise.then(value => t.equal(value, "elapsed"));

});
