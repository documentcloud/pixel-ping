var response = require('../')
  , http = require('http')
  , request = require('request')
  , fs = require('fs')
  , path = require('path')
  , tape = require('tape')
  ;

function f (name) {
  return fs.createReadStream(path.join(__dirname, name))
}
function fr (name) {
  return fs.readFileSync(path.join(__dirname, name)).toString()
}

function view (e, data, cb) {
  if (e) {
    this.statusCode = 555
    return cb(e)
  }
  cb(null, '<html>' + data + '</html>')
}

var server = http.createServer(function (req, res) {
  var r = response(view)
  r.pipe(res)
  if (req.url === '/test1') return r.html('test')
  if (req.url === '/test2') return r.error(new Error())
})

server.listen(8083, function () {
  tape.test('basic html view', function (t) {
    t.plan(3)
    request('http://localhost:8083/test1', {json:true}, function (e, resp, body) {
      if (e) return t.error(e)
      t.equal(resp.statusCode, 200)
      t.equal(resp.headers['content-type'], 'text/html')
      t.equal(body, '<html>test</html>')
    })
  })

  // tape.test('basic error view', function (t) {
  //   t.plan(3)
  //   request('http://localhost:8083/test1', {json:true}, function (e, resp, body) {
  //     if (e) return t.error(e)
  //     t.equal(resp.statusCode, 555)
  //     // t.equal(resp.headers['content-type'], 'text/plain') // TODO
  //     t.deepEqual(body, 'Internal Server Error')
  //   })
  // })

  tape.test('cleanup', function (t) { t.end(); server.close() })
})
