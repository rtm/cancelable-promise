This repository suggests a lightweight mechanism for promise cancellation.

## Basic use cases

### Simplest case

In the simplest case, pass a promise as a second parameter to the `Promise` constructor.
This is called the "canceler".
When and if the canceler fulfills, then the underlying promise is canceled.
Here "canceled" means that the promise is rejected with a special cancellation error.

For instance, let's create a promise which fulfills after five seconds, but cancel it after two seconds:

```
function timeout(ms, msg) {
  return resolve => setTimeout(() => resolve(msg), ms);
}

const canceler = new Promise(timeout(2000, "canceled"));

new Promise(timeout(5000, "elapsed"), canceler)
  .then(value => console.log(`promise fulfilled with value ${value}`),
  .catch(reason => console.log(`promise rejected with reason ${reason.message}`));
```

This yields

> promise rejected with reason canceled

### Cleaning up after cancellations

To clean up after cancellations,
have the executor (the function you pass to the promise constructor) return a function for cleaning up,
called the `onCancel` handler:

```
function timeout(ms, msg) {
  return function(resolve) {
    const timer = setTimeout(() => resolve(msg), ms);

    // Return a promise for cleaning up after cancellation
    return () => clearTimer(timer);
  };
}
```

In this case, if and when the canceler fulfills,
`onCancel` will run, then the underlying promise will be rejected.

In the example given, there is no real point in clearing the timer.
A better example is aborting an XHR request.

### Immediate cancellation

There are cases where we want to cancel a promise immediately, in advance,
before it has a chance to run.
We provide a special method on the canceler called `precancel` to accomplish this.

### Handling cancellation-based rejections

With the introduction of cancelable promises,
promises now may reject due to either cancellation, or for other reasons.
To make catching such errors easier, we provide the `handleCanceled` convenience routine
(as well as `handleNotCanceled`).
If the reason for rejection is not cancellation,
then the rejection is rethrown.

```
cancelablePromise.catch(handleCanceled(reason => console.log(`Promise was canceled for reason ${reason}, continuing`)));
```

If you so prefer, you may check the reason yourself with `isPromiseCanceledError`.

## Basic notions

* A new flavor of promise which may be canceled when some other promise (the "canceler") resolves,
with optional clean-up logic.

* Cancelers which are associated with promises at promise-creation time,
by passing the canceler as a second parameter to the `Promise` constructor.
In other words, any promise has exactly zero or one cancelers which cannot be changed after creation.

* Canceled promises treated as rejected,
with a special cancelation-related error object as its reason.

### Terminology

**Cancelable promise**: a promise created by passing a canceler to the `Promise` constructor as the second parameter. Also sometimes called "underlying promise".

**Executor**: the function taking `resolve` and `reject` passed to the `Promise` constructor as the first parameter (as at present).

**Canceler**: a promise used to cancel an underlying promise, by passing it to the `Promise` constructor as the second parameter.

**Canceled**: a flavor of rejected state, with the `reason` being a special kind of error object.

**Cancel**: the action of putting a promise into the "canceled" state, by virtue of its canceler having resolved.

**`onCancel` handler**: a function returned by the executor,
to handle pre-cancellation cleanup,
which is called when the promise is canceled.

### Some spec details relating to `onCancel` handler

* If an `onCancel` handler is provided (by returning it from the executor),
when the promise is canceled the rejection reason is the canceled promise error object whose reason ("message") is the value returned from the handler.

* Long-running `onCancel` handlers may return a promise.
The resolved value of that promise is used as the rejection reason for the underlying promise.
If the promise returned by `onCancel` never resolves, or rejects, then the cancellation does not take place.
This provides a way for `onCancel` handlers to "refuse` cancellation.

## Running the tests

```
npm test
```

## Implementation notes

This requires node >= 6.0.0.

This POC overwrites the built-in `Promise` object at the moment that `cancelable-promise.js` is `require`'d.

## Installation

To use cancelable promises in your own project:

```
npm install --save @rtm/cancelable-promise

require('@rtm/cancelable-promise');
new Promise((resolve, reject) => ..., canceler).then(...).catch(...);
```

## Notes

### This proposal vs. other proposals for cancelable promises

We won't try here to do a complete comparison of this proposal vs. others.
Suffice it to say that our major design goal was to minimize the footprint of the new features.
This proposal involves:

* one signature change (to the `Promise` constructor for specifying the canceler)

* one new type (the special error type for canceled promise reasons)

* one new notion (returning an `onCancel` handler from the executor)

* one new method (`precancel`)

* no new promise states (unless one counts the rejected state of cancel-flavored reason as a new state)

See https://github.com/bergus/promise-cancellation for another excellent proposal which stimulated my thinking on this one.

### Making promisified interfaces cancelable

Consider the following promisification of a database request:

```
function dbQuery(query) {
  return new Promise((resolve, reject) => {
    const request = DB.query(query);
    request.on('success', resolve);
    request.on('error', reject);
  });
}
```

Assuming the underlying interface supports some kind of `abort` functionality,
this can be made cancelable as follows:

```
function dbQuery(query, CANCELER) {                    // Add a canceler parameter to the interface.
  return new Promise((resolve, reject) => {
    const request = DB.query(query);
    request.on('success', resolve);
    request.on('error', reject);

    return () => Promise.resolve(request.abort());    // Return the `onCancel` handler to clean up.
  },
    CANCELER                                          // Pass the canceler to the Promise consstructor.
  );
}
```

### Canceling fetch

A version of `whatwg-fetch` adapted to cancelable promises,
using the kind of approach above,
can be found [here](https://github.com/rtm/fetch).
It is called as `fetch(url, {canceler})`.
A patch to `node-fetch` should be equally straightforward.
