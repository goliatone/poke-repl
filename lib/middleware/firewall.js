'use strict';

const inSubnet = require('insubnet');

function firewall(socket, config, next) {

    if (!config) {
        console.warn('Firewall middleware called without config.');
        return next();
    }

    if (!config.logger) {
        config.logger = console;
    }

    
    if (firewall.block(socket, config)) {
        return next('firewall-ip');
    }

    next();
}

firewall._policy = 'ACCEPT';

firewall.policy = function (policy) {
    firewall._policy = policy;
};

firewall.block = function $firewall(socket, config) {

    if (!config.firewall) {
        return false;
    }

    if (!Array.isArray(config.firewall.rules)) {
        config.logger.error('Invalid configuration.');
        config.logger.error('You need to privide a list of firewall rules.');
        return true;
    }

    //extend(firewall, config);
    let valid = false;

    const toIPv4 = function (addr) {
        var parts = String(addr).split(':');
        return parts[parts.length - 1];
    };

    let ip = socket.remoteAddress;
    if (socket.remoteFamily === 'IPv6') {
        ip = toIPv4(ip);
    }

    //this should be based on policy
    if (!firewall.isValidIp(ip)) {
        return true;
    }

    let matches = [], match;

    config.firewall.rules.map(function (rule) {
        match = inSubnet.Auto(ip, rule.ip, rule.subnet || 32);
        if (match) {
            matches.push(rule);
        }
    });

    if (matches.length === 0) {
        valid = firewall._policy === 'ACCEPT' ? false : true;
        
        return valid;
    }

    const rule = matches[0];
    
    valid = (rule.rule === 'ACCEPT') ? false : true;

    return valid;
};

firewall.isValidIp = function (ip) {
    return ((/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip)));
};

module.exports = firewall;
