'use strict';

const test = require('tape');
const sinon = require('sinon');

const Module = require('../lib/middleware/auth');

const utils = require('../lib/utils');
const CMDS = utils.COMMANDS;

const NOOP = () => { };

test('Auth middleware is a function', (t) => {
    t.isEqual(typeof Module, 'function', 'Middleware is function');
    t.isEqual(Module.length, 3, 'Middleware takes 3 arguments');
    t.end();
});

test('Auth will be skipped if auth is not enabled in config', (t) => {

    const socketMock = {
        write: function (msg) {
            socketMock.msg = msg;
        }
    };

    const config = {};

    Module(socketMock, config, (...args) => {
        t.notOk(socketMock.msg, 'We dont send messages over the socket');
        t.isEquivalent(args, [], 'We call next without arguments');
        t.end();
    });
});

test('Auth send AUTHORIZE command if auth enabled in config', (t) => {

    const socketMock = {
        write: function (msg) {
            t.isEqual(msg.indexOf(CMDS.AUTHORIZE), 0, 'We got AUTHORIZE command');
            t.end();
        },
        on: function (type, handler) { }
    };

    const config = {
        auth: {
            username: 'goliatone',
            password: 'secrets',
            enabled: true
        },
        logger: {
            log: NOOP
        }
    };

    Module(socketMock, config, NOOP);
});

test('Auth will not authenticate if not users are available', (t) => {
    const socketMock = {
        write: NOOP,
        on: function (type, handler) {
            handler('');
        },
        removeListener: NOOP
    };

    const config = {
        auth: {
            username: 'goliatone',
            password: 'secrets',
            enabled: true,
            // users: []
        },
        logger: {
            log: NOOP,
            warn: NOOP
        }
    };

    Module(socketMock, config, (err) => {
        t.ok(err, 'authencitaion-failed', 'Auth fails if no users sent');
        t.end();
    });
});

test('Auth will authenticate once there is data available', (t) => {

    const expected = {
        username: 'goliatone',
        password: 'secrets'
    };

    const config = {
        auth: {
            enabled: true,
            users: [expected]
        },
        logger: {
            log: NOOP,
            warn: NOOP
        }
    };

    const socketMock = {
        write: (msg) => {
            //get the seed
            let seed = msg.split(' ')[1];
            //encrypt
            let payload = expected.username + ' ' + expected.password;
            let response = utils.encrypt(payload, seed);
            socketMock._handler(response);
        },
        on: function (type, handler) {
            socketMock._handler = handler;
        },
        removeListener: NOOP
    };

    Module(socketMock, config, (err, user) => {
        t.notOk(err, 'Auth has no error');
        t.deepEqual(user, expected, 'Auth calls next with user');
        t.end();
    });
});