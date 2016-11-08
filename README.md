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

### from npm (not yet available)

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
node ./lib/api-flow.js some_swagger.json -f swagger -t raml > converted.yml
```

### User Interface

API-Flow is the main component of [Console.REST](https://github.com/luckymarmot/console-rest). If you're an API user, you can easily use [https://console.rest/](https://console.rest/) to convert API description files. If you're an API provider, you can add a button to your API docs to let your users open and play with your API in client apps including Paw or Postman.

## Contributing

PRs are welcomed!
We require that organizations that want to extend API-Flow to support their format write both a parser and a serializer, and not simply a serializer.

## License

This repository is released under the [MIT License](LICENSE). Feel free to fork, and modify!
Copyright © 2016 Paw Inc.

## Contributors

See [Contributors](https://github.com/luckymarmot/API-Flow/graphs/contributors).
