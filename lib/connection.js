/*jshint esversion:6, node:true*/
'use strict';

var EventEmitter = require('events');

class Connection extends EventEmitter{
    constructor(socket){
        super();

        this.socket = socket;
        this.socket.columns = Connection.DEFAULTS.columns;

        this.init(Connection.DEFAULTS);
    }

    init(options){

        var config = options.makeConfig(this.socket);

        this.repl = options.startConnection(config);
        this.repl.pause();

        this.repl.on('exit', this.onExit.bind(this));

        this.repl.on('error', (e) => {
            this.emit('error', e);
        });

        this.socket.on('close', this.onClose.bind(this));
    }

    start(prompt){
        this.repl.setPrompt(prompt);
        this.repl.resume();
        this.repl.write('', {name: 'return'});
    }

    onExit(){
        this.repl.removeAllListeners();
        this.socket.end();
        this.emit('exit');
    }

    onClose(){
        this.socket.removeAllListeners();
        this.socket.destroy();
        this.socket = null;
        this.repl = null;
    }

    setContext(context){
        Object.keys(context).map((key)=>{
            this.repl.context[key] = context[key];
        });
    }
}

Connection.DEFAULTS = {
    startConnection: function(config){
        return require('repl').start(config);
    },
    colums: 132,
    makeConfig: (socket) => {
        return {
            prompt: '',
            input: socket,
            output: socket,
            terminal: true,
            useGlobal: false,
            useColors: true,
            ignoreUndefined: true
        }
    }
};

module.exports = Connection;
