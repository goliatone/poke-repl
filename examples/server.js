/*jshint esversion:6, node:true*/
'use strict';

var REPL = require('../lib/repl');

var config = {
    root: __dirname,
    metadata: {
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
};

REPL.createServer(config).listen();
