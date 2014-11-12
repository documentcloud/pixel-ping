
# accept-encoding

  Simple plugin for checking a request's Accept-Encoding

## API

### `accepts(req, encoding)`

  Check if `req` accepts the given `encoding`

### `accepts(encodings, encoding)`

  Check if `encoding` is one of `encodings`

### `accepts.encodings(req)`

  Get the accepted encodings from `req`

## Example

```js

var http = require('http');
var accepts = require('accept-encoding');

http.createServer(function (req, res) {
  if (accepts(req, 'gzip')) {
    // gzip the response...
  } else if (accepts(req, 'deflate')) {
    // deflate...
  } else {
    // no compression...
  }
}).listen(3000);
```


## License 

(The MIT License)

Copyright (c) 2013 Stephen Mathieson &lt;me@stephenmathieson.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.