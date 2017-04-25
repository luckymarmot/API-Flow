import { List, OrderedMap } from 'immutable'
import yaml from 'js-yaml'

import { currify, flatten, entries, convertEntryListInMap } from '../../../utils/fp-utils'
import Auth from '../../../models/Auth'
import Reference from '../../../models/Reference'
import URL from '../../../models/URL'

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

/**
 * A Serializer to convert Api Records into RAML v1.0.
 */
export class RAMLSerializer {
  static __meta__ = __meta__

  /**
   * serializes an Api into a RAML v1.0 formatted string
   * @param {Api} api: the api to convert
   * @returns {string} the corresponding postman collection, as a string
   */
  static serialize(api) {
    return methods.serialize(api)
  }

  /**
   * returns a quality score for a content string wrt. to the RAML v1.0 format.
   * @param {String} content: the content of the file to analyze
   * @returns {number} the quality of the content
   */
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

/* eslint-disable max-statements */
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
/* eslint-enable max-statements */

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

/**
 * extracts the types out of a schema
 * @param {JSONSchema} schema: the schema to get the types of
 * @returns {Array<string>} the corresponding types
 */
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

/**
 * applies simple common properties from the schema to the dataType, if they exists
 * @param {RamlDataType} dataType: the dataType to update with common properties
 * @param {JSONSchema} schema: the schema to get the common properties from
 * @returns {RamlDataType} the updated RAML dataType
 */
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

/**
 * adds the `items` properties to a RAML dataType if the schema has one.
 * @param {RamlDataType} dataType: the dataType to update
 * @param {JSONSchema} schema: the schema to extract the items properties from
 * @returns {RamlDataType} the updated RAML dataType
 */
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

/**
 * adds the `propertes` properties to a RAML dataType if the schema has one.
 * @param {RamlDataType} dataType: the dataType to update
 * @param {JSONSchema} schema: the schema to extract the `properties` properties from
 * @returns {RamlDataType} the updated RAML dataType
 */
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

/**
 * converts a schema into a RAML dataType
 * @param {JSONSchema} schema: the schema to convert
 * @returns {RamlDataType} the corresponding RAML dataType
 */
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

/**
 * dumps all dependencies of a schema in the `definitions` field of the schema, and stringifies it.
 * This is done for JSON Schemas that cannot be converted into dataTypes
 * @param {JSONSchema} _schema: the schema to dump as a string
 * @param {Array<string>} deps: an array representing the dependencies of the schema
 * @param {Map<string, { schema: JSONSchema }>} coreInfoMap: a Map containing all the schemas in the
 * Api.
 * @returns {string|JSONSchema} the corresponding string, except if the stringification failed, in
 * which case the object itself is dumped (this should not happen)
 */
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

/**
 * recursively extracts all dependencies from the coreInfoMap based on the name of a schema or an
 * array of dependencies. (follows sub-dependencies until no new found)
 * @param {Map<string, { deps: Array<string> }>} coreInfoMap: a Map containing all the dependencies
 * for each schema
 * @param {Object<string, boolean>} depsMap: an accumulator that saves already found dependencies
 * (helps avoiding dependency cycles)
 * @param {string?} name: the name of the schema to get the dependencies of
 * @param {Array<string>?} $deps: an array of dependencies to use as a starting point
 * @returns {Object<string, boolean>} the updated accumulator (depsMap)
 */
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
/**
 * marks a schema in a schema map, based on the name of the schema
 * @param {Map<string, { marked: boolean? }>} schemaMap: the map of schemas to update
 * @param {string} name: the name of the schema to mark
 * @returns {Map<string, { marked: boolean? }>} the updated schema map
 */
methods.markSchema = (schemaMap, name) => {
  schemaMap.get(name).marked = true
  return schemaMap
}

/**
 * unmarks all schemas in a schema map
 * @param {Object<string, { marked: boolean? }> } schemaMap: the map of schemas to update
 * @returns {Object<string, {marked: undefined }> } the updated schema map
 */
methods.unmarkSchemas = (schemaMap) => {
  schemaMap.forEach((v) => {
    delete v.marked
  })

  return schemaMap
}

/**
 * tests whether a schema and all its dependencies are convertible into dataTypes
 * @param {Map<string, { convertible: boolean, deps: Array<string>?} >} coreInfoMap: a map
 * containing informations about each schemas to convert.
 * @param {string?} name: the name of the schema to test
 * @param {{ convertible: boolean, deps: Array<string>? }?} optionalCoreInfo: an optional set of
 * information to use. If it is provided, it supersedes the data obtained from the name of the
 * schema.
 * @returns {boolean} whether the schema and all its dependencies are convertible
 */
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

/**
 * extract core information from a schema, e.g. its convertibility into dataType, and its
 * dependencies
 * @param {JSONSchema} schema: the schema to get the core information from
 * @returns {{ deps: Array<string>?, convertible: boolean }} the corresponding core information
 */
methods.extractCoreInformationFromSchema = (schema) => {
  const deps = methods.getRefsFromSchema(schema)
  const convertible = methods.isConvertible(schema)

  return { deps, convertible }
}

/**
 * extracts core information from a constraint. (e.g. itself, its corresponding schema, its
 * dependencies, its name and whether it is convertible into a dataType)
 * @param {Constraint} constraint: the constraint to extract the core information from
 * @param {string?} name: the name of the constraint, if it exists
 * @returns {{
 *   constraint: Constraint,
 *   schema: JSONSchema,
 *   deps: Array<string>?,
 *   convertible: boolean,
 *   name: string?
 * }} the corresponding core information about the constraint
 */
methods.extractCoreInformationFromConstraint = (constraint, name) => {
  const schema = constraint.toJSONSchema()
  const { deps, convertible } = methods.extractCoreInformationFromSchema(schema)

  return { constraint, schema, deps, convertible, name }
}

/**
 * converts a core information about a constraint into a dataType
 * @param {{
 *   schema: JSONSchema,
 *   deps: Array<string>?,
 *   convertible: boolean,
 *   name: string?
 * }} coreInfo: the core information about a constraint
 * @param {string} key: the key of the coreInfo in the coreInfoMap. This is only present because
 * we are using this method in tandem with the standard `map` method.
 * @param {Map<string, coreInfo>} coreInfoMap: the coreInfo map from which to extract the data to
 * create the dataType
 * @returns {Entry<string, RamlDataType>} the corresponding dataType, as an Entry
 */
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

/**
 * extracts core information for each shared constraint in an Api.
 * @param {Api} api: the api to get the core information about shared constraints from
 * @returns {Map<string, coreInfo>} the corresponding coreInfo map
 */
methods.extractCoreInformationMapFromApi = (api) => {
  const constraints = api.getIn([ 'store', 'constraint' ])

  const coreInfoMap = constraints
    .map(methods.extractCoreInformationFromConstraint)

  return coreInfoMap
}

/**
 * extracts dataTypes from a coreInfoMap that represents all the shared constraints of an Api
 * @param {Map<string, coreInfo>} coreInfoMap: the coreInfo map that holds all the necessary
 * information about each constraint to create dataTypes
 * @returns {Entry<string, Object<string, RamlDataType>>} the shared dataTypes, in Entry format
 */
methods.extractDataTypesFromApi = (coreInfoMap) => {
  const types = coreInfoMap
    .map(methods.extractDataTypeFromCoreInformation)
    .reduce(convertEntryListInMap, {})

  return { key: 'types', value: types }
}

/**
 * extract the title from an Api
 * @param {Api} api: the api from which to get the title
 * @returns {Entry<string, string>?} the corresponding title, if it exists, in Entry format
 */
methods.extractTitleFromApi = (api) => {
  const title = api.getIn([ 'info', 'title' ]) || null

  if (!title) {
    return null
  }

  return { key: 'title', value: title }
}

/**
 * extract the description from an Api
 * @param {Api} api: the api from which to get the description
 * @returns {Entry<string, string>?} the corresponding description, if it exists, in Entry format
 */
methods.extractDescriptionFromApi = (api) => {
  const description = api.getIn([ 'info', 'description' ]) || null

  if (!description) {
    return null
  }

  return { key: 'description', value: description }
}

/**
 * extract the version from an Api
 * @param {Api} api: the api from which to get the version
 * @returns {Entry<string, string>?} the corresponding version, if it exists, in Entry format
 */
methods.extractVersionFromApi = (api) => {
  const version = api.getIn([ 'info', 'version' ]) || null

  if (!version) {
    return null
  }

  return { key: 'version', value: version }
}

methods.getBaseUriEndpoint = (api) => {
  const endpoint = api.getIn([ 'store', 'endpoint' ]).valueSeq().get(0)

  if (endpoint) {
    return endpoint
  }

  const variable = api.getIn([ 'store', 'variable' ]).valueSeq().get(0)
  if (!variable) {
    return null
  }

  const firstValue = variable.get('values').valueSeq().get(0)
  if (!firstValue) {
    return null
  }

  return new URL({ url: firstValue })
}

/**
 * extract the baseUri from an Api
 * @param {Api} api: the api from which to get the baseUri
 * @returns {Entry<string, string>?} the corresponding baseUri, if it exists, in Entry format
 */
methods.extractBaseUriFromApi = (api) => {
  const endpoint = methods.getBaseUriEndpoint(api)
  if (!endpoint) {
    return null
  }

  const url = endpoint.generate(List([ '{', '}' ]))

  if (!url) {
    return null
  }

  return { key: 'baseUri', value: url }
}

/**
 * extract the parameters from a urlComponent
 * @param {URLComponent} urlComponent: the component from which to get the parameters
 * @returns {List<Parameter>?} the corresponding list of parameters, if applicable
 */
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

/**
 * converts a JSONSchema into a Named Parameter (aka: dataType)
 * @param {Map<string, coreInfo>} coreInfoMap: the map containing all information necessary to the
 * creation of DataTypes
 * @param {string} name: the name of the named parameter
 * @param {JSONSchema} schema: the schema to convert into a named parameter / dataType
 * @returns {Entry<string, RamlDataType>} the corresponding dataType, in Entry format
 */
methods.convertJSONSchemaIntoNamedParameter = (coreInfoMap, name, schema) => {
  const { deps, convertible } = methods.extractCoreInformationFromSchema(schema)
  return methods.extractDataTypeFromCoreInformation(
    { deps, convertible, schema, name }, null, coreInfoMap
  )
}

/**
 * converts a Parameter into a NamedParameter / dataType.
 * @param {Map<string, coreInfo>} coreInfoMap: the map containing all information necessary to the
 * creation of DataTypes
 * @param {Parameter} param: the parameter to convert
 * @returns {Entry<string, string>?} the corresponding dataType, if it exists, in Entry format
 */
methods.convertParameterIntoNamedParameter = (coreInfoMap, param) => {
  if (!param) {
    return null
  }

  const key = param.get('key')
  const schema = param.getJSONSchema(false, false)

  const namedParameter = methods.convertJSONSchemaIntoNamedParameter(coreInfoMap, key, schema)
  return namedParameter
}

/**
 * extracts the base uri parameters from an Api.
 * @param {Map<string, coreInfo>} coreInfoMap: the map containing all information necessary to the
 * creation of DataTypes
 * @param {Api} api: the api to get the base uri and its parameter from
 * @returns {Entry<string, Object<string, RamlDataType>>?} the corresponding dataType, if it exists,
 * in Entry format.
 */
methods.extractBaseUriParametersFromApi = (coreInfoMap, api) => {
  const endpoint = methods.getBaseUriEndpoint(api)
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

/**
 * extracts the protocols from an Api
 * @param {Api} api: the api from which to get the shared protocols
 * @returns {Entry<string, Array<string>>?} the corresponding dataType, if it exists, in Entry
 * format
 */
methods.extractProtocolsFromApi = (api) => {
  const endpoint = methods.getBaseUriEndpoint(api)
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

/**
 * extracts the shared media type uuid from an Api. This uuid is defined iff there is exactly
 * one shared Content-Type header for requests in the whole Api.
 * @param {Api} api: the api to extract the global media type uuid from
 * @returns {string?} the corresponding uuid, if it exists
 */
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

methods.extractMediaTypeFromContentTypeParameter = (contentTypeParam) => {
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

/**
 * extracts the shared media type from an Api. This media type is defined iff there is exactly
 * one shared Content-Type header for requests in the whole Api.
 * @param {Api} api: the api to extract the global media type from
 * @returns {Entry<string, string|Array<string>>?} the corresponding media type, if it exists, in
 * Entry format
 */
methods.extractMediaTypeFromApi = (api) => {
  const params = api.getIn([ 'store', 'parameter' ])
  const contentTypeParams = params
    .filter(param => param.get('key') === 'Content-Type' && param.get('usedIn') === 'request')

  if (contentTypeParams.size !== 1) {
    return null
  }

  const contentTypeParam = contentTypeParams.valueSeq().get(0)
  return methods.extractMediaTypeFromContentTypeParameter(contentTypeParam)
}

/**
 * extracts a RAMLMethodBase object from a request, with the help of a coreInfo map and of the
 * global mediaTypeUUID.
 * @param {string?} mediaTypeUUID: the uuid of the globalMediaType, if it exists
 * @param {Map<string, coreInfo>} coreInfoMap: a Map of coreInfo that holds all that is necessary
 * to convert a schema into a RamlDataType
 * @param {Request} request: the request to convert into a RAMLMethodBase
 * @returns {RAMLMethodBase?} the corresponding RAMLMethodBase, if it exists
 */
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

/**
 * extracts a Traits from an Api, with the help of a coreInfo map and of the global mediaTypeUUID.
 * @param {string?} mediaTypeUUID: the uuid of the globalMediaType, if it exists
 * @param {Map<string, coreInfo>} coreInfoMap: a Map of coreInfo that holds all that is necessary
 * to convert a schema into a RamlDataType
 * @param {Api} api: the api to get the shared request level interfaces to convert into RAMLTraits
 * @returns {Array<Entry<string, RAMLTrait>>} the corresponding array of Traits
 */
methods.extractTraitsFromInterfaces = (mediaTypeUUID, coreInfoMap, api) => {
  const itfs = api.getIn([ 'store', 'interface' ])
    .filter(itf => itf.get('level') === 'request')

  const traits = itfs
    .map(itf => {
      if (!itf.get('underlay')) {
        return {
          key: itf.get('uuid'),
          value: {}
        }
      }

      return {
        key: itf.get('uuid'),
        value: methods.extractMethodBaseFromRequest(mediaTypeUUID, coreInfoMap, itf.get('underlay'))
      }
    })
    .filter(({ value }) => !!value)

  return traits.valueSeq().toJS()
}

/* eslint-disable max-statements */
/**
 * extracts a RAMLMethodBase from a Parameter, with the help of a coreInfo map and of the global
 * mediaTypeUUID. This is done to represent shared Parameters (which do not have an exact match in
 * RAML)
 * @param {Map<string, coreInfo>} coreInfoMap: a Map of coreInfo that holds all that is necessary
 * to convert a schema into a RamlDataType
 * @param {Parameter} parameter: the parameter to convert into a RAMLMethodBase
 * @returns {RAMLMethodBase?} the corresponding RAMLMethodBase if it exists
 */
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
      return { body: { [kv.key]: kv.value } }
    }

    return { body: kv.value }
  }

  return null
}
/* eslint-disable max-statements */

/**
 * extracts Traits from shared Parameters, with the help of a coreInfo map and of the global
 * mediaTypeUUID.
 * @param {string?} mediaTypeUUID: the uuid of the global mediaType, if it exists
 * @param {Map<string, coreInfo>} coreInfoMap: a Map of coreInfo that holds all that is necessary
 * to convert a schema into a RamlDataType
 * @param {Api} api: the api from which to get the shared parameters
 * @returns {Array<Entry<string, RAMLMethodBase>>} the corresponding traits, as an array of Entries
 */
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

/**
 * extracts a MethodBase from a response
 * @param {Map<string, coreInfo>} coreInfoMap: a Map of coreInfo that holds all that is necessary to
 * convert a schema into a RamlDataType
 * @param {Response} response: the response to convert into a MethodBase
 * @returns {RAMLMethodBase} the corresponding RAMLMethodBase, if it exists
 */
methods.extractMethodBaseFromResponse = (coreInfoMap, response) => {
  const responseEntry = methods.extractResponsesFromRequest(coreInfoMap, OrderedMap({
    responses: OrderedMap({
      [response.get('code')]: response
    })
  }))

  if (!responseEntry) {
    return null
  }

  return { [responseEntry.key]: responseEntry.value }
}

/**
 * extract Traits from shared responses
 * @param {Map<string, coreInfo>} coreInfoMap: a Map of coreInfo that holds all that is necessary to
 * convert a schema into a RamlDataType
 * @param {Api} api: the api from which to get the shared responses
 * @returns {Array<RAMLMethodBase>} the corresponding array of traits
 */
methods.extractTraitsFromSharedResponses = (coreInfoMap, api) => {
  const responses = api.getIn([ 'store', 'response' ])
  const traits = responses
    .map((response, key) => ({
      key: 'response_' + key,
      value: methods.extractMethodBaseFromResponse(coreInfoMap, response)
    }))
    .filter(({ key, value }) => !!key && !!value)

  return traits.valueSeq().toJS()
}

/**
 * extracts all possible Traits from an Api, with the help of a coreInfo map and of the global
 * mediaTypeUUID. This is done to represent shared Parameters (which do not have an exact match in
 * RAML)
 * @param {string?} mediaTypeUUID: the uuid of the global mediaType, if it exists
 * @param {Map<string, coreInfo>} coreInfoMap: a Map of coreInfo that holds all that is necessary
 * to convert a schema into a RamlDataType
 * @param {Api} api: the api from which to get all possible Traits (from shared interfaces and
 * shared parameters)
 * @returns {Entry<string, Object<string, RAMLMethodBase>>?} the corresponding traits object,
 * if it exists, as an Entry
 */
methods.extractTraitsFromApi = (mediaTypeUUID, coreInfoMap, api) => {
  const itfsTraits = methods.extractTraitsFromInterfaces(mediaTypeUUID, coreInfoMap, api)
  const paramTraits = methods.extractTraitsFromParameters(mediaTypeUUID, coreInfoMap, api)
  const responseTraits = methods.extractTraitsFromSharedResponses(coreInfoMap, api)

  if (!itfsTraits.length && !paramTraits.length && !responseTraits.length) {
    return null
  }

  const traits = [].concat(itfsTraits, paramTraits, responseTraits)

  const traitMap = traits.reduce(convertEntryListInMap, {})

  return { key: 'traits', value: traitMap }
}

/**
 * extracts all ResourceTypes from an Api, with the help of a coreInfo map and of the global
 * mediaTypeUUID. This is done to represent shared Parameters (which do not have an exact match in
 * RAML)
 * @param {string?} mediaTypeUUID: the uuid of the global mediaType, if it exists
 * @param {Map<string, coreInfo>} coreInfoMap: a Map of coreInfo that holds all that is necessary
 * to convert a schema into a RamlDataType
 * @param {Api} api: the api from which to get all possible ResourceTypes.
 * @returns {Entry<string, Object<string, RAMLMethodBase>>?} the corresponding resourceTypes object,
 * if it exists, as an Entry
 */
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

/**
 * extracts a Basic Auth securityScheme from an Auth
 * @param {Auth} auth: the auth to convert into a securityScheme
 * @returns {RAMLSecurityScheme} the corresponding securityScheme
 */
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

/**
 * extracts a Digest Auth securityScheme from an Auth
 * @param {Auth} auth: the auth to convert into a securityScheme
 * @returns {RAMLSecurityScheme} the corresponding securityScheme
 */
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

/**
 * extracts a describedBy section for a PassThroughSecurityScheme from an Auth
 * @param {Auth} auth: the auth to convert into a securityScheme
 * @returns {RAMLDescribedByObject?} the corresponding describedBy object, if applicable
 */
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

/**
 * extracts an ApiKey Auth securityScheme from an Auth
 * @param {Auth} auth: the auth to convert into a securityScheme
 * @returns {RAMLSecurityScheme} the corresponding securityScheme
 */
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
/**
 * extracts an OAuth1 Auth securityScheme from an Auth
 * @param {Auth} auth: the auth to convert into a securityScheme
 * @returns {RAMLSecurityScheme} the corresponding securityScheme
 */
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
/**
 * extracts an OAuth2 Auth securityScheme from an Auth
 * @param {Auth} auth: the auth to convert into a securityScheme
 * @returns {RAMLSecurityScheme} the corresponding securityScheme
 */
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

/**
 * extracts an Hawk Auth securityScheme from an Auth
 * @param {Auth} auth: the auth to convert into a securityScheme
 * @returns {RAMLSecurityScheme} the corresponding securityScheme
 */
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

/**
 * extracts an AWSSig4Auth securityScheme from an Auth
 * @param {Auth} auth: the auth to convert into a securityScheme
 * @returns {RAMLSecurityScheme} the corresponding securityScheme
 */
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

/**
 * extracts a securityScheme from an Auth
 * @param {Auth} auth: the auth to convert into a securityScheme
 * @returns {RAMLSecurityScheme} the corresponding securityScheme
 */
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

/**
 * extracts securitySchemes from an Api
 * @param {Api} api: the api to get all the shared auths from
 * @returns {Entry<string, Object<string, RAMLSecurityScheme>>?} the corresponding securitySchemes,
 * if it exists, as an Entry
 */
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

/**
 * extracts the displayName from a Request
 * @param {Request} request: the request to get the displayName from
 * @returns {Entry<string, string>?} the corresponding displayName, if it exists, as an Entry
 */
methods.extractDisplayNameFromRequest = (request) => {
  const displayName = request.get('name') || null

  if (!displayName) {
    return null
  }

  return { key: 'displayName', value: displayName }
}

/**
 * extracts the description from a Request
 * @param {Request} request: the request to get the description from
 * @returns {Entry<string, string>?} the corresponding description, if it exists, as an Entry
 */
methods.extractDescriptionFromRequest = (request) => {
  const description = request.get('description') || null

  if (!description) {
    return null
  }

  return { key: 'description', value: description }
}

/**
 * extracts the queryParameters from a Request
 * @param {Map<string, coreInfo>} coreInfoMap: a map of coreInfo, that contains all that is
 * necessary to create DataTypes
 * @param {Request} request: the request to get the queryParameters from
 * @returns {Entry<string, Object<string, RamlDataType>>?} the corresponding queryParameters, if
 * they exist, as an Entry
 */
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

/**
 * extracts the headers from a Request
 * @param {Map<string, coreInfo>} coreInfoMap: a map of coreInfo, that contains all that is
 * necessary to create DataTypes
 * @param {Request} request: the request to get the headers from
 * @returns {Entry<string, Object<string, RamlDataType>>?} the corresponding headers, if they
 * exist, as an Entry
 */
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

/**
 * tests whether a Context is applicable to the body (i.e. has exactly one Content-Type constraint)
 * @param {Context} context: the context to test
 * @returns {boolean} true if it is applicable, false otherwise
 */
methods.isBodyContext = (context) => {
  return context.get('constraints')
    .filter(param => {
      return param.get('key') === 'Content-Type' &&
        param.get('usedIn') === 'request' &&
        param.get('in') === 'headers'
    })
    .size === 1
}

/**
 * extracts all contexts that are applicable to the body from a request
 * @param {Request} request: the request to get the body contexts from
 * @returns {List<Context>?} the corresponding list of contexts, if it exists
 */
methods.getBodyContextsFromRequest = (request) => {
  const bodyContexts = request.get('contexts').filter(methods.isBodyContext)
  if (bodyContexts.size === 0) {
    return null
  }

  return bodyContexts
}

/**
 * converts a single parameter body into a RAMLBody object (in the case where there are no contexts)
 * @param {Map<string, coreInfo>} coreInfoMap: a map of coreInfo containing all that is necessary
 * to create DataTypes
 * @param {Map<string, Parameter>} bodyParams: a map of body parameters to convert into a RAMLBody
 * object
 * @returns {Entry<string, RamlDataType>} the corresponding RAMLBody, as an Entry
 */
methods.extractSingleParameterFromRequestWithNoContext = (coreInfoMap, bodyParams) => {
  const value = methods.convertParameterIntoNamedParameter(
    coreInfoMap, bodyParams.valueSeq().get(0)
  ).value

  return { key: 'body', value }
}

/**
 * converts a multiple parameters body into a RAMLBody (in the case where there are no contexts)
 * @param {Map<string, coreInfo>} coreInfoMap: a map of coreInfo containing all that is necessary
 * to create DataTypes
 * @param {Map<string, Parameter>} bodyParams: a map of body parameters to convert into a RAMLBody
 * object
 * @returns {Entry<string, { properties: Object<string, RamlDataType> }>?} the corresponding
 * RAMLBody, if it exists, as an Entry
 */
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

/**
 * converts a ParameterContainer `body` block into a RAMLBody (in the case where there are no
 * contexts)
 * @param {Map<string, coreInfo>} coreInfoMap: a map of coreInfo containing all that is necessary
 * to create DataTypes
 * @param {ParameterContainer} paramContainer: the ParameterContainer from which to get the body
 * parameters to convert
 * @returns {Entry<string, RAMLBody>?} the corresponding RAMLBody, if it exists, as an Entry
 */
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

/**
 * extracts the Content-Type from a context
 * @param {Context} context: the context from which to extract the Content-Type
 * @returns {string?} the corresponding Content-Type, if it exists
 */
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

/**
 * extracts the RAMLBody object for a specific Content-Type from a Parameter Container
 * @param {Map<string, coreInfo>} coreInfoMap: a map of coreInfo containing all that is necessary
 * to create DataTypes
 * @param {ParameterContainer} paramContainer: the ParameterContainer from which to get the body
 * parameters to convert
 * @param {Context} context: the context from which to extract the Content-Type
 * @returns {Entry<string, RAMLBody>?} the corresponding RAMLBody, if it exists, as an Entry
 */
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

/**
 * extracts the RAMLBodies from a Request with (multiple) context(s)
 * @param {Map<string, coreInfo>} coreInfoMap: a map of coreInfo containing all that is necessary
 * to create DataTypes
 * @param {List<Context>} contexts: the contexts to use to generate the RAMLBodies
 * @param {ParameterContainer} paramContainer: the ParameterContainer from which to get the body
 * parameters to convert
 * @returns {Entry<string, RAMLBody | Object<string, RAMLBody>>?} the corresponding RAMLBody, if it
 * exists, as an Entry
 */
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

/**
 * extracts a RAMLBody from a request.
 * @param {Map<string, coreInfo>} coreInfoMap: a map of coreInfo containing all that is necessary
 * to create DataTypes
 * @param {Request} request: the request from which to extract the RAMLBody
 * @returns {Entry<string, RAMLBody>?} the corresponding RAMLBody if it exists, as an Entry
 */
methods.extractBodyFromRequest = (coreInfoMap, request) => {
  const paramContainer = request.get('parameters')
  const bodyContexts = methods.getBodyContextsFromRequest(request)

  if (!bodyContexts) {
    return methods.extractBodyParamsFromRequestWithNoContext(coreInfoMap, paramContainer)
  }

  return methods.extractBodyParamsFromRequestWithContexts(coreInfoMap, bodyContexts, paramContainer)
}

// TODO fix that ugly code
/**
 * extracts Protocols from a Request
 * @param {Request} request: the request to extract the protocols from
 * @returns {Entry<string, Array<string>>?} the extracted protocols, if they exist, as an Entry
 */
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

/**
 * extracts TraitRefs from Request parameters (ignoring the global mediaType reference)
 * @param {string?} mediaTypeUUID: the uuid of the globalMediaType. Used to filter out the
 * potential globalMediaType reference in the headers
 * @param {Request} request: the request from which to get the parameters. Only the References
 * matter for TraitRef extraction.
 * @returns {Array<string>} the corresponding array of TraitRef
 */
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

/**
 * extracts TraitRefs from the responses of a request
 * @param {Request} request: the request to extract the response trait references from
 * @returns {Seq<string>} the corresponding TraitRefs
 */
methods.extractTraitsFromResponses = (request) => {
  const responses = request.get('responses')
    .filter(response => response instanceof Reference)
    .map(reference => 'response_' + (reference.get('uuid') || '').split('/').slice(-1))
    .valueSeq()
    .toList()

  return responses
}

/**
 * extracts the RAML `is` field from a Request
 * @param {string?} mediaTypeUUID: the uuid of the globalMediaType. Used to filter out the unwanted
 * reference to the globalMediaType from the parameters of the request
 * @param {Request} request: the request from which to extract the `is` field
 * @returns {Entry<string, Array<string>>?} the corresponding `is` field, if it exists, as an Entry
 */
methods.extractIsFromRequest = (mediaTypeUUID, request) => {
  const traits = request
    .get('interfaces')
    .map(itf => itf.get('uuid'))
    .valueSeq()
    .toList()

  const paramTraits = methods.extractTraitsFromRequestParameters(mediaTypeUUID, request)
  const responseTraits = methods.extractTraitsFromResponses(request)

  if (!traits.size && !paramTraits.length && !responseTraits.size) {
    return null
  }

  return { key: 'is', value: [].concat(traits.toJS(), paramTraits, responseTraits.toJS()) }
}

// TODO deal with overlay
/**
 * extract securedBy from a Request
 * @param {Request} request: the request to extract the securedBy field from
 * @returns {Entry<string, Array<string|Object>>?} the corresponding securedBy field, if it exists,
 * as an Entry
 */
methods.extractSecuredByFromRequest = (request) => {
  const auths = request.get('auths')
    .filter(auth => auth instanceof Reference || auth === null)
    .map(authRef => {
      if (authRef === null) {
        return authRef
      }

      const authRefName = authRef.get('uuid')
      if (
        !authRef.get('overlay') ||
        !(authRef.get('overlay') instanceof Auth.OAuth2) ||
        !authRef.getIn([ 'overlay', 'scopes' ]).size
      ) {
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

/**
 * extracts the description from a Response
 * @param {Response} response: the response to get the description from
 * @returns {Entry<string, string>?} the corresponding description, if it exists, as an Entry
 */
methods.extractDescriptionFromResponse = (response) => {
  const description = response.get('description')

  if (!description) {
    return null
  }

  return { key: 'description', value: description }
}

/**
 * extracts the headers from a Response
 * @param {Map<string, coreInfo>} coreInfoMap: a map of coreInfo, that contains all that is
 * necessary to create DataTypes
 * @param {Request} response: the response to get the headers from
 * @returns {Entry<string, Object<string, RamlDataType>>?} the corresponding headers, if they
 * exist, as an Entry
 */
methods.extractHeadersFromResponse = (coreInfoMap, response) => {
  return methods.extractHeadersFromRequest(coreInfoMap, response)
}

/**
 * extracts a RAMLBody from a response.
 * @param {Map<string, coreInfo>} coreInfoMap: a map of coreInfo containing all that is necessary
 * to create DataTypes
 * @param {Request} response: the response from which to extract the RAMLBody
 * @returns {Entry<string, RAMLBody>?} the corresponding RAMLBody if it exists, as an Entry
 */
methods.extractBodyFromResponse = (coreInfoMap, response) => {
  return methods.extractBodyFromRequest(coreInfoMap, response)
}

/**
 * extracts a RAMLResponse from a Response.
 * @param {Map<string, coreInfo>} coreInfoMap: a map of coreInfo containing all that is necessary
 * to create DataTypes
 * @param {Response} response: the response to convert
 * @returns {RAMLResponse?} the corresponding RAMLResponse, if it exists
 */
methods.extractResponseFromResponseRecord = (coreInfoMap, response) => {
  const kvs = [
    methods.extractDescriptionFromResponse(response),
    methods.extractHeadersFromResponse(coreInfoMap, response),
    methods.extractBodyFromResponse(coreInfoMap, response)
  ].filter(v => !!v)

  if (!kvs.length) {
    return null
  }

  return kvs.reduce(convertEntryListInMap, {})
}

/**
 * extract RAMLResponses from a Request
 * @param {Map<string, coreInfo>} coreInfoMap: a map of coreInfo containing all that is necessary
 * to create DataTypes
 * @param {Request} request: the request to get the responses from
 * @returns {Entry<string, Object<string, RAMLResponse>>?} the corresponding responses, it they
 * exist, as an Entry
 */
methods.extractResponsesFromRequest = (coreInfoMap, request) => {
  const responses = request.get('responses')
    .filter(response => !(response instanceof Reference))
    .map(response => {
      const code = response.get('code')
      const key = parseInt(code, 10) ? code : '200'
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

/**
 * extracts a RAMLMethod from a Request
 * @param {string?} mediaTypeUUID: the uuid of the globalMediaType, if it exists
 * @param {Map<string, coreInfo>} coreInfoMap: a Map of coreInfo that holds all that is necessary
 * to convert a schema into a RamlDataType
 * @param {Request} request: the request to convert into a RAMLMethodBase
 * @returns {RAMLMethod?} the corresponding RAMLMethod, if it exists
 */
methods.extractMethodFromRequest = (mediaTypeUUID, coreInfoMap, request) => {
  const methodBase = methods.extractMethodBaseFromRequest(mediaTypeUUID, coreInfoMap, request)
  return methodBase
}

/**
 * extracts a RAMLMethod from a Request, in Entry format
 * @param {string?} mediaTypeUUID: the uuid of the globalMediaType, if it exists
 * @param {Map<string, coreInfo>} coreInfoMap: a Map of coreInfo that holds all that is necessary
 * to convert a schema into a RamlDataType
 * @param {Request} request: the request to convert into a RAMLMethodBase
 * @returns {Entry<string, RAMLMethod>?} the corresponding RAMLMethod, if it exists, as an Entry
 */
methods.extractMethodEntryFromRequest = (mediaTypeUUID, coreInfoMap, request) => {
  const key = request.get('method')
  const value = methods.extractMethodFromRequest(mediaTypeUUID, coreInfoMap, request)

  if (!value) {
    return null
  }

  return { key, value }
}

/**
 * extract RAMLMethods from a Resource
 * @param {string?} mediaTypeUUID: the uuid of the globalMediaType, if it exists
 * @param {Map<string, coreInfo>} coreInfoMap: a Map of coreInfo that holds all that is necessary
 * to convert a schema into a RamlDataType
 * @param {Resource} resource: the resource from which to get the methods to convert
 * @returns {Array<RAMLMethod>} the corresponding array of RAMLMethod
 */
methods.extractMethodsFromResource = (mediaTypeUUID, coreInfoMap, resource) => {
  const requests = resource.get('methods')
    .map((request) => methods.extractMethodEntryFromRequest(mediaTypeUUID, coreInfoMap, request))
    .filter(v => !!v)

  if (!requests.size) {
    return []
  }

  return requests.valueSeq().toJS()
}

/**
 * extracts the displayName from a Resource
 * @param {Resource} resource: the resource to get the displayName from
 * @returns {Entry<string, string>?} the corresponding displayName, if it exists, as an Entry
 */
methods.extractDisplayNameFromResource = (resource) => {
  const key = 'name'
  const value = resource.get(key) || null

  if (!value) {
    return null
  }

  return { key: 'displayName', value }
}

/**
 * extracts the description from a Resource
 * @param {Resource} resource: the resource to get the description from
 * @returns {Entry<string, string>?} the corresponding description, if it exists, as an Entry
 */
methods.extractDescriptionFromResource = (resource) => {
  const key = 'description'
  const value = resource.get(key) || null

  if (!value) {
    return null
  }

  return { key, value }
}

/**
 * extracts the resourceTypeRef from a Resource
 * @param {Resource} resource: the resource to get the resourceTypeRef from
 * @returns {Entry<string, string>?} the corresponding resourceTypeRef, if it exists, as an Entry
 */
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

/**
 * extracts the uriParameters from a Resource
 * @param {Map<string, coreInfo>} coreInfoMap: a Map of coreInfo that holds all that is necessary
 * to convert a schema into a RamlDataType
 * @param {Resource} resource: the resource to get the uriParameters from
 * @returns {Entry<string, Object<string, RamlDataType>>?} the corresponding uriParameters, if they
 * exist, as an Entry
 */
methods.extractUriParametersFromResource = (coreInfoMap, resource) => {
  const pathParam = resource.getIn([ 'path', 'pathname', 'parameter' ])

  if (!pathParam || pathParam.get('superType') !== 'sequence') {
    return null
  }

  const sequence = pathParam.get('value')

  const uriParams = sequence
    .filter(param => !!param.get('key'))
    .map(param => methods.convertParameterIntoNamedParameter(coreInfoMap, param))
    .reduce(convertEntryListInMap, {})

  return { key: 'uriParameters', value: uriParams }
}

/**
 * extracts a RAMLResource from a Resource
 * @param {string?} mediaTypeUUID: the uuid of the globalMediaType, if it exists
 * @param {Map<string, coreInfo>} coreInfoMap: a Map of coreInfo that holds all that is necessary
 * to convert a schema into a RamlDataType
 * @param {Resource} resource: the resource to convert
 * @returns {RAMLResource} the corresponding RAMLResource
 */
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

/**
 * nests resources entries according to their key (which should be the evaluated path of the
 * resource)
 * @param {string?} mediaTypeUUID: the uuid of the globalMediaType, if it exists
 * @param {Map<string, coreInfo>} coreInfoMap: a Map of coreInfo that holds all that is necessary
 * to convert a schema into a RamlDataType
 * @param {Array<Entry<string, Resource>>} resources: the array of resource entries, where the keys
 * are the paths of the resources
 * @returns {RAMLResource} the corresponding nested resources
 */
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
    nested[relativeUri] = methods.nestResources(
      mediaTypeUUID, coreInfoMap, subResources[relativeUri]
    )
  }

  return nested
}

/**
 * extracts RAMLResources from an Api
 * @param {string?} mediaTypeUUID: the uuid of the globalMediaType, if it exists
 * @param {Map<string, coreInfo>} coreInfoMap: a Map of coreInfo that holds all that is necessary
 * to convert a schema into a RamlDataType
 * @param {Api} api: the api to get the resources from
 * @returns {Array<Entry<string, RAMLResource>>} the corresponding RAMLResources, as entries
 */
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

/**
 * converts an Api into a RAMLModel
 * @param {Api} api: the api to convert
 * @returns {RAMLModel} the corresponding converted model
 */
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

/**
 * corrects responses codes not being integers in the ramlRaml string. This is due to RAML imposing
 * that response codes be integers, while it is impossible to have non-string keys in an object.
 * @param {string} rawRaml: the raml string to fix
 * @returns {string} the raml string, with integer codes, instead of string ones
 */
methods.fixResponseCodes = (rawRaml) => {
  return rawRaml.replace(/^(\s*)'([0-9]{3})':$/gm, '$1$2:')
}

/**
 * serializes an Api into a RAML document
 * @param {Object} args: the args passed to the serializer
 * @returns {string} the corresponding RAML document
 */
methods.serialize = ({ api }) => {
  const model = methods.createRAMLJSONModel(api)
  const raw = '#%RAML 1.0\n' + yaml.safeDump(JSON.parse(JSON.stringify(model)))
  const serialized = methods.fixResponseCodes(raw)
  return serialized
}

export const __internals__ = methods
export default RAMLSerializer
