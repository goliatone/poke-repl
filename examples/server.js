var REPL = require('../lib/repl');

var repl = new REPL({
    root: __dirname,
    metadata:{
        name: 'Test',
        version: '0.0.0',
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
    }
});

repl.start();
