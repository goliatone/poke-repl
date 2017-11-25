'use strict';

const REPL = require('../lib/repl');
const pkg = require('../package.json');

const config = {
    root: __dirname,
    metadata: {
        name: 'firewall-demo',
        version: pkg.version,
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
    },
    firewall: {
        policy: 'ACCEPT',
        rules: [
            { ip: '127.0.0.1', rule: 'ACCEPT' }
        ]
    }
};

const repl = new REPL(config);
repl.start();
