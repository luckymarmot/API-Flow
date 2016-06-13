import fs from 'fs'
import path from 'path'

import SwaggerParser from './parsers/swagger/Parser'
import RAMLParser from './parsers/raml/Parser'
import PostmanParser from './parsers/postman/Parser'

import SwaggerSerializer from './serializers/swagger/Serializer'
import RAMLSerializer from './serializers/raml/Serializer'
import PostmanSerializer from './serializers/postman/Serializer'

import ContextResolver from './resolvers/ContextResolver'
import NodeEnvironment from './models/environments/NodeEnvironment'

export default class FlowCLI {
    constructor(args) {
        this.processArguments(args)
    }

    processArguments(_args) {
        // skip 'node' and 'flow.js' parameters
        let args = _args.slice(2)
        while (args.length > 0) {
            let arg = args.shift()

            if (arg === '--to' || arg === '-t') {
                this.target = args.shift()
            }
            else if (arg === '--from' || arg === '-f') {
                this.source = args.shift()
            }
            else {
                this.input = arg
            }
        }
    }

    run() {
        let parserMap = {
            swagger: SwaggerParser,
            raml: RAMLParser,
            'postman-1': PostmanParser,
            'postman-2': () => { return new PostmanParser('v2') }
        }

        let serializerMap = {
            swagger: SwaggerSerializer,
            raml: RAMLSerializer,
            postman: PostmanSerializer
        }

        let _path = path.resolve('./', this.input)
        let content = fs.readFileSync(_path).toString()

        let item = {
            file: {
                name: path.basename(_path),
                path: path.dirname(_path)
            },
            content: content
        }

        if (!parserMap[this.source]) {
            throw new Error('unrecognized source format')
        }

        if (!serializerMap[this.target]) {
            throw new Error('unrecognized target format')
        }

        let parser = new parserMap[this.source]()
        let serializer = new serializerMap[this.target]()
        let environment = new NodeEnvironment()
        let resolver = new ContextResolver(environment)

        let promise = parser.parse(item)

        if (typeof promise.then !== 'function') {
            let value = promise
            promise = new Promise((resolve) => {
                resolve(value)
            })
        }

        /* eslint-disable no-console */
        promise.then(context => {
            resolver.resolveAll(
                parser.item,
                context.get('references')
            ).then(references => {
                try {
                    let final = serializer
                        .serialize(context.set('references', references))
                    console.log(final)
                }
                catch (e) {
                    console.error('got error', e.stack)
                }
            }).catch(error => {
                console.error('got error', error.stack)
            })
        }, error => {
            console.error('got promise error', error.stack)
        }).catch(err => {
            console.error('caught error', err, err.stack)
        })
        /* eslint-enable no-console */
    }
}

console.error('entry run');
