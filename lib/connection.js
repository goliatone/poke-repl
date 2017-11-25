'use strict';

const EventEmitter = require('events');
const _getGuid = require('./utils').getGuid;

/**
 * 
 */
class Connection extends EventEmitter {

    constructor(socket) {
        super();

        this.socket = socket;
        this.socket.columns = Connection.DEFAULTS.columns;

        this.init(Connection.DEFAULTS);
    }

    init(options) {
        if (this.initialized) return;
        this.initialized = true;

        const config = options.makeConfig(this.socket);

        this.id = _getGuid();

        this.repl = options.startConnection(config);
        this.repl.pause();

        this.repl.on('exit', this.onExit.bind(this));

        this.repl.on('error', (e) => {
            this.emit('error', e);
        });

        this.socket.on('close', this.onClose.bind(this));
    }

    /**
     * We start a new REPL client, and we send
     * a prompt we display to our users.
     * 
     * @param {String} prompt Promt to be shown
     */
    start({ prompt, dirtyPrompt }) {
        /*
         * Store our prompts.
         */
        this.prompt = prompt;
        this.dirtyPrompt = dirtyPrompt;

        this.addClientCommands();
        this.repl.setPrompt(prompt);
        this.repl.resume();
        this.repl.write('', { name: 'return' });
    }

    /**
     * Add REPL commands. This commands will 
     * be available under the dot commands
     * alongside native commands like:
     * - .help
     * 
     */
    addClientCommands() {
        const conn = this;

        this.repl.defineCommand('clean', {
            help: 'Acknowledge dirty prompt',
            action() {
                conn.setCleanPrompt();
                this.displayPrompt();
            }
        });
    }

    onExit() {
        this.repl.removeAllListeners();
        this.socket.end();
        this.emit('exit');
    }

    onClose() {
        this.socket.removeAllListeners();
        this.socket.destroy();
        this.socket = null;
        this.repl = null;
    }

    /**
     * Sets the repl's context. If `update`
     * is true, we will reset the context and
     * set the client's prompt to a dirty state.
     * 
     * @param {Object} context Object
     * @param {Boolean} update 
     */
    setContext(context, update=false) {
        if(update) this.repl.resetContext();
        
        Object.keys(context).map((key) => {
            this.repl.context[key] = context[key];
        });

        if(upate) this.setDirtyPrompt();
    }

    /**
     * Set connection prompt to
     * reflect dirty state. 
     * This will happen when we update the
     * context.
     */
    setDirtyPrompt() {
        this.repl.setPrompt(this.dirtyPrompt);
    }

    /**
     * Restore prompt to default value.
     */
    setCleanPrompt() {
        this.repl.setPrompt(this.prompt);
    }
}

Connection.DEFAULTS = {
    startConnection: function (config) {
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
            ignoreUndefined: true,
            replMode: require('repl').REPL_MODE_STRICT
        }
    }
};

module.exports = Connection;
