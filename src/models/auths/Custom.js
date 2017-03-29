import { OrderedMap, Record } from 'immutable'

import Model from '../ModelInfo'

/**
 * Metadata about the BasicAuth Record.
 * Used for internal serialization and deserialization
 */
const modelInstance = {
  name: 'custom.auth.models',
  version: '0.1.0'
}
const model = new Model(modelInstance)

/**
 * Default Spec for the BasicAuth Record.
 */
const CustomAuthSpec = {
  _model: model,
  description: null,
  authName: null,
  setup: null,
  interfaces: OrderedMap()
}

/**
 * The BasicAuth Record
 */
export class CustomAuth extends Record(CustomAuthSpec) { }
export default CustomAuth
