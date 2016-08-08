// tests/http.js
//
// Create a quick HTTP server.

const http = require('http');
const PORT=8124;

function handleRequest(request, response) {
  console.log("Received request!");
  response.end();
}

var server = http.createServer(handleRequest);
server.listen(PORT, function() { console.log("Server started on port 8124"); });
