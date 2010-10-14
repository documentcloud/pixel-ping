(function() {
  var VERSION, config, configPath, emptyHeaders, endHeaders, endParams, endpoint, flush, fs, http, js, jsHeaders, jsPath, log, pixel, pixelHeaders, querystring, record, serialize, server, store, url;
  var __hasProp = Object.prototype.hasOwnProperty;
  fs = require('fs');
  url = require('url');
  http = require('http');
  querystring = require('querystring');
  VERSION = '0.1.2';
  store = {};
  record = function(params) {
    var key;
    if (!(key = params.query == null ? undefined : params.query.key)) {
      return null;
    }
    store[key] || (store[key] = 0);
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
    var _ref, _result, hits, key;
    _result = []; _ref = hash;
    for (key in _ref) {
      if (!__hasProp.call(_ref, key)) continue;
      hits = _ref[key];
      _result.push(console.info("" + (hits) + ":\t" + (key)));
    }
    return _result;
  };
  server = http.createServer(function(req, res) {
    var params;
    params = url.parse(req.url, true);
    if (params.pathname === '/pixel.gif') {
      res.writeHead(200, pixelHeaders);
      res.end(pixel);
      record(params);
    } else if (params.pathname === '/pixel.js') {
      res.writeHead(200, jsHeaders);
      res.end(js);
    } else {
      res.writeHead(404, emptyHeaders);
      res.end('');
    }
    return null;
  });
  configPath = process.argv[2];
  if (('-v' === configPath || '-version' === configPath || '--version' === configPath)) {
    console.log("Pixel Ping version " + (VERSION));
    process.exit(0);
  }
  if (!configPath || (('-h' === configPath || '-help' === configPath || '--help' === configPath))) {
    console.error("Usage: pixel-ping path/to/config.json");
    process.exit(0);
  }
  config = JSON.parse(fs.readFileSync(configPath).toString());
  pixel = fs.readFileSync(__dirname + '/pixel.gif');
  jsPath = url.format({
    host: config.host,
    protocol: 'http:'
  });
  js = fs.readFileSync(__dirname + '/pixel.js', 'utf8').replace("<%= root %>", jsPath);
  pixelHeaders = {
    'Cache-Control': 'private, no-cache, proxy-revalidate',
    'Content-Type': 'image/gif',
    'Content-Disposition': 'inline',
    'Content-Length': pixel.length
  };
  jsHeaders = {
    'Content-Type': 'text/javascript',
    'Content-Length': Buffer.byteLength(js, 'utf8')
  };
  emptyHeaders = {
    'Content-Type': 'text/html',
    'Content-Length': '0'
  };
  if (config.endpoint) {
    console.info("Flushing hits to " + (config.endpoint));
    endParams = url.parse(config.endpoint);
    endpoint = http.createClient(endParams.port || 80, endParams.hostname);
    endHeaders = {
      'host': endParams.host,
      'Content-Type': 'application/x-www-form-urlencoded'
    };
  } else {
    console.warn("No endpoint set. Hits won't be flushed, add \"endpoint\" to " + (configPath) + ".");
  }
  process.on('SIGUSR1', function() {
    console.log('Got SIGUSR1. Forcing a flush:');
    return flush();
  });
  process.on('uncaughtException', function(err) {
    return console.error("Uncaught Exception: " + (err));
  });
  server.listen(config.port, config.host);
  setInterval(flush, config.interval * 1000);
}).call(this);
