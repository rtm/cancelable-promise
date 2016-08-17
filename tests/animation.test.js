// tests/animation.test.js
//
// Cancel a recursive chain of promises implementing an animation.

const {CancelablePromise} = require('..');
const test = require('tape');
const {timeout} = require('./utils');

// Run a loop until a canceler stops it.
// Return a promise for cancellation at n turns.
function animate(interval, canceler) {
  let n = 0;

  return new Promise((resolve, reject) => {
    (function loop() {
      n++;
      return new CancelablePromise(function(resolve, reject, cancel) {
        canceler.then(() => cancel(n));
        setTimeout(resolve, interval);
      })
        .onCancel(() => resolve(n))
        .then(loop);
    }());
  });
}

test("Cancel a promise-based animation", function(t) {

  t.plan(1);

  // Fire the canceler after half a second, around five iterations.
  const canceler = timeout(500, "canceled");

  animate(100, canceler)
    .then(n => t.pass(`animation canceled after running ${n} times`));

});
