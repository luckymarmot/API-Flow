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

## Building the different libraries
### node, web, and webworker

run the following command to build the API-Flow for the different environments that you need

```sh
make runners TARGET="node web webworker" // use TARGET="node" if you only want the node library
```

### Paw

You can use the following command to add the different extensions to Paw

```sh
make transfer TARGET="curl swagger raml postman" // use TARGET="swagger" if you only want the swagger bindings
```

## Using the npm module
### as a standard library

```js
const Flow = require('api-flow').default; // if from npm
const Flow = require('./dist/node/api-flow.js').default; // if from `make runners`

const options = {
    parser: {
        name: 'raml'
    },
    serializer: {
        name: 'swagger'
    }
}

const converter = new Flow()
const promise = converter.transform('my_super_raml.yml', options)

promise.then((data) => {
    // do some cool stuff with the data
})
```

### Using as a CLI

```sh
node ./bin/api-flow.js some_swagger.json -f swagger -t raml > converted.yml
```

### User Interface

API-Flow is one of the main components of [Console.REST](https://github.com/luckymarmot/console-rest). If you're an API user, you can easily use [https://console.rest/](https://console.rest/) to convert API description files. If you're an API provider, you can add a button to your API docs to let your users open and play with your API in client apps including Paw or Postman.

## Contributing

PRs are welcomed!
Our sole requirement is that organizations that want to extend API-Flow to support their format write both a parser and a serializer, and not simply a serializer.

## License

This repository is released under the [MIT License](LICENSE). Feel free to fork, and modify!
Copyright © 2016 Paw Inc.

## Contributors

See [Contributors](https://github.com/luckymarmot/API-Flow/graphs/contributors).
