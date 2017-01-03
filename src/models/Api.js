/* eslint-disable max-nested-callbacks */
import { Record, OrderedMap } from 'immutable'

import Model from './ModelInfo'
import { Info } from './Utils'

/**
 * Metadata about the Api Record.
 * Used for internal serialization and deserialization
 */
const modelInstance = {
  name: 'context.core.models',
  version: '0.1.0'
}
const model = new Model(modelInstance)

/**
 * Default Spec for the Api Record.
 */
const ApiSpec = {
  _model: model,
  requests: new OrderedMap(),
  group: null,
  references: new OrderedMap(),
  info: new Info()
}

/**
 * The Api Record
 */
export const Api = Record(ApiSpec)
export default Api
