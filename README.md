# Poke REPL

Remote REPL client and server

## Getting Started
Install the module with: `npm install poke-repl`

```javascript
const repl = new REPL(config);
repl.start();
```

## Documentation

#### Firewall

Barebones IP firewall so you can limit connections to internal subnets. Use alongside with authentication.


Rules:

```js
const config = {
    firewall: {
        rules: [
            { ip: '', subnet: 14, rule: 'ACCEPT' }
        ]
    }
};
```

Policy:

```js
const config = {
    firewall: {
        policy: 'ACCEPT'
    }
};
```
#### Authentication

Currently it only supports basic auth.

```js
const config = {
    auth: {
        seed: require('poke-repl/lib/utils').generateSeed(),
        enabled: true,
        users:[{
            username: 'admin', password: 'secret!'
        }]
    }
};
```


## Examples
_(Coming soon)_

## Roadmap
- [ ] Make backoff mechanism, prevent too many connections.
- [x] Add firewall:
    - [ ] Monitor repeated connections from same remoteAddress.
- [x] Move auth to middleware:
    - [ ] Monitor repeated connections from same remoteAddress.
- [x] Move firewall to middleware.
- [x] Make banner a config option:
    - [ ] Ensure we can remove banner.
- [ ] Collect all sockets, then repl.stop sockets.map sock.end.

## Release History
* 2016-08-16 v0.5.0 Remove unused dependencies
* 2016-08-16 v0.4.0 Refactoring
* 2016-08-09 v0.3.0 Added firewall
* 2016-08-08 v0.2.0 Fix bug/typo
* 2016-08-08 v0.1.0 initial release

## License
Copyright (c) 2016 goliatone  
Licensed under the MIT license.

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).



<!--
https://github.com/martinj/node-net-repl/blob/master/lib/repl.js
https://github.com/dshaw/replify

http://www.lihaoyi.com/post/BuildyourownCommandLinewithANSIescapecodes.html
-->
