import Immutable from 'immutable'

import { BasicAuth, DigestAuth, NTLMAuth, NegotiateAuth, OAuth1Auth, OAuth2Auth } from './Auth'

export class FileReference extends Immutable.Record({
  filepath: null,
  convert: null
}) { }

export class KeyValue extends Immutable.Record({
  key: null,
  value: null
}) { }

export default class Request extends Immutable.Record({
  url: null,
  method: null,
  headers: Immutable.OrderedMap(),
  bodyType: null,
  bodyString: null,
  body: null,
  auth: null,
  timeout: null
}) {

  setAuthType(authType) {
    const authMethods = {
      basic : BasicAuth,
      digest : DigestAuth,
      ntlm : NTLMAuth,
      negotiate : NegotiateAuth,
      oauth1 : OAuth1Auth,
      oauth2 : OAuth2Auth
    }

    let auth = this.get('auth')

    if (authMethods[authType] === undefined) {
      throw new Error('Unsupported Authentication Method : ' + authType)
    }

    auth = new authMethods[authType]()
    return this.set('auth', auth)
  }

  setAuthParams(authParams) {
    let auth = this.get('auth')
    
    //If AuthType was not set beforehand, assume BasicAuth
    if (auth == null) {
      auth = new BasicAuth()
    }

    auth = auth.merge(authParams)
    return this.set('auth', auth)
  }
}
