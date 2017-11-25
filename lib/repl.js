'use strict';
const extend = require('gextend');
const resolve = require('path').resolve;
const ansi = require('./utils').ansi;
const CMDS = require('./utils').COMMANDS;
const history = require('./history');
const Connection = require('./connection');
const Middleware = require('./middleware');
const Keypath = require('gkeypath');

const assert = require('assert-is');
const EventEmitter = require('events');

/**
 * The Server class provides a listening server
 * for incomming connections. It will also apply
 * the provided middleware and manage individual 
 * connections.
 */
class Server extends EventEmitter {

    constructor(options) {
        super();

        options = extend({}, Server.DEFAULTS, options);

        this.historyFile = resolve(options.root, options.historyFile);

        this.logger = options.logger;
        this.logger.info('REPL: historyFile %s', this.historyFile);
        this.config = options;

        this.createTransport = options.createTransport;

        this._context = options.context || {};
    }

    start() {
        this.logger.warn('DEPRECATED: use listen');
        this.listen();
    }

    /**
     * Start a server listening for connections.
     */
    listen() {

        if (this.server) return;

        this._connections = new Map();

        this.server = this.createTransport();

        this.server.on('error', this.onError.bind(this));
        this.server.on('connection', this.hanshake.bind(this));

        const config = this.config;
        this.server.listen(config.port, config.host);
    }

    /**
     * Handle a client's initial connection,
     * we run that connection through our middleware
     * stack.
     * 
     * @param {net.Socket} socket 
     */
    hanshake(socket) {
        const middleware = new Middleware(this);
        middleware.handshake(socket);
    }

    /**
     * A middleware handler decided to reject
     * an incomming connection.
     * 
     * @param {net.Socket} socket Client socket
     * @param {String} msg Message to be sent to client
     */
    onConnectionRejected(socket, msg) {
        socket.write(CMDS.EXIT, msg);

        setTimeout(() => {
            try { socket.end(); } catch (e) { }
        }, 2000);
    }

    /**
     * Hanshacke connection completed.
     * 
     * @param {net.Socket} socket Client socket
     */
    onConnectionComplete(socket) {

        socket.write(CMDS.CONNECT);

        /**
         * Send the initial banner to the
         * client.
         */
        setTimeout(() => {
            socket.write(this.createBanner());
        }, 100);

        /**
         * From this moment on a valid client
         * connection is stablished.
         */
        setTimeout(() => {
            this.acceptConnection(socket);
        }, 200);
    }

    acceptConnection(socket) {

        this.logger.log('- acceptConnection');

        const connection = new Connection(socket);

        this._connections.set(connection.id, connection);

        connection.setContext(this._context);

        /**
         * Load history file. 
         * 
         * TODO: We should filter history
         * by users.
         */
        process.nextTick(() => {
            history.load(this, connection.repl);
        });

        /**
         * On connection exit, we create
         * a new history file.
         */
        connection.on('exit', () => {
            history.save(this, connection.repl);
            this._connections.delete(connection.id);
        });

        connection.on('error', (e) => {
            this._connections.delete(connection.id);
            this.onError(e);
        });

        const options = this.config.options;

        connection.start(options);
    }

    /**
     * Update context on all client connections.
     * 
     * @param {String} keypath Path to attribute
     * @param {Mixed} value Value for keypath
     */
    updateContext(keypath, value) {
        /*
         * Update our local context copy.
         */
        Keypath.set(this._context, keypath, value);

        this._connections.forEach((conn, id) => {
            conn.repl.resetContext();
            conn.setContext(this._context);
            conn.setDirtyPrompt();
        });

        return this;
    }

    /*
     * TODO: This WILL be deprected
     */
    get context() {
        return this._context;
    }

    onError(e) {
        this.logger.error('REPL Error: %s', e.message);
        this.logger.error('%s', e.stack);
        this.emit('error', e);
    }

    /**
     * The value returned from this function will
     * be displayed in the clients screen on
     * connection. 
     * 
     * We can use ansi values.
     * 
     * @return {String} Banner to be sent to client
     */
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
    createTransport: function () {
        return require('net').createServer();
    },
    connectionBanner: require('./banner'),
    options: {
        prompt: ansi.bold(ansi.color('cyan', 'poke-repl > ')),
        dirtyPrompt: ansi.bold(ansi.color('red', 'poke-repl*> '))
    }
};


module.exports = Server;

module.exports.createServer = function (config) {
    return new Server(config);
};
