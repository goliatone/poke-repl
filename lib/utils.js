// 'use strict';

const crypto = require('crypto');

/**
 * Generates a pseudo-random string of 40
 * characters of length.
 * 
 * example
 *    hzn5f4cdr4nco5p54288y3nmi1611nopkvivouuvhtlqnf80k9
 */
module.exports.generateSeed = function () {
    const timestamp = (new Date()).getTime().toString(36);

    const randomString = () => {
        return (Math.random() * 10000000000000000).toString(36).replace('.', '');
    };

    let token = `${timestamp}${randomString()}${randomString()}${randomString()}`;

    return (token + '00000')
        .slice(-40)
        .substring(0, 40);
};

/**
 * Hashes a given string using the crypto package.
 * Default algorithm is **aes-256-ctr**.
 * 
 * @param {String} text Source text to be encrypted
 * @param {String} secret Salt used for hashing
 * @param {String} [algorithm=aes-256-ctr] Valid cipher algorithm
 */
module.exports.encrypt = function $encrypt(text, secret, algorithm = 'aes-256-ctr') {
    const cipher = crypto.createCipher(algorithm, secret);
    let crypted = cipher.update(text, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
};

/**
 * Returns a string from a hash.
 * 
 * Default algorithm is **aes-256-ctr**.
 * 
 * @param {String} text Encrypted text to be cleared
 * @param {String} secret Salt used for hashing
 * @param {String} [algorithm=aes-256-ctr] Valid cipher algorithm
 */
module.exports.decrypt = function $decrypt(text, secret, algorithm = 'aes-256-ctr') {
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

/**
 * Parses a string and into a command object.
 * 
 * @param {Buffer} data Data buffer from socket
 * @return {Object}
 */
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

/**
 * NOTE: This prevents from using "use strict".
 * 
 * @param {String} title 
 */
module.exports.setTerminalTitle = function (title) {
    // process.stdout.write('\033]0;' + title + '\007');
    process.stdout.write('\033]2;' + title + '\033\\');
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
