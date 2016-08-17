# Cancelable promises: a lightweight approach

This repository proposes a lightweight mechanism for cancelable promises,
and provides a fully-functional polyfill.

In this proposal, canceled promises are viewed as **remaining in a permanently pending state**.
Cancellations are reported with a new method `onCancel`.

For more information, see the [design notes](./design-notes.md).

## Basic notions

### Promise lifecycle

"Canceled" is a substate of "pending".
Once canceled, promises may no longer be resolved or rejected,
and remain in pending/canceled state forever.
(This makes sense, because they did not run,
and therefore have neither succeeded nor failed.)
Once settled, promises can no longer be canceled.

### Who cancels

Promises are not cancelable from the outside.
Cancellation logic is defined when promises are created,
in the same way that resolve/reject behavior is defined,
by calling the new third `cancel` parameter to the executor.
Often, the cancellation will be driven by a promise provided from outside known as the "canceler".

### Being notified of cancellations

You can be notified of cancellations with the new method `Promise#onCancel`,
passing in a handler which will be invoked immediately if the promise is already canceled,
or when the promise is canceled in the future.

## Basic use cases

### Passing a canceler to the `Promise` constructor

Simply pass a promise as a second parameter to the `Promise` constructor.
This is called the "canceler".
When and if the canceler fulfills, then the promise is canceled.

For instance, let's create a promise which fulfills after five seconds, but cancel it after two seconds:

```
// Define executor for a promise fulfilling after ms time.
function timeout(ms, msg) {
  return resolve => setTimeout(() => resolve(msg), ms);
}

// Create the canceler as a promise fulfilling after two seconds.
const canceler = new Promise(timeout(2000, "canceled"));

// Create the promise resolving after five seconds, specifying the canceler.
new CancelablePromise(timeout(5000, "elapsed"), canceler)
                                                ^^^^^^^^
  .onCancel(detail => console.log(`promise canceled with detail ${detail}`));
```

This yields

> promise canceled with detail canceled

### Defining your own cancellation logic

For cases where providing a canceler to the constructor does not suffice,
you may define your own cancellation behavior inside the "executor",
using the new, third parameter called 'cancel'.
For example, this would facilitate cleaning up.
The following is a made-up example of this:

```
function http(url, userPressedCancel) {
  return new CancelablePromise(function(resolve, reject, cancel) {
                                                         ^^^^^^
    var httpRequest = myHttpService.request(url).then(resolve);
    userPressedCancel.then(() => {
      httpRequest.abort();
      cancel("user requested cancellation")
      ^^^^^^
    });
  });
}

http(myUrl, canceler)
  .onCancel(detail => console.log(`"HTTP request aborted with detail ${detail}`));
  .then(...proceed with processing results...)
```

## Specification

This section gives the complete specification of this proposal for cancelable promises.
There are four items:

### Additional `cancel` parameter to executor

Executors (the functions passed to the `CancelablePromise` constructor`) get a third
parameter, giving them the signature `(resolve, reject, cancel)`.
The new `cancel` parameter is a function which may be invoked from within the executor to cancel the promise,
passing along a cancellation detail.

### Addition `canceler` parameter to `Promise` constructor

A new, optional, second parameter to the `CancelablePromise` constructor,
a promise called the `canceler`, if present,
cancels the underlying promise when and if it resolves.

### New `onCancel` instance method on promises

The new `promise.onCancel(handler)` method is called to notify you when a promise is canceled.
It returns the underlying promise,
so you can continue to chain from it using `.then` or `.catch`.

### New `canceled` instance property on promises

The `canceled` property on cancelable promises is a promise which fulfills when a promise is canceled.

## FAQ

#### If canceled promises remain pending forever, won't that be a memory leak?

No, it won't.

#### How do I tell chained promises that an earlier promise has been canceled?

They don't need to be told. They will never be triggered.

#### If I already know I want to cancel, how do I avoid constructing the promise in the first place?

This is already how it works.
If the `canceler` to the `Promise` constructor has already resolved,
the executor won't be run at all,
and the promise will immediately go into canceled state.

#### How do I use cancelable promises in async functions?

Of course, you can't await something that will never resolve, like a canceled promise.
You'll need to wait for either the promise resolving **or** it being canceled.
One possibility is `Promise.race`.
In the example below, we turn a cancellation into a rejection,
which might be easier to handle downstream:

```
const cancelablePromise = ...;
const result = Promise.race([cancelablePromise, cancelablePromise.canceled.then(() => { throw "rejected"; })]);
```

This uses the `canceled` property available on cancelable promises,
which triggers when the promise is canceled.

## Running tests

```
npm test
```

## Implementation notes

This requires node >= 6.0.0.
The polyfill is written in TypeScript.

## Installation

To use cancelable promises in your own project:

```
npm install --save @rtm/cancelable-promise

const {CancelablePromise} = require('@rtm/cancelable-promise');

// Construct a new promise:
new CancelablePromise((resolve, reject[, cancel]) => {...})

// Cancel a promise via a canceler:
new CancelablePromise((resolve, reject) => {...}, canceler])

// Be alerted when a promise is canceled:
cancelablePromise.onCancel(...).then(...)
```
