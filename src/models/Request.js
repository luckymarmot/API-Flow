import { List, Record } from 'immutable'

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
  name: null,
  description: null,
  urls: List(),
  method: null,
  parameters: new ParameterContainer(),
  contexts: List(),
  auths: List(),
  responses: List(),
  timeout: null,
  tags: List()
}

export class Request extends Record(RequestSpec) { }
export default Request
