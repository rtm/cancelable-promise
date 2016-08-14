// tests/utils.js
//
// Utilities for creating timeout-based promises.

const {CancelablePromise} = require('..');

function timeoutPromise(executor, ms) { return new CancelablePromise(executor, timeout(ms, "cancelled")); }
function timeout(ms, value)           { return new CancelablePromise(timeoutExecutor(ms, value)); }
function timeoutExecutor(ms, value)   { return resolve => setTimeout(resolve, ms, value); }

module.exports = {timeoutPromise, timeout, timeoutExecutor};
