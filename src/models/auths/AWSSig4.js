import { Record } from 'immutable'

import Model from '../ModelInfo'

/**
 * Metadata about the AWSSig4Auth Record.
 * Used for internal serialization and deserialization
 */
const modelInstance = {
  name: 'aws-sig-4.auth.models',
  version: '0.1.0'
}
const model = new Model(modelInstance)

/**
 * Default Spec for the AWSSig4Auth Record.
 */
const AWSSig4AuthSpec = {
  _model: model,
  description: null,
  authName: null,
  key: null,
  secret: null,
  region: null,
  service: null
}

/**
 * The AWSSig4Auth Record
 */
export class AWSSig4Auth extends Record(AWSSig4AuthSpec) { }
export default AWSSig4Auth
