/*jshint esversion:6, node:true*/
'use strict';

const fs = require('fs');
const net = require('net');
const extend = require('gextend');
const resolve = require('path').resolve;
const decrypt = require('./utils').decrypt;
const ansi = require('./utils').ansi;
const CMDS = require('./utils').COMMANDS;

const DEFAULTS = {
    logger: console,
    port: 3333,
    host: '0.0.0.0',
    historyFile: '.repl_history',
    root: __dirname,
    metadata: {

    },
    options:{
        prompt: ansi.bold(ansi.color('cyan', 'poke-repl > ')),
        useColors: true,
        replMode: require('repl').REPL_MODE_STRICT
    }
};

class REPL {
    constructor(options){
        options = extend({}, DEFAULTS, options);

        this.historyFile = resolve(options.root, options.historyFile);
        // process.env.NODE_REPL_HISTORY = this.historyFile;

        this.logger = options.logger;
        this.logger.info('REPL: historyFile %s', this.historyFile);
        this.config = options;

        this._context = options.context || {};
    }

    onError(e){
        this.logger.error('REPL ERROR: %s', e.message);
        this.logger.error('REPL ERROR: %s', e.stack);
    }

    createBanner(){
        var config = this.config.metadata;
        config.environment = config.environment || process.env.NODE_ENV;
        var _banner = `
------------------------------------
REPL Info:
Name              : ${config.name}
Version           : ${config.version}
Environment       : ${config.environment}

`;
        return _banner;
    }

    start(cb){
        if(this.server) return;
        var config = this.config;

        this.server = net.createServer();
        this.server.on('connection', (socket) =>{
            function write(...msg){
                console.log('socket write', msg.join(' '));
                socket.write(msg.join(' '));
            }

            console.log('- connection middleware');
            var seed = config.auth && config.auth.seed;

            var self = this;
            var method = (config.auth && config.auth.enabled) ? auth :  connect;

            if(seed) {
                console.log('AUTH');
                write('AUTH ' +  seed);
                socket.on('data', method);
            } else {
                console.log('PLAIN');
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

                var authenticated = false;
                config.auth.users.map(function(u){
                    if(user.password === u.password && user.username === u.username){
                        authenticated = true;
                    }
                });

                if(!authenticated) return reject(user);

                console.log('auth', data);
                connect();
            }

            function reject(user){
                console.log('- reject');
                self.logger.warn('REPL auth failed', user.username, user.password);
                socket.removeListener('data', method);
                write(CMDS.EXIT, 'authentication-failed');
            }

            function connect(){
                console.log('- connect');
                socket.removeListener('data', method);
                write(CMDS.CONNECT);
                setTimeout(function(){
                    write(self.createBanner());
                }, 100);
                setTimeout(onConnection.bind(self, socket), 200);
            }
        });

        var self = this;

        function onConnection(socket){
            console.log('- onConnection');
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

            Object.keys(self.context).map((key)=>{
                repl.context[key] = self.context[key];
            });

            //Remove the first write from history.
            process.nextTick(() =>{
                this.loadHistory(repl);
            });

            repl.pause();

            repl.on('exit', ()=>{
                console.log('repl.exit');
                repl.removeAllListeners();
                socket.end();
                this.saveHistory(repl);
            });

            socket.on('close', ()=>{
                socket.destroy();
                socket.removeAllListeners();
                console.log('socket.close\n-----------------------');
            });

            repl.on('error', self.onError.bind(self));

            // if(cb)cb(repl);

            repl.setPrompt(config.options.prompt);
            repl.resume();
            repl.write('', {name: 'return'});
        }

        this.server.listen(config.port, config.host);
    }

    get context(){
        return this._context;
    }

    loadHistory(repl){
        //Get rid of the first time we send data out
        repl.history.length = 0;
        try {
            fs.statSync(this.historyFile);
            fs.readFileSync(this.historyFile).toString()
                .split('\n')
                .reverse()
                .filter(line => line.trim())
                .map(line => repl.history.push(line));
        }catch(e){
            this.logger.info('REPL: could not read history file: %s', this.historyFile);
            this.logger.info('REPL: a new history file will be created on exit');
        }
    }

    saveHistory(repl){
        var history = (repl.history || []);
        try {
            const lines = (history || [])
                    .reverse()
                    .filter(line => line.trim())
                    .join('\n');
            fs.writeFileSync(this.historyFile, lines);
        } catch(e){
            this.logger.info('REPL: could not save history file: %s', this.historyFile);
            this.logger.info('REPL', e.message);
        }
    }
}


module.exports = REPL;
