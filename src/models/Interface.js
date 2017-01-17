import { Record } from 'immutable'

import Model from './ModelInfo'

/**
 * Metadata about the Interface Record.
 * Used for internal serialization and deserialization
 */
const modelInstance = {
  name: 'interface.models',
  version: '0.1.0'
}
const model = new Model(modelInstance)

/**
 * Default Spec for the Interface Record.
 */
const InterfaceSpec = {
  _model: model,
  name: null,
  uuid: null,
  level: null,
  required: false,
  description: null
}

export const Interface = Record(InterfaceSpec)

export default Interface
