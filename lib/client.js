#!/usr/bin/env node
/*jshint esversion:6, node:true*/
'use strict';

const fs = require('fs');
const assert = require('assert-is');
const encrypt = require('../lib/utils').encrypt;
const Commands = require('../lib/utils').COMMANDS;
const parseCommand = require('../lib/utils').parseCommand;
// const debug = require('debug')('poke-repl client');

const PSIGNALS = ['exit', 'error', 'unhandledException', 'SIGINT'];

const ERRORS = {
    SERVER_ERROR: 'poke-repl server error.',
    MISSING_CONFIG: 'poke-repl expects a "config" argument.',
    MISSING_HOST: 'poke-repl expects a "host" argument.',
    MISSING_PORT: 'poke-repl expets a "port" argument.',
    MISSING_PASS: 'poke-repl auth expects a "pass" argument.',
    MISSING_USER: 'poke-repl auth expects a "user" argument.'
};

let TLS_OPTIONS = {
    key: fs.readFileSync('./tls/client/private-key.pem'),
    cert: fs.readFileSync('./tls/client/certificate.pem'),
    ca: [
        fs.readFileSync('./tls/server/certificate.pem')
    ],
    rejectUnauthorized: true,
    /*
     * Depending on the certificates, we might
     * get the following error:
     *
     * > Hostname/IP doesn't match certificate's
     * > altnames: "IP: 0.0.0.0 is not in the cert's list
     */
    checkServerIdentity: function(host, cert) {
        //TODO: Check the issuer...
        console.log('Check server id', host, cert.subject.CN);
        if(host === '0.0.0.0' || host === '127.0.0.1'){
            return undefined;
        }

        return undefined;
    }
};

module.exports = function $client(config){

    assert.isObject(config, ERRORS.MISSING_CONFIG);
    assert.isString(config.host, ERRORS.MISSING_HOST);
    assert.isDefined(config.port, ERRORS.MISSING_PORT);

    console.log('- Connecting to %s %s', config.host, config.port);

    const tcp = config.tls ? require('tls') : require('net');

    let options = config.tls ? TLS_OPTIONS : {};

    let socket = tcp.connect(config.port, config.host, options, ()=>{
        if(config.tls) {
            console.log('Socket is %s', (socket.authorized ? '': 'un') + 'authorized');
        }
    });

    socket.on('close', closeConnection.bind(null, 'socket:close'));
    socket.on('error', closeConnection.bind(null, 'socket:error'));

    socket.on('data', handshakeHanlder);

    PSIGNALS.map((signal) =>{
        process.on(signal, closeConnection.bind(null, signal));
    });

    /**
     * Handles the handshake with the server.
     *
     * It parses all commands, handles auth,
     * and then starts communication.
     *
     * 	@param  {Buffer} data
     */
    function handshakeHanlder(data){

        var command = parseCommand(data);

        switch(command.label){
            /*
             * The connection requires AUTH.
             * We are sent
             *
             */
            case Commands.AUTHORIZE:
                var seed = command.getSeed();

                if(!seed) {
                    return closeConnection(ERRORS.SERVER_ERROR);
                }

                assert.isString(config.user, closeConnection.bind(null, ERRORS.MISSING_USER));
                assert.isString(config.pass, closeConnection.bind(null, ERRORS.MISSING_PASS));

                var command = encrypt(config.user + ' ' + config.pass, seed);
                socket.write(command);
                break;

            case Commands.CONNECT:
                socket.removeListener('data', handshakeHanlder);
                handleConnection(socket);
                break;

            case Commands.EXIT:
                var label = command.getErrorMessage(config.verbose);
                closeConnection(label);
                break;

            default:
                console.log('--------------');
                console.log('Command not recognized');
                console.log('CMD: %s.', command.cmd);
                console.log('Original command: %s', data.toString());
                console.log('--------------');
        }
    };

    function handleConnection(socket){
        if(handleConnection.piping) return;
        handleConnection.piping = true;

        process.stdin.pipe(socket);
        process.stdin.setRawMode(true);

        socket.pipe(process.stdout);

        process.stdin.on('end', () => socket.destroy());

        process.stdin.on('data', (b) => {
            if(b.length === 1 && b[0] === 4){
                process.stdin.setRawMode(false);
                process.stdin.emit('end');
            }
        });
    }

    function closeConnection(label, e){
        console.log('closeConnection', label, e);
        if(closeConnection.called) return;
        closeConnection.called = true;

        console.log('HANDLE EXIT CALL: %s label', label);

        if(e){
            console.log(e);

            if(e.message){
                console.error(e.message);
            }

            if(e.stack){
                console.error(e.stack);
            }
        }

        try {
            process.stdin.setRawMode(false);
        } catch(e){
            console.error('ERROR', e.message);
        }

        socket.removeListener('close', closeConnection);
        socket.destroy();
        process.exit();
    }
};
