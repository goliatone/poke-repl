var REPL = require('../lib/repl');

var config = {
    root: __dirname,

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
