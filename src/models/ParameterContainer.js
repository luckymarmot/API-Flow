import { List, OrderedMap, Record } from 'immutable'

import Model from './ModelInfo'

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
  headers: List(),
  queries: List(),
  body: List(),
  path: List()
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
  let headers = container.get('headers')
  let _set = headers.reduce(methods.headerSetReducer, {})
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

  let headers = methods.filterBlock(container.get('headers'), contextContraints)
  let queries = methods.filterBlock(container.get('queries'), contextContraints)
  let body = methods.filterBlock(container.get('body'), contextContraints)
  let path = methods.filterBlock(container.get('path'), contextContraints)

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
