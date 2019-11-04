[![Build Status](https://travis-ci.org/luckymarmot/API-Flow.svg?branch=master)](https://travis-ci.org/luckymarmot/API-Flow)

# API Flow

A library written in ES6 using [Immutable.js](https://facebook.github.io/immutable-js/docs/) to convert between API description formats (including Swagger and RAML) and applications (including Paw and Postman).

## What formats are supported and what will be in the future

We currently support:

- Swagger v2.0 (in/out)
- RAML v1.0 (in/out)
- Postman Collection v2.0 (in/out)
- Paw v3.1 (in/out)

We intend to support:

- Swagger v3.0
- RAML v0.8
- Postman Collection v1.0
- Postman Dump v1.0
- Insomnia v3.0
- API Blueprint
- and many more.

## Installation
### from a cloned repository

just run

```sh
git clone https://github.com/luckymarmot/API-Flow.git
cd API-Flow
yarn install # or npm install
```

This will install the node module dependencies

## Building the different libraries

### As a Library

Run the following command to build API Flow for the different environments that you need:

```sh
# use TARGET=node if you only want the node library
TARGET="node web webworker" make runners
```

Possible target environments are:

| Target      | Description                        |
| ----------- | ---------------------------------- |
| `node`      | Node library                       |
| `web`       | Web browser library                |
| `webworker` | Web library to run in a web worker |

### A a Paw Extension

You can use the following command to add the different extensions to Paw

```sh
# use TARGET=swagger if you only want the swagger bindings
TARGET="swagger raml1 postman2" make transfer
```

Possible targets are:

| Target      | Description                                      |
| ----------- | ------------------------------------------------ |
| `swagger`   | Swagger 2.0 importer and generator               |
| `raml1`     | RAML 1.0 importer and generator                  |
| `postman2`  | Postman Collection 2.0 importer and generator    |

## Using the node module

### As a library

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

### As a CLI
```sh
./node_modules/.bin/babel-node ./bin/api-flow.js some_swagger.json --from swagger --to raml > converted.yml
```

## User Interface

API Flow is one of the main components of [Console.REST](https://github.com/luckymarmot/console-rest). If you're an API user, you can easily use [https://console.rest/](https://console.rest/) to convert API description files. If you're an API provider, you can add a button to your API docs to let your users open and play with your API in client apps including Paw or Postman.

## Formats

| Name | Format | Version |
| ---- | ------ | ------- |
| [Swagger/OAS](https://swagger.io/) | `swagger` | `v2.0` |
| [RAML](https://raml.org/) | `raml` | `v1.0` |
| [Paw](https://paw.cloud) | `paw` | `v3.0` |
| [Postman Collection](https://github.com/postmanlabs/postman-collection) | `postman-collection` | `v2.0` |
| Internal API Flow Data | `internal` | `v1.0` |

## Development

### Testing

```sh
yarn run test # unit tests
yarn run test-e2e # integration (end-to-end) tests
```

### Linting

```sh
yarn run lint
```

### Code coverage

```sh
yarn run coverage
```

## Contributing

PRs are welcomed!
Our sole requirement is that organizations that want to extend API Flow to support their format write both a parser and a serializer, and not simply a serializer.

## Documentation
You can find more information about the internal structure of API Flow in [src](https://github.com/luckymarmot/API-Flow/tree/develop/src). We've also created a set of templates to help speed up the extension process: [loader](https://github.com/luckymarmot/API-Flow/tree/develop/src/loaders/template/v1.0), [parser](https://github.com/luckymarmot/API-Flow/tree/develop/src/parsers/template/v1.0/), and [environment](https://github.com/luckymarmot/API-Flow/tree/develop/src/environments/template)

## License

This repository is released under the [MIT License](LICENSE). Feel free to fork, and modify!
Copyright © 2015-2018 Paw.

## Contributors

See [Contributors](https://github.com/luckymarmot/API-Flow/graphs/contributors).
