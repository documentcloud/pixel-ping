(function(){
  var Buffer, _a, config, configPath, emptyHeaders, endHeaders, endParams, endpoint, flush, fs, http, log, pixel, pixelHeaders, querystring, record, server, store, sys, url;
  var __hasProp = Object.prototype.hasOwnProperty;
  fs = require('fs');
  sys = require('sys');
  url = require('url');
  http = require('http');
  _a = require('buffer');
  Buffer = _a.Buffer;
  querystring = require('querystring');
  configPath = process.argv[2] || (__dirname + '/../config.json');
  config = JSON.parse(fs.readFileSync(configPath).toString());
  pixel = new Buffer(43);
  pixelHeaders = {
    'Content-Type': 'image/gif',
    'Content-Disposition': 'inline',
    'Content-Length': '43'
  };
  emptyHeaders = {
    'Content-Type': 'text/html',
    'Content-Length': '0'
  };
  pixel.write(fs.readFileSync(__dirname + '/pixel.gif', 'binary'), 'binary', 0);
  if (config.endpoint) {
    sys.puts("Flushing hits to " + config.endpoint);
    endParams = url.parse(config.endpoint);
    endpoint = http.createClient(endParams.port || 80, endParams.host);
    endHeaders = {
      host: endParams.host,
      'Content-Type': 'application/x-www-form-urlencoded'
    };
  }
  store = {};
  record = function(params) {
    var loc;
    if (!(loc = params.query == undefined ? undefined : params.query.key)) {
      return null;
    }
    store[loc] = store[loc] || 0;
    return store[loc] += 1;
  };
  flush = function() {
    var data, request;
    log(store);
    if (!(config.endpoint)) {
      return null;
    }
    data = {
      json: JSON.stringify(store)
    };
    if (config.secret) {
      data.secret = config.secret;
    }
    data = querystring.stringify(data);
    endHeaders['Content-Length'] = data.length;
    request = endpoint.request('POST', endParams.pathname, endHeaders);
    request.write(data);
    request.end();
    sys.puts('--- flushed ---');
    store = {};
    return store;
  };
  log = function(hash) {
    var _b, _c, hits, key;
    _b = []; _c = hash;
    for (key in _c) { if (__hasProp.call(_c, key)) {
      hits = _c[key];
      _b.push(sys.puts("" + key + ":\t" + hits));
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
  server.listen(config.port, config.host);
  process.addListener('uncaughtException', function(err) {
    return sys.puts(("Uncaught Exception: " + (err)));
  });
  setInterval(flush, config.interval * 1000);
})();
