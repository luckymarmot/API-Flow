import { OrderedMap, List, Record } from 'immutable'

import Model from './ModelInfo'

/**
 * Metadata about the Group Record.
 * Used for internal serialization and deserialization
 */
const modelInstance = {
  name: 'group.models',
  version: '0.1.0'
}
const model = new Model(modelInstance)

/**
 * Default Spec for the Group Record.
 */
const GroupSpec = {
  _model: model,
  id: null,
  name: null,
  description: null,
  children: OrderedMap()
}

/**
 * Holds all the internal methods used in tandem with a Group
 */
const methods = {}

/**
 * The Group Record
 */
export class Group extends Record(GroupSpec) {
  /**
   * Returns the list of all request Ids in the group and its sub groups
   * @returns {List<(string | number)>} a List with all the request Ids from the group
   * and its sub groups
   */
  getRequestIds() {
    return methods.getRequestIds(this)
  }

  /**
   * Returns the list of all Requests in the group and its sub groups, if they are
   * present in a Request Map
   * WARNING: numerical ids are cast to strings
   * @param {?Map<Request>} requestMap: the Map from which to get the requests by
   * their ids
   * @returns {List<Request>} a List with all the existing Request from the group
   * and its sub groups
   */
  getRequests(requestMap) {
    return methods.getRequests(this, requestMap)
  }
}

/**
 * Checks if an object is an Id or not
 * @param {string | number | Group} idOrGroup: the object to test
 * @returns {boolean} whether the object is an Id or not
 */
methods.isId = (idOrGroup) => {
  return typeof idOrGroup === 'string' || typeof idOrGroup === 'number'
}

/**
 * Checks if an object is a Group or not
 * @param {string | number | Group} idOrGroup: the object to test
 * @returns {boolean} whether the object is a Group or not
 */
methods.isGroup = (idOrGroup) => {
  return idOrGroup instanceof Group
}

/**
 * a reducer to flatten a List of List into a List
 * @param {List<A>} flatList: the flattened List
 * @param {List<A>} list: the List to add to the flat list
 * @returns {List<A>} the updated flat List
 */
methods.flattenReducer = (flatList, list) => flatList.concat(list)

/**
 * Returns the list of all request Ids in the group and its sub groups
 * @param {Group} group: the group to extract the request Ids from
 * @returns {List<(string | number)>} a List with all the request Ids from the group
 * and its sub groups
 */
methods.getRequestIds = (group) => {
  if (!group || typeof group.get !== 'function' || !group.get('children')) {
    return List()
  }

  const children = group.get('children').valueSeq()
  const requestsIds = children.filter(methods.isId)
  const groups = children.filter(methods.isGroup)

  const nestedRequestIds = groups.map(methods.getRequestIds)

  return nestedRequestIds
    .reduce(methods.flattenReducer, List())
    .concat(requestsIds)
}

/**
 * Checks if an object is a Request or not
 * @param {any} request: the object to test
 * @returns {boolean} whether the object is a Request or not
 */
methods.isRequest = (request) => !!request

/**
 * Returns the list of all Requests in the group and its sub groups, if they are
 * present in a Request Map
 * WARNING: numerical ids are cast to strings
 * @param {Group} group: the group to extract the request Ids from
 * @param {?Map<Request>} requestMap: the Map from which to get the requests by
 * their ids
 * @returns {List<Request>} a List with all the existing Request from the group
 * and its sub groups
 */
methods.getRequests = (group, requestMap) => {
  if (!requestMap || typeof requestMap.get !== 'function') {
    return List()
  }

  const ids = methods.getRequestIds(group)

  return ids.map(id => {
    return requestMap.get(id + '')
  }).filter(methods.isRequest)
}

export const __internals__ = methods
export default Group
