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
        var config = this.config;

        function next(err){
            if(err) reject(err);
            else ...
        }


        //implement as middleware: sparkfence
        if(firewall.block(socket, config)){
            this.logger.log('Exit due to non recognized IP');
            return reject('firewall-ip');
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

            if(!authenticated){
                self.logger.warn('REPL auth failed', user.username, user.password);
                return reject(user);
            }

            console.log('user authenticated', data);
            connect();
        }

        function reject(msg='authentication-failed'){
            console.log('- reject');

            if(method){
                socket.removeListener('data', method);
            }

            write(CMDS.EXIT, msg);

            setTimeout(() => {
                try{socket.end();}catch(e){}
            }, 2000);
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
