'use strict';

const test = require('tape');
const sinon = require('sinon');

const path = require('path');
const fixture = path.resolve.bind(path, __dirname, 'fixtures');

const Module = require('..');

test('Module should be bootstraped OK', (t) => {
    t.ok(Module.DEFAULTS);
    t.end();
});