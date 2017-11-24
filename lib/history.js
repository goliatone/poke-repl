const fs = require('fs');

/**
 * Load a previously saved history file
 * into a poke-repl client.
 * 
 * @param {Client} self 
 * @param {Socket} repl 
 */
module.exports.load = function(self, repl) {
    repl.history.length = 0;
    try {
        fs.statSync(self.historyFile);
        fs.readFileSync(self.historyFile).toString()
            .split('\n')
            .reverse()
            .filter(line => line.trim())
            .map(line => repl.history.push(line));
    } catch(e) {
        self.logger.info('REPL: could not read history file: %s', self.historyFile);
        self.logger.info('REPL: a new history file will be created on exit');
    }
};

/**
 * Save a history file in a format that is
 * ready to be loaded on next sessions.
 * 
 * @param {Client} self 
 * @param {Socket} repl 
 */
module.exports.save = function(self, repl) {
    var history = (repl.history || []);
    try {
        const lines = (history || [])
                .reverse()
                .filter(line => line.trim())
                .join('\n');
        fs.writeFileSync(self.historyFile, lines);
    } catch(e){
        self.logger.info('REPL: could not save history file: %s', self.historyFile);
        self.logger.info('REPL', e.message);
    }
};
