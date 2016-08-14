/*jshint esversion:6, node:true*/
'use strict';
const net = require('net');
const extend = require('gextend');
const resolve = require('path').resolve;
const decrypt = require('./utils').decrypt;
const ansi = require('./utils').ansi;
const CMDS = require('./utils').COMMANDS;
const firewall = require('./firewall');
const history = require('./history');
const Connection = require('./connection');
const assert = require('assert-is');
// const debug = require('debug')('poke-repl');

class Server {
    constructor(options){
        options = extend({}, Server.DEFAULTS, options);

        this.historyFile = resolve(options.root, options.historyFile);

        this.logger = options.logger;
        this.logger.info('REPL: historyFile %s', this.historyFile);
        this.config = options;

        this._context = options.context || {};
    }

    start(){
        console.warn('DEPRECATED: use listen');
        this.listen();
    }

    listen(){

        if(this.server) return;

        this.server = net.createServer();

        this.server.on('connection', this.hanshake.bind(this));

        var config = this.config;
        this.server.listen(config.port, config.host);
    }

    hanshake(socket){
        var config = this.config,
            self = this;

        var middleware = [
            require('./firewall'),
            require('./auth')
        ];

        function write(...msg){
            msg = msg.join(' ');
            config.logger.log('socket write: %s', msg);
            socket.write(msg);
        }

        function step(){
            function next(err){
                if(err) reject(err);
                else step();
            }
            var m = middleware.shift();
            if(m) m(socket, config, next);
            else connect();
        }

        step();

        function reject(msg='authentication-failed'){
            console.log('- reject');
            write(CMDS.EXIT, msg);

            setTimeout(() => {
                try{socket.end();}catch(e){}
            }, 2000);
        }

        function connect(){
            console.log('- connect');
            // socket.removeListener('data', method);

            /* We have to step through
             * each write to prevent
             * race conditions in the client
             * screen. So, one write at a time
             */
            write(CMDS.CONNECT);

            setTimeout(function(){
                write(self.createBanner());
            }, 100);

            setTimeout(self.acceptConnection.bind(self, socket), 200);
        }
    }

    acceptConnection(socket){
        console.log('- acceptConnection');

        var connection = new Connection(socket);

        connection.setContext(this.context);

        process.nextTick(() =>{
            history.load(this, connection.repl);
        });

        connection.on('exit', ()=>{
            history.save(this, connection.repl);
        });

        connection.on('error', this.onError.bind(this));

        var prompt = this.config.options.prompt;
        connection.start(prompt);
    }

    get context(){
        return this._context;
    }

    onError(e){
        this.logger.error('REPL ERROR: %s', e.message);
        this.logger.error('REPL ERROR S: %s', e.stack);
    }

    createBanner(){
        return this.config.connectionBanner(this.config.metadata);
    }
}

Server.DEFAULTS = {
    columns: 132,
    port: 3333,
    host: '0.0.0.0',
    enabled: true,
    logger: console,
    historyFile: '.repl_history',
    root: __dirname, //resolve('../../', __dirname)
    metadata: {},
    connectionBanner: require('./banner'),
    options: {
        prompt: ansi.bold(ansi.color('cyan', 'poke-repl > '))
    }
};


module.exports = Server;

module.exports.createServer = function(config){
    return new Server(config);
};
