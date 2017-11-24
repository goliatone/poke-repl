/*jshint esversion:6, node:true*/

module.exports.setTerminalTitle = function (title) {
    process.stdout.write('\033]2;' + title + '\033\\');
    // process.stdout.write('\033]0;' + title + '\007');
};

var crypto = require('crypto');

module.exports.encrypt = function $encrypt(text, secret, algorithm = 'aes-256-ctr') {
    // "use strict";
    const cipher = crypto.createCipher(algorithm, secret);
    let crypted = cipher.update(text, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
};

module.exports.decrypt = function $decrypt(text, secret, algorithm = 'aes-256-ctr') {
    // 'use strict';
    const decipher = crypto.createDecipher(algorithm, secret);
    let dec = decipher.update(text, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
};


const COMMANDS = {
    AUTHORIZE: 'AUTH',
    EXIT: 'EXT',
    CONNECT: 'CNT',
    END_CONECT: 'TNC',
    UNDEFINED: 'UNDEFINED',
    DIRTY_CONTEXT: 'DTC'
};

module.exports.COMMANDS = COMMANDS;

module.exports.parseCommand = function (data) {
    if (!data) return {};

    data = (data.toString() || COMMANDS.UNDEFINED);

    const parts = data.split(' ');
    const cmd = parts.shift();
    const args = parts.concat();

    const out = {
        args: args,
        label: cmd,
        getSeed: function () {
            return args[0];
        },
        getErrorMessage: function (verbose) {
            return verbose ? args[0] : 'exit';
        }
    };

    return out;
};

//ansi:
//https://github.com/jonschlinkert/ansi-wrap

const ansi = {};

ansi.wrapAnsi = function (a, b, msg) {
    return '\u001b[' + a + 'm' + msg + '\u001b[' + b + 'm';
};

ansi.magenta = function (msg) {
    return ansi.wrapAnsi(35, 39, msg);
};

ansi.cyan = function (msg) {
    return ansi.wrapAnsi(36, 39, msg);
};

ansi.yellow = function (msg) {
    return ansi.wrapAnsi(33, 39, msg);
};

ansi.bold = function (msg) {
    return ansi.wrapAnsi(1, 22, msg);
};

ansi.color = function (acolor, msg) {
    var color = ansi[acolor] || 'magenta';
    return color(msg);
};

ansi.clear = function () {
    return '\u001b[2J\u001b[;H';
};

module.exports.ansi = ansi;

/**
 * Generates a pseudo-random string of 51
 * characters of length.
 * 
 * example
 *    hzn5f4cdr4nco5p54288y3nmi1611nopkvivouuvhtlqnf80k9
 */
module.exports.generateSeed = function () {
    function rand() {
        return Math.random().toString(36).substr(2); // remove `0.`
    }

    function token() {
        return rand() + rand(); // to make it longer
    }

    return token();
};
