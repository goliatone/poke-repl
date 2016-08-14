const fs = require('fs');

module.exports.load = function(self, repl){
    repl.history.length = 0;
    try {
        fs.statSync(self.historyFile);
        fs.readFileSync(self.historyFile).toString()
            .split('\n')
            .reverse()
            .filter(line => line.trim())
            .map(line => repl.history.push(line));
    }catch(e){
        self.logger.info('REPL: could not read history file: %s', self.historyFile);
        self.logger.info('REPL: a new history file will be created on exit');
    }
};

module.exports.save = function(self, repl){
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