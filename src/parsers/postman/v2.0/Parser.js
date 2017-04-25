import { OrderedMap, Set, List } from 'immutable'
import { convertEntryListInMap, flatten } from '../../../utils/fp-utils'

import Api from '../../../models/Api'
import Info from '../../../models/Info'
import Group from '../../../models/Group'
import Store from '../../../models/Store'
import Parameter from '../../../models/Parameter'
import Reference from '../../../models/Reference'
import Resource from '../../../models/Resource'
import ParameterContainer from '../../../models/ParameterContainer'
import Auth from '../../../models/Auth'
import URL from '../../../models/URL'
import Request from '../../../models/Request'
import Constraint from '../../../models/Constraint'

const methods = {}

export const __meta__ = {
  version: 'v2.0',
  format: 'postman-collection'
}

/**
 * A Parser that converts Postman collection v2.0 formatted objects into Api Records
 */
export class PostmanCollectionV2Parser {
  static __meta__ = __meta__

  /**
   * evaluates if the file is parsable by giving a score to the file depending on a few criteria.
   * @param {string} content: the content of the file to evaluate
   * @returns {number} the corresponding score, between 0 and 1
   */
  static detect(content) {
    return methods.detect(content)
  }

  /**
   * tries to extract a title from a RAML file
   * @param {string} content: the file to get the api title from
   * @returns {string?} the title, if it was found
   */
  static getAPIName(content) {
    return methods.getAPIName(content)
  }

  /**
   * converts an item into an intermediate model representation
   * @returns {Api} the corresponding Api Record
   */
  static parse() {
    return methods.parse(...arguments)
  }
}

/**
 * evaluates if the file is parsable by giving a score to the file depending on a few criteria.
 * @param {string} content: the content of the file to evaluate
 * @returns {number} the corresponding score, between 0 and 1
 */
methods.detect = (content) => {
  const detection = {
    format: __meta__.format,
    version: __meta__.version,
    score: 0
  }

  try {
    const json = JSON.parse(content)
    if (!json.info || !json.item) {
      return [ detection ]
    }

    if (!json.info.name || !json.info.schema) {
      return [ detection ]
    }

    detection.score = 1
    return [ detection ]
  }
  catch (e) {
    return [ detection ]
  }
}

/**
 * tries to extract a title from a RAML file
 * @param {string} content: the file to get the api title from
 * @returns {string?} the title, if it was found
 */
methods.getAPIName = (content) => {
  try {
    const json = JSON.parse(content)
    if (!json.info || !json.item) {
      return null
    }

    if (!json.info.name || !json.info.schema) {
      return null
    }

    return json.info.name
  }
  catch (e) {
    return null
  }
}

methods.extractInfoTitle = (collection) => {
  if (!collection || !collection.info || !collection.info.name) {
    return null
  }

  return { key: 'title', value: collection.info.name }
}

methods.extractInfoDescriptionFromDescriptionString = (description) => {
  return { key: 'description', value: description }
}

methods.extractInfoDescriptionFromDescriptionObject = (description) => {
  if (!description.content) {
    return null
  }

  return { key: 'description', value: description.content }
}

methods.extractInfoDescription = (collection) => {
  if (!collection || !collection.info || !collection.info.description) {
    return null
  }

  const description = collection.info.description
  if (typeof description === 'string') {
    return methods.extractInfoDescriptionFromDescriptionString(description)
  }

  return methods.extractInfoDescriptionFromDescriptionObject(description)
}

methods.extractInfoTermsOfService = () => null
methods.extractInfoContact = () => null
methods.extractInfoLicense = () => null

methods.extractInfoVersionFromVersionString = (version) => {
  return { key: 'version', value: version }
}

methods.extractInfoVersionFromVersionObject = (version) => {
  if (!version.major && !version.minor && !version.patch) {
    return null
  }

  const versionNumber =
    (version.major || '0') + '.' +
    (version.minor || '0') + '.' +
    (version.patch || '0')
  return { key: 'version', value: versionNumber }
}

methods.extractInfoVersion = (collection) => {
  if (!collection || !collection.info || !collection.info.version) {
    return null
  }

  const version = collection.info.version
  if (typeof version === 'string') {
    return methods.extractInfoVersionFromVersionString(version)
  }

  return methods.extractInfoVersionFromVersionObject(version)
}

methods.extractInfoInstance = (collection) => {
  const kvs = [
    methods.extractInfoTitle(collection),
    methods.extractInfoDescription(collection),
    methods.extractInfoTermsOfService(collection),
    methods.extractInfoContact(collection),
    methods.extractInfoLicense(collection),
    methods.extractInfoVersion(collection)
  ].filter(v => !!v)

  return kvs.reduce(convertEntryListInMap, {})
}

methods.extractInfo = (collection) => {
  const infoInstance = methods.extractInfoInstance(collection)

  return { key: 'info', value: new Info(infoInstance) }
}

methods.extractGroupId = () => null

methods.extractGroupName = (itemGroup) => {
  if (!itemGroup || !itemGroup.name) {
    return null
  }

  return { key: 'name', value: itemGroup.name }
}

methods.extractGroupDescription = (itemGroup) => {
  if (!itemGroup || !itemGroup.description) {
    return null
  }

  return { key: 'description', value: itemGroup.description }
}

methods.isItem = (itemOrItemGroup) => !!(itemOrItemGroup || {}).request

methods.extractGroupResourceChildren = (item) => {
  const id = item.id || item.name || null
  return { key: id, value: id }
}

methods.extractGroupChildrenEntry = (itemOrItemGroup) => {
  if (methods.isItem(itemOrItemGroup)) {
    return methods.extractGroupResourceChildren(itemOrItemGroup)
  }

  return methods.extractGroup(itemOrItemGroup)
}

methods.extractGroupChildren = (itemGroup) => {
  if (!itemGroup.item || !Array.isArray(itemGroup.item)) {
    return null
  }

  const children = itemGroup.item
    .map(methods.extractGroupChildrenEntry)
    .filter(v => !!v)

  if (!children.length) {
    return null
  }

  const childrenMap = OrderedMap(children.reduce(convertEntryListInMap, {}))
  return { key: 'children', value: childrenMap }
}

methods.extractGroupInstance = (itemGroup) => {
  const kvs = [
    methods.extractGroupId(itemGroup),
    methods.extractGroupName(itemGroup),
    methods.extractGroupDescription(itemGroup),
    methods.extractGroupChildren(itemGroup)
  ].filter(v => !!v)

  return kvs.reduce(convertEntryListInMap, {})
}

methods.extractGroup = (collectionOrItemGroup) => {
  const key = collectionOrItemGroup.name || 'group'
  const groupInstance = methods.extractGroupInstance(collectionOrItemGroup)

  return { key, value: new Group(groupInstance) }
}

methods.extractParameterInstanceFromVariable = (variable) => {
  const validTypes = [ 'integer', 'number', 'string', 'boolean', 'array' ]
  const type = validTypes.indexOf(variable.type) < 0 ? 'string' : variable.type

  return {
    key: variable.id || variable.name || null,
    name: variable.name || null,
    type,
    default: variable.value || null
  }
}

methods.extractParameterEntryFromVariable = (variable) => {
  const key = variable.id || variable.name || null
  const parameterInstance = methods.extractParameterInstanceFromVariable(variable)

  return { key, value: new Parameter(parameterInstance) }
}

methods.extractParameterTypedStore = (collection) => {
  if (!collection || !collection.variable || !Array.isArray(collection.variable)) {
    return null
  }

  const params = collection.variable.map(methods.extractParameterEntryFromVariable)
  return { key: 'parameter', value: OrderedMap(params.reduce(convertEntryListInMap, {})) }
}

methods.extractEndpointTypedStore = (endpoints) => {
  const endpointMap = endpoints.reduce(convertEntryListInMap, {})

  return { key: 'endpoint', value: OrderedMap(endpointMap) }
}

methods.extractAWSSig4AuthFromAuth = (auth) => {
  const authSettings = auth.awsv4 || {}
  return {
    key: auth.type,
    value: new Auth.AWSSig4({
      authName: auth.type,
      key: authSettings.accessKey || null,
      secret: authSettings.secretKey || null,
      region: authSettings.region || null,
      service: authSettings.service || null
    })
  }
}

methods.extractBasicAuthFromAuth = (auth) => {
  const authSettings = auth.basic || {}
  return {
    key: auth.type,
    value: new Auth.Basic({
      authName: auth.type,
      username: authSettings.username || null,
      password: authSettings.password || null
    })
  }
}

methods.extractDigestAuthFromAuth = (auth) => {
  const authSettings = auth.digest || {}
  return {
    key: auth.type,
    value: new Auth.Digest({
      authName: auth.type,
      username: authSettings.username || null,
      password: authSettings.password || null
    })
  }
}

methods.extractHawkAuthFromAuth = (auth) => {
  const authSettings = auth.hawk || {}
  return {
    key: auth.type,
    value: new Auth.Hawk({
      authName: auth.type,
      id: authSettings.authId || null,
      key: authSettings.authKey || null,
      algorithm: authSettings.algorithm || null
    })
  }
}

methods.extractOAuth1AuthFromAuth = (auth) => {
  const authSettings = auth.oauth1 || {}
  return {
    key: auth.type,
    value: new Auth.OAuth1({
      authName: auth.type,
      consumerSecret: authSettings.consumerSecret || null,
      consumerKey: authSettings.consumerKey || null,
      token: authSettings.token || null,
      tokenSecret: authSettings.tokenSecret || null
    })
  }
}

methods.extractOAuth2AuthFromAuth = (auth) => {
  const authSettings = auth.oauth2 || {}
  return {
    key: auth.type,
    value: new Auth.OAuth2({
      authName: auth.type,
      authorizationUrl: authSettings.authUrl || null,
      tokenUrl: authSettings.accessTokenUrl || null
    })
  }
}

/* eslint-disable max-statements */
methods.extractAuthFromPostmanAuth = (auth) => {
  if (auth.type === 'awsv4') {
    return methods.extractAWSSig4AuthFromAuth(auth)
  }

  if (auth.type === 'basic') {
    return methods.extractBasicAuthFromAuth(auth)
  }

  if (auth.type === 'digest') {
    return methods.extractDigestAuthFromAuth(auth)
  }

  if (auth.type === 'hawk') {
    return methods.extractHawkAuthFromAuth(auth)
  }

  if (auth.type === 'noauth') {
    return null
  }

  if (auth.type === 'oauth1') {
    return methods.extractOAuth1AuthFromAuth(auth)
  }

  if (auth.type === 'oauth2') {
    return methods.extractOAuth2AuthFromAuth(auth)
  }

  return null
}
/* eslint-enable max-statements */

methods.extractAuthTypedStore = (items) => {
  const auths = items
    .map(item => ((item || {}).request || {}).auth)
    .filter(v => !!v)
    .map(methods.extractAuthFromPostmanAuth)
    .filter(v => !!v)
    .reduce(convertEntryListInMap, {})

  return { key: 'auth', value: OrderedMap(auths) }
}

methods.extractConstraintTypedStore = (collection) => {
  const constraints = OrderedMap(collection.globals || {}).map((_, key) => {
    return new Constraint.JSONSchema({
      title: key
    })
  })

  return { key: 'constraint', value: constraints }
}

methods.extractStoreInstance = (items, endpoints, collection) => {
  const kvs = [
    methods.extractParameterTypedStore(collection),
    methods.extractEndpointTypedStore(endpoints),
    methods.extractAuthTypedStore(items),
    methods.extractConstraintTypedStore(collection)
  ].filter(v => !!v)

  return kvs.reduce(convertEntryListInMap, {})
}

methods.extractStore = (items, endpoints, collection) => {
  const storeInstance = methods.extractStoreInstance(items, endpoints, collection)
  return { key: 'store', value: new Store(storeInstance) }
}

methods.extractItems = (items, itemGroup) => {
  if (itemGroup.request) {
    items.push(itemGroup)
    return items
  }

  if (!itemGroup.item || !Array.isArray(itemGroup.item)) {
    return items
  }

  return itemGroup.item.reduce(($items, itemOrItemGroup) => {
    return methods.extractItems($items, itemOrItemGroup)
  }, items)
}

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

  return lcPathname.slice(0, index)
}

methods.addHostEntryToHostMap = (hostMap, { key, value }) => {
  const hostname = key.get('hostname') ? key.get('hostname').generate(List([ '{{', '}}' ])) : ''
  const port = key.get('port') ? ':' + key.get('port').generate(List([ '{{', '}}' ])) : ''
  const host = hostname + port
  const pathname = key.get('pathname').generate(List([ '{{', '}}' ]))

  if (!hostMap[host]) {
    hostMap[host] = { entries: [], lcPathname: pathname.split('/') }
  }

  const lcPathname = hostMap[host].lcPathname

  hostMap[host].entries.push({ key, value })
  hostMap[host].lcPathname = methods.findLongestCommonPath(lcPathname, pathname)
  return hostMap
}

methods.getLongestCommonPathnameAsString = (lcPathname) => {
  if (lcPathname.length === 1) {
    return '/' + lcPathname[0]
  }

  return lcPathname.join('/')
}

methods.updateHostKeyWithLongestCommonPathname = ({ entries, lcPathname }, key) => {
  const lcString = methods.getLongestCommonPathnameAsString(lcPathname)
  return {
    key: key + lcString,
    value: entries
  }
}

methods.extractCommonHostsFromRequests = (items) => {
  const hosts = items
    .map(item => {
      return {
        key: new URL({
          url: item.request.urlString,
          variableDelimiters: List([ '{{', '}}', ':' ])
        }),
        value: item
      }
    })
    .reduce(methods.addHostEntryToHostMap, {})

  return OrderedMap(hosts).map(methods.updateHostKeyWithLongestCommonPathname).valueSeq().toList()
}

methods.createEndpointFromHost = (host, entries) => {
  const url = 'http://' + host

  const endpoint = new URL({
    url,
    variableDelimiters: List([ '{{', '}}', ':' ])
  })

  const protocols = entries
    .map(({ key }) => key.get('protocol').toJS())
    .reduce(flatten, [])

  const urlProtocols = Set(protocols).toList()
  return { key: host, value: endpoint.set('protocol', urlProtocols) }
}

methods.extractResourceEndpointsFromItem = (host) => {
  const reference = new Reference({
    type: 'endpoint',
    uuid: host
  })

  return { key: 'endpoints', value: OrderedMap({ [host]: reference }) }
}

// TODO deal with :pathParams in pathname
methods.extractResourcePathFromItem = (host, item) => {
  const url = item.request.urlString
  const hostPosition = url.match(host)
  if (!hostPosition) {
    return { key: 'path', value: new URL({ url: '/' }) }
  }

  const remainingIndex = hostPosition.index + host.length
  const path = url.slice(remainingIndex)
  const normalizedPath = (path[0] !== '/' ? '/' + path : path).split('?')[0]

  return {
    key: 'path',
    value: new URL({
      url: normalizedPath,
      variableDelimiters: List([ '{{', '}}', ':' ])
    })
  }
}

methods.extractResourceDescriptionFromItem = () => null

methods.extractRequestNameFromItem = (item) => {
  if (!item || !item.name) {
    return null
  }

  return { key: 'name', value: item.name }
}

methods.extractRequestDescriptionFromItem = (item) => {
  if (!item || !(item.description || (item.request || {}).description)) {
    return null
  }

  const description = item.description || item.request.description
  return { key: 'description', value: description }
}

methods.extractParameterEntryFromQueryParameter = ({ key, value }) => {
  if (!key) {
    return null
  }

  let $default = value || null
  const match = (value + '').match(/^{{([^{}]*)}}$/)
  let constraints = List()
  if (match) {
    constraints = List([ new Constraint.JSONSchema({ $ref: '#/definitions/' + match[1] }) ])
    $default = null
  }

  const $value = new Parameter({
    key,
    name: key,
    type: 'string',
    default: $default,
    constraints
  })

  return { key, value: $value }
}

methods.extractQueryBlockFromQueryParams = (queryParams) => {
  if (!queryParams || !queryParams.length) {
    return null
  }

  const block = queryParams
    .map(methods.extractParameterEntryFromQueryParameter)
    .filter(v => !!v)
    .reduce(convertEntryListInMap, {})

  return { key: 'queries', value: OrderedMap(block) }
}

methods.extractDefaultAndConstraintsValuesFromHeaderString = (value) => {
  const trimmed = ((value || '') + '').trim()
  let $default = trimmed || null
  const match = trimmed.match(/^{{([^{}]*)}}$/)
  let constraints = List()
  if (match) {
    constraints = List([ new Constraint.JSONSchema({ $ref: '#/definitions/' + match[1] }) ])
    $default = null
  }

  return { default: $default, constraints }
}

methods.extractHeaderParameterFromString = (line) => {
  const [ key, value = '' ] = line.split(':')

  if (!key) {
    return null
  }

  const {
    default: $default,
    constraints
  } = methods.extractDefaultAndConstraintsValuesFromHeaderString(value)

  const $value = new Parameter({
    key: key.trim(),
    name: key.trim(),
    type: 'string',
    default: $default,
    constraints
  })
  return { key, value: $value }
}

methods.extractHeaderBlockFromHeaderString = (headerString) => {
  const lines = headerString.split('\n')
  const block = lines
    .map(methods.extractHeaderParameterFromString)
    .filter(v => !!v)
    .reduce(convertEntryListInMap, {})

  return { key: 'headers', value: OrderedMap(block) }
}

methods.extractHeaderParameterFromObject = (header) => {
  if (!header || !header.key) {
    return null
  }

  const key = header.key
  const {
    default: $default,
    constraints
  } = methods.extractDefaultAndConstraintsValuesFromHeaderString(header.value)

  const value = new Parameter({
    key: key.trim(),
    name: key.trim(),
    type: 'string',
    default: $default,
    constraints
  })
  return { key, value }
}

methods.extractHeaderParameter = (header) => {
  if (typeof header === 'string') {
    return methods.extractHeaderParameterFromString(header)
  }

  return methods.extractHeaderParameterFromObject(header)
}

methods.extractHeaderBlockFromHeaderArray = (headerArray) => {
  const block = headerArray
    .map(methods.extractHeaderParameter)
    .filter(v => !!v)
    .reduce(convertEntryListInMap, {})

  return { key: 'headers', value: OrderedMap(block) }
}

methods.extractHeaderBlockFromHeaders = (headers) => {
  if (!headers) {
    return null
  }

  if (typeof headers === 'string') {
    return methods.extractHeaderBlockFromHeaderString(headers)
  }

  if (!Array.isArray(headers) || !headers.length) {
    return null
  }

  return methods.extractHeaderBlockFromHeaderArray(headers)
}

methods.extractBodyParameterFromUrlEncodedOrFormDataBody = ({ key, value }) => {
  if (!key) {
    return null
  }

  const $value = new Parameter({
    key,
    name: key,
    type: 'string',
    default: value
  })

  return { key, value: $value }
}

methods.extractBodyBlockFromUrlEncodedOrFormDataBody = (body) => {
  const block = (body[body.mode] || [])
    .map(methods.extractBodyParameterFromUrlEncodedOrFormDataBody)
    .filter(v => !!v)
    .reduce(convertEntryListInMap, {})

  return { key: 'body', value: OrderedMap(block) }
}

methods.extractBodyBlockFromFileBody = (body) => {
  const block = {
    file: new Parameter({ type: 'string', default: ((body || {}).file || {}).content || null })
  }

  return { key: 'body', value: OrderedMap(block) }
}

methods.extractBodyBlockFromRawBody = (body) => {
  const block = {
    raw: new Parameter({ type: 'string', default: (body || {}).raw || null })
  }

  return { key: 'body', value: OrderedMap(block) }
}

methods.extractBodyBlockFromBody = (body) => {
  if (!body) {
    return null
  }

  if (body.mode === 'urlencoded' || body.mode === 'formdata') {
    return methods.extractBodyBlockFromUrlEncodedOrFormDataBody(body)
  }

  if (body.mode === 'file') {
    return methods.extractBodyBlockFromFileBody(body)
  }

  if (body.mode === 'raw') {
    return methods.extractBodyBlockFromRawBody(body)
  }

  return null
}

methods.extractRequestParameterContainerInstanceFromItem = (item) => {
  const kvs = [
    methods.extractQueryBlockFromQueryParams((((item || {}).request || {}).url || {}).query),
    methods.extractHeaderBlockFromHeaders(((item || {}).request || {}).header),
    methods.extractBodyBlockFromBody(((item || {}).request || {}).body)
  ].filter(v => !!v)

  return kvs.reduce(convertEntryListInMap, {})
}

methods.extractRequestParametersFromItem = (item) => {
  const key = 'parameters'
  const parameterContainerInstance = methods.extractRequestParameterContainerInstanceFromItem(item)

  return { key, value: new ParameterContainer(parameterContainerInstance) }
}

// TODO
methods.extractAuthRefsFromAWSV4Auth = (auth) => {
  return {
    key: 'auths',
    value: List([
      new Reference({
        type: 'auth',
        uuid: auth.type
      })
    ])
  }
}

methods.extractAuthRefsFromBasicAuth = (auth) => {
  return {
    key: 'auths',
    value: List([
      new Reference({
        type: 'auth',
        uuid: auth.type
      })
    ])
  }
}

methods.extractAuthRefsFromDigestAuth = (auth) => {
  return {
    key: 'auths',
    value: List([
      new Reference({
        type: 'auth',
        uuid: auth.type
      })
    ])
  }
}

methods.extractAuthRefsFromHawkAuth = (auth) => {
  return {
    key: 'auths',
    value: List([
      new Reference({
        type: 'auth',
        uuid: auth.type
      })
    ])
  }
}

methods.extractAuthRefsFromNoAuthAuth = () => {
  return {
    key: 'auths',
    value: List([
      null
    ])
  }
}

methods.extractAuthRefsFromOAuth1Auth = (auth) => {
  return {
    key: 'auths',
    value: List([
      new Reference({
        type: 'auth',
        uuid: auth.type
      })
    ])
  }
}

methods.extractAuthRefsFromOAuth2Auth = (auth) => {
  return {
    key: 'auths',
    value: List([
      new Reference({
        type: 'auth',
        uuid: auth.type
      })
    ])
  }
}

/* eslint-disable max-statements */
methods.extractAuthsFromItem = (item) => {
  const auth = ((item || {}).request || {}).auth
  if (!auth) {
    return null
  }

  if (auth.type === 'awsv4') {
    return methods.extractAuthRefsFromAWSV4Auth(auth)
  }

  if (auth.type === 'basic') {
    return methods.extractAuthRefsFromBasicAuth(auth)
  }

  if (auth.type === 'digest') {
    return methods.extractAuthRefsFromDigestAuth(auth)
  }

  if (auth.type === 'hawk') {
    return methods.extractAuthRefsFromHawkAuth(auth)
  }

  if (auth.type === 'noauth') {
    return methods.extractAuthRefsFromNoAuthAuth(auth)
  }

  if (auth.type === 'oauth1') {
    return methods.extractAuthRefsFromOAuth1Auth(auth)
  }

  if (auth.type === 'oauth2') {
    return methods.extractAuthRefsFromOAuth2Auth(auth)
  }

  return null
}
/* eslint-enable max-statements */

methods.extractRequestMethodFromItem = (item) => {
  const method = (((item || {}).request || {}).method || 'get').toLowerCase()

  return { key: 'method', value: method }
}

methods.extractRequestInstanceFromItem = (endpointsEntry, item) => {
  const kvs = [
    endpointsEntry,
    methods.extractRequestNameFromItem(item),
    methods.extractRequestDescriptionFromItem(item),
    methods.extractRequestParametersFromItem(item),
    methods.extractRequestMethodFromItem(item),
    methods.extractAuthsFromItem(item)
  ].filter(v => !!v)

  return kvs.reduce(convertEntryListInMap, {})
}

methods.extractRequestFromItem = (endpointsEntry, item) => {
  const requestInstance = methods.extractRequestInstanceFromItem(endpointsEntry, item)

  return new Request(requestInstance)
}

methods.extractResourceMethodsFromItem = (endpointsEntry, item) => {
  const { value: method } = methods.extractRequestMethodFromItem(item)
  const request = methods.extractRequestFromItem(endpointsEntry, item)

  return { key: 'methods', value: OrderedMap({ [method]: request }) }
}

methods.extractResourceInstanceFromItem = (host, item) => {
  const endpointsEntry = methods.extractResourceEndpointsFromItem(host)
  const kvs = [
    endpointsEntry,
    methods.extractResourcePathFromItem(host, item),
    methods.extractResourceDescriptionFromItem(item),
    methods.extractResourceMethodsFromItem(endpointsEntry, item)
  ].filter(v => !!v)

  return kvs.reduce(convertEntryListInMap, {})
}

methods.extractResourceFromItem = (host, item) => {
  const key = item.id || item.name || null
  const resourceInstance = methods.extractResourceInstanceFromItem(host, item)

  return { key, value: new Resource(resourceInstance) }
}

methods.getResourcesFromItemEntries = (host, entries) => {
  return entries.map(({ value }) => methods.extractResourceFromItem(host, value))
}

methods.convertHostIntoResources = ({ key: host, value: entries }) => {
  const endpoint = methods.createEndpointFromHost(host, entries)
  const resources = methods.getResourcesFromItemEntries(host, entries)

  return { resources, endpoint }
}

methods.groupResourcesAndEndpoints = (
  { resources, endpoints },
  { resources: hostResources, endpoint }
) => {
  endpoints.push(endpoint)
  return { resources: resources.concat(hostResources || []), endpoints }
}

methods.mergeResources = (resourceMap, { key, value }) => {
  if (resourceMap[key]) {
    const $methods = resourceMap[key].get('methods')
    const merged = $methods.merge(value.get('methods'))
    resourceMap[key] = resourceMap[key].set('methods', merged)
  }
  else {
    resourceMap[key] = value
  }

  return resourceMap
}

methods.extractResources = (collection) => {
  const items = methods.extractItems([], collection)

  const hosts = methods.extractCommonHostsFromRequests(items)
  const { resources, endpoints } = hosts
    .map(methods.convertHostIntoResources)
    .reduce(methods.groupResourcesAndEndpoints, { resources: [], endpoints: [] })


  const resourceMap = OrderedMap(resources.reduce(methods.mergeResources, {}))
  return { resources: resourceMap, endpoints, items }
}

methods.extractApi = (collection) => {
  const { resources, endpoints, items } = methods.extractResources(collection)
  const kvs = [
    methods.extractInfo(collection),
    methods.extractGroup(collection),
    methods.extractStore(items, endpoints, collection),
    { key: 'resources', value: resources }
  ].filter(v => !!v)

  return kvs.reduce(convertEntryListInMap, {})
}

methods.parse = ({ options, item }) => {
  const apiInstance = methods.extractApi(item)

  return { options, api: new Api(apiInstance) }
}

export const __internals__ = methods
export default PostmanCollectionV2Parser
