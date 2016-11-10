import SwaggerParser from '../parsers/swagger/Parser'
import RAMLParser from '../parsers/raml/Parser'
import PostmanParser from '../parsers/postman/Parser'
import CurlParser from '../parsers/curl/Parser'

import SwaggerSerializer from '../serializers/swagger/Serializer'
import RAMLSerializer from '../serializers/raml/Serializer'
import PostmanSerializer from '../serializers/postman/Serializer'
import CurlSerializer from '../serializers/cURL/Serializer'
import InternalSerializer from '../serializers/internal/Serializer'

import BaseFlow from './base-runner'

import BrowserEnvironment, {
    URLResolver
} from '../models/environments/BrowserEnvironment'

export default class FlowWorker extends BaseFlow {
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
        super(BrowserEnvironment, URLResolver)
    }

    getParsers() {
        return FlowWorker.parsers
    }

    getSerializers() {
        return FlowWorker.serializers
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
                error = _error.message || _error.name || 'unknown error'
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
                error = _error.message || _error.name || 'unknown error'
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
