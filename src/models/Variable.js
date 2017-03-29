import { Map, Record } from 'immutable'

import Model from './ModelInfo'

/**
 * Metadata about the Variable Record.
 * Used for internal serialization and deserialization
 */
const modelInstance = {
  name: 'variable.models',
  version: '0.1.0'
}
const model = new Model(modelInstance)

/**
 * Default Spec for the Variable Record.
 */
const VariableSpec = {
  _model: model,
  name: null,
  values: Map(),
  defaultEnvironment: null
}

/**
 * The Variable Record
 */
export const Variable = Record(VariableSpec)

export default Variable
