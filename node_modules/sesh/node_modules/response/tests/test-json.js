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

var server = http.createServer(function (req, res) {
  if (req.url === '/test1') return response.json({test:1}).pipe(res)
})

server.listen(8082, function () {
  tape.test('basic json', function (t) {
    t.plan(3)
    request('http://localhost:8082/test1', {json:true}, function (e, resp, body) {
      if (e) return t.error(e)
      t.equal(resp.statusCode, 200)
      t.equal(resp.headers['content-type'], 'application/json')
      t.deepEqual(body, {test:1})
    })
  })

  tape.test('cleanup', function (t) { t.end(); server.close() })
})
