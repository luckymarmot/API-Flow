import Immutable from 'immutable'

export class BasicAuth extends Immutable.Record({
    username: null,
    password: null,
    raw: null
}) { }

export class DigestAuth extends Immutable.Record({
    username: null,
    password: null
}) { }

export class NTLMAuth extends Immutable.Record({
    username: null,
    password: null
}) { }

export class NegotiateAuth extends Immutable.Record({
    username: null,
    password: null
}) { }

export class ApiKeyAuth extends Immutable.Record({
    name: null,
    in: null
}) { }

export class OAuth1Auth extends Immutable.Record({
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
    signature: null
}) { }

export class OAuth2Auth extends Immutable.Record({
    flow: null,
    authorizationUrl: null,
    tokenUrl: null,
    scopes: Immutable.List()
}) { }

export class AWSSig4Auth extends Immutable.Record({
    key: null,
    secret: null,
    region: null,
    service: null
}) { }

export class HawkAuth extends Immutable.Record({
    id: null,
    key: null,
    algorithm: null
}) { }
