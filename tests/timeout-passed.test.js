// tests/timeout-passed.test.ts
//
// Try to cancel a promise when it's too late.

const {CancelablePromise} = require('..');
const {timeout, timeoutExecutor} = require('./utils');
const test = require('tape');

test("Cancel a promise too late", function(t) {

  t.plan(1);

  new CancelablePromise(timeoutExecutor(100, "elapsed"), timeout(200, "cancelled"))
    .then(value => t.equal(value, "elapsed", "promise should fulfill"));

});
