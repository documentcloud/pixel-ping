(function(){
  var Buffer, _a, config, configPath, emptyHeaders, endHeaders, endParams, endpoint, flush, fs, http, log, pixel, pixelHeaders, querystring, record, serialize, server, store, url;
  var __hasProp = Object.prototype.hasOwnProperty;
  fs = require('fs');
  url = require('url');
  http = require('http');
  _a = require('buffer');
  Buffer = _a.Buffer;
  querystring = require('querystring');
  store = {};
  record = function(params) {
    var key;
    if (!(key = params.query == undefined ? undefined : params.query.key)) {
      return null;
    }
    store[key] = store[key] || 0;
    return store[key] += 1;
  };
  serialize = function() {
    var data;
    data = {
      json: JSON.stringify(store)
    };
    store = {};
    if (config.secret) {
      data.secret = config.secret;
    }
    return querystring.stringify(data);
  };
  flush = function() {
    var data, request;
    log(store);
    if (!(config.endpoint)) {
      return null;
    }
    data = serialize();
    endHeaders['Content-Length'] = data.length;
    request = endpoint.request('POST', endParams.pathname, endHeaders);
    request.write(data);
    request.end();
    return request.on('response', function(response) {
      return console.info('--- flushed ---');
    });
  };
  log = function(hash) {
    var _b, _c, hits, key;
    _b = []; _c = hash;
    for (key in _c) { if (__hasProp.call(_c, key)) {
      hits = _c[key];
      _b.push(console.info("" + key + ":\t" + hits));
    }}
    return _b;
  };
  server = http.createServer(function(req, res) {
    var params;
    params = url.parse(req.url, true);
    if (params.pathname === '/pixel.gif') {
      res.writeHead(200, pixelHeaders);
      res.end(pixel);
    } else {
      res.writeHead(404, emptyHeaders);
      res.end('');
    }
    return record(params);
  });
  configPath = process.argv[2] || (__dirname + '/../config.json');
  config = JSON.parse(fs.readFileSync(configPath).toString());
  pixelHeaders = {
    'Content-Type': 'image/gif',
    'Content-Disposition': 'inline',
    'Content-Length': '43'
  };
  emptyHeaders = {
    'Content-Type': 'text/html',
    'Content-Length': '0'
  };
  pixel = fs.readFileSync(__dirname + '/pixel.gif');
  if (config.endpoint) {
    console.info("Flushing hits to " + config.endpoint);
    endParams = url.parse(config.endpoint);
    endpoint = http.createClient(endParams.port || 80, endParams.hostname);
    endHeaders = {
      host: endParams.host,
      'Content-Type': 'application/x-www-form-urlencoded'
    };
  }
  process.on('uncaughtException', function(err) {
    return console.error(("Uncaught Exception: " + (err)));
  });
  server.listen(config.port, config.host);
  setInterval(flush, config.interval * 1000);
})();
