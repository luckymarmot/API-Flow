import fs from 'fs'
import path from 'path'
import info from '../../package.json'
import { ArgumentParser, RawTextHelpFormatter } from 'argparse'

import Options from '../models/options/Options'

import SwaggerParser from '../parsers/swagger/Parser'
import RAMLParser from '../parsers/raml/Parser'
import PostmanParser from '../parsers/postman/Parser'
import CurlParser from '../parsers/curl/Parser'

import SwaggerSerializer from '../serializers/swagger/Serializer'
import RAMLSerializer from '../serializers/raml/Serializer'
import PostmanSerializer from '../serializers/postman/Serializer'
import CurlSerializer from '../serializers/cURL/Serializer'
import InternalSerializer from '../serializers/internal/Serializer'

import NodeEnvironment, {
    URLResolver
} from '../models/environments/NodeEnvironment'

import BaseFlow from './base-runner'

export default class FlowCLI extends BaseFlow {
    static parsers = {
        swagger: SwaggerParser,
        raml: RAMLParser,
        postman: PostmanParser,
        curl: CurlParser
    }

    static serializers = {
        swagger: SwaggerSerializer,
        raml: RAMLSerializer,
        postman: PostmanSerializer,
        curl: CurlSerializer,
        __internal__: InternalSerializer
    }

    constructor() {
        super(NodeEnvironment, URLResolver)
    }

    getParsers() {
        return FlowCLI.parsers
    }

    getSerializers() {
        return FlowCLI.serializers
    }

    load(input, opts) {
        let url = null
        let contentPromise
        const base = opts.getIn([ 'resolver', 'base' ])

        if (base === 'raw') {
            contentPromise = new Promise((resolve) => {
                return resolve(input)
            })
        }
        else if (base === 'local') {
            let _path = path.resolve('./', input)
            contentPromise = new Promise((resolve, reject) => {
                fs.readFile(_path, (err, data) => {
                    if (err) {
                        return reject(err)
                    }

                    resolve(data.toString())
                })
            })
        }
        else {
            contentPromise = (new this.URLResolver()).resolve(input)
            url = input
        }

        return contentPromise.then(content => {
            return {
                url,
                content
            }
        })
    }

    getFormat(input, opts) {
        return this.load(input, opts).then(({ content }) => {
            return content
        }).then((content) => {
            return this.detectFormat(content)
        })
    }

    getName(input, opts) {
        return this.load(input, opts).then(({ content }) => {
            return content
        }).then((content) => {
            return this.detectName(content)
        })
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

        parser.addArgument([ '-d', '--detect-format' ], {
            metavar: 'file',
            help:
                'If this option is set, returns the format of the input file',
            nargs: 0,
            action: 'storeTrue'
        })

        parser.addArgument([ '-n', '--detect-name' ], {
            metavar: 'file',
            help:
                'If this option is set, returns the name of the input file',
            nargs: 0,
            action: 'storeTrue'
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
            choices: [ 'swagger', 'raml', 'postman', 'curl' ],
            nargs: 1,
            action: 'store'
        })

        parser.addArgument([ '-t', '--to' ], {
            metavar: 'format',
            help:
                'The format of the destination file',
            choices: [ 'swagger', 'raml', 'postman', 'curl' ],
            defaultValue: [ 'swagger' ],
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
        const args = parser.parseArgs()

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
            config = config
                .setIn([ 'parser', 'name' ], args.from[0])
                .setIn([ 'parser', 'isDefault' ], false)
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

        let action = 'transform'
        if (args.detect_format) {
            action = 'format'
        }

        else if (args.detect_name) {
            action = 'name'
        }

        this.action = action
    }

    run(_input, _options, _callback) {
        let callback = _callback
        if (!callback) {
            callback = (data) => {
                /* eslint-disable no-console */
                console.log(data)
                /* eslint-enable no-console */
            }
        }

        const actionMap = {
            format: ::this.getFormat,
            name: ::this.getName,
            transform: ::this.transform
        }

        let actor = actionMap[this.action]
        if (!actor) {
            return new Error('Unknown action: ', this.action)
        }

        const input = _input || this.input
        const options = _options || this.options

        return actor(input, options).then(callback).catch(e => {
            /* eslint-disable no-console */
            console.error('error ..', e, e.stack)
            /* eslint-enable no-console */
        })
    }
}
