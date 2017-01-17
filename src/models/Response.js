/* eslint-disable max-nested-callbacks */
import { Record, Map, List } from 'immutable'

import Model from './ModelInfo'
import ParameterContainer from './ParameterContainer'

/**
 * Metadata about the Response Record.
 * Used for internal serialization and deserialization
 */
const modelInstance = {
  name: 'response.core.models',
  version: '0.1.0'
}
const model = new Model(modelInstance)

/**
 * Default Spec for the Response Record.
 */
const ResponseSpec = {
  _model: model,
  code: null,
  description: null,
  examples: null,
  parameters: new ParameterContainer(),
  contexts: List(),
  interfaces: Map()
}

/**
 * The Response Record
 */
export const Response = Record(ResponseSpec)

export default Response
