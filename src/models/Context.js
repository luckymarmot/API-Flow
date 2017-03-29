import { Record, Map, List } from 'immutable'

import Model from './ModelInfo'
import ParameterContainer from './ParameterContainer'

/**
 * Metadata about the Context Record.
 * Used for internal serialization and deserialization
 */
const modelInstance = {
  name: 'context.core.models',
  version: '0.1.0'
}
const model = new Model(modelInstance)

/**
 * Default Spec for the Context Record.
 */
const ContextSpec = {
  _model: model,
  constraints: List(),
  type: null,
  implements: Map()
}

/**
 * Holds all the internal methods used in tandem with a Context
 */
const methods = {}

/**
 * The Context Record
 */
export class Context extends Record(ContextSpec) {
  filter(paramContainer) {
    return methods.filter(this, paramContainer)
  }
}

/**
 * filters a ParameterContainer based on the constraints in a Context
 * @param {Context} context: the context to get the constraints from
 * @param {ParameterContainer} paramContainer: the ParameterContainer to filter
 * @returns {ParameterContainer} the filtered ParameterContainer
 */
methods.filter = (context, paramContainer) => {
  if (paramContainer instanceof ParameterContainer) {
    return paramContainer.filter(context.get('constraints'))
  }

  return null
}

export const __internals__ = methods
export default Context
