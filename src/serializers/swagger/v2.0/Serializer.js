/**
 * A Swagger v2 serializer.
 * This implementation has the following limitations:
 * - it will not create a global security field (securityDefinitions will be included though).
 * - it will not use the externalDocs, as this is field is still not supported
 * - the auths field in a Request **MUST** only be composed of References
 * - null Auth not supported at the moment
 *
 * NOTE: we allow use of undefined in this file as it works nicely with JSON.stringify, which drops
 * keys with a value of undefined.
 * ```
 * const swagger = { info, security }
 * ```
 * is easier to read than
 * ```
 * const swagger = { info }
 * if (security) {
 *   swagger.security = security
 * }
 * ```
 *
 * NOTE: we make the assumption that keys of a container are equal to the uuids of the objects it
 * holds.
 *
 * NOTE: we assume that keys of a response map are status codes
 * NOTE: we assume that keys of a methods map are method names.
 */
 /* eslint-disable no-undefined */
import { List, Set } from 'immutable'
import yaml from 'js-yaml'

import Constraint from '../../../models/Constraint'
import Reference from '../../../models/Reference'
import Auth from '../../../models/Auth'
import Parameter from '../../../models/Parameter'
import URL from '../../../models/URL'

import { currify, entries, convertEntryListInMap, flatten } from '../../../utils/fp-utils'

const __meta__ = {
  format: 'swagger',
  version: 'v2.0'
}

const methods = {}

// TODO move this to a better place
methods.getKeysFromRecord = (keyMap, record) => {
  return entries(keyMap)
    .map(({ key, value }) => ({ key, value: record.get(value) }))
    .filter(({ value }) => typeof value !== 'undefined' && value !== null)
    .reduce(convertEntryListInMap, {})
}

/**
 * A Serializer to convert Api Records into Swagger v2.0.
 */
export class SwaggerSerializer {
  static __meta__ = __meta__

  /**
   * serializes an Api into a Swagger v2.0 formatted string
   * @param {Api} api: the api to convert
   * @returns {string} the corresponding postman collection, as a string
   */
  static serialize(api) {
    return methods.serialize(api)
  }

  /**
   * returns a quality score for a content string wrt. to the Swagger v2.0 format.
   * @param {String} content: the content of the file to analyze
   * @returns {number} the quality of the content
   */
  static validate(content) {
    return methods.validate(content)
  }
}

/**
 * converts a string written in JSON or YAML format into an object
 * @param {string} str: the string to parse
 * @returns {Object?} the converted object, or null if str was not a JSON or YAML string
 */
methods.parseJSONorYAML = (str) => {
  let parsed
  try {
    parsed = JSON.parse(str)
  }
  catch (jsonParseError) {
    try {
      parsed = yaml.safeLoad(str)
    }
    catch (yamlParseError) {
      return null
    }
  }

  return parsed
}

/* eslint-disable max-statements */
/**
 * looks (simplistically) at a Swagger file and gives it a quality score between 0 and 1.
 * @param {SwaggerObject} swagger: the swagger file to analyze (here deconstructed)
 * @returns {number} the quality of the swagger file wrt. to the version 2 format
 *
 * TODO: add reasons for low scores. Maybe use the format:
 * {
 *   format: 'swagger',
 *   version: 'v2.0',
 *   score: [0-1],
 *   warnings: Array<string>
 * }
 */
methods.getQualityScore = ({
  swagger,
  info,
  paths,
  host,
  schemes,
  securityDefinitions,
  definitions,
  parameters
}) => {
  let score = 0
  if (swagger !== '2.0' || !info || !paths) {
    return score
  }
  const pathKeys = Object.keys(paths)
  score = 1 - 1 / (pathKeys.length + 1)
  score += host ? 0.1 : -0.1
  score += schemes ? 0.1 : -0.1
  score += securityDefinitions ? 0.1 : 0
  score += definitions ? 0.1 : 0
  score += parameters ? 0.1 : 0

  score = Math.min(Math.max(score, 0), 1)
  return score
}
/* eslint-enable max-statements */

/**
 * returns a quality score for a content string wrt. to the swagger v2 format.
 * @param {String} content: the content of the file to analyze
 * @returns {number} the quality of the content
 */
methods.validate = (content) => {
  const parsed = methods.parseJSONorYAML(content)
  if (!parsed) {
    return 0
  }

  return methods.getQualityScore(parsed)
}

/**
 * creates a swagger format object
 * @returns {string} the expected format object
 */
methods.getSwaggerFormatObject = () => {
  return '2.0'
}

/**
 * creates a default info object
 * @returns {
 *   {
 *     title: string,
 *     version: string§
 *   }
 * } the default info object
 */
methods.getDefaultInfoObject = () => {
  return {
    title: 'Unknown API',
    version: 'v0.0.0'
  }
}

/**
 * creates a valid default contact object.
 * @returns {SwaggerContactObject} the default valid contact object
 */
methods.getDefaultContactObject = () => {
  return {}
}

/**
 * extracts the swagger Contact object from an Info Record.
 * @param {Info} $info: the info record to get the contact from.
 * @returns {SwaggerContactObject} the corresponding contact object
 */
methods.getContactObject = ($info) => {
  const $contact = $info.get('contact')
  if (!$contact) {
    return methods.getDefaultContactObject()
  }

  const keyMap = {
    name: 'name',
    url: 'url',
    email: 'email'
  }

  return methods.getKeysFromRecord(keyMap, $contact)
}

/**
 * creates a valid default license object.
 * @returns {SwaggerLicenseObject} the default valid license object
 */
methods.getDefaultLicenseObject = () => {
  return {
    name: 'informal'
  }
}

/**
 * extracts the swagger License object from an Info Record.
 * @param {Info} $info: the info record to get the license from.
 * @returns {SwaggerLicenseObject} the corresponding license object
 */
methods.getLicenseObject = ($info) => {
  const $license = $info.get('license')
  if (!$license || !$license.get('name')) {
    return methods.getDefaultLicenseObject()
  }

  const keyMap = {
    name: 'name',
    url: 'url'
  }

  return methods.getKeysFromRecord(keyMap, $license)
}

/* eslint-disable max-statements */
/**
 * extracts the swagger Info object from an api.
 * @param {Api} $api: the api to get the info from.
 * @returns {SwaggerInfoObject} the corresponding info object
 */
methods.getInfoObject = ($api) => {
  const $info = $api.get('info')
  if (!$info) {
    return methods.getDefaultInfoObject()
  }

  const keyMap = {
    title: 'title',
    description: 'description',
    termsOfService: 'tos',
    version: 'version'
  }

  const info = methods.getKeysFromRecord(keyMap, $info)

  if ($info.get('contact')) {
    info.contact = methods.getContactObject($info)
  }

  if ($info.get('license')) {
    info.license = methods.getLicenseObject($info)
  }

  if (!info.title) {
    info.title = 'Unknown API'
  }

  if (!info.version) {
    info.version = 'v0.0.0'
  }

  return info
}
/* eslint-enable max-statements */

/**
 * tests whether a Record is a Reference or not
 * @param {Record} record: the record to test
 * @returns {boolean} true if it is a Reference, false otherwise
 */
methods.isReference = (record) => record instanceof Reference

/**
 * extracts endpoint references from a resource
 * @param {Resource} resource: the resource from which to get the shared endpoints.
 * @returns {OrderedMap<string, Reference>} the references to shared enpoints from this resource
 */
methods.getEnpointsSharedByResource = (resource) => {
  return resource.get('endpoints').filter(methods.isReference)
}

/**
 * extracts the Uuid of a reference
 * @param {Reference} reference: the reference to find the uuid of
 * @returns {string} the uuid of the reference
 */
methods.getUuidOfReference = (reference) => reference.get('uuid')

methods.getEndpointFromBestEntry = (api, { key }) => {
  const sharedEndpoint = api.getIn([ 'store', 'endpoint', key ])
  if (sharedEndpoint) {
    return sharedEndpoint
  }

  const sharedVariable = api.getIn([ 'store', 'variable', key ])
  if (!sharedVariable) {
    return null
  }

  const firstValueInVariable = sharedVariable.get('values').valueSeq().get(0)
  if (!firstValueInVariable) {
    return null
  }

  return new URL({ url: firstValueInVariable })
}

/**
 * searches for the most used common endpoint.
 * @param {Api} api: the api to fnid the most common endpoint of.
 * @returns {URL} the most common endpoint, if there is one.
 */
methods.getMostCommonEndpoint = (api) => {
  const resources = api.get('resources')

  const bestEntry = resources
    .valueSeq()
    .map(methods.getEnpointsSharedByResource)
    .flatten(true)
    .map(methods.getUuidOfReference)
    .countBy(v => v)
    .reduce((best, value, key) => best.value > value ? best : { key, value }, {})

  return methods.getEndpointFromBestEntry(api, bestEntry)
}

/**
 * removes `:` from the protocol if it ends with it.
 * @param {string} protocol: the protocol to strip.
 * @return {string} the normalized protocol
 */
methods.removeDotsFromProtocol = (protocol) => {
  if (protocol[protocol.length - 1] === ':') {
    return protocol.slice(0, protocol.length - 1)
  }

  return protocol
}

/**
 * gets the schemes of an enpoint.
 * @param {URL} endpoint: the endpoint to get the schemes of.
 * @returns {Array<string>} the corresponding schemes
 */
methods.getSchemesFromEndpoint = (endpoint) => {
  return endpoint.get('protocol')
    .map(methods.removeDotsFromProtocol)
    .toJS()
}

/**
 * returns the host and pathname of an endpoint.
 * @param {URL} endpoint: the endpoint to get the host and pathname from.
 * @return {
 *   {
 *     host: string?,
 *     basePath: string?
 *   }
 * } the host and basePath associated with this endpoint
 *
 * TODO: the host and basePath string should not be templated. use generate instead of toURLObject
 */
methods.getHostAndBasePathFromEndpoint = (endpoint) => {
  const delimiters = List([ '{', '}' ])
  const urlObject = endpoint.toURLObject(delimiters)

  return {
    host: urlObject.host || undefined,
    basePath: urlObject.pathname || undefined
  }
}

/**
 * extracts endpoint related fields out of an Api Record.
 * @param {Api} api: the Api to get the protocol, host, and basePath from.
 * @returns {
 *   {
 *     schemes: Array<string>?,
 *     host: string?,
 *     basePath: string?
 *   }
 * } the global endpoint fields
 */
methods.getEndpointRelatedObjects = (api) => {
  const endpoint = methods.getMostCommonEndpoint(api)
  if (!endpoint) {
    return {}
  }

  const schemes = methods.getSchemesFromEndpoint(endpoint)
  const { host, basePath } = methods.getHostAndBasePathFromEndpoint(endpoint)

  return { schemes, host, basePath }
}

/**
 * extracts shared JSON Schemas from the store of an API and returns them as a Definitions Object.
 * @param {Api} api: the api to get the JSON Schemas from
 * @returns {SwaggerDefinitionsObject} the definitions of this Api.
 */
methods.getDefinitions = (api) => {
  const constraints = api.getIn([ 'store', 'constraint' ])
    .filter(constraint => constraint instanceof Constraint.JSONSchema)
    .map((constraint, key) => {
      return { key, value: constraint.toJSONSchema() }
    })
    .reduce(convertEntryListInMap, {})

  if (Object.keys(constraints).length === 0) {
    return undefined
  }

  return constraints
}

/**
 * converts a Parameter or Reference into a SwaggerHeaderObject
 * @param {Store} store: the store to use to resolve references
 * @param {Parameter|Reference} parameterOrReference: the parameter or reference to convert.
 * @returns {SwaggerHeaderObject} the corresponding header object
 *
 * TODO: take contexts into account.
 */
methods.getHeaderFromHeaderParameterOrReference = (store, parameterOrReference) => {
  let resolved = parameterOrReference
  if (parameterOrReference instanceof Reference) {
    resolved = store.getIn([ 'parameter', parameterOrReference.get('uuid') ])
  }

  if (!resolved || resolved.get('key') === 'Content-Type') {
    return null
  }

  return methods.convertParameterToHeaderObject(resolved)
}

/**
 * extracts the headers of a response, and converts them into HeaderObjects.
 * @param {Store} store: the store to use to resolve references
 * @param {Response} response: the response to get the headers of.
 * @returns {SwaggerHeadersObject} the object holding all headers of the response
 *
 * TODO: take contexts into account.
 */
methods.getHeadersFromResponse = (store, response) => {
  const headers = response.getIn([ 'parameters', 'headers' ])
    .map((param) => methods.getHeaderFromHeaderParameterOrReference(store, param))
    .filter(v => !!v)
    .reduce(convertEntryListInMap, {})

  if (Object.keys(headers).length === 0) {
    return undefined
  }

  return headers
}

/**
 * extracts a Schema from a response.
 * @param {Response} response: the response to get a schema from
 * @returns {JSONSchema?} the corresponding json schema, if it exists.
 *
 * TODO: take contexts into account.
 */
methods.getSchemaFromResponse = (response) => {
  const schema = response.getIn([ 'parameters', 'body' ])
    .valueSeq()
    .map(param => param.getJSONSchema(false))
    .toJS()[0]

  return schema
}

/**
 * converts a response record into a response object.
 * @param {Store} store: the store to use to resolve references
 * @param {string} key: the key of the response record in its container (either a store, or a
 * request)
 * @param {Response} value: the response record to convert into a response object
 * @returns {SwaggerResponseObject} the corresponding swagger response object.
 */
methods.convertResponseRecordToResponseObject = (store, { key, value }) => {
  const response = {}

  if (value.get('description')) {
    response.description = value.get('description')
  }
  else {
    response.description = 'no description was provided for this response'
  }

  response.headers = methods.getHeadersFromResponse(store, value)
  response.schema = methods.getSchemaFromResponse(value)

  return {
    key,
    value: response
  }
}

/**
 * extract shared responses from an api and stores them in a Response Definitions Object.
 * @param {Api} api: the api to get the shared responses from.
 * @returns {SwaggerResponseDefinitionsObject} the corresponding response definitions object.
 */
methods.getResponseDefinitions = (api) => {
  const store = api.get('store')

  const convertResponseRecordToResponseObject = currify(
    methods.convertResponseRecordToResponseObject, store
  )

  const responses = store.get('response')
    .map((value, key) => ({ key, value }))
    .map(convertResponseRecordToResponseObject)
    .reduce(convertEntryListInMap, {})

  if (Object.keys(responses).length === 0) {
    return undefined
  }

  return responses
}

/**
 * converts a BasicAuth into a valid security definition.
 * @param {BasicAuth} auth: the auth to converts
 * @returns {SwaggerSecurityDefinitionObject} the corresponding security definition
 */
methods.convertBasicAuth = (auth) => {
  const securityScheme = {
    type: 'basic'
  }

  if (auth.get('description')) {
    securityScheme.description = auth.get('description')
  }

  return {
    key: auth.get('authName'),
    value: securityScheme
  }
}

/**
 * converts an ApiKeyAuth into a valid security definition.
 * @param {ApiKeyAuth} auth: the auth to converts
 * @returns {SwaggerSecurityDefinitionObject} the corresponding security definition
 */
methods.convertApiKeyAuth = (auth) => {
  const keyMap = {
    description: 'description',
    name: 'name',
    in: 'in'
  }

  const securityScheme = methods.getKeysFromRecord(keyMap, auth)
  securityScheme.type = 'apiKey'

  return {
    key: auth.get('authName'),
    value: securityScheme
  }
}

/**
 * converts an OAuth2Auth into a valid security definition.
 * @param {OAuth2Auth} auth: the auth to converts
 * @returns {SwaggerSecurityDefinitionObject} the corresponding security definition
 */
methods.convertOAuth2Auth = (auth) => {
  const keyMap = {
    description: 'description',
    flow: 'flow',
    authorizationUrl: 'authorizationUrl',
    tokenUrl: 'tokenUrl'
  }

  const securityScheme = methods.getKeysFromRecord(keyMap, auth)
  securityScheme.type = 'oauth2'
  securityScheme.scopes = auth.get('scopes').reduce(convertEntryListInMap, {})

  return {
    key: auth.get('authName'),
    value: securityScheme
  }
}

/**
 * converts an Auth into a valid security definition.
 * @param {Auth} auth: the auth to converts
 * @returns {SwaggerSecurityDefinitionObject?} the corresponding security definition
 *
 * TODO deal with unknown auth methods
 */
methods.convertAuthToSecurityRequirementEntry = (auth) => {
  if (auth instanceof Auth.Basic) {
    return methods.convertBasicAuth(auth)
  }

  if (auth instanceof Auth.ApiKey) {
    return methods.convertApiKeyAuth(auth)
  }

  if (auth instanceof Auth.OAuth2) {
    return methods.convertOAuth2Auth(auth)
  }

  return null
}

/**
 * gets shared auth methods from the api.
 * @param {Api} api: the api to get the shared authentication methods from.
 * @returns {SwaggerSecurityDefinitionsObject?} the corresponding security definitions object if it
 * should exist.
 */
methods.getSecurityDefinitions = (api) => {
  const securityDefinitions = api.getIn([ 'store', 'auth' ])
    .map(methods.convertAuthToSecurityRequirementEntry)
    .filter(value => !!value)
    .reduce(convertEntryListInMap, {})

  if (Object.keys(securityDefinitions).length === 0) {
    return undefined
  }

  return securityDefinitions
}

/**
 * converts a Parameter record into a Schema parameter (subset of the Parameter Object
 * implementation in swagger that only has certain fields, that are wildly different from the
 * more standard Parameter Object spec for query, path and header params)
 *
 * @param {Parameter} parameter: the parameter to convert into a schema parameter.
 * @param {string} key: the key of the Parameter in its container.
 * @returns {Entry<string, SwaggerSchemaParameterObject>} the corresponding parameter object.
 *
 * NOTE: This method has parameter as [value, key] instead of {key, value} because it is invoked
 * on an Immutable structure.
 */
methods.convertParameterToSchemaParameter = (parameter, key) => {
  const keyMap = {
    description: 'description',
    required: 'required'
  }

  const param = methods.getKeysFromRecord(keyMap, parameter)
  param.schema = parameter.getJSONSchema(false)
  param.in = 'body'

  param.name = parameter.get('key') || parameter.get('name') || 'body'

  return { key, value: param }
}

/**
 * tests whether a Parameter is a body or a formData parameter, by checking if it is restrained to
 * form-data or urlEncoded contexts.
 * @param {Parameter} parameter: the parameter to test
 * @return {boolean} true if it is a body param, false otherwise
 */
methods.isBodyParameter = (parameter) => {
  if (parameter.get('in') !== 'body') {
    return false
  }

  if (parameter.get('applicableContexts').size === 0) {
    return true
  }

  const isFormData = parameter.isValid(
    new Parameter({
      key: 'Content-Type',
      default: 'multipart/form-data'
    })
  )

  const isUrlEncoded = parameter.isValid(
    new Parameter({
      key: 'Content-Type',
      default: 'application/x-www-form-urlencoded'
    })
  )

  return !isFormData && !isUrlEncoded
}

/**
 * maps a ParameterContainer location to a swagger location (for the parameter.in field)
 * @param {Parameter} parameter: the parameter to get the correct location for
 * @returns {'query'|'header'|'path'|'formData'?} the corresponding location
 *
 * NOTE: this method assumes that body parameters have been filtered to weed out Schema Parameters.
 */
methods.getParamLocation = (parameter) => {
  const locationMap = {
    queries: 'query',
    headers: 'header',
    path: 'path',
    body: 'formData'
  }

  return locationMap[parameter.get('in')]
}

/**
 * returns common parameter fields that are used by parameters, items object, and headers object
 * @param {Parameter} parameter: the parameter to get the fields from
 * @returns {CommonParameterObject} the fields that are shared by all types of "parameter" objects.
 *
 * NOTE: the following fields are not included:
 *   - name
 *   - in
 *   - description
 *   - required
 */
methods.getCommonFieldsFromParameter = (parameter) => {
  if (!parameter) {
    return {}
  }

  const schema = parameter.getJSONSchema(false)
  const {
    type,
    maximum, minimum, exclusiveMaximum, exclusiveMinimum, multipleOf,
    maxLength, minLength, pattern,
    maxItems, minItems, uniqueItems
  } = schema

  const commonFields = {
    type: type !== 'object' ? type : 'string',
    'x-real-type': type === 'object' ? type : undefined,
    maximum, minimum, exclusiveMinimum, exclusiveMaximum, multipleOf,
    maxLength, minLength, pattern,
    maxItems, minItems, uniqueItems,
    default: schema.default, enum: schema.enum
  }

  return commonFields
}

/**
 * converts a Parameter Object to a Swagger Items Object.
 * @param {Parameter} parameter: the parameter to convert
 * @returns {Entry<null, SwaggerItemsObject>} the corresponding items object.
 *
 * NOTE: this methods adds no fields to the common fields generated from the parameter.
 */
methods.convertParameterToItemsObject = (parameter) => {
  if (parameter instanceof Reference) {
    return { value: '#/parameters/' + parameter.get('uuid') }
  }

  const value = methods.getCommonFieldsFromParameter(parameter)

  return { value }
}

/**
 * converts a Parameter Object to a Swagger Header Object.
 * @param {Parameter} parameter: the parameter to convert
 * @param {string} key: the key of the parameter in its container
 * @returns {Entry<string, SwaggerHeaderObject>} the corresponding header object.
 *
 * NOTE: this methods adds the following fields to the common fields from a parameter.
 *   - description
 *
 * NOTE: This method has parameter as [value, key] instead of {key, value} because it is invoked
 * on an Immutable structure.
 */
methods.convertParameterToHeaderObject = (parameter) => {
  const key = parameter.get('key')
  const value = methods.getCommonFieldsFromParameter(parameter)

  value.description = parameter.get('description') || undefined

  return { key, value }
}

/**
 * converts a Parameter Object to a standard Swagger Parameter Object.
 * @param {Parameter} parameter: the parameter to convert
 * @param {string} key: the key of the parameter in its container
 * @returns {Entry<string, SwaggerParameterObject>} the corresponding parameter object.
 *
 * NOTE: this methods adds the following fields to the common fields from a parameter.
 *   - name
 *   - description
 *   - required
 *   - in
 *   - items (if type is array)
 *
 * NOTE: This method has parameter as [value, key] instead of {key, value} because it is invoked
 * on an Immutable structure.
 */
methods.convertParameterToStandardParameterObject = (parameter, key) => {
  const value = methods.getCommonFieldsFromParameter(parameter)

  value.name = parameter.get('key') || undefined
  value.description = parameter.get('description') || undefined
  value.required = parameter.get('required') !== null ? parameter.get('required') : undefined
  value.in = methods.getParamLocation(parameter)

  if (value.type === 'array') {
    const itemsEntry = methods.convertParameterToItemsObject(parameter.get('value'))
    value.items = itemsEntry.value
  }

  return { key, value }
}

/**
 * converts a Parameter Object to a Swagger Parameter Object.
 * @param {Parameter} parameter: the parameter to convert
 * @param {string} key: the key of the parameter in its container
 * @returns {Entry<string, SwaggerParameterObject>} the corresponding parameter object.
 *
 * NOTE: This method has parameter as [value, key] instead of {key, value} because it is invoked
 * on an Immutable structure.
 */
methods.convertParameterToParameterObject = (parameter, key) => {
  if (methods.isBodyParameter(parameter)) {
    return methods.convertParameterToSchemaParameter(parameter, key)
  }

  return methods.convertParameterToStandardParameterObject(parameter, key)
}

/**
 * gets the shared parameter defintions from an Api and stores them in a ParameterDefinitions Object
 * @param {Api} api: the api to get the shared parameters from
 * @returns {SwaggerParameterDefinitionsObject?} the corresponding parameter definition object, if
 * it should exist
 */
methods.getParameterDefinitions = (api) => {
  const parameterDefinitions = api.getIn([ 'store', 'parameter' ])
    .filter(param => !methods.isConsumesHeader(param) && !methods.isProducesHeader(param))
    .map(methods.convertParameterToParameterObject)
    .filter(value => !!value)
    .reduce(convertEntryListInMap, {})

  if (Object.keys(parameterDefinitions).length === 0) {
    return undefined
  }

  return parameterDefinitions
}

/**
 * tests whether an interface can be used for tags or not. (the interface has to be at the request
 * or resource level to be applicable)
 * @param {Interface} itf: the interface to test
 * @returns {boolean} true if the itf can be converted in a tag.
 */
methods.isUseableAsTag = (itf) => {
  return !!itf && (itf.get('level') === 'request' || itf.get('level') === 'resource')
}

/**
 * converts an Interface into a tag.
 * @param {Interface} itf: the interface to convert.
 * @returns {SwaggerTagObject} the corresponding tag
 */
methods.convertInterfaceToTagObject = (itf) => {
  const keyMap = {
    name: 'uuid',
    description: 'description'
  }

  const tag = methods.getKeysFromRecord(keyMap, itf)

  if (!tag.name) {
    tag.name = 'unnamedTag'
  }

  return tag
}

/**
 * gets tag definitions from an api
 * @param {Api} api: the api to get the tags from
 * @returns {SwaggerTagDefinitionsObject} the corresponding tags
 *
 * NOTE: this only defines shared interfaces that are at the Resource or Request level.
 * This does not create a tag definition for non shared interfaces (which should be very rare)
 * This is however not an issue, since having a tag definition is not a requirement for tags defined
 * in an operation object
 */
methods.getTagDefinitions = (api) => {
  const tagDefinitions = api.getIn([ 'store', 'interface' ])
    .filter(methods.isUseableAsTag)
    .map(methods.convertInterfaceToTagObject)
    .valueSeq()
    .toJS()

  return tagDefinitions
}

/**
 * extracts the path from a Resource.
 * @param {Resource} resource: the resource to get the path from.
 * @returns {string?} the corresponding path
 */
methods.getPathFromResource = (resource) => {
  const path = resource.get('path').toURLObject(List([ '{', '}' ])).pathname

  if (path[0] !== '/') {
    return '/' + path
  }

  return path
}

/**
 * converts an interface or reference into a tag string
 * @param {Interface|Reference} interfaceOrReference: the interface or reference to convert
 * @return {string} the corresponding tag string
 *
 * NOTE: a Tag string is different from a Tag Definition
 */
methods.convertInterfaceToTagString = (interfaceOrReference) => interfaceOrReference.get('uuid')

/**
 * extracts all tags from a resource or request object
 * @param {Resource|Request} resourceOrRequest: the Resource or Request to get the tags from.
 * @returns {Array<string>} the corresponding tag strings.
 */
methods.getTagStrings = (resourceOrRequest) => {
  return resourceOrRequest.get('interfaces')
    .valueSeq()
    .map(methods.convertInterfaceToTagString)
    .filter(tag => !!tag)
    .toJS()
}

/**
 * adds tags from a resource or a request to an operation
 * @param {Resource|Request} resourceOrRequest: the Resource or Request to get the tags from.
 * @param {SwaggerOperationObject} operation: the operation object to update
 * @returns {SwaggerOperationObject} the update operation object
 */
methods.addTagsToOperation = (resourceOrRequest, operation) => {
  const tags = methods.getTagStrings(resourceOrRequest)

  if (tags.length === 0) {
    return operation
  }

  operation.tags = [].concat(operation.tags || [], tags)
  return operation
}

/**
 * tests whether two array have the same objects, regardless of order or repetition.
 * @param {Array<*>} first: the first array to compare
 * @param {Array<*>} second: the second array to compare
 * @returns {boolean} returns true if both arrays have the same set of objects, returns false
 * otherwise
 */
methods.equalSet = (first, second) => {
  return Set(first).equals(Set(second))
}

/**
 * extracts the consumes entry of an operation. Returns nothing if the consumes field is not defined
 * or if it is identical to the globally defined consumes field
 * @param {Array<string>} globalConsumes: the globally defined consumes field.
 * @param {ParameterContainer} container: the parameter container that holds the headers of this
 * request, which potentially include a Content-Type header.
 * @returns {Array<string>?} the corresponding consumes field
 */
methods.getConsumesEntry = (globalConsumes, container) => {
  const headers = container.get('headers')
  const consumes = methods.getContentTypeFromFilteredParams(headers, methods.isConsumesHeader)

  if (consumes.length && !methods.equalSet(consumes, globalConsumes)) {
    return Array.from(new Set(consumes))
  }

  return undefined
}

/**
 * extracts the produces entry of an operation. Returns nothing if the produces field is not defined
 * or if it is identical to the globally defined produces field
 * @param {Store} store: the store to use to resolve references
 * @param {Request} request: the request from which to get the responses and their respective
 * headers, which potentially include Content-Type headers.
 * @param {Array<string>} globalProduces: the globally defined produces field.
 * @returns {Array<string>?} the corresponding produces field
 */
methods.getProducesEntry = (store, request, globalProduces) => {
  const produces = request.get('responses')
    .map(response => response.get('parameters').resolve(store).get('headers'))
    .map(headers => methods.getContentTypeFromFilteredParams(headers, methods.isProducesHeader))
    .reduce(flatten, [])

  if (produces.length && !methods.equalSet(produces, globalProduces)) {
    return Array.from(new Set(produces))
  }

  return undefined
}

/**
 * converts a reference into a Parameter Reference Object, which in this case is just a $ref field
 * @param {Reference} reference: the reference to convert into a parameter reference object.
 * @returns {Entry<null, SwaggerReferenceObject>} the corresponding reference object.
 */
methods.convertReferenceToParameterObject = (reference) => {
  return {
    value: {
      $ref: '#/parameters/' + reference.get('uuid')
    }
  }
}

/**
 * converts a Reference or a Parameter into a swagger parameter (reference) object.
 * @param {Parameter|Reference} parameterOrReference: the parameter or reference to convert,
 * @param {string} key: the key of the parameter in the container that holds it.
 * @returns {SwaggerReferenceObject|SwaggerParameterObject} the corresponding parameter object
 *
 * NOTE: This method has parameter as [value, key] instead of {key, value} because it is invoked
 * on an Immutable structure.
 */
methods.convertReferenceOrParameterToParameterObject = (parameterOrReference, key) => {
  if (parameterOrReference instanceof Reference) {
    return methods.convertReferenceToParameterObject(parameterOrReference)
  }

  return methods.convertParameterToParameterObject(parameterOrReference, key)
}

/**
 * converts a Parameter Map into an array of swagger parameter or reference objects.
 * @param {OrderedMap<string, Parameter>} params: the parameters to convert
 * @returns {Array<SwaggerParameterObject|SwaggerReferenceObject>} the corresponding parameter or
 * reference objects.
 */
methods.convertParameterMapToParameterObjectArray = (params) => {
  return params.map(methods.convertReferenceOrParameterToParameterObject)
    .valueSeq()
    .map(({ value }) => value)
    .toJS()
}

/**
 * tests whether a Parameter or Reference is NOT a consumes header parameter.
 * @param {Store} store: the store to use to resolve references
 * @param {Parameter|Reference} parameterOrReference: the parameter or reference to test
 * @returns {boolean} false if it is a consumes header parameter, true otherwise
 */
methods.isParameterOrReferenceNotAConsumesHeader = (store, parameterOrReference) => {
  let resolved = parameterOrReference
  if (parameterOrReference instanceof Reference) {
    resolved = store.getIn([ 'parameter', parameterOrReference.get('uuid') ])
  }

  return !methods.isConsumesHeader(resolved)
}

/**
 * extracts parameters from a request.
 * @param {Store} store: the store to use to resolve references
 * @param {Request} request: the request to get the parameters from.
 * @returns {Array<SwaggerParameterObject|SwaggerReferenceObject>} the corresponding parameter or
 * reference objects.
 *
 * NOTE: Due to the fact that swagger expects only one body parameter at most, and does not support
 * contexts, we have to split the body parameters to remove additional body params.
 *
 * TODO: this needs improvements
 */
methods.getParametersFromRequest = (store, request) => {
  const headers = methods.convertParameterMapToParameterObjectArray(
    request.getIn([ 'parameters', 'headers' ])
      .filter((param) => methods.isParameterOrReferenceNotAConsumesHeader(store, param))
  )
  const queries = methods.convertParameterMapToParameterObjectArray(
    request.getIn([ 'parameters', 'queries' ])
  )
  /*
  const path = methods.convertParameterMapToParameterObjectArray(
    request.getIn([ 'parameters', 'path' ])
  )
  */
  const body = methods.convertParameterMapToParameterObjectArray(
    request.getIn([ 'parameters', 'body' ])
  )

  const formData = body.filter((param) => param.in === 'formData')
  // drops additional body params if there are more than one
  const bodyParam = body.filter((param) => param.in === 'body').slice(0, 1)

  return [].concat(headers, queries, formData, bodyParam)
}

/**
 * converts a reference object into a swagger response reference object.
 * @param {Reference} reference: the reference to converts
 * @param {string} key: the key of the reference in the container that holds it.
 * @returns {Entry<string, SwaggerResponseReferenceObject>} the corresponding response reference
 * object
 *
 * NOTE: This method has parameter as [value, key] instead of {key, value} because it is invoked
 * on an Immutable structure.
 */
methods.convertReferenceToResponseObject = (reference, key) => {
  return {
    key,
    value: {
      $ref: '#/responses/' + reference.get('uuid')
    }
  }
}

/**
 * converts a reference or response record into a swagger response object
 * @param {Store} store: the store to use to resolve references
 * @param {Response|Reference} response: the response or reference to convert
 * @param {string} key: the key of the response in the container that holds it.
 * @returns {Entry<string, SwaggerResponseObject|SwaggerReferenceObject>} the corresponding response
 * or refernce object.
 *
 * NOTE: This method has parameter as [value, key] instead of {key, value} because it is invoked
 * on an Immutable structure.
 */
methods.convertReferenceOrResponseRecordToResponseObject = (store, response, key) => {
  if (response instanceof Reference) {
    return methods.convertReferenceToResponseObject(response, key)
  }
  return methods.convertResponseRecordToResponseObject(store, { value: response, key })
}

/**
 * extracts reponses from a request.
 * @param {Store} store: the store to use to resolve references
 * @param {Request} request: the request to get the responses from
 * @returns {Map<string, SwaggerResponseObject|SwaggerReferenceObject>} the corresponding object
 * that holds all the responses or references to globally defined responses.
 */
methods.getResponsesFromRequest = (store, request) => {
  const convertReferenceOrResponseRecordToResponseObject = currify(
    methods.convertReferenceOrResponseRecordToResponseObject, store
  )
  const responses = request.get('responses')
    .map(convertReferenceOrResponseRecordToResponseObject)
    .valueSeq()
    .reduce(convertEntryListInMap, {})

  if (Object.keys(responses).length === 0) {
    return {
      default: {
        description: 'no response description was provided for this operation'
      }
    }
  }

  return responses
}

/**
 * extracts schemes from a request endpoint overlay. If the request has multiple endpoints, this
 * returns null, as it is complex to tell if the globally defined endpoint matches this one.
 * @param {Request} request: the request to get schemes from
 * @returns {Array<string>?} the corresponding schemes, should they exist
 */
methods.getSchemesFromRequestEndpointOverlay = (request) => {
  const endpoints = request.get('endpoints')

  if (endpoints.size !== 1) {
    return undefined
  }

  const schemes = endpoints
    .valueSeq()
    .map(refOrUrl => refOrUrl.get('overlay'))
    .filter($overlay => !!$overlay)
    .map(methods.getSchemesFromEndpoint).get(0)

  return schemes
}

/**
 * converts a reference to a Basic or an ApiKey record into a security requirement.
 * @param {string} name: the name of the auth method
 * @returns {SwaggerSecurityRequirementObject} the corresponding requirement object
 */
methods.getSecurityRequirementForBasicOrApiKeyAuth = (name) => {
  const security = {}
  security[name] = []
  return security
}

/**
 * converts a reference to an OAuth2 record into a security requirement.
 * @param {string} name: the name of the auth method
 * @param {Reference} reference: the reference to converts
 * @returns {SwaggerSecurityRequirementObject} the corresponding requirement object
 */
methods.getSecurityRequirementForOAuth2Auth = (name, reference) => {
  const overlay = reference.get('overlay')
  const security = {}
  let scopes = []
  if (overlay) {
    scopes = overlay.get('scopes').map(({ key }) => key).toJS()
  }
  security[name] = scopes
  return security
}

/**
 * converts a Reference to an Auth record into a security requirement object.
 * @param {Store} store: the store from which to extract the referenced auth. It is used to infer
 * the type of auth the reference is pointing to.
 * @param {Reference} reference: the reference to convert.
 * @returns {SwaggerSecurityRequirementObject?} the corresponding requirement object, should it
 * exist.
 */
methods.getSecurityRequirementFromReference = (store, reference) => {
  const name = reference.get('uuid')
  const auth = store.getIn([ 'auth', name ])
  if (auth instanceof Auth.Basic || auth instanceof Auth.ApiKey) {
    return methods.getSecurityRequirementForBasicOrApiKeyAuth(name)
  }
  else if (auth instanceof Auth.OAuth2) {
    return methods.getSecurityRequirementForOAuth2Auth(name, reference)
  }

  return null
}

/**
 * extracts security requirements from a request.
 * @param {Store} store: the store to use to resolve reference to shared auth records.
 * @param {Request} request: the request to get the security requirements from
 * @returns {Array<SwaggerSecurityRequirementObject>} the corresponding list of security
 * requirements for this request.
 */
methods.getSecurityRequirementsFromRequest = (store, request) => {
  const auths = request.get('auths')

  const convertReferenceIntoSecurityRequirements = currify(
    methods.getSecurityRequirementFromReference, store
  )

  const securityReqs = auths
    .filter(methods.isReference)
    .map(convertReferenceIntoSecurityRequirements)
    .filter(value => !!value)
    .valueSeq()
    .toJS()

  return securityReqs
}

/* eslint-disable max-statements */
/**
 * converts a Request into an operation object.
 * @param {Store} store: the store used to resolve shared objecst.
 * @param {
 *   {
 *     consumes: Array<string>?,
 *     produces: Array<string>?
 *   }
 * } _: an object holding the globally defined consumes and produces fields.
 * @param {Request} request: the request to convert into an operation object
 * @param {string} key: the key of the request in the container that holds it
 * @returns {SwaggerOperationObject} the corresponding operation object
 *
 * NOTE: This method has parameter as [value, key] instead of {key, value} because it is invoked
 * on an Immutable structure.
 *
 * TODO deal with reference at this level
 */
methods.convertRequestToOperationObject = (store, { consumes, produces }, request, key) => {
  const tags = methods.getTagStrings(request)

  const keyMap = {
    summary: 'name',
    description: 'description',
    operationId: 'id'
  }

  const operation = methods.getKeysFromRecord(keyMap, request)

  const resolvedContainer = request.get('parameters').resolve(store)
  const $consumes = methods.getConsumesEntry(consumes, resolvedContainer)
  const $produces = methods.getProducesEntry(store, request, produces)
  const parameters = methods.getParametersFromRequest(store, request)
  const schemes = methods.getSchemesFromRequestEndpointOverlay(request)
  const security = methods.getSecurityRequirementsFromRequest(store, request)

  if (tags.length) {
    operation.tags = tags
  }

  if ($consumes) {
    operation.consumes = $consumes
  }

  if ($produces) {
    operation.produces = $produces
  }

  if (parameters.length) {
    operation.parameters = parameters
  }

  operation.responses = methods.getResponsesFromRequest(store, request)

  if (schemes) {
    operation.schemes = schemes
  }

  if (security && security.length) {
    operation.security = security
  }

  const value = operation
  const method = request.get('method') || key
  return { key: method.toLowerCase(), value }
}
/* eslint-enable max-statements */

/**
 * adds path parameters to an operation object
 * @param {Parameter} pathParam: the Parameter representing the path
 * @param {SwaggerOperationObject} operation: the operation object to update
 * @returns {SwaggerOperationObject} the updated operation object
 */
methods.addPathParametersToOperation = (pathParam, operation) => {
  if (!pathParam || pathParam.get('superType') !== 'sequence') {
    return operation
  }

  const params = (pathParam.get('value') || List())
    .filter(param => param.get('key'))
    .map(methods.convertReferenceOrParameterToParameterObject)
    .map(({ value }) => {
      value.required = true
      return value
    })
    .toJS()

  operation.value = operation.value || {}
  operation.value.parameters = (operation.value.parameters || []).concat(params)

  return operation
}

/**
 * converts a Resource into a Path Item object
 * @param {Store} store: the store used to resolve shared objecst.
 * @param {
 *   {
 *     consumes: Array<string>?,
 *     produces: Array<string>?
 *   }
 * } globalContentTypes: an object holding the globally defined consumes and produces fields.
 * @param {Resource} resource: the request to convert into an operation object
 * @returns {SwaggerOperationObject} the corresponding operation object
 *
 * TODO deal with reference at this level
 */
methods.convertResourceToPathItemObject = (store, globalContentTypes, resource) => {
  const key = methods.getPathFromResource(resource)
  const pathParam = resource.getIn([ 'path', 'pathname', 'parameter' ])

  const convertRequest = currify(methods.convertRequestToOperationObject, store, globalContentTypes)
  const applyTags = currify(methods.addTagsToOperation, resource)
  const applyPathParams = currify(methods.addPathParametersToOperation, pathParam)

  const value = resource.get('methods')
    .map(convertRequest)
    .map(applyTags)
    .map(applyPathParams)
    .valueSeq()
    .reduce(convertEntryListInMap, {})

  return { key, value }
}

/**
 * merges resource objects together if need be
 * @param {Object<string, SwaggerPathObject>} resourceMap: the object containing all path
 * objects
 * @param {Entry} entry: a SwaggerPathObject as an Entry
 * @param {string} entry.key: the path of the SwaggerPathObject
 * @param {SwaggerPathObject} entry.value: the SwaggerPathObject to merge in the resourceMap
 * @returns {Object<string, SwaggerPathObject>} the updated resource map
 */
methods.mergeResourceObjects = (resourceMap, { key, value }) => {
  if (resourceMap[key]) {
    Object.assign(resourceMap[key], value)
  }
  else {
    resourceMap[key] = value
  }

  return resourceMap
}

/**
 * extracts all the Resources of an Api to convert them into a Path Object.
 * @param {Api} api: the api to extract the resources to convert from.
 * @param {
 *   {
 *     consumes: Array<string>?,
 *     produces: Array<string>?
 *   }
 * } globalContentTypes: an object holding the globally defined consumes and produces fields.
 * @returns {SwaggerPathObject} the corresponding path object.
 *
 * NOTE: If multiple resources share the same path, the reducer will try to add as many operation
 * objects as possible to the final resource object, instead of replacing the resource object
 * with the new one. This is useful for non-resource dependent architecture, like Postman or Paw,
 * as this means that we can easily create resourceMaps that have multiple GETs for the same
 * endpoints.
 */
methods.getPathObject = (api, globalContentTypes) => {
  const store = api.get('store')
  const convertResource = currify(
    methods.convertResourceToPathItemObject,
    store,
    globalContentTypes
  )

  const paths = api.get('resources')
    .map(convertResource)
    .reduce(methods.mergeResourceObjects, {})

  return paths
}

/**
 * tests whether a parameter is applicable for the consumesHeader or not
 * @param {Parameter} param: the parameter to test
 * @returns {boolean} whether the parameter is applicable or not
 */
methods.isConsumesHeader = (param) => {
  return param.get('key') === 'Content-Type' &&
    param.get('usedIn') === 'request' &&
    param.get('in') === 'headers'
}

/**
 * tests whether a parameter is applicable for the producesHeader or not
 * @param {Parameter} param: the parameter to test
 * @returns {boolean} whether the parameter is applicable or not
 */
methods.isProducesHeader = (param) => {
  return param.get('key') === 'Content-Type' &&
    param.get('usedIn') === 'response' &&
    param.get('in') === 'headers'
}

/**
 * extracts content types from a Content-Type Parameter
 * @param {Parameter} param: the parameter to extract the contentTypes from.
 * @returns {Array<string>} the corresponding content types
 */
methods.extractContentTypesFromParam = (param) => {
  const schema = param.getJSONSchema(false)
  if (schema.enum) {
    return schema.enum.map(contentType => contentType.split(';')[0])
  }

  if (schema.default) {
    return [ schema.default ].map(contentType => contentType.split(';')[0])
  }

  return []
}

/**
 * finds all content-types from a Map of parameter, according to a filter function. (The filter
 * function is a test for either produces or consumes applicability of the parameter)
 * @param {OrderedMap<string, Parameter>} paramMap: the map of parameters to get the content-types
 * from.
 * @param {Function} filterFunc: the function to use to filter applicable parameters.
 * @returns {Array<string>} the corresponding contentTypes.
 *
 * NOTE: this methods assumes that the paramMap is fully resolved and that there are no Reference
 * records in it.
 */
methods.getContentTypeFromFilteredParams = (paramMap, filterFunc) => {
  const contentTypes = paramMap
    .filter(filterFunc)
    .map(methods.extractContentTypesFromParam)
    .reduce((flatList, list) => flatList.concat(list), [])

  return contentTypes
}

/**
 * extracts the globally defined content-type headers for requests.
 * @param {Api} api: the api to get the consumes field from.
 * @returns {Array<string>?} the corresponding globally defined consumes field.
 */
methods.getGlobalConsumes = (api) => {
  const consumes = methods.getContentTypeFromFilteredParams(
    api.getIn([ 'store', 'parameter' ]),
    methods.isConsumesHeader
  )

  if (!consumes.length) {
    return undefined
  }

  return consumes
}

/**
 * extracts the globally defined content-type headers for requests.
 * @param {Api} api: the api to get the consumes field from.
 * @returns {Array<string>?} the corresponding globally defined consumes field.
 */
methods.getGlobalProduces = (api) => {
  const produces = methods.getContentTypeFromFilteredParams(
    api.getIn([ 'store', 'parameter' ]),
    methods.isProducesHeader
  )

  if (!produces.length) {
    return undefined
  }

  return produces
}

/* eslint-disable max-statements */
/**
 * converts an Api Record into a swagger v2 object, then stringifies it.
 * @param {Api} $api: the api to convert in a swagger v2 object
 * @returns {string} the corresponding swagger file content.
 *
 * TODO: add hostTemplates as a patterned field if there are more than one endpoint, or if the
 * endpoint is templated.
 * TODO: add global Security requirements ?
 */
methods.createSwaggerObject = ($api) => {
  const swagger = methods.getSwaggerFormatObject()
  const info = methods.getInfoObject($api)
  const { schemes, host, basePath } = methods.getEndpointRelatedObjects($api)
  const consumes = methods.getGlobalConsumes($api)
  const produces = methods.getGlobalProduces($api)
  const definitions = methods.getDefinitions($api)
  const securityDefinitions = methods.getSecurityDefinitions($api)
  const parameters = methods.getParameterDefinitions($api)
  const responses = methods.getResponseDefinitions($api)
  const tags = methods.getTagDefinitions($api)
  const paths = methods.getPathObject($api, { consumes, produces })

  return {
    swagger,
    info,
    host,
    schemes,
    basePath,
    consumes,
    produces,
    paths,
    definitions,
    parameters,
    responses,
    securityDefinitions,
    tags
  }
}
/* eslint-enable max-statements */

/**
 * serializes an Api into a Swagger formatted string
 * @param {Api} api: the api to convert
 * @returns {string} the corresponding swagger object, as a string
 */
methods.serialize = ({ api }) => {
  const swagger = methods.createSwaggerObject(api)
  const serialized = JSON.stringify(swagger, null, 2)
  return serialized
}

export const __internals__ = methods
export default SwaggerSerializer
/* eslint-enable no-undefined */
