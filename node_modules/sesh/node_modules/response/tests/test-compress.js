var response = require('../')
  , http = require('http')
  , request = require('request')
  , fs = require('fs')
  , path = require('path')
  , tape = require('tape')
  , zlib = require('zlib')
  ;

function f (name) {
  return fs.createReadStream(path.join(__dirname, name))
}
function fr (name) {
  return fs.readFileSync(path.join(__dirname, name)).toString()
}
function ungz (body, cb) {
  zlib.gunzip(body, function (e, d) {
    if (e) return cb(e)
    cb(e, d.toString())
  })
}
function infl (body, cb) {
  zlib.inflate(body, function (e, d) {
    if (e) return cb(e)
    cb(e, d.toString())
  })
}

var server = http.createServer(function (req, res) {
  var r
  if (req.url === '/testfile') {
    r = response({compress:req})
    return f('test-files.js').pipe(r).pipe(res)
  } else if (req.url === '/testgzip') {
    r = response({compress:'gzip'})
    return f('test-files.js').pipe(r).pipe(res)
  } else if (req.url === '/testdeflate') {
    r = response({compress:'deflate'})
    return f('test-files.js').pipe(r).pipe(res)
  } else if (req.url === '/testhtml') {
    return response.html('<html>blah</html>', {compress:req}).pipe(res)
  } else if (req.url === '/testjson') {
    return response.json({test:'asdf'}, {compress:req}).pipe(res)
  } else if (req.url === '/testview') {
    function view (e, data, cb) {
      if (e) {
        this.statusCode = 555
        return cb(e)
      }
      cb(null, '<html>' + data + '</html>')
    }
    var r = response(view, {compress:req})
    r.pipe(res)
    return r.html('test')
  }
})


var gzipopts = {headers:{'accept-encoding':'gzip'}, encoding:null}
  , deflateopts = {headers:{'accept-encoding':'deflate'}, encoding:null}
  ;

server.listen(8085, function () {
  tape.test('js file gzip', function (t) {
    t.plan(4)
    var r = request('http://localhost:8085/testfile', gzipopts, function (e, resp, body) {
      if (e) return t.error(e)
      t.equal(resp.statusCode, 200)
      t.equal(resp.headers['content-type'], 'application/javascript')
      t.equal(resp.headers['content-encoding'], 'gzip')

      ungz(body, function (e, str) {
        if (e) return t.error(e)
        t.equal(str, fr('test-files.js'))
      })
    })
  })

  tape.test('js file inflate', function (t) {
    t.plan(4)
    request('http://localhost:8085/testfile', deflateopts, function (e, resp, body) {
      if (e) return t.error(e)
      t.equal(resp.statusCode, 200)
      t.equal(resp.headers['content-type'], 'application/javascript')
      t.equal(resp.headers['content-encoding'], 'deflate')
      infl(body, function (e, str) {
        if (e) return t.error(e)
        t.equal(str, fr('test-files.js'))
      })
    })
  })

  tape.test('js file dont', function (t) {
    t.plan(4)
    request('http://localhost:8085/testfile', function (e, resp, body) {
      if (e) return t.error(e)
      t.equal(resp.statusCode, 200)
      t.equal(resp.headers['content-type'], 'application/javascript')
      t.equal(resp.headers['content-encoding'], undefined)
      t.equal(body, fr('test-files.js'))
    })
  })

  tape.test('js file explicit gzip', function (t) {
    t.plan(4)
    request('http://localhost:8085/testgzip', {encoding:null}, function (e, resp, body) {
      if (e) return t.error(e)
      t.equal(resp.statusCode, 200)
      t.equal(resp.headers['content-type'], 'application/javascript')
      t.equal(resp.headers['content-encoding'], 'gzip')
      ungz(body, function (e, str) {
        if (e) return t.error(e)
        t.equal(str, fr('test-files.js'))
      })
    })
  })

  tape.test('js file explicit deflate', function (t) {
    t.plan(4)
    request('http://localhost:8085/testdeflate', {encoding:null}, function (e, resp, body) {
      if (e) return t.error(e)
      t.equal(resp.statusCode, 200)
      t.equal(resp.headers['content-type'], 'application/javascript')
      t.equal(resp.headers['content-encoding'], 'deflate')
      infl(body, function (e, str) {
        if (e) return t.error(e)
        t.equal(str, fr('test-files.js'))
      })
    })
  })

  tape.test('html string', function (t) {
    t.plan(4)
    request('http://localhost:8085/testhtml', gzipopts, function (e, resp, body) {
      if (e) return t.error(e)
      t.equal(resp.statusCode, 200)
      t.equal(resp.headers['content-type'], 'text/html')
      t.equal(resp.headers['content-encoding'], 'gzip')
      ungz(body, function (e, str) {
        if (e) return t.error(e)
        t.equal(str, '<html>blah</html>')
      })
    })
  })

  tape.test('json', function (t) {
    t.plan(4)
    request('http://localhost:8085/testjson', gzipopts, function (e, resp, body) {
      if (e) return t.error(e)
      t.equal(resp.statusCode, 200)
      t.equal(resp.headers['content-type'], 'application/json')
      t.equal(resp.headers['content-encoding'], 'gzip')
      ungz(body, function (e, str) {
        if (e) return t.error(e)
        t.equal(str, '{"test":"asdf"}')
      })
    })
  })

  tape.test('view', function (t) {
    t.plan(4)
    request('http://localhost:8085/testview', gzipopts, function (e, resp, body) {
      if (e) return t.error(e)
      t.equal(resp.statusCode, 200)
      t.equal(resp.headers['content-type'], 'text/html')
      t.equal(resp.headers['content-encoding'], 'gzip')
      ungz(body, function (e, str) {
        if (e) return t.error(e)
        t.equal(str, '<html>test</html>')
      })
    })
  })

  tape.test('cleanup', function (t) { t.end(); server.close() })
})
