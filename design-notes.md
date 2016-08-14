# Cancelable Promises: Design Issues

This document summarizes design issues for cancelable promises,
and motivates the choices made in this design.

Note that cancellation is defined here as

> a one-time action which can be taken on a promise, but only before it settles, and following
which the promise can no longer be resolved or rejected.

We need to consider how canceled promises are represented,
how to cancel promises,
and how canceled promises behave.

## How canceled promises are represented

To represent canceled promises,
intuitively, one tends to think of either
(1) using a particular flavor of rejection or
(2) a new, third, settled state.

### Canceled promises as rejections

The notion of a canceled promise as "rejected" is somewhat logical--
after all, the promised "failed" (to complete)--but is still intellectually dissatisyfing.
Whatever one's concept of rejection,
it seems peculiar to consider a cancelled promise to have "rejected".
Whether we view rejection as a type of error, or exception, or failure,
cancellation would not seem to fall into this category.

A key problem with cancellation-as-rejection is how to distinguish such rejections in an `catch` handler.
For instance, it might be necessary to laboriously check the `reason` to see if it is a special cancellation-related error type.

On the other hand, the advantage of using the rejection state for canceled promises is that there is well established
machinery for dealing with and propagating rejections, such as `Promise#catch`.

### Canceled promises as a third state

One leading school of thought is to represent canceled promises as a third settled state,
in addition to resolved and rejected.

Proponents of this approach insist argue that cancellation is not really an rejected state,
but something different.

In [this proposal](https://github.com/domenic/cancelable-promise),
this notion is expressed as "a canceled operation is not 'successful', but it did not really 'fail' either",
or is "an exception that is not an error", whatever that means.

There is some semantic confusion here in how they describe the rejection state as "failure",
but their overall conclusion that rejection is not a good model for cancellation still holds.

The problem with introducing a third state, however,
is that it has wide ranging effects on the entire promises paradigm,
and greatly broadens the surface area of changes required for cancelability.
For example, `Promise#then` might require a third parameter to handle cancellation.
Since `throw` generates a rejection, we need something new like `throw cancel` to generate a cancellation.
In addition to `Promise#catch`, we might need new prototype methods such as `Promise#catchCancel` or `Promise#else`.
We need new `catch { } else (e)` syntax.
We might new new `await` syntaxes.
In fact, all of the above are part of some current proposals.
The cognitive burden of all these changes is overwhelming for what should be a relatively simple way to cancel promises.
Designers of these kinds of approach vastly overestimate the appetite of the JS community for such complexity.

### Canceled promises as resolved promises

For purposes of completeness, let us mention the option of considering canceled promises as being resolved.
After all, the cancellation did "complete successfully".
Howevr, this approach suffers from the same defect as canceled promises as rejections,
which is that `then` handlers would need to somehow query or distinguish promises that
were cancelled instead of fulfilling "normally".

### Canceled promises as pending

But come to think of it, we already have a status for promises that are not settled one way or another--the pending status.
Cancellation can indeed be thought as implying that the promise will never settle.
In this approach, "canceled" is a kind of sub-state of "pending".
To implement this approach to canceled promises,
we need additional internal slots on promises to record the fact of the cancellation and its context, such as cancellation reason.
We also need some machinery to query or report cancellations.

The proposed machinery is a new `Promise#onCancel` method,
which is called on a canceled promise with the cancellation context.
The name `onCancel` is meant to emphasize that this is a particular specialized kind of event handler.
`onCancel` returns the promise itself so it can be further chained as desired.

We also introduce a static method `Promise.cancel` is made available to create pre-cancelled promises.

In this proposal, we take this approach.

## Requesting cancellation

For requesting cancellation,
one option is to cancel a promise directly,
but this has the drawback that unknown third parties might cancel promises.
The other option is to specify cancellation conditions when the promise is constructed.

We take the latter approach, and specifically add a third `cancel` parameter to the "executor"
(the function passed to the `Promise` constructor)
which can be called within the executor to cancel the promise, as in

```
new Promise((resolve, reject, cancel) => {
  setTimeout(resolve, 200);
  setTimeout(cancel, 100);
});
```

The above code sets up a promise which normally would resolve in 200ms,
but instead is canceled in 100ms.

To create a promise which cancels when some "canceler" promise fulfills, we could write

```
function makeCancelableTimeout(canceler) {
  return new Promise((resolve, reject, cancel) => {
    setTimeout(resolve, 200);
    canceler.then(cancel);
  });
}
```

Due to the ubiquity of this pattern, we also provide the ability to provide
any arbitrary promise as the canceler as
an optional second argument to the `Promise` constructor:

```
new Promise(executor, canceler)
```

The implementation of this feature waits for a tick before running executor,
so it can check if `canceler` resolves immediately and in that case not even run the executor.

## Other notes

### Clean-up

Other proposals have concerned themselves with the question of how to clean up after canceled promises.
Some alternative include having the executor return a clean-up function.
In our proposal, a typical clean-up can occur directly within a cancellation-aware promise:

```
function cancelableLongRunningTask(canceler) {
  return new Promise(resolve, reject, cancel) {
    const someImportantResource = createResource();
    canceler.then(() => {
      someImportantResource.release();
      cancel();
     });
    longRunningTask().then(resolve);
  });
}
```

Another alternative is to allow the caller to do the cleanup,
by passing him necessary context information via the cancel reason,
which he can then query with `onCancel`:

```
function cancelableLongRunningTask(canceler) {
  return new Promise(resolve, reject, cancel) {
    const someImportantResource = createResource();
    canceler.then(() => cancel(someImportantResource));
    longRunningTask().then(resolve);
  });
}

cancellableLongRunningTask(canceler)
  .onCancel(resource => resource.release());
```

### Chaining

Other proposals have concerned themselves with how cancelable prmoises are chained.
This is not an issue with our proposal,
where cancelled promises never resolve,
and so downstream handlers are never called in the first place.

### Tokens

Other proposals have called for magic objects called "tokens",
which manage cancellation and are passed around,
perhaps as parameters to the `Promise` constructor, or as additional parameters to `Promise#then`.
I consider this design approach to be something of an anti-pattern,
where one object over here is passed to some other object over there
and that object somehow looks at it and does the equivalent of an `if` on it to figure out what to do next.

This proposal does not need, and does not use, tokens.
The closest equivalent to the tokens found in other proposals is the `canceler` promise passed as the second parameter to
the `Promise` constructor governing cancellation.

### Synchronous cancellation

It has been pointed out that in some cases cancellation is so urgent that it cannot wait for the clock to tick,
or that the cost of creating the promise is so large it must be avoided if it is known in advance that we are going to want to cancel.
In other proposals, that has given rise to awkward mechanisms trying to somehow bring synchonicity to the world of promises.
In this proposal, and in its POC implementation, the executor is simply given a timer spin before being run
to allow a canceling promise the chance to fulfill and supervent the executor from being run in the first place:
Here is the relevant part of the polyfill:

```
if (canceler) canceler.then(cancel);

Promise.resolve().then(() => {
  if (!canceled) executor(resolve, reject, cancel);
});
```
