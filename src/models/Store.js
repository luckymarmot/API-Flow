import { Record, OrderedMap } from 'immutable'

import Model from './ModelInfo'

/**
 * Metadata about the Store Record.
 * Used for internal serialization and deserialization
 */
const modelInstance = {
  name: 'store.models',
  version: '0.1.0'
}
const model = new Model(modelInstance)

/**
 * Default Spec for the Store Record.
 */
const StoreSpec = {
  _model: model,
  variable: new OrderedMap(),
  constraint: new OrderedMap(),
  endpoint: new OrderedMap(),
  parameter: new OrderedMap(),
  response: new OrderedMap(),
  auth: new OrderedMap(),
  interface: new OrderedMap()
}

/**
 * The Store Record
 */
export const Store = Record(StoreSpec)

export default Store
