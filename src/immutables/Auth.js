import Immutable from 'immutable'

export class BasicAuth extends Immutable.Record({
  username: null,
  password: null
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

//TODO set correct fields
export class OAuth1Auth extends Immutable.Record({
  username: null,
  password: null
}) { }

//TODO missing scope manipulation
export class OAuth2Auth extends Immutable.Record({
  flow: null,
  authorizationUrl: null,
  tokenUrl: null
}) { }
