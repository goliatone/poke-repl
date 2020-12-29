'use strict';
let header = '\n╔════════════════════════════════════════════════════════════════════╗\n' +
    '║                                                                    ║\n' +
    '║                      poke-repl remote console √                    ║\n' +
    '║                                                                    ║\n' +
    '║              All connections are monitored and recorded            ║\n' +
    '║      Disconnect \u001b[1mIMMEDIATELY\u001b[22m if you are not an authorized user      ║\n' +
    '╚════════════════════════════════════════════════════════════════════╝\n';

module.exports = function connectionBanner(config) {
    if (config.header) header = config.header;
    config.environment = config.environment || process.env.NODE_ENV;

    const body = `

REPL Session Information

Name              : ${config.name}
Version           : ${config.version}
Environment       : ${config.environment}

`;
    return header + body;
};