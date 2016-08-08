### Tests

Available tests:

`timeout.test.js`: Cancel a five-second timer with a two-second canceler.
`timeout-passed.test.js`: Try cancelling after it's too late.
`cancel-canceler.test.js`: Cancel a canceler before it has a chance to cancel.
`reject-canceler.test.js`: Abort a cancellation by rejecting the `onCancel` handler.
`cleanup.test.js`: Simple test of a promise with an `onCancel` (cleanup) handler.
