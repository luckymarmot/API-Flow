import { Record } from 'immutable'

import Model from '../ModelInfo'

/**
 * Metadata about the NTLMAuth Record.
 * Used for internal serialization and deserialization
 */
const modelInstance = {
  name: 'ntlm.auth.models',
  version: '0.1.0'
}
const model = new Model(modelInstance)

/**
 * Default Spec for the NTLMAuth Record.
 */
const NTLMAuthSpec = {
  _model: model,
  description: null,
  authName: null,
  username: null,
  password: null
}

/**
 * The NTLMAuth Record
 */
export class NTLMAuth extends Record(NTLMAuthSpec) { }
export default NTLMAuth
