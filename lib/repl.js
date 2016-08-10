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
const assert = require('assert-is');
// const debug = require('debug')('poke-repl');

const DEFAULTS = {
    columns: 132,
    port: 3333,
    host: '0.0.0.0',
    enabled: true,
    logger: console,
    historyFile: '.repl_history',
    root: __dirname, //resolve('../../', __dirname)
    metadata: {},
    connectionBanner: require('./banner'),
    options:{
        prompt: ansi.bold(ansi.color('cyan', 'poke-repl > ')),
        useColors: true,
        replMode: require('repl').REPL_MODE_STRICT
    }
};

class Server {
    constructor(options){
        options = extend({}, DEFAULTS, options);

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
        var config = this.config;

        //implement as middleware: sparkfence
        if(firewall.block(socket, config)){
            this.logger.log('Exit due to non recognized IP');
            return socket.end();
        }

        this.logger.log('remote socket', socket.remoteAddress);

        function write(...msg){
            console.log('socket write', msg.join(' '));
            socket.write(msg.join(' '));
        }

        this.logger.info('- connection middleware');

        var seed = config.auth && config.auth.seed;

        var self = this;
        var method = (config.auth && config.auth.enabled) ? auth :  connect;

        if(seed) {
            this.logger.info('AUTH');
            write('AUTH ' +  seed);
            socket.on('data', method);
        } else {
            this.logger.info('PLAIN');
            connect();
        }
        // auth(data, next); next(err)
        function auth(data){
            console.log('- reject');
            data = data.toString();

            data = decrypt(data, seed);
            //validate! if it fails reject
            var user = {
                username: data.split(' ')[0],
                password: data.split(' ')[1]
            };
            assert.isString(user.password, reject.bind(user));
            assert.isString(user.username, reject.bind(user));

            var authenticated = false;
            config.auth.users.map(function(u){
                if(user.password === u.password && user.username === u.username){
                    authenticated = true;
                }
            });

            if(!authenticated) return reject(user);

            console.log('user authenticated', data);
            connect();
        }

        function reject(user, msg='authentication-failed'){
            console.log('- reject');
            self.logger.warn('REPL auth failed', user.username, user.password);
            socket.removeListener('data', method);
            write(CMDS.EXIT, msg);
        }

        function connect(){
            console.log('- connect');
            socket.removeListener('data', method);

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
        var config = this.config;
        socket.colums = config.colums || 132;

        var repl = require('repl').start({
            prompt: '',
            input: socket,
            output: socket,
            terminal: true,
            useGlobal: false,
            useColors: true,
            ignoreUndefined: true
        });

        Object.keys(this.context).map((key)=>{
            repl.context[key] = this.context[key];
        });

        //Remove the first write from history.
        process.nextTick(() =>{
            history.load(this, repl);
        });

        repl.pause();

        repl.on('exit', ()=>{
            console.log('repl.exit');
            repl.removeAllListeners();
            socket.end();
            history.save(this, repl);
        });

        socket.on('close', ()=>{
            socket.destroy();
            socket.removeAllListeners();
            console.log('socket.close\n-----------------------');
        });

        repl.on('error', this.onError.bind(this));

        // if(cb)cb(repl);

        repl.setPrompt(config.options.prompt);
        repl.resume();
        repl.write('', {name: 'return'});
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


module.exports = Server;

module.exports.createServer = function(config){
    return new Server(config);
};
