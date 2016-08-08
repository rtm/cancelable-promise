// tests/chain.test.js
//
// Try cancelling the middle promise of a chain.

require('..');
const {timeout} = require('./timeout');
const test = require('tape');

test("Cancel a chain in the middle", function(t) {

  t.plan(2);

  // Fire the canceler after two seconds (if it itself is not canceled first).
  const canceler = new Promise(timeout(150, "canceled"));

  const p1 = () => new Promise(timeout(100, "p1"), canceler);
  const p2 = () => new Promise(timeout(100, "p2"), canceler);
  const p3 = () => new Promise(timeout(100, "p3"), canceler);

  p1()
    .then(() => t.pass("p1 completed"))
    .then(p2)
    .then(() => t.fail("p2 completed"))
    .then(p3)
    .then(() => t.fail("p3 completed"))
    .catch(error => t.equal(error.message, "canceled"));

});
