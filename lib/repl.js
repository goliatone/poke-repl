/*jshint esversion:6, node:true*/
'use strict';
const extend = require('gextend');
const resolve = require('path').resolve;
const ansi = require('./utils').ansi;
const CMDS = require('./utils').COMMANDS;
const history = require('./history');
const Connection = require('./connection');
const assert = require('assert-is');
const EventEmitter = require('events');


class Server extends EventEmitter {

    constructor(options){
        super();

        options = extend({}, Server.DEFAULTS, options);

        this.historyFile = resolve(options.root, options.historyFile);

        this.logger = options.logger;
        this.logger.info('historyFile %s', this.historyFile);
        this.config = options;

        this.isTLS = !!options.tls;
        this.serverOptions = options.tls || {};

        this.config.metadata.isTLS = this.isTLS;

        this._context = options.context || {};
    }

    start(){
        console.warn('DEPRECATED: use listen');
        this.listen();
    }

    get net(){
        return this.isTLS ? require('tls') : require('net')
    }

    listen(port){

        if(this.server) return;

        this.server = this.net.createServer(this.serverOptions, (s)=>{
            if(this.isTLS){
                this.logger.info('TLS connection: %s',(s.authorized ? '': 'un') + 'authorized');
            }
            this.hanshake(s);
        });

        this.server.on('error', this.onError.bind(this));
        /*
         * Had to remove this handler when introduced TSL
         * support since the handshake would fail...
         */
        // this.server.on('connection', this.hanshake.bind(this));

        let config = this.config;

        this.logger.info('launch server %s://%s:%s',
            (this.isTLS ? 'tls' : 'tcp'),
            config.host,
            (port || config.port)
        );

        this.server.listen(port || config.port, config.host);
    }

    hanshake(socket){
        var Middleware = require('./middleware');
        var middleware = new Middleware(this);
        middleware.handshake(socket);
    }

    onConnectionRejected(socket, msg){
        socket.write(CMDS.EXIT, msg);

        setTimeout(() => {
            try{socket.end();}catch(e){}
        }, 2000);
    }

    onConnectionComplete(socket){

        var self = this;

        socket.write(CMDS.CONNECT);

        setTimeout(function(){
            socket.write(self.createBanner());
        }, 100);

        setTimeout(self.acceptConnection.bind(self, socket), 200);
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
        this.logger.error('REPL Error: %s', e.message);
        this.logger.error('%s', e.stack);
        this.emit('error', e);
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
