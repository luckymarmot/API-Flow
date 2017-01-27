/**
 * NOTE: We assume that contextual references have an overlay that contains the applicable contexts.
 */

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

  serialize(options, api) {
    return methods.serialize(options, api)
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

/**
 * creates a url-encoded body DynamicValue.
 * @param {Array<RecordParameter>} keyValues: the list of key-value pairs that store in the body dv.
 * @returns {DynamicValue} the corresponding dynamic value
 */
methods.createUrlEncodedBodyDV = (keyValues) => {
  return new DynamicValue(
  'com.luckymarmot.BodyFormKeyValueDynamicValue', {
    keyValues: keyValues
  })
}

/**
 * creates a multipart body DynamicValue.
 * @param {Array<RecordParameter>} keyValues: the list of key-value pairs that store in the body dv.
 * @returns {DynamicValue} the corresponding dynamic value
 */
methods.createMultipartBodyDV = (keyValues) => {
  return new DynamicValue(
    'com.luckymarmot.BodyMultipartFormDataDynamicValue', {
      keyValues: keyValues
    }
  )
}

methods.createMultiSelectorDv = (choices) => {
  return new DynamicValue('me.elliotchance.MultiSelectorDynamicValue', {
    choices,
    separator: ','
  })
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

  const choices = protocol.map(methods.convertProtocolIntoRecordParameter).toJS()
  return methods.createMultiSelectorDv(choices)
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

  if (auth instanceof Auth.Digest) {
    return methods.convertDigestAuthIntoDynamicValue(auth)
  }

  if (auth instanceof Auth.OAuth1) {
    return methods.convertOAuth1AuthIntoDynamicValue(auth)
  }

  if (auth instanceof Auth.OAuth2) {
    return methods.convertOAuth2AuthIntoDynamicValue(auth)
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

/**
 * adds all shared records (except for Variables) in a standard domain.
 * @param {EnvironmentDomain} domain: the domain in which to store the shared objects.
 * @param {Api} api: the api to get the shared objects from.
 * @returns {Store<*, TypedStore<*, EnvironmentVariable>>} a store containing the corresponding
 * environment variables for each shared object of the api.
 */
methods.addVariablesToStandardDomain = (domain, api) => {
  const environment = domain.createEnvironment('Default')

  const constraint = methods.addConstraintsToDomain(domain, environment, api)
  const endpoint = methods.addEndpointsToDomain(domain, environment, api)
  const parameter = methods.addParametersToDomain(domain, environment, api)
  const auth = methods.addAuthsToDomain(domain, environment, api)

  return new Store({ constraint, endpoint, parameter, auth })
}

/**
 * calculates the size of a potential domain dedicated to Variable records.
 * @param {Api} api: the api to get the shared variables from.
 * @returns {integer} the number of shared Variable records.
 */
methods.getVariableEnvironmentDomainSize = (api) => api.getIn([ 'store', 'variable' ]).size

/**
 * tests whether this api needs an environment domain dedicated to Variable records.
 * @param {Api} api: the api to test.
 * @returns {boolean} whether this api requires an environment domain for Variables.
 */
methods.needsVariableEnvironmentDomain = (api) => {
  const size = methods.getVariableEnvironmentDomainSize(api)

  return size > 0
}

/**
 * updates an environment variable in a domain with a given value, for a given environment name.
 * @param {EnvironmentDomain} domain: the domain in which the variable is stored.
 * @param {EnvironmentVariable} variable: the variable to update
 * @param {string|DynamicString} value: the value to store in the variable
 * @param {string} envName: the name of the environment in which the value should be stored.
 * @returns {EnvironmentVariable} the updated variable.
 */
methods.updateEnvironmentVariableWithEnvironmentValue = (domain, variable, value, envName) => {
  let environment = domain.getEnvironmentByName(envName)
  if (!environment) {
    environment = domain.createEnvironment(envName)
  }
  variable.setValue(value, environment)
  return variable
}

/**
 * converts a Variable record into an environment variable.
 * @param {EnvironmentDomain} domain: the domain in which the variable is stored.
 * @param {Variable} variable: the variable record to convert.
 * @param {string} key: the name of the variable
 * @returns {EnvironmentVariable} the corresponding environment variable
 */
methods.convertVariableIntoEnvironmentVariable = (domain, variable, key) => {
  const envVariable = domain.createEnvironmentVariable(key)
  const updateVariable = currify(methods.updateEnvironmentVariableWithEnvironmentValue, domain)
  return variable.get('values').reduce(updateVariable, envVariable)
}

/**
 * adds all shared Variables of an Api into a dedicated domain.
 * @param {EnvironmentDomain} domain: the domain in which to store the variables.
 * @param {Api} api: the api to get the variables from.
 * @returns {Store<*, TypedStore<*, EnvironmentVariable>>} the corresponding store which maps
 * references to environment variables.
 */
methods.addVariablesToVariableDomain = (domain, api) => {
  const convertVariable = currify(methods.convertVariableIntoEnvironmentVariable, domain)
  const vars = api.getIn([ 'store', 'variable' ]).map(convertVariable)

  return new Store({
    variable: vars
  })
}

/**
 * creates and populates all the environment required by this Api.
 * @param {Context} context: the paw context to import the api in.
 * @param {Api} api: the api to get the shared objects from
 * @returns {Store<*, TypedStore<*, EnvironmentVariable>>} the corresponding store that maps
 * references to environment variables.
 */
methods.createEnvironments = (context, api) => {
  let store = new Store()
  if (methods.needsStandardEnvironmentDomain(api)) {
    const domain = methods.createStandardEnvironmentDomain(context, api)
    store = methods.addVariablesToStandardDomain(domain, api)
  }

  if (methods.needsVariableEnvironmentDomain(api)) {
    const domain = methods.createVariableEnvironmentDomain(context, api)
    const variableStore = methods.addVariablesToVariableDomain(domain, api)
    store = store.set('variable', variableStore.get('variable'))
  }

  return store
}

/**
 * converts a sequence parameter into a DynamicString with variables for sub parameters.
 * @param {PawRequest} pawRequest: the paw request to which variables should be bound.
 * @param {Parameter} param: the sequence parameter to convert.
 * @returns {DynamicString} the corresponding dynamic string
 */
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
/**
 * converts a Parameter into a variable.
 * @param {PawRequest} pawRequest: the paw request to which the variable should be bound.
 * @param {Parameter} param: the parameter to convert.
 * @returns {DynamicString} the corresponding dynamic string (that wraps a the variable dv)
 */
methods.convertParameterIntoVariableDS = (pawRequest, param) => {
  if (param.get('superType') === 'sequence') {
    return methods.convertSequenceParameterIntoVariableDS(pawRequest, param)
  }

  const schema = param.getJSONSchema(false)
  const { name, value, description } = methods.getVariableArgumentsFromParameter(param)

  const variable = pawRequest.addVariable(name, value, description)
  variable.schema = JSON.stringify(schema)

  return variable.createDynamicString()
}

/**
 * converts a pathname urlComponent into a DynamicString.
 * @param {PawRequest} pawRequest: the paw request to which the possible variables should be bound.
 * @param {URLComponent} pathname: the URLComponent to convert. Note that although this process is
 * very similar to converting a Parameter, we do not create a variable named `pathname` with this
 * process, whereas we would with the other.
 * @returns {string|DynamicString} the corresponding DynamicString
 */
methods.convertPathnameIntoDynamicString = (pawRequest, pathname) => {
  const param = pathname.get('parameter')
  if (param.get('superType') === 'sequence') {
    return methods.convertSequenceParameterIntoVariableDS(pawRequest, param)
  }

  return pathname.generate(List([ '{', '}' ]))
}

/**
 * converts an endpoint or a reference into a DynamicString.
 * @param {Store} store: the store to resolve reference with
 * @param {URL|Reference} endpoint: the URL or Reference to convert into a DynamicString
 * @returns {DynamicString} the corresponding dynamic string
 */
methods.convertEndpointOrReferenceIntoDS = (store, endpoint) => {
  if (endpoint instanceof Reference) {
    const variable = store.getIn([ 'endpoint', endpoint.get('uuid') ])
    if (variable) {
      return variable.createDynamicString()
    }
    return null
  }

  return methods.createEndpointDynamicString(endpoint)
}

methods.convertEndpointsDSArrayIntoVariableDV = (pawRequest, endpoints) => {
  if (endpoints.length === 1) {
    return endpoints[0]
  }

  const variable = pawRequest
    .addVariable('endpoint', endpoints[0], 'the endpoint of this url')
  variable.schema = JSON.stringify({ type: 'string', enum: endpoints })

  const dv = variable.createDynamicValue()
  return dv
}

// TODO deal with case where there's an overlay for the url
/**
 * converts a map of endpoints and a path URL record into a DynamicString. This is used to create
 * the url in Paw.
 * @param {PawRequest} pawRequest: the paw request to which the possible variable should be bound.
 * @param {Store} store: the store of environment variables
 * @param {OrderedMap<*, URL>} endpoints: all the endpoints that this request can use.
 * @param {URL} path: the URL record representing the pathname of the request.
 * @returns {DynamicString} the corresponding dynamic string
 */
methods.convertEndpointsAndPathnameIntoDS = (pawRequest, store, endpoints, path) => {
  const pathname = path.get('pathname')
  const convertEndpointOrReference = currify(methods.convertEndpointOrReferenceIntoDS, store)

  const converted = endpoints
    .map(convertEndpointOrReference)
    .filter(value => !!value)
    .valueSeq()
    .toJS()

  const dv = methods.convertEndpointsDSArrayIntoVariableDV(pawRequest, converted)
  const pathDs = methods.convertPathnameIntoDynamicString(pawRequest, pathname)

  return new DynamicString(dv, pathDs)
}

/**
 * extracts the default value from a Parameter, as a string
 * @param {Parameter} parameter: the parameter to extract the default value from
 * @returns {string} the corresponding value
 */
methods.getDefaultValueFromParameter = (parameter) => {
  const defaultValue = parameter.get('default')

  if (typeof defaultValue === 'string') {
    return defaultValue
  }
  else if (typeof defaultValue !== 'undefined' && defaultValue !== null) {
    return JSON.stringify(defaultValue)
  }

  return ''
}

/**
 * extracts the name, value and description of a Parameter.
 * @param {Parameter} parameter: the parameter from which to extract the information
 * @returns {
 *   {
 *     name: string,
 *     value: string,
 *     description: string
 *   }
 * } the extracted informations
 */
methods.getVariableArgumentsFromParameter = (parameter) => {
  const name = parameter.get('key') || ''
  const value = methods.getDefaultValueFromParameter(parameter)
  const description = parameter.get('description') || ''

  return { name, value, description }
}

/**
 * converts Parameter from a Reference into a paw variable as a DynamicString
 * @param {PawRequest} pawRequest: the paw request to which the variable should be bound.
 * @param {Store} store: the store used to resolve the reference into an EnvironmentVariable
 * @param {Reference} reference: the reference to resolve to create the paw variable
 * @returns {Entry<string, string|DynamicString>} the corresponding DynamicString
 *
 * NOTE: We have to do this because Paw does not yet have document variables which would allow us
 * to simply reference them from the reference. What happens right now is that only the schema of
 * a shared parameter is saved in the environment variable instead of the full parameter.
 * Consequently, we have to resolve the reference to get the parameter (which is why the updated
 * TypedStore for parameters stores objects with both the environment variable and the parameter)
 * and create the variable at the request level, and then use the environment variable in the
 * schema of the variable.
 */
methods.convertParameterFromReference = (pawRequest, store, reference) => {
  const { parameter, variable } = store.getIn([ 'parameter', reference.get('uuid') ]) || {}
  if (!parameter) {
    return { key: '', value: '' }
  }

  const { name, value, description } = methods.getVariableArgumentsFromParameter(parameter)
  const variableParam = pawRequest.addVariable(name, value, description)
  // TODO replace this schema with variable.createDynamicString()
  variableParam.schema = '{}'

  return { key: name, value: variableParam.createDynamicString() }
}

/**
 * converts a Parameter or Reference to one into a DynamicString
 * @param {PawRequest} pawRequest: the paw request to which variables should be bound, should they
 * exist.
 * @param {Store} store: the store used to resolve the reference if parameterOrReference is a
 * Reference.
 * @param {Parameter|Reference} parameterOrReference: the record to convert into a DynamicString.
 * @returns {Entry<*, string|DynamicString>} the corresponding DynamicString, as an Entry
 */
methods.convertReferenceOrParameterToDsEntry = (pawRequest, store, parameterOrReference) => {
  if (parameterOrReference instanceof Reference) {
    return methods.convertParameterFromReference(pawRequest, store, parameterOrReference)
  }

  return {
    key: parameterOrReference.get('key'),
    value: methods.convertParameterIntoVariableDS(pawRequest, parameterOrReference)
  }
}

/**
 * adds a DynamicString to the header of a request
 * @param {PawRequest} pawRequest: the paw request to which the header should be added.
 * @param {string} key: the name of the header
 * @param {string|DynamicString} value: the value of the header
 * @returns {PawRequest} the updated pawRequest
 */
methods.addHeaderToRequest = (pawRequest, { key, value }) => {
  pawRequest.addHeader(key, value)
  return pawRequest
}

/**
 * adds headers to a paw request.
 * @param {PawRequest} pawRequest: the paw request to which the headers should be added.
 * @param {Store} store: the store to use to resolve reference to Parameters.
 * @param {ParameterContainer} container: the container that holds all the headers
 * @returns {PawRequest} the update pawRequest
 */
methods.addHeadersToRequest = (pawRequest, store, container) => {
  const convertHeaderParamOrRef = currify(
    methods.convertReferenceOrParameterToDsEntry,
    pawRequest, store
  )
  const headers = container.get('headers')
  return headers
    .map(convertHeaderParamOrRef)
    .reduce(methods.addHeaderToRequest, pawRequest)
}

/**
 * adds a DynamicString to the url params of a request
 * @param {PawRequest} pawRequest: the paw request to which the url param should be added.
 * @param {string} key: the name of the url param
 * @param {string|DynamicString} value: the value of the url param
 * @returns {PawRequest} the updated pawRequest
 */
methods.addUrlParamToRequest = (pawRequest, { key, value }) => {
  pawRequest.addUrlParameter(key, value)
  return pawRequest
}

/**
 * adds url params to a paw request.
 * @param {PawRequest} pawRequest: the paw request to which the url params should be added.
 * @param {Store} store: the store to use to resolve reference to Parameters.
 * @param {ParameterContainer} container: the container that holds all the url params
 * @returns {PawRequest} the update pawRequest
 */
methods.addUrlParamsToRequest = (pawRequest, store, container) => {
  const convertHeaderParamOrRef = currify(
    methods.convertReferenceOrParameterToDsEntry,
    pawRequest, store
  )
  const urlParams = container.get('queries')
  return urlParams
    .map(convertHeaderParamOrRef)
    .reduce(methods.addUrlParamToRequest, pawRequest)
}

/**
 * tests whether a parameter can be used with a multipart/form-data context.
 * @param {Parameter} parameter: the parameter to test.
 * @returns {boolean} whether the parameter is usable in a multipart context
 */
methods.isParameterValidWithMultiPartContext = (parameter) => parameter.isValid(
  new Parameter({
    key: 'Content-Type',
    default: 'multipart/form-data'
  })
)

/**
 * tests whether a parameter can be used with a urlEncoded context.
 * @param {Parameter} parameter: the parameter to test.
 * @returns {boolean} whether the parameter is usable in a urlEncoded context
 */
methods.isParameterValidWithUrlEncodedContext = (parameter) => parameter.isValid(
  new Parameter({
    key: 'Content-Type',
    default: 'application/x-www-form-urlencoded'
  })
)

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

  const isFormData = methods.isParameterValidWithMultiPartContext(parameter)
  const isUrlEncoded = methods.isParameterValidWithUrlEncodedContext(parameter)

  return !isFormData && !isUrlEncoded
}

// TODO improve that with a JSF DV
/**
 * sets the body of request as raw
 * @param {PawRequest} pawRequest: the paw request whose body should be set.
 * @param {Map<*, Parameter>} params: the body params that can be used in this context.
 * @returns {PawRequest} the updated paw request
 */
methods.setRawBody = (pawRequest, params) => {
  const body = params.valueSeq().get(0)
  pawRequest.body = body.generate(false)
  return pawRequest
}

/**
 * tests whether a context requires the content type to be url-encoded or not.
 * @param {Context} context: the context to test
 * @returns {boolean} returns true if it requires url-encoded Content-Type.
 */
methods.isContextWithUrlEncoded = (context) => {
  return context
    .get('constraints')
    .filter((param) => param.get('default') === 'application/x-www-form-urlencoded').size > 0
}

/**
 * tests whether a context requires the content type to be multipart or not.
 * @param {Context} context: the context to test
 * @returns {boolean} returns true if it requires multipart Content-Type.
 */
methods.isContextWithMultiPart = (context) => {
  return context
    .get('constraints')
    .filter((param) => param.get('default') === 'multipart/form-data').size > 0
}

/**
 * adds an Entry to a RecordParameter array.
 * @param {Array<RecordParameter>} kvList: the list of key-value RecordParameters to update.
 * @param {string} key: the name of the parameter
 * @param {string|DynamicString} value: the DynamicString corresponding to a parameter
 * @returns {Array<RecordParameter>} the updated array
 */
methods.addEntryToRecordParameterArray = (kvList, { key, value }) => {
  kvList.push(new RecordParameter(key, value, true))
  return kvList
}

/**
 * sets the body of a request to a urlEncoded or multipart body
 * @param {PawRequest} pawRequest: the paw request to update
 * @param {Store} store: the store used to resolve potential references in the params
 * @param {Parameter|Reference} params: the parameters to add to the body
 * @returns {PawRequest} the update paw request
 */
methods.setFormDataBody = (pawRequest, store, params, context) => {
  const convertBodyParamOrRef = currify(
    methods.convertReferenceOrParameterToDsEntry,
    pawRequest, store
  )

  const isUrlEncoded = methods.isContextWithUrlEncoded(context)
  const isFormData = methods.isContextWithMultiPart(context)

  const keyValues = params
    .map(convertBodyParamOrRef)
    .reduce(methods.addEntryToRecordParameterArray, [])

  let body = ''
  if (isFormData) {
    body = methods.createMultipartBodyDV(keyValues)
  }

  if (isUrlEncoded) {
    body = methods.createUrlEncodedBodyDV(keyValues)
  }

  pawRequest.body = methods.wrapDV(body)
  return pawRequest
}

/**
 * adds body parameters to a paw request
 * @param {PawRequest} pawRequest: the paw request to update with a body
 * @param {Store} store: the store to use to resolve potential reference to parameters
 * @param {ParameterContainer} container: the parameter container that holds all the body parameters
 * @param {Context} context: the Context record that is being applied to the container
 * @returns {PawRequest} the updated paw request
 */
methods.addBodyToRequest = (pawRequest, store, container, context) => {
  const bodyParams = container.get('body')

  const rawBodyParams = bodyParams.filter(methods.isBodyParameter)
  if (rawBodyParams.size > 0) {
    return methods.setRawBody(pawRequest, rawBodyParams)
  }

  const formDataParams = bodyParams
    .filter((param) => !methods.isBodyParameter(param))
    .valueSeq()

  if (formDataParams.size > 0 && context) {
    return methods.setFormDataBody(pawRequest, store, formDataParams, context)
  }
}

/**
 * extracts a container from a Request record, as well as the corresponding context if it exists
 * @param {Request} request: the request to extract the container from
 * @returns {
 *   {
 *     container: ParameterContainer,
 *     requestContext: Context?
 *   }
 * } the corresponding object that holds both the container and its context
 */
methods.getContainerFromRequest = (request) => {
  const context = request.getIn([ 'contexts', 0 ])
  const container = request.get('parameters')
  if (context) {
    return { container: context.filter(container), requestContext: context }
  }

  return { container }
}

/**
 * converts an auth into a DynamicString from a reference.
 * @param {Store} store: the store to use to resolve the reference
 * @param {Reference} reference: the reference to an EnvironmentVariable representing an Auth.
 * @returns {DynamicString} the corresponding DynamicString
 */
methods.convertAuthFromReference = (store, reference) => {
  const variable = store.getIn([ 'auth', reference.get('uuid') ])
  return variable.createDynamicString()
}

/**
 * converts a reference or an auth into a DynamicString Entry.
 * @param {Store} store: the store used to resolve references
 * @param {Auth|Reference} authOrReference: the record to convert into a DynamicString
 * @returns {DynamicString} the corresponding DynamicString
 */
methods.convertReferenceOrAuthToDsEntry = (store, authOrReference) => {
  if (authOrReference instanceof Reference) {
    return methods.convertAuthFromReference(store, authOrReference)
  }

  const dv = methods.convertAuthIntoDynamicValue(authOrReference)
  return methods.wrapDV(dv)
}

// TODO create Variable DS that has enum with all auth possible
/**
 * sets the Auth DynamicString as am Authorization Header.
 * @param {PawRequest} pawRequest: the paw request to update
 * @param {DynamicString} auth: the DynamicString representing an auth
 * @returns {PawRequest} the update paw request
 */
methods.addAuthToRequest = (pawRequest, auth) => {
  pawRequest.setHeader('Authorization', auth)
  return pawRequest
}

/**
 * converts the auths of a request into DynamicStrings and adds them to a paw request.
 * @param {PawRequest} pawRequest: the paw request to update with all the auths
 * @param {Store} store: the store to use to resolve references
 * @param {Request} request: the request to get the auths from
 * @returns {PawRequest} the updated paw request
 */
methods.addAuthsToRequest = (pawRequest, store, request) => {
  const convertAuthParamOrRef = currify(methods.convertReferenceOrAuthToDsEntry, store)
  const auths = request.get('auths')
  return auths
    .map(convertAuthParamOrRef)
    .reduce(methods.addAuthToRequest, pawRequest)
}

/**
 * converts a request into a paw request
 * @param {PawContext} context: the paw context in which to create the paw request.
 * @param {Store} store: the store used to resolve references
 * @param {URL} path: the URL record representing the path of the method
 * @param {Request} request: the request to convert
 * @returns {PawRequest} the newly created request
 */
methods.convertRequestIntoPawRequest = (context, store, path, request) => {
  const pathname = path.toURLObject(List([ '{', '}' ])).pathname
  const name = request.get('name') || pathname
  const method = (request.get('method') || 'get').toUpperCase()
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
/**
 * Converts a Resource into a RequestGroup of PawRequests
 * @param {PawContext} context: the context in which to create the resource group
 * @param {Store} store: the store used to resolve the references
 * @param {Resource} resource: the resource to convert
 * @returns {PawRequestGroup} the newly created request group
 */
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

/**
 * converts all Resources in an Api into request groups that hold paw requests
 * @param {PawContext} context: the context in which to extract all the resources as request groups
 * @param {Store} store: the store to use to resolve references
 * @param {Api} api: the api to extract all the resources from
 * @returns {OrderedMap<*, PawRequestGroup>} the corresponding map of paw request groups
 */
methods.createRequests = (context, store, api) => {
  const convertResource = currify(methods.convertResourceIntoGroup, context, store)
  const resources = api.get('resources').map(convertResource)

  return resources
}

/**
 * creates a layout of nested request groups based on the structure inside Group Records.
 * @param {PawContext} context: the paw context in which this layout should be constructed
 * @param {OrderedMap<*, PawRequestGroup>} resources: the map of requests groups to insert
 * @param {Group|PawRequestGroup} group: the group to process to set the layout up.
 * @param {string} groupName: the name that should be used for the group
 * @returns {PawRequestGroup?} the corresponding layout of nested paw request groups
 */
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

/**
 * imports an Api into a PawContext
 * @param {PawContext} context: the paw context in which the api should be imported
 * @param {Api} api: the api to convert
 * @param {Array<Items>} items: the list of items that was passed to the serializer
 * @param {PawOptions} options: contains a few options that can improve the user experience when
 * importing in paw.
 * @returns {boolean} whether the import was successful or not
 */
methods.serialize = ({ context, items, options } = {}, api) => {
  const store = methods.createEnvironments(context, api)
  const resources = methods.createRequests(context, store, api)
  methods.createGroups(context, resources, api.get('group'), methods.getTitleFromApi(api))
  return true
}

export const __internals__ = methods
export default PawSerializer
