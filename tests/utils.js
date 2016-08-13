// tests/utils.js
//
// Utilities for creating timeout-based promises.

function timeoutPromise(executor, ms) { return new Promise(executor, timeout(ms, "cancelled")); }
function timeout(ms, value)           { return new Promise(timeoutExecutor(ms, value)); }
function timeoutExecutor(ms, value)   { return resolve => setTimeout(resolve, ms, value); }

module.exports = {timeoutPromise, timeout, timeoutExecutor};
