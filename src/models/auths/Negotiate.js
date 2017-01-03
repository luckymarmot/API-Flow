import { Record } from 'immutable'

import Model from '../ModelInfo'

/**
 * Metadata about the NegotiateAuth Record.
 * Used for internal serialization and deserialization
 */
const modelInstance = {
  name: 'negotiate.auth.models',
  version: '0.1.0'
}
const model = new Model(modelInstance)

/**
 * Default Spec for the NegotiateAuth Record.
 */
const NegotiateAuthSpec = {
  _model: model,
  description: null,
  authName: null,
  username: null,
  password: null
}

/**
 * The NegotiateAuth Record
 */
export class NegotiateAuth extends Record(NegotiateAuthSpec) { }
export default NegotiateAuth
