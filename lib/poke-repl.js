/*
 * Poke REPL
 * https://github.com/goliatone/poke-repl
 *
 * Copyright (c) 2016 goliatone
 * Licensed under the MIT license.
 */

'use strict';

var extend = require('gextend');
var _inherit = require('util').inherits;
var EventEmitter = require('events').EventEmitter;


var DEFAULTS = {
    autoinitialize: true
};

function poke_repl(config){
    EventEmitter.call(this);
    config = extend({}, this.constructor.DEFAULTS, config);

    if(config.autoinitialize ) this.init(config);
}

_inherit(poke_repl, EventEmitter);

poke_repl.DEFAULTS = DEFAULTS;

poke_repl.prototype.init = function(config){
    if(this.initialized) return;
    this.initialized = true;

    extend(this, this.constructor.DEFAULTS, config);

};

poke_repl.prototype.logger = console;

/**
 * Exports module
 */
module.exports = poke_repl;
