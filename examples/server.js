var REPL = require('../lib/repl');

var repl = new REPL({
    root: __dirname,
    package:{
        name: 'Test',
        version: '0.0.0',
        environment: 'development'
    },


});
repl.start();
