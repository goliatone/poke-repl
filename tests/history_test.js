'use strict';

const test = require('tape');
const sinon = require('sinon');
const dirsEqual = require('fs-equal').areDirsEqual;

const path = require('path');
const fixture = path.resolve.bind(path, __dirname, 'fixtures');

const Module = require('../lib/history');

test('The history module should load a history file', (t) => {
    const ClientMock = {
        historyFile: fixture('history_file_dirty.txt'),
    };

    const ReplMock = {
        history: []
    };

    const expected = _load('history_file.json');

    Module.load(ClientMock, ReplMock);

    t.deepEqual(ReplMock.history, expected.result);
    t.end();
});


test('The history module should save a history file', (t) => {
    const expected = _load('history_file.json');

    const src = fixture('history_file.txt');
    const fxt = fixture('history_file_tmp.txt');

    const ClientMock = {
        historyFile: fxt,
    };

    const ReplMock = {
        history: expected.result
    };

    Module.save(ClientMock, ReplMock);

    dirsEqual(src, fxt).then((ok) => {
        t.ok(ok, 'History generated file is ok');
        _unload(fxt);
        t.end();
    });
});


function _load(name, ext) {
    return require(fixture(name));
}

function _unload(filepath) {
    require('fs').unlinkSync(filepath);
}
