# Require Node.js core modules.
fs          = require 'fs'
url         = require 'url'
http        = require 'http'
https       = require 'https'
querystring = require 'querystring'

#### The Pixel Ping server

# Keep the version number in sync with `package.json`.
VERSION = '0.1.6'

# Regular expression for HTTPS addresses
httpsPattern = new RegExp('^https://', 'i');

# The in-memory hit `store` is just a hash. We map unique identifiers to the
# number of hits they receive here, and flush the `store` every `interval`
# seconds.
store = {}

# Record hits from the remote pixel.
record = (key, count) ->
  store[key] or= 0
  store[key] += count

# Serializes the current `store` to JSON, and creates a fresh one. Add a
# `secret` token to the request object, if configured.
serialize = ->
  data  = json: JSON.stringify(store)
  data.secret = config.secret if config.secret
  querystring.stringify data

# Reset the `store`.
reset = ->
  oldStore = store
  store = {}
  oldStore

# Merge the given `store` with the current one.
merge = (newStore) ->
  for key, count of newStore
    record key, count
  null

# Flushes the `store` to be saved by an external API. The contents of the store
# are sent to the configured `endpoint` URL via HTTP/HTTPS POST. If no `endpoint` is
# configured, this is a no-op.
flush = ->
  log store
  return unless config.endpoint
  endpointProtocol = if httpsPattern.test(config.endpoint) then https else http
  data = serialize()
  oldStore = reset()
  onError = (message) ->
    merge(oldStore) unless config.discard
    console.error message
  endReqOpts['headers']['Content-Length'] = data.length
  request = endpointProtocol.request endReqOpts, (res) ->
    if 200 <= res.statusCode < 300
      console.info '--- flushed ---'
    else
      onError "--- flush failed with code:" + res.statusCode
  request.on 'error', (e) ->
    onError "--- cannot connect to endpoint : #{e.message}"
  request.write data
  request.end()

# Log the contents of the `store` to **stdout**. Happens on every flush, so that
# there's a record of hits if something goes awry.
log = (hash) ->
  for key, hits of hash
    console.info "#{hits}:\t#{key}"
  null

#### Configuration

# Load the configuration and the contents of the tracking pixel. Handle requests
# for the version number, and usage information.
configPath  = process.argv[2]
if configPath in ['-v', '-version', '--version']
  console.log "Pixel Ping version #{VERSION}"
  process.exit 0
if not configPath or (configPath in ['-h', '-help', '--help'])
  console.error "Usage: pixel-ping path/to/config.json"
  process.exit 0
config      = JSON.parse fs.readFileSync(configPath).toString()
pixel       = fs.readFileSync __dirname + '/pixel.gif'

# HTTP/HTTPS headers for the pixel image.
pixelHeaders =
  'Cache-Control':        'private, no-cache, proxy-revalidate, max-age=0'
  'Content-Type':         'image/gif'
  'Content-Disposition':  'inline'
  'Content-Length':       pixel.length

# HTTP/HTTPS headers for the 404 response.
emptyHeaders =
  'Content-Type':   'text/html'
  'Content-Length': '0'

# If an `endpoint` has been configured, create an HTTP/HTTPS client connected to it,
# and log a warning otherwise.
if config.endpoint
  console.info "Flushing hits to #{config.endpoint}"
  endParams = url.parse config.endpoint
  endReqOpts =
    host: endParams.hostname
    method: 'POST'
    path: endParams.pathname
    headers:
      'host':         endParams.host
      'Content-Type': 'application/x-www-form-urlencoded'
  endReqOpts.port = endParams.port if endParams.port
else
  console.warn "No endpoint set. Hits won't be flushed, add \"endpoint\" to #{configPath}."

# Sending `SIGUSR2` to the Pixel Ping process will force a data flush.
process.on 'SIGUSR2', ->
  console.log 'Got SIGUSR2. Forcing a flush:'
  flush()

# Don't let exceptions kill the server.
process.on 'uncaughtException', (err) ->
  console.error "Uncaught Exception: #{err}"

# When a request comes in, ensure that it's looking
# for `pixel.gif`. If it is, serve the pixel and record a hit.
handleRequest = (req, res) ->
  params = url.parse req.url, true
  if params.pathname is '/pixel.gif'
    res.writeHead 200, pixelHeaders
    res.end pixel
    if key = params.query?.key
      record key, 1
  else
    res.writeHead 404, emptyHeaders
    res.end ''
  null


# Determines the right protocol (HTTP/HTTPS) to be used on the nodejs server
if config.sslkey && config.sslcert && config.sslca
  protocolOptions = {
   key  : fs.readFileSync(config.sslkey),
   cert : fs.readFileSync(config.sslcert),
   ca   : fs.readFileSync(config.sslca),
  };
  server = https.createServer(protocolOptions, handleRequest)
else if config.sslkey && config.sslcert
  protocolOptions = {
   key  : fs.readFileSync(config.sslkey),
   cert : fs.readFileSync(config.sslcert),
  };
  server = https.createServer(protocolOptions, handleRequest)
else
  server = http.createServer(handleRequest)

#### Startup

# Start the server listening for pixel hits, and begin the periodic data flush.
server.listen config.port, config.host
setInterval flush, config.interval * 1000
