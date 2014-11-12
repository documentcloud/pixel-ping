var stream = require('stream')
  , mime = require('mime')
  , util = require('util')
  , bl = require('bl')
  , caseless = require('caseless')
  , bestencoding = require('best-encoding')
  , zlib = require('zlib')
  ;

// This could eventually be its own module.
function mutations (src, dest) {
  if (src.headers && dest.setHeader) {
    for (var i in src.headers) dest.setHeader(i, src.headers[i])
  }
  if (src.path && (!src.headers || (src.getHeader ? !src.getHeader('content-type') : !src.headers['content-type'])) && dest.setHeader) {
    src.on('error', function (e) {
      dest.statusCode = 404
      dest.setHeader('content-type', 'text/plain')
      dest.write('Not Found')
      dest.end()
    })
    dest.setHeader('content-type', mime.lookup(src.path))
  }
  if (src.statusCode) dest.statusCode = src.statusCode
}

function Response (view, opts) {
  var self = this
  if (typeof view !== 'string' && typeof view !== 'function' && !Buffer.isBuffer(view)) {
    opts = view
    view = null
  }
  self.opts = opts || {}
  if (self.opts.gzip) self.opts.compress = gzip
  self.view = view
  self.buffering = bl()
  self.headers = {}
  self.dests = []
  stream.Transform.call(self)
  self.on('pipe', function (src) {
    mutations(src, self)
    src.on('error', function (e) {
      // TODO: Handle 404 errors
      self.emit('error', e)
    })
  })
  self.on('error', self.error.bind(self))
  if (view) {
    if (typeof view === 'string' || Buffer.isBuffer(view)) {
      process.nextTick(function () {
        self.end(view)
      })
    }
  }
  caseless.httpify(this, this.headers)
  if (self.opts.compress) {
    var encoding
    if (self.opts.compress.headers) {
      encoding = bestencoding(self.opts.compress)
    } else if (typeof self.opts.compress === 'string') {
      encoding = self.opts.compress
    } else {
      encoding = 'gzip'
    }

    if (encoding && encoding !== 'identity') {
      if (encoding !== 'gzip' && encoding !== 'deflate') throw new Error("I don't know this encoding.")
      self.statusCode = 200
      self.setHeader('content-encoding', encoding)
      if (encoding === 'gzip') self.compressor = zlib.createGzip()
      if (encoding === 'deflate') self.compressor = zlib.createDeflate()
      stream.Transform.prototype.pipe.call(this, self.compressor)
    }
  }
}
util.inherits(Response, stream.Transform)

Response.prototype._transform = function (chunk, encoding, cb) {
  if (this._pipe) {
    this._pipe()
    this._pipe = null
  }
  if (typeof this.view === 'function') this.buffering.append(chunk)
  else this.push(chunk)
  cb(null)
}
Response.prototype.pipe = function () {
  this.dests.push(arguments[0])
  if (this.compressor) this.compressor.pipe.apply(this.compressor, arguments)
  else stream.Transform.prototype.pipe.apply(this, arguments)
}
Response.prototype._pipe = function () {
  var self = this
  this.dests.forEach(function (dest) {
    mutations(self, dest)
  })
}
Response.prototype.error = function (e, status) {
  var self = this

  if (!status && typeof e === 'number') {
    self.statusCode = e
    self.end()
    return
  }

  self.statusCode = status || 500
  if (self._erroring) return
  self._erroring = true
  if (typeof self.view === 'function') {
    self.view.call(self, e, null, function (e, data) {
      if (e) return self.end('Internal Server Error')
      self.end(data)
    })
  } else {
    // TODO: Default tracebacks on errors.
  }
}
Response.prototype.end = function (data) {
  var a = arguments
    , self = this
    ;
  if (data) this.write(data)
  if (typeof self.view === 'function') {
    self.view.call(self, null, self.buffering, function (e, data) {
      if (e) self.error(e)
      if (self.compressor) {
        self.compressor.write(data)
      } else {
        self.dests.forEach(function (dest) {
          dest.write(data)
        })
      }
      stream.Transform.prototype.end.apply(self)
    })
  } else {
    stream.Transform.prototype.end.apply(self)
  }
}

function response (view, opts) {
  return new Response(view, opts)
}

Object.keys(mime.types).forEach(function (mimeName) {
  function _response (view, opts) {
    var r = response(view, opts)
    r.setHeader('content-type', mime.types[mimeName])
    return r
  }
  response[mimeName] = _response

  Response.prototype[mimeName] = function (view) {
    var self = this
    self.setHeader('content-type', mime.types[mimeName])
    process.nextTick(function () {
      self.end(view)
    })
    return this
  }
})
response.json = function (view, opts) {
  var r = response(JSON.stringify(view), opts)
  r.setHeader('content-type', mime.types['json'])
  return r
}
response.error = function () {
  var r = response()
  r.error.apply(r, arguments)
  return r
}

// TODO alias express methods
// .status
// .location
// .charset
// .send
// .jsonp

// TODO redirect api
// TODO error, notfound

module.exports = response
