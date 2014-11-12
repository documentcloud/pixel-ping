# session.js - super simple session management for node.js


## Installation

### Installing npm (node package manager)
<pre>
  curl http://npmjs.org/install.sh | sh
</pre>

### Installing session.js
<pre>
  npm install sesh
</pre>

### Example request.session

    {
        "id": "m2ENokSCHY3",
        "data": {
            "history": [
                "/"
            ],
            "user": "Guest"
        },
        "path": "/",
        "persistent": true,
        "lifetime": 604800,
        "expiration": 1291446379596
    }


### Usage

#### Using session.js as a middle-ware

      var http = require('http'), 
          session = require('./lib/core').session;

      // let's create a basic http server!
      http.createServer(function (request, response) {

        // before we process any part of the request, let's use the session middle-ware!
        session(request, response, function(request, response){

          // now we can access request.session

          // after the session middleware has executed, let's finish processing the request
          response.writeHead(200, {'Content-Type': 'text/plain'});
          response.write('request.session: \n' + JSON.stringify(request.session, 2, true));
          response.end();
    
        });

      }).listen(8080);

      /* server started */  
      console.log('> hello world running on port 8080');


#### Magic Monkey Punched Middle-ware Sessions (automatically patches httpServer)

    var http = require('http'),
        session = require('./lib/core').magicSession(); // special magic, now all requests have sessions!

    // let's create a basic http server!
    http.createServer(function (request, response) {

      // now we can access request.session

      // let's finish processing the request
      response.writeHead(200, {'Content-Type': 'text/plain'});
      response.write('request.session: \n' + JSON.stringify(request.session, 2, true));
      response.end();

    }).listen(8080);

    /* server started */  
    console.log('> hello world running on port 8080');

#### Creating a super simple login / logout feature

One of the best things about having a persistent session object per user, is having the ability to create user logins. The actual way you want to implement authentication is up to, but here is a basic pattern to follow. Please, remember this method of authentication is just an example:
    
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

    
Once you have this running you can do the following:

    GET http://localhost:8080/
    Hello, you are the Guest user
    
    GET http://localhost:8080/?name=Marak
    Hello, you are Marak
    
    GET http://localhost:8080/
    Hello, you are Marak
    
    GET http://localhost:8080/logout
    You've been logged out
    
    GET http://localhost:8080 
    Hello, you are the Guest user
    
# Requirements 

     npm install response
     
# Authors

     inimino@inimino.org, Marak Squires

