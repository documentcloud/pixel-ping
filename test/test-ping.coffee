{parse}     = require 'url'
http        = require 'http'
querystring = require 'querystring'
{spawn}     = require 'child_process'

server = http.createServer (req, res) ->
  params = parse req.url, true
  if params.pathname is '/endpoint'
    res.end()
    req.on 'data', (chunk) ->
      data = querystring.parse chunk.toString()
      hits = JSON.parse data.json
      if hits.one is 1 and hits.two is 2 and hits.three is 3
        puts 'Test Succeeded'
      else
        puts 'Test Failed ' + inspect hits
      ping.kill 'SIGINT'
      process.exit 0

server.listen 6999, 'localhost'

ping = spawn 'node', ['bin/pixel-ping', 'test/config.json']

delay = (time, func) -> setTimeout func, time

delay 500, ->
  client = http.createClient 5999, 'localhost'
  counter = 6

  for key, i in ['zero', 'one', 'two', 'three']
    for time in [0...i]
      req = client.request 'GET', '/pixel.gif?key=' + key
      req.end()
      req.on 'response', (resp) ->
        resp.on 'end', ->
          counter -= 1
          ping.kill 'SIGUSR1' if counter is 0

