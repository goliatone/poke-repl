# Poke REPL

Remote REPL client and server

## Getting Started
Install the module with: `npm install poke-repl`

```javascript
var repl = new REPL(config);
repl.start();
```

## Documentation

#### Firewall
Barebones IP firewall so you can limit connections to internal subnets. Use alongside with authentication.


Rules:

```js
var config = {
    firewall: {
        rules: [
            {ip: '', subnet: 14, rule: 'ACCEPT'}
        ]
    }
};
```

Policy:
```
var config = {
    firewall: {
        policy: 'ACCEPT'
    }
};
```
#### Authentication
Currently it only supports basic auth.

```
var config = {
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
- [x] Add firewall
- [ ] Move auth to middleware
- [ ] Move firewall to middleware
- [ ] Make banner a config option.

## Release History
* 2016-08-09 v0.3.0 Added firewall
* 2016-08-08 v0.2.0 Fix bug/typo
* 2016-08-08 v0.1.0 initial release

## License
Copyright (c) 2016 goliatone  
Licensed under the MIT license.

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).
