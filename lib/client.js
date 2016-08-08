#!/usr/bin/env node
/*jshint esversion:6, node:true*/
'use strict';

var Socket = require('net').Socket;
var encrypt = require('../lib/utils').encrypt;
var Commands = require('../lib/utils').COMMANDS;
var parseCommand = require('../lib/utils').parseCommand;
////////////////////////
///
////////////////////////

module.exports = function(config){
    console.log('Connecting to %s %s', config.host, config.port);

    var socket = new Socket();
    socket.on('close', closeConnection.bind(null, 'socket:close'));
    socket.on('error', closeConnection.bind(null, 'socket:error'));

    socket.connect(parseInt(config.port), config.host);

    socket.on('data', handshakeHanlder);

    function handshakeHanlder(data){
        var payload = parseCommand(data);
        switch(payload.cmd){
            case Commands.AUTHORIZE:
                var seed = payload.getSeed();
                var payload = encrypt(config.user + ' ' + config.pass, seed);
                socket.write(payload);
            break;
            case Commands.EXIT:
                var verbose = true;
                var label = payload.getErrorMessage(verbose);
                closeConnection(label);
            break;
            case Commands.CONNECT:
                socket.removeListener('data', handshakeHanlder);
                handleConnection(socket);
            break;
            default:
                console.log('--------------');
                console.log('Command not recognized');
                console.log('CMD: %s.', payload.cmd);
                console.log('Original payload: %s', data.toString());
                console.log('--------------');
            break;
        }
    };

    var signals = ['exit', 'error', 'unhandledException', 'SIGINT'];
    signals.map((signal) =>{
        process.on(signal, closeConnection.bind(null, signal));
    });

    function handleConnection(socket){
        if(handleConnection.piping) return;
        handleConnection.piping = true;

        process.stdin.setRawMode(true);

        process.stdin.pipe(socket);
        socket.pipe(process.stdout);

        process.stdin.on('end', () => socket.destroy());

        process.stdin.on('data', (b) =>{
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
            if(e.message) console.error(e.message);
            if(e.stack) console.error(e.stack);
        }

        try {
            process.stdin.setRawMode(false);
        } catch(e){console.log('ERROR', e.message);}

        socket.removeListener('close', closeConnection);
        socket.destroy();
        process.exit();
    }
};
