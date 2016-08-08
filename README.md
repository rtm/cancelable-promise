This repository suggests a lightweight mechanism for promise cancellation.

### Simplest case

In the simplest case, pass a promise as a second parameter to the `Promise` constructor.
This is called the "canceler".
When and if the canceler fulfills, then the promise is canceled.
Here "canceled" means that the promise is rejected with a special cancellation error.

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

### Cleaning up after cancellations

To clean up after cancellations,
have the executor (the function you pass to the promise constructor) return a function returning a promise for cleaning up,
called the `onCancel` handler:

```
function timeout(ms, msg) {
  return function(resolve) {
    const timer = setTimeout(() => resolve(msg), ms);

    // Return a promise for cleaning up after cancellation
    return () => Promise.resolve(clearTimer(timer));
  };
}
```

In this case, if and when the canceler fulfills,
the promise returned by `onCancel` will run,
and when it in turn fulfills, then the promise will be rejected.

In the example given, there is no real point in clearing the timer.
A better example is aborting an XHR request.

### Immediate cancellation

There are cases where we want to cancel a promise immediately, in advance,
before it has a chance to run.
We provide a special method on the canceler called `precancel` to accomplish this.

### Handling cancellation-based rejections

With the introduction of cancelable promises,
promises now may reject due to either cancellation, or for unrelated reasons.
To make catching such errors easier, we provide the `handleCanceled` convenience routine
(as well as `handleNotCanceled`).
If the reason for rejection is not cancellation,
then the rejection is rethrown.

```
cancelablePromise.catch(handleCanceled(reason => console.log(`Promise was canceled for reason ${reason}, continuing`)));
```

If you so prefer, you may check the reason yourself with `isPromiseCanceledError`.

### Running the tests

```
npm test
```

This requires node >= 6.0.0.

### Implementation notes

This POC overwrites the built-in `Promise` object at the moment that `cancelable-promise.js` is `require`'d.

### Installation

```
npm install --save @rtm/cancelable-promise

require('@rtm/cancelable-promise');
```

### Notes on this proposal vs. other proposals for cancelable promises

We won't try here to do a complete comparison of this proposal vs. others.
Suffice it to say that the major design goal was to minimize the footprint of the new features.
This proposal involves only a change to the signature for the `Promise` constructor, adding the canceler,
one new method (`precancel`),
one new type (the error type),
and one new notion (returning an `onCancel` handler from the executor).

See https://github.com/bergus/promise-cancellation for another excellent proposal which stimulated my thinking on this one.

### Note on canceling fetch

A version of `whatwg-fetch` adapted to cancelable promises can be found [here](https://github.com/rtm/fetch).
It is called as `fetch(url, {canceler})`.
A patch to `node-fetch` should be equally straightforward.
