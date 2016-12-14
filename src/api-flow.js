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

import CurlParser from './parsers/cURL/Parser'
import PostmanParserv1 from './parsers/postman/v1/Parser'
import PostmanParserv2 from './parsers/postman/v1/Parser'
import SwaggerParser from './parsers/swagger/Parser'
import RAMLParser from './parsers/raml/Parser'
import InsomniaParser from './parsers/insomnia/Parser'

import SwaggerSerializer from './serializers/swagger/Serializer'
import RAMLSerializer from './serializers/raml/Serializer'
import PostmanSerializer from './serializers/postman/Serializer'
import InsomniaSerializer from './serializers/insomnia/Serializer'

import ContextResolver from './resolvers/ContextResolver'
import NodeEnvironment from './models/environments/NodeEnvironment'

import Flow from './runners/flow-node'

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
    NodeEnvironment,
    Flow
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
    Curl: CurlParser,
    Postman: {
        v1: PostmanParserv1,
        v2: PostmanParserv2
    },
    RAML: RAMLParser,
    Insomnia: InsomniaParser
}

export const Serializer = {
    Swagger: SwaggerSerializer,
    RAML: RAMLSerializer,
    Postman: PostmanSerializer,
    Insomnia: InsomniaSerializer
}

if (require.main === module) {
    let flow = new Flow()

    let parser = flow._createParser()
    flow.processArguments(parser)

    flow.run(null, null, null, true)
}
