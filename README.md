This repository proposes a lightweight mechanism for promise cancellation,
and provides a fully-functional polyfill.

In this proposal, canceled promises are viewed as **remaining in a permanent pending state**.
But their status can be queried with new methods such as `onCancel`.

For more information, see the [design notes](.design-notes.md).

## Basic notions

Promises can be canceled, which leaves them **forever in the pending state**.
Once cancelled, promises may never be resolved or rejected, and
once resolved or rejected may never be cancelled.

Promises are not canceled from the outside.
They are cancelled from within the executor by calling the new third `cancel` parameter.
Often, the cancellation will be driven by a promise provided from outside known as the "canceler".

Cancelled promises may be queried by the new method `Promise#onCancel`.

## Basic use cases

Simply pass a promise as a second parameter to the `Promise` constructor.
This is called the "canceler".
When and if the canceler fulfills, then the promise is canceled.

For instance, let's create a promise which fulfills after five seconds, but cancel it after two seconds:

```
// Create executor for a promise fulfilling after ms time.
function timeout(ms, msg) {
  return resolve => setTimeout(() => resolve(msg), ms);
}

// Create the canceler as a promise fulfilling after two seconds.
const canceler = new Promise(timeout(2000, "canceled"));

// Create the promise resolving after five seconds, specifying the canceler.
new Promise(timeout(5000, "elapsed"), canceler)
  .onCancel(reason => console.log(`promise canceled with reason ${reason}`));
```

This yields

> promise canceled with reason canceled

## Running tests

```
npm test
```

## Implementation notes

This requires node >= 6.0.0.

This POC overwrites the built-in `Promise` object at the moment of `require('@rtm/cancelable-promise')`.

## Installation

To use cancelable promises in your own project:

```
npm install --save @rtm/cancelable-promise

require('@rtm/cancelable-promise');
new Promise((resolve, reject) => ..., canceler).then(...).catch(...);
```

## Notes

### Making promisified interfaces cancelable

Consider the following promisification of a database request:

```
function dbQuery(query) {
  const request = DB.query(query);

  return new Promise((resolve, reject) => {
    request.on('success', resolve);
    request.on('error', reject);
  });
}
```

Assuming the underlying interface supports some kind of `abort` functionality,
this can be made cancelable as follows:

```
function dbQuery(query, CANCELER) {                    // Add a canceler parameter to the interface.
  const request = DB.query(query);

  return new Promise((resolve, reject) => {
    request.on('success', resolve);
    request.on('error', reject);
  },
    CANCELER                                          // Pass the canceler to the Promise consstructor.
  ).onCancel(() => request.abort());
}
```
