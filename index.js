import RequestContext, {
    Request,
    FileReference,
    KeyValue,
    SchemaReference,
    Schema,
    Response,
    Group
} from './immutables/'

import {
    BasicAuth,
    DigestAuth,
    NTLMAuth,
    NegotiateAuth,
    ApiKeyAuth,
    OAuth1Auth,
    OAuth2Auth
} from './immutables/Auth'

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
