'use strict';

const test = require('tape');
const sinon = require('sinon');
const utils = require('../lib/utils');
const EventListener = require('events');
const Client = require('../lib/client');
const COMMANDS = require('../lib/utils').COMMANDS;
const ERRORS = require('../lib/client').ERRORS;

const NOOP = () => {};

const MOCK = {
    makeStdin: () => {
        return {
            pipe: NOOP,
            setRawMode: NOOP,
            write: NOOP,
            emit: NOOP,
            on: NOOP
        }
    },
    makeStdout: () => {
        return {
            pipe: NOOP,
            setRawMode: NOOP,
            write: NOOP,
            emit: NOOP,
            on: NOOP
        }
    }
};

test('Client has DEFAULTS exposed', (t) => {
    t.ok(Client.DEFAULTS);
    t.end();
});

test('Client should take in configuration options', (t) => {
    const config = {
        host: 'localhost',
        port: 1234,
        connected: true,
        logger: {
            info: NOOP
        },
        makeClientInstance: function() {
            return {
                on: NOOP,
                connect: NOOP
            }
        },
        makeStdin: MOCK.makeStdin,
        makeStdout: MOCK.makeStdout
    };

    let conn = new Client(config);
    t.equal(conn.port, config.port);
    t.equal(conn.host, config.host);
    t.end();
});

test('Client register listeners to handle the socket connection', (t) => {
    const result = {};

    const config = {
        host: 'localhost',
        port: 1234,
        connected: true,
        logger: {
            info: NOOP
        },
        makeClientInstance: function() {
            return {
                on: function(type) {
                    result[type] = true;
                },
                connect: NOOP
            }
        },
        makeStdin: MOCK.makeStdin,
        makeStdout: MOCK.makeStdout
    };

    let conn = new Client(config);
    t.ok(result.close, true, 'Registered close event');
    t.ok(result.error, true, 'Registered error event');
    t.ok(result.data, true, 'Registered data event');
    t.end();
});

test('Client starts connection with port and host properties', (t) => {
    const result = {};

    const config = {
        host: 'localhost',
        port: 1234,
        connected: true,
        logger: {
            info: NOOP
        },
        makeClientInstance: function() {
            return {
                on: NOOP,
                connect: function(port, host) {
                    t.ok(port, config.port, 'Connect with port');
                    t.ok(host, config.host, 'Connect with host');
                    t.end();
                }
            }
        }
    };

    let conn = new Client(config);
});

test('Client handles handshake cycle: CONNECT command', (t) => {

    const socket = new EventListener();
    socket.connect = NOOP;

    const config = {
        parseCommand: (data) => {
            return {
                label: COMMANDS.CONNECT
            }
        },
        makeClientInstance: () => socket,
        handleConnection: () => {
            t.isEqual(socket.eventNames().indexOf('data'), -1, 'Remove data listener');
            t.ok(true, 'CONNECT command calls handleConnection');
            t.end();
        },
        makeStdin: MOCK.makeStdin,
        makeStdout: MOCK.makeStdout
    };

    let conn = new Client(config);

    conn.handshake(COMMANDS.CONNECT);
});

test('Client handles handshake cycle: AUTHORIZE command', (t) => {
    const SEED = 'THIS IS THE SEED';

    const socket = new EventListener();
    socket.connect = NOOP;

    const config = {
        user: 'guest',
        pass: 'guest',
        parseCommand: (data) => {
            return {
                label: COMMANDS.AUTHORIZE,
                getSeed: () => SEED
            }
        },
        makeClientInstance: () => socket,
        handleConnection: NOOP,
        makeStdin: MOCK.makeStdin,
        makeStdout: MOCK.makeStdout
    };

    const expected = utils.encrypt(config.user + ' ' + config.pass, SEED);

    socket.write = function(msg) {
        t.equal(msg, expected, 'Auth encrypts user and pas');
        t.end();
    };

    let conn = new Client(config);

    conn.handshake(COMMANDS.AUTHORIZE);
});

test('Client handles handshake cycle: AUTHORIZE command requires seed', (t) => {
    const socket = new EventListener();
    socket.connect = NOOP;

    const config = {
        user: 'guest',
        pass: 'guest',
        parseCommand: (data) => {
            return {
                label: COMMANDS.AUTHORIZE,
                getSeed: () => false
            }
        },
        makeClientInstance: () => socket,
        closeConnection: (err) => {
            t.equal(err, ERRORS.SERVER_ERROR);
            t.end();
        },
        makeStdin: MOCK.makeStdin,
        makeStdout: MOCK.makeStdout
    };

    let conn = new Client(config);

    conn.handshake(COMMANDS.AUTHORIZE);
});

test('Client handles handshake cycle: AUTHORIZE command requires user', (t) => {
    const socket = new EventListener();
    socket.connect = NOOP;

    const config = {
        // user: 'guest',
        pass: 'guest',
        parseCommand: (data) => {
            return {
                label: COMMANDS.AUTHORIZE,
                getSeed: () => true
            }
        },
        makeClientInstance: () => socket,
        closeConnection: (err) => {
            t.equal(err, ERRORS.MISSING_USER);
            t.end();
        },
        makeStdin: MOCK.makeStdin,
        makeStdout: MOCK.makeStdout
    };

    let conn = new Client(config);

    conn.handshake(COMMANDS.AUTHORIZE);
});

test('Client handles handshake cycle: AUTHORIZE command requires pass', (t) => {
    const socket = new EventListener();
    socket.connect = NOOP;

    const config = {
        user: 'guest',
        // pass: 'guest',
        parseCommand: (data) => {
            return {
                label: COMMANDS.AUTHORIZE,
                getSeed: () => true
            }
        },
        makeClientInstance: () => socket,
        closeConnection: (err) => {
            t.equal(err, ERRORS.MISSING_PASS);
            t.end();
        },
        makeStdin: MOCK.makeStdin,
        makeStdout: MOCK.makeStdout
    };

    let conn = new Client(config);

    conn.handshake(COMMANDS.AUTHORIZE);
});

test('Client handles connections by piping socket to stdin', (t) => {
    const socket = new EventListener();
    socket.connect = NOOP;
    socket.pipe = NOOP;

    const config = {
        autoinitialize: true,
        socket,
        makeClientInstance: () => socket,
        makeStdin: () => {
            return {
                pipe: (p) => {
                    t.equal(p, socket, 'We pipe out to socket');
                    t.end();
                },
                setRawMode: NOOP,
                on: NOOP
            }
        },
        makeStdout: MOCK.makeStdout
    };

    let conn = new Client(config);

    conn.handleConnection();
});

test('Client handles connections by setting raw mode', (t) => {
    const socket = new EventListener();
    socket.connect = NOOP;
    socket.pipe = NOOP;

    const config = {
        makeClientInstance: () => socket,
        makeStdin: () => {
            return {
                pipe: NOOP,
                setRawMode: (mode) => {
                    t.equal(mode, true, 'We set raw mode');
                    t.end();
                },
                on: NOOP
            }
        },
        makeStdout: MOCK.makeStdout,
        handshake: NOOP
    };

    let conn = new Client(config);

    conn.handleConnection();
});

test('Client handles connections by piping stdout to socket', (t) => {
    const socket = new EventListener();
    socket.connect = NOOP;

    const expected = MOCK.makeStdout();

    const config = {
        makeClientInstance: () => socket,
        makeStdout: () => expected,
        makeStdin: MOCK.makeStdin,
        handshake: NOOP
    };

    socket.pipe = (stdout) => {
        t.equal(stdout, expected, 'We pipe to stdout');
        t.end();
    };

    let conn = new Client(config);

    conn.handleConnection();
});