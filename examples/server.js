'use strict';


const REPL = require('../lib/repl');

const config = {
    root: __dirname,
    port: 3434,
    metadata: {
        name: 'Test',
        version: '0.0.0',
        environment: 'development'
    },
    context: {
        app: {
            logger: console,
            mute: function () {
                console.log('MUTE');
            },
            unmute: function () {
                console.log('UNMUTE');
            },
            config: {
                name: 'poke-repl'
            }
        }
    }
};

const repl = REPL.createServer(config);

repl.listen();

/**
 * This will update the context by adding a
 * `notify` function to the app object.
 * It will set the client's prompt to dirty
 * to let the user know of the update.
 */
setTimeout(()=>{
    console.log('repl.updateContext');
    repl.updateContext('app.notify', (msg)=> {
        console.log('client notify', msg);
    });
}, 5000);