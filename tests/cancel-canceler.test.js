// tests/cancel-canceler.test.js
//
// Set up a promise with a canceler,
// but then cancel the canceler before it fires,
// allowing the underlying promise to run through to completion.

require('..');
const {timeout} = require('./timeout');
const test = require('tape');

test("Cancel a canceler", function(t) {

  t.plan(1);

  // Cancel the canceler after one second.
  const cancelCanceler = new Promise(timeout(100, "canceler canceled"));

  // Fire the canceler after two seconds (if it itself is not canceled first).
  const canceler = new Promise(timeout(200, "canceled"), cancelCanceler);

  // Underlying promise fulfills in three seconds.
  const promise = new Promise(timeout(300, "elapsed"), canceler);

  promise.then(value => t.equal(value, "elapsed"));

});
