// tests/promise-cancel.test.js
//
// Test immediately-canceled promises.

const {CancelablePromise} = require('..');
const test = require('tape');

test("Create a canceled promise", function(t) {

  t.plan(1);

  CancelablePromise.cancel("cancelled")
    .onCancel(x => t.equal(x, "cancelled"));

});

test("Call onCancel twice", function(t) {

  t.plan(2);

  CancelablePromise.cancel("cancelled")
    .onCancel(x => t.equal(x, "cancelled"))
    .onCancel(x => t.equal(x, "cancelled"));

});

test("cancelThen works", function(t) {

  t.plan(1);

  CancelablePromise.cancel("cancelled")
    .cancelThen(x => t.equal(x, "cancelled"));

});
