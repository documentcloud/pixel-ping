(function(){
  var Buffer, _a, config, configPath, emptyHeaders, endHeaders, endParams, endpoint, escapeRegExp, flush, fs, http, js, jsHeaders, jsPath, log, pixel, pixelHeaders, querystring, record, serialize, server, store, template, templateSettings, url;
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
    } else if (params.pathname === '/pixel.js') {
      res.writeHead(200, jsHeaders);
      res.end(js);
    } else {
      res.writeHead(404, emptyHeaders);
      res.end('');
    }
    return record(params);
  });
  escapeRegExp = function(string) {
    return string.replace(/([.*+?^${}()|[\]\/\\])/g, '\\$1');
  };
  templateSettings = {
    start: '<%',
    end: '%>',
    interpolate: /<%=(.+?)%>/g
  };
  template = function(str, data) {
    var c, endMatch, fn;
    c = templateSettings;
    endMatch = new RegExp("'(?=[^" + c.end.substr(0, 1) + "]*" + escapeRegExp(c.end) + ")", "g");
    fn = new Function('obj', 'var p=[],print=function(){p.push.apply(p,arguments);};' + 'with(obj){p.push(\'' + str.replace(/[\r\t\n]/g, " ").replace(endMatch, "\t").split("'").join("\\'").split("\t").join("'").replace(c.interpolate, "',$1,'").split(c.start).join("');").split(c.end).join("p.push('") + "');}return p.join('');");
    if (data) {
      return fn(data);
    } else {
      return fn;
    }
  };
  configPath = process.argv[2] || (__dirname + '/../config.json');
  config = JSON.parse(fs.readFileSync(configPath).toString());
  pixel = fs.readFileSync(__dirname + '/pixel.gif');
  jsPath = url.format({
    hostname: config.host,
    port: config.port,
    path: '/pixel.js',
    protocol: 'http:'
  });
  js = template(fs.readFileSync(__dirname + '/pixel.js', 'utf8'), {
    root: jsPath
  });
  jsHeaders = {
    'Content-Type': 'text/javascript',
    'Content-Length': Buffer.byteLength(js, 'utf8')
  };
  pixelHeaders = {
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
