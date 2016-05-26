import Context, {
    Parameter,
    ParameterContainer,
    Body,
    Response
} from './models/Core'

import Constraint from './models/Constraint'
import Item from './models/Item'
import Request from './models/Request'
import URL from './models/URL'
import Group from './models/Group'

import _Reference from './models/references/Reference'
import ExoticReference from './models/references/Exotic'
import JSONSchemaReference from './models/references/JSONSchema'
import ReferenceContainer from './models/references/Container'
import ReferenceCache from './models/references/Cache'

import {
    Contact,
    License,
    Info
} from './models/Utils'

import {
    BasicAuth,
    DigestAuth,
    NTLMAuth,
    NegotiateAuth,
    ApiKeyAuth,
    OAuth1Auth,
    OAuth2Auth,
    AWSSig4Auth,
    HawkAuth
} from './models/Auth'

// import CurlParser from './parsers/cURL/Parser'
// import PostmanParser from './parsers/postman/Parser'
import SwaggerParser from './parsers/swagger/Parser'
import RAMLParser from './parsers/raml/Parser'

import SwaggerSerializer from './serializers/swagger/Serializer'
import RAMLSerializer from './serializers/raml/Serializer'

import ContextResolver from './resolvers/ContextResolver'
import NodeEnvironment from './models/environments/NodeEnvironment'

export default Context
export {
    Parameter,
    ParameterContainer,
    Body,
    Response,
    Constraint,
    Item,
    Request,
    URL,
    Contact,
    License,
    Info,
    Group,
    ContextResolver,
    NodeEnvironment
}

export const Auth = {
    Basic: BasicAuth,
    Digest: DigestAuth,
    NTLM: NTLMAuth,
    Negotiate: NegotiateAuth,
    ApiKey: ApiKeyAuth,
    OAuth1: OAuth1Auth,
    OAuth2: OAuth2Auth,
    AWSSig4: AWSSig4Auth,
    Hawk: HawkAuth
}

export const Reference = {
    Reference: _Reference,
    JSONSchema: JSONSchemaReference,
    Exotic: ExoticReference,
    Container: ReferenceContainer,
    Cache: ReferenceCache
}

export const Parser = {
    Swagger: SwaggerParser,
//    Curl: CurlParser,
//    Postman: PostmanParser,
    RAML: RAMLParser
}

export const Serializer = {
    Swagger: SwaggerSerializer,
    RAML: RAMLSerializer
}
/*
import fs from 'fs'
import path from 'path'

class FlowCLI {
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
            raml: RAMLParser
        }

        let serializerMap = {
            swagger: SwaggerSerializer,
            raml: RAMLSerializer
        }

        let _path = path.resolve(__dirname, this.input)
        let content = fs.readFileSync(_path).toString()

        let item = {
            file: {
                name: path.basename(_path),
                path: path.dirname(_path)
            },
            content: content
        }

        console.log('file ->', item.file)

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

        console.log(typeof promise)

        if (typeof promise !== 'function') {
            let value = promise
            promise = new Promise((resolve) => {
                resolve(value)
            })
        }

        promise.then(context => {
            console.log('promise resolved')
            resolver.resolveAll(
                parser.item,
                context.get('references')
            ).then(references => {
                console.log('got references', references)
                try {
                    let final = serializer
                        .serialize(context.set('references', references))
                    console.log('final', final)
                }
                catch (e) {
                    console.log('got error', e)
                }
            }).catch(error => {
                console.err('get error', error)
            })
        })
    }
}

let cli = new FlowCLI(process.argv)
cli.run()
*/
