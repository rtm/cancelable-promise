// tests/timeout.ts
//
// Simple test for canceling a promise which would resolve in two seconds
// after one second instead.

require('..');
const {timeout} = require('./timeout');
const test = require('tape');

test("Cancel a two-second promise after one second", function(t) {

  t.plan(1);

  // Create a canceler promise firing after one second.
  const canceler = new Promise(timeout(100, "canceled"));

  // Create a cancelable promise using the requestor and canceler.
  const promise = new Promise(timeout(200, "elapsed"), canceler);

  promise.catch(reason => t.equal(reason.message, "canceled"));

});
