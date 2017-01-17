import { OrderedMap, Record } from 'immutable'

import { currify } from '../utils/fp-utils'

import Model from './ModelInfo'
import Reference from './Reference'

/**
 * Metadata about the ParameterContainer Record.
 * Used for internal serialization and deserialization
 */
const modelInstance = {
  name: 'parameter-container.core.models',
  version: '0.1.0'
}
const model = new Model(modelInstance)

/**
 * Default Spec for the ParameterContainer Record.
 */
const ParameterContainerSpec = {
  _model: model,
  headers: OrderedMap(),
  queries: OrderedMap(),
  body: OrderedMap(),
  path: OrderedMap()
}

/**
 * Holds all the internal methods used in tandem with a ParameterContainer
 */
const methods = {}

/**
 * The ParameterContainer Record
 */
export class ParameterContainer extends Record(ParameterContainerSpec) {
  getHeadersSet() {
    return methods.getHeadersSet(this)
  }

  resolve(store) {
    return methods.resolve(this, store)
  }

  filter(contextContraints) {
    return methods.filter(this, contextContraints)
  }
}

/**
 * adds a Parameter to an object based on its key field
 * @param {obj} set: the set to update
 * @param {Parameter} param: the Parameter to add
 * @returns {set} the updated set
 */
methods.headerSetReducer = (set, param) => {
  const key = param.get('key')

  if (key === null || typeof key === 'undefined') {
    return set
  }

  set[param.get('key')] = param
  return set
}

/**
 * gets a set of headers from a ParameterContainer
 * @param {ParameterContainer} container: the ParameterContainer to get the headers from
 * @returns {OrderedMap} the set of headers
 */
methods.getHeadersSet = (container) => {
  const headers = container.get('headers')
  const _set = headers.reduce(methods.headerSetReducer, {})
  return new OrderedMap(_set)
}

/**
 * filters a block against a Parameter
 * @param {List<Parameter>} block: a list of Parameters belonging to a certain part of a request,
 * like headers, or query params, etc.
 * @param {Parameter} param: the Parameter to test the validation against
 * @returns {List<Parameter>} the filtered block with only valid Parameters against the param
 */
methods.filterBlockReducer = (block, param) => {
  return block.filter((d) => {
    return d.isValid(param)
  })
}

/**
 * filters a block against a list of constraints from a context
 * @param {List<Parameter>} block: a list of Parameters belonging to a certain part of a request,
 * like headers, or query params, etc.
 * @param {List<Parameter>} contextContraints: the list of Parameters to test against
 * @returns {List<Parameter>} the filtered block with only valid Parameters against the
 * contextContraints
 */
methods.filterBlock = (block, contextContraints) => {
  return contextContraints.reduce(methods.filterBlockReducer, block)
}

/**
 * filters a block against a list of constraints from a context
 * @param {ParameterContainer} container: the ParameterContainer to filter based on the context
 * @param {List<Parameter>} contextContraints: the list of Parameters to test against
 * @returns {ParameterContainer} the filtered ParameterContainer with only valid Parameters
 * against the contextContraints
 */
methods.filter = (container, contextContraints) => {
  if (!contextContraints) {
    return container
  }

  const headers = methods.filterBlock(container.get('headers'), contextContraints)
  const queries = methods.filterBlock(container.get('queries'), contextContraints)
  const body = methods.filterBlock(container.get('body'), contextContraints)
  const path = methods.filterBlock(container.get('path'), contextContraints)

  return container.withMutations((_container) => {
    _container
      .set('headers', headers)
      .set('queries', queries)
      .set('body', body)
      .set('path', path)
  })
}

methods.resolveReference = (store, paramOrRef) => {
  if (paramOrRef instanceof Reference) {
    return store.getIn(paramOrRef.getLocation())
  }

  return paramOrRef
}

methods.removeUnresolvedRefs = (param) => !!param

methods.resolveBlock = (store, block) => {
  const transformRefs = currify(methods.resolveReference, store)
  return block
    .map(transformRefs)
    .filter(methods.removeUnresolvedRefs)
}

methods.resolve = (container, store) => {
  const resolveBlock = currify(methods.resolveBlock, store)
  const headers = resolveBlock(container.get('headers'))
  const queries = resolveBlock(container.get('queries'))
  const body = resolveBlock(container.get('body'))
  const path = resolveBlock(container.get('path'))

  return container.withMutations((_container) => {
    _container
      .set('headers', headers)
      .set('queries', queries)
      .set('body', body)
      .set('path', path)
  })
}

export const __internals__ = methods
export default ParameterContainer
