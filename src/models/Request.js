import { List, Map, Record } from 'immutable'

import Model from './ModelInfo'
import ParameterContainer from './ParameterContainer'

/**
 * Metadata about the Request Record.
 * Used for internal serialization and deserialization
 */
const modelInstance = {
  name: 'request.models',
  version: '0.1.0'
}
const model = new Model(modelInstance)

/**
 * Default Spec for the Request Record.
 */
const RequestSpec = {
  _model: model,
  id: null,
  endpoints: Map(),
  name: null,
  description: null,
  method: null,
  parameters: new ParameterContainer(),
  contexts: List(),
  auths: List(),
  responses: Map(),
  timeout: null,
  tags: List(),
  interfaces: Map()
}

export const Request = Record(RequestSpec)

export default Request
