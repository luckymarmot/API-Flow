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

export default class FlowBrowser {
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
            raml: RAMLParser
        }

        let serializerMap = {
            swagger: SwaggerSerializer,
            raml: RAMLSerializer,
            postman: PostmanSerializer,
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

        return contentPromise.then((content) => {
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
                        callback(null, final)
                        return final
                    }
                    catch (e) {
                        callback(e.stack, null)
                        throw e
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
}
