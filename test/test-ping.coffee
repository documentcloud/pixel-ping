{parse}     = require 'url'
http        = require 'http'
querystring = require 'querystring'
{spawn}     = require 'child_process'

server = http.createServer (req, res) ->
  params = parse req.url, true
  if params.pathname is '/endpoint'
    res.end()
    req.on 'data', (chunk) ->
      console.log chunk
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
  counter = 3
  for key, i in ['zero', 'one', 'two']
    for time in [0...i]
      req = http.get 'http://localhost:5999/pixel.gif?key=' + key, (resp) ->
        counter -= 1
        console.log 'received', counter
        if counter is 0
          console.log 'all requests came back, forcing flush..'
          ping.kill 'SIGUSR1' if counter is 0
      req.on 'error', (e) ->
        console.log 'ERROR', e

