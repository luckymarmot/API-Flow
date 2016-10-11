import SwaggerParser from '../parsers/swagger/Parser'
import RAMLParser from '../parsers/raml/Parser'
import PostmanParser from '../parsers/postman/Parser'
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

    detectFormat(content) {
        let parserMap = {
            swagger: SwaggerParser,
            raml: RAMLParser,
            postman: PostmanParser,
            curl: CurlParser
        }

        let score = {}

        let parsers = Object.keys(parserMap)
        for (let parser of parsers) {
            score[parser] = parserMap[parser].detect(content)
        }

        return score
    }

    detectName(content) {
        let parserMap = {
            swagger: SwaggerParser,
            raml: RAMLParser,
            postman: PostmanParser,
            curl: CurlParser
        }

        let name = null
        let parsers = Object.keys(parserMap)
        for (let parser of parsers) {
            let proposed = parserMap[parser].getAPIName(content)
            if (proposed && proposed.length > name.length) {
                name = proposed
            }
        }

        return name
    }

    transform(input, callback, _opts) {
        let parserMap = {
            swagger: SwaggerParser,
            raml: RAMLParser,
            postman: PostmanParser,
            curl: CurlParser
        }

        let serializerMap = {
            swagger: SwaggerSerializer,
            raml: RAMLSerializer,
            postman: PostmanSerializer,
            curl: CurlSerializer
        }

        let opts = new Options(_opts)

        let sourceFormat = opts.getIn([ 'parser', 'name' ])
        let sourceVersion = opts.getIn([ 'parser', 'version' ])
        let target = opts.getIn([ 'serializer', 'name' ])
        let base = opts.getIn([ 'resolver', 'base' ])

        if (!parserMap[sourceFormat]) {
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

        let parser = new parserMap[sourceFormat](sourceVersion)
        let serializer = new serializerMap[target]()
        let environment = new BrowserEnvironment()
        let resolver = new ContextResolver(environment)

        return contentPromise.then((content) => {
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

            return promise.then(context => {
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
                        if (error) {
                            throw error
                        }
                        else {
                            return final
                        }
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
            [ 'swagger', 'raml', 'postman-1', 'postman-2', 'curl' ]
                .indexOf((args.sourceFormat || '').toLowerCase()) >= 0 &&
            [ 'paw', 'swagger', 'raml', 'postman', 'curl' ]
                .indexOf((args.targetFormat || '').toLowerCase()) >= 0
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
        else if (action === 'detectName' || action === 'detectFormat') {
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

    processDetectFormatQueue() {
        while (this.detectNameQueue.length > 0) {
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

    processDetectNameQueue() {
        while (this.detectNameQueue.length > 0) {
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


    /* NEW API */


    extractActionAndQuery(data) {
        let { action, ...parameters } = data

        let extractorMap = {
            transform: ::this.extractTransformQuery,
            detectFormat: ::this.extractDetectFormatQuery,
            detectName: ::this.extractDetectNameQuery
        }

        let extractor = extractorMap[action]

        if (!extractor) {
            return {
                extraneous: data
            }
        }

        let { query, ...extraneous } = extractor(parameters)

        return {
            action,
            query,
            extraneous
        }
    }

    extractTransformQuery(parameters) {
        let valid = this.validateArguments(parameters)
        if (!valid) {
            return null
        }

        let {
            content,
            contentType,
            source,
            target,
            resolutionOptions,
            ...extraneous
        } = parameters

        let flowOptions = {
            parser: {
                name: source.format,
                version: source.version
            },
            resolver: {
                base: contentType,
                resolve: resolutionOptions
            },
            serializer: {
                name: target.format,
                version: target.version
            }
        }

        let callback = this.generateTransformResponseCallback(
            content, extraneous
        )

        return {
            query: [ content, callback, flowOptions ],
            extraneous
        }
    }

    extractDetectFormatQuery(parameters) {
        let { content, ...extraneous } = parameters
        return {
            query: [ content ],
            extraneous
        }
    }

    extractDetectNameQuery(parameters) {
        let { content, ...extraneous } = parameters
        return {
            query: [ content ],
            extraneous
        }
    }

    postSuccess(action, extraneous) {
        return (data) => {
            self.postMessage({
                action,
                success: true,
                result: data,
                ...extraneous
            })
        }
    }

    postError(action, extraneous) {
        return (_error) => {
            let error = _error

            if (_error instanceof Error) {
                error = _error.msg
            }

            self.postMessage({
                action,
                success: false,
                error,
                ...extraneous
            })
        }
    }

    // TODO Handle Failures differently from Errors
    postFailure(action, extraneous) {
        return (_error) => {
            let error = _error

            if (_error instanceof Error) {
                error = _error.msg
            }

            self.postMessage({
                action,
                success: false,
                error,
                ...extraneous
            })
        }
    }

    onMessage(msg) {
        if (msg) {
            let {
                action,
                query,
                extraneous
            } = this.extractActionAndQuery(msg.data)
            if (action && query) {
                let actionMap = {
                    transform: ::this.transform,
                    detectName: ::this.detectName,
                    detectFormat: ::this.detectFormat
                }

                let actor = actionMap[action]
                if (!actor) {
                    // TODO send message about internal conflict
                    let error = 'Internal Error: ' +
                        'ApiFlow did not find any actors for this action ' +
                        'despite validating the action. This should not happen'
                    return this.postFailure(action, extraneous)(error)
                }

                let promise = actor(...query)

                promise
                    .then(
                        this.postSuccess(action, extraneous),
                        this.postError(action, extraneous)
                    )
                    .catch(this.postFailure(action, extraneous))
            }
            else {
                this.postError(action, extraneous)('Unrecognized action')
            }
        }
        else {
            this.postError(null, null)('ApiFlow does not accept empty message')
        }
    }

    /*
    onMessage(msg) {
        if (arguments.length > 0) {
            let [ action, query ] = this.processArguments(msg.data)
            if (query) {
                if (action === 'transform') {
                    this.transformQueue.push(query)
                    this.processTransformQueue()
                }
                else if (action === 'detectFormat') {
                    this.detectFormatQueue.push(query)
                    this.processDetectFormatQueue()
                }
                else if (action === 'detectName') {
                    this.detectNameQueue.push(query)
                    this.processDetectNameQueue()
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
    */
}

let worker = new FlowWorker()
self.onmessage = function() {
    worker.onMessage.apply(worker, arguments)
}
