// tests/chain.test.js
//
// Try cancelling the middle promise of a chain.

const {CancelablePromise} = require('..');
const {timeoutExecutor} = require('./utils');
const test = require('tape');

test("Cancel a chain in the middle", function(t) {

  t.plan(1);

  // Fire the canceler after two seconds (if it itself is not canceled first).
  const canceler = new Promise(timeoutExecutor(150, "canceled"));

  const p1 = () => new CancelablePromise(timeoutExecutor(100, "p1"), canceler);
  const p2 = () => new CancelablePromise(timeoutExecutor(100, "p2"), canceler);
  const p3 = () => new CancelablePromise(timeoutExecutor(100, "p3"), canceler);

  p1()
    .then(() => t.pass("first promise in chain should fulfill"))
    .then(p2)
    .onCancel(x => t.pass("second promise in chain should cancel"))
    .then(p3)
    .then(() => t.fail("p3 should not be reached"));

});
