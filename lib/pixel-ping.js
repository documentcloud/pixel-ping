(function() {
  var VERSION, config, configPath, emptyHeaders, endHeaders, endParams, endpoint, flush, fs, http, log, pixel, pixelHeaders, querystring, record, reset, serialize, server, store, url;

  fs = require('fs');

  url = require('url');

  http = require('http');

  querystring = require('querystring');

  VERSION = '0.1.2';

  store = {};

  record = function(params) {
    var key, _ref;
    if (!(key = (_ref = params.query) != null ? _ref.key : void 0)) return;
    store[key] || (store[key] = 0);
    return store[key] += 1;
  };

  serialize = function() {
    var data;
    data = {
      json: JSON.stringify(store)
    };
    if (config.secret) data.secret = config.secret;
    return querystring.stringify(data);
  };

  reset = function() {
    return store = {};
  };

  flush = function() {
    var data, request;
    log(store);
    if (!config.endpoint) return;
    data = serialize();
    endHeaders['Content-Length'] = data.length;
    request = endpoint.request('POST', endParams.pathname, endHeaders);
    request.write(data);
    request.on('response', function(response) {
      reset();
      return console.info('--- flushed ---');
    });
    return request.end();
  };

  log = function(hash) {
    var hits, key, _results;
    _results = [];
    for (key in hash) {
      hits = hash[key];
      _results.push(console.info("" + hits + ":\t" + key));
    }
    return _results;
  };

  server = http.createServer(function(req, res) {
    var params;
    params = url.parse(req.url, true);
    if (params.pathname === '/pixel.gif') {
      res.writeHead(200, pixelHeaders);
      res.end(pixel);
      record(params);
    } else {
      res.writeHead(404, emptyHeaders);
      res.end('');
    }
    return null;
  });

  configPath = process.argv[2];

  if (configPath === '-v' || configPath === '-version' || configPath === '--version') {
    console.log("Pixel Ping version " + VERSION);
    process.exit(0);
  }

  if (!configPath || (configPath === '-h' || configPath === '-help' || configPath === '--help')) {
    console.error("Usage: pixel-ping path/to/config.json");
    process.exit(0);
  }

  config = JSON.parse(fs.readFileSync(configPath).toString());

  pixel = fs.readFileSync(__dirname + '/pixel.gif');

  pixelHeaders = {
    'Cache-Control': 'private, no-cache, proxy-revalidate',
    'Content-Type': 'image/gif',
    'Content-Disposition': 'inline',
    'Content-Length': pixel.length
  };

  emptyHeaders = {
    'Content-Type': 'text/html',
    'Content-Length': '0'
  };

  if (config.endpoint) {
    console.info("Flushing hits to " + config.endpoint);
    endParams = url.parse(config.endpoint);
    endpoint = http.createClient(endParams.port || 80, endParams.hostname);
    endpoint.on('error', function(e) {
      if (config.discard) reset();
      return console.log("--- cannot connect to endpoint : " + e.message);
    });
    endHeaders = {
      'host': endParams.host,
      'Content-Type': 'application/x-www-form-urlencoded'
    };
  } else {
    console.warn("No endpoint set. Hits won't be flushed, add \"endpoint\" to " + configPath + ".");
  }

  process.on('SIGUSR1', function() {
    console.log('Got SIGUSR1. Forcing a flush:');
    return flush();
  });

  process.on('uncaughtException', function(err) {
    return console.error("Uncaught Exception: " + err);
  });

  server.listen(config.port, config.host);

  setInterval(flush, config.interval * 1000);

}).call(this);
