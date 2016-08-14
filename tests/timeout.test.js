// tests/timeout.test.js
//
// Simple test for canceling a promise which would resolve in two seconds
// after one second instead.

const {CancelablePromise} = require('..');
const {timeout, timeoutPromise, timeoutExecutor} = require('./utils');
const test = require('tape');

test("Cancel a promise before it even fulfills", function(t) {

  t.plan(1);

  timeoutPromise(timeoutExecutor(200, "elapsed"), 100)
    .onCancel(x => t.equal(x, "cancelled"));

});
