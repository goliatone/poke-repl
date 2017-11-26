'use strict';

const pkg = require('../package.json');
const program = require('commander');
const Client = require('../lib/client');

program
  .version(pkg.version)
  .option('-H, --host <host>', 'Host to connect to. Default localhost', '0.0.0.0')
  .option('-u, --user <user>', 'Username for basic auth', 'guest')
  .option('-P, --pass <pass>', 'Password for basic auth', 'guest')
  .option('-p, --port <port>', 'Port to connect to. Default 54321', 3434);



program.on('--help', function(){
  console.log('  Examples:');
  console.log('');
  console.log('    $ repl --port 3333 --host 0.0.0.0');
  console.log('');
});

program.parse(process.argv);

require('../lib/utils').setTerminalTitle('poke-repl');

new Client(program);
