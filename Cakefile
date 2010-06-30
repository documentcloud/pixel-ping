{print}:        require 'sys'
{spawn, exec}:  require 'child_process'

task 'build', 'Build and watch the CoffeeScript source files', ->
  backend: spawn 'coffee', ['-cw', '-o', 'lib', 'src']
  backend.stdout.addListener 'data', (data) -> print data.toString()