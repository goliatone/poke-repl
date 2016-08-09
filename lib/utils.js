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
    END_CONECT: 'TNC',
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

ansi.color = function(acolor, msg){
    var color = ansi[acolor] || 'magenta';
    return color(msg);
};
ansi.clear = function(){
    return '\u001b[2J\u001b[;H';
};

module.exports.ansi = ansi;


module.exports.generateSeed = function(){
    function rand() {
        return Math.random().toString(36).substr(2); // remove `0.`
    }

    function token() {
        return rand() + rand(); // to make it longer
    }

    return token();
};


/////
var inSubnet = require('insubnet');
var firewall = {
    _policy: 'ACCEPT'
};

firewall.policy = function(policy){
    firewall._policy = policy;
};

firewall.block = function $firewall(socket, config){
    //extend(firewall, config);
    var valid = false;

    //this should be based on policy
    if(!config.firewall) return true;


    var toIPv4 = function(addr) {
        var parts = String(addr).split(":");
        return parts[parts.length - 1];
    };

    var ip = socket.remoteAddress;
    if(socket.remoteFamily === 'IPv6'){
        ip = toIPv4(ip);
    }

    //this should be based on policy
    if(!firewall.isValidIp(ip)) return true;

    var matches = [], match;
    config.firewall.rules.map(function(rule){
        match = inSubnet.Auto(ip, rule.ip, rule.subnet || 32);
        if(match) matches.push(rule);
    });

    if(matches.length === 0){
        valid = firewall._policy === 'ACCEPT' ? false : true;
        return valid;
    }

    var rule = matches[0];
    valid = (rule.rule === 'ACCEPT') ? false : true;

    return valid;
};

firewall.isValidIp = function(ip) {
  return ((/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip)));
};

module.exports.firewall = firewall;
