import RequestContext, {
    Request,
    FileReference,
    KeyValue,
    SchemaReference,
    Schema,
    Response,
    Group,
    Environment,
    EnvironmentReference
} from './models/RequestContext'

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

import SwaggerParser from './parsers/swagger/Parser'
import CurlParser from './parsers/cURL/Parser'
import PostmanParser from './parsers/postman/Parser'

export default RequestContext
export {
    Request,
    FileReference,
    KeyValue,
    SchemaReference,
    Schema,
    Response,
    Group,
    Environment,
    EnvironmentReference
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
export const Parser = {
    Swagger: SwaggerParser,
    Curl: CurlParser,
    Postman: PostmanParser
}
