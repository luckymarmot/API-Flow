import { List } from 'immutable'
import yaml from 'js-yaml'

import { currify, flatten, entries, convertEntryListInMap } from '../../../utils/fp-utils'
import Auth from '../../../models/Auth'
import Reference from '../../../models/Reference'

const __meta__ = {
  format: 'raml',
  version: 'v1.0'
}

const methods = {}

// TODO move this to a better place
methods.getKeysFromRecord = (keyMap, record) => {
  return entries(keyMap)
    .map(({ key, value }) => ({ key, value: record.get(value) }))
    .filter(({ value }) => !!value)
    .reduce(convertEntryListInMap, {})
}

export class RAMLSerializer {
  static __meta__ = __meta__

  static serialize(api) {
    return methods.serialize(api)
  }

  static validate(content) {
    return methods.validate(content)
  }
}

methods.validate = () => {
  return true
}

/**
 * extracts refs from an object field, given a key name. (used iteratively over all keys of an obj)
 * @param {Object} schema: the schema to extract the refs from.
 * @param {string} key: the key to test if it is a reference
 * @returns {Array<string>} the corresponding array of references
 */
methods.extractRefsFromObject = (schema, key) => {
  if (key === '$ref') {
    return [ schema[key] ]
  }

  return methods.getRefsFromSchema(schema[key])
}

/**
 * tests whether a schema object is array (or iterable)
 * @param {Object} schema: the schema to test whether it is an array or not
 * @returns {boolean} true if it is an array, false otherwise
 */
methods.isArray = (schema) => {
  return Array.isArray(schema) || (
    typeof schema !== 'string' && typeof schema[Symbol.iterator] === 'function'
  )
}

/**
 * iterates over an array to extract refs from items.
 * @param {Array<*>} schema: the schema (array) to extract the references from
 * @returns {Array<string>} the corresponding references
 */
methods.getRefsFromArray = (schema) => {
  return schema
    .map(methods.getRefsFromSchema)
    .reduce(flatten, [])
}

/**
 * extract refs from an object by iterating over every key
 * @param {Object} schema: the schema to extract refs from
 * @returns {Array<string>} the corresponding array of references
 */
methods.getRefsFromObject = (schema) => {
  const keys = Object.keys(schema)
  return keys
    .map(currify(methods.extractRefsFromObject, schema))
    .reduce(flatten, [])
}

/**
 * tests whether a schema is an object or not. (considers null as not an object)
 * @param {Object} schema: the schema to test the type of
 * @returns {boolean} true if it is null or not an object, false otherwise
 */
methods.isNonObjectType = (schema) => {
  return !schema || typeof schema !== 'object'
}

/**
 * returns the references associated with non object types.
 * @returns {Array<string>} the corresponding array of references
 */
methods.getRefsFromNonObjectTypes = () => []

/**
 * extracts the references from a schema.
 * @param {any} schema: the schema to extract references from. It can actually by a subset of a
 * schema. Hence the `any` type.
 * @returns {Array<string>} the corresponding array of references
 */
methods.getRefsFromSchema = (schema) => {
  if (methods.isNonObjectType(schema)) {
    return methods.getRefsFromNonObjectTypes(schema)
  }

  if (methods.isArray(schema)) {
    return methods.getRefsFromArray(schema)
  }

  return methods.getRefsFromObject(schema)
}

/**
 * (recursively) tests whether a schema is convertible to a dataType, without checking the validity
 * of its references.
 * @param {any} schema: the schema to test the convertibilty of.
 * @returns {boolean} whether the schema itself is convertible or not
 */
methods.isConvertible = (schema) => {
  if (methods.isNonObjectType(schema)) {
    return true
  }

  if (methods.isArray(schema)) {
    return schema
      .map(methods.isConvertible)
      .reduce((acc, bool) => acc && bool, true)
  }

  const keys = Object.keys(schema)
  const isValid = keys.map(key => {
    return [
      'exclusiveMaximum',
      'exclusiveMinimum',
      'additionalItems',
      'patternProperties',
      'dependencies',
      'oneOf',
      'not'
    ].indexOf(key) < 0
  }).reduce((acc, bool) => acc && bool, true)

  if (!isValid) {
    return false
  }

  return keys.map(key => {
    return methods.isConvertible(schema[key])
  }).reduce((acc, bool) => acc && bool, true)
}

/**
 * infers wether an schema is of type object or not.
 * @param {Object} schema: the schema to infer the type of
 * @returns {boolean} whether it is a schema describing an object or not
 */
methods.isObjectType = (schema) => {
  return typeof schema.properties !== 'undefined' ||
    typeof schema.minProperties !== 'undefined' ||
    typeof schema.maxProperties !== 'undefined' ||
    typeof schema.discriminator !== 'undefined' ||
    typeof schema.discriminatorValue !== 'undefined'
}

/**
 * infers wether an schema is of type array or not.
 * @param {Object} schema: the schema to infer the type of
 * @returns {boolean} whether it is a schema describing an array or not
 */
methods.isArrayType = (schema) => {
  return typeof schema.items !== 'undefined' ||
    typeof schema.uniqueItems !== 'undefined' ||
    typeof schema.minItems !== 'undefined' ||
    typeof schema.maxItems !== 'undefined'
}

/**
 * infers wether an schema is of type string or not.
 * @param {Object} schema: the schema to infer the type of
 * @returns {boolean} whether it is a schema describing a string or not
 */
methods.isStringType = (schema) => {
  return typeof schema.pattern !== 'undefined' ||
    typeof schema.maxLength !== 'undefined' ||
    typeof schema.minLength !== 'undefined'
}

/**
 * infers wether an schema is of type number or not.
 * @param {Object} schema: the schema to infer the type of
 * @returns {boolean} whether it is a schema describing a number or not
 */
methods.isNumberType = (schema) => {
  return typeof schema.minimum !== 'undefined' ||
    typeof schema.maximum !== 'undefined' ||
    typeof schema.multipleOf !== 'undefined'
}

/**
 * extracts the RAML Basic type from a schema, infering it if necessary
 * @param {Object} schema: the schema to extract the type of
 * @returns {string} the corresponding RAML basic type
 */
methods.getType = (schema) => {
  if (schema.type && schema.type !== 'null') {
    return schema.type
  }

  if (schema.type === 'null') {
    return 'nil'
  }

  if (methods.isObjectType(schema)) {
    return 'object'
  }

  if (methods.isArrayType(schema)) {
    return 'array'
  }

  if (methods.isStringType(schema)) {
    return 'string'
  }

  if (methods.isNumberType(schema)) {
    return 'number'
  }

  return 'any'
}

/**
 * converts the items array of schemas of an array-typed schema into an array of DataTypes
 * @param {Array<Object>} items: the schemas that the items can respect in the array-typed schema
 * @returns {Array<string>} the corresponding array of DataTypes
 */
methods.convertSchemaItemsArrayIntoTypes = (items) => {
  return items
    .map(methods.getTypes)
    .reduce(flatten, [])
    .map(type => '(' + type + ')[]')
}

/**
 * converts the items schema of an array-typed schema into an array of DataTypes
 * @param {Object} items: the schema that the items must respect in the array-typed schema
 * @returns {Array<string>} the corresponding array of DataTypes
 */
methods.convertSchemaItemsObjectIntoTypes = (items) => {
  return methods.getTypes(items).map(type => {
    if (type.match(/\|/)) {
      return '(' + type + ')[]'
    }
    return type + '[]'
  })
}

/**
 * extracts the DataTypes from a schema with an items property
 * @param {Array<Object> | Object} items: the items property of the schema
 * @returns {Array<string>} the corresponding DataTypes
 */
methods.convertSchemaItemsIntoTypes = (items) => {
  if (methods.isArray(items)) {
    return methods.convertSchemaItemsArrayIntoTypes(items)
  }

  return methods.convertSchemaItemsObjectIntoTypes(items)
}

/**
 * converts a schema allOf property into an array of DataTypes
 * @param {Array<Object>} allOf: the allOf property of the schema
 * @returns {Array<string>} the corresponding DataTypes
 */
methods.convertSchemaAllOfIntoTypes = (allOf) => {
  return allOf
    .map(methods.getTypes)
    .reduce(flatten, [])
}

/**
 * converts a schema anyOf property into an Array of DataTypes
 * @param {Array<Object>} anyOf: the anyOf property of the schema
 * @returns {Array<string>} the corresponding DataTypes
 */
methods.convertSchemaAnyOfIntoTypes = (anyOf) => {
  const anyOfType = anyOf
    .map(methods.getTypes)
    .reduce(flatten, [])
    .join(' | ')
  return [ anyOfType ]
}

methods.getTypes = (schema) => {
  const baseType = methods.getType(schema)

  if (schema.$ref) {
    return [ schema.$ref.split('/')[2] ]
  }

  let types = [ baseType ]
  if (schema.items) {
    types = methods.convertSchemaItemsIntoTypes(schema.items)
  }

  if (schema.allOf) {
    types = methods.convertSchemaAllOfIntoTypes(schema.allOf)
  }
  else if (schema.anyOf) {
    types = methods.convertSchemaAnyOfIntoTypes(schema.anyOf)
  }

  return types
}

methods.applyCommonProps = (dataType, schema) => {
  const commonProps = [
    'minProperties',
    'maxProperties',
    'discriminator',
    'discriminatorValue',
    'additionalProperties',
    'uniqueItems',
    'minItems',
    'maxItems',
    'pattern',
    'minLength',
    'maxLength',
    'maximum',
    'minimum',
    'multipleOf',
    'enum',
    'description'
  ]

  const keys = Object.keys(schema)
  return keys
    .filter(key => commonProps.indexOf(key) >= 0)
    .map(key => ({ key, value: schema[key] }))
    .reduce(($data, { key, value }) => {
      $data[key] = value
      return $data
    }, dataType)
}

methods.addItemsProp = (dataType, schema) => {
  if (!schema.items || dataType.type.indexOf('array') < 0) {
    return dataType
  }

  const types = methods.getTypes(schema.items)
  if (types.length) {
    dataType.items = types[0]
  }
  else {
    dataType.items = types
  }

  return dataType
}

methods.addPropertiesProp = (dataType, schema) => {
  if (!schema.properties) {
    return dataType
  }

  const props = Object.keys(schema.properties)

  if (!props.length) {
    return dataType
  }

  dataType.properties = props
    .map((prop) => {
      return { key: prop, value: methods.convertSchemaToDataType(schema.properties[prop]) }
    })
    .reduce(($data, { key, value }) => {
      if ((schema.required || []).indexOf(key) < 0) {
        value.required = false
      }

      $data[key] = value
      return $data
    }, {})

  return dataType
}

methods.convertSchemaToDataType = (schema) => {
  let dataType = {}

  const types = methods.getTypes(schema)
  if (types.length === 1) {
    dataType.type = types[0]
  }
  else {
    dataType.type = types
  }

  dataType = methods.applyCommonProps(dataType, schema)

  dataType = methods.addItemsProp(dataType, schema)
  dataType = methods.addPropertiesProp(dataType, schema)
  // dataType = methods.addRequiredProp(dataType, schema)

  return dataType
}

methods.dumpJSONIntoDataType = (_schema, deps, coreInfoMap) => {
  const schema = Object.assign({}, _schema)

  if (deps.length) {
    schema.definitions = deps
      .map(dep => {
        const { schema: depSchema = {} } = coreInfoMap.get(dep) || { schema: {} }
        return ({ key: dep, value: depSchema })
      })
      .reduce(($defs, { key, value }) => {
        $defs[key] = value
        return $defs
      }, {})
  }

  try {
    return JSON.stringify(schema, null, 2)
  }
  catch (e) {
    return schema
  }
}

methods.getAllDependencies = (coreInfoMap, depsMap, name, $deps) => {
  const deps = $deps || (coreInfoMap.get(name) || {}).deps
  depsMap[name] = true

  if (!deps || !deps.length) {
    return depsMap
  }

  return deps
    .map(dep => dep.split('/')[2])
    .filter(dep => !depsMap[dep])
    .reduce((d, n) => methods.getAllDependencies(coreInfoMap, d, n), depsMap)
}

/*
 * Second Strategy (more advanced):
 * tries to find all the schemas that can't be converted or depend on a schema that can't
 */
methods.markSchema = (schemaMap, name) => {
  schemaMap.get(name).marked = true
  return schemaMap
}

methods.unmarkSchemas = (schemaMap) => {
  schemaMap.forEach((v) => {
    delete v.marked
  })

  return schemaMap
}

methods.areSchemaAndDepsConvertible = (coreInfoMap, name, optionalCoreInfo) => {
  const { convertible, deps = [] } = optionalCoreInfo ?
    optionalCoreInfo :
    (coreInfoMap.get(name) || {})

  if (!convertible) {
    return false
  }

  return deps
    .map(dep => dep.split('/')[2])
    .map(depName => {
      if (typeof coreInfoMap.get(depName) === 'undefined') {
        return true
      }

      if (coreInfoMap.get(depName).marked) {
        return coreInfoMap.get(depName).convertible
      }

      const updatedCoreInfoMap = methods.markSchema(coreInfoMap, depName)
      return methods.areSchemaAndDepsConvertible(updatedCoreInfoMap, depName)
    })
    .reduce((acc, bool) => acc && bool, true)
}

methods.extractCoreInformationFromSchema = (schema) => {
  const deps = methods.getRefsFromSchema(schema)
  const convertible = methods.isConvertible(schema)

  return { deps, convertible }
}

methods.extractCoreInformationFromConstraint = (constraint, name) => {
  const schema = constraint.toJSONSchema()
  const { deps, convertible } = methods.extractCoreInformationFromSchema(schema)

  return { constraint, schema, deps, convertible, name }
}

methods.extractDataTypeFromCoreInformation = (
  { schema, name, deps, convertible }, key, coreInfoMap
) => {
  const isConvertible = methods.areSchemaAndDepsConvertible(
    coreInfoMap, name, { deps, convertible }
  )
  const updatedCoreInfoMap = methods.unmarkSchemas(coreInfoMap)

  let dataType
  if (isConvertible) {
    dataType = methods.convertSchemaToDataType(schema)
  }
  else {
    const depsMap = methods.getAllDependencies(updatedCoreInfoMap, {}, name, deps)
    delete depsMap[name]
    const $deps = Object.keys(depsMap)
    dataType = methods.dumpJSONIntoDataType(schema, $deps, coreInfoMap)
  }

  return {
    key: name,
    value: dataType
  }
}

methods.extractCoreInformationMapFromApi = (api) => {
  const constraints = api.getIn([ 'store', 'constraint' ])

  const coreInfoMap = constraints
    .map(methods.extractCoreInformationFromConstraint)

  return coreInfoMap
}

methods.extractDataTypesFromApi = (coreInfoMap) => {
  const types = coreInfoMap
    .map(methods.extractDataTypeFromCoreInformation)
    .reduce(convertEntryListInMap, {})

  return { key: 'types', value: types }
}

methods.extractTitleFromApi = (api) => {
  const title = api.getIn([ 'info', 'title' ]) || null

  if (!title) {
    return null
  }

  return { key: 'title', value: title }
}

methods.extractDescriptionFromApi = (api) => {
  const description = api.getIn([ 'info', 'description' ]) || null

  if (!description) {
    return null
  }

  return { key: 'description', value: description }
}

methods.extractVersionFromApi = (api) => {
  const version = api.getIn([ 'info', 'version' ]) || null

  if (!version) {
    return null
  }

  return { key: 'version', value: version }
}

methods.extractBaseUriFromApi = (api) => {
  const endpoint = api.getIn([ 'store', 'endpoint' ]).valueSeq().get(0)

  if (!endpoint) {
    return null
  }

  const url = endpoint.generate(List([ '{', '}' ]))

  if (!url) {
    return null
  }

  return { key: 'baseUri', value: url }
}

methods.extractParametersFromURLComponent = (urlComponent) => {
  if (!urlComponent) {
    return null
  }

  const param = urlComponent.get('parameter')
  if (!param || param.get('superType') !== 'sequence') {
    return null
  }

  const sequence = param.get('value')
  if (!sequence) {
    return null
  }

  const params = sequence.filter($param => $param.get('key'))
  return params
}

methods.convertJSONSchemaIntoNamedParameter = (coreInfoMap, name, schema) => {
  const { deps, convertible } = methods.extractCoreInformationFromSchema(schema)
  return methods.extractDataTypeFromCoreInformation(
    { deps, convertible, schema, name }, null, coreInfoMap
  )
}

methods.convertParameterIntoNamedParameter = (coreInfoMap, param) => {
  if (!param) {
    return null
  }

  const key = param.get('key')
  const schema = param.getJSONSchema(false, false)

  const namedParameter = methods.convertJSONSchemaIntoNamedParameter(coreInfoMap, key, schema)
  return namedParameter
}

methods.extractBaseUriParametersFromApi = (coreInfoMap, api) => {
  const endpoint = api.getIn([ 'store', 'endpoint' ]).valueSeq().get(0)

  if (!endpoint) {
    return null
  }

  const urlComponentNames = [ 'hostname', 'port', 'pathname' ]
  const params = urlComponentNames
    .map(name => methods.extractParametersFromURLComponent(endpoint.get(name)))
    .filter(v => !!v)
    .reduce(flatten, [])
    .map((param) => methods.convertParameterIntoNamedParameter(coreInfoMap, param))
    .filter(({ key }) => key.toLowerCase() !== 'version')

  if (!params.length) {
    return null
  }

  const paramMap = params.reduce(convertEntryListInMap, {})

  return { key: 'baseUriParameters', value: paramMap }
}

methods.extractProtocolsFromApi = (api) => {
  const endpoint = api.getIn([ 'store', 'endpoint' ]).valueSeq().get(0)

  if (!endpoint) {
    return null
  }

  const protocols = endpoint.get('protocol')
  if (!protocols || !protocols.size) {
    return null
  }

  const validProtocols = protocols
    .filter(protocol => protocol.match(/https?:?/i))
    .map(protocol => protocol.match(/(https?)/i)[1].toUpperCase())
    .toJS()

  if (!validProtocols || !validProtocols.length) {
    return null
  }

  return { key: 'protocols', value: validProtocols }
}

methods.extractMediaTypeUUIDfromApi = (api) => {
  const params = api.getIn([ 'store', 'parameter' ])
  const contentTypeParams = params
    .filter(param => param.get('key') === 'Content-Type' && param.get('usedIn') === 'request')

  if (contentTypeParams.size !== 1) {
    return null
  }

  const uuid = contentTypeParams.map((_, key) => key).valueSeq().get(0)
  return uuid
}

methods.extractMediaTypeFromApi = (api) => {
  const params = api.getIn([ 'store', 'parameter' ])
  const contentTypeParams = params
    .filter(param => param.get('key') === 'Content-Type' && param.get('usedIn') === 'request')

  if (contentTypeParams.size !== 1) {
    return null
  }

  const contentTypeParam = contentTypeParams.valueSeq().get(0)
  const defaultValue = contentTypeParam.get('default')
  if (defaultValue) {
    return { key: 'mediaType', value: defaultValue }
  }

  const enumValue = contentTypeParam.getJSONSchema().enum
  if (enumValue) {
    return { key: 'mediaType', value: [].concat(enumValue) }
  }

  return null
}

methods.extractMethodBaseFromRequest = (mediaTypeUUID, coreInfoMap, request) => {
  const kvs = [
    methods.extractDisplayNameFromRequest(request),
    methods.extractDescriptionFromRequest(request),
    methods.extractQueryParametersFromRequest(coreInfoMap, request),
    methods.extractHeadersFromRequest(coreInfoMap, request),
    methods.extractBodyFromRequest(coreInfoMap, request),
    methods.extractProtocolsFromRequest(request),
    methods.extractIsFromRequest(mediaTypeUUID, request),
    methods.extractSecuredByFromRequest(request),
    methods.extractResponsesFromRequest(coreInfoMap, request)
  ].filter(v => !!v)

  if (!kvs.length) {
    return null
  }

  return kvs.reduce(convertEntryListInMap, {})
}

methods.extractTraitsFromInterfaces = (mediaTypeUUID, coreInfoMap, api) => {
  const itfs = api.getIn([ 'store', 'interface' ])
    .filter(itf => itf.get('level') === 'request' && itf.get('underlay'))

  const traits = itfs
    .map(itf => ({
      key: itf.get('uuid'),
      value: methods.extractMethodBaseFromRequest(mediaTypeUUID, coreInfoMap, itf.get('underlay'))
    }))
    .filter(({ value }) => !!value)

  return traits.valueSeq().toJS()
}

methods.extractMethodBaseFromParameter = (coreInfoMap, parameter) => {
  const location = parameter.get('in')
  const locationMap = {
    headers: 'headers',
    queries: 'queryParameters'
  }

  const kv = methods.convertParameterIntoNamedParameter(coreInfoMap, parameter)

  if (!kv) {
    return null
  }

  if (locationMap[location]) {
    return { [locationMap[location]]: { [kv.key]: kv.value } }
  }

  if (location === 'body') {
    if (kv.key) {
      return { key: 'body', value: { [kv.key]: kv.value } }
    }

    return { key: 'body', value: kv.value }
  }

  return null
}

methods.extractTraitsFromParameters = (mediaTypeUUID, coreInfoMap, api) => {
  const params = api.getIn([ 'store', 'parameter' ])
  const traits = params
    .filter((_, key) => key !== mediaTypeUUID)
    .map((param, key) => ({
      key,
      value: methods.extractMethodBaseFromParameter(coreInfoMap, param)
    }))
    .filter(({ key, value }) => !!key && !!value)

  return traits.valueSeq().toJS()
}

methods.extractTraitsFromApi = (mediaTypeUUID, coreInfoMap, api) => {
  const itfsTraits = methods.extractTraitsFromInterfaces(mediaTypeUUID, coreInfoMap, api) || []
  const paramTraits = methods.extractTraitsFromParameters(mediaTypeUUID, coreInfoMap, api) || []

  if (!itfsTraits.length && !paramTraits.length) {
    return null
  }

  const traits = [].concat(itfsTraits || [], paramTraits || [])

  const traitMap = traits.reduce(convertEntryListInMap, {})

  return { key: 'traits', value: traitMap }
}

// TODO implement this (args: api)
methods.extractResourceTypesFromApi = (mediaTypeUUID, coreInfoMap, api) => {
  const resourceTypeItfs = api.getIn([ 'store', 'interface' ])
    .filter(itf => itf.get('level') === 'resource')

  if (!resourceTypeItfs.size) {
    return null
  }

  const resourceTypes = resourceTypeItfs
    .map(itf => {
      if (!itf.get('underlay')) {
        /* eslint-disable no-undefined */
        return {
          key: itf.get('uuid'),
          value: undefined
        }
        /* eslint-enable no-undefined */
      }

      return {
        key: itf.get('uuid'),
        value: methods.extractResourceFromResourceRecord(
          mediaTypeUUID, coreInfoMap, itf.get('underlay')
        )
      }
    })
    .reduce(convertEntryListInMap, {})

  return { key: 'resourceTypes', value: resourceTypes }
}

methods.extractSecuritySchemeFromBasicAuth = (auth) => {
  const securityScheme = {
    type: 'Basic Authentication'
  }

  const description = auth.get('description')
  if (description) {
    securityScheme.description = description
  }

  return { key: auth.get('authName'), value: securityScheme }
}

methods.extractSecuritySchemeFromDigestAuth = (auth) => {
  const securityScheme = {
    type: 'Digest Authentication'
  }

  const description = auth.get('description')
  if (description) {
    securityScheme.description = description
  }

  return { key: auth.get('authName'), value: securityScheme }
}

methods.extractDescribedByForApiKeyAuth = (auth) => {
  if (auth.get('in') === 'header') {
    return {
      headers: {
        [auth.get('name')]: { type: 'string' }
      }
    }
  }

  if (auth.get('in') === 'query') {
    return {
      queryParameters: {
        [auth.get('name')]: { type: 'string' }
      }
    }
  }

  return null
}

methods.extractSecuritySchemeFromApiKeyAuth = (auth) => {
  const securityScheme = {
    type: 'Pass Through'
  }

  const description = auth.get('description')
  if (description) {
    securityScheme.description = description
  }

  const describedBy = methods.extractDescribedByForApiKeyAuth(auth)
  if (describedBy) {
    securityScheme.describedBy = describedBy
  }

  return { key: auth.get('authName'), value: securityScheme }
}

// TODO signature
methods.extractSecuritySchemeFromOAuth1Auth = (auth) => {
  const securityScheme = {
    type: 'OAuth 1.0'
  }

  const description = auth.get('description')
  if (description) {
    securityScheme.description = description
  }

  securityScheme.settings = {
    requestTokenUri: auth.get('requestTokenUri') || null,
    authorizationUri: auth.get('authorizationUri') || null,
    tokenCredentialsUri: auth.get('tokenCredentialsUri') || null
  }

  if (
    auth.get('signature') &&
    [ 'HMAC-SHA1', 'RSA-SHA1', 'PLAINTEXT' ].indexOf(auth.get('signature').toUpperCase()) >= 0
  ) {
    securityScheme.settings.signatures = [ auth.get('signature').toUpperCase() ]
  }

  return { key: auth.get('authName'), value: securityScheme }
}

// TODO scopes
methods.extractSecuritySchemeFromOAuth2Auth = (auth) => {
  const securityScheme = {
    type: 'OAuth 2.0'
  }

  const description = auth.get('description')
  if (description) {
    securityScheme.description = description
  }

  const grantMap = {
    accessCode: 'authorization_code',
    implicit: 'implicit',
    application: 'client_credentials',
    password: 'password'
  }

  securityScheme.settings = {
    authorizationUri: auth.get('authorizationUrl') || null,
    accessTokenUri: auth.get('tokenUrl') || null,
    authorizationGrants: grantMap[auth.get('flow')] ? [ grantMap[auth.get('flow')] ] : []
  }

  if (auth.get('scopes') && auth.get('scopes').size) {
    securityScheme.settings.scopes = auth.get('scopes').map(({ key }) => key).toJS()
  }

  return { key: auth.get('authName'), value: securityScheme }
}

methods.extractSecuritySchemeFromHawkAuth = (auth) => {
  const securityScheme = {
    type: 'x-hawk'
  }

  const description = auth.get('description')
  if (description) {
    securityScheme.description = description
  }

  securityScheme.settings = {
    id: auth.get('id') || null,
    algorithm: auth.get('algorithm') || null
  }

  return { key: auth.get('authName'), value: securityScheme }
}

methods.extractSecuritySchemeFromAWSSig4Auth = (auth) => {
  const securityScheme = {
    type: 'x-aws-sig4'
  }

  const description = auth.get('description')
  if (description) {
    securityScheme.description = description
  }

  securityScheme.settings = {
    region: auth.get('region') || null,
    service: auth.get('service') || null
  }

  return { key: auth.get('authName'), value: securityScheme }
}

methods.extractSecuritySchemeFromAuth = (auth) => {
  if (auth instanceof Auth.Basic) {
    return methods.extractSecuritySchemeFromBasicAuth(auth)
  }

  if (auth instanceof Auth.Digest) {
    return methods.extractSecuritySchemeFromDigestAuth(auth)
  }

  if (auth instanceof Auth.ApiKey) {
    return methods.extractSecuritySchemeFromApiKeyAuth(auth)
  }

  if (auth instanceof Auth.OAuth1) {
    return methods.extractSecuritySchemeFromOAuth1Auth(auth)
  }

  if (auth instanceof Auth.OAuth2) {
    return methods.extractSecuritySchemeFromOAuth2Auth(auth)
  }

  if (auth instanceof Auth.Hawk) {
    return methods.extractSecuritySchemeFromHawkAuth(auth)
  }

  if (auth instanceof Auth.AWSSig4) {
    return methods.extractSecuritySchemeFromAWSSig4Auth(auth)
  }

  return null
}

methods.extractSecuritySchemesFromApi = (api) => {
  const auths = api.getIn([ 'store', 'auth' ])

  const securitySchemes = auths
    .map(methods.extractSecuritySchemeFromAuth)
    .filter(v => !!v)

  if (!securitySchemes.size) {
    return null
  }

  const securitySchemeMap = securitySchemes.reduce(convertEntryListInMap, {})

  return { key: 'securitySchemes', value: securitySchemeMap }
}

// TODO implement this (args: api)
methods.extractSecuredByFromApi = () => null

methods.extractDisplayNameFromRequest = (request) => {
  const displayName = request.get('name') || null

  if (!displayName) {
    return null
  }

  return { key: 'displayName', value: displayName }
}

methods.extractDescriptionFromRequest = (request) => {
  const description = request.get('description') || null

  if (!description) {
    return null
  }

  return { key: 'description', value: description }
}

methods.extractQueryParametersFromRequest = (coreInfoMap, request) => {
  const params = request.getIn([ 'parameters', 'queries' ])
    .filter(param => !(param instanceof Reference))
    .map((param) => {
      return methods.convertParameterIntoNamedParameter(coreInfoMap, param)
    })
    .valueSeq()

  if (!params.size) {
    return null
  }

  const queryParameters = params.reduce(convertEntryListInMap, {})

  return { key: 'queryParameters', value: queryParameters }
}

methods.extractHeadersFromRequest = (coreInfoMap, request) => {
  const params = request.getIn([ 'parameters', 'headers' ])
    .filter(param => !(param instanceof Reference))
    .map((param) => {
      return methods.convertParameterIntoNamedParameter(coreInfoMap, param)
    })
    .valueSeq()

  if (!params.size) {
    return null
  }

  const headers = params.reduce(convertEntryListInMap, {})

  return { key: 'headers', value: headers }
}

methods.isBodyContext = (context) => {
  return context.get('constraints')
    .filter(param => {
      return param.get('key') === 'Content-Type' &&
        param.get('usedIn') === 'request' &&
        param.get('in') === 'headers'
    })
    .size === 1
}

methods.getBodyContextsFromRequest = (request) => {
  const bodyContexts = request.get('contexts').filter(methods.isBodyContext)
  if (bodyContexts.size === 0) {
    return null
  }

  return bodyContexts
}

methods.extractSingleParameterFromRequestWithNoContext = (coreInfoMap, bodyParams) => {
  const value = methods.convertParameterIntoNamedParameter(
    coreInfoMap, bodyParams.valueSeq().get(0)
  ).value

  return { key: 'body', value }
}

methods.extractMultipleParametersFromRequestWithNoContext = (coreInfoMap, bodyParams) => {
  const propsEntries = bodyParams.map(
    (param) => methods.convertParameterIntoNamedParameter(coreInfoMap, param)
  )

  if (!propsEntries.size) {
    return null
  }

  const properties = propsEntries.reduce(convertEntryListInMap, {})
  const value = { properties }

  return { key: 'body', value }
}

methods.extractBodyParamsFromRequestWithNoContext = (coreInfoMap, paramContainer) => {
  const bodyParams = paramContainer.get('body')

  if (!bodyParams.size) {
    return null
  }

  if (bodyParams.size === 1) {
    return methods.extractSingleParameterFromRequestWithNoContext(coreInfoMap, bodyParams)
  }

  return methods.extractMultipleParametersFromRequestWithNoContext(coreInfoMap, bodyParams)
}

methods.getContentTypeFromContext = (context) => {
  return context.get('constraints')
    .filter(param => {
      return param.get('key') === 'Content-Type' &&
        param.get('usedIn') === 'request' &&
        param.get('in') === 'headers'
    })
    .map(param => param.get('default'))
    .valueSeq().get(0) || null
}

methods.extractBodyParamsFromRequestForContext = (coreInfoMap, paramContainer, context) => {
  const contentType = methods.getContentTypeFromContext(context) || '*/*'

  const bodyParams = paramContainer
    .filter(context.get('constraints'))
    .get('body')
    .map(param => {
      return methods.convertParameterIntoNamedParameter(coreInfoMap, param)
    })
    .valueSeq()

  if (!bodyParams.size) {
    return null
  }

  if (bodyParams.size === 1 && bodyParams.get(0).key === null) {
    return { key: contentType, value: bodyParams.get(0).value }
  }

  return { key: contentType, value: bodyParams.reduce(convertEntryListInMap, {}) }
}

methods.extractBodyParamsFromRequestWithContexts = (coreInfoMap, contexts, paramContainer) => {
  const bodies = contexts.map(context => {
    return methods.extractBodyParamsFromRequestForContext(coreInfoMap, paramContainer, context)
  })
  .filter(v => !!v)

  if (!bodies.size) {
    return null
  }

  if (bodies.size === 1 && bodies.get(0).key === null) {
    return { key: 'body', value: bodies.get(0).value }
  }

  return { key: 'body', value: bodies.reduce(convertEntryListInMap, {}) }
}

methods.extractBodyFromRequest = (coreInfoMap, request) => {
  const paramContainer = request.get('parameters')
  const bodyContexts = methods.getBodyContextsFromRequest(request)

  if (!bodyContexts) {
    return methods.extractBodyParamsFromRequestWithNoContext(coreInfoMap, paramContainer)
  }

  return methods.extractBodyParamsFromRequestWithContexts(coreInfoMap, bodyContexts, paramContainer)
}

// TODO fix that ugly code
methods.extractProtocolsFromRequest = (request) => {
  const protocols = request.get('endpoints')
    .map(endpoint => {
      if (endpoint instanceof Reference) {
        return endpoint.get('overlay')
      }

      return endpoint
    })
    .filter(v => !!v)
    .map(endpoint => {
      return endpoint.get('protocol')
    })
    .filter(v => {
      return !!v && v.filter(protocol => protocol.match(/https?:?/i)).size !== 0
    })
    .map(v => v
      .filter(protocol => protocol.match(/https?:?/i))
      .map(protocol => protocol.match(/(https?):?/i)[1].toUpperCase())
    )
    .valueSeq()
    .get(0)

  if (!protocols) {
    return null
  }

  return { key: 'protocols', value: protocols.toJS() }
}

methods.extractTraitsFromRequestParameters = (mediaTypeUUID, request) => {
  const paramContainer = request.get('parameters')

  const headerTraits = paramContainer.get('headers')
    .filter(param => param instanceof Reference && param.get('uuid') !== mediaTypeUUID)
    .map(param => param.get('uuid'))
    .valueSeq()
    .toJS()

  const queryParamTraits = paramContainer.get('queries')
    .filter(param => param instanceof Reference)
    .map(param => param.get('uuid'))
    .valueSeq()
    .toJS()

  const bodyTraits = paramContainer.get('body')
    .filter(param => param instanceof Reference)
    .map(param => param.get('uuid'))
    .valueSeq()
    .toJS()

  return [].concat(headerTraits, queryParamTraits, bodyTraits)
}

methods.extractIsFromRequest = (mediaTypeUUID, request) => {
  const traits = request
    .get('interfaces')
    .map(itf => itf.get('uuid'))
    .valueSeq()

  const paramTraits = methods.extractTraitsFromRequestParameters(mediaTypeUUID, request)

  if (!traits.size && !paramTraits.length) {
    return null
  }

  return { key: 'is', value: [].concat(traits.toJS(), paramTraits) }
}

// TODO deal with overlay
methods.extractSecuredByFromRequest = (request) => {
  const auths = request.get('auths')
    .filter(auth => auth instanceof Reference || auth === null)
    .map(authRef => {
      if (authRef === null) {
        return authRef
      }

      const authRefName = authRef.get('uuid')
      if (!authRef.get('overlay') || !(authRef.get('overlay') instanceof Auth.OAuth2)) {
        return authRefName
      }

      return {
        [authRefName]: {
          scopes: authRef.getIn([ 'overlay', 'scopes' ])
            .map(({ key }) => key)
            .toJS()
        }
      }
    })
    .valueSeq()

  if (!auths.size) {
    return null
  }

  return { key: 'securedBy', value: auths.toJS() }
}

methods.extractDescriptionFromResponse = (response) => {
  const description = response.get('description')

  if (!description) {
    return null
  }

  return { key: 'description', value: description }
}

methods.extractHeadersFromResponse = (coreInfoMap, response) => {
  return methods.extractHeadersFromRequest(coreInfoMap, response)
}

methods.extractBodyFromResponse = (coreInfoMap, response) => {
  return methods.extractBodyFromRequest(coreInfoMap, response)
}

methods.extractResponseFromResponseRecord = (coreInfoMap, response) => {
  const kvs = [
    methods.extractDescriptionFromResponse(response),
    methods.extractHeadersFromResponse(coreInfoMap, response),
    methods.extractBodyFromResponse(coreInfoMap, response)
  ].filter(v => !!v)

  return kvs.reduce(convertEntryListInMap, {})
}

methods.extractResponsesFromRequest = (coreInfoMap, request) => {
  const responses = request.get('responses')
    .map(response => {
      const key = response.get('code')
      const value = methods.extractResponseFromResponseRecord(coreInfoMap, response)

      if (!value) {
        return null
      }

      return { key, value }
    })
    .filter(v => !!v)

  if (!responses.size) {
    return null
  }

  return { key: 'responses', value: responses.reduce(convertEntryListInMap, {}) }
}

methods.extractMethodFromRequest = (mediaTypeUUID, coreInfoMap, request) => {
  const methodBase = methods.extractMethodBaseFromRequest(mediaTypeUUID, coreInfoMap, request)
  return methodBase
}

methods.extractMethodEntryFromRequest = (mediaTypeUUID, coreInfoMap, request) => {
  const key = request.get('method')
  const value = methods.extractMethodFromRequest(mediaTypeUUID, coreInfoMap, request)

  if (!value) {
    return null
  }

  return { key, value }
}

methods.extractMethodsFromResource = (mediaTypeUUID, coreInfoMap, resource) => {
  const requests = resource.get('methods')
    .map((request) => methods.extractMethodEntryFromRequest(mediaTypeUUID, coreInfoMap, request))
    .filter(v => !!v)

  if (!requests.size) {
    return []
  }

  return requests.valueSeq().toJS()
}

methods.extractDisplayNameFromResource = (resource) => {
  const key = 'name'
  const value = resource.get(key) || null

  if (!value) {
    return null
  }

  return { key: 'displayName', value }
}

methods.extractDescriptionFromResource = (resource) => {
  const key = 'description'
  const value = resource.get(key) || null

  if (!value) {
    return null
  }

  return { key, value }
}

methods.extractTypeFromResource = (resource) => {
  const type = resource.get('interfaces')
    .filter(itf => itf instanceof Reference)
    .map(itf => itf.get('uuid'))
    .valueSeq()
    .get(0)

  if (!type) {
    return null
  }

  return { key: 'type', value: type }
}

methods.extractUriParametersFromResource = (coreInfoMap, resource) => {
  const pathParam = resource.getIn([ 'path', 'pathname', 'parameter' ])

  if (!pathParam || pathParam.get('superType') !== 'sequence') {
    return null
  }

  const sequence = pathParam.get('value') || List()

  const uriParams = sequence
    .filter(param => !!param.get('key'))
    .map(param => methods.convertParameterIntoNamedParameter(coreInfoMap, param))
    .reduce(convertEntryListInMap, {})

  return { key: 'uriParameters', value: uriParams }
}

methods.extractResourceFromResourceRecord = (mediaTypeUUID, coreInfoMap, resource) => {
  const kvs = [
    methods.extractDisplayNameFromResource(resource),
    methods.extractDescriptionFromResource(resource),
    methods.extractTypeFromResource(resource),
    methods.extractUriParametersFromResource(coreInfoMap, resource),
    ...methods.extractMethodsFromResource(mediaTypeUUID, coreInfoMap, resource)
  ].filter(v => !!v)

  return kvs.reduce(convertEntryListInMap, {})
}

methods.nestResources = (mediaTypeUUID, coreInfoMap, resources) => {
  let nested = {}
  const subResources = {}
  for (const resource of resources) {
    if (!resource.key.length) {
      nested = methods.extractResourceFromResourceRecord(mediaTypeUUID, coreInfoMap, resource.value)
    }
    else {
      const relativeUri = '/' + (resource.key.shift() || '')
      subResources[relativeUri] = subResources[relativeUri] || []
      subResources[relativeUri].push(resource)
    }
  }

  const relativeUris = Object.keys(subResources)
  for (const relativeUri of relativeUris) {
    if (subResources.hasOwnProperty(relativeUri)) {
      nested[relativeUri] = methods.nestResources(
        mediaTypeUUID, coreInfoMap, subResources[relativeUri]
      )
    }
  }

  return nested
}

// TODO write extractResourceFromResourceRecord
methods.extractResourcesFromApi = (mediaTypeUUID, coreInfoMap, api) => {
  const resourceKVs = api.get('resources')
    .map(resource => {
      return {
        key: resource.get('path').get('pathname').generate(List([ '{', '}' ])).split('/').slice(1),
        value: resource
      }
    })
    .valueSeq()
    .toJS()

  const nested = methods.nestResources(mediaTypeUUID, coreInfoMap, resourceKVs)
  return entries(nested)
}

methods.createRAMLJSONModel = (api) => {
  const coreInfoMap = methods.extractCoreInformationMapFromApi(api)
  const mediaTypeUUID = methods.extractMediaTypeUUIDfromApi(api)

  const kvs = [
    methods.extractTitleFromApi(api),
    methods.extractDescriptionFromApi(api),
    methods.extractVersionFromApi(api),
    methods.extractBaseUriFromApi(api),
    methods.extractBaseUriParametersFromApi(coreInfoMap, api),
    methods.extractProtocolsFromApi(api),
    methods.extractMediaTypeFromApi(api),
    methods.extractDataTypesFromApi(coreInfoMap),
    methods.extractTraitsFromApi(mediaTypeUUID, coreInfoMap, api),
    methods.extractResourceTypesFromApi(mediaTypeUUID, coreInfoMap, api),
    methods.extractSecuritySchemesFromApi(api),
    methods.extractSecuredByFromApi(api),
    ...methods.extractResourcesFromApi(mediaTypeUUID, coreInfoMap, api)
  ].filter(v => !!v)

  return kvs.reduce(convertEntryListInMap, {})
}

methods.serialize = ({ api }) => {
  const model = methods.createRAMLJSONModel(api)
  const serialized = '#%RAML 1.0\n' + yaml.safeDump(JSON.parse(JSON.stringify(model)))
  return serialized
}

export const __internals__ = methods
export default RAMLSerializer
