import { Record } from 'immutable'

import Model from './ModelInfo'

/**
 * Metadata about the License Record.
 * Used for internal serialization and deserialization
 */
const modelInstance = {
  name: 'license.utils.models',
  version: '0.1.0'
}
const model = new Model(modelInstance)

/**
 * Default Spec for the License Record.
 */
const LicenseSpec = {
  _model: model,
  name: null,
  url: null
}

/**
 * The License Record
 */
export class License extends Record(LicenseSpec) { }
export default License
