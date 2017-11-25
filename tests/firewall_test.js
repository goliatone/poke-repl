'use strict';

const test = require('tape');
const sinon = require('sinon');

const Module = require('../lib/middleware/firewall');

const utils = require('../lib/utils');
const CMDS = utils.COMMANDS;

const NOOP = () => { };

test('firewall should not block if not enabled', (t) => {
    const socketMock = {
        write: function (msg) {
            socketMock.msg = msg;
        }
    };

    const config = {};

    Module(socketMock, config, (err) => {
        t.notOk(err, 'No error sent');
        t.end();
    });
});

test('firewall expects a set of rules', (t) => {
    const socketMock = {
        write: NOOP
    };

    const config = {
        firewall: true
    };

    Module(socketMock, config, (err) => {
        t.isEqual(err, 'firewall-ip', 'Expects valid configuration');
        t.end();
    });
});

test('firewall restricted to local connections', (t) => {
    const socketMock = {
        write: NOOP,
        remoteAddress: '127.0.0.1'
    };

    const config = {
        firewall: {
            rules: [
                { ip: '127.0.0.1', rule: 'ACCEPT' }
            ]
        }
    };

    Module(socketMock, config, (err) => {
        t.notOk(err, 'No IP error');
        t.end();
    });
});

test('firewall restricted to local connections', (t) => {
    const socketMock = {
        write: NOOP,
        remoteAddress: '1.2.3.4'
    };

    const config = {
        firewall: {
            rules: [
                { ip: '1.2.0.0', subnet: '16', rule: 'ACCEPT' }
            ]
        }
    };

    Module(socketMock, config, (err) => {
        t.notOk(err, 'No IP error');
        t.end();
    });
});