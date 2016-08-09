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
    if(!config.firewall){
        return true;
    }


    var toIPv4 = function(addr) {
        var parts = String(addr).split(":");
        return parts[parts.length - 1];
    };

    var ip = socket.remoteAddress;
    if(socket.remoteFamily === 'IPv6'){
        ip = toIPv4(ip);
    }

    //this should be based on policy
    if(!firewall.isValidIp(ip)) {
        return true;
    }

    var matches = [], match;
    config.firewall.rules.map(function(rule){
        match = inSubnet.Auto(ip, rule.ip, rule.subnet || 32);
        if(match){
            matches.push(rule);
        }
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

module.exports = firewall;
