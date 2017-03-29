import { Record, OrderedMap } from 'immutable'

import Model from './ModelInfo'
import Info from './Info'
import Store from './Store'

/**
 * Metadata about the Api Record.
 * Used for internal serialization and deserialization
 */
const modelInstance = {
  name: 'api.core.models',
  version: '0.1.0'
}
const model = new Model(modelInstance)

/**
 * Default Spec for the Api Record.
 */
const ApiSpec = {
  _model: model,
  resources: new OrderedMap(),
  group: null,
  store: new Store(),
  info: new Info()
}

/**
 * The Api Record
 */
export const Api = Record(ApiSpec)
export default Api
