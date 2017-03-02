import { List } from 'immutable'
import yaml from 'js-yaml'

import { flatten, entries, convertEntryListInMap } from '../../../utils/fp-utils'

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

methods.extractRefsFromObject = (schema, key) => {
  if (key === '$ref') {
    return [ schema[key] ]
  }

  return methods.getRefsFromSchema(schema[key])
}

methods.isArray = (schema) => Array.isArray(schema) || typeof schema[Symbol.iterator] === 'function'

methods.getRefsFromArray = (schema) => {
  return schema
    .map(methods.getRefsFromSchema)
    .reduce(methods.flattenReducer, [])
}

methods.getRefsFromObject = (schema) => {
  const keys = Object.keys(schema)
  return keys
    .map(methods.currify(methods.extractRefsFromObject, schema))
    .reduce(methods.flattenReducer, [])
}

methods.isNonObjectType = (schema) => {
  return !schema || typeof schema !== 'object'
}

methods.getRefsFromNonObjectTypes = () => []

methods.getRefsFromSchema = (schema) => {
  if (methods.isNonObjectType(schema)) {
    return methods.getRefsFromNonObjectTypes(schema)
  }

  if (methods.isArray(schema)) {
    return methods.getRefsFromArray(schema)
  }

  return methods.getRefsFromObject(schema)
}

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

methods.isObjectType = (schema) => {
  return typeof schema.properties !== 'undefined' ||
    typeof schema.minProperties !== 'undefined' ||
    typeof schema.maxProperties !== 'undefined' ||
    typeof schema.discriminator !== 'undefined' ||
    typeof schema.discriminatorValue !== 'undefined'
}

methods.isArrayType = (schema) => {
  return typeof schema.items !== 'undefined' ||
    typeof schema.uniqueItems !== 'undefined' ||
    typeof schema.minItems !== 'undefined' ||
    typeof schema.maxItems !== 'undefined'
}

methods.isStringType = (schema) => {
  return typeof schema.pattern !== 'undefined' ||
    typeof schema.maxLength !== 'undefined' ||
    typeof schema.minLength !== 'undefined'
}

methods.isNumberType = (schema) => {
  return typeof schema.minimum !== 'undefined' ||
    typeof schema.maximum !== 'undefined' ||
    typeof schema.multipleOf !== 'undefined'
}

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

methods.getTypes = (schema) => {
  const baseType = methods.getType(schema)

  if (schema.$ref) {
    return [ schema.$ref.split('/')[2] ]
  }

  let types = [ baseType ]
  if (schema.items) {
    if (Array.isArray(schema.items) || typeof schema.items[Symbol.iterator] === 'function') {
      types = schema.items
        .map(methods.getTypes)
        .reduce((fl, l) => fl.concat(l), [])
        .map(type => '(' + type + ')[]')
    }
    else {
      types = methods.getTypes(schema.items).map(type => {
        if (type.match(/\|/)) {
          return '(' + type + ')[]'
        }
        return type + '[]'
      })
    }
  }

  if (schema.allOf) {
    types = schema.allOf.map(methods.getTypes).reduce((fl, l) => fl.concat(l), [])
  }
  else if (schema.anyOf) {
    types = [ schema.anyOf.map(methods.getTypes).join(' | ') ]
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
  dataType.properties = props
    .map((prop) => {
      return { key: prop, value: methods.convertSchemaToDataType(schema.properties[prop]) }
    })
    .reduce(($data, { key, value }) => {
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

methods.dumpJSONIntoDataType = (_schema, deps, schemas) => {
  const schema = {}
  Object.assign(schema, _schema)
  schema.definitions = deps
    .map(dep => ({ key: dep, value: schemas.get(dep) }))
    .reduce(($defs, { key, value }) => {
      $defs[key] = value
      return $defs
    }, {})

  try {
    return JSON.stringify(schema, null, 2)
  }
  catch (e) {
    return schema
  }
}

methods.getAllDependencies = (coreInfoMap, depsMap, name) => {
  const deps = coreInfoMap.get(name).deps
  depsMap[name] = true

  if (!deps.length) {
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
  schemaMap[name].marked = true
  return schemaMap
}

methods.unmarkSchemas = (schemaMap) => {
  const keys = Object.keys(schemaMap)
  for (const key of keys) {
    delete schemaMap[key].marked
  }

  return schemaMap
}

methods.areSchemaAndDepsConvertible = (coreInfoMap, name) => {
  const { convertible, deps } = coreInfoMap.get(name)
  if (!convertible) {
    return false
  }


  return deps
    .map(dep => dep.split('/')[2])
    .map(depName => {
      if (coreInfoMap.get(depName).marked) {
        return true
      }
      const updatedCoreInfoMap = methods.markSchema(coreInfoMap, depName)
      return methods.areSchemaAndDepsConvertible(updatedCoreInfoMap, depName)
    })
    .reduce((acc, bool) => acc && bool, true)
}

methods.extractCoreInformationFromConstraint = (constraint, name) => {
  const schema = constraint.toJSONSchema()
  const deps = methods.getRefsFromSchema(schema)
  const convertible = methods.isConvertible(schema)

  return { constraint, schema, deps, convertible, name }
}

methods.extractDataTypeFromCoreInformation = ({ schema, name }, key, coreInfoMap) => {
  const isConvertible = methods.areSchemaAndDepsConvertible(coreInfoMap, name)
  const updatedCoreInfoMap = methods.unmarkSchemas(coreInfoMap)

  let dataType
  if (isConvertible) {
    dataType = methods.convertSchemaToDataType(schema)
  }
  else {
    const depsMap = methods.getAllDependencies(updatedCoreInfoMap, {}, name)
    delete depsMap[name]
    const $deps = Object.keys(depsMap)
    dataType = methods.dumpJSONIntoDataType(schema, $deps, coreInfoMap)
  }

  return {
    key: name,
    value: dataType
  }
}

methods.extractDataTypesFromApi = (api) => {
  const constraints = api.getIn([ 'store', 'constraint' ])

  const coreInfoMap = constraints
    .map(methods.extractCoreInformationFromConstraint)

  coreInfoMap
    .map(methods.extractDataTypeFromCoreInformation)
}

// TODO fix that
const types = Object.keys(schemaMap).map(name => {
  const convertible = methods.areSchemaAndDepsConvertible(schemaMap[name])
  methods.unmarkSchemas()

  const schema = schemas.definitions[name]
  let dataType
  if (convertible) {
    dataType = methods.convertSchemaToDataType(schema)
  }
  else {
    const depsMap = methods.getAllDependencies({}, name)
    delete depsMap[name]
    const deps = Object.keys(depsMap)
    dataType = methods.dumpJSONIntoDataType(schema, deps, schemas.definitions)
  }

  return {
    key: name,
    value: dataType
  }
}).reduce(($types, { key, value }) => {
  $types[key] = value
  return $types
}, {})

/**
 *
 */
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
  const endpoint = api.getIn([ 'store', 'endpoint' ]).valueSeq()[0]

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

methods.convertParameterIntoNamedParameter = (param) => {
  if (!param) {
    return null
  }

  const key = param.get('key')

  const schema = param.getJSONSchema(false, false)
  const namedParameter = methods.convertJSONSchemaIntoNamedParameter(schema)
  const value = namedParameter

  return { key, value }
}

methods.extractBaseUriParametersFromApi = (api) => {
  const endpoint = api.getIn([ 'store', 'endpoint' ]).valueSeq()[0]

  if (!endpoint) {
    return null
  }

  const urlComponentNames = [ 'hostname', 'port', 'pathname' ]
  const params = urlComponentNames
    .map(methods.extractParametersFromURLComponent)
    .filter(v => !!v)
    .reduce(flatten, [])
    .map(methods.convertParameterIntoNamedParameter)
}

methods.createRAMLJSONModel = (api) => {
  const kvs = [
    methods.extractTitleFromApi(api),
    methods.extractDescriptionFromApi(api),
    methods.extractVersionFromApi(api),
    methods.extractBaseUriFromApi(api),
    methods.extractBaseUriParametersFromApi(api),
    methods.extractProtocolsFromApi(api),
    methods.extractMediaTypeFromApi(api),
    methods.extractDocumentationFromApi(api),
    methods.extractTypesFromApi(api),
    methods.extractTraitsFromApi(api),
    methods.extractResourceTypesFromApi(api),
    methods.extractSecuritySchemesFromApi(api),
    methods.extractSecuredByFromApi(api),
    ...methods.extractResourcesFromApi(api)
  ]

  return model
}

methods.serialize = ({ api }) => {
  const model = methods.createRAMLJSONModel(api)
  const serialized = yaml.safeDump(model)
  return serialized
}

export const __internals__ = methods
export default RAMLSerializer
