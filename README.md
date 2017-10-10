[![Build Status](https://travis-ci.org/luckymarmot/API-Flow.svg?branch=master)](https://travis-ci.org/luckymarmot/API-Flow)

# API-Flow

A flow written in ES6 using Immutable to convert between API description formats (Swagger, etc.) and other programs such as cURL command lines.

## What formats are supported and what will be in the future
We currently support:
- `Swagger v2.0 (in/out)`
- `RAML v1.0 (in/out)`
- `Postman Collection v2.0 (in/out)`
- `Paw v3.1 (in/out)`

We intend to support:
- `Swagger v3.0`
- `RAML v0.8`
- `Postman Collection v1.0`
- `Postman Dump v1.0`
- `Insomnia v3.0`
- `Api-Blueprint`
- and many more.

## Installation
### from a cloned repository

just run

```sh
git clone https://github.com/luckymarmot/API-Flow.git
cd API-Flow
make install
```

This will install the node module dependencies

## Building the different libraries
### node, web, and webworker

run the following command to build API-Flow for the different environments that you need

```sh
# use TARGET="node" if you only want the node library
make runners TARGET="node web webworker"
```

### Paw

You can use the following command to add the different extensions to Paw

```sh
# use TARGET="swagger" if you only want the swagger bindings
make transfer TARGET="swagger raml1 postman2"
```

## Using the npm module
### as a standard library

```js
const ApiFlow = require('api-flow'); // if from npm
const ApiFlow = require('./dist/node/api-flow.js'); // if from `make runners TARGET="node"`

const options = {
    source: {
        format: 'swagger',
        version: 'v2.0'
    },
    target: {
        format: 'raml',
        version: 'v1.0'
    }
}

const promise = ApiFlow.transform({
  options,
  uri: path.resolve(__dirname, './my_super_swagger.yml')
})

promise.then((data) => {
  // do some cool stuff with the data
})
```

### Using as a CLI (coming soon)
```sh
node ./bin/api-flow.js some_swagger.json -f swagger -t raml > converted.yml
```

### User Interface

API-Flow is one of the main components of [Console.REST](https://github.com/luckymarmot/console-rest). If you're an API user, you can easily use [https://console.rest/](https://console.rest/) to convert API description files. If you're an API provider, you can add a button to your API docs to let your users open and play with your API in client apps including Paw or Postman.

## Contributing

PRs are welcomed!
Our sole requirement is that organizations that want to extend API-Flow to support their format write both a parser and a serializer, and not simply a serializer.

## Documentation
You can find more information about the internal structure of API-Flow in [src](https://github.com/JonathanMontane/API-Flow/tree/develop/src). We've also created a set of templates to help speed up the extension process: [loader](https://github.com/JonathanMontane/API-Flow/tree/develop/src/loaders/template/v1.0), [parser](https://github.com/JonathanMontane/API-Flow/tree/develop/src/parsers/template/v1.0/), and [environment](https://github.com/JonathanMontane/API-Flow/tree/develop/src/environments/template)

## License

This repository is released under the [MIT License](LICENSE). Feel free to fork, and modify!
Copyright © 2016 Paw Inc.

## Contributors

See [Contributors](https://github.com/JonathanMontane/API-Flow/graphs/contributors).
