## Response

The basic idea is to build [request](https://github.com/mikeal/request) for HTTP Responses.

This whole package is still beta.

### files

```javascript
var server = http.createServer(function (req, res) {
  var f = fs.createReadStream('file.js')
  if (req.url === '/test.js') return f.pipe(response()).pipe(res)
})
```

When pipeing files to `response` it will lookup the mime type and set the propert content-type header for whatever file extension you send it.

### html, json, txt

```javascript
var server = http.createServer(function (req, res) {
  if (req.url === '/') return response.html('<html>Hello World</html>').pipe(res)
  if (req.url === '/sitemap.html') {
    var f = fs.createReadStream('sitemap')
    return f.pipe(response.html()).pipe(res)
  }
  if (req.url === '/something.json') return response.json({test:1}).pipe(res)
  if (req.url === '/something.txt') return response.txt('some test').pipe(res)
})
```

### .error(err[, statusCode])

```javascript
r.error(new Error('Uh Oh!')).pipe(res)
```

```javascript
r.error(555).pipe(res)
```

```javascript
r.error(new Error('Uh Oh!'), 501).pipe(res)
```

In addition, errors emitted on the stream piped to `response` will be passed through the same API and are accesssible in `views`.

## gzip and deflate compression

The `compress` and `gzip` keys in an options object are used for compression.

```javascript
var server = http.createServer(function (req, res) {
  var f = fs.createReadStream('file.js')
  if (req.url === '/file.js') return f.pipe(response({compress:req})).pipe(res)
})
```

You can pass an HTTP Request object and the best compression, if any, will be chosen for you. Alternatively you can pass `"gzip"` or `"deflate"` to forcce compression of the response stream.

This compression option is compatible with every other feature in `response` and will work whether you do file streaming, html, json, or even using views. When passing a view, string or buffer to `response` the second argument is used as the options object.

```javascript
var server = http.createServer(function (req, res) {
  if (req.url === '/') return response.html('<html>Nope</html>', {compress:req}).pipe(res)
})
```

## status codes and headers

`response` also has an extended version of node core's HTTP Response API.

All headers setting and checking is done caseless while preserving the original casing when first set. This way you never accidentally send two of the same header but can still support broken clients that check for specific caseing.

#### .statusCode

Set the statusCode property to send the HTTP status code. This is a non-destructive way to send the status code.

```javascript
var r = response()
r.statusCode = 500
r.html('<html>Error</html>')
```

#### .setHeader(key, value[, clobber=true])

Defaults to clobbering (overwritting) existing values but when disabled will concatenate values.

```javascript
r.setHeader('X-Blah', 'somehost.com')
```

#### .setHeader(headers)

Set multiple headers by passing an object.

```javascript
r.setHeader({'x-blah': 'somehost', 'x-blah2': 'anotherhost.com'})
```

#### .getHeader(key)

You can retreive a header by its key, use this method instead of directly accessing the headers object to avoid caseing constraints.

```javascript
r.getHeader('content-type')
```

#### .hasHeader(key)

Check if a header is already set. If one is set the header key will be returned (which is important because it may have different caseing).

```javascript
r.hasHeader('content-type')
```

### views (very experimental)

```javascript
function view (e, data, cb) {
  if (e) return cb(e)
  cb(null, '<html>' + data + '</html>')
}

var server = http.createServer(function (req, res) {
  var r = response(view)
  r.pipe(res)
  if (req.url === '/test1') return r.html('test')
})
```

This is how you would easily support something like a template system. TODO: example.

### Credits

Mad props to @marak who handed over the "response" package in npm that he registered way back in the day.
