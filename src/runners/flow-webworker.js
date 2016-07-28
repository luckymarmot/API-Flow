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
        this.queue = []
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

        let contentPromise
        if (base === 'raw') {
            contentPromise = new Promise((resolve) => {
                return resolve(input)
            })
        }
        else {
            contentPromise = (new URLResolver()).resolve(input)
        }

        let parser = new parserMap[source]()
        let serializer = new serializerMap[target]()
        let environment = new BrowserEnvironment()
        let resolver = new ContextResolver(environment)

        contentPromise.then((content) => {
            let item = {
                url: input,
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

    generateResponseCallback(content, uuid) {
        return function(err, data) {
            if (!err) {
                self.postMessage({
                    success: true,
                    generated: data,
                    uuid: uuid
                })
            }
            else {
                self.postMessage({
                    success: false,
                    error: JSON.stringify(err),
                    generated: data,
                    uuid: uuid
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
    processArguments(args) {
        let valid = this.validateArguments(args)
        if (!valid) {
            return null
        }

        let content = args.content
        let resolutionOptions = args.resolutionOptions || null
        let flowOptions = {
            parser: {
                name: args.sourceFormat
            },
            resolver: {
                base: args.contentType,
                resolve: resolutionOptions
            },
            serializer: {
                name: args.targetFormat
            }
        }

        let callback = this.generateResponseCallback(content, args.uuid)
        return [ content, callback, flowOptions ]
    }

    processQueue() {
        while (this.queue.length > 0) {
            let query = this.queue.shift()
            this.transform(...query)
        }
    }

    onMessage(msg) {
        if (arguments.length > 0) {
            let query = this.processArguments(msg.data)
            if (query) {
                this.queue.push(query)
                this.processQueue()
            }
            else {
                self.postMessage({
                    success: false,
                    error: 'invalid query',
                    ...msg.data
                })
                // TODO send Invalid Query message
            }
        }
    }
}

let worker = new FlowWorker()
self.onmessage = function() {
    worker.onMessage.apply(worker, arguments)
}
