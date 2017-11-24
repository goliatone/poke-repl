/*jshint esversion:6, node:true*/
'use strict';
const extend = require('gextend');
const resolve = require('path').resolve;
const ansi = require('./utils').ansi;
const CMDS = require('./utils').COMMANDS;
const history = require('./history');
const Connection = require('./connection');
const Middleware = require('./middleware');

const assert = require('assert-is');
const EventEmitter = require('events');


class Server extends EventEmitter {

    constructor(options) {
        super();

        options = extend({}, Server.DEFAULTS, options);

        this.historyFile = resolve(options.root, options.historyFile);

        this.logger = options.logger;
        this.logger.info('REPL: historyFile %s', this.historyFile);
        this.config = options;

        this._context = options.context || {};
    }

    start() {
        console.warn('DEPRECATED: use listen');
        this.listen();
    }

    listen() {

        if (this.server) return;

        this.server = require('net').createServer();

        this.server.on('error', this.onError.bind(this));
        this.server.on('connection', this.hanshake.bind(this));

        var config = this.config;
        this.server.listen(config.port, config.host);
    }

    hanshake(socket) {
        const middleware = new Middleware(this);
        middleware.handshake(socket);
    }

    onConnectionRejected(socket, msg) {
        socket.write(CMDS.EXIT, msg);

        setTimeout(() => {
            try { socket.end(); } catch (e) { }
        }, 2000);
    }

    onConnectionComplete(socket) {

        socket.write(CMDS.CONNECT);

        setTimeout(() => {
            socket.write(this.createBanner());
        }, 100);

        setTimeout(()=>{
            this.acceptConnection(socket);
        }, 200);
    }

    acceptConnection(socket) {
        console.log('- acceptConnection');

        const connection = new Connection(socket);

        connection.setContext(this.context);

        process.nextTick(() => {
            history.load(this, connection.repl);
        });

        connection.on('exit', () => {
            history.save(this, connection.repl);
        });

        connection.on('error', this.onError.bind(this));

        const prompt = this.config.options.prompt;

        connection.start(prompt);
    }

    get context() {
        return this._context;
    }

    onError(e) {
        this.logger.error('REPL Error: %s', e.message);
        this.logger.error('%s', e.stack);
        this.emit('error', e);
    }

    createBanner() {
        return this.config.connectionBanner(this.config.metadata);
    }
}

Server.DEFAULTS = {
    columns: 132,
    port: 3333,
    host: '0.0.0.0',
    enabled: true,
    logger: console,
    historyFile: '.repl_history',
    root: __dirname, //resolve('../../', __dirname)
    metadata: {},
    connectionBanner: require('./banner'),
    options: {
        prompt: ansi.bold(ansi.color('cyan', 'poke-repl > '))
    }
};


module.exports = Server;

module.exports.createServer = function (config) {
    return new Server(config);
};
