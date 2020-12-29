'use strict';

const CMDS = require('../utils').COMMANDS;

/**
 * Middleware manages connection middleware
 * to accepts connections.
 * 
 * Default middleware are firewall and auth.
 */
class Middleware {

    constructor(server) {
        this._middleware = [];
        this.server = server;

        this.addMiddleware(require('./firewall'));
        this.addMiddleware(require('./auth'));
    }

    addMiddleware(middleware) {
        this._middleware.push(middleware);
    }

    /**
     * Handle handshake phase of a new connection.
     * We run the socket by all the different 
     * middleware layers.
     * 
     * @param {net.Socket} socket 
     * @return {void}
     */
    handshake(socket) {

        const server = this.server,
            config = this.server.config,
            middleware = this._middleware;

        function reject(msg = 'middleware-failed') {
            server.logger.info('- reject');
            server.onConnectionRejected(socket, msg);
        }

        function connect() {
            server.logger.info('- connect');
            server.onConnectionComplete(socket);
        }

        function step() {
            function next(err) {
                if (err) reject(err);
                else step();
            }

            const m = middleware.shift();
            if (m) m(socket, config, next);
            else connect();
        }

        step();
    }
}

module.exports = Middleware;