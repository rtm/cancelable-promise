// tests/timeout.ts
//
// Simple test for canceling a promise which would resolve in five seconds
// after two seconds instead.

require('./cancelable-promise');

// Executor to create a (cancelable) promise which fulfills after ms time with a specified value.
function timeout(ms, value) {
  return function(resolve) {
    const timer = setTimeout(() => resolve(value), ms);

    // Return the `onCancel` promise.
    return Promise.resolve(() => {
      console.log(`Timer for ${ms}ms has been cleared!`);
      clearTimer(timer);
    });
  };
}

const canceler = new Promise(timeout(2000, "canceled"));

// Create a cancelable promise using the requestor and canceling promise.
const promise = new Promise(timeout(5000, "elapsed"), canceler);

promise
  .then(
    value => console.log("promise fulfilled with value", value),
    reason => console.log("promise rejected with reason", reason)
  );
