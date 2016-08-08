/*jshint esversion:6, node:true*/
'use strict';

module.exports = {
    columns: 132,
    port: 54321,
    host: '0.0.0.0',
    enabled: true,
    historyFile: '.repl_history',
    package: {
        name: '${package.name}',
        version: '${package.version}'
    },
    options:{
        prompt: '\u001b[1;32ms2-influx-pub > \u001b[0m',
        useColors: true,
        replMode: require('repl').REPL_MODE_STRICT
    },
    auth: {
        seed: 'adfadsfabadfadfadf24323443',
        enabled: true,
        users:[{
            username: 'goliatone', password: 'admin'
        }]
    }
};

module.exports.afterSolver = function(config, section){
    var key = section + '.enabled';
    if(config.get(key, undefined) !== undefined) return;
    var enabled = config.get('environment', 'production') === 'development';
    config.set(key, enabled);
};
