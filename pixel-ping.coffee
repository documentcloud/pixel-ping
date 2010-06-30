# Require core modules.
fs:          require 'fs'
sys:         require 'sys'
url:         require 'url'
http:        require 'http'
{Buffer}:    require 'buffer'
querystring: require 'querystring'


# Load the configuration, tracking pixel, and remote endpoint.
configPath:   process.argv[2] or (__dirname + '/config.json')
config:       JSON.parse fs.readFileSync(configPath).toString()
pixel:        new Buffer(43);
pixelHeaders: {'Content-Type': 'image/gif', 'Content-Disposition': 'inline', 'Content-Length': '43'}
emptyHeaders: {'Content-Type': 'text/html', 'Content-Length': '0'}
pixel.write fs.readFileSync(__dirname + '/pixel.gif', 'binary'), 'binary', 0
if config.endpoint
  sys.puts    "Flushing hits to $config.endpoint"
  endParams:  url.parse config.endpoint
  endpoint:   http.createClient endParams.port || 80, endParams.host
  endHeaders: {host : endParams.host, 'Content-Type': 'application/x-www-form-urlencoded'}


# Set up the in-memory hit store, and the function for recording a hit.
store: {}

record: (params) ->
  return unless loc: params.query?.key
  store[loc]: or 0
  store[loc]: +  1


# Flush the store to the external API, and start a new one.
flush: ->
  log store
  return unless config.endpoint
  data: querystring.stringify {json: JSON.stringify(store)}
  endHeaders['Content-Length']: data.length
  request: endpoint.request 'POST', endParams.pathname, endHeaders
  request.write data
  request.end()
  sys.puts '--- flushed ---'
  store: {}


# Log the contents of the hits to stdout.
log: (hash) ->
  for key, hits of hash
    sys.puts "$key:\t$hits"


# Create the web server.
server: http.createServer (req, res) ->
  params: url.parse req.url, true
  if params.pathname is '/pixel.gif'
    res.writeHead 200, pixelHeaders
    res.end pixel
  else
    res.writeHead 404, emptyHeaders
    res.end ''
  record params

server.listen config.port, config.host


# Don't let exceptions kill the server.
process.addListener 'uncaughtException', (err) ->
  sys.puts "Uncaught Exception: ${err}"


# Start the periodic flush.
setInterval flush, config.interval * 1000
