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
// import Parameter from '../../../models/Parameter'
// import URL from '../../../models/URL'

import { entries, convertEntryListInMap } from '../../../utils/fp-utils'

const __meta__ = {
  format: 'postman',
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

export class PostmanSerializer {
  static __meta__ = __meta__

  static serialize(api) {
    return methods.serialize(api)
  }

  static validate(content) {
    return methods.validate(content)
  }
}

/**
 * returns a quality score for a content string wrt. to the swagger v2 format.
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

methods.getEndpointFromVariable = (variable) => {
  if (!variable) {
    return null
  }

  const url = variable.get('values').valueSeq().get(0)
  return url
}

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

  const baseUrl = typeof endpoint === 'string' ? endpoint : endpoint.generate(List([ '{{', '}}' ]))
  const path = resource.getIn([ 'path', 'pathname' ]).generate(List([ ':', '' ]))

  const queryParameters = request.getIn([ 'parameters', 'queries' ])
    .map(param => {
      if (param instanceof Reference) {
        const resolved = api.getIn([ 'store', 'parameter', param.get('uuid') ])
        const key = resolved.get('key')
        const value = '{{' + param.get('uuid') + '}}'
        return key + '=' + value
      }

      const key = param.get('key')
      const value = param.getJSONSchema().default || ''

      return key + '=' + value
    })
    .valueSeq()
    .toJS()
    .join('&')

  let url = null
  if (baseUrl[baseUrl.length - 1] === '/' && path[0] === '/' || path === '/') {
    url = baseUrl + path.slice(1)
  }
  else {
    url = baseUrl + path
  }

  if (!queryParameters) {
    return { key: 'url', value: url }
  }

  return { key: 'url', value: url + '?' + queryParameters }
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

  if (!postmanAuth) {
    return null
  }

  return postmanAuth
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
 * extracts a PostmanHeader from a request
 * @param {Api} api: the api to use to resolve shared parameters
 * @param {Request} request: the request from which to extract the headers
 * @returns {Entry<string, PostmanHeader>?} the corresponding entry, if it exists
 */
methods.createHeader = (api, request) => {
  const headers = request.getIn([ 'parameters', 'headers' ])
    .map(header => {
      if (header instanceof Reference) {
        const param = api.getIn([ 'store', 'parameter', header.get('uuid') ])
        const key = param.get('key')
        const value = ('{{' + header.get('uuid') + '}}')

        return { key, value }
      }

      if (!header || !header.get('key')) {
        return null
      }

      const schema = header.getJSONSchema()

      const key = header.get('key')
      let value = null
      if (schema.default) {
        value = schema.default
      }
      else if (schema.enum) {
        value = schema.enum[0]
      }

      return { key, value }
    })
    .filter(v => !!v)

  if (!headers.size) {
    return null
  }

  return { key: 'header', value: headers.valueSeq().toJS() }
}

methods.getContentTypeParamsFromHeaders = (api, request) => {
  const contentTypeHeaders = request.get('parameters')
    .resolve(api.get('store'))
    .get('headers')
    .filter(header => header.get('key') === 'Content-Type')
    .valueSeq()

  return contentTypeHeaders
}

methods.getContentTypeParamsFromContext = (context) => {
  return context.get('constraints').filter(param => {
    return param.get('key') === 'Content-Type' &&
      param.get('in') === 'headers' &&
      param.get('usedIn') === 'request'
  })
}

/**
 * extracts a PostmanBodyMode from a Context
 * @param {Api} api: the api to use to resolve shared parameters
 * @param {Request} request: the request from which to get the body parameters
 * @param {Context} context: the context from which to infer the body mode
 * @returns {'raw'|'formdata'|'urlencoded'} the corresponding body mode
 */
methods.createBodyMode = (api, request, context) => {
  let contentTypeParams = null
  if (!context) {
    contentTypeParams = methods.getContentTypeParamsFromHeaders(api, request)
  }
  else {
    contentTypeParams = methods.getContentTypeParamsFromContext(context)
  }

  if (contentTypeParams.size !== 1) {
    return 'raw'
  }

  const modeMap = [
    { key: 'application/x-www-form-urlencoded', value: 'urlencoded' },
    { key: 'multipart/form-data', value: 'formdata' }
  ]

  const contentTypesConstraint = contentTypeParams.get(0)
  const contentTypeSchema = contentTypesConstraint.getJSONSchema()

  if (contentTypeSchema.default) {
    const mode = modeMap
      .filter(({ key }) => contentTypeSchema.default.match(key))
      .map(({ value }) => value)[0]

    return mode || 'raw'
  }

  if (contentTypeSchema.enum) {
    const mode = modeMap
      .filter(({ key }) => {
        return contentTypeSchema.enum.filter(contentType => contentType.match(key)).length > 0
      })
      .map(({ value }) => value)[0]

    return mode || 'raw'
  }
}

/**
 * extracts a PostmanRawBody entry from a request in a specific context
 * @param {Api} api: the api to use to resolve shared parameters
 * @param {Request} request: the request from which to get the body parameters
 * @param {Context?} context: the context to use to filter out the body parameters
 * @returns {Entry<string, PostmanRawBody>?} the corresponding entry, if it exists
 */
methods.createBodyFromRawMode = (api, request, context) => {
  const bodyParams = request.get('parameters')
    .resolve(api.get('store'))
    .filter(!context ? List() : context.get('constraints'))
    .get('body')

  if (!bodyParams.size) {
    return null
  }

  const rawBody = bodyParams
    .map(param => {
      if (param.get('key')) {
        return '{{' + param.get('key') + '}}'
      }

      return JSON.stringify(param.getJSONSchema(), null, 2)
    })
    .valueSeq()
    .toJS()
    .join('\n')

  return { key: 'raw', value: rawBody }
}

/**
 * extracts a PostmanUrlEncodedBody entry from a request in a specific context
 * @param {Api} api: the api to use to resolve shared parameters
 * @param {Request} request: the request from which to get the body parameters
 * @param {Context?} context: the context to use to filter out the body parameters
 * @returns {Entry<string, PostmanUrlEncodedBody>?} the corresponding entry, if it exists
 */
methods.createBodyFromUrlEncodedMode = (api, request, context) => {
  const constraints = context ? context.get('constraints') : List()
  const bodyParams = request.get('parameters')
    .resolve(api.get('store'))
    .filter(constraints)
    .get('body')

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
 * @param {Api} api: the api to use to resolve shared parameters
 * @param {Request} request: the request from which to get the body parameters
 * @param {Context?} context: the context to use to filter out the body parameters
 * @returns {Entry<string, PostmanFormDataBody>?} the corresponding entry, if it exists
 */
methods.createBodyFromFormDataMode = (api, request, context) => {
  const constraints = context ? context.get('constraints') : List()
  const bodyParams = request.get('parameters')
    .resolve(api.get('store'))
    .filter(constraints)
    .get('body')

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
 * @param {Api} api: the api to use to resolve shared parameters
 * @param {Request} request: the request from which to get the body parameters
 * @param {Context?} context: the context to use to filter out the body parameters
 * @param {string} mode: the mode in which the body should be formatted
 * @returns {Entry<string, PostmanModalBody>?} the corresponding entry, if it exists
 */
methods.createBodyFromMode = (api, request, context, mode) => {
  if (mode === 'raw') {
    return methods.createBodyFromRawMode(api, request, context)
  }

  if (mode === 'urlencoded') {
    return methods.createBodyFromUrlEncodedMode(api, request, context)
  }

  if (mode === 'formdata') {
    return methods.createBodyFromFormDataMode(api, request, context)
  }

  return null
}

/**
 * extracts a PostmanBody entry from a request
 * @param {Api} api: the api to use to resolve shared parameters
 * @param {Request} request: the request from which to get the body parameters
 * @returns {Entry<string, PostmanBody>?} the corresponding entry, if it exists
 */
methods.createBody = (api, request) => {
  const context = request.get('contexts').get(0)
  const mode = methods.createBodyMode(api, request, context)

  const kvs = [
    { key: 'mode', value: mode },
    methods.createBodyFromMode(api, request, context, mode)
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

  if (!kvs.length) {
    return null
  }

  const result = kvs.reduce(convertEntryListInMap, {})
  return result
}

/**
 * extracts a PostmanItem property as an entry from an Api and a Group
 * @param {Api} api: the api to use to resolve shared objects
 * @param {Group} group: the group from which to convert into a PostmanItemGroupProperty
 * @returns {Entry<string, PostmanItemGroupProperty>} the corresponding entry, if it exists
 */
methods.createItemProp = (api, group) => {
  const items = group.get('children').map(child => {
    if (child instanceof Group) {
      return methods.createItemGroup(api, child)
    }

    return methods.createItemGroupFromResource(api, child)
  }).filter(v => !!v)

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
 * creates an PostmanVariable from an Api
 * @param {Api} api: the api to use to resolve shared objects
 * @returns {Entry<string, PostmanVariable>?} the corresponding entry, if it exists
 */
methods.createVariable = (api) => {
  const sharedParams = api.getIn([ 'store', 'parameter' ])

  if (!sharedParams.size) {
    return null
  }

  const variables = sharedParams.map((param, key) => {
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
  }).filter(v => !!v).valueSeq().toJS()

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
