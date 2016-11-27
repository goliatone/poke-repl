
var header = '\n╔════════════════════════════════════════════════════════════════════╗\n' +
'║                                                                    ║\n' +
'║                      poke-repl remote console √                    ║\n' +
'║                                                                    ║\n' +
'║              All connections are monitored and recorded            ║\n' +
'║      Disconnect \u001b[1mINMEDIATELY\u001b[22m if you are not an authorized user      ║\n' +
'╚════════════════════════════════════════════════════════════════════╝\n';

module.exports = function connectionBanner(config){
    if(config.header) header = config.header;
    config.environment = config.environment || process.env.NODE_ENV;

    var body = `

REPL Info:
Name              : ${config.name}
Version           : ${config.version}
Environment       : ${config.environment}

`;
    return header + body;
};
