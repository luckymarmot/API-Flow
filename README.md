[![Build Status](https://travis-ci.org/luckymarmot/API-Flow.svg?branch=master)](https://travis-ci.org/luckymarmot/API-Flow)

# API Flow

A flow written in ES6 using Immutable to convert between API description formats (Swagger, etc.) and other programs such as cURL command lines.

## Installation
### from a cloned repository
just run

```sh
git clone https://github.com/luckymarmot/API-Flow.git
make install
```

This will install the node module dependencies and create the lib folder from which you will be able to run the cli.

### from npm
just run

```sh
npm install api-flow
```

## Using the npm module
### as a standard library
```js
var Flow = require('api-flow').Flow;

var options = {
    parser: {
        name: 'raml'
    },
    serializer: {
        name: 'swagger'
    }
}

var callback = function(data) {
    // display data
}

var flow = new Flow()
var promise = flow.run('my_super_raml.yml', options, callback)

promise.then(function(data) {
    // do some cool stuff with the data
})
```
### Using as a CLI
```sh
node ./node_modules/lib/api-flow.js some_swagger.json -f swagger -t raml > converted.yml
```
## License

This repository is released under the [MIT License](LICENSE). Feel free to fork, and modify!

Copyright © 2016 Paw Inc.

## Contributors

See [Contributors](https://github.com/luckymarmot/API-Flow/graphs/contributors).
