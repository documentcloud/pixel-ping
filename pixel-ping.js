// Require core modules.
var fs          = require('fs'),
    sys         = require('sys'),
    url         = require('url'),
    http        = require('http'),
    Buffer      = require('buffer').Buffer,
    querystring = require('querystring');


// Load the configuration, tracking pixel, and remote endpoint.
var config = JSON.parse(fs.readFileSync(__dirname + '/config.json').toString());
var pixel = new Buffer(43);
pixel.write(fs.readFileSync(__dirname + '/pixel.gif', 'binary'), 'binary', 0);
var pixelHeaders = {'Content-Type': 'image/gif', 'Content-Disposition': 'inline', 'Content-Length': '43'};
var emptyHeaders = {'Content-Type': 'text/html', 'Content-Length': '0'};
if (config.endpoint) {
  var endParams   = url.parse(config.endpoint);
  var endpoint    = http.createClient(endParams.port || 80, endParams.host);
  var endHeaders  = {host : endParams.host, 'Content-Type': 'application/x-www-form-urlencoded'};
}


// Set up the in-memory hit store, and the function for recording a hit.
var store = {};
var record = function(params) {
  var loc = params.query && params.query.url;
  if (!loc) return;
  store[loc] = store[loc] || 0;
  store[loc] += 1;
};


// Flush the store to the external API, and start a new one.
var flush = function() {
  sys.puts(sys.inspect(store));
  if (!config.endpoint) return;
  var data = querystring.stringify(store);
  endHeaders['Content-Length'] = data.length;
  var request = endpoint.request('POST', endParams.pathname, endHeaders);
  request.write(data);
  request.end();
  store = {};
};


// Create the web server.
http.createServer(function(req, res) {
  var params = url.parse(req.url, true);
  if (params.pathname == '/pixel.gif') {
    res.writeHead(200, pixelHeaders);
    res.end(pixel);
  } else {
    res.writeHead(404, emptyHeaders);
    res.end('');
  }
  record(params);
}).listen(config.port, config.host);


// Don't let exceptions kill the server.
process.addListener('uncaughtException', function(err) {
  sys.puts("Uncaught Exception: " + err.toString());
});


// Start the periodic flush.
setInterval(flush, config.interval);
