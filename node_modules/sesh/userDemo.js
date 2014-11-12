var http = require('http'),
    session = require('./lib/core').magicSession();

// let's create a basic http server!
http.createServer(function (request, response) {

  // please note: this is just an example of how to hook auth into session.js, its not ideal at all

  // super basic logout
  if(request.url === '/logout'){
    request.session.data.user = "Guest";
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.write('You\'ve been logged out');
    response.end();
    return;
  }

  // let's hardcode a username and password variable into the url
  var urlParams = require('url').parse(request.url, true).query || {};

  if(typeof urlParams.name != 'undefined'){
    // if the "name" parameter has been sent, lets log in as that user
    request.session.data.user = urlParams.name;
  }
  
  // request.session.data.user always defaults to "Guest"
  if(request.session.data.user == "Guest"){
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.write('Hello, you are the Guest user');
    response.end();
  }
  else{
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.write('Hello, you are ' + request.session.data.user);
    response.end();
  }


}).listen(8080);

/* server started */  
console.log('> hello world running on port 8080');
