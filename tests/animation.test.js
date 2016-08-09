// tests/animation.test.js
//
// Cancel a recursive chain of promises implementing an animation.

require('..');
const test = require('tape');
const {timeout} = require('./timeout');

function animate(interval, canceler) {
  let n = 0;

  function timeout(ms, value) {
    return function(resolve) {
      const timer = setTimeout(() => resolve(value), ms);

      // `onCancel` handler returns number of iterations completed.
      return () => n;
    };
  }

  return function loop() {
    n++;
    return new Promise(timeout(interval, "interval"), canceler)
      .then(loop);
  }();
}

test("Cancel a chain in the middle", function(t) {

  t.plan(1);

  // Fire the canceler after half a second.
  const canceler = new Promise(timeout(500, "canceled"));

  animate(100, canceler)
    .catch(error => {
      console.log(`animation ran ${error.message} times`);
      t.equal(typeof error.message, "number", "cancel reason should be number of iterations");
    });

});
