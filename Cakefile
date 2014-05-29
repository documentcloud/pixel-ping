fs            = require 'fs'
{print}       = require 'sys'
{spawn, exec} = require 'child_process'

log = (data) ->
  print data.toString()

task 'build', 'Build and watch the CoffeeScript source files', ->
  coffee = spawn 'coffee', ['-b', '-cw', '-o', 'lib', 'src']
  coffee.stdout.on 'data', log

task 'test', 'Test Pixel Ping', ->
  coffee = spawn 'coffee', ['test/test-ping.coffee']
  coffee.stdout.on 'data', log

task 'doc', 'Regenerate Documentation', ->
  docco = spawn 'docco', ['src/pixel-ping.coffee']
  docco.stdout.on 'data', log