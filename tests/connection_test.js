'use strict';

const test = require('tape');
const sinon = require('sinon');

const Connection = require('../lib/connection');


const NOOP = () => { };

test('Connection has DEFAULTS exposed', (t) => {
    t.ok(Connection.DEFAULTS);
    t.end();
});
