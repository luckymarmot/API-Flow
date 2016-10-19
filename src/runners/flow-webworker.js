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

        let scores = []

        let parsers = Object.keys(parserMap)
        for (let parser of parsers) {
            scores = scores.concat(parserMap[parser].detect(content))
        }

        return new Promise((resolve) => {
            resolve(scores)
        })
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
            if (!name) {
                name = proposed
            }
            else if (proposed && proposed.length > name.length) {
                name = proposed
            }
        }

        return new Promise((resolve) => {
            resolve(name)
        })
    }

    transform(input, _opts) {
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
            return new Promise((_, reject) => {
                reject(new Error('unrecognized source format'))
            })
        }

        if (!serializerMap[target]) {
            return new Promise((_, reject) => {
                reject(new Error('unrecognized target format'))
            })
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
                return resolver.resolveAll(
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
                        if (error) {
                            throw error
                        }
                        else {
                            return final
                        }
                    }
                    catch (e) {
                        throw e
                    }
                }).catch(error => {
                    throw error
                })
            }, error => {
                throw error
            }).catch(err => {
                throw err
            })
        }, error => {
            throw error
        })
    }

    validateArguments(args) {
        let isValid =
            args.content &&
            [ 'remote', 'raw' ]
                .indexOf((args.mode || '').toLowerCase()) >= 0 &&
            [ 'swagger', 'raml', 'postman', 'curl' ]
                .indexOf((args.source.format || '').toLowerCase()) >= 0 &&
            [ 'paw', 'swagger', 'raml', 'postman', 'curl' ]
                .indexOf((args.target.format || '').toLowerCase()) >= 0
        return isValid
    }

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

        if (!query) {
            return {
                extraneous
            }
        }

        return {
            action,
            query,
            extraneous
        }
    }

    extractTransformQuery(parameters) {
        let valid = this.validateArguments(parameters)
        if (!valid) {
            return {
                extraneous: parameters
            }
        }

        let {
            content,
            mode,
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
                base: mode,
                resolve: resolutionOptions
            },
            serializer: {
                name: target.format,
                version: target.version
            }
        }

        return {
            query: [ content, flowOptions ],
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
}

let worker = new FlowWorker()
self.onmessage = function() {
    worker.onMessage.apply(worker, arguments)
}
