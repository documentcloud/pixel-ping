fs:             require 'fs'
{print}:        require 'sys'
{spawn, exec}:  require 'child_process'

task 'build', 'Build and watch the CoffeeScript source files', ->
  coffee: spawn 'coffee', ['-cw', '-o', 'lib', 'src']
  coffee.stdout.addListener 'data', (data) -> print data.toString()
