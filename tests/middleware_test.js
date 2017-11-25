'use strict';

const test = require('tape');
const sinon = require('sinon');

const Module = require('../lib/middleware');
const NOOP = () => { };

test('Middleware stores middlewares...', (t) => {
    const expected = 'middleware-test';
    const middleware = new Module();

    middleware.addMiddleware(expected);

    let ok = false;

    middleware._middleware.map((ware) => {
        if (ware === expected) ok = true;
    });

    t.ok(ok, 'We store middlewares');
    t.end();
});

test('Middleware handles hanshakes by iterating over all middlewares...', (t) => {
    const mid1 = function (socket, config, next) {
        next();
    };

    const mid2 = function (socket, config, next) {
        next();
    };

    const server = {
        logger: {
            info: NOOP
        },
        onConnectionRejected: NOOP,
        onConnectionComplete: function (socket) {
            t.deepEqual(socket, expected, 'Connection complete after all middleware');
            t.end();
        }
    };

    const middleware = new Module(server);
    middleware._middleware = [];

    middleware.addMiddleware(mid1);
    middleware.addMiddleware(mid2);

    const expected = { id: 'socket-mock' };

    middleware.handshake(expected);
});

test.only('Middleware handles rejects connection if middleware fails', (t) => {
    const expected = 'error';

    const mid1 = function (socket, config, next) {
        next(expected);
    };

    const server = {
        logger: {
            info: NOOP
        },
        onConnectionComplete: NOOP,
        onConnectionRejected: function (sock, msg) {
            t.deepEqual(sock, socket, 'Connection complete after all middleware');
            t.isEqual(msg, expected, 'Error messages match');
            t.end();
        }
    };

    const middleware = new Module(server);
    middleware._middleware = [];

    middleware.addMiddleware(mid1);

    const socket = { id: 'socket-mock' };

    middleware.handshake(socket);
});