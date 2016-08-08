// tests/timeout.ts
//
// Executor for creating timeout-based promise.

// Executor to create a (cancelable) promise which fulfills after ms time with a specified value.
function timeout(ms, value) {
  return function(resolve) {
    setTimeout(() => resolve(value), ms);
  };
}

// Executor to create a (cancelable) promise which fulfills after ms time with a specified value.
// Include an `onCancel` or "cleanup" handler, by returning it from executor.
function timeoutWithCancelHandler(ms, value) {
  return function(resolve) {
    const timer = setTimeout(() => resolve(value), ms);
    return () => {
      clearTimeout(timer);
      return Promise.resolve("cancelled and cleaned up");
    };
  };
}

module.exports = {timeout, timeoutWithCancelHandler};
