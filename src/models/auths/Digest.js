import { Record } from 'immutable'

import Model from '../ModelInfo'

/**
 * Metadata about the DigestAuth Record.
 * Used for internal serialization and deserialization
 */
const modelInstance = {
  name: 'digest.auth.models',
  version: '0.1.0'
}
const model = new Model(modelInstance)

/**
 * Default Spec for the DigestAuth Record.
 */
const DigestAuthSpec = {
  _model: model,
  description: null,
  authName: null,
  username: null,
  password: null
}

/**
 * The DigestAuth Record
 */
export class DigestAuth extends Record(DigestAuthSpec) { }
export default DigestAuth
