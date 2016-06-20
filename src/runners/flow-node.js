import fs from 'fs'
import path from 'path'
import info from '../../package.json'
import { ArgumentParser, RawTextHelpFormatter } from 'argparse'

import Options from '../models/options/Options'

import SwaggerParser from '../parsers/swagger/Parser'
import RAMLParser from '../parsers/raml/Parser'
import PostmanParser from '../parsers/postman/Parser'

import SwaggerSerializer from '../serializers/swagger/Serializer'
import RAMLSerializer from '../serializers/raml/Serializer'
import PostmanSerializer from '../serializers/postman/Serializer'

import ContextResolver from '../resolvers/ContextResolver'
import NodeEnvironment from '../models/environments/NodeEnvironment'

export default class FlowCLI {
    constructor() {
        this.parser = this._createParser()
        this.processArguments(this.parser)
    }

    _createParser() {
        let parser = new ArgumentParser({
            version: info.version,
            addHelp: true,
            formatterClass: RawTextHelpFormatter,
            description: info.description
        })

        parser.addArgument([ 'source' ], {
            help: 'The source file'
        })

        parser.addArgument([ '-c', '--config' ], {
            metavar: 'path',
            help:
                'The path to a JSON file representing the base options of ' +
                'the command. These values are overriden by config values ' +
                'provided directly as arguments',
            nargs: 1
        })

        parser.addArgument([ '-f', '--from' ], {
            metavar: 'format',
            help:
                'The format of the source file',
            choices: [ 'swagger', 'raml', 'postman-1', 'postman-2' ],
            defaultValue: [ 'swagger' ],
            nargs: 1,
            action: 'store'
        })

        parser.addArgument([ '-t', '--to' ], {
            metavar: 'format',
            help:
                'The format of the destination file',
            choices: [ 'swagger', 'raml', 'postman' ],
            defaultValue: [ 'raml' ],
            nargs: 1,
            action: 'store'
        })

        parser.addArgument([ '-b', '--base' ], {
            metavar: 'location',
            help:
                'The location of the source file. If the location is set to ' +
                'raw, the input source will expect the content instead of a ' +
                'path or url',
            choices: [ 'local', 'remote', 'raw' ],
            defaultValue: [ 'local' ],
            nargs: 1
        })

        parser.addArgument([ '-r', '--ref' ], {
            metavar: [ 'uri', 'solve', 'val' ],
            help:
                'uri:   The uri of the reference\n' +
                'solve: A boolean describing whether to resolve ' +
                'the reference\n' +
                'val:   The value to use for the reference\n' +
                'All 3 parameters are required.',
            nargs: 3,
            action: 'append'
        })

        parser.addArgument([ '-p', '--param' ], {
            metavar: [ 'key', 'val' ],
            help:
                'key: The key of the parameter\n' +
                'val: The value to use for the parameter\n' +
                'Both parameters are required.',
            nargs: 2,
            action: 'append'
        })

        return parser
    }

    processArguments(parser) {
        let args = parser.parseArgs()

        let config = new Options()
        if (args.config) {
            try {
                let baseData = fs.readFileSync(args.config).toString()
                let baseJSON = JSON.parse(baseData)
                config = new Options(baseJSON)
            }
            catch (e) {
                config = new Options()
            }
        }

        if (args.from) {
            config = config.setIn([ 'parser', 'name' ], args.from[0])
        }

        if (args.to) {
            config = config.setIn([ 'serializer', 'name' ], args.to[0])
        }

        if (args.base) {
            config = config.setIn([ 'resolver', 'base' ], args.base[0])
        }

        if (args.ref || args.param) {
            let refs = (args.ref || []).map(ref => {
                return {
                    uri: ref[0],
                    resolve: ref[1],
                    value: ref[2]
                }
            })
            let params = (args.param || []).map(param => {
                return {
                    key: param[0],
                    value: param[1]
                }
            })

            let resolution = config.getIn([ 'resolver', 'resolve' ])
            resolution = resolution.addCustomResolutions(
                refs.concat(params)
            )

            config = config.setIn([ 'resolver', 'resolve' ], resolution)
        }

        this.options = config
        this.input = args.source
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

        let content
        let item
        if (this.options.getIn([ 'resolver', 'base' ]) === 'local') {
            let _path = path.resolve('./', this.input)
            content = fs.readFileSync(_path).toString()
            item = {
                file: {
                    name: path.basename(_path),
                    path: path.dirname(_path)
                },
                content: content
            }
        }
        else {
            content = this.input
            item = {
                file: {
                    name: '',
                    path: path.resolve('.')
                },
                content: content
            }
        }

        let source = this.options.getIn([ 'parser', 'name' ])
        let target = this.options.getIn([ 'serializer', 'name' ])

        if (!parserMap[source]) {
            throw new Error('unrecognized source format')
        }

        if (!serializerMap[target]) {
            throw new Error('unrecognized target format')
        }

        let parser = new parserMap[source]()
        let serializer = new serializerMap[target]()
        let environment = new NodeEnvironment()
        let resolver = new ContextResolver(environment)

        let promise = parser.parse(item, this.options.get('parser'))

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
                context,
                this.options.get('resolver')
            ).then(_context => {
                try {
                    let final = serializer
                        .serialize(_context, this.options.get('serializer'))
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
