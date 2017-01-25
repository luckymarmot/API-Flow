import { List } from 'immutable'
import { DynamicValue, DynamicString, RecordParameter } from '../../mocks/PawShims'

import Store from '../../models/Store'
import Auth from '../../models/Auth'
import Reference from '../../models/Reference'
import Parameter from '../../models/Parameter'
import Group from '../../models/Group'

import { currify } from '../../utils/fp-utils'

const __inputs__ = []

const methods = {}

export class PawSerializer {
  static fileExtensions = [];

  static inputs = __inputs__

  serialize(api, options) {
    return methods.serialize(api, options)
  }
}

/**
 * wraps a DynamicValue in a DynamicString
 * @param {DynamicValue} dv: the dv to wrapDV
 * @returns {DynamicString} the corresponding DynamicString
 */
methods.wrapDV = (dv) => new DynamicString(dv)

/**
 * creates a JSON DynamicValue to wrap a JSON object.
 * @param {Object} json: the json object to wrap in a DV
 * @returns {DynamicValue} the corresponding JSON DynamicValue
 */
methods.createJSONDV = (json) => new DynamicValue('com.luckymarmot.JSONDynamicValue', {
  json: JSON.stringify(json)
})

methods.createUrlEncodedBodyDV = (keyValues) => {
  return new DynamicValue(
  'com.luckymarmot.BodyFormKeyValueDynamicValue', {
    keyValues: keyValues
  })
}

methods.createMultipartBodyDV = (keyValues) => {
  return new DynamicValue(
    'com.luckymarmot.BodyMultipartFormDataDynamicValue', {
      keyValues: keyValues
    }
  )
}

/**
 * extracts the title from an Api Record.
 * @param {Api} api: the api to get the name of.
 * @returns {string} the title of the api, or a default value if the api does not have any title
 */
methods.getTitleFromApi = (api) => api.getIn([ 'info', 'title' ]) || 'Imports'

/**
 * creates a standard environment domain in which to store standard values, such as shared schemas,
 * parameters, endpoints and authentication methods.
 * @param {Context} context: the paw context in which to create the environment domain.
 * @param {Api} api: the api to import in Paw.
 * @returns {EnvironmentDomain} the newly created environment domain
 */
methods.createStandardEnvironmentDomain = (context, api) => {
  const title = methods.getTitleFromApi(api)
  return context.createEnvironmentDomain(title)
}

// assumes correctly formatted api
/**
 * calculates the size of the standard environment domain. This is used to determine whether we
 * should create a domain or not.
 * @param {Api} api: the api to import in Paw.
 * @returns {integer} the number of values that would be stored in the environment domain.
 */
methods.getStandardEnvironmentDomainSize = (api) => {
  const constraints = api.getIn([ 'store', 'constraint' ])
  const endpoints = api.getIn([ 'store', 'endpoint' ])
  const auths = api.getIn([ 'store', 'auth' ])
  const parameters = api.getIn([ 'store', 'parameter' ])
  // const responses = api.getIn([ 'store', 'response' ])

  const size = constraints.size +
    endpoints.size +
    auths.size +
    parameters.size
    // +
    // responses.size

  return size
}

/**
 * tests whether an Api needs a standard environment domain to be fully imported in Paw
 * @param {Api} api: the api to import in Paw
 * @returns {boolean} whether a standard environment domain is needed.
 */
methods.needsStandardEnvironmentDomain = (api) => {
  const size = methods.getStandardEnvironmentDomainSize(api)

  return size > 0
}

/**
 * creates a Variable environment domain. This is used to import Variables with multiple contexts
 * into Paw.
 * @param {Context} context: the Paw context in which to create the environment domain
 * @param {Api} api: the api to import in Paw.
 * @returns {EnvironmentDomain} the newly created environment domain.
 *
 * NOTE: It needs to be separate from the standard domain because values imported in the standard
 * domain only have a single value possible, whereas variables can have multiple values whose
 * evaluation depend on the name of the context (Think switching between Postman Environments)
 */
methods.createVariableEnvironmentDomain = (context, api) => {
  const title = methods.getTitleFromApi(api)
  const domainName = 'Vars - ' + title
  return context.createEnvironmentDomain(domainName)
}

/**
 * adds a Constraint as JSON DV to a domain.
 * @param {EnvironmentDomain} domain: the domain to add the constraint to.
 * @param {Environment} environment: the domain environment for which this value is applicable.
 * @param {Constraint} constraint: the constraint to add.
 * @param {string} key: the name of the constraint
 * @returns {EnvironmentVariable} the newly created environment variable
 */
methods.addConstraintToDomain = (domain, environment, constraint, key) => {
  const variable = domain.createEnvironmentVariable(key)
  const schema = constraint.toJSONSchema()
  const dv = methods.createJSONDV(schema)
  const ds = methods.wrapDV(dv)
  variable.setValue(ds, environment)

  return variable
}

/**
 * adds all constraints of a Constraint TypedStore into a domain.
 * @param {EnvironmentDomain} domain: the domain to add the constraints to.
 * @param {Environment} environment: the domain environment for which the constraints are
 * applicable.
 * @param {Api} api: the api to get the TypedStore from.
 * @returns {TypedStore}: a TypedStore of EnvironmentVariables representing constraints.
 */
methods.addConstraintsToDomain = (domain, environment, api) => {
  const constraints = api.getIn([ 'store', 'constraint' ])
  const addConstraint = currify(methods.addConstraintToDomain, domain, environment)

  return constraints.map(addConstraint)
}

/**
 * removes ':' at the end of a protocol string
 * @param {string} protocol: the protocol to trim
 * @returns {string} the trimmed string
 */
methods.removeDotsFromProtocol = (protocol) => {
  if (protocol[protocol.length - 1] === ':') {
    return protocol.slice(0, protocol.length - 1)
  }

  return protocol
}

/**
 * converts a protocol string into a Record Parameter.
 * @param {string} protocol: the protocol to convert
 * @param {integer} index: the index of the protocol in the parent array. This is used to set the
 * first Record Parameter as enabled
 * @return {RecordParameter} the corresponding Record Parameter.
 */
methods.convertProtocolIntoRecordParameter = (protocol, index) => {
  const stripped = methods.removeDotsFromProtocol(protocol)
  const isEnabled = index === 0
  return new RecordParameter(stripped, ', ', isEnabled)
}

/**
 * converts a protocol URLComponent into a DynamicValue.
 * @param {URLComponent} protocol: the url component to convert
 * @returns {DynamicValue} the corresponding DynamicValue.
 */
methods.createProtocolDV = (protocol) => {
  if (!protocol || !protocol.size) {
    return 'http'
  }

  if (protocol.size === 1) {
    return methods.removeDotsFromProtocol(protocol.get(0))
  }

  return new DynamicValue('me.elliotchance.MultiSelectorDynamicValue', {
    choices: protocol.map(methods.convertProtocolIntoRecordParameter).toJS(),
    separator: ','
  })
}

// TODO save parameters as document parameters when these finally exist in Paw
/**
 * converts a urlComponent into a DynamicString or a standard string as a fallback.
 * @param {URLComponent} urlComponent: the urlComponent to convert
 * @return {string|DynamicString} the converted value
 */
methods.convertURLComponentToDynamicString = (urlComponent) => {
  if (!urlComponent) {
    return ''
  }

  return urlComponent.generate(List([ '{', '}' ]))
}

/**
 * converts an endpoint into a DynamicString.
 * @param {URL} endpoint: the endpoint to convert
 * @returns {DynamicString} the corresponding DynamicString
 */
methods.createEndpointDynamicString = (endpoint) => {
  const protocol = methods.createProtocolDV(endpoint.get('protocol'))
  const slashes = '://'
  const hostname = methods.convertURLComponentToDynamicString(endpoint.get('hostname'))
  const port = methods.convertURLComponentToDynamicString(endpoint.get('port'))
  const portDots = port ? ':' : ''
  const pathname = methods.convertURLComponentToDynamicString(endpoint.get('pathname'))

  return new DynamicString(protocol, slashes, hostname, portDots, port, pathname)
}

/**
 * adds an endpoint to a domain, as DynamicStrings
 * @param {EnvironmentDomain} domain: the domain to add the endpoint to.
 * @param {Environment} environment: the environment in which this endpoint value is applicable.
 * @param {URL} endpoint: the endpoint to add to the domain
 * @param {string} key: the name of the endpoint
 * @returns {EnvironmentVariable} the newly created environment variable.
 */
methods.addEndpointToDomain = (domain, environment, endpoint, key) => {
  const variable = domain.createEnvironmentVariable(key)
  const ds = methods.createEndpointDynamicString(endpoint)
  variable.setValue(ds, environment)

  return variable
}

/**
 * adds all endpoints from an Endpoint TypedStore to a domain.
 * @param {EnvironmentDomain} domain: the domain to add the endpoints to.
 * @param {Environment} environment: the environment in which these endpoints are applicable.
 * @param {Api} api: the api from which to get the Endpoint TypedStore.
 * @returns {TypedStore} a TypedStore of EnvironmentVariables representing endpoints.
 */
methods.addEndpointsToDomain = (domain, environment, api) => {
  const endpoints = api.getIn([ 'store', 'endpoint' ])
  const addEndpoint = currify(methods.addEndpointToDomain, domain, environment)

  return endpoints.map(addEndpoint)
}

/**
 * adds a Parameter to a domain, as a DynamicString
 * @param {EnvironmentDomain} domain: the domain to add the parameter to.
 * @param {Environment} environment: the environment in which this parameter value is applicable.
 * @param {Parameter} parameter: the parameter to add to the domain
 * @param {string} key: the name of the endpoint
 * @returns {
 *   {
 *     variable: EnvironmentVariable,
 *     parameter: Parameter
 *   }
 * } an object containing the newly created environment variable, and its associated parameter.
 */
methods.addParameterToDomain = (domain, environment, parameter, key) => {
  const variable = domain.createEnvironmentVariable(key)
  const schema = parameter.getJSONSchema(false)
  const dv = methods.createJSONDV(schema)
  const ds = methods.wrapDV(dv)
  variable.setValue(ds, environment)

  return { variable, parameter }
}

/**
 * adds all parameters from a Parameter TypedStore to a domain.
 * @param {EnvironmentDomain} domain: the domain to add the parameters to.
 * @param {Environment} environment: the environment in which these parameters are applicable.
 * @param {Api} api: the api from which to get the Parameter TypedStore.
 * @returns {TypedStore} a TypedStore of EnvironmentVariables representing parameters.
 */
methods.addParametersToDomain = (domain, environment, api) => {
  const parameters = api.getIn([ 'store', 'parameter' ])
  const addParameter = currify(methods.addParameterToDomain, domain, environment)

  return parameters.map(addParameter)
}

/**
 * converts a BasicAuth into its corresponding DynamicValue
 * @param {Auth} auth: the basic auth to convert
 * @returns {DynamicValue} the corresponding DynamicValue
 */
methods.convertBasicAuthIntoDynamicValue = (auth) => {
  return new DynamicValue('com.luckymarmot.BasicAuthDynamicValue', {
    username: auth.get('username') || '',
    password: auth.get('password') || ''
  })
}

/**
 * converts a BasicAuth into its corresponding DynamicValue
 * @param {Auth} auth: the basic auth to convert
 * @returns {DynamicValue} the corresponding DynamicValue
 */
methods.convertBasicAuthIntoDynamicValue = (auth) => {
  return new DynamicValue('com.luckymarmot.BasicAuthDynamicValue', {
    username: auth.get('username') || '',
    password: auth.get('password') || ''
  })
}

/**
 * converts a DigestAuth into its corresponding DynamicValue
 * @param {Auth} auth: the basic auth to convert
 * @returns {DynamicValue} the corresponding DynamicValue
 */
methods.convertDigestAuthIntoDynamicValue = (auth) => {
  return new DynamicValue('com.luckymarmot.PawExtensions.DigestAuthDynamicValue', {
    username: auth.get('username') || '',
    password: auth.get('password') || ''
  })
}

/**
 * converts a OAuth1Auth into its corresponding DynamicValue
 * @param {Auth} auth: the basic auth to convert
 * @returns {DynamicValue} the corresponding DynamicValue
 */
methods.convertOAuth1AuthIntoDynamicValue = (auth) => {
  return new DynamicValue('com.luckymarmot.OAuth1HeaderDynamicValue', {
    callback: auth.get('callback') || '',
    consumerSecret: auth.get('consumerSecret') || '',
    tokenSecret: auth.get('tokenSecret') || '',
    consumerKey: auth.get('consumerKey') || '',
    algorithm: auth.get('algorithm') || '',
    nonce: auth.get('nonce') || '',
    additionalParameters: auth.get('additionalParameters') || '',
    timestamp: auth.get('timestamp') || '',
    token: auth.get('token') || ''
  })
}

/**
 * converts a OAuth2Auth into its corresponding DynamicValue
 * @param {Auth} auth: the basic auth to convert
 * @returns {DynamicValue} the corresponding DynamicValue
 *
 * NOTE: not 100% sure that authorizationCode is equivalent to 'accessCode'. Might be 'password'.
 */
methods.convertOAuth2AuthIntoDynamicValue = (auth) => {
  const grantType = {
    accessCode: 0,
    implicit: 1,
    application: 2,
    password: 3
  }

  return new DynamicValue('com.luckymarmot.OAuth2DynamicValue', {
    authorizationURL: auth.get('authorizationUrl') || '',
    accessTokenURL: auth.get('tokenUrl') || '',
    grantType: grantType[auth.get('flow')] || 0,
    scopes: auth.get('scopes').map(({ key }) => key).join(', ')
  })
}

/**
 * converts an auth in its corresponding DynamicValue depending on the type of the auth.
 * @param {Auth} auth: the auth to convert
 * @returns {DynamicValue|''} the corresponding DynamicValue, or an empty string if there are no
 * equivalent for this auth in Paw.
 */
methods.convertAuthIntoDynamicValue = (auth) => {
  if (auth instanceof Auth.Basic) {
    return methods.convertBasicAuthIntoDynamicValue(auth)
  }

  return ''
}

/**
 * adds an Auth to a domain, as a DynamicString
 * @param {EnvironmentDomain} domain: the domain to add the auth to.
 * @param {Environment} environment: the environment in which this auth value is applicable.
 * @param {Auth} auth: the auth to add to the domain
 * @param {string} key: the name of the auth
 * @returns {EnvironmentVariable} the newly created environment variable.
 */
methods.addAuthToDomain = (domain, environment, auth, key) => {
  const variable = domain.createEnvironmentVariable(key)
  const dv = methods.convertAuthIntoDynamicValue(auth)
  const ds = methods.wrapDV(dv)
  variable.setValue(ds, environment)

  return variable
}

/**
 * adds all auths from an Auth TypedStore to a domain.
 * @param {EnvironmentDomain} domain: the domain to add the auths to.
 * @param {Environment} environment: the environment in which these auths are applicable.
 * @param {Api} api: the api from which to get the Auth TypedStore.
 * @returns {TypedStore} a TypedStore of EnvironmentVariables representing auths.
 */
methods.addAuthsToDomain = (domain, environment, api) => {
  const auths = api.getIn([ 'store', 'auth' ])
  const addAuth = currify(methods.addAuthToDomain, domain, environment)

  return auths.map(addAuth)
}


methods.addVariablesToStandardDomain = (context, domain, api) => {
  const environment = domain.createEnvironment('Default')

  const constraint = methods.addConstraintsToDomain(domain, environment, api)
  const endpoint = methods.addEndpointsToDomain(domain, environment, api)
  const parameter = methods.addParametersToDomain(domain, environment, api)
  const auth = methods.addAuthsToDomain(domain, environment, api)

  return new Store({ constraint, endpoint, parameter, auth })
}

methods.getVariableEnvironmentDomainSize = (api) => api.getIn([ 'store', 'variable' ]).size

methods.needsVariableEnvironmentDomain = (api) => {
  const size = methods.getVariableEnvironmentDomainSize(api)

  return size
}

methods.updateEnvironmentVariableWithEnvironmentValue = (domain, variable, value, envName) => {
  let environment = domain.getEnvironmentByName(envName)
  if (!environment) {
    environment = domain.createEnvironment(envName)
  }
  variable.setValue(value, environment)
  return variable
}

methods.convertVariableIntoEnvironmentVariable = (domain, variable, key) => {
  const envVariable = domain.createEnvironmentVariable(key)
  const updateVariable = currify(methods.updateEnvironmentVariableWithEnvironmentValue, domain)
  return variable.get('values').reduce(updateVariable, envVariable)
}

methods.addVariablesToVariableDomain = (context, domain, api) => {
  const convertVariable = currify(methods.convertVariableIntoEnvironmentVariable, domain)
  const vars = api.getIn([ 'store', 'variable' ]).map(convertVariable)

  return new Store({
    variable: vars
  })
}

methods.createEnvironments = (context, api) => {
  let store = new Store()
  if (methods.needsStandardEnvironmentDomain(api)) {
    const domain = methods.createStandardEnvironmentDomain(context, api)
    store = methods.addVariablesToStandardDomain(context, domain, api)
  }

  if (methods.needsVariableEnvironmentDomain(api)) {
    const domain = methods.createVariableEnvironmentDomain(context, api)
    const variableStore = methods.addVariablesToVariableDomain(context, domain, api)
    store = store.set('variable', variableStore.get('variable'))
  }

  return store
}

methods.convertSequenceParameterIntoVariableDS = (pawRequest, param) => {
  const sequence = param.get('value')
  const parameters = sequence.map((sub, index) => {
    if (index % 2 === 0) {
      return sub.generate(true)
    }

    return methods.convertParameterIntoVariableDS(pawRequest, sub)
  }).toJS()

  return new DynamicString(...parameters)
}

// TODO use store to resolve references inside sequence params
methods.convertParameterIntoVariableDS = (pawRequest, param) => {
  if (param.get('superType') === 'sequence') {
    return methods.convertSequenceParameterIntoVariableDS(pawRequest, param)
  }

  const schema = param.getJSONSchema(false)
  const name = param.get('key') || ''
  const defaultValue = param.get('default')
  let value = ''
  if (typeof defaultValue === 'string') {
    value = defaultValue
  }
  else if (typeof defaultValue !== 'undefined' && defaultValue !== null) {
    value = JSON.stringify(defaultValue)
  }
  const description = param.get('description') || ''

  const variable = pawRequest.addVariable(name, value, description)
  variable.schema = JSON.stringify(schema)

  return variable.createDynamicString()
}

methods.convertPathnameIntoDynamicString = (pawRequest, pathname) => {
  const param = pathname.get('parameter')
  if (param.get('superType') === 'sequence') {
    return methods.convertSequenceParameterIntoVariableDS(pawRequest, param)
  }

  return pathname.generate(List([ '{', '}' ]))
}

// TODO deal with case where there's an overlay for the url
methods.convertEndpointsAndPathnameIntoDS = (pawRequest, store, endpoints, path) => {
  const pathDs = methods.convertPathnameIntoDynamicString(
    pawRequest,
    path.get('pathname')
  )

  const converted = endpoints.map((endpoint) => {
    if (endpoint instanceof Reference) {
      const variable = store.getIn([ 'endpoint', endpoint.get('uuid') ])
      if (variable) {
        return variable.createDynamicString()
      }
      return null
    }

    return methods.createEndpointDynamicString(endpoint)
  }).filter(value => !!value)
    .valueSeq()
    .toJS()

  if (converted.length === 1) {
    return new DynamicString(converted[0], pathDs)
  }

  const variable = pawRequest
    .addVariable('endpoint', converted[0], 'the endpoint of this url')
  variable.schema = JSON.stringify({ type: 'string', enum: converted })

  const dv = variable.createDynamicValue()

  return new DynamicString(dv, pathDs)
}

methods.convertParameterFromReference = (pawRequest, store, reference) => {
  const { parameter, variable } = store.getIn([ 'parameter', reference.get('uuid') ]) || {}
  if (!parameter) {
    return ''
  }

  const name = parameter.get('key') || ''
  const defaultValue = parameter.get('default')
  let value = ''
  if (typeof defaultValue === 'string') {
    value = defaultValue
  }
  else if (typeof defaultValue !== 'undefined' && defaultValue !== null) {
    value = JSON.stringify(defaultValue)
  }
  const description = parameter.get('description') || ''

  const variableParam = pawRequest.addVariable(name, value, description)
  // TODO replace this schema with variable.createDynamicString()
  variableParam.schema = '{}'

  return { key: name, value: variableParam.createDynamicString() }
}

methods.convertReferenceOrParameterToDsEntry = (pawRequest, store, parameterOrReference) => {
  if (parameterOrReference instanceof Reference) {
    return methods.convertParameterFromReference(pawRequest, store, parameterOrReference)
  }

  return {
    key: parameterOrReference.get('key'),
    value: methods.convertParameterIntoVariableDS(pawRequest, parameterOrReference)
  }
}

methods.addHeaderToRequest = (pawRequest, { key, value }) => {
  pawRequest.addHeader(key, value)
  return pawRequest
}

methods.addHeadersToRequest = (pawRequest, store, container) => {
  const convertHeaderParamOrRef = currify(
    methods.convertReferenceOrParameterToDsEntry,
    pawRequest, store
  )
  const headers = container.get('headers')
  headers
    .map(convertHeaderParamOrRef)
    .reduce(methods.addHeaderToRequest, pawRequest)
}

methods.addUrlParamToRequest = (pawRequest, { key, value }) => {
  pawRequest.addUrlParameter(key, value)
  return pawRequest
}

methods.addUrlParamsToRequest = (pawRequest, store, container) => {
  const convertHeaderParamOrRef = currify(
    methods.convertReferenceOrParameterToDsEntry,
    pawRequest, store
  )
  const urlParams = container.get('queries')
  urlParams
    .map(convertHeaderParamOrRef)
    .reduce(methods.addUrlParamToRequest, pawRequest)
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
      default: 'multipart/form-data'
    })
  )

  return !isFormData && !isUrlEncoded
}

methods.addBodyToRequest = (pawRequest, store, container, context) => {
  const bodyParams = container.get('body')

  const rawBodyParams = bodyParams.filter(methods.isBodyParameter)
  if (rawBodyParams.size > 0) {
    const body = rawBodyParams.valueSeq().get(0)
    pawRequest.body = body.generate(false)
    return pawRequest
  }

  const convertBodyParamOrRef = currify(
    methods.convertReferenceOrParameterToDsEntry,
    pawRequest, store
  )

  const formDataParams = bodyParams
    .filter((param) => !methods.isBodyParameter(param))
    .valueSeq()

  if (formDataParams.size > 0 && context) {
    const isUrlEncoded = context
      .get('constraints')
      .filter((param) => param.get('default') === 'application/x-www-form-urlencoded').size > 0
    const isFormData = context
      .get('constraints')
      .filter((param) => param.get('default') === 'multipart/form-data').size > 0

    const keyValues = formDataParams
      .map(convertBodyParamOrRef)
      .reduce((kvList, { key, value }) => {
        kvList.push(new RecordParameter(key, value, true))
        return kvList
      }, [])

    let body = ''
    if (isFormData) {
      body = methods.createMultipartBodyDV(keyValues)
    }

    if (isUrlEncoded) {
      body = methods.createUrlEncodedBodyDV(keyValues)
    }

    pawRequest.body = methods.wrapDV(body)
  }
}

methods.getContainerFromRequest = (request) => {
  const context = request.getIn([ 'contexts', 0 ])
  const container = request.get('parameters')
  if (context) {
    return { container: context.filter(container), requestContext: context }
  }

  return { container }
}

methods.convertAuthFromReference = (pawRequest, store, reference) => {
  const variable = store.getIn([ 'auth', reference.get('uuid') ])
  return variable.createDynamicString()
}

methods.convertReferenceOrAuthToDsEntry = (pawRequest, store, authOrReference) => {
  if (authOrReference instanceof Reference) {
    return methods.convertAuthFromReference(pawRequest, store, authOrReference)
  }

  const dv = methods.convertAuthIntoDynamicValue(authOrReference)
  return methods.wrapDV(dv)
}

// TODO create Variable DS that has enum with all auth possible
methods.addAuthToRequest = (pawRequest, auth) => {
  pawRequest.setHeader('Authorization', auth)
}

methods.addAuthsToRequest = (pawRequest, store, request) => {
  const convertAuthParamOrRef = currify(
    methods.convertReferenceOrAuthToDsEntry,
    pawRequest, store
  )
  const auths = request.get('auths')
  auths
    .map(convertAuthParamOrRef)
    .reduce(methods.addAuthToRequest, pawRequest)
}

methods.convertRequestIntoPawRequest = (context, store, path, request) => {
  const pathname = path.toURLObject(List([ '{', '}' ])).pathname
  const name = request.get('name') || pathname
  const method = request.get('method').toUpperCase()
  const endpoints = request.get('endpoints')
  const description = request.get('description') || ''

  const pawRequest = context.createRequest(name, method, new DynamicString(), description)

  const url = methods.convertEndpointsAndPathnameIntoDS(pawRequest, store, endpoints, path)
  const { container, requestContext } = methods.getContainerFromRequest(request)
  methods.addHeadersToRequest(pawRequest, store, container)
  methods.addUrlParamsToRequest(pawRequest, store, container)
  methods.addBodyToRequest(pawRequest, store, container, requestContext)
  methods.addAuthsToRequest(pawRequest, store, request)


  pawRequest.url = url
  return pawRequest
}

// NOTE: not sure this is the best idea
methods.convertResourceIntoGroup = (context, store, resource) => {
  const path = resource.get('path')
  const pathname = path.toURLObject(List([ '{', '}' ])).pathname
  const group = context.createRequestGroup(resource.get('name') || pathname)

  const convertRequest = currify(
    methods.convertRequestIntoPawRequest,
    context, store, path
  )

  return resource.get('methods')
    .map(convertRequest)
    .reduce(($group, pawRequest) => {
      $group.appendChild(pawRequest)
      return $group
    }, group)
}

methods.createRequests = (context, store, api) => {
  const convertResource = currify(methods.convertResourceIntoGroup, context, store)
  const resources = api.get('resources').map(convertResource)

  return resources
}

methods.createGroups = (context, resources, group, groupName) => {
  if (!group) {
    return null
  }

  if (group instanceof Group) {
    const name = groupName || group.get('name')
    const children = group.get('children')
      .map((groupOrRef) => {
        return methods.createGroups(context, resources, groupOrRef)
      })
      .filter(value => !!value)

    if (children.size) {
      const pawGroup = context.createRequestGroup(name)
      children.forEach(child => pawGroup.appendChild(child))
      return pawGroup
    }

    return null
  }

  const resourceGroup = resources.get(group)
  return resourceGroup
}

methods.serialize = ({ context, items, options } = {}, api) => {
  const store = methods.createEnvironments(context, api)
  const resources = methods.createRequests(context, store, api)
  methods.createGroups(context, resources, api.get('group'), methods.getTitleFromApi(api))
  return true
}

export const __internals__ = methods
export default PawSerializer
