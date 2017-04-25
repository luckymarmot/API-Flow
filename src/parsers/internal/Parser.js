import { OrderedMap, List } from 'immutable'

import ModelInfo from '../../models/ModelInfo'
import Api from '../../models/Api'
import Auth from '../../models/Auth'
import Constraint from '../../models/Constraint'
import Contact from '../../models/Contact'
import Context from '../../models/Context'
import Group from '../../models/Group'
import Info from '../../models/Info'
import Interface from '../../models/Interface'
import License from '../../models/License'
import Parameter from '../../models/Parameter'
import ParameterContainer from '../../models/ParameterContainer'
import Reference from '../../models/Reference'
import Request from '../../models/Request'
import Resource from '../../models/Resource'
import Response from '../../models/Response'
import Store from '../../models/Store'
import URL from '../../models/URL'
import URLComponent from '../../models/URLComponent'
import Variable from '../../models/Variable'

import { entries, convertEntryListInMap } from '../../utils/fp-utils'

const methods = {}

export const __meta__ = {
  version: 'v1.0',
  format: 'internal'
}

/**
 * A Parser that converts a dump of an Api Record into an actual Api Record
 */
class InternalParser {
  static __meta__ = __meta__

  /**
   * evaluates if the file is parsable by giving a score to the file depending on a few criteria.
   * @param {string} content: the content of the file to evaluate
   * @returns {number} the corresponding score, between 0 and 1
   */
  static detect(...args) {
    return methods.detect(...args)
  }

  /**
   * tries to extract a title from a RAML file
   * @param {string} content: the file to get the api title from
   * @returns {string?} the title, if it was found
   */
  static getAPIName(...args) {
    return methods.getAPIName(...args)
  }

  /**
   * converts an item into an intermediate model representation
   * @returns {Api} the corresponding Api Record
   */
  static parse(...args) {
    return methods.parse(...args)
  }
}

methods.detect = () => {}

methods.getAPIName = () => {}

methods.isParsable = () => {}

methods.extractBasicAuth = (obj) => {
  return new Auth.Basic(obj)
}

methods.extractCustomAuth = (obj) => {
  return new Auth.Custom(obj)
}

methods.extractDigestAuth = (obj) => {
  return new Auth.Digest(obj)
}

methods.extractNTLMAuth = (obj) => {
  return new Auth.NTLM(obj)
}

methods.extractNegotiateAuth = (obj) => {
  return new Auth.Negotiate(obj)
}

methods.extractApiKeyAuth = (obj) => {
  return new Auth.ApiKey(obj)
}

methods.extractOAuth1Auth = (obj) => {
  return new Auth.OAuth1(obj)
}

methods.extractOAuth2Auth = (_obj) => {
  const obj = _obj

  if (obj.scopes) {
    obj.scopes = List(obj.scopes)
  }

  return new Auth.OAuth2(obj)
}

methods.extractAWSSig4Auth = (obj) => {
  return new Auth.AWSSig4Auth(obj)
}

methods.extractHawkAuth = (obj) => {
  return new Auth.Hawk(obj)
}

methods.extractConstraint = (obj) => {
  return new Constraint.Constraint(obj)
}

methods.extractMultipleOfConstraint = (obj) => {
  return new Constraint.MultipleOf(obj.value)
}

methods.extractMaximumConstraint = (obj) => {
  return new Constraint.Maximum(obj.value)
}

methods.extractExclusiveMaximumConstraint = (obj) => {
  return new Constraint.ExclusiveMaximum(obj.value)
}

methods.extractMinimumConstraint = (obj) => {
  return new Constraint.Minimum(obj.value)
}

methods.extractExclusiveMinimumConstraint = (obj) => {
  return new Constraint.ExclusiveMinimum(obj.value)
}

methods.extractMaximumLengthConstraint = (obj) => {
  return new Constraint.MaximumLength(obj.value)
}

methods.extractMinimumLengthConstraint = (obj) => {
  return new Constraint.MinimumLength(obj.value)
}

methods.extractPatternConstraint = (obj) => {
  return new Constraint.Pattern(obj.value)
}

methods.extractMaximumItemsConstraint = (obj) => {
  return new Constraint.MaximumItems(obj.value)
}

methods.extractMinimumItemsConstraint = (obj) => {
  return new Constraint.MinimumItems(obj.value)
}

methods.extractUniqueItemsConstraint = (obj) => {
  return new Constraint.UniqueItems(obj.value)
}

methods.extractMaximumPropertiesConstraint = (obj) => {
  return new Constraint.MaximumProperties(obj.value)
}

methods.extractMinimumPropertiesConstraint = (obj) => {
  return new Constraint.MinimumProperties(obj.value)
}

methods.extractEnumConstraint = (obj) => {
  return new Constraint.Enum(obj.value)
}

methods.extractJSONSchemaConstraint = (obj) => {
  return new Constraint.JSONSchema(obj.value)
}

methods.extractXMLSchemaConstraint = (obj) => {
  return new Constraint.XMLSchema(obj.value)
}

methods.extractContact = (obj) => {
  return new Contact(obj)
}

methods.extractContext = (obj) => {
  const type = obj.type
  const constraints = List(obj.constraints || []).map(methods.extract)
  const itfs = OrderedMap(obj.implements || {}).map(methods.extract)

  const contextInstance = {
    constraints,
    type,
    implements: itfs
  }

  return new Context(contextInstance)
}

methods.extractGroup = (obj) => {
  const { id, name, description } = obj || {}
  const children = OrderedMap(obj.children || {}).map(methods.extract)

  const groupInstance = {
    id: id,
    name: name,
    description: description,
    children: children
  }

  return new Group(groupInstance)
}

methods.extractInfo = (obj) => {
  const { title, description, tos, version } = obj || {}
  const contact = methods.extract(obj.contact)
  const license = methods.extract(obj.license)

  const infoInstance = {
    title,
    description,
    tos,
    contact,
    license,
    version
  }

  return new Info(infoInstance)
}

methods.extractInterface = (obj) => {
  const { name, uuid, level, required, description } = obj || {}
  const underlay = methods.extract(obj.underlay)

  const interfaceInstance = {
    name, uuid, level, required, description, underlay
  }

  return new Interface(interfaceInstance)
}

methods.extractLicense = (obj) => {
  return new License(obj)
}

/* eslint-disable max-statements */
methods.extractParameter = (obj) => {
  const { usedIn, uuid, key, name, description, type, format, required, superType } = obj || {}
  const location = obj.in
  const defaultValue = obj.default

  const examples = List(obj.examples || [])
  const constraints = List(obj.constraints || []).map(methods.extract)
  const applicableContexts = List(obj.applicableContexts || []).map(methods.extract)
  const interfaces = OrderedMap(obj.interfaces || {}).map(methods.extract)

  let value = obj.value
  if (superType === 'sequence') {
    value = List(obj.value || []).map(methods.extract)
  }

  if (type === 'array') {
    if (Array.isArray(value)) {
      value = List(obj.value || []).map(methods.extract)
    }
    else {
      value = methods.extract(obj.value)
    }
  }

  return new Parameter({
    in: location,
    default: defaultValue,
    usedIn, uuid, key, name, description, type, format, required, superType,
    examples, constraints, applicableContexts, interfaces, value
  })
}
/* eslint-enable max-statements */

methods.extractParameterContainer = (obj) => {
  const headers = OrderedMap(obj.headers).map(methods.extract)
  const queries = OrderedMap(obj.queries).map(methods.extract)
  const body = OrderedMap(obj.body).map(methods.extract)
  const path = OrderedMap(obj.path).map(methods.extract)

  const parameterContainerInstance = {
    headers, queries, body, path
  }

  return new ParameterContainer(parameterContainerInstance)
}

methods.extractReference = (obj) => {
  const { type, uuid } = obj || {}
  const overlay = methods.extract(obj.overlay)

  const referenceInstance = { type, uuid, overlay }

  return new Reference(referenceInstance)
}

methods.extractRequest = (obj) => {
  const { id, name, description, method, timeout } = obj || {}
  const endpoints = OrderedMap(obj.endpoints || {}).map(methods.extract)
  const parameters = methods.extract(obj.parameters)
  const contexts = List(obj.contexts || []).map(methods.extract)
  const auths = List(obj.auths || []).map(methods.extract)
  const responses = OrderedMap(obj.responses || {}).map(methods.extract)
  const tags = List(obj.tags || [])
  const interfaces = OrderedMap(obj.interfaces || {}).map(methods.extract)

  const requestInstance = {
    id, name, description, method, timeout,
    endpoints, parameters, contexts, auths, responses, tags, interfaces
  }

  return new Request(requestInstance)
}

methods.extractResource = (obj) => {
  const { name, uuid, description } = obj || {}
  const endpoints = OrderedMap(obj.endpoints || {}).map(methods.extract)
  const path = methods.extract(obj.path)
  const $methods = OrderedMap(obj.methods || {}).map(methods.extract)
  const interfaces = OrderedMap(obj.interfaces || {}).map(methods.extract)

  const resourceInstance = {
    name, uuid, description, endpoints, path,
    methods: $methods,
    interfaces
  }

  return new Resource(resourceInstance)
}

methods.extractResponse = (obj) => {
  const { code, description, examples } = obj || {}
  const parameters = methods.extract(obj.parameters)
  const contexts = List(obj.contexts || []).map(methods.extract)
  const interfaces = OrderedMap(obj.interfaces || {}).map(methods.extract)

  const responseInstance = {
    code, description, examples, parameters, contexts, interfaces
  }

  return new Response(responseInstance)
}

methods.extractStore = (obj) => {
  const variable = OrderedMap(obj.variable || {}).map(methods.extract)
  const constraint = OrderedMap(obj.constraint || {}).map(methods.extract)
  const endpoint = OrderedMap(obj.endpoint || {}).map(methods.extract)
  const parameter = OrderedMap(obj.parameter || {}).map(methods.extract)
  const response = OrderedMap(obj.response || {}).map(methods.extract)
  const auth = OrderedMap(obj.auth || {}).map(methods.extract)
  const $interface = OrderedMap(obj.interface || {}).map(methods.extract)

  const storeInstance = {
    variable, constraint, endpoint, parameter, response, auth, interface: $interface
  }

  return new Store(storeInstance)
}

methods.extractURL = (obj) => {
  const {
    uuid, slashes, auth, host, path, search, query, hash, secure, description, href
  } = obj || {}
  const protocol = List(obj.protocol || [])
  const port = methods.extract(obj.port)
  const hostname = methods.extract(obj.hostname)
  const pathname = methods.extract(obj.pathname)
  const variableDelimiters = List(obj.variableDelimiters || [])

  const urlInstance = {
    uuid,
    protocol, slashes, auth, host, port, hostname, path, pathname, href,
    search, query, hash, secure,
    variableDelimiters, description
  }

  return new URL().merge(urlInstance)
}

methods.extractURLComponent = (obj) => {
  const { componentName, string } = obj || {}
  const parameter = methods.extract(obj.parameter)
  const variableDelimiters = List(obj.variableDelimiters || [])

  const urlComponentInstance = { componentName, string, parameter, variableDelimiters }

  return new URLComponent(urlComponentInstance)
}

methods.extractVariable = (obj) => {
  const { name, defaultEnvironment } = obj || {}
  const values = OrderedMap(obj.values || {})

  const variableInstance = { name, values, defaultEnvironment }

  return new Variable(variableInstance)
}

methods.extractApi = (obj) => {
  const resources = entries(obj.resources || {})
      .map(methods.extract)
      .reduce(convertEntryListInMap, {})
  const group = methods.extract(obj.group)
  const store = methods.extract(obj.store)
  const info = methods.extract(obj.info)

  const apiInstance = {
    resources: OrderedMap(resources),
    group: group,
    store: store,
    info: info
  }

  return new Api(apiInstance)
}

methods.traverse = (_obj) => {
  let obj = _obj
  if (!obj) {
    return obj
  }

  if (typeof obj === 'object') {
    const keys = Object.keys(obj || {})
    for (const key of keys) {
      obj[key] = methods.extract(obj[key])
    }
  }

  if (Array.isArray(obj)) {
    obj = obj.map(item => methods.extract(item))
  }

  return obj
}

const classMap = {
  'api.core.models': methods.extractApi,
  'basic.auth.models': methods.extractBasicAuth,
  'custom.auth.models': methods.extractCustomAuth,
  'digest.auth.models': methods.extractDigestAuth,
  'ntlm.auth.models': methods.extractNTLMAuth,
  'negotiate.auth.models': methods.extractNegotiateAuth,
  'api-key.auth.models': methods.extractApiKeyAuth,
  'oauth-1.auth.models': methods.extractOAuth1Auth,
  'oauth-2.auth.models': methods.extractOAuth2Auth,
  'aws-sig-4.auth.models': methods.extractAWSSig4Auth,
  'hawk.auth.models': methods.extractHawkAuth,
  'constraint.constraint.models': methods.extractConstraint,
  'multiple-of.constraint.models': methods.extractMultipleOfConstraint,
  'maximum.constraint.models': methods.extractMaximumConstraint,
  'exclusive-maximum.constraint.models': methods.extractExclusiveMaximumConstraint,
  'minimum.constraint.models': methods.extractMinimumConstraint,
  'exclusive-minimum.constraint.models': methods.extractExclusiveMinimumConstraint,
  'maximum-length.constraint.models': methods.extractMaximumLengthConstraint,
  'minimum-length.constraint.models': methods.extractMinimumLengthConstraint,
  'pattern.constraint.models': methods.extractPatternConstraint,
  'maximum-items.constraint.models': methods.extractMaximumItemsConstraint,
  'minimum-items.constraint.models': methods.extractMinimumItemsConstraint,
  'unique-items.constraint.models': methods.extractUniqueItemsConstraint,
  'maximum-properties.constraint.models': methods.extractMaximumPropertiesConstraint,
  'minimum-properties.constraint.models': methods.extractMinimumPropertiesConstraint,
  'enum.constraint.models': methods.extractEnumConstraint,
  'json.constraint.models': methods.extractJSONSchemaConstraint,
  'xml.constraint.models': methods.extractXMLSchemaConstraint,
  'contact.utils.models': methods.extractContact,
  'context.core.models': methods.extractContext,
  'group.models': methods.extractGroup,
  'info.utils.models': methods.extractInfo,
  'interface.models': methods.extractInterface,
  'license.utils.models': methods.extractLicense,
  'parameter.core.models': methods.extractParameter,
  'parameter-container.core.models': methods.extractParameterContainer,
  'reference.models': methods.extractReference,
  'request.models': methods.extractRequest,
  'resource.models': methods.extractResource,
  'response.core.models': methods.extractResponse,
  'store.models': methods.extractStore,
  'url.models': methods.extractURL,
  'url-component.models': methods.extractURLComponent,
  'variable.models': methods.extractVariable
}

methods.extract = (obj) => {
  if (obj && obj._model && classMap[obj._model.name]) {
    obj._model = new ModelInfo(obj._model)
    return classMap[obj._model.name](obj)
  }

  const _obj = methods.traverse(obj)
  return _obj
}

methods.parse = ({ options, item }) => {
  const api = methods.extract(item)

  return { options, api }
}

export const __internals__ = methods
export default InternalParser
