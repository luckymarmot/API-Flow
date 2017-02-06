import { parse } from 'url'
import { OrderedMap, Set, List } from 'immutable'

import Api from '../../models/Api'
import Info from '../../models/Info'
import Contact from '../../models/Contact'
import Group from '../../models/Group'
import Variable from '../../models/Variable'
import Parameter from '../../models/Parameter'
import URLComponent from '../../models/URLComponent'
import Resource from '../../models/Resource'
import Reference from '../../models/Reference'
import Constraint from '../../models/Constraint'
import ParameterContainer from '../../models/ParameterContainer'
import Auth from '../../models/Auth'
import Store from '../../models/Store'

import { currify, convertEntryListInMap } from '../../utils/fp-utils'

const methods = {}

export class PawParser {
  static identifier =
        'com.luckymarmot.PawExtensions.API-Flow'
  static title = 'Api-Flow'
  static help =
        'https://github.com/luckymarmot/API-Flow'
  static languageHighlighter = null
  static fileExtension = null

  parse(parserOptions, item) {
    return methods.parse(parserOptions, item)
  }
}

/**
 * creates a message with information about the state of the document when this was generated
 * @param {PawContext} context: the paw context from which to get the state of the document.
 * @returns {string?} the string describing the state of the project, if it is a cloud project.
 */
methods.addGenerationMessage = (context) => {
  if (context.document.cloudProject && context.document.cloudProject.currentBranch) {
    const branchName = context.document.cloudProject.currentBranch
    const commitSha = context.document.cloudProject.commitSha

    const msg = 'This document was generated from the branch ' + branchName +
      ' on commit ' + commitSha + '.'

    return msg
  }

  return null
}

/**
 * creates a message about how to contribute to the project, if it is a cloud porject
 * @param {PawContext} context: the paw context from which to get the info.
 * @returns {string?} the string explaining how to contribute, if it is a cloud project.
 */
methods.addContributionMessage = (context) => {
  if (context.document.isCloudProject) {
    const cloudProject = context.document.cloudProject
    const cloudTeam = context.document.cloudTeam

    const msg = 'If you are a contributor to this project, you may access it here: ' +
      'https://paw.cloud/account/teams/' + cloudTeam.id + '/projects/' + cloudProject.id

    return msg
  }

  return null
}

/**
 * creates a description of the state of the document.
 * @param {PawContext} context: the paw context from which to get the state of the document.
 * @returns {string?} the string describing the state of the project, if it is a cloud project.
 */
methods.extractDescription = (context) => {
  const description = []

  const generationMsg = methods.addGenerationMessage(context)
  if (generationMsg) {
    description.push(generationMsg)
  }

  const contributionMsg = methods.addContributionMessage(context)
  if (contributionMsg) {
    description.push(contributionMsg)
  }

  return description.join('\n\n') || null
}

/**
 * extracts a Contact from a context
 * @param {PawContext} context: the context from which to get the contact information.
 * @returns {Contact?} the corresponding contact, if it exists
 */
methods.extractContact = (context) => {
  if (context.document.cloudTeam && context.document.cloudTeam.id) {
    return new Contact({
      url: 'https://paw.cloud/account/teams/' + context.document.cloudTeam.id,
      name: context.document.cloudTeam.name || null
    })
  }

  return null
}

/**
 * extracts a version from a context. By default, it is v0.0.0, but a shortened commit sha will be
 * appended if it is possible.
 * @param {PawContext} context: the context from which to extract a version
 * @returns {string} the corresponding version.
 */
methods.extractVersion = (context) => {
  const version = 'v0.0.0'

  if (context.document.cloudProject && context.document.cloudProject.commitSha) {
    return version + '-' + context.document.cloudProject.commitSha.slice(0, 10)
  }

  return version
}

/**
 * extracts the project title from a context.
 * @param {PawContext} context: the context from which to extract a title.
 * @returns {string} the corresponding title
 */
methods.extractTitle = (context) => {
  const title = context.document.name
  return title
}

/**
 * creates an Info record from a context
 * @param {PawContext} context: the context to extract information from.
 * @returns {Info} the corresponding Info record
 */
methods.extractInfo = (context) => {
  const title = methods.extractTitle(context)
  const version = methods.extractVersion(context)
  const description = methods.extractDescription(context)
  const contact = methods.extractContact(context)

  return new Info({
    title, version, description, contact
  })
}

/**
 * traverses a tree from a request leaf to the root group and returns the hierarchy from the root
 * to the leaf.
 * @param {Array<(PawRequest|PawRequestGroup)>} path: the accumulator that holds the path up to this
 * request or group
 * @param {PawRequest|PawRequestGroup} reqOrGroup: the request or group to find the parent of.
 * @returns {Array<(PawRequest|PawRequestGroup)>} the ordered sequence of parents of the reqOrGroup
 */
methods.getPathForRequestOrGroup = (path, reqOrGroup) => {
  if (!reqOrGroup) {
    return path
  }

  const newPath = [ reqOrGroup ].concat(path)
  return methods.getPathForRequestOrGroup(newPath, reqOrGroup.parent)
}

/**
 * gets the ordered sequence of parents of a request, from the root group to itself.
 * @param {PawRequest} request: the request to get the parents from.
 * @returns {Array<(PawRequest|PawRequestGroup)>} the corresponding sequence of parents.
 */
methods.getPathForRequest = (request) => {
  return methods.getPathForRequestOrGroup([], request)
}

/**
 * converts a paw group into a Group record
 * @param {PawRequestGroup} pawGroup: the paw group to converts
 * @returns {Group} the corresponding Group record
 */
methods.convertPawGroupIntoGroup = (pawGroup) => {
  return new Group({
    name: pawGroup.name,
    id: pawGroup.id
  })
}

/**
 * gets the id from a PawRequest or PawRequestGroup and appends it to a list of ids. This is used to
 * transform a sequence of request groups into a path that allows us to access the corresponding
 * Group.
 * @param {Array<string>} path: the current list of 'children' and `id` values
 * @param {string} id: the id of the PawRequest or PawRequestGroup.
 * @returns {Array<string>} the updated path.
 */
methods.convertPawPathIntoGroupPath = (path, { id }) => path.concat([ 'children', id ])

/**
 * creates a nested group at the expected location in an accumulator, if it does not already exist.
 * This method is designed to be used in a reducer, and allows us to fully construct all groups that
 * correspond to an ordered sequence of groups and subgroups. Since the reducer iterates over an
 * array in orderly fashion, this ensures that at any point in time, the path we are trying to
 * access is clearly defined.
 * @param {Group} acc: the root group which all path should use as a base.
 * @param {PawRequest|PawRequestGroup} item: an item from the ordered sequence of parents
 * @param {integer} index: the index at which the item is located in the sequence
 * @param {Array<PawRequest|PawRequestGroup>} fullPath: the complete ordered sequence of parents
 * @returns {Group} the updated root Group
 */
methods.createNestedGroups = (acc, item, index, fullPath) => {
  const path = fullPath
    .slice(0, index + 1)
    .reduce(methods.convertPawPathIntoGroupPath, [])

  // leaf object (i.e. a paw request)
  if (index === fullPath.length - 1) {
    return acc.setIn(path, item.id)
  }

  // node object (i.e. a paw group)
  const group = acc.getIn(path)

  if (!group) {
    return acc.setIn(path, methods.convertPawGroupIntoGroup(item))
  }

  return acc
}

/**
 * stores a request id in the expected group based on a sequence of parents, creating the groupd and
 * all of its parents if necessary.
 * @param {Group} rootGroup: the group to update with the request id
 * @param {Array<PawRequest|PawRequestGroup>} path: the ordered sequence of parents of the request
 * @returns {Group} the upated group
 */
methods.storeRequest = (rootGroup, path) => {
  return path.reduce(methods.createNestedGroups, rootGroup)
}

/**
 * extract the hierarchy of groups and requests from a list of requests.
 * @param {Array<PawRequest>} reqs: the list of requests from which to get the hierarchy.
 * @returns {Group} the corresponding Group hierarchy
 */
methods.extractGroup = (reqs) => {
  reqs
    .map(methods.getPathForRequest)
    .reduce(methods.storeRequest, new Group())
}

/**
 * traverses two strings to find the longest common path, which is similar to the longest common
 * starting string, except that we don't compare character by character but '/'-separated block
 * by '/'-separated block, as /example/pets and /example/pet/:petId have /example as a common path
 * and not /example/pet.
 * @param {Array<string>} lcPathname: the current longest common pathname, in blocks.
 * @param {string} pathname: the pathname to compare
 * @returns {Array<string>} the updated lcPathname
 */
methods.findLongestCommonPath = (lcPathname, pathname) => {
  const sections = pathname.split('/')

  const length = Math.min(lcPathname.length, sections.length)

  let index = 0
  while (index < length) {
    if (lcPathname[index] !== sections[index]) {
      return lcPathname.slice(0, index)
    }

    index += 1
  }

  return lcPathname
}

/**
 * @typedef hostMapType
 * @type {Object<string, {
 *   entries: Array<{ key: string, value: PawRequest, urlObject: Object}>,
 *   lcPathname: Array<string>
 * }>}
 */

/**
 *
 * updates a hostmap with data about a request, grouping it with other requests that share a common
 * host.
 * @param {hostMapType} hostMap: the host map to update.
 * @param {object} entry: the entry to add to the host map
 * @param {string} entry.key: the generated string corresponding to the url of the request
 * @param {PawRequest} entry.value: the request to add to the host map
 * @returns {hostMapType} the updated hostMap
 */
methods.addHostEntryToHostMap = (hostMap, { key, value }) => {
  const urlObject = parse(key)
  const host = urlObject.host

  if (!hostMap[host]) {
    hostMap[host] = { entries: [], lcPathname: urlObject.pathname.split('/') }
  }

  const lcPathname = hostMap[host].lcPathname
  // TODO what fields are used ?
  hostMap[host].entries.push({ key, value, urlObject })
  hostMap[host].lcPathname = methods.findLongestCommonPath(lcPathname, urlObject.pathname)
  return hostMap
}

/**
 * converts a hostMapEntry into a regular Entry
 * @param {object} hostMapEntry: the entry to convert
 * @param {Array<*>} hostMapEntry.entries: the entries corresponding to this specific host.
 * @param {Array<string>} hostMapEntry.lcPathname: the array that contains the longest common
 * pathname of all the entries belonging to this hostMapEntry
 * @param {string} key: the host string
 * @returns {Entry<string, *>} the corresponding Entry
 */
methods.updateHostKeyWithLongestCommonPathname = ({ entries, lcPathname }, key) => {
  return {
    key: key + lcPathname.join('/'),
    value: entries
  }
}

/**
 * extracts common hosts from a list of requests, and assigns each request to its corresponding host
 * @param {Array<PawRequest>} requests: the requests to group by host
 * @returns {Seq<Entry<string, *>>} the corresponding sequence of entries.
 */
methods.extractCommonHostsFromRequests = (requests) => {
  const hosts = requests
    .map((request) => {
      return { key: request.getUrlBase(), value: request }
    })
    .reduce(methods.addHostEntryToHostMap, {})

  return new OrderedMap(hosts).map(methods.updateHostKeyWithLongestCommonPathname).valueSeq()
}

/**
 * converts a DynamicValue or a string into an Entry.
 * @param {DynamicValue|string} component: the component of a DynamicString to convert into an Entry
 * @return {Entry<string, DynamicValue|string>} the corresponding entry
 */
methods.convertDynamicStringComponentIntoEntry = (component) => {
  if (typeof component === 'string') {
    return { key: component, value: component }
  }

  return { key: component.getEvaluatedString(), value: component }
}

/**
 * tests whether a part of a url is entirely present in a default Url or its secure version
 * @param {string} defaultUrl: the default url to test against.
 * @param {string} defaultSecureUrl: the default secure url to test against.
 * @param {string} urlPart: the part of url to test
 * @returns {boolean} true if it is a part of either urls, false otherwise.
 */
methods.isPartOfBaseUrl = (defaultUrl, defaultSecureUrl, urlPart) => {
  return defaultUrl.indexOf(urlPart) >= 0 || defaultSecureUrl.indexOf(urlPart) >= 0
}

/**
 * assigns a component to either a sequence of components representing the baseUrl, or to a sequence
 * of components that represents the path that is specific to this request. If the component is
 * split between the two sequences, we split its evaluated string in such way that as much as
 * possible is put in the base sequence.
 * @param {string} defaultUrl: the non-secure url for a given host
 * @param {string} defaultSecureUrl: the secure url for a given host
 * @param {object} acc: the accumulator that holds the base and path sequences
 * @param {Array<Entry<string, string|DynamicValue>>} acc.baseComponents: the sequence of components
 * that belong to the host url
 * @param {Array<Entry<string, string|DynamicValue>>} acc.pathComponents: the sequence of components
 * that belong to the path of the request
 * @param {object} entry: the entry that represents the component
 * @param {string} entry.key: the evaluated string of the component
 * @param {string|DynamicValue} entry.value: the component
 * @returns {object} acc: the updated accumulator
 */
methods.addComponentToBaseOrPath = (
  defaultUrl,
  defaultSecureUrl,
  { baseComponents, pathComponents },
  { key: urlPart, value: component }
) => {
  if (methods.isPartOfBaseUrl(defaultUrl, defaultSecureUrl, urlPart)) {
    // component is member of base url
    baseComponents.push({ key: urlPart, value: component })
    return { baseComponents, pathComponents }
  }

  if (pathComponents.length === 0) {
    // component may be split between base url and path
    const { inside, outside } = methods.findIntersection(defaultUrl, urlPart)
    baseComponents.push({ key: inside, value: inside })
    pathComponents.push({ key: outside, value: outside })
  }
  else {
    // component is not a member of base url
    pathComponents.push({ key: urlPart, value: component })
  }

  return { baseComponents, pathComponents }
}

/**
 * tests whether a string or dynamic value is an environment variable
 * @param {string|DynamicValue} stringOrDV: the string or dynamic value to test
 * @returns {boolean} true if it an environment variable, false otherwise
 */
methods.isEnvironmentVariable = (stringOrDV) => {
  return typeof stringOrDV === 'object' &&
    stringOrDV.type === 'com.luckymarmot.EnvironmentVariableDynamicValue'
}

/**
 * extracts all possible values from an environment variable.
 * @param {PawContext} context: the context from which to get the environment variable.
 * @param {DynamicValue} dv: the dv that holds a reference to the environmentVariable.
 * @returns {Array<Entry<string, string>>} the array that holds all possible values as Entries.
 */
methods.extractPossibleValuesFromEnvironmentVariableDV = (context, dv) => {
  const variableId = dv.environmentVariable
  const variable = context.getEnvironmentById(variableId)
  const domain = variable.domain
  const environmentNames = domain.environments.map((env) => env.name)
  const values = environmentNames.map((envName) => {
    return { key: envName, value: variable.getValue(envName).getEvaluatedString() }
  })

  return values
}

/**
 * extracts all possible values from a DV Entry.
 * @param {PawContext} context: the context from which to get environment variables
 * @param {Object} entry: the component entry
 * @param {string} entry.key: the part of the url that this component represents
 * @param {string|DynamicValue} entry.value: the component itself
 * @returns {Array<Entry<string, string>>} the corresponding array of possible values for a DV Entry
 */
methods.extractPossibleValuesFromDVEntry = (context, { key: urlPart, value: stringOrDV }) => {
  if (!methods.isEnvironmentVariable(stringOrDV)) {
    return [ { key: '', value: urlPart } ]
  }

  return methods.extractPossibleValuesFromEnvironmentVariableDV(context, stringOrDV)
}

/**
 * combines all possible values from a list of combinations and entries, using a cartesian product
 * of the two arrays, which is then flattened
 * @param {Array<Entry<string, string>>} combinations: the current combinations
 * @param {Array<Entry<string, string>>} entries: the values to combine the combinations with.
 * @returns {Array<Entry<string,string>>} the updated combinations
 */
methods.combinePossibleValues = (combinations, entries) =>{
  return combinations
    .map((combination) => {
      const updated = entries.map((entry) => {
        return { key: combination.key + entry.key, value: combination.value + entry.value }
      })

      return updated
    })
    .reduce((finalList, list) => finalList.concat(list), [])
}

/**
 * converts an array of components belonging to a base url into a variable, if suitable.
 * It only tries to convert it into a variable if there is a single environment variable in the
 * array of components. It otherwise returns null.
 * @param {PawContext} context: the context used to resolve environment variables
 * @param {string} defaultHost: the host associated to the baseComponents
 * @param {Array<Entry<string, string|DynamicValue>>} baseComponents: the array of components to
 * convert into a variable.
 * @returns {Variable?} the corresponding variable for this array of variables
 */
methods.convertBaseComponentsIntoVariable = (context, defaultHost, baseComponents) => {
  const environmentDVCount = baseComponents.filter(methods.isEnvironmentVariable).length

  if (environmentDVCount !== 1) {
    return null
  }

  const extractValuesFromDVEntry = currify(methods.extractPossibleValuesFromDVEntry, context)

  const variableValues = baseComponents
    .map(extractValuesFromDVEntry)
    .reduce(methods.combinePossibleValues, [ { key: '', value: '' } ])
    .reduce(convertEntryListInMap, {})

  return new Variable({
    name: defaultHost,
    values: OrderedMap(variableValues)
  })
}

/**
 * extracts the variable corresponding to the host, and the path components from a request.
 * @param {PawContext} context: the context in which to resolve the environment variable
 * @param {string} defaultHost: the host of the request
 * @param {function} reducer: the reducer to apply to the components of the request.url
 * @param {Entry<*, PawRequest>} entry: the request entry
 * @param {PawRequest} entry.value: the request
 * @returns {{ request: PawRequest, baseVariable: Variable?, pathComponents: Array<*> }} the
 * corresponding entry with the request, the base variable and the path components
 */
methods.extractBaseVariableAndPathComponentsFromRequest = (
  context,
  defaultHost,
  reducer,
  { value: request }
) => {
  const assignComponentToBaseOrPath = reducer
  const ds = request.getUrlBase(true)
  const { baseComponents, pathComponents } = ds.components
    .map(methods.convertDynamicStringComponentIntoEntry)
    .reduce(assignComponentToBaseOrPath, { baseComponents: [], pathComponents: [] })

  const baseVariable = methods.convertBaseComponentsIntoVariable(
    context,
    defaultHost,
    baseComponents
  )
  return { request, baseVariable, pathComponents }
}

methods.findBaseVariableForRequestEntries = (
  { hostVariable, requestEntries },
  { request, baseVariable, pathComponents }
) => {
  requestEntries.push({ request, pathComponents })

  if (!hostVariable && baseVariable) {
    return { hostVariable: baseVariable, requestEntries }
  }

  return { hostVariable, requestEntries }
}

methods.convertComponentEntryIntoStringOrParam = (request, { key, value }) => {
  if (typeof value === 'string') {
    return value
  }

  if (value.type !== 'com.luckymarmot.RequestVariableDynamicValue') {
    return key
  }

  const variable = methods.getVariableFromUuid(request, value.variableUuid)
  const param = methods.convertRequestVariableIntoParameter(variable)
  return param
}

methods.mergeSequencialStrings = (aggregated, stringOrParam) => {
  const previous = aggregated[aggregated.length - 1]

  if (typeof previous === 'string' && typeof stringOrParam === 'string') {
    aggregated[aggregated.length - 1] = previous + stringOrParam
    return aggregated
  }

  aggregated.push(stringOrParam)
  return aggregated
}

methods.convertStringOrParameterIntoParameter = stringOrParam => {
  if (typeof stringOrParam === 'string') {
    return new Parameter({
      type: 'string',
      default: stringOrParam
    })
  }

  return stringOrParam
}

methods.createDefaultPathEndpoint = () => {
  const pathnameComponent = new URLComponent({
    componentName: 'pathname',
    string: '',
    parameter: new Parameter({
      key: 'pathname',
      type: 'string',
      default: '/'
    })
  })
  return new URL().set('pathname', pathnameComponent)
}

methods.insertEmptyParameterIfNeeded = (sequence) => {
  if (sequence[0].get('key') !== null) {
    sequence.splice(0, 0, new Parameter({ type: 'string', default: '' }))
  }

  return sequence
}

methods.createPathEndpoint = (sequence) => {
  const pathnameComponent = new URLComponent({
    componentName: 'pathname',
    string: '',
    parameter: new Parameter({
      key: 'pathname',
      type: 'string',
      superType: 'sequence',
      value: List(sequence)
    })
  })

  const path = new URL().set('pathname', pathnameComponent)
  return path
}

methods.convertPathComponentsIntoPathEndpoint = (request, components) => {
  const convertComponentEntryIntoStringOrParam = currify(
    methods.convertComponentEntryIntoStringOrParam, request
  )

  const sequence = components
    .map(convertComponentEntryIntoStringOrParam)
    .reduce(methods.mergeSequencialStrings, [])
    .map(methods.convertStringOrParameterIntoParameter)

  if (!sequence.length) {
    return methods.createDefaultPathEndpoint()
  }

  const normalizedSequence = methods.insertEmptyParameterIfNeeded(sequence)
  return methods.createPathEndpoint(normalizedSequence)
}

methods.extractResourceFromPawRequest = (reference, { request, pathComponents }) => {
  const path = methods.convertPathComponentsIntoPathEndpoint(request, pathComponents)
  const endpoints = { [reference.get('uuid')]: reference }

  return new Resource({
    endpoints: OrderedMap(endpoints),
    path: path,
    methods: methods.extractRequestMapFromPawRequest(request, endpoints)
  })
}

methods.convertHostEntriesIntoHostVariableAndRequestEntries = (defaultHost, hostEntries) => {
  const defaultUrl = 'http://' + defaultHost
  const defaultSecureUrl = 'https://' + defaultHost

  const assignComponentToBaseOrPath = currify(
    methods.addComponentToBaseOrPath,
    defaultUrl,
    defaultSecureUrl
  )

  const extractBaseVariableAndPathComponentsFromRequest = currify(
    methods.extractBaseVariableAndPathComponentsFromRequest,
    context, defaultHost, assignComponentToBaseOrPath
  )

  return hostEntries
    .map(extractBaseVariableAndPathComponentsFromRequest)
    .reduce(methods.findBaseVariableForRequestEntries, { hostVariable: null, requestEntries: [] })
}

methods.createDefaultHostEndpoint = (defaultHost, hostEntries) => {
  const defaultUrl = 'http://' + defaultHost

  let endpointValue = new URL({
    url: defaultUrl
  })

  const protocols = Set(hostEntries.map(({ urlObject }) => urlObject.protocols)).toList()

  endpointValue = endpointValue.set('protocol', protocols)
  return { key: defaultHost, value: endpointValue }
}

methods.getResourcesFromRequestEntries = (defaultHost, hostVariable, requestEntries) => {
  const reference = new Reference({
    type: hostVariable ? 'variable' : 'endpoint',
    uuid: defaultHost
  })

  const extractResourceFromPawRequest = currify(
    methods.extractResourceFromPawRequest, reference
  )

  return requestEntries.map(extractResourceFromPawRequest)
}

methods.convertHostIntoResources = (context, { key: defaultHost, value: hostEntries }) => {
  const {
    hostVariable,
    requestEntries
  } = methods.convertHostEntriesIntoHostVariableAndRequestEntries(defaultHost, hostEntries)

  const variable = hostVariable ? { key: defaultHost, value: hostVariable } : null
  const endpoint = hostVariable ? null : methods.createDefaultHostEndpoint(defaultHost, hostEntries)
  const resources = methods.getResourcesFromRequestEntries(
    defaultHost, hostVariable, requestEntries
  )

  return { resources, variable, endpoint }
}

methods.getVariableFromUuid = (request, uuid) => {
  return request.variables.filter(variable => variable.id === uuid)[0] || null
}

methods.isRequestVariableDynamicValue = (component) => {
  return typeof component === 'object' &&
    component.type === 'com.luckymarmot.RequestVariableDynamicValue'
}

methods.isRequestVariableDS = (ds) => {
  return ds.length === 1 && methods.isRequestVariableDynamicValue(ds.components[0])
}

methods.convertRequestVariableDSIntoParameter = (
  request, location, contexts, paramDS, paramName
) => {
  const variableId = paramDS.components[0].variableUUID
  const variable = request.getVariableById(variableId)
  const { value, schema, type, description } = variable

  const param = new Parameter({
    in: location,
    key: paramName,
    name: paramName,
    type: type || 'string',
    description: description || null,
    default: value.getEvaluatedString(),
    constraints: List([
      new Constraint.JSONSchema(schema)
    ]),
    applicableContexts: contexts
  })

  return { key: paramName, value: param }
}

methods.convertStandardDSIntoParameter = (location, contexts, paramDS, paramName) => {
  const value = paramDS.getEvaluatedString()
  const param = new Parameter({
    in: location,
    key: paramName,
    name: paramName,
    type: 'string',
    default: value,
    applicableContexts: contexts
  })

  return { key: paramName, value: param }
}

methods.convertParameterDynamicStringIntoParameter = (
  request, location, contexts, paramDS, paramName
) => {
  if (methods.isRequestVariableDS(paramDS)) {
    return methods.convertRequestVariableDSIntoParameter(
      request, location, contexts, paramDS, paramName
    )
  }

  return methods.convertStandardDSIntoParameter(location, contexts, paramDS, paramName)
}

methods.isRequestBodyUrlEncoded = (request) => {
  return !!request.getHeaderByName('Content-Type')
    .match(/application\/x-www-form-urlencoded/)
}

methods.isRequestBodyMultipart = (request) => {
  return !!request.getHeaderByName('Content-Type')
    .match(/multipart\/form-data/)
}

methods.getContentTypeContexts = (contentType) => {
  return List([
    new Parameter({
      key: 'Content-Type',
      name: 'Content-Type',
      in: 'headers',
      type: 'string',
      constraints: List([
        new Constraint.Enum([ contentType ])
      ])
    })
  ])
}

methods.createDefaultArrayParameter = (contexts) => {
  const param = new Parameter({
    key: name,
    name: name,
    in: 'body',
    type: 'array',
    format: 'multi',
    value: new Parameter({
      type: 'string'
    }),
    applicableContexts: contexts
  })

  return { key: name, value: param }
}

methods.createUrlEncodedOrMultipartBodyParameters = (dsMap, contexts, request) => {
  const bodyParams = OrderedMap(dsMap)
    .map((value, name) => {
      if (Array.isArray(value)) {
        return methods.createDefaultArrayParameter(contexts)
      }

      return methods.convertParameterDynamicStringIntoParameter(
        request, 'body', contexts, value, name
      )
    })
    .reduce(convertEntryListInMap, {})

  return OrderedMap(bodyParams)
}

methods.createUrlEncodedBodyParameters = (request) => {
  const dsMap = request.getUrlEncodedBody(true)
  const contexts = methods.getContentTypeContexts('application/x-www-form-urlencoded')

  return methods.createUrlEncodedOrMultipartBodyParameters(dsMap, contexts, request)
}

methods.createMultipartBodyParameters = (request) => {
  const dsMap = request.getMultipartBody(true)
  const contexts = methods.getContentTypeContexts('multipart/form-data')

  return methods.createUrlEncodedOrMultipartBodyParameters(dsMap, contexts, request)
}

methods.createStandardBodyParameters = (request) => {
  const bodyDS = request.getBody(true)

  const { key, value } = methods.convertParameterDynamicStringIntoParameter(
    request, 'body', List(), bodyDS, null
  )

  const body = { [key]: value }
  return OrderedMap(body)
}

methods.getBodyParameters = (request) => {
  if (methods.isRequestBodyUrlEncoded(request)) {
    return methods.createUrlEncodedBodyParameters(request)
  }

  if (methods.isRequestBodyMultipart(request)) {
    return methods.createMultipartBodyParameters(request)
  }

  return methods.createStandardBodyParameters(request)
}

methods.getHeadersMapFromRequest = (request) => {
  const extractHeaders = currify(
    methods.convertParameterDynamicStringIntoParameter, request, 'headers', List()
  )

  return OrderedMap(request.getHeaders(true))
    .filter((_, name) => name !== 'Authorization')
    .map(extractHeaders)
    .reduce(convertEntryListInMap, {})
}

methods.getQueriesMapFromRequest = (request) => {
  const extractUrlParams = currify(
    methods.convertParameterDynamicStringIntoParameter, request, 'queries', List()
  )

  return OrderedMap(request.getUrlParameters(true))
    .map(extractUrlParams)
    .reduce(convertEntryListInMap, {})
}

methods.extractParameterContainerFromRequest = (request) => {
  const headers = methods.getHeadersMapFromRequest(request)
  const queries = methods.getQueriesMapFromRequest(request)
  const body = methods.getBodyParameters(request)

  return new ParameterContainer({
    headers, queries, body
  })
}

methods.getAuthNameFromOAuth2DV = (authDV) => {
  const identifiers = [ 'oauth_2' ]
  const authURL = authDV.authorizationURL
  if (authURL) {
    const host = authURL.getEvaluatedString().split('/')[2]
    const hostArray = host ? host.split('.') : []
    const domain = hostArray[hostArray.length - 2]
    if (domain) {
      identifiers.push(domain)
    }
  }

  const grantMap = {
    '0': 'code',
    '1': 'implicit',
    '2': 'resource_owner',
    '3': 'client_credentials'
  }

  if (grantMap[authDV.grantType]) {
    identifiers.push(grantMap[authDV.grantType])
  }

  identifiers.push('auth')

  return identifiers.join('_')
}

methods.getAuthNameFromAuthDV = (context, request, authDV) => {
  if (methods.isEnvironmentVariable(authDV)) {
    const name = context.getEnvironmentVariableById(authDV.environmentVariable).name
    return name
  }

  if (methods.isRequestVariableDynamicValue(authDV)) {
    const variable = request.getVariableById(authDV.variableUUID)
    return methods.getAuthNameFromAuth(context, request, variable.value)
  }

  if (authDV.type === 'com.luckymarmot.OAuth2DynamicValue') {
    return methods.getAuthNameFromOAuth2DV(authDV)
  }

  return null
}

methods.getAuthNameFromAuthString = (authDS) => {
  const scheme = authDS.getEvaluatedString().split(' ')[0]
  const nameMap = {
    Basic: 'basic_auth',
    Digest: 'digest_auth',
    Hawk: 'hawk_auth',
    'AWS4-HMAC-SHA256': 'aws_sig4_auth',
    OAuth: 'oauth_1_auth',
    Bearer: 'oauth_2_auth'
  }

  if (nameMap[scheme]) {
    return nameMap[scheme]
  }

  return null
}

methods.getAuthNameFromAuth = (context, request, authDS) => {
  const authDV = authDS.getOnlyDynamicValue()

  if (authDV) {
    const name = methods.getAuthNameFromAuthDV(context, request, authDV)
    if (name) {
      return name
    }
  }

  return methods.getAuthNameFromAuthString(authDS)
}

methods.extractAuthReferencesFromRequest = (request) => {
  const auth = request.getHeaderByName('Authorization')
  if (!auth) {
    return List()
  }

  const authName = methods.getAuthNameFromAuth(auth)

  return List([
    new Reference({
      type: 'auth',
      uuid: authName
    })
  ])
}

methods.extractRequestMapFromPawRequest = (pawReq, endpoints) => {
  const $methods = {}
  const method = pawReq.getMethod()
  const parameters = methods.extractParameterContainerFromRequest(pawReq)
  const auths = methods.extractAuthReferencesFromRequest(pawReq)

  const request = new Request({
    id: pawReq.id,
    endpoints: endpoints,
    name: pawReq.name,
    description: pawReq.description,
    method,
    parameters,
    auths
  })

  $methods[method] = request
}

methods.groupResourcesVariablesAndEndpoints = (
  { resources, variables, endpoints },
  { resources: hostResources, variable, endpoint }
) => {
  if (variable) {
    variables.push(variable)
  }

  if (endpoint) {
    endpoints.push(endpoint)
  }

  return {
    resources: resources.concat(hostResources),
    variables,
    endpoints
  }
}

methods.extractAuthFromDV = (context, request, authDS, authDV) => {
  if (methods.isEnvironmentVariable(authDV)) {
    const value = context.getEnvironmentVariableById(authDV.environmentVariable).getCurrentValue()
    return methods.extractAuthsFromRequest(context, request, value)
  }

  if (methods.isRequestVariableDynamicValue(authDV)) {
    const variable = request.getVariableById(authDV.variableUUID)
    return methods.extractAuthsFromRequest(context, request, variable.value)
  }

  if (authDV.type === 'com.luckymarmot.OAuth2DynamicValue') {
    const authInstance = {}

    const authName = methods.getAuthNameFromAuth(context, request, authDS)
    authInstance.authName = authName

    const authURL = authDV.authorizationURL
    if (authURL) {
      authInstance.authorizationUrl = authURL.getEvaluatedString()
    }

    const tokenURL = authDV.tokenURL
    if (tokenURL) {
      authInstance.tokenUrl = tokenURL.getEvaluatedString()
    }

    const grantMap = {
      '0': 'accessCode',
      '1': 'implicit',
      '2': 'password',
      '3': 'application'
    }

    authInstance.flow = grantMap[authDV.grantType] || 'implicit'

    return { key: authName, value: new Auth.OAuth2(authInstance) }
  }

  return methods.extractAuthFromAuthString(authDS)
}

methods.extractAuthFromAuthString = (authDS) => {
  const scheme = authDS.getEvaluatedString().split(' ')[0]
  const nameMap = {
    Basic: () => ({ key: 'basic_auth', value: new Auth.Basic({ authName: 'basic_auth' }) }),
    Digest: () => ({ key: 'digest_auth', value: new Auth.Digest({ authName: 'digest_auth' }) }),
    Hawk: () => ({ key: 'hawk_auth', value: new Auth.Hawk({ authName: 'hawk_auth' }) }),
    'AWS4-HMAC-SHA256': () => ({
      key: 'aws_sig4_auth',
      value: new Auth.AWSSig4({ authName: 'aws_sig4_auth' })
    }),
    OAuth: () => ({ key: 'oauth_1_auth', value: new Auth.OAuth1({ authName: 'oauth_1_auth' }) }),
    Bearer: () => ({ key: 'oauth_2_auth', value: new Auth.OAuth2({ authName: 'oauth_2_auth' }) })
  }

  if (nameMap[scheme]) {
    return nameMap[scheme]()
  }

  return { key: null, value: null }
}

methods.extractAuthsFromRequest = (context, request, _authDS) => {
  // potential infinite loop
  const authDS = _authDS || request.getHeaderByName('Authorization', true)
  const authDV = authDS.getOnlyDynamicValue()

  if (authDV) {
    return methods.extractAuthFromDV(context, request, authDS, authDV)
  }

  return methods.extractAuthFromAuthString(authDS)
}

methods.extractResourcesAndStore = (context, reqs) => {
  const hosts = methods.extractCommonHostsFromRequests(reqs)
  const { resources, variables, endpoints } = hosts
    .map(methods.convertHostIntoResources)
    .reduce(
      methods.groupResourcesVariablesAndEndpoints,
      { resources: [], variables: [], endpoints: [] }
    )

  const auths = reqs
    .filter(request => request.getHeaderByName('Authorization', true))
    .map(methods.extractAuthsFromRequest)
    .filter(({ key }) => !!key)

  const resourceMap = OrderedMap(resources.reduce(convertEntryListInMap, {}))
  const variableStore = OrderedMap(variables.reduce(convertEntryListInMap, {}))
  const endpointStore = OrderedMap(endpoints.reduce(convertEntryListInMap, {}))
  const authStore = OrderedMap(auths.reduce(convertEntryListInMap, {}))

  const store = new Store({
    variable: variableStore,
    endpoint: endpointStore,
    auth: authStore
  })

  return { resources: resourceMap, store }
}

// NOTE: we're cheating in this method, as we're not using the standard Item interface, but rather
// passing the requests and context as options to the parser.
methods.parse = ({ context, reqs }) => {
  const info = methods.extractInfo(context)
  const group = methods.extractGroup(reqs)
  const { resources, store } = methods.extractResourcesAndStore(context, reqs)

  const api = new Api({
    info, store, group, resources
  })

  return api
}

export const __internals__ = methods
export default PawParser
