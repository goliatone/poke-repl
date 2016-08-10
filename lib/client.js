#!/usr/bin/env node
/*jshint esversion:6, node:true*/
'use strict';

const assert = require('assert-is');
const Socket = require('net').Socket;
const encrypt = require('../lib/utils').encrypt;
const Commands = require('../lib/utils').COMMANDS;
const parseCommand = require('../lib/utils').parseCommand;
const debug = require('debug')('poke-repl client');

var PSIGNALS = ['exit', 'error', 'unhandledException', 'SIGINT'];

var ERRORS = {
    SERVER_ERROR: 'poke-repl server error.',
    MISSING_CONFIG: 'poke-repl expects a "config" argument.',
    MISSING_HOST: 'poke-repl expects a "host" argument.',
    MISSING_PORT: 'poke-repl expets a "port" argument.',
    MISSING_PASS: 'poke-repl auth expects a "pass" argument.',
    MISSING_USER: 'poke-repl auth expects a "user" argument.'
}

module.exports = function $client(config){

    assert.isObject(config, ERRORS.MISSING_CONFIG);
    assert.isString(config.host, ERRORS.MISSING_HOST);
    assert.isDefined(config.port, ERRORS.MISSING_PORT);

    console.log('- Connecting to %s %s', config.host, config.port);

    var socket = new Socket();
    socket.on('close', closeConnection.bind(null, 'socket:close'));
    socket.on('error', closeConnection.bind(null, 'socket:error'));

    socket.on('data', handshakeHanlder);

    PSIGNALS.map((signal) =>{
        process.on(signal, closeConnection.bind(null, signal));
    });

    socket.connect(parseInt(config.port), config.host);

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
