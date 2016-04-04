import RequestContext, {
    Request,
    FileReference,
    KeyValue,
    SchemaReference,
    Schema,
    Response,
    Group
} from './immutables/RequestContext'

import {
    BasicAuth,
    DigestAuth,
    NTLMAuth,
    NegotiateAuth,
    ApiKeyAuth,
    OAuth1Auth,
    OAuth2Auth
} from './immutables/Auth'

import SwaggerParser from 'importers/swagger/Parser'
import CurlParser from 'importers/swagger/Parser'

export default RequestContext
export {
    Request,
    FileReference,
    KeyValue,
    SchemaReference,
    Schema,
    Response,
    Group
}
export const Auth = {
    Basic: BasicAuth,
    Digest: DigestAuth,
    NTLM: NTLMAuth,
    Negotiate: NegotiateAuth,
    ApiKey: ApiKeyAuth,
    OAuth1: OAuth1Auth,
    OAuth2: OAuth2Auth
}
export const Parser = {
    Swagger: SwaggerParser,
    Curl: CurlParser
}
