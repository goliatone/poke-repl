class EverSocket extends Socket{
    constructor(options){
        super(options);
        this.setTimeout(options.timeout || 0);

        this._retry = {
            wait: options.reconnectWait || 1000,
            onTimeout: options.reconnectOnTimeout || 0,
            waiting: false
        };

        this._destroyed = false;

        this._setup();
    }

    _setup(){
        //console.log('setup');
        if(!this._closeListener){
            //console.log('register on close');
            this._closeListener = () => {
                //console.log('close!');
                this.reconnect();
            };
            this.on('close', this._closeListener);
        }
        this._setupTimeoutListener();
    }

    _setupTimeoutListener(){
        if(this._destroyed) return;
        //console.log('setup timeout listener');
        if(this._retry.onTimeout && !this._timeoutListener){
            //console.log('register on timeout');
            this._timeoutListener = () => {
                //console.log('on timeout listener');
                this.reset();
                this.reconnect();
            };
            this.on('timeout', this._timeoutListener);
        } else if(!this._retry.onTimeout && this._timeoutListener){
            this.removeListener('timeout', this._timeoutListener);
            this._timeoutListener = null;
        }
    }

    destroy(){
        //console.log('destroy');
        this._destroyed = true;
        if(this._timeoutListener) {
            this.removeListener('timeout', this._timeoutListener);
            this._timeoutListener = null;
        }
        if(this._closeListener) {
            this.removeListener('close', this._closeListener);
            this._closeListener = null;
        }
        super.destroy();
    }

    reset(){
        //console.log('reset');
        this._destroyed = false;
        this.retry.waiting = false;
        super.destroy();
    }

    reconnect(){
        //console.log('reset');
        var self = this;
        function doReconnect(){
            //console.log('do reconnect');
            if(self._retry.waiting || self._destroyed) return;

            self._retry.waiting = true;
            function connectListener(){
                //console.log('connect listener');
                self.removeListener('error', errorListener);
                self.emit('reconnect');
                self._retry.waiting = false;
            }

            function errorListener(){
                //console.log('error listener');
                self.removeListener('connect', connectListener);
                self._retry.waiting = false;
            }

            self.once('error', errorListener);
            self.once('connect', connectListener);

            self._setup();
            self.connect();
        }

        setTimeout(doReconnect, this.reconnectWait);
    }

    connect(...args){
        //console.log('connect', args);

        var self = this,
            callback,
            host,
            port;
        args.map((arg) => {
            var type = typeof arg;
            switch(type){
                case 'number':
                    port = arg;
                    break;
                case 'string':
                    host = arg;
                    break;
                case 'function':
                    callback = arg;
                    break;
                case 'undefined':
                    break;
                default:
                    self.emit('error', new TypeError('Wrong Argument'));
            }
        });

        this.port = port || this.port;
        this.host = host || this.host || '127.0.0.1';
        args = this.port ? [this.port, this.host] : [this.host];

        if(callback) args.push(callback);
        //console.log('connect parsed', args);
        super.connect.apply(this, args);
    }

    set reconnectWait(ms){
        this._retry.wait = ms;
    }

    get reconnectWait(){
        return this._retry.wait;
    }

    set reconnectOnTimeout(reconnect){
        this._retry.onTimeout = reconnect;
        this._setupTimeoutListener();
    }

    get reconnectOnTimeout(){
        return this._retry.onTimeout;
    }
}
