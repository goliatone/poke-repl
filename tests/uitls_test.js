'use strict';

const test = require('tape');

const Module = require('../lib/utils');

const SECRET = 'this is just salt';

const Encryption = {
    secret: 'this is just salt',
    source: 'This is a known txt',
    result: '2b23b5dcb6faf4e7a64931a34c66f85261fa67'
}

test('Encrypt should encrypt a nonce and return a consistent value', (t) => {
    const result = Module.encrypt(Encryption.source, Encryption.secret);
    t.equal(result, Encryption.result, 'Expected result');
    t.end();
});

test('Decrypt should return a known value for a given nonce', (t)=>{
    const result = Module.decrypt(Encryption.result, Encryption.secret);
    t.equal(result, Encryption.source, 'Expected result');
    t.end();
});


test('generateSeed should return a random string of 51 chars', (t)=>{
    const result = Module.generateSeed();
    t.equal(result.length, 40, 'Expected result');
    t.end();
});