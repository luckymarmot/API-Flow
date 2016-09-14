import SwaggerParser from '../parsers/swagger/Parser'
import RAMLParser from '../parsers/raml/Parser'
import PostmanParserV1 from '../parsers/postman/v1/Parser'
import PostmanParserV2 from '../parsers/postman/v2/Parser'
import CurlParser from '../parsers/curl/Parser'

import SwaggerSerializer from '../serializers/swagger/Serializer'
import RAMLSerializer from '../serializers/raml/Serializer'
import PostmanSerializer from '../serializers/postman/Serializer'
import CurlSerializer from '../serializers/cURL/Serializer'

import ContextResolver from '../resolvers/ContextResolver'
import BrowserEnvironment, {
    URLResolver
} from '../models/environments/BrowserEnvironment'

import Options from '../models/options/Options'

export default class FlowWorker {
    constructor() {
        this.transformQueue = []
        this.detectQueue = []
    }

    detect(content) {
        let parserMap = {
            swagger: SwaggerParser,
            raml: RAMLParser,
            'postman-1': PostmanParserV1,
            'postman-2': PostmanParserV2,
            curl: CurlParser
        }

        let score = {}

        let parsers = Object.keys(parserMap)
        for (let parser of parsers) {
            let _parser = new parserMap[parser]()
            score[parser] = _parser.detect(content)
        }

        return score
    }

    transform(input, callback, _opts) {
        let parserMap = {
            swagger: SwaggerParser,
            raml: RAMLParser,
            'postman-1': PostmanParserV1,
            'postman-2': PostmanParserV2,
            curl: CurlParser
        }

        let serializerMap = {
            swagger: SwaggerSerializer,
            raml: RAMLSerializer,
            'postman-2': PostmanSerializer,
            curl: CurlSerializer
        }

        let opts = new Options(_opts)

        let source = opts.getIn([ 'parser', 'name' ])
        let target = opts.getIn([ 'serializer', 'name' ])
        let base = opts.getIn([ 'resolver', 'base' ])

        if (!parserMap[source]) {
            throw new Error('unrecognized source format')
        }

        if (!serializerMap[target]) {
            throw new Error('unrecognized target format')
        }

        let url = null
        let contentPromise
        if (base === 'raw') {
            contentPromise = new Promise((resolve) => {
                return resolve(input)
            })
        }
        else {
            contentPromise = (new URLResolver()).resolve(input)
            url = input
        }

        let parser = new parserMap[source]()
        let serializer = new serializerMap[target]()
        let environment = new BrowserEnvironment()
        let resolver = new ContextResolver(environment)

        contentPromise.then((content) => {
            let item = {
                url: url,
                content: content
            }

            let promise = parser.parse(item, opts.get('parser'))

            if (typeof promise.then !== 'function') {
                let value = promise
                promise = new Promise((resolve) => {
                    resolve(value)
                })
            }

            promise.then(context => {
                resolver.resolveAll(
                    parser.item,
                    context,
                    opts.get('resolver')
                ).then(_context => {
                    try {
                        let final = serializer
                            .serialize(
                                _context,
                                opts.get('serializer')
                            )
                        let error = serializer.validate(final)
                        // console.log('@final ----', final)
                        callback(error, final)
                    }
                    catch (e) {
                        callback(e.stack, null)
                    }
                }).catch(error => {
                    callback(error.stack)
                })
            }, error => {
                callback(error.stack)
            }).catch(err => {
                callback(err.stack)
            })
        })
    }

    generateTransformResponseCallback(content, otherArgs) {
        return function(err, data) {
            if (!err) {
                self.postMessage({
                    action: 'transform',
                    success: true,
                    generated: data,
                    ...otherArgs
                })
            }
            else {
                self.postMessage({
                    action: 'transform',
                    success: false,
                    error: JSON.stringify(err),
                    generated: data,
                    ...otherArgs
                })
            }
        }
    }

    validateArguments(args) {
        let isValid =
            args.content &&
            [ 'remote', 'raw' ]
                .indexOf((args.contentType || '').toLowerCase()) >= 0 &&
            [ 'swagger', 'raml', 'postman', 'curl' ]
                .indexOf((args.sourceFormat || '').toLowerCase()) >= 0 &&
            [ 'paw', 'swagger', 'raml', 'postman', 'curl' ]
                .indexOf((args.sourceFormat || '').toLowerCase()) >= 0
        return isValid
    }

    /*
        args: {
            content: (url | string)
            contentType: (enum: ["remote", "raw"])
            sourceFormat (enum: [
                "swagger",
                "raml",
                "postman-1",
                "postman-2",
                "curl"
            ])
            targetFormat (enum: ["paw", "swagger", "raml", "postman-2", "curl"])
            resolutionOptions: {
                local: Boolean(true),
                remote: Boolean(true),
                custom: [ParameterResolutionOption | ReferenceResolutionOption]
            }
        }

        ParameterResolutionOption: {
            key: '*',
            value: *''
        }

        ReferenceResolutionOption: {
            uri: '*',
            resolve: Boolean(true),
            value: '*'
        }
    */
    processTransformArguments(args) {
        let valid = this.validateArguments(args)
        if (!valid) {
            return null
        }

        let {
            content,
            resolutionOptions,
            sourceFormat,
            contentType,
            targetFormat,
            ...other
        } = args

        let flowOptions = {
            parser: {
                name: sourceFormat
            },
            resolver: {
                base: contentType,
                resolve: resolutionOptions
            },
            serializer: {
                name: targetFormat
            }
        }

        let callback = this.generateTransformResponseCallback(content, other)
        return [ content, callback, flowOptions ]
    }

    processDetectArguments(parameters) {
        if (!parameters.content) {
            return null
        }

        let { content, ...other } = parameters

        return [ content, other ]
    }

    processArguments(args) {
        let { action, ...parameters } = args
        if (action === 'transform') {
            return [ action, this.processTransformArguments(parameters) ]
        }
        else if (action === 'detect') {
            return [ action, this.processDetectArguments(parameters) ]
        }
        return [ null, null ]
    }

    processTransformQueue() {
        while (this.transformQueue.length > 0) {
            let query = this.transformQueue.shift()
            this.transform(...query)
        }
    }

    processDetectQueue() {
        while (this.detectQueue.length > 0) {
            let [ content, otherArgs ] = this.detectQueue.shift()
            let scores = this.detect(content)
            self.postMessage({
                action: 'detect',
                success: true,
                generated: scores,
                ...otherArgs
            })
        }
    }

    onMessage(msg) {
        if (arguments.length > 0) {
            let [ action, query ] = this.processArguments(msg.data)
            if (query) {
                if (action === 'transform') {
                    this.transformQueue.push(query)
                    this.processTransformQueue()
                }
                else if (action === 'detect') {
                    this.detectQueue.push(query)
                    this.processDetectQueue()
                }
                else {
                    self.postMessage({
                        success: false,
                        error: 'invalid action',
                        ...msg.data
                    })
                }
            }
            else {
                self.postMessage({
                    success: false,
                    error: 'invalid query',
                    ...msg.data
                })
            }
        }
        else {
            self.postMessage({
                success: false,
                error: 'no query provided',
                ...msg.data
            })
        }
    }
}

let worker = new FlowWorker()
self.onmessage = function() {
    worker.onMessage.apply(worker, arguments)
}
