'use strict';

const assert = require('assert-is');
const decrypt = require('../utils').decrypt;
const generateSeed = require('../utils').generateSeed;

function auth(socket, config, next) {

    if (!config.auth || !config.auth.enabled) {
        //we don't have auth enabled, move on.
        return next();
    }

    function write(...msg) {
        msg = msg.join(' ');
        config.logger.log('socket write: %s', msg);
        socket.write(msg);
    }

    function authenticate(data) {

        socket.removeListener('data', authenticate);

        data = data.toString();
        data = decrypt(data, seed);
        data = data.split(' ');

        const user = {
            username: data[0],
            password: data[1]
        };

        assert.isString(user.password, next.bind(this, 'authentication-failed'));
        assert.isString(user.username, next.bind(this, 'authentication-failed'));

        let authenticated = false;
        config.auth.users.map(function (u) {
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

    write('AUTH', seed);
}

module.exports = auth;
