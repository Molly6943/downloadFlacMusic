var http = require('http')
var server

server = http.createServer(handleRequest)
server.listen(8080)

const handleRequest = (request, response) => {
  if(request.method === 'GET') {
    if(request.url === '/') {
      response.writeHead(200, {'Content-Type': 'text/plain'});
      response.write("hello node.js");
      response.end();
    }
  } else if (request.method === 'POST') {
    if(request.url === '/node') {
      response.writeHead(200, {'Content-Type': 'text/plain'});
      response.write("hello node.js");
      response.end();
    }
  }
}