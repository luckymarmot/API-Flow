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
import { List, Map } from 'immutable'

import Group from '../../../models/Group'
import Reference from '../../../models/Reference'
import Auth from '../../../models/Auth'

import { convertEntryListInMap } from '../../../utils/fp-utils'

const __meta__ = {
  format: 'postman',
  version: 'v2.0'
}

const methods = {}

/**
 * A Serializer to convert Api Records into Postman collections v2.
 */
export class PostmanSerializer {
  static __meta__ = __meta__

  /**
   * serializes an Api into a Postman collection v2 formatted string
   * @param {Api} api: the api to convert
   * @returns {string} the corresponding postman collection, as a string
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
 * extracts the info name field from an api.
 * @param {Api} api: the Api from which to get the title to use in the info name
 * @returns {Entry<string, string>} the corresponding entry
 */
methods.createInfoName = (api) => {
  const title = api.getIn([ 'info', 'title' ]) || 'API-Flow export'

  return { key: 'name', value: title }
}

/**
 * creates an entry that holds the schema info field
 * @returns {Entry<string, string>} the corresponding entry
 */
methods.createInfoSchema = () => {
  const schemaUrl = 'https://schema.getpostman.com/json/collection/v2.0.0/collection.json'
  return { key: 'schema', value: schemaUrl }
}

/**
 * extracts the info description from an Api.
 * @param {Api} api: the Api from which to get the description
 * @returns {Entry<string, string>?} the corresponding entry, if it exists
 */
methods.createInfoDescription = (api) => {
  const description = api.getIn([ 'info', 'description' ])
  if (!description) {
    return null
  }

  return { key: 'description', value: description }
}

/**
 * extracts the info version from the an Api.
 * @param {Api} api: the Api from which to get the version
 * @returns {Entry<string, string>?} the corresponding entry, if it exists
 */
methods.createInfoVersion = (api) => {
  const version = api.getIn([ 'info', 'version' ])
  if (!version) {
    return null
  }

  return { key: 'version', value: version }
}

/**
 * creates a postman info object from an api
 * @param {Api} api: the Api to get the information from
 * @returns {Entry<string, PostmanInfo>} the corresponding entry
 */
methods.createInfo = (api) => {
  const kvs = [
    methods.createInfoName(api),
    methods.createInfoSchema(),
    methods.createInfoDescription(api),
    methods.createInfoVersion(api)
  ].filter(v => !!v)

  return { key: 'info', value: kvs.reduce(convertEntryListInMap, {}) }
}

/**
 * extracts the name of an Item from a Group or a Resource
 * @param {Group|Resource} groupOrResource: the group or resource whose name is to be extracted
 * @returns {Entry<string, string>?} the corresponding entry, if it exists
 */
methods.createItemName = (groupOrResource) => {
  const name = groupOrResource.get('name')
  if (!name) {
    return null
  }

  return { key: 'name', value: name }
}

/**
 * extracts the description of an Item from a Group or a Resource
 * @param {Group|Resource} groupOrResource: the group or resource whose description is to be
 * extracted
 * @returns {Entry<string, string>?} the corresponding entry, if it exists
 */
methods.createItemDescription = (groupOrResource) => {
  const description = groupOrResource.get('description')
  if (!description) {
    return null
  }

  return { key: 'description', value: description }
}

/**
 * extracts an endpoint out of a resource and a request, preferring the one from the request to the
 * one from the resource
 * @param {Resource} resource: the resource to get an endpoint from
 * @param {Request} request: the request to get an endpoint from
 * @returns {Endpoint?} the corresponding endpoint, if it exists
 */
methods.getEndpointOrReferenceFromResourceAndRequest = (resource, request) => {
  const requestEndpoint = request.get('endpoints').valueSeq().get(0)
  const resourceEndpoint = resource.get('endpoints').valueSeq().get(0)

  if (requestEndpoint) {
    return requestEndpoint
  }

  if (resourceEndpoint) {
    return resourceEndpoint
  }

  return null
}

/**
 * extracts an endpoint url from a shared variable
 * @param {Variable} variable: the variable to convert into an endpoint url
 * @returns {string?} the corresponding url, if it exists
 */
methods.getEndpointFromVariable = (variable) => {
  if (!variable) {
    return null
  }

  const url = variable.get('values').valueSeq().get(0) || null
  return url
}

/**
 * extracts an endpoint or an endpoint url from a reference (by fetching it in the store)
 * @param {Api} api: the api to use to resolve shared objects
 * @param {Reference} reference: the reference to use to resolve the endpoint
 * @returns {Endpoint?|string?} the corresponding endpoint or endpoint url, if it exists
 */
methods.getEndpointFromReference = (api, reference) => {
  if (reference.get('type') === 'variable') {
    const variable = api.getIn([ 'store', 'variable', reference.get('uuid') ])
    return methods.getEndpointFromVariable(variable)
  }

  const type = reference.get('type') || 'endpoint'
  const uuid = reference.get('uuid')

  return api.getIn([ 'store', type, uuid ]) || null
}

/**
 * extracts a query parameter key value pair from a reference
 * @param {Api} api: the api to use to resolve shared parameters
 * @param {Reference} reference: the reference to use to resolve the query parameter
 * @returns {string?} the corresponding query parameter key value pair, as a string, if it exists
 */
methods.extractQueryKeyValuePairFromReference = (api, reference) => {
  const resolved = api.getIn([ 'store', 'parameter', reference.get('uuid') ])

  if (!resolved) {
    return null
  }

  const key = resolved.get('key')
  const value = '{{' + reference.get('uuid') + '}}'
  return key + '=' + value
}

/**
 * extracts a query parameter key value pair from a parameter
 * @param {Parameter} param: the parameter to convert
 * @returns {string} the corresponding query parameter key value pair, as a string
 */
methods.extractQueryKeyValuePairFromParameter = (param) => {
  const key = param.get('key')
  const value = param.getJSONSchema().default || ''

  return key + '=' + value
}

/**
 * extract a query parameter key value pair from a Parameter or a Reference
 * @param {Api} api: the api to use to resolve shared parameters
 * @param {Parameter|Reference} param: the Parameter or Reference to convert into a query parameter
 * @returns {string?} the corresponding query parameter key value pair, as a string, if it exists
 */
methods.extractQueryKeyValuePairFromParameterOrReference = (api, param) => {
  if (param instanceof Reference) {
    return methods.extractQueryKeyValuePairFromReference(api, param)
  }

  return methods.extractQueryKeyValuePairFromParameter(param)
}

/**
 * extracts a query string from a request
 * @param {Api} api: the api to use to resolve shared parameters
 * @param {Request} request: the request to extract the query string from
 * @returns {string} the corresponding queryString
 */
methods.extractQueryStringFromRequest = (api, request) => {
  const queryString = request.getIn([ 'parameters', 'queries' ])
    .map(param => {
      return methods.extractQueryKeyValuePairFromParameterOrReference(api, param)
    })
    .filter(v => !!v)
    .valueSeq()
    .toJS()
    .join('&')

  if (queryString === '') {
    return queryString
  }

  return '?' + queryString
}

/**
 * merges together a base url with a path and a queryString
 * @param {string} baseUrl: the base url from the endpoint of a request/resoure
 * @param {string} path: the path of the resource this url belongs to
 * @param {string} queryString: the queryString associated with the request this url belongs to
 * @returns {Entry<string, string>} the corresponding complete url, as an Entry
 */
methods.combineUrlComponents = (baseUrl, path, queryString) => {
  if (baseUrl[baseUrl.length - 1] === '/' && path[0] === '/' || path === '/') {
    const url = baseUrl + path.slice(1)
    return { key: 'url', value: url + queryString }
  }

  const url = baseUrl + path
  return { key: 'url', value: url + queryString }
}

/**
 * extracts a url from an endpoint
 * @param {URL|string} endpoint: the endpoint to extract a url from
 * @returns {string} the corresponding url
 */
methods.extractBaseUrlFromEndpoint = (endpoint) => {
  const baseUrl = typeof endpoint === 'string' ?
    endpoint :
    endpoint.generate(List([ '{{', '}}' ]))

  return baseUrl
}

/**
 * extract a path from a resource
 * @param {Resource} resource: the resource to get the path from
 * @returns {string} the corresponding path
 */
methods.extractPathFromResource = (resource) => {
  const pathname = resource.getIn([ 'path', 'pathname' ])

  if (!pathname) {
    return '/'
  }

  const path = pathname
    .generate(List([ ':', '' ]))

  return path
}

/**
 * creates a postman url entry from a request and its containing resource
 * @param {Api} api: the Api record to use to resolve shared objects
 * @param {Resource} resource: the resource from which to get the path and shared endpoints
 * @param {Request} request: the request from which to get the shared endpoints. It overrides the
 * ones from the Resource level
 * @returns {Entry<string, string>?} the corresponding entry, if it exists
 */
methods.createRequestUrl = (api, resource, request) => {
  const endpointOrReference = methods.getEndpointOrReferenceFromResourceAndRequest(
    resource, request
  )

  let endpoint = endpointOrReference
  if (endpointOrReference instanceof Reference) {
    endpoint = methods.getEndpointFromReference(api, endpointOrReference)
  }

  if (!endpoint) {
    return null
  }

  const baseUrl = methods.extractBaseUrlFromEndpoint(endpoint)
  const path = methods.extractPathFromResource(resource)
  const queryString = methods.extractQueryStringFromRequest(api, request)

  return methods.combineUrlComponents(baseUrl, path, queryString)
}

/**
 * converts an AWSSig4 auth into a postmanAuth property
 * @param {Auth} auth: the auth to convert
 * @returns {{
 *   type: 'awsv4',
 *   awsv4: Object
 * }} the corresponding postmanAuth property
 */
methods.createRequestAuthFromAWSSig4Auth = (auth) => {
  const kvs = [
    { key: 'accessKey', value: auth.get('key') },
    { key: 'secretKey', value: auth.get('secret') },
    { key: 'region', value: auth.get('region') },
    { key: 'service', value: auth.get('service') }
  ].filter(({ value }) => !!value)

  if (!kvs.length) {
    return { type: 'awsv4' }
  }

  return { type: 'awsv4', awsv4: kvs.reduce(convertEntryListInMap, {}) }
}

/**
 * converts a Basic auth into a postmanAuth property
 * @param {Auth} auth: the auth to convert
 * @returns {{
 *   type: 'basic',
 *   basic: Object
 * }} the corresponding postmanAuth property
 */
methods.createRequestAuthFromBasicAuth = (auth) => {
  const kvs = [
    { key: 'username', value: auth.get('username') },
    { key: 'password', value: auth.get('password') }
  ].filter(({ value }) => !!value)

  if (!kvs.length) {
    return { type: 'basic' }
  }

  return { type: 'basic', basic: kvs.reduce(convertEntryListInMap, {}) }
}

/**
 * converts a Digest auth into a postmanAuth property
 * @param {Auth} auth: the auth to convert
 * @returns {{
 *   type: 'digest',
 *   digest: Object
 * }} the corresponding postmanAuth property
 */
methods.createRequestAuthFromDigestAuth = (auth) => {
  const kvs = [
    { key: 'username', value: auth.get('username') },
    { key: 'password', value: auth.get('password') }
  ].filter(({ value }) => !!value)

  if (!kvs.length) {
    return { type: 'digest' }
  }

  return { type: 'digest', digest: kvs.reduce(convertEntryListInMap, {}) }
}

/**
 * converts an Hawk auth into a postmanAuth property
 * @param {Auth} auth: the auth to convert
 * @returns {{
 *   type: 'hawk',
 *   hawk: Object
 * }} the corresponding postmanAuth property
 */
methods.createRequestAuthFromHawkAuth = (auth) => {
  const kvs = [
    { key: 'authId', value: auth.get('id') },
    { key: 'authKey', value: auth.get('key') },
    { key: 'algorithm', value: auth.get('algorithm') }
  ].filter(({ value }) => !!value)

  if (!kvs.length) {
    return { type: 'hawk' }
  }

  return { type: 'hawk', hawk: kvs.reduce(convertEntryListInMap, {}) }
}

/**
 * converts an OAuth1 auth into a postmanAuth property
 * @param {Auth} auth: the auth to convert
 * @returns {{
 *   type: 'oauth1',
 *   oauth1: Object
 * }} the corresponding postmanAuth property
 */
methods.createRequestAuthFromOAuth1Auth = (auth) => {
  const kvs = [
    { key: 'consumerSecret', value: auth.get('consumerSecret') },
    { key: 'consumerKey', value: auth.get('consumerKey') },
    { key: 'token', value: auth.get('token') },
    { key: 'tokenSecret', value: auth.get('tokenSecret') },
    { key: 'signatureMethod', value: auth.get('algorithm') },
    { key: 'nonce', value: auth.get('nonce') },
    { key: 'version', value: auth.get('version') }
  ].filter(({ value }) => !!value)

  if (!kvs.length) {
    return { type: 'oauth1' }
  }

  return { type: 'oauth1', oauth1: kvs.reduce(convertEntryListInMap, {}) }
}

/**
 * converts an OAuth2 auth into a postmanAuth property
 * @param {Auth} auth: the auth to convert
 * @returns {{
 *   type: 'oauth2',
 *   oauth2: Object
 * }} the corresponding postmanAuth property
 */
methods.createRequestAuthFromOAuth2Auth = (auth) => {
  const kvs = [
    { key: 'authUrl', value: auth.get('authorizationUrl') },
    { key: 'accessTokenUrl', value: auth.get('tokenUrl') },
    { key: 'scope', value: auth.get('scopes').map(({ key }) => key).join(' ') || null }
  ].filter(({ value }) => !!value)

  if (!kvs.length) {
    return { type: 'oauth2' }
  }

  return { type: 'oauth2', oauth2: kvs.reduce(convertEntryListInMap, {}) }
}

/* eslint-disable max-statements */
/**
 * converts an Auth into a postmanAuth
 * @param {Auth} auth: the auth to convert
 * @returns {Entry<string, PostmanAuth>?} the corresponding postmanAuth entry, if it exists
 */
methods.createRequestAuthFromAuth = (auth) => {
  let postmanAuth = null
  if (auth instanceof Auth.AWSSig4) {
    postmanAuth = methods.createRequestAuthFromAWSSig4Auth(auth)
  }

  if (auth instanceof Auth.Basic) {
    postmanAuth = methods.createRequestAuthFromBasicAuth(auth)
  }

  if (auth instanceof Auth.Digest) {
    postmanAuth = methods.createRequestAuthFromDigestAuth(auth)
  }

  if (auth instanceof Auth.Hawk) {
    postmanAuth = methods.createRequestAuthFromHawkAuth(auth)
  }

  if (auth instanceof Auth.OAuth1) {
    postmanAuth = methods.createRequestAuthFromOAuth1Auth(auth)
  }

  if (auth instanceof Auth.OAuth2) {
    postmanAuth = methods.createRequestAuthFromOAuth2Auth(auth)
  }

  if (!postmanAuth) {
    return null
  }

  return { key: 'auth', value: postmanAuth }
}
/* eslint-enable max-statements */

/**
 * converts the Auths from a request into a postmanAuth
 * @param {Api} api: the Api from which to get the shared auth methods
 * @param {Request} request: the request from which to get the *potentially null* auth references
 * @returns {Entry<string, PostmanAuth>?} the corresponding postmanAuth entry, if it exists.
 */
methods.createRequestAuth = (api, request) => {
  const auths = request.get('auths').valueSeq()

  if (!auths.size) {
    return null
  }

  const auth = auths.get(0)
  if (!auth) {
    return { key: 'auth', value: { type: 'noauth', noauth: {} } }
  }

  const authData = api.getIn([ 'store', 'auth', auth.get('uuid') ])
  const postmanAuth = methods.createRequestAuthFromAuth(authData)

  return postmanAuth || null
}

/**
 * extracts a PostmanMethod from a request
 * @param {Request} request: the request from which to extract the method
 * @returns {Entry<string, string>?} the corresponding entry, if it exists
 */
methods.createMethod = (request) => {
  const method = request.get('method')
  if (!method) {
    return null
  }

  return { key: 'method', value: method.toUpperCase() }
}

/**
 * creates a Header from a reference
 * @param {Api} api: the api to use to resolve the shared parameters
 * @param {Reference} reference: the reference to convert into a header
 * @returns {Entry<string?, string>?} the corresponding header, formatted as an entry, if it exists
 */
methods.createHeaderFromReference = (api, reference) => {
  const param = api.getIn([ 'store', 'parameter', reference.get('uuid') ])

  if (!param) {
    return null
  }

  const key = param.get('key')
  const value = '{{' + reference.get('uuid') + '}}'

  return { key, value }
}

/**
 * creates a header from a Parameter
 * @param {Parameter} param: the parameter to convert into a header
 * @returns {Entry<string, string>?} the corresponding header, formatted as an Entry, if it exists
 */
methods.createHeaderFromParameter = (param) => {
  const key = param.get('key')

  if (!key) {
    return null
  }

  const schema = param.getJSONSchema()

  if (schema.default) {
    return { key, value: schema.default }
  }

  if (schema.enum) {
    return { key, value: schema.enum[0] }
  }

  return { key, value: null }
}

/**
 * extracts a header from a Parameter or Reference
 * @param {Api} api: the api to use to resolve shared parameters
 * @param {Parameter|Reference} paramOrReference: the parameter or reference to convert into a
 * header
 * @returns {Entry<string?, string>?} the corresponding header, formatted as an Entry, if it exists
 */
methods.createHeaderFromParameterOrReference = (api, paramOrReference) => {
  if (paramOrReference instanceof Reference) {
    return methods.createHeaderFromReference(api, paramOrReference)
  }

  if (!paramOrReference || !paramOrReference.get('key')) {
    return null
  }

  return methods.createHeaderFromParameter(paramOrReference)
}

/**
 * extracts a PostmanHeader from a request
 * @param {Api} api: the api to use to resolve shared parameters
 * @param {Request} request: the request from which to extract the headers
 * @returns {Entry<string, PostmanHeader>?} the corresponding entry, if it exists
 */
methods.createHeader = (api, request) => {
  const headers = request.getIn([ 'parameters', 'headers' ])
    .map(header => methods.createHeaderFromParameterOrReference(api, header))
    .filter(v => !!v)

  if (!headers.size) {
    return null
  }

  return { key: 'header', value: headers.valueSeq().toJS() }
}

/**
 * extracts content-type parameters from the headers of request
 * @param {Api} api: the api to use to resolve shared parameters
 * @param {Request} request: the request to get the content-type parameters from
 * @returns {List<Parameter>} the corresponding List of Content-Type Parameters
 */
methods.getContentTypeParamsFromHeaders = (api, request) => {
  const contentTypeHeaders = request.get('parameters')
    .resolve(api.get('store'))
    .get('headers')
    .filter(header => header.get('key') === 'Content-Type')
    .valueSeq()
    .toList()

  return contentTypeHeaders
}

/**
 * extracts content-type parameters from a context
 * @param {Context} context: the context to extract the content-type parameters from
 * @returns {List<Parameter>} the corresponding List of Content-Type Parameters
 */
methods.getContentTypeParamsFromContext = (context) => {
  return context.get('constraints').filter(param => {
    return param.get('key') === 'Content-Type' &&
      param.get('in') === 'headers' &&
      param.get('usedIn') === 'request'
  })
}

/**
 * extracts content-type parameters from a context, or from the headers of a request, if the context
 * does not exist
 * @param {Api} api: the api to use to resolve shared parameters
 * @param {Request} request: the request to get the headers from
 * @param {Context?} context: the context to extract content-type parameters from
 * @returns {List<Parameter>} the corresponding list of content-type Parameters
 */
methods.getContentTypeParamsFromRequestOrContext = (api, request, context) => {
  if (!context) {
    return methods.getContentTypeParamsFromHeaders(api, request)
  }

  return methods.getContentTypeParamsFromContext(context)
}

/**
 * extracts a postman body mode from the `default` field of a schema
 * @param {JSONSchema} schema: the schema to extract the body mode from
 * @returns {'urlencoded'|'formdata'|'raw'} the corresponding body mode
 */
methods.createBodyModeFromSchemaDefault = (schema) => {
  const modeMap = [
    { key: 'application/x-www-form-urlencoded', value: 'urlencoded' },
    { key: 'multipart/form-data', value: 'formdata' }
  ]

  const mode = modeMap
    .filter(({ key }) => schema.default.match(key))
    .map(({ value }) => value)[0]

  return mode || 'raw'
}

/**
 * extracts a postman body mode from the `enum` field of a schema
 * @param {JSONSchema} schema: the schema to extract the body mode from
 * @returns {'urlencoded'|'formdata'|'raw'} the corresponding body mode
 */
methods.createBodyModeFromSchemaEnum = (schema) => {
  const modeMap = [
    { key: 'application/x-www-form-urlencoded', value: 'urlencoded' },
    { key: 'multipart/form-data', value: 'formdata' }
  ]

  const mode = modeMap
    .filter(({ key }) => {
      return schema.enum.filter(contentType => contentType.match(key)).length > 0
    })
    .map(({ value }) => value)[0]

  return mode || 'raw'
}

/**
 * extracts a postman body mode from a List of Content Type Parameters
 * @param {List<Parameter>} contentTypeParams: the List of Parameter from which to extract a body
 * mode
 * @returns {'urlencoded'|'formdata'|'raw'} the corresponding body mode
 */
methods.createBodyModeFromContentTypeParams = (contentTypeParams) => {
  if (contentTypeParams.size !== 1) {
    return 'raw'
  }

  const contentTypesConstraint = contentTypeParams.get(0)
  const contentTypeSchema = contentTypesConstraint.getJSONSchema()

  if (contentTypeSchema.default) {
    return methods.createBodyModeFromSchemaDefault(contentTypeSchema)
  }

  if (contentTypeSchema.enum) {
    return methods.createBodyModeFromSchemaEnum(contentTypeSchema)
  }

  return 'raw'
}

/**
 * extracts a PostmanBodyMode from a Context
 * @param {Api} api: the api to use to resolve shared parameters
 * @param {Request} request: the request from which to get the body parameters
 * @param {Context} context: the context from which to infer the body mode
 * @returns {'raw'|'formdata'|'urlencoded'} the corresponding body mode
 */
methods.createBodyMode = (api, request, context) => {
  const contentTypeParams = methods.getContentTypeParamsFromRequestOrContext(api, request, context)
  return methods.createBodyModeFromContentTypeParams(contentTypeParams)
}

/**
 * converts a Map of Body Parameters into a raw postman parameters string
 * @param {OrderedMap<string, Parameter>} params: the body parameters to convert into raw parameters
 * @returns {string} the corresponding raw parameters string
 */
methods.convertBodyParametersIntoRawParameters = (params) => {
  const rawBody = params
    .map(param => {
      if (param.get('key')) {
        return '{{' + param.get('key') + '}}'
      }

      return JSON.stringify(param.getJSONSchema(), null, 2)
    })
    .valueSeq()
    .toJS()
    .join('\n')

  return rawBody
}

/**
 * extracts a PostmanRawBody entry from a request in a specific context
 * @param {OrderedMap<string, Parameter>} bodyParams: the body parameters to convert into raw
 * parameters
 * @returns {Entry<string, PostmanRawBody>?} the corresponding entry, if it exists
 */
methods.createBodyFromRawMode = (bodyParams) => {
  if (!bodyParams.size) {
    return null
  }

  const rawBody = methods.convertBodyParametersIntoRawParameters(bodyParams)

  return { key: 'raw', value: rawBody }
}

/**
 * extracts a PostmanUrlEncodedBody entry from a request in a specific context
 * @param {OrderedMap<string, Parameter>} bodyParams: the body parameters to convert into
 * postman url-encoded parameters
 * @returns {Entry<string, PostmanUrlEncodedBody>?} the corresponding entry, if it exists
 */
methods.createBodyFromUrlEncodedMode = (bodyParams) => {
  const postmanParams = bodyParams.map(param => {
    return {
      key: param.get('key'),
      value: param.get('default') || ('{{' + param.get('key') + '}}'),
      enabled: true
    }
  }).valueSeq().toJS()

  return { key: 'urlencoded', value: postmanParams }
}

/**
 * extracts a PostmanFormDataBody entry from a request in a specific context
 * @param {OrderedMap<string, Parameter>} bodyParams: the body parameters to convert into
 * postman url-encoded parameters
 * @returns {Entry<string, PostmanFormDataBody>?} the corresponding entry, if it exists
 */
methods.createBodyFromFormDataMode = (bodyParams) => {
  const postmanParams = bodyParams.map(param => {
    return {
      key: param.get('key'),
      value: param.get('default') || ('{{' + param.get('key') + '}}'),
      enabled: true
    }
  }).valueSeq().toJS()

  return { key: 'formdata', value: postmanParams }
}

/**
 * extracts a PostmanModalBody entry from a request in a specific context and mode
 * @param {OrderedMap<string, Parameter>} bodyParams: the body parameters to convert into
 * postman modal parameters (e.g. depending on the mode, they are converted differently)
 * @param {string} mode: the mode in which the body should be formatted
 * @returns {Entry<string, PostmanModalBody>?} the corresponding entry, if it exists
 */
methods.createBodyFromMode = (bodyParams, mode) => {
  if (mode === 'raw') {
    return methods.createBodyFromRawMode(bodyParams)
  }

  if (mode === 'urlencoded') {
    return methods.createBodyFromUrlEncodedMode(bodyParams)
  }

  if (mode === 'formdata') {
    return methods.createBodyFromFormDataMode(bodyParams)
  }

  return null
}

/**
 * prepares body parameters from a request based on a store and context
 * @param {Api} api: the api that holds the store used to resolve shared parameters
 * @param {Request} request: the request to extract the body parameters from
 * @param {Context?} context: the context to use to filter the body parameters
 * @returns {OrderedMap<string, Parameter>} the corresponding body parameters container block
 */
methods.getBodyParamsFromRequest = (api, request, context) => {
  const constraints = context ? context.get('constraints') : List()
  const bodyParams = request.get('parameters')
    .resolve(api.get('store'))
    .filter(constraints)
    .get('body')

  return bodyParams
}

/**
 * extracts a PostmanBody entry from a request
 * @param {Api} api: the api to use to resolve shared parameters
 * @param {Request} request: the request from which to get the body parameters
 * @returns {Entry<string, PostmanBody>?} the corresponding entry, if it exists
 */
methods.createBody = (api, request) => {
  const context = request.get('contexts').get(0)
  const bodyParams = methods.getBodyParamsFromRequest(api, request, context)
  const mode = methods.createBodyMode(api, request, context)

  const kvs = [
    { key: 'mode', value: mode },
    methods.createBodyFromMode(bodyParams, mode)
  ].filter(v => !!v)

  if (kvs.length <= 1) {
    return null
  }

  return { key: 'body', value: kvs.reduce(convertEntryListInMap, {}) }
}

/**
 * extracts a PostmanRequest entry from a request
 * @param {Api} api: the api to use to resolve shared parameters
 * @param {Resource} resource: the resource to use to generate the url
 * @param {Request} request: the request from which to get the body parameters
 * @returns {Entry<string, PostmanRequest>?} the corresponding entry, if it exists
 */
methods.createRequestFromRequest = (api, resource, request) => {
  const kvs = [
    methods.createRequestUrl(api, resource, request),
    methods.createRequestAuth(api, request),
    methods.createMethod(request),
    methods.createHeader(api, request),
    methods.createBody(api, request)
  ].filter(v => !!v)

  if (!kvs.length) {
    return null
  }

  return { key: 'request', value: kvs.reduce(convertEntryListInMap, {}) }
}

/**
 * extracts a PostmanItem from a request
 * @param {Api} api: the api to use to resolve shared parameters
 * @param {Resource} resource: the resource to use to generate the url for the request associated
 * with this item
 * @param {Request} request: the request from which to get the body parameters
 * @returns {PostmanItem} the corresponding PostmanItem
 */
methods.createItemFromRequest = (api, resource, request) => {
  const kvs = [
    methods.createItemName(request),
    methods.createItemDescription(request),
    methods.createRequestFromRequest(api, resource, request)
  ].filter(v => !!v)

  return kvs.reduce(convertEntryListInMap, {})
}

/**
 * extracts an array of PostmanItems from a resource
 * @param {Api} api: the api to use to resolve shared parameters
 * @param {Resource} resource: the resource to use to generate the PostmanItems
 * @returns {Array<PostmanItem>} the corresponding array of PostmanItems
 */
methods.createItemsFromResource = (api, resource) => {
  const items = resource.get('methods')
    .map(request => methods.createItemFromRequest(api, resource, request))
    .valueSeq()
    .toJS()

  return items
}

/**
 * creates an Item Name from a Resource
 * @param {Resource} resource: the resource to extract a name from
 * @returns {Entry<string, string>} the corresponding name, as an Entry
 */
methods.createItemNameFromResource = (resource) => {
  const name = resource.get('name') ||
    resource.get('description') ||
    resource.getIn([ 'path', 'pathname' ]).generate(List([ ':', '' ]))

  return { key: 'name', value: name }
}

/**
 * extracts a PostmanItemGroup entry from an Api and a resourceId
 * @param {Api} api: the api to use to resolve shared parameters
 * @param {string} id: the resourceId to use to resolve the resource in the Api
 * @returns {Entry<string, PostmanItemGroup>?} the corresponding entry, if it exists
 */
methods.createItemGroupFromResource = (api, id) => {
  const resource = api.getIn([ 'resources', id ])

  if (!resource) {
    return null
  }

  const kvs = [
    methods.createItemNameFromResource(resource),
    methods.createItemDescription(resource),
    { key: 'item', value: methods.createItemsFromResource(api, resource) }
  ].filter(v => !!v)

  const result = kvs.reduce(convertEntryListInMap, {})
  return result
}

/**
 * extracts a PostmanItem property as an entry from an Api and a Group or a Resource
 * @param {Api} api: the api to use to resolve shared objects
 * @param {Group|Resource} groupOrResource: the group or resource to convert into a
 * PostmanItemGroup
 * @returns {Entry<string, PostmanItemGroup>} the corresponding entry, if it exists
 */
methods.createItemGroupFromGroupOrResource = (api, groupOrResource) => {
  if (groupOrResource instanceof Group) {
    return methods.createItemGroup(api, groupOrResource)
  }

  return methods.createItemGroupFromResource(api, groupOrResource)
}

/**
 * extracts a PostmanItem property as an entry from an Api and a Group
 * @param {Api} api: the api to use to resolve shared objects
 * @param {Group} group: the group from which to convert into a PostmanItemGroupProperty
 * @returns {Entry<string, PostmanItemGroupProperty>} the corresponding entry, if it exists
 */
methods.createItemProp = (api, group) => {
  const items = group.get('children')
    .map(child => methods.createItemGroupFromGroupOrResource(api, child))
    .filter(v => !!v)

  return { key: 'item', value: items.valueSeq().toJS() }
}

/**
 * creates an PostmanItemGroup from an Api and a Group
 * @param {Api} api: the api to use to resolve shared objects
 * @param {Group} group: the group from which to convert into a PostmanItemGroup
 * @returns {Entry<string, PostmanItemGroup>} the corresponding entry
 */
methods.createItemGroup = (api, group) => {
  const kvs = [
    methods.createItemName(group),
    methods.createItemDescription(group),
    methods.createItemProp(api, group)
  ].filter(v => !!v)


  return kvs.reduce(convertEntryListInMap, {})
}

/**
 * merges item groups that have the same name. This is done because there are no constraints on the
 * unicity of a Resource wrt to its name/description/path in Api.get('resources'). This unicity
 * principle would be violated by the Paw/Postman and curl parser otherwise
 * @param {Map<string, PostmanItemGroup>} namedMap: the accumulator map that is used to merge
 * item groups together
 * @param {PostmanItemGroup} itemGroup: the item group to merge or add to the accumulator
 * @returns {Map<string, PostmanItemGroup>} the updated accumulator
 */
methods.mergeItemGroupsWithSameName = (namedMap, itemGroup) => {
  const namedItemGroup = namedMap.get(itemGroup.name)
  if (namedItemGroup) {
    namedItemGroup.item = [].concat(namedItemGroup.item || [], itemGroup.item || [])
    return namedMap.set(itemGroup.name, namedItemGroup)
  }

  return namedMap.set(itemGroup.name, itemGroup)
}

/**
 * creates an PostmanRootItem from an Api
 * @param {Api} api: the api to use to extract groups
 * @returns {Entry<string, PostmanRootItem>} the corresponding entry
 */
methods.createRootItem = (api) => {
  const group = api.get('group')

  if (!group) {
    return { key: 'item', value: [] }
  }

  const items = api.get('resources')
    .map((_, id) => methods.createItemGroupFromResource(api, id))
    .filter(v => !!v)
    .reduce(methods.mergeItemGroupsWithSameName, Map())
    .valueSeq()
    .toJS()

  return { key: 'item', value: items }
}
/*
NOTE: This should be used once postman is capable of dealing with multiple nesting level
methods.createRootItem = (api) => {
  const group = api.get('group')

  if (!group) {
    return { key: 'item', value: [] }
  }

  return { key: 'item', value: [ methods.createItemGroup(api, group) ] }
}
*/

/**
 * converts a **shared** Parameter into a postman variable
 * @param {Parameter} param: the parameter to converts
 * @param {string} key: the key of the parameter in TypedStore that contains it (equals the uuid of
 * potential references to it)
 * @returns {PostmanVariable?} the corresponding postman variable, if it exists
 */
methods.convertParameterIntoVariable = (param, key) => {
  const kvs = [
    { key: 'id', value: key },
    { key: 'value', value: param.get('default') },
    { key: 'type', value: param.get('type') },
    { key: 'name', value: param.get('key') }
  ].filter(({ value }) => !!value)

  if (!kvs.length) {
    return null
  }

  return kvs.reduce(convertEntryListInMap, {})
}

/**
 * creates an PostmanVariable from an Api
 * @param {Api} api: the api to use to resolve shared objects
 * @returns {Entry<string, PostmanVariable>?} the corresponding entry, if it exists
 */
methods.createVariable = (api) => {
  const sharedParams = api.getIn([ 'store', 'parameter' ])

  if (!sharedParams.size) {
    return null
  }

  const variables = sharedParams
    .map(methods.convertParameterIntoVariable)
    .filter(v => !!v)
    .valueSeq()
    .toJS()

  if (!variables.length) {
    return null
  }

  return { key: 'variable', value: variables }
}

/**
 * creates a PostmanCollection from an Api
 * @param {Api} api: the api to use to convert into a PostmanCollection
 * @returns {Entry<string, PostmanCollection>} the corresponding entry
 */
methods.createPostmanCollection = (api) => {
  const kvs = [
    methods.createInfo(api),
    methods.createRootItem(api),
    methods.createVariable(api)
  ].filter(v => !!v)

  return kvs.reduce(convertEntryListInMap, {})
}

/**
 * serializes an Api into a Swagger formatted string
 * @param {Api} api: the api to convert
 * @returns {string} the corresponding swagger object, as a string
 */
methods.serialize = ({ api }) => {
  try {
    const postmanCollection = methods.createPostmanCollection(api)
    const serialized = JSON.stringify(postmanCollection, null, 2)
    return serialized
  }
  catch (e) {
    throw e
  }
}

export const __internals__ = methods
export default PostmanSerializer
/* eslint-enable no-undefined */
