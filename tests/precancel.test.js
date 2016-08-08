// tests/precancel.test.js
//
// Test precanceling cancelers.
// This prevents the exeuctor from even running,
// and instead throws the promise into cancelled state immediately.

require('..');
const {timeout} = require('./timeout');
const test = require('tape');

test("Precanceling", function(t) {

  t.plan(1);

  // Create a canceler promise firing after one second.
  const canceler = new Promise(timeout(100, "canceled"));
  canceler.precancel("precanceled");

  // Create a promise using the precanceled canceler.
  const promise = new Promise(timeout(200, "elapsed"), canceler);

  promise.catch(reason => t.equal(reason.message, "precanceled"));

});
