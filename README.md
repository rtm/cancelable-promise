This repository suggests a lightweight mechanism for promise cancelation.

### Simplest case

In the simplest case, pass a promise as a second parameter to the `Promise` constructor.
This is called the "canceler".
When and if the canceler fulfills, then the promise is canceled.
Here "canceled" means that the promise is rejected with a special cancelation error.

For instance, let's create a promise which fulfills after five seconds, but cancel it after two seconds:

```
function timeout(ms, msg) {
  return resolve => setTimeout(() => resolve(msg), ms);
}

const canceler = new Promise(timeout(2000, "canceled"));

new Promise(timeout(5000, "elapsed"), canceler)
  .then(value => console.log(`promise fulfilled with value ${value}`),
  .catch(reason => console.log(`promise rejected with reason ${reason}`));
```

This yields

> promise rejected with reason { PromiseCanceledError: canceled

### Cleaning up after cancelations

To clean up after cancelations,
have the executor (the function you pass to the promise constructor) return a promise for cleaning up,
called the `onCancel` handler:

```
function timeout(ms, msg) {
  return function(resolve) {
    const timer = setTimeout(() => resolve(msg), ms);

    // Return a promise for cleaning up after cancelation
    return Promise.resolve(() => clearTimer(timer));
  };
}
```

In this case, if and when the canceler fulfills,
the `onCanceled` handler will run,
and when it in turn fulfills, then the promise will be rejected.

In the example given, there is no real point in clearing the timer.
A better example is aborting an XHR request.

### Immediate cancelation

There are cases where we want to cancel a promise immediately, in advance,
before it has a chance to run.
We provide a special method on the canceler called `cancelNow` to accomplish this.

### Handling cancelation-based rejections

With the introduction of cancelable promises,
promises now may reject due to either cancelation, or for unrelated reasons.
To make catching such errors easier, we provide the `handleCanceled` convenience routine
(as well as `handleNotCanceled`).
If the reason for rejection is not cancelation,
then the rejection is rethrown.

```
cancelablePromise.catch(handleCanceled(reason => console.log(`Promise was canceled for reason ${reason}, continuing`)));
```

If you so prefer, you may check the reason yourself with `isPromiseCanceledError`.

In this POC, error-related values such as `handleCanceled` must be imported from `promise-cancelled-error.js`.

### Running the tests

```
node timeout-test.js
```

This requires node >= 6.0.0.

### Impelementation notes

This POC overwrites the built-in `Promise` object at the moment that `cancelable-promise.js` is `require`'d.
