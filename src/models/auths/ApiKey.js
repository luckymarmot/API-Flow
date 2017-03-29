import { Record } from 'immutable'

import Model from '../ModelInfo'

/**
 * Metadata about the ApiKeyAuth Record.
 * Used for internal serialization and deserialization
 */
const modelInstance = {
  name: 'api-key.auth.models',
  version: '0.1.0'
}
const model = new Model(modelInstance)

/**
 * Default Spec for the ApiKeyAuth Record.
 */
const ApiKeyAuthSpec = {
  _model: model,
  description: null,
  authName: null,
  name: null,
  in: null,
  key: null
}

/**
 * The ApiKeyAuth Record
 */
export class ApiKeyAuth extends Record(ApiKeyAuthSpec) { }
export default ApiKeyAuth
