var pkg = require('../package.json');
var program = require('commander');
program
    .version(pkg.version)
    .option('-H, --host <host>', 'Host to connect to. Default localhost', '0.0.0.0')
    .option('-u, --user <user>', 'Username for basic auth', 'guest')
    .option('-P, --pass <pass>', 'Password for basic auth', 'guest')
    .option('-p, --port <port>', 'Port to connect to. Default 54321', 3333);

require('../lib/utils').setTerminalTitle('s2-influx-pub');

program.on('--help', function(){
  console.log('  Examples:');
  console.log('');
  console.log('    $ repl --port 3333 --host 0.0.0.0');
  console.log('');
});

program.parse(process.argv);

require('../lib/client')(program);
