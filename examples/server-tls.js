/*jshint esversion:6, node:true*/
'use strict';

var REPL = require('../lib/repl');

const fs = require('fs');

/*
 *
 * Since we control both the client and the server,
 * there is no need to buy certificates from a
 * public CA.
 * The server has its cerfiticate, private key,
 * and a CA cert.
 * This server CA cert is used by the client.
 *
 * The client has its certificate, private key,
 * and the CA cert.
 * This client CA cert is used by the server.
 */
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
    },
    tls: {
        // key: fs.readFileSync('./tls/poke-certs/poke-server.key'),
        // cert: fs.readFileSync('./tls/poke-certs/poke-server.crt'),
        // /*
        //  * Needed since the client uses self-signed certs
        //  * and we care about implicit auth.
        //  */
        // ca: [
        //     fs.readFileSync('./tls/poke-certs/client.poke.io.crt')
        // ],

        key:  fs.readFileSync('./tls/server/private-key.pem'),
        cert: fs.readFileSync('./tls/server/certificate.pem'),
        /*
         * Needed since the client uses self-signed certs
         * and we care about implicit auth.
         */
        ca: [
            fs.readFileSync('./tls/client/certificate.pem')
        ],
        /*
         * Only necesary if we are using the client CA.
         * Without this some clients dont send certificates
         * and some do.
         */
        requestCert: true,
        /*
         * Reject anyone whose certs are not signed
         * by our recognized CAs.
         */
        rejectUnauthorized: true
    }
};

REPL.createServer(config).listen();
