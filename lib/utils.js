/*jshint esversion:6, node:true*/

module.exports.setTerminalTitle = function(title){
    process.stdout.write('\033]2;' + title + '\033\\');
    // process.stdout.write('\033]0;' + title + '\007');
};

var crypto = require('crypto');

module.exports.encrypt = function $encrypt(text, secret, algorithm='aes-256-ctr'){
    // "use strict";
    var cipher = crypto.createCipher(algorithm, secret);
    var crypted = cipher.update(text,'utf8','hex');
    crypted += cipher.final('hex');
    return crypted;
};

module.exports.decrypt = function $decrypt(text, secret, algorithm='aes-256-ctr'){
    // 'use strict';
    var decipher = crypto.createDecipher(algorithm, secret);
    var dec = decipher.update(text,'hex','utf8');
    dec += decipher.final('utf8');
    return dec;
};


module.exports.COMMANDS = {
    AUTHORIZE: 'AUTH',
    EXIT: 'EXT',
    CONNECT: 'CNT',
    UNDEFINED: 'UNDEFINED'
};

module.exports.parseCommand = function(data){

    if(!data) return {};
    data = (data.toString() || module.exports.COMMANDS.UNDEFINED);
    var parts = data.split(' ');
    var cmd = parts.shift();
    var args = parts.concat();

    var out = {
        cmd: cmd,
        args: args,
        getSeed: function(){
            return args[0];
        },
        getErrorMessage: function(verbose){
            return verbose ? args[0] : 'exit';
        }
    };
    return out;
};

//ansi:
//https://github.com/jonschlinkert/ansi-wrap
var ansi = {};
ansi.wrapAnsi = function(a, b, msg){
    return '\u001b['+ a + 'm' + msg + '\u001b[' + b + 'm';
};

ansi.magenta = function(msg){
    return ansi.wrapAnsi(35, 39, msg);
};

ansi.cyan = function(msg){
    return ansi.wrapAnsi(36, 39, msg);
};

ansi.yellow = function(msg){
    return ansi.wrapAnsi(33, 39, msg);
};

ansi.bold = function(msg){
    return ansi.wrapAnsi(1, 22, msg);
};

ansi.color = function(color, msg){
    color = ansi[color] || 'magenta';
    return color(msg);
};
module.exports.ansi = ansi;
