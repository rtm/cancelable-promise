This repository proposes a lightweight mechanism for promise cancellation,
and provides a fully-functional polyfill.

In this proposal, canceled promises are viewed as **remaining in a permanently pending state**.
But their status can be queried with a new method `onCancel`.

For more information, see the [design notes](.design-notes.md).

## Basic notions

Promises can be canceled, but only if they are still pending.
Once canceled, they remain in pending state forever.
This makes sense, because they did not run,
and therefore have neither succeeded nor failed.
Once cancelled, promises may no longer be resolved or rejected.

Promises are not cancelable from the outside.
Cancelation logic is defined when they are created,
in the same way that resolve/reject behavior is defined,
by calling the new third `cancel` parameter to the executor.
Often, the cancellation will be driven by a promise provided from outside known as the "canceler".

Cancelled promises may be queried by the new method `Promise#onCancel`,
providing a handler which will be invoked immediate if the promise is already cancelled,
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
  .onCancel(reason => console.log(`promise canceled with reason ${reason}`));
```

This yields

> promise canceled with reason canceled

### Defining your own cancellation logic

For cases where providing a canceler to the constructor does not suffice,
you may define your own cancelation behavior inside the "executor",
using the new, third parameter called 'cancel'.
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
  .onCancel(reason => console.log(`"HTTP request aborted for reason ${reason}`));
  .then(...proceed with processing results...)
```

## Specification

This section gives the complete specification of this proposal for canceable promises.
There are three items:

### Additional `cancel` parameter to executors

Executors (the functions passed to the `Promise` constructor`) have the signature
`(resolve, reject, cancel)`.
The `cancel` parameter is a function which may be invoked from within the executor to cancel the promise.

### Addition `canceler` parameter to `Promise` constructor

A new, optional, second parameter to the `Promise` constructor,
a promise called the `canceler`, if present,
cancels the underlying promise when and if it resolves.

### New `onCancel` instance method on promises

You may call `promise.onCancel(handler)` to be notified when a promise is canceled.
In addition, cancelable promises expose a `cancelPromise` property which is a promise for
cancellation having occurred, and a `cancelThen` method which is a shortcut for `cancelPromise.then`.

## FAQ

#### If canceled promises remain pending forever, won't that be a memory leak?

No, it won't.

#### How do I tell chained promises that an earlier promise has been cancelled?

They don't need to be told. They will never be triggered.

#### If I already know I want to cancel, how do I avoid constructing the promise in the first place?

This is already how it works.
If the `canceler` to the `Promise` constructor has already resolved,
the executor won't be run at all,
and the promise will immediately go into canceled state.

#### How do I use cancelable promises in async functions?

Of course, you can't await something that will never resolve, like a canceled promise.
You'll need to wait for either the promise resolving **or** it being cancelled,
which can be done with `Promise.race`.
In the example below, we turn a cancellation into a rejection,
which might be easier to handle downstream:

```
const cancelablePromise = ...;
const result = Promise.race([cancelablePromise, cancelablePromise.cancelThen(() => { throw "rejected"; })]);
```

This uses the `cancelThen` method available on cancelable promises,
which triggers when the promise is cancelled.

## Running tests

```
npm test
```

## Implementation notes

This requires node >= 6.0.0.

## Installation

To use cancelable promises in your own project:

```
npm install --save @rtm/cancelable-promise

const {CancelablePrmoise} = require('@rtm/cancelable-promise');
new CancelablePromise((resolve, reject) => ..., canceler).then(...).catch(...);
```
