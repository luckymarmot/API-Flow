import { Record } from 'immutable'

import Model from './ModelInfo'

/**
 * Metadata about the Contact Record.
 * Used for internal serialization and deserialization
 */
const modelInstance = {
  name: 'contact.utils.models',
  version: '0.1.0'
}
const model = new Model(modelInstance)

/**
 * Default Spec for the Contact Record.
 */
const ContactSpec = {
  _model: model,
  name: null,
  url: null,
  email: null
}

/**
 * The Contact Record
 */
export class Contact extends Record(ContactSpec) { }
export default Contact
