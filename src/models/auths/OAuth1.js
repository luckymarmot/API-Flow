import { Record } from 'immutable'

import Model from '../ModelInfo'

/**
 * Metadata about the OAuth1Auth Record.
 * Used for internal serialization and deserialization
 */
const modelInstance = {
  name: 'oauth-1.auth.models',
  version: '0.1.0'
}
const model = new Model(modelInstance)

/**
 * Default Spec for the OAuth1Auth Record.
 */
const OAuth1AuthSpec = {
  _model: model,
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
}

/**
 * The OAuth1Auth Record
 */
export class OAuth1Auth extends Record(OAuth1AuthSpec) { }
export default OAuth1Auth
