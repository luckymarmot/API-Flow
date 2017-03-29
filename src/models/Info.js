import { Record } from 'immutable'

import Model from './ModelInfo'

/**
 * Metadata about the Info Record.
 * Used for internal serialization and deserialization
 */
const modelInstance = {
  name: 'info.utils.models',
  version: '0.1.0'
}
const model = new Model(modelInstance)

/**
 * Default Spec for the Info Record.
 */
const InfoSpec = {
  _model: model,
  title: null,
  description: null,
  tos: null,
  contact: null,
  license: null,
  version: null
}

/**
 * The Info Record
 */
export class Info extends Record(InfoSpec) { }
export default Info
