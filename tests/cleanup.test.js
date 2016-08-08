// tests/cleanup.test.js
//
// Timer example with cleanup.

require('..');
const test = require('tape');
const {timeout, timeoutWithCancelHandler} = require('./timeout');

test("cancel promise with cleanup", function(t) {

  t.plan(1);

  debugger;

  const canceler = new Promise(timeout(100, "canceled"));

  // Create a cancelable promise using the requestor and canceling promise.
  const promise = new Promise(timeoutWithCancelHandler(200, "elapsed"), canceler);

  promise.catch(e => t.equal(e.message, "cancelled and cleaned up", "promise should be cancelled and cleaned up"));

});
