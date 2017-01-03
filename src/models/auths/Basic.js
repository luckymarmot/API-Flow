import { Record } from 'immutable'

import Model from '../ModelInfo'

/**
 * Metadata about the BasicAuth Record.
 * Used for internal serialization and deserialization
 */
const modelInstance = {
  name: 'basic.auth.models',
  version: '0.1.0'
}
const model = new Model(modelInstance)

/**
 * Default Spec for the BasicAuth Record.
 */
const BasicAuthSpec = {
  _model: model,
  description: null,
  authName: null,
  username: null,
  password: null,
  raw: null
}

/**
 * The BasicAuth Record
 */
export class BasicAuth extends Record(BasicAuthSpec) { }
export default BasicAuth
