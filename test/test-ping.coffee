{parse}     = require 'url'
http        = require 'http'
querystring = require 'querystring'
{spawn}     = require 'child_process'

flush_assertions = []
finish_flush = null

server = http.createServer (req, res) ->
  params = parse req.url, true
  if params.path is '/endpoint'
    console.log "endpoint hit"
    req.on 'data', (chunk) ->
      data = querystring.parse chunk.toString()
      hits = JSON.parse data.json
      if flush_assertions.shift() hits
        console.log 'Assertion Succeeded'
      else
        console.log 'Assertion Failed ', hits
        exit(1)
    finish_flush = ->
      console.log "endpoint finished"
      res.end()

exit = (code) ->
  ping.kill 'SIGINT'
  process.exit code

server.listen 6999, 'localhost'

ping = spawn 'node', ['bin/pixel-ping', 'test/config.json']

delay = (time, func) -> setTimeout func, time

send = (key, callback) ->
  console.log "sending " + key
  req = http.get 'http://localhost:5999/pixel.gif?key=' + key, (resp) ->
    callback && callback()
  req.on 'error', (e) ->
    console.log 'ERROR', e

flush_and_assert = (callback) ->
  flush_assertions.push(callback)
  ping.kill 'SIGUSR2'

delay 500, ->
  send 'one'
  send 'two'
  send 'two'

delay 1000, ->
  flush_and_assert (hits) -> hits.one is 1 and hits.two is 2,

delay 1500, ->
  send 'three'

delay 2000, ->
  finish_flush()

delay 2500, ->
  flush_and_assert (hits) -> hits.three is 1

delay 3000, ->
  finish_flush()
  console.log "Successful Test"
  exit 0

