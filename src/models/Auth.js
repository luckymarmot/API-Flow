import Immutable from 'immutable'

import Model from './ModelInfo'

export class BasicAuth extends Immutable.Record({
    _model: new Model({
        name: 'basic.auth.models',
        version: '0.1.0'
    }),
    description: null,
    authName: null,
    username: null,
    password: null,
    raw: null
}) { }

export class DigestAuth extends Immutable.Record({
    _model: new Model({
        name: 'digest.auth.models',
        version: '0.1.0'
    }),
    description: null,
    authName: null,
    username: null,
    password: null
}) { }

export class NTLMAuth extends Immutable.Record({
    _model: new Model({
        name: 'ntlm.auth.models',
        version: '0.1.0'
    }),
    description: null,
    authName: null,
    username: null,
    password: null
}) { }

export class NegotiateAuth extends Immutable.Record({
    _model: new Model({
        name: 'negotiate.auth.models',
        version: '0.1.0'
    }),
    description: null,
    authName: null,
    username: null,
    password: null
}) { }

export class ApiKeyAuth extends Immutable.Record({
    _model: new Model({
        name: 'api-key.auth.models',
        version: '0.1.0'
    }),
    description: null,
    authName: null,
    name: null,
    in: null,
    key: null
}) { }

export class OAuth1Auth extends Immutable.Record({
    _model: new Model({
        name: 'oauth-1.auth.models',
        version: '0.1.0'
    }),
    description: null,
    authName: null,
    callback: null,
    consumerSecret: null,
    tokenSecret: null,
    consumerKey: null,
    algorithm: null,
    nonce: null,
    additionalParameters: null,
    timestamp: null,
    token: null,
    version: null,
    signature: null,
    tokenCredentialsUri: null,
    requestTokenUri: null,
    authorizationUri: null
}) { }

export class OAuth2Scope extends Immutable.Record({
    name: null,
    description: null,
    value: null
}) { }

export class OAuth2Auth extends Immutable.Record({
    _model: new Model({
        name: 'oauth-2.auth.models',
        version: '0.1.0'
    }),
    description: null,
    authName: null,
    flow: null,
    authorizationUrl: null,
    tokenUrl: null,
    scopes: Immutable.List()
}) { }

export class AWSSig4Auth extends Immutable.Record({
    _model: new Model({
        name: 'aws-sig-4.auth.models',
        version: '0.1.0'
    }),
    description: null,
    authName: null,
    key: null,
    secret: null,
    region: null,
    service: null
}) { }

export class HawkAuth extends Immutable.Record({
    _model: new Model({
        name: 'hawk.auth.models',
        version: '0.1.0'
    }),
    description: null,
    authName: null,
    id: null,
    key: null,
    algorithm: null
}) { }

const Auth = {
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

export default Auth
