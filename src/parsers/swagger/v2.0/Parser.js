/**
 * TODO: improve Tag management (there's a Tag Object that contains a description)
 */

import { parse, format } from 'url'
import { OrderedMap, Map, List } from 'immutable'
import yaml from 'js-yaml'
import tv4 from 'tv4'
import swaggerSchema from 'swagger-schema-official/schema.json'

import Api from '../../../models/Api'
import Info from '../../../models/Info'
import Contact from '../../../models/Contact'
import License from '../../../models/License'
import Store from '../../../models/Store'
import Reference from '../../../models/Reference'
import Interface from '../../../models/Interface'
import Parameter from '../../../models/Parameter'
import ParameterContainer from '../../../models/ParameterContainer'
import Constraint from '../../../models/Constraint'
import Auth from '../../../models/Auth'
import URL from '../../../models/URL'
import Group from '../../../models/Group'
import Resource from '../../../models/Resource'
import Response from '../../../models/Response'
import Request from '../../../models/Request'

import { currify, entries, convertEntryListInMap, flatten } from '../../../utils/fp-utils'

export const __errors__ = {
  InvalidJSONorYAML: class InvalidJSONorYAMLError extends SyntaxError {},
  NotASwaggerV2: class NotASwaggerV2Error extends TypeError {}
}

const methods = {}

export const __meta__ = {
  version: 'v2.0',
  format: 'swagger'
}

/**
 * A Parser that converts Swagger v2.0 formatted objects into Api Records
 */
export class SwaggerParser {
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
 * throws with message explaining that the file could not be parsed
 * @throws {InvalidJSONorYAMLError}
 * @returns {void}
 */
methods.handleUnkownFormat = () => {
  const message = 'Failed to parse file (not a JSON or a YAML)'
  const error = new __errors__.InvalidJSONorYAML(message)
  throw error
}

/**
 * throws with message explaining that the file could not be parsed
 * @throws {InvalidJSONorYAMLError}
 * @returns {void}
 */
methods.handleInvalidSwagger = () => {
  const message = 'Invalid Swagger File (invalid schema / version < 2.0)\n' +
    tv4.error + '\n' +
    'Potential culprit: ' + tv4.error.dataPath
  const error = new __errors__.NotASwaggerV2(message)
  throw error
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

/**
 * creates a list of normalized objects from a score
 * @param {integer} score: the detection score
 * @returns {List<Object>} the normalized list of objects
 */
methods.formatDetectionObject = (score = 0) => {
  return [ { ...__meta__, score } ]
}

/**
 * gives a confidence score that the string passed is a swagger file
 * @param {string} content: the content to test the format of
 * @returns {List<Object>} a normalized list of confidence scores
 */
methods.detect = (content) => {
  const parsed = methods.parseJSONorYAML(content)

  let score = 0

  if (parsed) {
    score += parsed.swagger ? 1 / 4 : 0
    score += parsed.swagger === '2.0' ? 1 / 4 : 0
    score += parsed.info ? 1 / 4 : 0
    score += parsed.paths ? 1 / 4 : 0
  }

  return methods.formatDetectionObject(score)
}

/**
 * suggests an API name based on the content of a swagger file
 * @param {string} content: the content of the swagger file
 * @returns {string?} a suggested title for the API
 */
methods.getAPIName = (content) => {
  const parsed = methods.parseJSONorYAML(content)

  if (parsed && parsed.info && parsed.info.title) {
    return parsed.info.title
  }

  return null
}

/**
 * tests whether an object is a swagger object or not
 * @param {Object} maybeSwagger: the object to test
 * @returns {boolean} true if it is a swagger, false otherwise
 */
methods.isSwagger = (maybeSwagger) => {
  const isValid = tv4.validate(maybeSwagger, swaggerSchema)
  return isValid
}

/**
 * converts a swagger Contact Object into a Contact Record
 * @param {string} name?: the name of the contact
 * @param {string} url?: the url to visit
 * @param {string} email?: the email to use
 * @returns {Contact} the corresponding Contact Record
 */
methods.getContact = ({ name = null, url = null, email = null } = {}) => {
  const contactInstance = { name, url, email }
  return new Contact(contactInstance)
}

/**
 * converts a swagger License Object into a License Record
 * @param {string} name?: the license's name
 * @param {string} url?: location of the license description
 * @returns {License} the corresponding License Record
 */
methods.getLicense = ({ name = null, url = null } = {}) => {
  const licenseInstance = { name, url }
  return new License(licenseInstance)
}

/**
 * convert a swagger Info Object into an Info Record
 * @param {InfoObject} info: the object to convert
 * @returns {Info} the corresponding Info Record
 */
methods.getInfo = ({
  contact,
  license,
  title = null,
  description = null,
  termsOfService = null,
  version = null
} = {}) => {
  const infoInstance = {
    title,
    description,
    version,
    tos: termsOfService,
    contact: methods.getContact(contact),
    license: methods.getLicense(license)
  }

  return new Info(infoInstance)
}

/**
 * Fixes the swagger file to not rely on an external context, like the url we got the file from
 * @param {SwaggerObject} swagger: the swagger file that may need fixing
 * @param {string?} url: the context to fix the swagger file
 * @returns {SwaggerObject}: the fixed swagger
 *
 * TODO: this may raise reference issue when dealing with silently defined local files. we could
 * fix this.
 */
methods.fixExternalContextDependencies = (swagger, url) => {
  if (!swagger.host) {
    swagger.host = url ? parse(url).host : 'localhost'
  }

  if (!swagger.schemes || !swagger.schemes.length) {
    const scheme = url ? parse(url).protocol.split(':')[0] : 'http'
    swagger.schemes = [ scheme ]
  }

  return swagger
}

/**
 * extracts entries of a Swagger Resource Object and returns the ones that are methods
 * @param {SwaggerResourceObject} resource: the swagger resource to extract the method entries of
 * @returns {Array<Entry<string, SwaggerOperationObject>>} the methods entries
 */
methods.getMethodsFromResourceObject = (resource) => {
  const $entries = entries(resource)
  const validMethods = [
    'get', 'put', 'post', 'delete', 'options', 'head', 'patch'
  ]

  return $entries.filter(({ key }) => {
    return validMethods.indexOf(key.toLowerCase()) >= 0
  })
}

/**
 * separates parameters and references from a list of Swagger Parameter Objects
 * @param {Array<SwaggerParameterObject|SwaggerReferenceObject>} params: the list of parameters to
 * separate.
 * @returns {
 *   {
 *     parameters: Array<Entry<string, SwaggerParameterObject>>,
 *     references: Array<Entry<string, SwaggerReferenceObject>>
 *   }
 * } the separated parameters and references objects, as Entries.
 */
methods.getParametersAndReferencesFromParameterArray = (params = []) => {
  return params.reduce((acc, param) => {
    if (param && param.$ref) {
      acc.references.push({
        key: param.$ref,
        value: param
      })
    }
    else {
      acc.parameters.push({
        key: param.name + '-' + param.in,
        value: param
      })
    }

    return acc
  }, { parameters: [], references: [] })
}

/**
 * converts a Swagger Reference Object into into an Entry of a Reference Record.
 * @param {string} type: the type of the reference
 * @param {string} key: the URI of the Swagger Reference Object
 * @returns {Entry<string, Reference>} the corresponding Reference Record
 */
methods.convertReferenceObjectEntryIntoReferenceEntry = (type, { key }) => {
  return {
    key,
    value: new Reference({
      type,
      uuid: key
    })
  }
}

/**
 * transforms a list of Swagger Reference Objects into a map of Reference Records
 * @param {string} type: the type of the references
 * @param {Array<string>} refs: the array of Swagger Reference Objects
 * @returns {Object<string, Reference>} the corresponding map of Reference
 */
methods.convertReferenceArrayIntoReferenceMap = (type, refs = []) => {
  const convertRef = currify(methods.convertReferenceObjectEntryIntoReferenceEntry, type)
  return refs.map(convertRef).reduce(convertEntryListInMap, {})
}

/**
 * appends parameters that are shared at the Resource level to an Operation Object passed as an
 * Entry.
 * @param {Array<SwaggerParameterObject|SwaggerReferenceObject>} params: the shared parameters
 * @param {string} key: the key of the Entry.
 * @param {SwaggerOperationObject} value: the Swagger Operation Object to update.
 * @returns {Entry<string, SwaggerOperationObject>} the updated operation object
 */
methods.updateOperationEntryWithSharedParameters = (params = [], { key, value }) => {
  if (!key || typeof value !== 'object') {
    return { key, value }
  }

  const operationObject = value
  if (params.length && !(operationObject.parameters && Array.isArray(operationObject.parameters))) {
    operationObject.parameters = params
  }
  else if (params.length) {
    operationObject.parameters = operationObject.parameters.concat(params)
  }
  return { key, value: operationObject }
}

/**
 * returns the Parameter associated with the consumes field for this operation. If this operation
 * has no `consumes` field, a reference to the global one is used, if it exists.
 * @param {Store} store: the Store Record that holds shared values.
 * @param {SwaggerOperationObject} operation: the operation object to get the consumes field of
 * @returns {
 *   {
 *     consumeParameter: Parameter?,
 *     consumeReference: Reference?,
 *     consumeInterface: Interface?
 *   }
 * } the corresponding Parameter, and interface if it exists
 */
methods.getConsumesParamFromOperation = (store = new Store(), operation = {}) => {
  let consumeInterface = null
  let consumeParam = null
  let consumeReference = null

  if (!operation.consumes && store.getIn([ 'parameter', 'globalConsumes' ])) {
    consumeInterface = store.getIn([ 'interface', 'apiRequestMediaType' ]) || null
    consumeReference = new Reference({ type: 'parameter', uuid: 'globalConsumes' })
  }
  else {
    const consumes = operation.consumes || []
    if (consumes.length) {
      consumeParam = new Parameter({
        uuid: 'Content-Type-header',
        in: 'headers',
        key: 'Content-Type',
        name: 'Content Type Header',
        description: 'describes the media type of the request',
        type: 'string',
        required: true,
        constraints: List([
          new Constraint.Enum(consumes)
        ])
      })
    }
  }

  return { consumeParameter: consumeParam, consumeReference, consumeInterface: consumeInterface }
}

/**
 * returns the Parameter associated with the produces field for this operation. If this operation
 * has no `produces` field, a reference to the global one is used, if it exists.
 * @param {Store} store: the Store Record that holds shared values.
 * @param {SwaggerOperationObject} operation: the operation object to get the produces field of
 * @returns {
 *   {
 *     produceParameter: (Parameter | Reference)?,
 *     produceInterface: Interface?
 *   }
 * } the corresponding Parameter, and interface if it exists
 */
methods.getProducesParamFromOperation = (store, operation) => {
  let produceInterface = null
  let produceParam = null

  if (!operation.produces && store.getIn([ 'parameter', 'globalProduces' ])) {
    produceInterface = store.getIn([ 'interface', 'apiResponseMediaType' ]) || null
    produceParam = new Reference({ type: 'parameter', uuid: 'globalProduces' })
  }
  else {
    const produces = operation.produces || []
    if (produces.length) {
      produceParam = new Parameter({
        uuid: 'Content-Type-header',
        in: 'headers',
        usedIn: 'response',
        key: 'Content-Type',
        name: 'Content Type Header',
        description: 'describes the media type of the response',
        type: 'string',
        required: true,
        constraints: List([
          new Constraint.Enum(produces)
        ])
      })
    }
  }

  return { produceParameter: produceParam, produceInterface: produceInterface }
}

/**
 * converts a Swagger location (for the `in` field of a parameter object) into a location in a
 * ParameterContainer.
 * @param {string} location: the location to convert
 * @returns {string?} the corresponding location in a ParameterContainer
 */
methods.mapParamLocationToParamContainerField = (location) => {
  if (!location || typeof location !== 'string') {
    return null
  }

  const mapping = {
    path: 'path',
    header: 'headers',
    query: 'queries',
    body: 'body',
    formdata: 'body'
  }

  return mapping[location.toLowerCase()] || null
}

/**
 * adds a Parameter to a container based on the location of the parameter.
 * @param {Instance<ParameterContainer>} container: the parameter container instance to update.
 * @param {string} key: the key of the Entry of a Parameter
 * @param {Parameter} value: the Parameter to add to the container instance.
 * @returns {Instance<ParameterContainer>} the updated container
 *
 * NOTE: an Instance is very different from a record, as it is the mutable object passed to
 * instantiate the Record.
 */
methods.addParameterToContainerBlock = (container, { key, value }) => {
  const containerKey = value.get('in')

  if (container && container[containerKey] && typeof container[containerKey] === 'object') {
    container[containerKey][key] = value
  }

  return container
}

/**
 * gets the value stored at a certain location, and returns it as an Entry.
 * @param {Store} store: the store to fetch the value from
 * @param {string} type: the type of the reference. Used to find the correct TypedStore
 * @param {string} key: the reference in the TypedStore
 * @returns {Entry<string, *>} the resolved value, as an Entry
 */
methods.resolveReferenceFromKey = (store, type, { key }) => ({
  key,
  value: store.getIn([ type, key ])
})

/**
 * adds a Reference to a resolved Parameter.
 * @param {Instance<ParameterContainer>} container: the container instance to add the Reference to.
 * @param {string} key: the reference of the resolved Parameter
 * @param {Parameter} value: the resolved Parameter, used to get the location of the Reference in
 * the ParameterContainer.
 * @returns {Instance<ParameterContainer>} the updated container instance
 *
 * NOTE: an Instance is very different from a record, as it is the mutable object passed to
 * instantiate the Record.
 */
methods.addReferenceToContainerBlock = (container, { key, value }) => {
  const containerKey = value.get('in')

  if (container && container[containerKey] && typeof container[containerKey] === 'object') {
    container[containerKey][key] = new Reference({
      type: 'parameter',
      uuid: key
    })
  }

  return container
}

/**
 * creates a ParameterContainer based on a list of parameters and references, wrt. a store.
 * @param {Store} store: the store to get shared values from.
 * @param {Array<Parameter>} params: the parameters to add to the ParameterContainer.
 * @param {Array<Entry<string, string>>} refs: the reference entries to add to the
 * ParameterContainer
 * @returns {ParameterContainer} the corresponding parameter container
 */
methods.createParameterContainer = (store = new Store(), params = [], refs = []) => {
  let paramContainer = {
    headers: {},
    queries: {},
    body: {},
    path: {}
  }

  paramContainer = params.reduce(methods.addParameterToContainerBlock, paramContainer)

  const resolveParameterReference = currify(methods.resolveReferenceFromKey, store, 'parameter')
  paramContainer = refs
    .map(resolveParameterReference)
    .filter(({ value }) => !!value)
    .reduce(methods.addReferenceToContainerBlock, paramContainer)

  const paramContainerInstance = {
    headers: new OrderedMap(paramContainer.headers),
    queries: new OrderedMap(paramContainer.queries),
    path: new OrderedMap(paramContainer.path),
    body: new OrderedMap(paramContainer.body)
  }

  return new ParameterContainer(paramContainerInstance)
}

/**
 * creates an overlay for security requirements that need it (OAuth2)
 * @param {Auth} auth: the Auth to create an Overlay for
 * @param {Array<string>} scopes: the scopes to use for the Overlay
 * @returns {Auth?} the corresponding overlay, if it exists
 */
methods.getOverlayFromRequirement = (auth, scopes = []) => {
  if (auth instanceof Auth.OAuth2 && scopes.length) {
    return new Auth.OAuth2({
      scopes: List(scopes.map(scope => ({ key: scope })))
    })
  }

  return null
}

/**
 * creates an Auth from each security requirement.
 * @param {Store} store: the store in which the auths are saved.
 * @param {Array<SwaggerSecurityRequirementObject>} requirements: the list of security requirements.
 * @returns {List<Reference>}: the corresponding array of references to auth objects in the store.
 */
methods.getAuthReferences = (store, requirements = []) => {
  const authReferences = requirements.map((req) => {
    const $ref = Object.keys(req)[0]
    const overlay = methods.getOverlayFromRequirement(store.getIn([ 'auth', $ref ]), req[$ref])
    return new Reference({
      type: 'auth',
      uuid: $ref,
      overlay
    })
  })

  return List(authReferences)
}

/**
 * adds the consumes Parameter to an array of Parameter, if it exists.
 * @param {Store} store: the store in which a global consume Parameter may have been saved.
 * @param {SwaggerOperationObject} operation: the operation object in which there may be a consumes
 * field.
 * @param {Array<Parameter>} parameters: the array of Parameters to add the consume parameter to.
 * @param {Array<Reference>} references: the array of Reference to add the reference to the global
 * consume parameter to, if suited.
 * @returns {Array<Parameter>} the updated parameter array.
 */
methods.updateParamsWithConsumeParameter = (store, operation, parameters = [], references = []) => {
  const {
    consumeParameter,
    consumeReference
  } = methods.getConsumesParamFromOperation(store, operation)
  if (consumeParameter) {
    parameters.push({
      key: consumeParameter.get('uuid'),
      value: consumeParameter
    })
  }

  if (consumeReference) {
    references.push({
      key: consumeReference.get('uuid'),
      value: consumeReference
    })
  }

  return [ parameters, references ]
}

/**
 * updates a Response Object to have a code field. Useful for shared response objects.
 * @param {string} key: the code of the Response object.
 * @param {SwaggerResponseObject} value: the response object to update.
 * @returns {Entry<string, SwaggerResponseObject>} the updated response object, as an Entry.
 */
methods.addCodeToResponseEntry = ({ key, value }) => {
  value.code = key
  return { key, value }
}

/**
 * updates the overlay of a ResponseReference to include the producesParameter.
 * @param {Parameter} producesParameter: the Parameter associated with the `produces` field.
 * @param {Entry<string, Reference>} entry: the reference to a shared response, as an Entry.
 * @returns {Entry<string, Reference>} the updated reference
 */
methods.updateResponseReferenceWithProduceParameter = (producesParameter, entry) => {
  const overlay = entry.value.get('overlay')
  if (!overlay) {
    const overlayHeaders = {}
    overlayHeaders[producesParameter.get('uuid')] = producesParameter
    entry.value = entry.value.set('overlay', new Response({
      parameters: new ParameterContainer({
        headers: new OrderedMap(overlayHeaders)
      })
    }))
  }
  else {
    const updatedOverlay = overlay.setIn(
      [ 'parameters', 'headers', producesParameter.get('uuid') ],
      producesParameter
    )

    entry.value = entry.value.set('overlay', updatedOverlay)
  }

  return entry
}

/**
 * updates a Response to include the producesParameter.
 * @param {Parameter} producesParameter: the Parameter associated with the `produces` field.
 * @param {Entry<string, Response>} entry: the response to update, as an Entry.
 * @returns {Entry<string, Response>} the updated response
 */
methods.updateResponseRecordWithProduceParameter = (producesParameter, entry) => {
  if (producesParameter) {
    entry.value = entry.value.setIn(
      [ 'parameters', 'headers', producesParameter.get('uuid') ],
      producesParameter
    )
  }

  return entry
}

/**
 * updates Response Records as well as References to Response Records to take into account the
 * producesParameter.
 * @param {Parameter} producesParameter: the Parameter associated with the `produces` field.
 * @param {Entry<string, Response|Reference>} entry: the entry to update, be it either a response or
 * a reference.
 * @returns {Entry<string, Response|Reference>} the updated entry.
 */
methods.updateResponsesWithProduceParameter = (producesParameter, entry) => {
  if (!producesParameter) {
    return entry
  }

  if (entry.value instanceof Reference) {
    return methods.updateResponseReferenceWithProduceParameter(producesParameter, entry)
  }
  else {
    return methods.updateResponseRecordWithProduceParameter(producesParameter, entry)
  }
}

/**
 * creates a list of Interfaces from a list of tags.
 * @param {Array<string>} tags: the list of tags to use for the interfaces.
 * @returns {OrderedMap<string, Interface>} the corresponding list of interfaces
 */
methods.getInterfacesFromTags = (tags = []) => {
  const interfaces = tags.map(tag => {
    return {
      key: tag,
      value: new Interface({
        name: tag,
        uuid: tag,
        level: 'request'
      })
    }
  }).reduce(convertEntryListInMap, {})

  return OrderedMap(interfaces)
}

/**
 * creates a Reference to an endpoint, with an Overlay to update the protocol, if needed.
 * @param {SwaggerOperationObject} operation: the operation object that holds the schemes defined
 * for this operation.
 * @param {URL} value: the endpoint we are creating a reference to.
 * @param {string} key: the uuid reference to the endpoint in the store.
 * @returns {Reference} the corresponding reference.
 */
methods.addEndpointOverlayFromOperation = (operation, value, key) => {
  const overlay = operation.schemes ? new URL({
    variableDelimiters: List([ '{', '}' ])
  }).set('protocol', List(operation.schemes.map(methods.addDotsToScheme))) : null
  return new Reference({
    type: 'endpoint',
    uuid: key,
    overlay
  })
}

/**
 * tests whether a method can have a body.
 * @param {string} method: the method to test.
 * @returns {boolean} whether this method accepts a body or not.
 */
methods.isMethodWithBody = (method) => {
  return [ 'post', 'put', 'patch', 'delete', 'options' ].indexOf(method) >= 0
}

/**
 * extracts the ParameterContainer from an operation object. it uses the the store to access the
 * globally defined parameters, and it uses the method name to determine whether to include the
 * globally defined consumes in a parameter, depending on the method.
 * @param {Store} store: the store that holds shared parameters
 * @param {SwaggerOperationObject} operation: the operation object to extract the parameters from
 * @param {string} method: the method of the operation object. used to eliminate consumes for `get`
 * operations, and the like.
 * @returns {ParameterContainer} the corresponding ParameterContainer
 */
methods.getParameterContainerForOperation = (store, operation, method) => {
  /* eslint-disable prefer-const */
  let {
    parameters,
    references
  } = methods.getParametersAndReferencesFromParameterArray(operation.parameters || [])
  /* eslint-enable prefer-const */
  let params = parameters.map(methods.convertParameterObjectIntoParameter)

  if (methods.isMethodWithBody(method)) {
    [
      params,
      references
    ] = methods.updateParamsWithConsumeParameter(store, operation, params, references)
  }

  const parameterContainer = methods.createParameterContainer(store, params, references)

  return parameterContainer
}

/**
 * extracts the responses from an operation object. It uses the store to access the globally defined
 * responses and overlay them with information relevant to the operation object, like the produces
 * field.
 * @param {Store} store: the store frm which to get the shared responses
 * @param {SwaggerOperationObject} operation: the swagger operation object to extract the responses
 * from.
 * @returns {Map<string, Response|Reference>} the corresponding map of Responses or References to
 * Responses.
 */
methods.getResponsesForOperation = (store, operation) => {
  const { produceParameter } = methods.getProducesParamFromOperation(store, operation)

  const updateResponseEntryWithProduceParameter = currify(
    methods.updateResponsesWithProduceParameter,
    produceParameter
  )

  const responses = entries(operation.responses || {})
    .map(methods.addCodeToResponseEntry)
    .map(methods.convertResponseObjectIntoResponse)
    .filter(v => !!v)
    .map(updateResponseEntryWithProduceParameter)
    .filter(v => !!v)
    .reduce(convertEntryListInMap, {})

  return OrderedMap(responses)
}

/**
 * extracts the endpoints from an operation object. It uses the store to access the globally defined
 * endpoints and overlay them with information relevant to the operation object, like the schemes.
 * @param {Store} store: the store from which to get the shared endpoints
 * @param {SwaggerOperationObject} operation: the swagger operation object to extract the endpoints
 * from.
 * @returns {Map<string, Reference>} a list of potentially overlayed references.
 */
methods.getEndpointsForOperation = (store, operation) => {
  const addOverlayToEndpoints = currify(methods.addEndpointOverlayFromOperation, operation)
  const endpoints = store.get('endpoint').map(addOverlayToEndpoints)

  return endpoints
}

/**
 * extracts the request Id from a swagger operation object. It maps to an operationId if it exists.
 * Otherwise, it generates a UUID.
 * @param {string?} operationId: the operationId to convert into a request id.
 * @returns {string} the extracted requestId
 */
methods.getRequestIdFromOperation = ({ operationId }) => {
  return operationId || null
}

// TODO deal with externalDocs
/* eslint-disable max-statements */
/**
 * converts a Swagger Operation Object into a Request Record.
 * @param {Store} store: the store from which to get shared values that may be used by the Request.
 * @param {Array<SwaggerSecurityRequirementObject>} security: the global security requirements
 * @param {string} key: the method associated with this swagger Operation.
 * @param {SwaggerOperationObject} value: the operation object to convert.
 * @returns {Request} the corresponding request record.
 */
methods.convertOperationIntoRequest = (store, security, { key, value }) => {
  const method = key
  const operation = value
  const { description, summary } = operation

  const reqId = methods.getRequestIdFromOperation(operation)
  const parameters = methods.getParameterContainerForOperation(store, operation, method)
  const auths = methods.getAuthReferences(store, operation.security || security || [])
  const responses = methods.getResponsesForOperation(store, operation)
  const interfaces = methods.getInterfacesFromTags(operation.tags || [])
  const endpoints = methods.getEndpointsForOperation(store, operation)

  const requestInstance = {
    id: reqId,
    endpoints,
    name: summary || null,
    description: description || null,
    method,
    parameters,
    auths,
    responses,
    interfaces
  }

  return { key: method, value: new Request(requestInstance) }
}
/* eslint-enable max-statements */

/**
 * creates references for endpoints saved in a store.
 * @param {Store} store: the store to get the endpoints from.
 * @returns {OrderedMap<string, Reference>} the corresponding map of references
 */
methods.createReferencesForEndpoints = (store) => {
  return store.get('endpoint').map((value, key) => {
    return new Reference({
      type: 'endpoint',
      uuid: key
    })
  })
}

/**
 * extracts all Requests from a resource objects and store them in an Object.
 * @param {Store} store: the store to get shared objects from (endpoints, parameters, responses ...)
 * @param {Array<SwaggerSecurityRequirementObject>} security: the global security requirements
 * @param {SwaggerResourceObject} resourceObject: the resource object to extract the requests from
 * @returns {Object<string, Request>} the corresponding Requests, in an object.
 */
methods.getRequestsForResource = (store, security, resourceObject) => {
  const $methods = methods.getMethodsFromResourceObject(resourceObject)
  const params = resourceObject.parameters || []

  const updateOperationObjects = currify(methods.updateOperationEntryWithSharedParameters, params)
  const convertOperationIntoRequest = currify(methods.convertOperationIntoRequest, store, security)

  const operations = $methods
    .map(updateOperationObjects)
    .map(convertOperationIntoRequest)
    .reduce(convertEntryListInMap, {})

  return operations
}

/**
 * updates the path endpoint from the Resource with pathParameters from its swagger operations
 * @param {Store} store: the store to get the parameters from.
 * @param {URL} path: the path endpoint of the Resource
 * @param {Entry} entry: a operation object, as an entry
 * @returns {URL} the updated path endpoint
 */
methods.updatePathWithParametersFromOperations = (store, path, { key, value } = {}) => {
  if (!key && !value) {
    return path
  }

  const container = methods.getParameterContainerForOperation(store, value, key)
  const pathParams = container.get('path')

  if (!pathParams.size || path.getIn([ 'pathname', 'parameter', 'superType' ]) !== 'sequence') {
    return path
  }

  const $value = path.getIn([ 'pathname', 'parameter', 'value' ]).map(param => {
    return pathParams
      .filter(pathParam => pathParam.get('key') === param.get('key'))
      .valueSeq()
      .get(0) || param
  })

  return path.setIn([ 'pathname', 'parameter', 'value' ], $value)
}

/**
 * converts a Swagger Resource Object into a Resource Record.
 * @param {Store} store: the store from which to get the possibly shared resources relevant to this
 * Resource.
 * @param {Array<SwaggerSecurityRequirementObject>} security: the global security requirements
 * @param {SwaggerPathObject} paths: the paths of a swagger object.
 * @param {string} path: the path of the swagger resource object.
 * @returns {Resource} the corresponding Resource.
 *
 * FIXME: we assume all external references are resolved.
 * TODO: support $ref for swagger path Items (i.e. this can be a $ref)
 * TODO: transform path into SequenceParameter <- URL
 */
methods.getResource = (store, security, paths, path) => {
  const resourceObject = paths[path]
  const $methods = methods.getMethodsFromResourceObject(resourceObject)

  const operations = methods.getRequestsForResource(store, security, resourceObject)
  const endpoints = methods.createReferencesForEndpoints(store)
  const $path = new URL({
    url: path,
    variableDelimiters: List([ '{', '}' ])
  })

  const updatedPath = methods.updatePathWithParametersFromOperations(store, $path, $methods[0])

  const resourceInstance = {
    path: updatedPath,
    endpoints,
    uuid: path,
    methods: Map(operations)
  }

  return new Resource(resourceInstance)
}

/**
 * converts the swagger path object into a map of Resources.
 * @param {Store} shared: the store in which shared objects are stored.
 * @param {SwaggerObject} swagger: the swagger file to conver the path objects from.
 * @returns {OrderedMap<string, Resource>} the corresponding Map of Resources
 */
methods.getResources = (shared, { paths = {}, security = null } = {}) => {
  const $paths = Object.keys(paths)

  const resourceConverter = currify(methods.getResource, shared, security, paths)
  const resources = $paths.map(resourceConverter)

  const resourceMap = resources.reduce((acc, resource) => {
    const key = resource.get('uuid')
    acc[key] = resource
    return acc
  }, {})

  return new OrderedMap(resourceMap)
}

/**
 * adds dots to schemes that are missing them
 * @param {string} scheme: the scheme to add dots to.
 * @returns {string} the updated schemes with dots at the end
 */
methods.addDotsToScheme = (scheme) => {
  if (scheme.lastIndexOf(':') !== scheme.length - 1) {
    return scheme + ':'
  }

  return scheme
}

/**
 * returns the list of shared endpoints in the swagger file (in v2, it's the combination of
 * protocol, host, and basePath)
 * @param {List<string>} schemes: the list of protocols supported by the API
 * @param {string} host: the reference host for the API.
 * @param {string} basePath: a path that acts as a prefix to the paths of each resources in the API.
 * @returns {List<URL>} a List that contains all the shared endpoints
 */
methods.getSharedEndpoints = ({
  schemes = [ 'http' ],
  host = 'localhost',
  basePath = '/'
} = {}) => {
  const secure = schemes.filter(scheme => scheme.match(/[^w]s:?$/)).length > 0
  const protocol = schemes[0]
  const url = format({ protocol, host, pathname: basePath })
  const uuid = 'base'
  const variableDelimiters = List([ '{', '}' ])

  let endpoint = new URL({ url, uuid, secure, variableDelimiters })
  endpoint = endpoint.set('protocol', List(schemes.map(methods.addDotsToScheme)))

  const endpoints = {}
  endpoints[uuid] = endpoint

  return endpoints
}

/**
 * extracts the Parameter and Interface that represent the Content-Type of requests in the API.
 * @param {List<string>} contentTypes: a list of contentTypes that every resource uses or overrides.
 * @returns {Object} an Object that contains the Parameters and Interfaces generated in two separate
 * fields.
 */
methods.getParamsFromConsumes = (contentTypes = []) => {
  if (contentTypes.length === 0) {
    return {
      consumesParams: {},
      consumeInterfaces: {}
    }
  }

  const uuid = 'globalConsumes'
  const consumeInterface = new Interface({
    name: 'apiRequestMediaType',
    uuid: 'apiRequestMediaType',
    level: 'request',
    description: 'defines the common media type of requests in the API.'
  })

  const param = new Parameter({
    uuid,
    in: 'headers',
    key: 'Content-Type',
    name: 'Content Type Header',
    description: 'describes the media type of the request',
    type: 'string',
    required: true,
    constraints: List([
      new Constraint.Enum(contentTypes)
    ]),
    interfaces: Map({
      apiRequestMediaType: new Reference({
        type: 'interface',
        uuid: 'apiRequestMediaType'
      })
    })
  })

  const consumes = {}
  consumes[uuid] = param

  return {
    consumesParams: consumes,
    consumeInterfaces: {
      apiRequestMediaType: consumeInterface
    }
  }
}

/**
 * extracts the Parameter and Interface that represent the Content-Type of responses in the API.
 * @param {List<string>} contentTypes: a list of contentTypes that every resource uses or overrides.
 * @returns {Object} an Object that contains the Parameters and Interfaces generated in two separate
 * fields.
 */
methods.getParamsFromProduces = (contentTypes = []) => {
  if (contentTypes.length === 0) {
    return {
      consumesParams: {},
      consumeInterfaces: {}
    }
  }

  const uuid = 'globalProduces'
  const produceInterface = new Interface({
    name: 'apiResponseMediaType',
    uuid: 'apiResponseMediaType',
    level: 'response',
    description: 'defines the common media type of responses in the API.'
  })

  const param = new Parameter({
    uuid,
    in: 'headers',
    usedIn: 'response',
    key: 'Content-Type',
    name: 'Content Type Header',
    description: 'describes the media type of the response',
    type: 'string',
    required: true,
    constraints: List([
      new Constraint.Enum(contentTypes)
    ]),
    interfaces: Map({
      apiResponseMediaType: new Reference({
        type: 'interface',
        uuid: 'apiResponseMediaType'
      })
    })
  })

  const produces = {}
  produces[uuid] = param

  return {
    producesParams: produces,
    produceInterfaces: {
      apiResponseMediaType: produceInterface
    }
  }
}

/**
 * converts a key value pair into a constraint with the help of the initial parameter if necessary,
 * like with exclusiveMinimum
 * @param {SwaggerParameterObject} param: the swagger parameter object we are extracting constraints
 * from.
 * @param {string} key: the name of the field we are evaluating
 * @param {any} value: the value of param[key]
 * @returns {Constraint<*>} the corresponding constraint
 */
methods.formatConstraint = (param, { key, value }) => {
  if (key === 'exclusiveMinimum') {
    return value ?
      new Constraint.ExclusiveMinimum(param.minimum) :
      new Constraint.Minimum(param.minimum)
  }

  if (key === 'exclusiveMaximum') {
    return value ?
      new Constraint.ExclusiveMaximum(param.maximum) :
      new Constraint.Maximum(param.maximum)
  }

  const simpleConstraints = {
    minimum: Constraint.Minimum,
    maximum: Constraint.Maximum,
    multipleOf: Constraint.MultipleOf,
    minLength: Constraint.MinimumLength,
    maxLength: Constraint.MaximumLength,
    pattern: Constraint.Pattern,
    minItems: Constraint.MinimumItems,
    maxItems: Constraint.MaximumItems,
    uniqueItems: Constraint.UniqueItems,
    enum: Constraint.Enum,
    schema: Constraint.JSONSchema
  }

  if (simpleConstraints[key]) {
    return new simpleConstraints[key](value)
  }

  const unknownConstraint = {}
  unknownConstraint[key] = value

  return new Constraint.JSONSchema(unknownConstraint)
}

/**
 * checks whether the key of a key-value pair is a constraint.
 * @param {string} key: the key to test
 * @returns {boolean} true if it is a constraint, false otherwise
 */
methods.filterConstraintEntries = ({ key }) => {
  return [
    'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf',
    'minLength', 'maxLength', 'pattern',
    'minItems', 'maxItems', 'uniqueItems',
    'enum', 'schema'
  ].indexOf(key) >= 0
}

/**
 * creates a List of Constraints out of a parameter.
 * @param {SwaggerParameterObject} parameter: the parameter to extract the constraints of
 * @returns {List<Constraint<*>>} the list of constraints the parameter imposes
 */
methods.getConstraintsFromParam = (parameter) => {
  const paramEntries = entries(parameter)

  const formatConstraints = currify(methods.formatConstraint, parameter)

  const constraints = paramEntries
    .filter(methods.filterConstraintEntries)
    .map(formatConstraints)

  return List(constraints)
}

/**
 * extracts applicableContexts from a SwaggerParameter location value
 * @param {string} location: the location of a swagger parameter
 * @returns {List<Parameter>} the corresponding applicableContexts
 */
methods.getApplicableContextsFromLocation = (location) => {
  if (location !== 'formData') {
    return List()
  }

  return List([
    new Parameter({
      key: 'Content-Type',
      in: 'headers',
      constraints: List([
        new Constraint.Enum([
          'application/x-www-form-urlencoded',
          'multipart/form-data'
        ])
      ])
    })
  ])
}

/* eslint-disable max-statements */
/**
 * converts a swagger parameter object into a Parameter Object
 * @param {Entry<string, SwaggerParameterObject>} parameterEntry: the entry to convert
 * @returns {Entry<string, Parameter>} a Parameter, stored in an entry format for easier
 * manipulation
 * TODO: Deal with file type appropriately
 * TODO: Deal with format metadata
 */
methods.convertParameterObjectIntoParameter = (parameterEntry) => {
  const uuid = parameterEntry.key
  const parameter = parameterEntry.value || {}

  const { name, description, required, type } = parameter
  const constraints = methods.getConstraintsFromParam(parameter)
  const location = methods.mapParamLocationToParamContainerField(parameter.in)
  const applicableContexts = methods.getApplicableContextsFromLocation(parameter.in)

  const paramInstance = {
    uuid,
    in: location,
    default: parameter.default || null,
    key: parameter.in !== 'body' ? name || null : null,
    name: name || null,
    description: description || null,
    required: required || false,
    type: type || null,
    constraints,
    applicableContexts
  }

  if (parameter.type === 'array' && parameter.items) {
    const { value } = methods.convertParameterObjectIntoParameter({
      key: null,
      value: parameter.items
    })
    paramInstance.value = value
  }

  const param = new Parameter(paramInstance)

  return {
    key: uuid,
    value: param
  }
}
/* eslint-enable max-statements */

/**
 * converts a List of entries of swagger parameters into a map of Parameters using the entry key
 * as keys in the map.
 * @param {List<Entry<string, SwaggerParameterObject>>} parameters: the list of parameters to
 * convert, passed in an Entry format
 * @returns {Object<string, Parameter>} the corresponding list of Parameters
 */
methods.convertParameterObjectArrayIntoParameterMap = (parameters = []) => {
  const paramMap = parameters
    .map(methods.convertParameterObjectIntoParameter)
    .reduce(convertEntryListInMap, {})

  return paramMap
}

/**
 * extracts all globally shared Parameters in the swagger file. This checks for the consumes and
 * produces fields at the root level, as well as for the root level parameter field.
 * @param {List<string>} consumes: the content of the consumes fields, if it exists.
 * @param {List<string>} produces: the content of the produces fields, if it exists.
 * @param {Object<string, SwaggerParameterObject>} parameters: the content of the prameters field,
 * if it exists.
 * @returns {{parameters: Object<string, Parameter>, interfaces: Object<string, Interface>}} the
 * extracted shared parameters, as well as the shared Interfaces they implement
 */
methods.getSharedParameters = ({ consumes = [], produces = [], parameters = {} } = {}) => {
  const { consumesParams, consumeInterfaces } = methods.getParamsFromConsumes(consumes)
  const { producesParams, produceInterfaces } = methods.getParamsFromProduces(produces)
  const sharedParams = methods.convertParameterObjectArrayIntoParameterMap(entries(parameters))

  return {
    sharedParameters: {
      ...consumesParams, ...producesParams, ...sharedParams
    },
    parameterInterfaces: {
      ...consumeInterfaces, ...produceInterfaces
    }
  }
}

/**
 * creates a Parameter with a JSON Schema as a Constraint and returns it in Entry format.
 * @param {Schema} schema: the JSON Schema to use
 * @returns {Entry<string, Parameter>} the Parameter, in Entry format
 */
methods.convertSchemaIntoParameterEntry = (schema) => {
  const paramEntry = {
    key: 'body',
    value: new Parameter({
      uuid: 'body',
      usedIn: 'response',
      constraints: new List([
        new Constraint.JSONSchema(schema)
      ])
    })
  }

  return paramEntry
}

/**
 * updates a Parameter to state that it is used in the response, instead of the request (for shared
 * parameters)
 * @param {Parameter} param: the parameter to update
 * @returns {Parameter} the updated parameter
 */
methods.addUsedInResponseToParam = (param) => {
  if (param instanceof Parameter) {
    return param.set('usedIn', 'response')
  }
  return param
}

/**
 * creates a ParameterContainer from a swagger Response Object
 * @param {Schema} schema?: the JSON Schema of the Response Object, if it exists
 * @param {Object<string, HeaderObject>} headers: a map of headers used by the Response Object
 * @returns {ParameterContainer} the corresponding ParameterContainer, that has the schema saved in
 * the body field, and the header params in the header field
 */
methods.createResponseParameterContainer = ({ schema, headers }) => {
  const containerInstance = {}

  if (schema) {
    const bodyEntry = methods.convertSchemaIntoParameterEntry(schema)
    containerInstance.body = OrderedMap(convertEntryListInMap({}, bodyEntry))
  }
  else {
    containerInstance.body = OrderedMap()
  }

  if (headers) {
    const headerMap = methods.convertParameterObjectArrayIntoParameterMap(entries(headers))
    containerInstance.headers = OrderedMap(headerMap).map(methods.addUsedInResponseToParam)
  }
  else {
    containerInstance.header = OrderedMap()
  }

  return new ParameterContainer(containerInstance)
}

/**
 * converts an Entry-formatted Response Object into an Entry-format Response Record.
 * @param {string} key: the key of the Entry
 * @param {SwaggerResponseObject} value: the response object to convert
 * @returns {Entry<string, Response>} the corresponding Entry-formatted Response Record
 *
 * TODO: what about uuid ? should it be '#/responses/' +... like for parameters ?
 */
methods.convertResponseObjectIntoResponse = ({ key, value }) => {
  if (value.$ref) {
    const overlay = value.code ? new Response({ code: value.code }) : null
    return {
      key,
      value: new Reference({
        type: 'response',
        uuid: value.$ref,
        overlay
      })
    }
  }

  const container = methods.createResponseParameterContainer(value)
  const responseInstance = {
    code: value.code || null,
    description: value.description || null,
    parameters: container
  }

  const response = new Response(responseInstance)

  return { key, value: response }
}

/**
 * converts a Swagger Response Definitions Object into a Map of Responses.
 * @param {SwaggerDefinitionsResponseObject} responses: a dictionary of responses to convert
 * @returns {Object<string, Response>} the corresponding Map of Response Record
 */
methods.getSharedResponses = ({ responses = {} } = {}) => {
  return entries(responses)
    .map(methods.convertResponseObjectIntoResponse)
    .reduce(convertEntryListInMap, {})
}

/**
 * finds the type of authentication method
 * @param {SwaggerAuthObject} auth: the auth to find the type of
 * @returns {string} the type of auth.
 */
methods.getAuthType = (auth = {}) => auth.type || null

/**
 * adds an Interface to an authInstance
 * @param {AuthSpec} authInstance: the authInstance to update
 * @param {Interface} $interface: the interface to add
 * @returns {AuthSpec} the updated authInstance
 */
methods.addInterfaceToAuthInstance = (authInstance, $interface) => {
  const interfaces = {}
  interfaces[$interface.get('name')] = $interface
  authInstance.interfaces = new Map(interfaces)

  return authInstance
}

/**
 * converts a Swagger Security Definition into a BasicAuth, including the potential interface it
 * implements.
 * @param {Interface?} interfaceUsingAuth: the Interface to apply, if it exists
 * @param {string} key: the key of the entry. Used to save the auth name
 * @param {string} description?: the description of the authentication, if it exists.
 * @returns {BasicAuth} the corresponding BasicAuth
 */
methods.convertBasicAuth = (interfaceUsingAuth, key, { description = null } = {}) => {
  let authInstance = { description, authName: key }

  if (interfaceUsingAuth) {
    authInstance = methods.addInterfaceToAuthInstance(authInstance, interfaceUsingAuth)
  }

  return new Auth.Basic(authInstance)
}

/**
 * converts a Swagger Security Definition into a ApiKeyAuth, including the potential interface it
 * implements.
 * @param {Interface?} interfaceUsingAuth: the Interface to apply, if it exists
 * @param {string} key: the key of the entry. Used to save the auth name
 * @param {SwaggerSecurityDefinition} auth: the auth to convert
 * @returns {ApiKeyAuth} the corresponding ApiKeyAuth
 */
methods.convertApiKeyAuth = (interfaceUsingAuth, key, auth = {}) => {
  const { description = null, name = null } = auth
  let authInstance = { description, name, in: auth.in || null, authName: key }

  if (interfaceUsingAuth) {
    authInstance = methods.addInterfaceToAuthInstance(authInstance, interfaceUsingAuth)
  }

  return new Auth.ApiKey(authInstance)
}

/**
 * converts a Swagger Security Definition into an OAuth2Auth, including the potential interface it
 * implements.
 * @param {Interface?} interfaceUsingAuth: the Interface to apply, if it exists
 * @param {string} key: the key of the entry. Used to save the auth name
 * @param {SwaggerSecurityDefinition} auth: the auth to convert
 * @returns {OAuth2Auth} the corresponding OAuth2Auth
 *
 * TODO: fix scopes
 */
methods.convertOAuth2Auth = (interfaceUsingAuth, key, auth = {}) => {
  const { description = null, flow = null, authorizationUrl = null, tokenUrl = null } = auth
  const scopes = List(entries(auth.scopes || {}))
  let authInstance = { description, flow, authorizationUrl, tokenUrl, scopes, authName: key }

  if (interfaceUsingAuth) {
    authInstance = methods.addInterfaceToAuthInstance(authInstance, interfaceUsingAuth)
  }

  return new Auth.OAuth2(authInstance)
}

/**
 * converts an Entry-formatted Security Definition Object into an Entry-formatted Auth Record,
 * taking into account the potential Interface this Auth Record implements.
 * @param {Object<string, Interface>} interfaces: a map of interfaces an Auth Record may implement.
 * @param {string} key: the key of the Entry
 * @param {SwaggerSecurityDefinitionObject} value: the auth object to convert
 * @returns {Entry<string, Auth?>} the corresponding Entry-formatted Auth Record
 */
methods.convertAuthObjectIntoAuth = (interfaces, { key, value }) => {
  const authType = methods.getAuthType(value)

  const authConverterMap = {
    basic: methods.convertBasicAuth,
    apiKey: methods.convertApiKeyAuth,
    oauth2: methods.convertOAuth2Auth
  }

  if (authConverterMap[authType]) {
    const interfaceUsingAuth = interfaces[key]
    const auth = authConverterMap[authType](interfaceUsingAuth, key, value)

    return { key, value: auth }
  }

  return { key, value: null }
}

/**
 * converts a swagger Security Definitions Object into a map of Auth Record,
 * taking into account the potential Interface this Auth Record implements.
 * @param {Object<string, Interface>} interfaces: a map of interfaces an Auth Record may implement.
 * @param {SwaggerSecurityDefinitionsObject} securityDefinitions: a map of security definitions to
 * convert in Auths.
 * @returns {Object<string, Auth?>} the corresponding map of Auth Record
 */
methods.getSharedAuths = (interfaces, { securityDefinitions }) => {
  const convertAuthObjectEntryIntoAuth = currify(
    methods.convertAuthObjectIntoAuth,
    interfaces
  )
  return entries(securityDefinitions)
    .map(convertAuthObjectEntryIntoAuth)
    .reduce(convertEntryListInMap, {})
}

/**
 * converts an Entry-formatted Security Requirement into an Entry-formatted Interface
 * @param {string} key: the key of the Security Requirement Entry
 * @returns {Entry<string, Interface>} the corresponding Entry-formatted Interface
 */
methods.convertSecurityRequirementEntryIntoInterfaceEntry = ({ key, value }) => {
  const underlay = value && value.length ?
    new Auth.OAuth2({
      scopes: List(value.map(scope => ({ key: scope, value: '' })))
    }) :
    null

  return {
    key,
    value: new Interface({
      name: key,
      uuid: key,
      level: 'auth',
      underlay
    })
  }
}

/**
 * converts a swagger Security Requirement Object into a map of Interfaces
 * @param {SwaggerSecurityRequirementObject} security: the security requirement object to convert
 * @returns {Object<string, Interface>} the corresponding map of Interfaces
 *
 * TODO: overlayed values of interfaces are not saved at the moment
 */
methods.getSharedAuthInterfaces = ({ security = [] } = {}) => {
  return security
    .map(methods.convertSecurityRequirementEntryIntoInterfaceEntry)
    .reduce(convertEntryListInMap, {})
}

/**
 * converts a JSONSchema into a Constraint Entry
 * @param {Entry<string, JSONSchema>} entry: the JSONSchema entry to convert
 * @returns {Entry<string, Constraint>} the corresponding Constraint entry
 */
methods.convertDefinitionIntoConstraint = ({ key, value }) => {
  return { key, value: new Constraint.JSONSchema(value) }
}

/**
 * extracts shared Constraints from a SwaggerDefinitionsObject
 * @param {SwaggerObject} swagger: the object to extract the definitions from
 * @param {SwaggerDefinitionsObject} swagger.definitions: the definitions to convert into a
 * TypedStoreInstance
 * @returns {Object<string, Constraint>} the corresponding TypedStoreInstance for constraints
 */
methods.getSharedConstraints = ({ definitions = {} } = {}) => {
  return entries(definitions)
    .map(methods.convertDefinitionIntoConstraint)
    .reduce(convertEntryListInMap, {})
}

/**
 * extracts tags from all the operation objects associated with a resource.
 * @param {Object} entry: the entry holding the resource
 * @param {SwaggerResourceObject} entry.value: the resource from which to exptract the tags
 * @returns {Array<string>} an array of string containing all the tags this resource contains. Tags
 * can be duplicate.
 */
methods.extractTagsFromPathObject = ({ value: resource }) => {
  return methods.getMethodsFromResourceObject(resource)
    .map(({ value: operation }) => operation.tags || [])
    .reduce(flatten, [])
}

/**
 * extracts tags from all the operation objects associated with all the resources of a swagger file.
 * @param {SwaggerObject} swagger: the swagger file from which to get all the resources
 * @param {SwaggerPathObject} swagger.paths: the object containing all the resources in a swagger
 * file.
 * @returns {Array<string>} an array of string containing all the tags this swagger file contains.
 * Tags can be duplicate.
 */
methods.extractTagsFromPathsObject = ({ paths = {} } = {}) => {
  const tags = entries(paths)
    .map(methods.extractTagsFromPathObject)
    .reduce(flatten, [])

  return tags
}

/**
 * converts a tag string into an interface representing the tag
 * @param {string} tag: the tag string to convert
 * @returns {Entry<string, Interface>} the corresponding Interface, as an entry.
 */
methods.convertTagStringIntoInterfaceEntry = (tag) => {
  return {
    key: tag,
    value: new Interface({
      name: tag,
      uuid: tag,
      level: 'request'
    })
  }
}

/**
 * creates shared tag Interfaces from a SwaggerObject
 * @param {SwaggerObject} swagger: the swagger object to extract the shared tags from
 * @returns {Object<string, Interface>} the corresponding TypedStoreInstance for interfaces
 */
methods.getTagInterfaces = (swagger) => {
  const tags = methods.extractTagsFromPathsObject(swagger)
  const tagSet = Array.from(new Set(tags))
  return tagSet
    .map(methods.convertTagStringIntoInterfaceEntry)
    .reduce(convertEntryListInMap, {})
}

/**
 * creates a store holding shared objects.
 * @param {SwaggerObject} swagger: the swagger file to extract the shared object from.
 * @returns {Store} a store holding all globally shared objects.
 */
methods.getSimpleStore = (swagger = {}) => {
  const sharedEndpoints = methods.getSharedEndpoints(swagger)
  const sharedConstraints = methods.getSharedConstraints(swagger)
  const { sharedParameters, parameterInterfaces } = methods.getSharedParameters(swagger)
  const sharedResponses = methods.getSharedResponses(swagger)
  const authInterfaces = methods.getSharedAuthInterfaces(swagger)
  const sharedAuths = methods.getSharedAuths(authInterfaces, swagger)
  const tagInterfaces = methods.getTagInterfaces(swagger)

  const interfaces = { ...parameterInterfaces, ...authInterfaces, ...tagInterfaces }
  return new Store({
    endpoint: new OrderedMap(sharedEndpoints),
    constraint: new OrderedMap(sharedConstraints),
    parameter: new OrderedMap(sharedParameters),
    response: new OrderedMap(sharedResponses),
    auth: new OrderedMap(sharedAuths),
    interface: new OrderedMap(interfaces)
  })
}

/**
 * creates a Group holding the (flat) architecture of the Api doc.
 * @param {Object<string, SwaggerPathItemObject>} paths: the object to get the structure of.
 * @returns {Group} the corresponding group.
 *
 * TODO: improve that
 */
methods.getGroup = ({ paths }) => {
  const children = entries(paths).map(({ key }) => {
    return { key, value: key }
  }).reduce(convertEntryListInMap, {})

  return new Group({
    id: null,
    name: null,
    description: 'All the requests',
    children: new OrderedMap(children)
  })
}

/**
 * creates an Api object based on the swagger object
 * @param {SwaggerObject} swagger: the swagger object to convert
 * @param {string?} url: the url we got the swagger file from, if we got it from remote
 * @returns {Api} the corresponding Api Record
 */
methods.createApi = (swagger = {}) => {
  const info = methods.getInfo(swagger.info)
  const store = methods.getSimpleStore(swagger)
  const resources = methods.getResources(store, swagger)
  const group = methods.getGroup(swagger)

  const apiInstance = { info, store, resources, group }

  return new Api(apiInstance)
}

/**
 * converts the content of a swagger file in an Api
 * @param {string} content: the content of the swagger file
 * @param {string} url?: the url of the swagger file, if it was loaded from a remote location
 * @param {Object} file?: an object representing the location of the file if it was loaded
 * locally. example of file object: { path: 'someAbsolutePath', name: 'someFileName'}
 * @returns {Api} the Api Record corresponding to the swagger file
 */
methods.parse = ({ options, item: swagger }) => {
  if (!methods.isSwagger(swagger)) {
    return methods.handleInvalidSwagger()
  }

  const api = methods.createApi(swagger)
  return { options, api }
}

export const __internals__ = methods
export default SwaggerParser
