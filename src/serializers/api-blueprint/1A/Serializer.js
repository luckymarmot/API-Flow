/**
 * An Api Blueprint 1A serializer.
 * This implementation has the following limitations:
 * - it does not link between data Structures and attributes, as attributes need to be in MSON
 * format
 * - attributes are not supported.
 * - authentication methods are not included because they require an example header, which is a mess
 * to implement and interpret
 * - no grouping
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
 */
 /* eslint-disable no-undefined */
import { List, OrderedMap } from 'immutable'

import Reference from '../../../models/Reference'
import Variable from '../../../models/Variable'
import URL from '../../../models/URL'

import { flatten } from '../../../utils/fp-utils'

const __meta__ = {
  format: 'api-bluepint',
  version: '1A'
}

const methods = {}

/**
 * A Serializer to convert Api Records into Api Blueprint 1A.
 */
export class ApiBlueprintSerializer {
  static __meta__ = __meta__

  /**
   * serializes an Api into an Api Blueprint 1A formatted string
   * @param {Api} api: the api to convert
   * @returns {string} the corresponding api blueprint, as a string
   */
  static serialize(api) {
    return methods.serialize(api)
  }

  /**
   * returns a quality score for a content string wrt. to the collection v2 format.
   * @param {String} content: the content of the file to analyze
   * @returns {number} the quality of the content
   */
  static validate(content) {
    return methods.validate(content)
  }
}

/**
 * returns a quality score for a content string wrt. to the collection v2 format.
 * @param {String} content: the content of the file to analyze
 * @returns {number} the quality of the content
 */
methods.validate = () => {
  return 0
}

/**
 * extracts an endpoint from the endpoint store, if any exists
 * @param {Api} api: the api to get the store from
 * @returns {URL|null} the corresponding endpoint
 */
methods.getRootHostFromEndpoint = (api) => {
  const endpoint = api.getIn([ 'store', 'endpoint' ]).valueSeq().get(0)
  return endpoint || null
}

/**
 * extracts an endpoint from the variable store, if any exists
 * @param {Api} api: the api to get the store from
 * @returns {URL|null} the corresponding endpoint
 */
methods.getRootHostFromVariable = (api) => {
  const variable = api.getIn([ 'store', 'variable' ]).valueSeq().get(0)
  if (!variable || !(variable instanceof Variable)) {
    return null
  }

  const values = variable.get('values')
  if (!values) {
    return null
  }

  const value = values.valueSeq().get(0)
  if (!value) {
    return null
  }

  return new URL({ url: value })
}

/**
 * extracts a root endpoint from the Api (from either the endpoint store or from the variable store)
 * @param {Api} api: the api to get the store from
 * @returns {URL|null} the corresponding root endpoint
 */
methods.getRootHostForApi = (api) => {
  const host = methods.getRootHostFromEndpoint(api) ||
    methods.getRootHostFromVariable(api)

  return host
}

/**
 * creates a format version section
 * @returns {ContentSection} the corresponding section that represents the format version
 */
methods.createFormatVersionSection = () => {
  const section = {
    type: 'content',
    value: 'FORMAT: 1A'
  }

  return section
}

/**
 * create a format host section
 * @param {Api} api: the api from which to get a root endpoint
 * @returns {ContentSection|null} the corresponding section that represents the host of the api,
 * if it exists.
 */
methods.createFormatHostSection = (api) => {
  const host = methods.getRootHostForApi(api)

  if (!host) {
    return null
  }

  const rootUrl = host.generate(List([ '{', '}' ]))

  if (!rootUrl) {
    return null
  }

  return {
    type: 'content',
    value: 'HOST: ' + rootUrl
  }
}

/**
 * creates the metadata section of an ABP from an api.
 * @param {Api} api: the api from which to get the metadata pertaining to the ABP file
 * @returns {AbstractSection} the corresponding section that contains all the metadata about the ABP
 * file.
 */
methods.createMetadataSection = (api) => {
  const section = {
    type: 'metadata',
    abstract: true,
    content: [
      methods.createFormatVersionSection(api),
      methods.createFormatHostSection(api)
    ].filter(v => !!v),
    separator: '\n'
  }

  return section
}

/**
 * creates the root title section of an ABP
 * @param {Api} api: the api whose title needs to be extracted
 * @returns {HeaderSection<1>} the corresponding section describing the title of the Api.
 */
methods.createRootTitleSection = (api) => {
  const title = api.getIn([ 'info', 'title' ])

  return {
    type: 'header',
    depth: 1,
    value: {
      abstract: true,
      content: [ title || 'Unnamed API' ],
      separator: ''
    }
  }
}

/**
 * creates a root description section of an ABP
 * @param {Api} api: the api whose description needs to be extracted
 * @returns {ContentSection|null} the corresponding section describing the api, if such description
 * exists
 */
methods.createRootDescriptionSection = (api) => {
  const description = api.getIn([ 'info', 'description' ])

  if (!description) {
    return null
  }

  return {
    type: 'content',
    value: description
  }
}

/**
 * creates an Api Name and Overview Section
 * @param {Api} api: the api from which to get the title and description
 * @returns {AbstractSection} the corresponding section containing the name and description of the
 * Api
 */
methods.createApiNameAndOverviewSection = (api) => {
  const section = {
    type: 'overview',
    abstract: true,
    content: [
      methods.createRootTitleSection(api),
      methods.createRootDescriptionSection(api)
    ].filter(v => !!v),
    separator: '\n'
  }

  return section
}

/**
 * creates the resource group header section for an ABP.
 * We use the strategy of grouping all the resources together inside a single group, as truncating
 * a hierarchy of groups at the depth 1 only has a lot of meaning if the api was already grouped
 * based on semantics instead of paths, which is definitely not true for RAML.
 * @returns {HeaderSection} the corresponding section describing the header for the Group Resources
 */
methods.createResourceGroupHeaderSection = () => {
  return {
    type: 'header',
    depth: 2,
    value: {
      abstract: true,
      content: [ 'Group Resources' ],
      separator: ''
    }
  }
}

/**
 * converts a resource into a resource entry based on the path value of the resource.
 * The idea is to use the path to group together resources that have the same paths.
 * @param {Resource} resource: the resource to convert into a resource entry
 * @returns {Entry<string, Resource>} the corresponding resource as an entry
 */
methods.convertResourceIntoResourceEntryBasedOnPath = (resource) => {
  return {
    key: resource.get('path').generate(List([ '{', '}' ])),
    value: resource
  }
}

/**
 * merges a resource entry in an accumulator based on whether the key/path is already present in
 * the object. If the key/path is already present in the accumulator, then we merge the `methods`
 * field of the resource contained in the accumulator with the new resource.
 * @param {Object} acc: the accumulator to update with the entry
 * @param {Entry} entry: the entry to merge with the accumulator
 * @param {string} entry.key: the path of the resource. This is used to merge resources that share
 * the same key
 * @param {Resource} entry.value: the resource to merge
 * @returns {Object} the updated accumulator
 */
methods.mergeResourceEntriesBasedOnKey = (acc, { key, value }) => {
  if (!acc[key]) {
    acc[key] = value
    return acc
  }

  const $methods = OrderedMap().merge(acc[key].get('methods'), value.get('methods'))
  acc[key] = acc[key].set('methods', $methods)
  return acc
}

/**
 * merges the resources of an api together based on their paths.
 * @param {Api} api: the api from which to get the resource Map
 * @returns {OrderedMap<string, Resource>} the updated resource Map with merged resources based on
 * their path
 */
methods.getMergedResourcesBasedOnPathFromApi = (api) => {
  const resources = api.get('resources')
    .map(methods.convertResourceIntoResourceEntryBasedOnPath)
    .reduce(methods.mergeResourceEntriesBasedOnKey, {})

  return OrderedMap(resources)
}

methods.deduplicateArray = (array) => Array.from(new Set(array))

methods.extractQueryParametersFromResourceWithDuplicates = (api, resource) => {
  const store = api.get('store')
  const queryParams = resource.get('methods')
    .map(request => request.get('parameters'))
    .map(paramContainer => paramContainer.resolve(store))
    .map(paramContainer => paramContainer.get('queries').valueSeq().toArray())
    .reduce(flatten, [])
    .map(param => param.get('key'))
    .filter(v => !!v)

  return queryParams
}

methods.extractQueryParametersFromResource = (api, resource) => {
  const queryParams = methods.extractQueryParametersFromResourceWithDuplicates(api, resource)
  const params = methods.deduplicateArray(queryParams)

  return params
}

/**
 * extracts a QueryString section from a resource
 * @param {Api} api: the api containing the store to use to resolve shared parameters if needed
 * @param {Resource} resource: the resource to get the QueryString from
 * @returns {AbstractSection|null} the corresponding section that contains all the query parameters
 * as a string respecting ABP format
 */
methods.extractQueryStringFromResource = (api, resource) => {
  const params = methods.extractQueryParametersFromResource(api, resource)

  if (!params.length) {
    return null
  }

  return {
    type: 'query-params',
    abstract: true,
    content: [
      '{?',
      {
        abstract: true,
        content: params,
        separator: ','
      },
      '}'
    ],
    separator: ''
  }
}

methods.createResourceTitleSectionContent = (api, resource) => {
  const title = resource.get('name')
  const path = resource.get('path').generate(List([ '{', '}' ]))
  const queryString = methods.extractQueryStringFromResource(api, resource)

  let fixedTitle = title
  if (!title || title[0] === '/') {
    fixedTitle = null
  }

  return [
    fixedTitle,
    fixedTitle ? ' [' : null,
    path ? path.replace(/\/+/, '/') : '/',
    queryString,
    fixedTitle ? ']' : null
  ].filter(v => !!v)
}

/**
 * creates a Resource Title Section from a Resource.
 * @param {Api} api: the api to use to resolve shared parameters
 * @param {Resource} resource: the resource to get the title from
 * @returns {HeaderSection|null} the corresponding section that represents the title of the
 * resource, which is composed of the name of the resource, its path, and queryString, if they
 * exist.
 */
methods.createResourceTitleSection = (api, resource) => {
  const content = methods.createResourceTitleSectionContent(api, resource)

  if (!content.length) {
    return null
  }

  const section = {
    type: 'header',
    depth: 3,
    value: {
      abstract: true,
      content: content,
      separator: ''
    }
  }

  return section
}

/**
 * creates a resource description section from a Resource
 * @param {Resource} resource: the resource whose description needs extraction
 * @returns {ContentSection|null} the section containing the description of the resource, if it
 * exist.
 */
methods.createResourceDescriptionSection = (resource) => {
  const description = resource.get('description')

  if (!description) {
    return null
  }

  return {
    type: 'content',
    value: description
  }
}

methods.createOperationTitleSectionContent = (operation) => {
  const name = operation.get('name')
  const method = operation.get('method')

  if (!method) {
    return []
  }

  return [
    name,
    name ? ' [' : null,
    method.toUpperCase(),
    name ? ']' : null
  ].filter(v => !!v)
}

/**
 * creates an operation title section from an Operation/Request
 * @param {Request} operation: the operation from which to extract a title
 * @returns {HeaderSection|null} the section describing the title of the operation, which contains
 * the name and method of the operation
 */
methods.createOperationTitleSection = (operation) => {
  const content = methods.createOperationTitleSectionContent(operation)

  if (!content.length) {
    return null
  }

  const section = {
    type: 'header',
    depth: 4,
    value: {
      abstract: true,
      content: content,
      separator: ''
    }
  }

  return section
}

/**
 * creates an operation description section from an Operation/Request.
 * @param {Request} operation: the request from which to get a description
 * @returns {ContentSection|null} the corresponding content section containing the description of
 * the operation, if it exists.
 */
methods.createOperationDescriptionSection = (operation) => {
  const description = operation.get('description')

  if (!description) {
    return null
  }

  return {
    type: 'content',
    value: description
  }
}

/**
 * extracts the key of a Parameter as a content section.
 * @param {Parameter} parameter: the parameter to extract the key section from
 * @returns {ContentSection|null} the corresponding content section containing the key of the
 * parameter.
 */
methods.createParameterKeySegment = (parameter) => {
  const key = parameter.get('key')

  if (!key) {
    return null
  }

  const section = {
    abstract: true,
    content: [ key ],
    separator: ''
  }

  return section
}

methods.createParameterOptionalSegmentContent = (schema, parameter) => {
  const type = schema.type || parameter.get('type')
  const optionalText = parameter.get('required') ? 'required' : 'optional'

  return [ type, optionalText ].filter(v => !!v)
}

/**
 * creates a section that contains the optional fields used in the description of a parameter
 * @param {JSONSchema} schema: the JSON Schema representing the parameter
 * @param {Parameter} parameter: the parameter itself
 * @returns {AbstractSection|null} the section containing the optional fields of the description of
 * a parameter, in the expected format.
 */
methods.createParameterOptionalSegment = (schema, parameter) => {
  const content = methods.createParameterOptionalSegmentContent(schema, parameter)

  if (!content.length) {
    return null
  }

  const section = {
    abstract: true,
    content: [
      '(',
      {
        abstract: true,
        content: content,
        separator: ', '
      },
      ')'
    ],
    separator: ''
  }

  return section
}

/**
 * creates a section containing the description of a parameter.
 * @param {JSONSchema} schema: the schema representing the parameter
 * @param {Parameter} parameter: the parameter itself
 * @returns {AbstractSection|null} the corresponding description section
 */
methods.createParameterDescriptionSegment = (schema, parameter) => {
  const description = schema.description || parameter.get('description')

  if (!description) {
    return null
  }

  const section = {
    abstract: true,
    content: [ '-', description ],
    separator: ' '
  }

  return section
}

/**
 * creates the Payload section of a Parameter
 * @param {JSONSchema} schema: the JSON Schema representing a parameter
 * @param {Parameter} parameter: the parameter itself
 * @returns {AbstractSection|null} the section describing the payload associated with a Parameter
 */
methods.createParameterPayloadSection = (schema, parameter) => {
  const section = {
    abstract: true,
    content: [
      methods.createParameterKeySegment(parameter),
      methods.createParameterOptionalSegment(schema, parameter),
      methods.createParameterDescriptionSegment(schema, parameter)
    ].filter(v => !!v),
    separator: ' '
  }

  if (!section.content.length) {
    return null
  }

  return section
}

/**
 * converts a Parameter into a section
 * @param {Parameter} parameter: the parameter to convert
 * @returns {AbstractSection} the section that contains all the information relative to the
 * parameter
 */
methods.convertParameterIntoParamSection = (parameter) => {
  if (!parameter) {
    return null
  }

  const schema = parameter.getJSONSchema()

  const section = {
    type: 'parameter',
    abstract: true,
    content: [
      methods.createParameterPayloadSection(schema, parameter),
      methods.createOperationRequestSchemaAssetSection(schema)
    ].filter(v => !!v),
    separator: '\n'
  }

  if (!section.content.length) {
    return null
  }

  return section
}

/**
 * extracts path parameters name from a Path
 * @param {URL} path: the path to extract the parameters from
 * @returns {Array<string>} the corresponding array that contains all the path parameters.
 */
methods.extractPathParamsFromPath = (path) => {
  if (path.getIn([ 'pathname', 'parameter', 'superType' ]) !== 'sequence') {
    return []
  }

  const sequence = path.getIn([ 'pathname', 'parameter', 'value' ])
  if (!sequence || !sequence.size) {
    return []
  }

  return sequence
    .filter(param => param.get('key'))
    .valueSeq()
    .toArray()
}

methods.createOperationParametersSectionContent = (path, container) => {
  const queryParamSections = container
    .get('queries')
    .map(methods.convertParameterIntoParamSection)
    .valueSeq()
    .toJS()

  const pathParamSections = methods.extractPathParamsFromPath(path)
    .map(methods.convertParameterIntoParamSection)

  return [ ...queryParamSections, ...pathParamSections ]
}

/**
 * creates the Parameters section for an operation
 * @param {URL} path: the path from which to get the path parameters
 * @param {ParameterContainer} container: the ParameterContainer that holds all the query
 * parameters. This container is already resolved and filtered based on a set of constraints.
 * @returns {AbstractSection|null} the corresponding section that contains all the information
 * pertaining to the query and path parameters
 */
methods.createOperationParametersSection = (path, container) => {
  const paramSections = methods.createOperationParametersSectionContent(path, container)

  if (!paramSections.length) {
    return null
  }

  const section = {
    type: 'list-item',
    abstract: true,
    content: [
      'Parameters',
      {
        type: 'list',
        depth: 2,
        value: paramSections
      }
    ],
    separator: '\n'
  }

  return section
}

/**
 * extract a content type value from a list of constraints
 * @param {List<Parameter>} constraints: the list of constraints from which to extract the content
 * type parameters
 * @returns {string} the corresponding content type default value, iff there exists one content type
 * parameter.
 */
methods.extractContentTypeFromConstraints = (constraints) => {
  const contentTypeParams = constraints
    .filter(param => param.get('key') === 'Content-Type')

  if (contentTypeParams.size !== 1) {
    return null
  }

  return contentTypeParams.valueSeq().getIn([ 0, 'default' ]) || null
}

/**
 * creates the section associated with the title of an Operation Request section
 * @param {List<Parameter>} constraints: the constraints from which to extract the content-type
 * @returns {AbstractSection|ContentSection} the corresponding section that contains the title of
 * the Request section, with the associated content-type if it exists.
 */
methods.createOperationRequestTitleSection = (constraints) => {
  const contentType = methods.extractContentTypeFromConstraints(constraints)

  if (!contentType) {
    return {
      type: 'content',
      value: 'Request'
    }
  }

  return {
    abstract: true,
    content: [
      'Request (',
      contentType,
      ')'
    ],
    separator: ''
  }
}

/**
 * creates a partial asset section from a header Parameter.
 * @param {Parameter} parameter: the header to convert into a partial asset
 * @returns {string} the partial asset that describe the header.
 */
methods.convertHeaderParameterIntoHeaderSection = (parameter) => {
  const name = parameter.get('key')
  const schema = parameter.getJSONSchema()
  const value = parameter.get('default') || schema.default || (schema.enum || [])[0] || null

  return name + ': ' + value
}

methods.getHeadersForOperationRequest = (constraints, container, method) => {
  const headers = container.get('headers')

  if (!headers.size) {
    return null
  }

  const contentType = methods.extractContentTypeFromConstraints(constraints)
  if (!contentType && (method || '').toLowerCase() !== 'get') {
    return headers
  }

  const filteredHeaders = headers.filter(parameter => parameter.get('key') !== 'Content-Type')
  if (!filteredHeaders.size) {
    return null
  }

  return filteredHeaders
}

/**
 * creates the Headers Section and its payload from an Operation/Request ParameterContainer
 * @param {Api} api: the api used to resolve shared object, such as authentication methods
 * @param {List<Parameter>} constraints: the constraints used filter the ParameterContainer
 * @param {ParameterContainer} container: the ParameterContainer containing all the header
 * parameters.
 * @param {string?} method: the method associated with this operation request.
 * @returns {ListSection} the section that contains all the information pertaining to the headers
 * of the operation
 */
methods.createOperationRequestHeaderSection = (api, constraints, container, method) => {
  const headers = methods.getHeadersForOperationRequest(constraints, container, method)

  if (!headers) {
    return null
  }

  const headersSection = headers.map(methods.convertHeaderParameterIntoHeaderSection)
    .valueSeq()
    .toJS()
    .join('\n')

  return {
    type: 'list',
    depth: 2,
    value: [
      {
        abstract: true,
        content: [
          'Headers',
          {
            type: 'asset',
            depth: 4,
            value: headersSection
          }
        ],
        separator: '\n'
      }
    ]
  }
}

/**
 * creates an asset section representing a schema for an operation request section
 * @param {JSONSchema} schema: the JSON schema representing a parameter
 * @returns {AssetSection} the corresponding asset section that represent a JSON Schema
 */
methods.createOperationRequestSchemaAssetSection = (schema) => {
  const section = {
    type: 'asset',
    depth: 4,
    value: schema
  }

  return section
}

/**
 * extracts the JSON Schema for a single body parameter
 * @param {OrderedMap<string, Parameter>} bodyParams: a map of Parameters, that should be of size 1.
 * @returns {JSONSchema} the corresponding JSON Schema
 */
methods.getSchemaForSingleBodyParameter = (bodyParams) => {
  const schema = bodyParams.valueSeq().get(0).getJSONSchema()

  return schema
}

/**
 * extracts the JSON Schema for multiple body parameter
 * @param {OrderedMap<string, Parameter>} bodyParams: a map of Parameters to get the JSON Schemas
 * of.
 * @returns {JSONSchema} a JSONSchema describing an object with all the JSON Schemas as properties
 */
methods.getSchemaForMultipleBodyParameters = (bodyParams) => {
  const properties = bodyParams
    .map(param => param.getJSONSchema())
    .reduce(($properties, schema, key) => {
      const title = schema.title || schema['x-title'] || key
      $properties[title] = schema
      return $properties
    }, {})

  return { type: 'object', properties }
}

/**
 * extracts a JSON Schema from a Map of Parameters
 * @param {OrderedMap<string, Parameter>} bodyParams: a Map of Parameters to convert into a single
 * JSON Schema
 * @returns {JSONSchema|null} the corresponding JSON Schema
 */
methods.getSchemaFromBodyParameters = (bodyParams) => {
  if (bodyParams.size === 1) {
    return methods.getSchemaForSingleBodyParameter(bodyParams)
  }

  if (bodyParams.size > 1) {
    return methods.getSchemaForMultipleBodyParameters(bodyParams)
  }

  return null
}

/**
 * create a Schema Section for an Operation Request
 * @param {ParameterContainer} container: a ParameterContainer from which to get the body parameters
 * @returns {ListSection} the corresponding section with its associated payload section that
 * describe the schema of the body of a request.
 */
methods.createOperationRequestSchemaSection = (container) => {
  const bodyParams = container.get('body')

  const schema = methods.getSchemaFromBodyParameters(bodyParams)

  if (!schema) {
    return null
  }

  const section = {
    type: 'list',
    depth: 2,
    value: [
      {
        abstract: true,
        content: [
          'Schema',
          methods.createOperationRequestSchemaAssetSection(schema)
        ],
        separator: '\n'
      }
    ]
  }

  return section
}

/**
 * creates an action section from an Operation/Request
 * @param {Api} api: the api used to resolve shared objects
 * @param {List<Parameter>} constraints: the list of constraints used to filter the
 * ParameterContainer block of the Operation
 * @param {ParameterContainer} container: the parameter container, resolved and filtered based on
 * the list of constraints.
 * @param {Request} operation: the operation to use to create the Request action section.
 * @returns {AbstractSection|null} the corresponding `Request` section
 */
methods.createOperationRequestSection = (api, constraints, container, operation) => {
  const method = operation.get('method')
  const section = {
    type: 'list-item',
    abstract: true,
    content: [
      methods.createOperationRequestTitleSection(constraints),
      methods.createOperationRequestHeaderSection(api, constraints, container, method),
      methods.createOperationRequestSchemaSection(container)
    ].filter(v => !!v),
    separator: '\n'
  }

  if (section.content.length < 2) {
    return null
  }

  return section
}

/**
 * creates a Response title section from a Response and a List of constraints
 * @param {Response} response: the response to use to extract the information pertaining to the
 * title of the Response action section
 * @param {List<Parameter>} constraints: the list of constraints used as a view for this response
 * @returns {AbstractSection|ContentSection} the corresponding title section
 */
methods.createOperationResponseTitleSection = (response, constraints) => {
  const rawCode = parseInt(response.get('code'), 10)
  const code = rawCode ? rawCode : 200
  const contentType = methods.extractContentTypeFromConstraints(constraints)

  if (!contentType) {
    return {
      type: 'content',
      value: 'Response ' + code
    }
  }

  return {
    abstract: true,
    content: [
      'Response ',
      code,
      ' (',
      contentType,
      ')'
    ],
    separator: ''
  }
}

/**
 * creates a response action section from a response
 * @param {Api} api: the api used to resolve shared parameters
 * @param {Response} response: the response to convert into a Response action section
 * @returns {AbstractSection|null} the corresponding response action section
 */
methods.createOperationResponseSection = (api, response) => {
  if (!response) {
    return null
  }

  const constraints = response.getIn([ 'contexts', 0, 'constraints' ]) || List()
  const container = response.get('parameters').resolve(api.get('store')).filter(constraints)

  const section = {
    type: 'request',
    abstract: true,
    content: [
      methods.createOperationResponseTitleSection(response, constraints),
      methods.createOperationRequestHeaderSection(api, constraints, container, null),
      methods.createOperationRequestSchemaSection(container)
    ].filter(v => !!v),
    separator: '\n'
  }

  return section
}

/**
 * creates a default response section for requests that do not have responses
 * @returns {Array<ContentSection>} the corresponding array of response sections
 */
methods.createDefaultResponseSection = () => {
  const section = {
    type: 'content',
    value: 'Response 200'
  }

  return [ section ]
}

/**
 * creates an array of response action sections from an Operation/Request
 * @param {Api} api: the api used to resolve shared objects
 * @param {Request} operation: the request from which to get the Responses
 * @returns {Array<AbstractSection|ContentSection>} the corresponding array of sections describing
 * the possible responses to an operation
 */
methods.createOperationResponseSections = (api, operation) => {
  const responses = operation.get('responses')

  const responseSections = responses
    .map(response => {
      if (response instanceof Reference) {
        return api.getIn([ 'store', 'response', response.get('uuid') ])
      }

      return response
    })
    .map(response => methods.createOperationResponseSection(api, response))
    .filter(v => !!v)
    .valueSeq()
    .toJS()

  if (!responseSections.length) {
    return methods.createDefaultResponseSection()
  }

  return responseSections
}

/**
 * creates the payload section associated with an Operation/Request
 * @param {Api} api: the api to use to resolve shared objects
 * @param {URL} path: the path of the operation. This is used to extract Parameters associated with
 * an operation
 * @param {Request} operation: the request to extract a payload section from
 * @returns {ListSection|null} the corresponding list section describing an Operation
 */
methods.createOperationContentSection = (api, path, operation) => {
  const contextConstraints = operation.getIn([ 'contexts', 0, 'constraints' ]) || List()
  const container = operation.get('parameters').resolve(api.get('store')).filter(contextConstraints)

  const section = {
    type: 'list',
    depth: 0,
    value: [
      methods.createOperationParametersSection(path, container),
      methods.createOperationRequestSection(api, contextConstraints, container, operation),
      ...methods.createOperationResponseSections(api, operation)
    ].filter(v => !!v)
  }

  if (!section.value.length) {
    return null
  }

  return section
}

/**
 * converts an Operation/Request into a section
 * @param {Api} api: the api used to resolve shared objects
 * @param {URL} path: the path associated with this operation
 * @param {Request} operation: the request itself
 * @returns {AbstractSection} the corresponding section
 */
methods.createOperationSection = (api, path, operation) => {
  const section = {
    type: 'operation',
    abstract: true,
    content: [
      methods.createOperationTitleSection(operation),
      methods.createOperationDescriptionSection(operation),
      methods.createOperationContentSection(api, path, operation)
    ].filter(v => !!v),
    separator: '\n\n'
  }

  if (!section.content.length) {
    return null
  }

  return section
}

/**
 * creates an array of sections describing all the operations of a resource
 * @param {Api} api: the api used to resolve shared objects
 * @param {Resource} resource: the resource to get all the methods from
 * @returns {Array<AbstractSection>} the corresponding array of sections
 */
methods.createResourceOperationSections = (api, resource) => {
  const path = resource.get('path')
  return resource.get('methods')
    .map(operation => methods.createOperationSection(api, path, operation))
    .filter(v => !!v)
    .valueSeq()
    .toJS()
}

/**
 * converts a Resource into a section
 * @param {Api} api: the api used to resolve shared objects
 * @param {Resource} resource: the resource to convert
 * @returns {AbstractSection|null} the corresponding section
 */
methods.createResourceSection = (api, resource) => {
  const section = {
    type: 'resource',
    abstract: true,
    content: [
      methods.createResourceTitleSection(api, resource),
      methods.createResourceDescriptionSection(resource),
      ...methods.createResourceOperationSections(api, resource)
    ].filter(v => !!v),
    separator: '\n\n'
  }

  if (!section.content.length) {
    return null
  }

  return section
}

/**
 * extracts an array of sections representing all the resources associated with an Api.
 * @param {Api} api: the api to get the resources from
 * @returns {Array<AbstractSection|null>} the corresponding array of sections
 */
methods.createResourceSections = (api) => {
  const resources = methods.getMergedResourcesBasedOnPathFromApi(api)

  const resourcesSections = resources
    .map((resource) => methods.createResourceSection(api, resource))
    .valueSeq()
    .toJS()

  return resourcesSections
}

/**
 * creates the resource group section from an api
 * @param {Api} api: the api to get the resource group from
 * @returns {AbstractSection} the corresponding section
 */
methods.createResourceGroupSection = (api) => {
  const section = {
    type: 'resourceGroups',
    abstract: true,
    content: [
      methods.createResourceGroupHeaderSection(),
      ...methods.createResourceSections(api)
    ],
    separator: '\n\n'
  }

  return section
}

/**
 * creates the header section for the Data Structures section
 * @returns {HeaderSection} the corresponding header section
 */
methods.createDataStructuresHeaderSection = () => {
  const section = {
    type: 'header',
    depth: 1,
    value: 'Data Structures'
  }

  return section
}

methods.createDataStructuresSectionContent = ({ key, value }) => {
  const header = {
    type: 'header',
    depth: 2,
    value: {
      abstract: true,
      content: [
        key,
        ' (',
        value.type || 'object',
        ')'
      ],
      separator: ''
    }
  }

  const schema = {
    type: 'asset',
    depth: 2,
    value: value
  }

  const section = {
    abstract: true,
    content: [
      header,
      schema
    ],
    separator: '\n'
  }

  return section
}

/**
 * converts each shared constraint into a Data Structure Section
 * @param {Api} api: the api from which to get the shared constraints
 * @returns {Array<AbstractSection>} the corresponding sections
 */
methods.createDataStructureSections = (api) => {
  const constraints = api.getIn([ 'store', 'constraint' ])

  if (!constraints || !constraints.size) {
    return []
  }

  const sections = constraints
    .map((constraint, key) => ({ key, value: constraint.toJSONSchema() }))
    .map(methods.createDataStructuresSectionContent)
    .valueSeq()
    .toJS()

  return sections
}

methods.createDataStructuresSection = (api) => {
  const sections = methods.createDataStructureSections(api)

  if (!sections.length) {
    return null
  }

  const section = {
    type: 'dataStructures',
    abstract: true,
    content: [
      methods.createDataStructuresHeaderSection(),
      ...sections
    ],
    separator: '\n\n'
  }

  return section
}

/**
 * converts an Api into a section
 * @param {Api} api: the api to convert
 * @returns {AbstractSection} the corresponding section
 */
methods.convertApiIntoSection = (api) => {
  const sections = [
    methods.createMetadataSection(api),
    methods.createApiNameAndOverviewSection(api),
    methods.createResourceGroupSection(api),
    methods.createDataStructuresSection(api)
  ].filter(v => !!v)

  const section = {
    abstract: true,
    content: sections,
    separator: '\n\n'
  }

  return section
}

/**
 * stringifies an AbstractSection
 * @param {AbstractSection} section: the section to convert into a string
 * @returns {string} the corresponding string
 */
methods.stringifyAbstractSection = (section) => {
  const sections = section.content.map(methods.stringifySection)
  return sections.join(section.separator)
}

/**
 * stringifies a HeaderSection
 * @param {HeaderSection} section: the section to convert into a string
 * @returns {string} the corresponding string
 */
methods.stringifyHeaderSection = (section) => {
  const header = methods.stringifySection(section.value)

  return (new Array(Math.max(section.depth, 1) + 1)).join('#') + ' ' + header
}

/**
 * stringifies a ListSection
 * @param {ListSection} section: the section to convert into a string
 * @returns {string} the corresponding string
 */
methods.stringifyListSection = (section) => {
  const prefix = (new Array(section.depth + 1)).join('  ') + '+ '
  const list = section.value
    .map(methods.stringifySection)
    .map(listItemString => prefix + listItemString)

  return list.join('\n\n')
}

/**
 * stringifies an AssetSection
 * @param {AssetSection} section: the section to convert into a string
 * @returns {string} the corresponding string
 */
methods.stringifyAssetSection = (section) => {
  const content = typeof section.value === 'string' ?
    section.value :
    JSON.stringify(section.value, null, 2)

  const offset = new Array(section.depth + 1).join('  ')
  const offsetContent = content.split('\n')
    .map(line => offset + line)
    .join('\n')
  return '```\n' + offsetContent + '\n```'
}

/* eslint-disable max-statements */
/**
 * stringifies a Section
 * @param {string|AbstractSection|ContentSection|HeaderSection|ListSection|AssetSection} section:
 * the section to convert into a string
 * @returns {string} the corresponding string
 */
methods.stringifySection = (section) => {
  if (typeof section === 'string') {
    return section
  }

  if (section.abstract) {
    return methods.stringifyAbstractSection(section)
  }

  if (section.type === 'content') {
    return section.value
  }

  if (section.type === 'header') {
    return methods.stringifyHeaderSection(section)
  }

  if (section.type === 'list') {
    return methods.stringifyListSection(section)
  }

  if (section.type === 'asset') {
    return methods.stringifyAssetSection(section)
  }

  return JSON.stringify(section, null, 2)
}
/* eslint-enable max-statements */

/**
 * serializes an Api into an api-blueprint formatted string
 * @param {Api} api: the api to convert
 * @returns {string} the corresponding swagger object, as a string
 */
methods.serialize = ({ api }) => {
  const section = methods.convertApiIntoSection(api)
  const serialized = methods.stringifySection(section)

  return serialized + '\n'
}

export const __internals__ = methods
export default ApiBlueprintSerializer
/* eslint-enable no-undefined */
