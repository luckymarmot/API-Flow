import { Record, List } from 'immutable'

import Model from '../ModelInfo'

/**
 * Metadata about the OAuth2Auth Record.
 * Used for internal serialization and deserialization
 */
const modelInstance = {
  name: 'oauth-2.auth.models',
  version: '0.1.0'
}
const model = new Model(modelInstance)

/**
 * Default Spec for the OAuth2Auth Record.
 */
const OAuth2AuthSpec = {
  _model: model,
  description: null,
  authName: null,
  flow: null,
  authorizationUrl: null,
  tokenUrl: null,
  scopes: List()
}

/**
 * The OAuth2Auth Record
 */
export class OAuth2Auth extends Record(OAuth2AuthSpec) { }
export default OAuth2Auth
