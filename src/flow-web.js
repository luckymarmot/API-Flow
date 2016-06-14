import SwaggerParser from './parsers/swagger/Parser'
import RAMLParser from './parsers/raml/Parser'

import SwaggerSerializer from './serializers/swagger/Serializer'
import RAMLSerializer from './serializers/raml/Serializer'
import PostmanSerializer from './serializers/postman/Serializer'

import ContextResolver from './resolvers/ContextResolver'
import BrowserEnvironment, {
    URLResolver
} from './models/environments/BrowserEnvironment'

export default class FlowBrowser {
    transform(input, source, target, callback) {
        let parserMap = {
            swagger: SwaggerParser,
            raml: RAMLParser
        }

        let serializerMap = {
            swagger: SwaggerSerializer,
            raml: RAMLSerializer,
            postman: PostmanSerializer
        }

        if (!parserMap[source]) {
            throw new Error('unrecognized source format')
        }

        if (!serializerMap[target]) {
            throw new Error('unrecognized target format')
        }

        let contentPromise = (new URLResolver()).resolve(input)

        let parser = new parserMap[source]()
        let serializer = new serializerMap[target]()
        let environment = new BrowserEnvironment()
        let resolver = new ContextResolver(environment)

        contentPromise.then((content) => {
            let item = {
                url: input,
                content: content
            }

            let promise = parser.parse(item)

            if (typeof promise.then !== 'function') {
                let value = promise
                promise = new Promise((resolve) => {
                    resolve(value)
                })
            }

            promise.then(context => {
                resolver.resolveAll(
                    parser.item,
                    context.get('references')
                ).then(references => {
                    try {
                        let final = serializer
                            .serialize(context.set('references', references))
                        callback(null, final)
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
}

window.APIFlow = FlowBrowser
