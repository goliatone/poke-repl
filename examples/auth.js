var REPL = require('../lib/repl');
var pkg = require('../package.json');
var config = {
    root: __dirname,
    metadata:{
        name: 'auth-demo',
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
    auth: {
        seed: require('../lib/utils').generateSeed(),
        enabled: true,
        users:[{
            username: 'goliatone', password: 'admin'
        }]
    }
};

REPL.createServer(config).listen();
