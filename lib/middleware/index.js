
const CMDS = require('../utils').COMMANDS;

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

    handshake(socket) {
        var server = this.server,
            config = this.server.config,
            middleware = this._middleware;

        function step() {
            function next(err) {
                if (err) reject(err);
                else step();
            }
            var m = middleware.shift();
            if (m) m(socket, config, next);
            else connect();
        }

        step();

        function reject(msg = 'authentication-failed') {
            console.log('- reject');
            server.onConnectionRejected(socket, msg);
        }

        function connect() {
            console.log('- connect');
            server.onConnectionComplete(socket);
        }
    }
}

module.exports = Middleware;
