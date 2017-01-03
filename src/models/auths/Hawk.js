import { Record } from 'immutable'

import Model from '../ModelInfo'

/**
 * Metadata about the HawkAuth Record.
 * Used for internal serialization and deserialization
 */
const modelInstance = {
  name: 'hawk.auth.models',
  version: '0.1.0'
}
const model = new Model(modelInstance)

/**
 * Default Spec for the HawkAuth Record.
 */
const HawkAuthSpec = {
  _model: model,
  description: null,
  authName: null,
  id: null,
  key: null,
  algorithm: null
}

/**
 * The HawkAuth Record
 */
export class HawkAuth extends Record(HawkAuthSpec) { }
export default HawkAuth
