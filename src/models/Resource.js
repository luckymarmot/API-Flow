import { List, Map, Record } from 'immutable'

import Model from './ModelInfo'

/**
 * Metadata about the Resource Record.
 * Used for internal serialization and deserialization
 */
const modelInstance = {
  name: 'resource.models',
  version: '0.1.0'
}
const model = new Model(modelInstance)

/**
 * Default Spec for the Resource Record.
 */
const ResourceSpec = {
  _model: model,
  name: null,
  uuid: null,
  endpoints: List(),
  path: null,
  methods: Map(),
  description: null,
  interfaces: Map()
}

/**
 * The Resource Record
 */
export const Resource = Record(ResourceSpec)

export default Resource
