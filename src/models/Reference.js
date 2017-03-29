import { Record } from 'immutable'

import Model from './ModelInfo'

const methods = {}

/**
 * Metadata about the Reference Record.
 * Used for internal serialization and deserialization
 */
const modelInstance = {
  name: 'reference.models',
  version: '0.1.0'
}
const model = new Model(modelInstance)

/**
 * Default Spec for the Reference Record.
 * @property {string} type: the type of reference. Used to access the correct store. For instance,
 * if type is 'parameter', then the Parameter store will be access in the Store object.
 * @property {string} uuid: the key to access the desired Object in the store. Does not have to be
 * uuid, so long as it is uniquely defined.
 * @overlay {string} overlay: parameters to apply to the linked object. For instance, assuming this
 * Reference links to an OAuth2 Auth Object, we could have an `overlay` such as:
 * const overlay = new Auth.OAuth2({
 *  scopes: someScopebjects
 * })
 * this would override the scopes defined in the linked OAuth2 Record with the scopes
 * defined in the overlay.
 */
const ReferenceSpec = {
  _model: model,
  type: null,
  uuid: null,
  overlay: null
}

/**
 * The Reference Record
 */
export class Reference extends Record(ReferenceSpec) {
  getLocation() {
    return methods.getLocation(this)
  }

  resolve(store) {
    return methods.resolve(this, store)
  }
}

/**
 * returns the path of a reference in a store
 * @param {Reference} ref: the reference to get the path from
 * @returns {List<string>} the path to use with store.getIn()
 */
methods.getLocation = (ref) => {
  return [ ref.get('type'), ref.get('uuid') ]
}

/**
 * resolves a Reference against a Store. (finds what is located in the store at the location
 * described by the Reference)
 * @param {Reference} ref: the Reference to use to search the store
 * @param {Store} store: the Store to search in
 * @returns {any} the object found in the Store at the location provided by the Reference. returns
 * undefined if not found
 */
methods.resolve = (ref, store) => {
  const path = methods.getLocation(ref)
  const resolved = store.getIn(path)

  return resolved
}

export const __internals__ = methods
export default Reference
