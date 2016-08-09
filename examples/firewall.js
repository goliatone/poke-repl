var REPL = require('../lib/repl');
var pkg = require('../package.json');

var config = {
    root: __dirname,
    metadata:{
        name: 'firewall-demo',
        version: pkg.version,
        environment: 'development'
    },
    context: {
        app:{
            logger:console,
            mute: function(){
                console.log('MUTE');
            },
            unmute: function(){
                console.log('UNMUTE');
            },
            config:{
                name: 'poke-repl'
            }
        }
    },
    firewall:{
        policy: 'ACCEPT',
        rules: [
            {ip:'127.0.0.1', rule: 'ACCEPT'}
        ]
    }
};

var repl = new REPL(config);
repl.start();
