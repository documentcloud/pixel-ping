(function() {
  var VERSION, config, configPath, emptyHeaders, endHeaders, endParams, endpoint, flush, fs, http, log, pixel, pixelHeaders, querystring, record, serialize, server, store, url;
  fs = require('fs');
  url = require('url');
  http = require('http');
  querystring = require('querystring');
  VERSION = '0.2.0';
  store = {};
  record = function(params) {
    var key, type, _base, _ref, _ref2;
    if (!(key = (_ref = params.query) != null ? _ref.key : void 0)) {
      return;
    }
    type = (_ref2 = params.query) != null ? _ref2.type : void 0;
    if (type) {
      store[type] || (store[type] = {});
      (_base = store[type])[key] || (_base[key] = 0);
      return store[type][key] += 1;
    } else {
      store[key] || (store[key] = 0);
      return store[key] += 1;
    }
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
    if (!config.endpoint) {
      return;
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
    var hits, key, type, type_hits, _results;
    _results = [];
    for (type in hash) {
      hits = hash[type];
      _results.push((function() {
        var _results;
        if (typeof hits === 'object') {
          console.info("# " + type);
          _results = [];
          for (key in hits) {
            type_hits = hits[key];
            _results.push(console.info("" + type_hits + ":\t" + key));
          }
          return _results;
        } else {
          key = type;
          return console.info("" + hits + ":\t" + key);
        }
      })());
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
