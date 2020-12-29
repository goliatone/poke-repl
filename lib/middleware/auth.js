'use strict';

const assert = require('assert-is');
const CMDS = require('../utils').COMMANDS;
const decrypt = require('../utils').decrypt;
const generateSeed = require('../utils').generateSeed;

function auth(socket, config, next) {

    if (!config) {
        console.warn('Auth middleware called without config.');
        return next();
    }

    if (!config.auth || !config.auth.enabled) {
        //we don't have auth enabled, move on.
        return next();
    }

    if (!Array.isArray(config.auth.users)) {
        config.logger.error('Invalid configuration.');
        config.logger.error('You need to provide a list of user objects.');
        return next('invalid-configuration');
    }

    if (!config.logger) {
        config.logger = console;
    }

    function write(...msg) {
        msg = msg.join(' ');
        config.logger.log('socket write: %s', msg);
        socket.write(msg);
    }

    function authenticate(data = '') {

        socket.removeListener('data', authenticate);

        data = data.toString();
        data = decrypt(data, seed);
        data = data.split(' ');

        const user = {
            username: data[0],
            password: data[1]
        };

        const validation = _ => {
            validation.failed = true;
        };

        assert.isString(user.password, validation);
        assert.isString(user.username, validation);

        if (validation.failed) {
            return next('authentication-failed');
        }

        let authenticated = false;

        config.auth.users.map(function(u) {
            if (user.password === u.password && user.username === u.username) {
                authenticated = true;
            }
        });

        if (!authenticated) {
            config.logger.warn('REPL auth failed for user %s', user.username);
            return next('authentication-failed');
        }

        next(null, user);
    }

    const seed = config.auth.seed || generateSeed();

    socket.on('data', authenticate);

    write(CMDS.AUTHORIZE, seed);
}

module.exports = auth;