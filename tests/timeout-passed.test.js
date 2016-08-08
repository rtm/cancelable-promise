// tests/timeout-passed.test.ts
//
// Try to cancel a promise when it's too late.

require('..');
const {timeout} = require('./timeout');
const test = require('tape');

test("Cancel a promise too late", function(t) {

  t.plan(1);

  // Create a canceler which fires after two seconds.
  const canceler = new Promise(timeout(200, "cancelled"));

  // Create a cancelable promise which resolves after one second.
  const promise = new Promise(timeout(100, "elapsed"), canceler);

  promise.then(value => t.equal(value, "elapsed", "promise should fulfill"));

});
