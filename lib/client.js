#!/usr/bin/env node
 // 'use strict';

const extend = require('gextend');
const assert = require('assert-is');
const Socket = require('net').Socket;
const encrypt = require('../lib/utils').encrypt;
const Commands = require('../lib/utils').COMMANDS;
const parseCommand = require('../lib/utils').parseCommand;
// const debug = require('debug')('poke-repl client');

const PSIGNALS = ['exit', 'error', 'SIGINT'];

const ERRORS = {
    SERVER_ERROR: 'poke-repl server error.',
    MISSING_CONFIG: 'poke-repl expects a "config" argument.',
    MISSING_HOST: 'poke-repl expects a "host" argument.',
    MISSING_PORT: 'poke-repl expects a "port" argument.',
    MISSING_PASS: 'poke-repl auth expects a "pass" argument.',
    MISSING_USER: 'poke-repl auth expects a "user" argument.'
};

const DEFAULTS = {
    autoinitialize: true,
    host: '0.0.0.0',
    port: 3333,
    verbose: false,
    logger: console,
    encrypt: encrypt,
    //NOTE: When we use extend, we end up overwriting the properties 
    //of these objects :/
    // stdin: process.stdin,
    // stdout: process.stdout,
    makeStdin: _ => process.stdin,
    makeStdout: _ => process.stdout,
    parseCommand: parseCommand,
    makeClientInstance: function() {
        const Socket = new require('net').Socket;
        return new Socket();
    }
};

class Client {

    constructor(config) {
        config = extend({}, DEFAULTS, config);

        if (config.autoinitialize) {
            this.init(config);
        }
    }

    init(config) {
        assert.isObject(config, ERRORS.MISSING_CONFIG);
        assert.isString(config.host, ERRORS.MISSING_HOST);
        assert.isDefined(config.port, ERRORS.MISSING_PORT);

        extend(this, config);

        this.stdin = this.makeStdin();
        this.stdout = this.makeStdout();

        this.logger.info('- Connecting to %s %s', this.host, this.port);

        PSIGNALS.map(signal => {
            process.on(signal, this.closeConnection.bind(this, signal));
        });

        this.socket = this.makeClientInstance();

        this.socket.on('close', this.closeConnection.bind(this, 'socket:close'));
        this.socket.on('error', this.closeConnection.bind(this, 'socket:error'));

        /*
         * We want to be able to remove the handler
         * after the connection is stablish.
         */
        this._handshakeHandler = this.handshake.bind(this);

        this.socket.on('data', this._handshakeHandler);

        this.socket.connect(parseInt(this.port), this.host);
    }

    handshake(data) {

        let command = this.parseCommand(data);

        switch (command.label) {
            /*
             * The connection requires AUTH.
             * We are sent a seed we need to use
             * to encrypt our user and password
             *
             */
            case Commands.AUTHORIZE:
                const seed = command.getSeed();

                if (!seed) {
                    return this.closeConnection(ERRORS.SERVER_ERROR);
                }

                let errored = false;

                assert.isString(this.user, _ => errored = ERRORS.MISSING_USER);
                assert.isString(this.pass, _ => errored = ERRORS.MISSING_PASS);

                if (errored) {
                    return this.closeConnection(errored);
                }

                const cmd = this.encrypt(this.user + ' ' + this.pass, seed);
                this.socket.write(cmd);
                break;

            case Commands.CONNECT:
                this.socket.removeListener('data', this._handshakeHandler);
                this.handleConnection();
                break;

            case Commands.EXIT:
                const label = command.getErrorMessage(this.verbose);
                this.closeConnection(label);
                break;

            default:
                this.logger.info('--------------');
                this.logger.info('Command not recognized');
                this.logger.info('CMD: %s.', command.cmd);
                this.logger.info('Original command: %s', data.toString());
                this.logger.info('--------------');
        }
    }

    handleConnection() {
        if (this.connected) return;
        this.connected = true;

        //we should handle headless mode here:

        this.stdin.pipe(this.socket);
        this.stdin.setRawMode(true);
        /**
         * Clear the client's shell window
         */
        this.stdout.write('\x1B[2J');

        this.socket.pipe(this.stdout);

        this.stdin.on('end', _ => this.socket.destroy());

        /*
         * listen for user input on the client
         * side and look out for terminate 
         * sequence.
         */
        this.stdin.on('data', b => {
            if (b.length === 1 && b[0] === 4) {
                this.stdin.setRawMode(false);
                this.stdin.emit('end');
            }
        });
    }

    closeConnection(label, err) {

        this.logger.info('closeConnection', label, err);

        if (this.connectionClosed) return;
        this.connectionClosed = true;

        this.logger.info('HANDLE EXIT CALL: %s label', label);

        if (err) {
            this.logger.info(err);

            if (err.message) {
                this.logger.error(err.message);
            }

            if (err.stack) {
                this.logger.error(err.stack);
            }
        }

        try {
            process.stdin.setRawMode(false);
        } catch (e) {
            this.logger.error('ERROR', e.message);
        }

        this.socket.removeListener('close', this.closeConnection);
        this.socket.destroy();
        process.exit();
    }
}

Client.DEFAULTS = DEFAULTS;

/**
 * This is a REPL client window. Is basically 
 * a remote renderer.
 * 
 * @param {Object} config 
 */
module.exports = Client;

module.exports.ERRORS = ERRORS;