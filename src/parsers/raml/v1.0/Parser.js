import { OrderedMap, List } from 'immutable'

import Constraint from '../../../models/Constraint'
import Group from '../../../models/Group'
import Parameter from '../../../models/Parameter'
import URLComponent from '../../../models/URLComponent'
import Reference from '../../../models/Reference'
import Context from '../../../models/Context'
import ParameterContainer from '../../../models/ParameterContainer'
import Request from '../../../models/Request'
import Resource from '../../../models/Resource'
import Response from '../../../models/Response'
import URL from '../../../models/URL'
import Store from '../../../models/Store'
import Auth from '../../../models/Auth'
import Interface from '../../../models/Interface'
import Info from '../../../models/Info'
import Api from '../../../models/Api'

import { convertEntryListInMap, flatten, currify, entries } from '../../../utils/fp-utils'

const methods = {}

export const __meta__ = {
  version: 'v1.0',
  format: 'raml'
}

/**
 * A Parser that converts a RAML AST into an API Record
 */
export class RAMLParser {
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
 * evaluates if the file is parsable by giving a score to the file depending on a few criteria.
 * @param {string} content: the content of the file to evaluate
 * @returns {number} the corresponding score, between 0 and 1
 */
methods.detect = (content) => {
  const detection = {
    format: __meta__.format,
    version: __meta__.version,
    score: 0
  }

  const firstLine = content.split('\n', 1)[0]
  const match = firstLine.match(/^#%RAML 1\.0$/)
  if (match) {
    detection.score = 1
    return [ detection ]
  }
  return [ detection ]
}

/**
 * tries to extract a title from a RAML file
 * @param {string} content: the file to get the api title from
 * @returns {string?} the title, if it was found
 */
methods.getAPIName = (content) => {
  const match = content.match(/^title:\s(.*)$/m)
  if (match) {
    return match[1] || null
  }

  return null
}

/**
 * adds a $key field to a schema, that is the name of a RAML node
 * @param {Object} schema: the schema to update
 * @param {RAMLNode} node: the node to extract the name of
 * @param {string?} offsetKey: the name of the library this node/schema belongs to, if any
 * @returns {Object} the updated schema
 */
methods.addKey = (schema, node, offsetKey) => {
  const key = offsetKey ? offsetKey + '.' + node.name() : node.name()
  schema.$key = key
  return schema
}

/**
 * adds a title field to a schema, that is the displayName of a RAML node, if it is different from
 * the name of the RAML node
 * @param {Object} schema: the schema to update
 * @param {RAMLNode} node: the node to extract the displayName of
 * @returns {Object} the updated schema
 */
methods.addTitle = (schema, node) => {
  const title = node.displayName()
  if (title && title !== node.name()) {
    schema.title = title
  }
  return schema
}

/**
 * adds a description field to a schema, taken from a RAML node
 * @param {Object} schema: the schema to update
 * @param {RAMLNode} node: the node to extract the description of
 * @returns {Object} the updated schema
 */
methods.addDescription = (schema, node) => {
  const description = node.description()
  if (description) {
    schema.description = description.toJSON()
  }
  return schema
}

/**
 * adds a x-examples field to a schema, taken from a RAML node
 * @param {Object} schema: the schema to update
 * @param {RAMLNode} node: the node to extract the examples of
 * @returns {Object} the updated schema
 */
methods.addExamples = (schema, node) => {
  const example = node.example()
  if (example) {
    schema['x-examples'] = [ example.value() ]
  }

  const examples = node.examples()
  if (examples.length) {
    schema['x-examples'] = examples.map(ex => ex.value())
  }

  if (
    schema['x-examples'] &&
    node.kind() !== 'StringTypeDeclaration'
  ) {
    schema['x-examples'] = schema['x-examples'].map(ex => {
      try {
        const parsed = JSON.parse(ex)
        return parsed
      }
      catch (e) {
        return ex
      }
    })
  }

  return schema
}

/**
 * adds a descriptive fields from a RAML node to a schema ($key, title, description, x-examples)
 * @param {Object} $schema: the schema to update
 * @param {RAMLNode} node: the node to extract the information from
 * @param {string?} offsetKey: the name of the library this node/schema belongs to, if any
 * @returns {Object} the updated schema
 */
methods.addDescriptiveFields = ($schema, node, offsetKey) => {
  let schema = $schema

  schema = methods.addKey(schema, node, offsetKey)
  schema = methods.addTitle(schema, node)
  schema = methods.addDescription(schema, node)
  schema = methods.addExamples(schema, node)

  return schema
}

/**
 * tests whether a string is potentially a JSON string (as is done in RAML)
 * @param {string} _str: the string to test
 * @returns {boolean} whether the string is a JSON object or not, as is written inside the RAML
 * parser
 */
methods.isMaybeJSON = (_str) => {
  const str = _str.trim()
  return (str[0] === '{' && str[str.length - 1] === '}')
}

/**
 * tests whether a string is potentially an XML string (as is done in RAML)
 * @param {string} _str: the string to test
 * @returns {boolean} whether the string is a XML object or not, as is written inside the RAML
 * parser
 */
methods.isMaybeXML = (_str) => {
  const str = _str.trim()
  return (str[0] === '<' && str[str.length - 1] === '>')
}

/**
 * tests whether a node is a TypeDeclaration
 * @param {RAMLNode} node: the node to test
 * @returns {boolean} whether the node is a TypeDeclaration or not
 */
methods.isTypeDeclaration = (node) => {
  return node.kind() === 'TypeDeclaration'
}

/**
 * converts a JSONTypeDeclaration into a list of schemas
 * @param {string} type: the json type declaration
 * @returns {Array<Object>} the corresponding schemas, if the declaration was successfully parsed
 */
methods.convertJSONTypeDeclaration = (type) => {
  let otherSchemas = []
  try {
    const jsonSchema = JSON.parse(type)
    if (jsonSchema.definitions) {
      otherSchemas = Object.keys(jsonSchema.definitions).map(name => {
        jsonSchema.definitions[name].$key = name
        return jsonSchema.definitions[name]
      })
      delete jsonSchema.definitions
    }

    const schema = jsonSchema
    return [ schema, ...otherSchemas ]
  }
  catch (e) {
    return []
  }
}

/**
 * converts an XMLTypeDeclaration into a list of schemas.
 * @param {string} type: the xml type declaration
 * @returns {Array<Object>} the corresponding schemas (that is poorly parsed)
 */
methods.convertXMLTypeDeclaration = (type) => {
  const schema = {
    'x-xml': type
  }

  return [ schema ]
}

/**
 * converts an InPlaceTypeDeclaration into a list of schemas
 * @param {string} type: the inplace type declaration
 * @param {string?} offsetKey: the name of the library this node/schema belongs to, if any
 * @returns {Array<Object>} the corresponding schemas
 */
methods.convertInPlaceTypeDeclaration = (type, offsetKey) => {
  const ref = offsetKey ? offsetKey + '.' + type : type
  const schema = {
    $ref: '#/definitions/' + ref
  }

  return [ schema ]
}

/**
 * tests whether the type is "any"
 * @param {string} type: the type to test
 * @returns {boolean} whether the type is any or not
 */
methods.isAnyType = (type) => type === 'any'

/**
 * converts an AnyTypeDeclaration into a list of schemas
 * @param {string} type: the inplace type declaration
 * @returns {Array<Object>} the corresponding schemas
 */
methods.convertAnyTypeDeclaration = () => {
  const schema = {}
  return [ schema ]
}

/**
 * convert a node into a list of schemas based on its type declaration
 * @param {RAMLNode} node: the node to convert
 * @param {string?} offsetKey: the name of the library this node/schema belongs to, if any
 * @returns {Array<Object>} the corresponding list of schemas
 */
methods.convertTypeDeclaration = (node, offsetKey) => {
  const type = node.type()[0]
  if (methods.isMaybeJSON(type)) {
    return methods.convertJSONTypeDeclaration(type, node)
  }
  else if (methods.isMaybeXML(type)) {
    return methods.convertXMLTypeDeclaration(type, node)
  }
  else if (methods.isAnyType(type)) {
    return methods.convertAnyTypeDeclaration(type, node)
  }

  return methods.convertInPlaceTypeDeclaration(type, offsetKey)
}

/**
 * updates a object-typed schema with common properties for object schemas
 * @param {Object} schema: the schema to update
 * @param {RAMLNode} node: the node to extract the information from
 * @returns {Object} the updated schema
 */
methods.addSimpleObjectFieldsToSchema = (schema, node) => {
  const props = [
    {
      key: 'minProperties',
      value: node.minProperties()
    },
    {
      key: 'maxProperties',
      value: node.maxProperties()
    },
    {
      key: 'additionalProperties',
      value: node.additionalProperties()
    },
    {
      key: 'discriminator',
      value: node.discriminator()
    },
    {
      key: 'discriminatorValue',
      value: node.discriminatorValue()
    }
  ]

  return props
    .filter(prop => prop.value !== null)
    .reduce(($schema, { key, value }) => {
      $schema[key] = value
      return $schema
    }, schema)
}

/**
 * converts a RAML node that represents a property in an object type node into a key value pair of
 * schema name and  schema with additional informations about dependencies and requirements.
 * @param {RAMLNode} prop: the node to to convert
 * @param {string?} offsetKey: the name of the library this node/schema belongs to, if any
 * @returns {Entry<string, Øbject>} the corresponding key value pair.
 */
methods.convertPropertyIntoSchemaEntry = (prop, offsetKey) => {
  const [ $schema, ...dependencies ] = methods.createSchema(prop, offsetKey)
  return {
    key: prop.name(),
    value: methods.normalizeSchema($schema),
    deps: dependencies,
    required: prop.required()
  }
}

/**
 * adds a property schema entry to a schema, and sanitizes it.
 * @param {Object} schema: the schema to update
 * @param {Entry} entry: the entry containing the sub schema to add
 * @param {string} entry.key: the name of the sub schema
 * @param {Object} entry.value: the sub schema
 * @returns {Object} the updated schema
 */
methods.addPropertyEntryToSchema = (schema, { key, value }) => {
  delete value.$key
  schema[key] = value
  return schema
}

/**
 * add the properties key to an object-typed schema from a list of schemas for each property
 * @param {Object} schema: the schema to update
 * @param {Array<Entry<string, Object>>} propSchemas: the array containing the schema for each
 * property, in a entry format
 * @returns {Object} the updated schema
 */
methods.addPropertiesKeyToSchema = (schema, propSchemas) => {
  if (propSchemas.length) {
    const propertiesSchema = propSchemas.reduce(methods.addPropertyEntryToSchema, {})
    schema.properties = propertiesSchema
  }

  return schema
}

/**
 * adds the required key to an object typed schema, from a list of property schemas
 * @param {Object} schema: the schema to update
 * @param {Array<{ key: string, required: boolean }>} propSchemas: the array containing whether the
 * property is required or not
 * @returns {Object} the updated schema
 */
methods.addRequiredKeyToSchema = (schema, propSchemas) => {
  const required = propSchemas
    .filter(({ required: isRequired }) => isRequired)
    .map(({ key }) => key)

  if (required.length) {
    schema.required = required
  }

  return schema
}

/**
 * extracts dependencies from property schemas and flattens them into a single list
 * @param {Array<{ deps: Array<Object> }>} propSchemas: the array containing the list of
 * dependencies of each property schema
 * @returns {Array<Object>} the list of other schemas
 */
methods.getOtherSchemasFromPropertiesSchemas = (propSchemas) => {
  const otherSchemas = propSchemas
    .map(prop => prop.deps)
    .reduce(flatten, [])

  return otherSchemas
}

/**
 * extracts the properties from a RAML node and converts each property into a schema, in an entry
 * formatted
 * @param {RAMLNode} node: the node to get the properties from
 * @param {string?} offsetKey: the name of the library this node/schema belongs to, if any
 * @returns {Array<Entry<string, Object>>} the corresponding array
 */
methods.getPropertiesSchema = (node, offsetKey) => {
  const properties = node.properties()

  if (!properties) {
    return []
  }

  const propSchemas = properties
    .map((prop) => methods.convertPropertyIntoSchemaEntry(prop, offsetKey))

  return propSchemas
}

/**
 * adds the properties key to a schema, from a RAML node
 * @param {Object} schema: the schema to update
 * @param {RAMLNode} node: the node to get the properties from
 * @param {string?} offsetKey: the name of the library this node/schema belongs to, if any
 * @returns {Object} the updated schema
 */
methods.addPropertiesToSchema = (schema, node, offsetKey) => {
  let updated = schema

  const propSchemas = methods.getPropertiesSchema(node, offsetKey)

  updated = methods.addPropertiesKeyToSchema(updated, propSchemas)
  updated = methods.addRequiredKeyToSchema(updated, propSchemas)

  const otherSchemas = methods.getOtherSchemasFromPropertiesSchemas(propSchemas)

  return [ updated, ...otherSchemas ]
}

/**
 * tests whether the type is a standard JSON Schema type
 * @param {string} type: the type to test
 * @returns {boolean} whether it is a standard JSON type
 */
methods.isJSONSchemaType = (type) => {
  return [ 'array', 'object', 'number', 'integer', 'string', 'boolean' ].indexOf(type) !== -1
}

/**
 * tests whether the type is nil
 * @param {string} type: the type to test
 * @returns {boolean} whether the type is nil or not
 */
methods.isNilType = (type) => type === 'nil'

/**
 * tests whether the type is an implicit array type
 * @param {string} type: the type to test
 * @returns {boolean} whether the type is an implicit array type
 */
methods.isImplicitArrayType = (type) => !!type.match(/\[\]$/)

/**
 * converts a type into an array-typed schema
 * @param {string} type: the type to convert into a schema
 * @param {string?} offsetKey: the name of the library this node/schema belongs to, if any
 * @returns {Object} the corresponding schema
 */
methods.getSchemaFromArrayType = (type, offsetKey) => {
  const schemas = methods.getSchemaFromType(type, offsetKey)
  const items = schemas.length === 1 ? schemas[0] : schemas
  return {
    type: 'array',
    items
  }
}

/**
 * converts a potential implicit array type into an array-typed schema
 * @param {string} type: the type to convert into a schema
 * @param {string?} offsetKey: the name of the library this node/schema belongs to, if any
 * @returns {Object?} the corresponding schema, it is indeed an implicit array type
 */
methods.getSchemaFromImplicitArrayType = (type, offsetKey) => {
  if (methods.isImplicitArrayType(type)) {
    const mixedTypesMatch = type.match(/^\(([^()]+)\)\[\]$/)
    const uniqueTypeMatch = type.match(/^([^|]+)\[\]$/)

    if (mixedTypesMatch || uniqueTypeMatch) {
      const itemType = (mixedTypesMatch || uniqueTypeMatch)[1]
      return methods.getSchemaFromArrayType(itemType, offsetKey)
    }
  }

  return null
}

/**
 * converts a potential union type into a schema
 * @param {string} type: the type to convert into a schema
 * @param {string?} offsetKey: the name of the library this node/schema belongs to, if any
 * @returns {Object?} the corresponding schema, it is indeed a union type
 */
methods.getSchemaFromUnionType = (type, offsetKey) => {
  const union = type.split('|').map(str => str.trim()).filter(v => !!v)

  if (union.length > 1) {
    const anyOf = methods.getSchemaListFromTypes(union, offsetKey)
    return { anyOf }
  }

  return null
}

/**
 * converts a reference type into a schema
 * @param {string} type: the type to convert into a schema
 * @param {string?} offsetKey: the name of the library this node/schema belongs to, if any
 * @returns {Object} the corresponding schema
 *
 * NOTE: What is the semantic difference between this method and @convertTypeDeclaration ?
 */
methods.getSchemaFromReferenceType = (type, offsetKey) => {
  const ref = offsetKey ? offsetKey + '.' + type : type
  const $ref = '#/definitions/' + ref
  return { $ref }
}

/**
 * converts a potential standard json type into a schema
 * @param {string} type: the type to convert into a schema
 * @returns {Object?} the corresponding schema, it is indeed a json type
 */
methods.getSchemaFromJSONType = (type) => {
  if (methods.isJSONSchemaType(type)) {
    return { type }
  }

  return null
}

/**
 * converts a potential nil type into a schema
 * @param {string} type: the type to convert into a schema
 * @returns {Object?} the corresponding schema, it is indeed a nil type
 */
methods.getSchemaFromNilType = (type) => {
  if (methods.isNilType(type)) {
    return { type: 'null' }
  }

  return null
}

/**
 * converts a type into a schema
 * @param {string} _type: the type to convert into a schema
 * @param {string?} offsetKey: the name of the library this node/schema belongs to, if any
 * @returns {Object?} the corresponding schema
 */
methods.getSchemaFromType = (_type, offsetKey) => {
  const type = _type.trim()

  const schema = methods.getSchemaFromJSONType(type) ||
    methods.getSchemaFromNilType(type) ||
    methods.getSchemaFromImplicitArrayType(type, offsetKey) ||
    methods.getSchemaFromUnionType(type, offsetKey) ||
    methods.getSchemaFromReferenceType(type, offsetKey)

  return schema
}

/**
 * converts an array of types into an array of schemas
 * @param {Array<string>} types: the array of types to convert
 * @param {string?} offsetKey: the name of the library this node/schema belongs to, if any
 * @returns {Array<Object>} the corresponding array of schemas
 */
methods.getSchemaListFromTypes = (types, offsetKey) => {
  if (types === null) {
    return []
  }
  return types.map((type) => methods.getSchemaFromType(type, offsetKey))
}

methods.convertMultipleInheritanceObjectWithSingleType = (schemas, $type) => {
  const type = $type.type
  const allOf = schemas.filter((schema) => !schema.type)
  const schema = { type }
  if (type === 'array' && $type.items) {
    schema.items = $type.items
  }
  if (allOf.length) {
    schema.allOf = allOf
  }
  return schema
}

/**
 * converts a multiple inheritance object into a schema from an array of types
 * @param {Array<string>} types: the array of types of the multiple inheritance object
 * @param {string?} offsetKey: the name of the library this node/schema belongs to, if any
 * @returns {Object} the corresponding schema
 */
methods.convertMultipleInheritanceObject = (types, offsetKey) => {
  const schemas = methods.getSchemaListFromTypes(types, offsetKey)

  const $types = schemas.filter(schema => !!schema.type)

  if ($types.length === 1) {
    return methods.convertMultipleInheritanceObjectWithSingleType(schemas, $types[0])
  }

  if (schemas.length === 0) {
    return { }
  }

  const allOf = schemas
  return { allOf }
}

/**
 * converts an array of types into a schema
 * @param {Array<string>} types: the array of types
 * @param {string?} offsetKey: the name of the library this node/schema belongs to, if any
 * @returns {Object} the corresponding schema
 */
methods.getSchemasFromTypes = (types, offsetKey) => {
  const schema = methods.convertMultipleInheritanceObject(types, offsetKey)
  return schema
}

/**
 * adds inherited types of a RAML node to a schema
 * @param {Object} $schema: the schema to update
 * @param {RAMLNode} node: the raml node to get the types from
 * @param {string?} offsetKey: the name of the library this node/schema belongs to, if any
 * @returns {Object} the updated schema
 */
methods.addInheritedTypes = ($schema, node, offsetKey) => {
  const types = node.type()

  const schema = methods.getSchemasFromTypes(types, offsetKey)

  return Object.assign({}, $schema, schema)
}

/**
 * converts an object type declaration node into an array of schemas
 * @param {RAMLNode} node: the node to convert
 * @param {string?} offsetKey: the name of the library this node/schema belongs to, if any
 * @returns {Array<Object>} the corresponding array of schemas
 */
methods.convertObjectTypeDeclaration = (node, offsetKey) => {
  let schema = {}
  let otherSchemas = []

  schema = methods.addInheritedTypes(schema, node, offsetKey)
  schema = methods.addSimpleObjectFieldsToSchema(schema, node);
  [ schema, ...otherSchemas ] = methods.addPropertiesToSchema(schema, node, offsetKey)

  return [ schema, ...otherSchemas ]
}

/**
 * updates an array typed schema with simple fields used in array schemas
 * @param {Object} schema: the schema to update
 * @param {RAMLNode} node: the node to get the values of the simple fields from
 * @returns {Object} the updated schema
 */
methods.addSimpleArrayFieldsToSchema = (schema, node) => {
  const props = [
    {
      key: 'uniqueItems',
      value: node.uniqueItems()
    },
    {
      key: 'minItems',
      value: node.minItems()
    },
    {
      key: 'maxItems',
      value: node.maxItems()
    }
  ]

  return props
    .filter(({ value }) => value !== null)
    .reduce(convertEntryListInMap, schema)
}

/**
 * tests whether a key is non-descriptive or not
 * @param {string} key: the key to test
 * @returns {boolean} whether the key is non-descriptive or not
 */
methods.isNonDescriptKey = (key) => [ 'title', 'description', '$key' ].indexOf(key) < 0

/**
 * normalizes a schema by checking if it is only composed of descriptive keys and an allOf key
 * containing a single schema, and if so, moves the content of the allOf schema inside the parent
 * schema, removing the allOf key.
 * @param {Object} schema: the schema to normalize
 * @returns {Object} the normalized schema
 */
methods.normalizeSchema = (schema) => {
  const keys = Object.keys(schema)
  const nonDescripKeys = keys.filter(methods.isNonDescriptKey)
  if (nonDescripKeys.length === 1 && schema.allOf && schema.allOf.length === 1) {
    const allOf = schema.allOf[0]
    delete schema.allOf

    return Object.assign(schema, allOf)
  }

  return schema
}

/**
 * extracts an array of types for the items of a RAML node
 * @param {RAMLNode} node: the node to get the items' types from.
 * @returns {Array<string>} the corresponding types for the items of the node
 */
methods.getItemTypes = (node) => {
  const items = node.items()
  if (items && items.length) {
    return items
  }

  const types = node.type()
  const itemTypes = types.map(type => type.trim())
    .filter(type => type.match(/\(?.*?\)?\[\]$/))
    .map(type => type.match(/\(?(.*?)\)?\[\]$/)[1])

  return itemTypes
}

/**
 * updates a schema with the items key from a RAML node
 * @param {Object} schema: the schema to update
 * @param {RAMLNode} node: the node to get the items data from
 * @param {string?} offsetKey: the name of the library this node/schema belongs to, if any
 * @returns {Objet} the updated schema
 */
methods.addItemFieldToSchema = (schema, node, offsetKey) => {
  const types = methods.getItemTypes(node)
  const items = methods.getSchemasFromTypes(types, offsetKey)
  const normalizedItems = methods.normalizeSchema(items)
  if (Object.keys(normalizedItems).length) {
    schema.items = normalizedItems
  }
  return schema
}

/**
 * converts an array type declaration node into an array of schemas
 * @param {RAMLNode} node: the node to convert into a schema
 * @param {string?} offsetKey: the name of the library this node/schema belongs to, if any
 * @returns {Array<Object>} the corresponding array of schemas
 */
methods.convertArrayTypeDeclaration = (node, offsetKey) => {
  let schema = {}

  schema = methods.addInheritedTypes(schema, node, offsetKey)
  schema = methods.addSimpleArrayFieldsToSchema(schema, node)
  schema = methods.addItemFieldToSchema(schema, node, offsetKey)

  return [ schema ]
}

/**
 * convert a union type declaration node into an array of schemas
 * @param {RAMLNode} node: the node to convert into a schema
 * @param {string?} offsetKey: the name of the library this node/schema belongs to, if any
 * @returns {Array<Object>} the corresponding array of schemas
 */
methods.convertUnionTypeDeclaration = (node, offsetKey) => {
  let schema = {}

  schema = methods.addInheritedTypes(schema, node, offsetKey)

  return [ schema ]
}

/**
 * updates a schema with simple string values from a RAML node
 * @param {Object} schema: the shema to update
 * @param {RAMLNode} node: the node to get the data from
 * @returns {Object} the updated schema
 */
methods.addSimpleStringFieldsToSchema = (schema, node) => {
  const props = [
    {
      key: 'minLength',
      value: node.minLength()
    },
    {
      key: 'maxLength',
      value: node.maxLength()
    },
    {
      key: 'pattern',
      value: node.pattern()
    },
    {
      key: 'enum',
      value: (node.enum() || []).length ? node.enum() : null
    }
  ]

  return props
    .filter(prop => prop.value !== null)
    .reduce(convertEntryListInMap, schema)
}

/**
 * converts a string type declaration node into an array of schemas
 * @param {RAMLNode} node: the node to convert
 * @param {string?} offsetKey: the name of the library this node/schema belongs to, if any
 * @returns {Object} the corresponding array of schemas
 */
methods.convertStringTypeDeclaration = (node, offsetKey) => {
  let schema = {}

  schema = methods.addInheritedTypes(schema, node, offsetKey)
  schema = methods.addSimpleStringFieldsToSchema(schema, node)

  return [ schema ]
}

/**
 * updates a schema with simple number properties from a node
 * @param {Object} schema: the schema to update
 * @param {RAMLNode} node: the node to get the data from
 * @returns {Object} the updated schema
 */
methods.addSimpleNumberFieldsToSchema = (schema, node) => {
  const props = [
    {
      key: 'minimum',
      value: node.minimum()
    },
    {
      key: 'maximum',
      value: node.maximum()
    },
    {
      key: 'multipleOf',
      value: node.multipleOf()
    },
    {
      key: 'enum',
      value: (node.enum() || []).length ? node.enum() : null
    }
  ]

  return props
    .filter(prop => prop.value !== null)
    .reduce(convertEntryListInMap, schema)
}

/**
 * converts a number type declaration node into an array of schemas
 * @param {RAMLNode} node: the node to convert
 * @param {string?} offsetKey: the name of the library this node/schema belongs to, if any
 * @returns {Array<Object>} the corresponding array of schemas
 */
methods.convertNumberTypeDeclaration = (node, offsetKey) => {
  let schema = {}

  schema = methods.addInheritedTypes(schema, node, offsetKey)
  schema = methods.addSimpleNumberFieldsToSchema(schema, node)

  return [ schema ]
}

/**
 * converts a boolean type declaration node into an array of schemas
 * @param {RAMLNode} node: the node to convert
 * @param {string?} offsetKey: the name of the library this node/schema belongs to, if any
 * @returns {Array<Object>} the corresponding array of schemas
 */
methods.convertBooleanTypeDeclaration = (node, offsetKey) => {
  let schema = {}

  schema = methods.addInheritedTypes(schema, node, offsetKey)

  return [ schema ]
}

/**
 * converts a date-only type declaration node into an array of schemas
 * @param {string?} offsetKey: the name of the library this node/schema belongs to, if any
 * @returns {Array<Object>} the corresponding array of schemas
 */
methods.convertDateOnlyTypeDeclaration = (offsetKey) => {
  const ref = offsetKey ? offsetKey + '.$DateOnly' : '$DateOnly'
  const schema = {
    type: 'string',
    $ref: '#/definitions/' + ref
  }

  const DateOnlySchema = {
    $key: ref,
    type: 'string',
    pattern: '^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$',
    description: 'full-date as defined in RFC#3339'
  }

  return [ schema, DateOnlySchema ]
}

/**
 * converts a time-only type declaration node into an array of schemas
 * @param {string?} offsetKey: the name of the library this node/schema belongs to, if any
 * @returns {Array<Object>} the corresponding array of schemas
 */
methods.convertTimeOnlyTypeDeclaration = (offsetKey) => {
  const ref = offsetKey ? offsetKey + '.$TimeOnly' : '$TimeOnly'
  const schema = {
    type: 'string',
    $ref: '#/definitions/' + ref
  }

  const TimeOnlySchema = {
    $key: ref,
    type: 'string',
    pattern: '^([01][0-9]|20|21|22|23):[0-5][0-9]:([0-5][0-9]|60)(.[0-9]+)?$',
    description: 'full-time as defined in RFC#3339'
  }

  return [ schema, TimeOnlySchema ]
}

/**
 * converts a datetime-only type declaration node into an array of schemas
 * @param {string?} offsetKey: the name of the library this node/schema belongs to, if any
 * @returns {Array<Object>} the corresponding array of schemas
 */
methods.convertDateTimeOnlyTypeDeclaration = (offsetKey) => {
  const ref = offsetKey ? offsetKey + '.$DateTimeOnly' : '$DateTimeOnly'
  const schema = {
    type: 'string',
    $ref: '#/definitions/' + ref
  }

  const DateTimeOnlySchema = {
    $key: ref,
    type: 'string',
    pattern: '^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])T' +
      '([01][0-9]|20|21|22|23):[0-5][0-9]:([0-5][0-9]|60)(.[0-9]+)?$',
    description: 'full-time as defined in RFC#3339'
  }

  return [ schema, DateTimeOnlySchema ]
}

/**
 * converts a datetime type declaration node into an array of schemas
 * @param {string?} offsetKey: the name of the library this node/schema belongs to, if any
 * @returns {Array<Object>} the corresponding array of schemas
 */
methods.convertDateTimeTypeDeclaration = (offsetKey) => {
  const ref = offsetKey ? offsetKey + '.$DateTime' : '$DateTime'
  const schema = {
    type: 'string',
    $ref: '#/definitions/' + ref
  }

  const DateTimeSchema = {
    $key: ref,
    type: 'string',
    description: 'datetime'
  }

  return [ schema, DateTimeSchema ]
}

/**
 * converts a file type declaration node into an array of schemas
 * @param {string?} offsetKey: the name of the library this node/schema belongs to, if any
 * @returns {Array<Object>} the corresponding array of schemas
 */
methods.convertFileTypeDeclaration = (offsetKey) => {
  const ref = offsetKey ? offsetKey + '.$File' : '$File'
  const schema = {
    type: 'string',
    $ref: '#/definitions/' + ref
  }

  const FileSchema = {
    $key: ref,
    type: 'string',
    description: 'file',
    pattern: '^[^\u0000]*\u0000$'
  }

  return [ schema, FileSchema ]
}

/* eslint-disable max-statements */
/**
 * converts a node into an array of schemas
 * @param {RAMLNode} node: the node to convert
 * @param {string?} offsetKey: the name of the library this node/schema belongs to, if any
 * @returns {Array<Object>} the corresponding array of schemas
 */
methods.createSchema = (node, offsetKey) => {
  let schema = {}
  let otherSchemas = []

  const typeKind = node.kind()
  // External Declaration
  if (typeKind === 'TypeDeclaration') {
    [ schema, ...otherSchemas ] = methods.convertTypeDeclaration(node, offsetKey)
  }
  else if (typeKind === 'ObjectTypeDeclaration') {
    [ schema, ...otherSchemas ] = methods.convertObjectTypeDeclaration(node, offsetKey)
  }
  else if (typeKind === 'ArrayTypeDeclaration') {
    [ schema, ...otherSchemas ] = methods.convertArrayTypeDeclaration(node, offsetKey)
  }
  else if (typeKind === 'UnionTypeDeclaration') {
    [ schema, ...otherSchemas ] = methods.convertUnionTypeDeclaration(node, offsetKey)
  }
  else if (typeKind === 'StringTypeDeclaration') {
    [ schema, ...otherSchemas ] = methods.convertStringTypeDeclaration(node, offsetKey)
  }
  else if (typeKind === 'NumberTypeDeclaration' || typeKind === 'IntegerTypeDeclaration') {
    [ schema, ...otherSchemas ] = methods.convertNumberTypeDeclaration(node, offsetKey)
  }
  else if (typeKind === 'BooleanTypeDeclaration') {
    [ schema, ...otherSchemas ] = methods.convertBooleanTypeDeclaration(node, offsetKey)
  }
  else if (typeKind === 'DateOnlyTypeDeclaration') {
    [ schema, ...otherSchemas ] = methods.convertDateOnlyTypeDeclaration(offsetKey)
  }
  else if (typeKind === 'TimeOnlyTypeDeclaration') {
    [ schema, ...otherSchemas ] = methods.convertTimeOnlyTypeDeclaration(offsetKey)
  }
  else if (typeKind === 'DateTimeOnlyTypeDeclaration') {
    [ schema, ...otherSchemas ] = methods.convertDateTimeOnlyTypeDeclaration(offsetKey)
  }
  else if (typeKind === 'DateTimeTypeDeclaration') {
    [ schema, ...otherSchemas ] = methods.convertDateTimeTypeDeclaration(offsetKey)
  }
  else if (typeKind === 'FileTypeDeclaration') {
    [ schema, ...otherSchemas ] = methods.convertFileTypeDeclaration(offsetKey)
  }

  schema = methods.addDescriptiveFields(schema, node, offsetKey)

  return [ schema, ...otherSchemas ]
}
/* eslint-enable max-statements */

/**
 * updates a definitions object with a schema
 * @param {Object} defs: the definitions object to update
 * @param {Object} schema: the schema to add to the definitions object
 * @returns {Object} the updated definitions object
 */
methods.addSchemaToDefinitionsReducer = (defs, schema) => {
  const key = schema.$key
  delete schema.$key
  defs[key] = schema
  return defs
}

/**
 * converts a type into schemas and add them to the definitions object
 * @param {string?} offsetKey: the name of the library this node/schema belongs to, if any
 * @param {Object} definitions: the definitions object to update with the schemas
 * @param {RAMLNode} type: the node to extract the schemas from
 * @returns {Object} the updated definitions object
 */
methods.addDefinitionsReducer = (offsetKey, definitions, type) => {
  const schemas = methods.createSchema(type, offsetKey).map(methods.normalizeSchema)
  return schemas.reduce(methods.addSchemaToDefinitionsReducer, definitions)
}

/**
 * converts all types in a RAML Api into a definitions object
 * @param {RAMLApi} api: the api to get the types from
 * @param {string?} offsetKey: the name of the library this api belongs to, if any
 * @returns {{ definitions: Object }} the corresponding definitions object, encapsulating all the
 * schemas present in the api
 */
methods.createDefinitions = (api, offsetKey) => {
  const types = api.types()
  const addDefinitionsReducer = currify(methods.addDefinitionsReducer, offsetKey)
  const definitions = types.reduce(addDefinitionsReducer, {})

  return { definitions }
}

/**
 * extracts definitions from the libraries included with the RAMLApi object
 * @param {RAMLApi} api: the api object from which to get the libraries
 * @returns {Object<string, JSONSchema>} the corresponding defintions map of JSONSchemas belonging
 * to the libraries (namespaced)
 */
methods.extractDefinitionsFromLibaries = (api) => {
  const libraries = api.uses()

  if (!libraries) {
    return {}
  }

  const libraryDefinitions = libraries
    .map((library) => {
      if (!library || !library.ast()) {
        return null
      }

      return methods.createDefinitions(library.ast(), library.key()).definitions
    })
    .filter(v => !!v)
    .reduce((acc, value) => {
      const libDefs = entries(value)
      return [].concat(acc, libDefs)
    }, [])
    .reduce(convertEntryListInMap, {})

  return libraryDefinitions
}

/**
 * extracts all shared constraints from a RAML Api and stores them in a Constraint TypedStore.
 * @param {RAMLApi} api: the api to get the constraints from
 * @returns {OrderedMap<string, Constraint>} the corresponding TypedStore
 */
methods.extractConstraintStore = (api) => {
  const { definitions } = methods.createDefinitions(api)
  const libraryDefinitions = methods.extractDefinitionsFromLibaries(api)
  const allDefinitions = Object.assign({}, definitions, libraryDefinitions)

  return OrderedMap(allDefinitions).map((schema) => new Constraint.JSONSchema(schema))
}

/**
 * extracts all shared parameters from a RAML Api and stores them in a Parameter TypedStore.
 * @param {RAMLApi} api: the api to get the parameters from
 * @returns {OrderedMap<string, Parameter>} the corresponding TypedStore
 */
methods.extractParameterStore = (api) => {
  const params = {}
  const globalContentTypeParam = methods.getGlobalContentTypeParameter(api)
  if (globalContentTypeParam) {
    params.globalMediaType = globalContentTypeParam
  }

  return OrderedMap(params)
}

/**
 * extracts scopes from a RAML OAuth2 settings object
 * @param {RAMLOAuth2SecuritySchemeSettings} settings: the settings from which to get the scopes
 * @returns {List<Entry<string, string>>} the corresponding scopes
 */
methods.extractScopesFromOAuth2Settings = (settings) => {
  const scopes = settings.scopes().map(scope => ({ key: scope, value: '' }))

  return List(scopes)
}

/**
 * extracts the flow from a RAML OAuth2 settings object
 * @param {RAMLOAuth2SecuritySchemeSettings} settings: the settings from which to get the flow
 * @returns {string?} the corresponding flow
 */
methods.extractFlowFromOAuth2Settings = (settings) => {
  const grantMap = {
    authorization_code: 'accessCode',
    implicit: 'implicit',
    password: 'password',
    client_credentials: 'application'
  }
  const flow = grantMap[(settings.authorizationGrants() || [])[0]] || null

  return flow
}

/**
 * extracts the authorizationUrl from a RAML OAuth2 settings object
 * @param {RAMLOAuth2SecuritySchemeSettings} settings: the settings from which to get the url
 * @returns {string?} the corresponding url
 */
methods.extractAuthorizationUrlFromOAuth2Settings = (settings) => {
  return (settings.authorizationUri() || { value: () => null }).value() || null
}

/**
 * extracts the tokenUrl from a RAML OAuth2 settings object
 * @param {RAMLOAuth2SecuritySchemeSettings} settings: the settings from which to get the url
 * @returns {string?} the corresponding url
 */
methods.extractTokenUrlFromOAuth2Settings = (settings) => {
  return (settings.accessTokenUri() || { value: () => null }).value() || null
}

/**
 * extracts the authName from a RAML Auth scheme
 * @param {RAMLSecurityScheme} scheme: the scheme to get the authName from
 * @returns {string} the corresponding url
 */
methods.extractAuthNameFromAuthScheme = (scheme) => scheme.name()

/**
 * converts a RAML OAuth2 Security Scheme into an OAuth2 Record
 * @param {RAMLOAuth2SecurityScheme} scheme: the security scheme to convert
 * @returns {Entry<string,OAuth2Auth>} the corresponding OAuth2 record
 */
methods.convertRAMLAuthIntoOAuth2AuthEntry = (scheme) => {
  const settings = scheme.settings()

  const authName = methods.extractAuthNameFromAuthScheme(scheme)
  const description = methods.extractDescription(scheme)

  const flow = methods.extractFlowFromOAuth2Settings(settings)
  const authorizationUrl = methods.extractAuthorizationUrlFromOAuth2Settings(settings)
  const tokenUrl = methods.extractTokenUrlFromOAuth2Settings(settings)
  const scopes = methods.extractScopesFromOAuth2Settings(settings)

  const authInstance = {
    authName,
    description,
    flow,
    authorizationUrl,
    tokenUrl,
    scopes
  }

  return { key: authName, value: new Auth.OAuth2(authInstance) }
}

/**
 * extracts the requestTokenUri from a RAML OAuth1 settings object
 * @param {RAMLOAuth1SecuritySchemeSettings} settings: the settings from which to get the url
 * @returns {string?} the corresponding url
 */
methods.extractRequestTokenUriFromOAuth1Settings = (settings) => {
  return (settings.requestTokenUri() || { value: () => null }).value() || null
}

/**
 * extracts the authorizationUri from a RAML OAuth1 settings object
 * @param {RAMLOAuth1SecuritySchemeSettings} settings: the settings from which to get the url
 * @returns {string?} the corresponding url
 */
methods.extractAuthorizationUriFromOAuth1Settings = (settings) => {
  return (settings.authorizationUri() || { value: () => null }).value() || null
}

/**
 * extracts the tokenCredentialsUri from a RAML OAuth1 settings object
 * @param {RAMLOAuth1SecuritySchemeSettings} settings: the settings from which to get the url
 * @returns {string?} the corresponding url
 */
methods.extractTokenCredentialsUriFromOAuth1Settings = (settings) => {
  return (settings.tokenCredentialsUri() || { value: () => null }).value() || null
}

/**
 * extracts the signature from a RAML OAuth1 settings object
 * @param {RAMLOAuth1SecuritySchemeSettings} settings: the settings from which to get the signature
 * @returns {string?} the corresponding signature
 */
methods.extractSignatureFromOAuth1Settings = (settings) => {
  return (settings.signatures() || [])[0] || null
}

/**
 * converts a RAML OAuth1 Security Scheme into an OAuth1 Record
 * @param {RAMLOAuth1SecurityScheme} scheme: the security scheme to convert
 * @returns {Entry<string,OAuth1Auth>} the corresponding OAuth1 record
 */
methods.convertRAMLAuthIntoOAuth1AuthEntry = (scheme) => {
  const settings = scheme.settings()

  const authName = methods.extractAuthNameFromAuthScheme(scheme)
  const description = methods.extractDescription(scheme)

  const requestTokenUri = methods.extractRequestTokenUriFromOAuth1Settings(settings)
  const authorizationUri = methods.extractAuthorizationUriFromOAuth1Settings(settings)
  const tokenCredentialsUri = methods.extractTokenCredentialsUriFromOAuth1Settings(settings)
  const signature = methods.extractSignatureFromOAuth1Settings(settings)

  const authInstance = {
    authName,
    description,
    requestTokenUri,
    authorizationUri,
    tokenCredentialsUri,
    signature
  }

  return { key: authName, value: new Auth.OAuth1(authInstance) }
}

/**
 * extracts the location and key from a RAML PassThroughSecurityScheme (aka ApiKey)
 * @param {RAMLPassThroughSecurityScheme} scheme: the security scheme from which to get the location
 * and key
 * @returns {{key: string?, location: string?}} the corresponding object holding the key and
 * location
 */
methods.extractLocationAndKeyFromApiKeyScheme = (scheme) => {
  const describedBy = scheme.describedBy()

  if (!describedBy) {
    return { key: null, location: null }
  }

  const headers = describedBy.headers()
  const queries = describedBy.queryParameters()

  if (headers && headers.length) {
    return { key: headers[0].name(), location: 'header' }
  }

  if (queries && queries.length) {
    return { key: queries[0].name(), location: 'query' }
  }

  return { key: null, location: null }
}

/**
 * converts a RAML PassThroughSecurityScheme into an ApiKey Record
 * @param {RAMLPassThroughSecurityScheme} scheme: the security scheme to convert
 * @returns {Entry<string,ApiKeyAuth>} the corresponding ApiKey record
 */
methods.convertRAMLAuthIntoApiKeyAuthEntry = (scheme) => {
  const authName = methods.extractAuthNameFromAuthScheme(scheme)
  const description = methods.extractDescription(scheme)

  const { key, location } = methods.extractLocationAndKeyFromApiKeyScheme(scheme)

  const authInstance = {
    description,
    authName,
    key,
    in: location
  }

  return { key: authName, value: new Auth.ApiKey(authInstance) }
}

/**
 * converts a RAML Basic Security Scheme into a Basic Record
 * @param {RAMLBasicSecurityScheme} scheme: the security scheme to convert
 * @returns {Entry<string,BasicAuth>} the corresponding Basic record
 */
methods.convertRAMLAuthIntoBasicAuthEntry = (scheme) => {
  const authName = methods.extractAuthNameFromAuthScheme(scheme)
  const description = methods.extractDescription(scheme)

  const authInstance = { authName, description }

  return { key: authName, value: new Auth.Basic(authInstance) }
}

/**
 * converts a RAML Digest Security Scheme into an OAuth2 Record
 * @param {RAMLDigestSecurityScheme} scheme: the security scheme to convert
 * @returns {Entry<string, DigestAuth>} the corresponding Digest record
 */
methods.convertRAMLAuthIntoDigestAuthEntry = (scheme) => {
  const authName = methods.extractAuthNameFromAuthScheme(scheme)
  const description = methods.extractDescription(scheme)

  const authInstance = { authName, description }

  return { key: authName, value: new Auth.Digest(authInstance) }
}

/**
* converts a RAML Custom Security Scheme into a CustomAuth Record
* @param {RAMLAbstractSecurityScheme} scheme: the security scheme to convert
* @returns {Entry<string, CustomAuth>} the corresponding CustomAuth record
 */
methods.convertRAMLAuthIntoCustomAuthEntry = (scheme) => {
  const authName = methods.extractAuthNameFromAuthScheme(scheme)
  const description = methods.extractDescription(scheme)

  const authInstance = { authName, description }
  return { key: authName, value: new Auth.Custom(authInstance) }
}

/* eslint-disable max-statements */
/**
 * converts a RAML Security Scheme into an Auth Record
 * @param {RAMLSecurityScheme} scheme: the security scheme to convert
 * @returns {Entry<string,Auth>?} the corresponding Auth record
 */
methods.convertRAMLAuthIntoAuthEntry = (scheme) => {
  const kind = scheme.kind()

  if (kind === 'OAuth2SecurityScheme') {
    return methods.convertRAMLAuthIntoOAuth2AuthEntry(scheme)
  }

  if (kind === 'OAuth1SecurityScheme') {
    return methods.convertRAMLAuthIntoOAuth1AuthEntry(scheme)
  }

  if (kind === 'PassThroughSecurityScheme') {
    return methods.convertRAMLAuthIntoApiKeyAuthEntry(scheme)
  }

  if (kind === 'BasicSecurityScheme') {
    return methods.convertRAMLAuthIntoBasicAuthEntry(scheme)
  }

  if (kind === 'DigestSecurityScheme') {
    return methods.convertRAMLAuthIntoDigestAuthEntry(scheme)
  }

  if (kind === 'AbstractSecurityScheme') {
    return methods.convertRAMLAuthIntoCustomAuthEntry(scheme)
  }

  return null
}
/* eslint-enable max-statements */

/**
 * extracts all security schemes from a RAML Library and stores them in an array of entries
 * @param {RAMLLibrary} lib: the library from which to get the security schemes
 * @returns {Array<Entry<string, Auth>>} the corresponding array of Auth as Entries
 */
methods.extractAuthsFromRAMLLibrary = (lib) => {
  const schemes = lib.ast().securitySchemes()

  if (!schemes || !schemes.length) {
    return []
  }

  return schemes
    .map(methods.convertRAMLAuthIntoAuthEntry)
    .filter(v => !!v)
    .map(({ key, value }) => {
      const libKey = lib.key() + '.' + key
      return { key: libKey, value }
    })
}

/**
 * extracts all security schemes from a RAML Api and stores them in an array of entries
 * @param {RAMLApi} api: the api from which to get the security schemes
 * @returns {Array<Entry<string, Auth>>} the corresponding array of Auth as Entries
 */
methods.extractAuthsFromRAMLApi = (api) => {
  const securitySchemes = api.securitySchemes() || []
  const authsFromLibs = (api.uses() || [])
    .map(methods.extractAuthsFromRAMLLibrary)
    .reduce(flatten, [])

  const auths = securitySchemes
    .map(methods.convertRAMLAuthIntoAuthEntry)
    .filter(v => !!v)

  return [].concat(auths, authsFromLibs)
}

/**
 * extracts all security schemes from a RAML Api and stores them in an Auth TypedStore
 * @param {RAMLApi} api: the api from which to get the security schemes
 * @returns {OrderedMap<string, Auth>} the corresponding TypedStore
 */
methods.extractAuthStore = (api) => {
  const auths = methods.extractAuthsFromRAMLApi(api)
  const authMap = auths.reduce(convertEntryListInMap, {})

  return OrderedMap(authMap)
}

/**
 * extracts the interface name from a resource base
 * @param {RAMLResourceBase} resourceBase: the resource base from which to get the interface name
 * @returns {string} the corresponding interface name
 */
methods.extractInterfaceNameFromResourceBase = (resourceBase) => resourceBase.name()

/**
 * extracts the interface uuid from a resource name
 * @param {string} name: the name from which to get the resource uuid
 * @returns {string} the corresponding interface uuid
 */
methods.extractInterfaceUUIDFromResourceName = (name) => 'resourceType_' + name

/**
 * extracts the interface description from a resource base
 * @param {RAMLResourceBase} resourceBase: the resource base from which to get the interface
 * description
 * @returns {string} the corresponding interface description
 */
methods.extractInterfaceDescriptionFromResourceBase = (resourceBase) => {
  return resourceBase.usage() || null
}

/**
 * converts a RAML resourceBase into an interface entry
 * @param {RAMLResourceBase} resourceBase: the resource base to convert
 * @returns {Entry<string, Interface>} the corresponding interface entry
 */
methods.convertResourceBaseIntoInterfaceEntry = (resourceBase) => {
  const name = methods.extractInterfaceNameFromResourceBase(resourceBase)
  const uuid = methods.extractInterfaceUUIDFromResourceName(name)
  const description = methods.extractInterfaceDescriptionFromResourceBase(resourceBase)
  const resourceInstance = methods.convertRAMLResourceBaseIntoResourceInstance(null, resourceBase)
  const underlay = new Resource(resourceInstance)

  const interfaceInstance = { name, uuid, level: 'resource', description, underlay }

  return { key: uuid, value: new Interface(interfaceInstance) }
}

/**
 * extracts the interface name from a method base
 * @param {RAMLMethodBase} methodBase: the method base from which to get the interface name
 * @returns {string} the corresponding interface name
 */
methods.extractInterfaceNameFromMethodBase = (methodBase) => methodBase.name()

/**
 * extracts the interface uuid from a method name
 * @param {string} name: the name from which to get the method uuid
 * @returns {string} the corresponding interface uuid
 */
methods.extractInterfaceUUIDFromMethodName = (name) => 'trait_' + name

/**
 * extracts the interface description from a resource base
 * @param {RAMLMethodBase} methodBase: the method base from which to get the interface
 * description
 * @returns {string} the corresponding interface description
 */
methods.extractInterfaceDescriptionFromMethodBase = (methodBase) => methodBase.usage() || null

/**
 * converts a RAML methodBase into an interface entry
 * @param {RAMLMethodBase} methodBase: the method base to convert
 * @returns {Entry<string, Interface>} the corresponding interface entry
 */
methods.convertMethodBaseIntoInterfaceEntry = (methodBase) => {
  const name = methods.extractInterfaceNameFromMethodBase(methodBase)
  const uuid = methods.extractInterfaceUUIDFromMethodName(name)
  const description = methods.extractInterfaceDescriptionFromMethodBase(methodBase)
  const requestInstance = methods.convertRAMLMethodBaseIntoRequestInstance(null, methodBase)
  const underlay = new Request(requestInstance)

  const interfaceInstance = { name, uuid, level: 'request', description, underlay }

  return { key: uuid, value: new Interface(interfaceInstance) }
}

/**
 * extracts all shared interfaces from a RAML Api and stores them in a TypedStore
 * @param {RAMLApi} api: the api to get the resourceTypes and traits from
 * @returns {OrderedMap<string, Interface>} the corresponding TypedStore
 */
methods.extractInterfaceStore = (api) => {
  const resourceInterfaces = (api.resourceTypes() || [])
    .map(methods.convertResourceBaseIntoInterfaceEntry)

  const requestInterfaces = (api.traits() || [])
    .map(methods.convertMethodBaseIntoInterfaceEntry)

  const interfaces = [].concat(resourceInterfaces, requestInterfaces)
    .reduce(convertEntryListInMap, {})

  return OrderedMap(interfaces)
}

/**
 * updates an endpoint's URLComponent with uriParameters, based on the component's name
 * @param {URL} endpoint: the endpoint to update
 * @param {string} componentName: the name of the component to update in the endpoint
 * @param {Array<JSONSchema>} uriParameters: the uriParameters to use to upgrade the description of
 * named parameters in the endpoint
 * @returns {URL} the updated endpoint
 */
methods.updateURLComponentWithUriParameters = (endpoint, componentName, uriParameters) => {
  const component = endpoint.get(componentName)

  if (component && component.getIn([ 'parameter', 'superType' ]) === 'sequence') {
    const componentValue = component
      .getIn([ 'parameter', 'value' ])
      .map(param => {
        const candidates = uriParameters
          .filter(uriParameter => {
            return uriParameter.$key === param.get('key')
          })

        if (candidates.length) {
          return methods.convertSchemaIntoParameterEntry(componentName, List(), candidates[0]).value
        }

        return param
      })
    return component.setIn([ 'parameter', 'value' ], componentValue)
  }

  return component
}

/**
 * update an endpoint with uriParameters
 * @param {URL} $endpoint: the endpoint to update
 * @param {Array<JSONSchema>} uriParameters: the uriParameters to use to upgrade the description of
 * named parameters in the endpoint
 * @returns {URL} the updated endpoint
 */
methods.updateEndpointWithUriParameters = ($endpoint, uriParameters) => {
  return $endpoint.withMutations(endpoint => {
    const componentNames = [ 'hostname', 'port', 'pathname' ]
    componentNames.forEach(componentName => {
      const updatedComponent = methods
        .updateURLComponentWithUriParameters(endpoint, componentName, uriParameters)
      endpoint.set(componentName, updatedComponent)
    })
  })
}

/**
 * extracts the baseUri endpoint from a RAMLApi
 * @param {RAMLBaseUri} baseUri: the baseUri to convert into an endpoint
 * @param {RAMLApi} api: the api from which to get the baseUriParameters
 * @returns {URL} the corresponding endpoint
 */
methods.extractBaseUriWithParameters = (baseUri, api) => {
  const uri = baseUri.value()
  const protocols = api.protocols()
  let endpoint = new URL({ url: uri, variableDelimiters: List([ '{', '}' ]) })
  if (protocols && protocols.length) {
    endpoint = endpoint.set('protocol', List(protocols.map(protocol => {
      if (protocol[protocol.length - 1] !== ':') {
        return protocol.toLowerCase() + ':'
      }

      return protocol.toLowerCase()
    })))
  }

  const parameters = api.baseUriParameters()
  if (!parameters || !parameters.length) {
    return endpoint
  }

  const uriParameters = parameters
    .map(uriParameter => methods.createSchema(uriParameter).map(methods.normalizeSchema)[0])

  return methods.updateEndpointWithUriParameters(endpoint, uriParameters)
}

/**
 * extracts the shared endpoint TypedStore from a RAMLApi
 * @param {RAMLApi} api: the api from which to get the shared endpoint
 * @returns {OrderedMap<string, URL>} the corresponding TypedStore
 */
methods.extractEndpointStore = (api) => {
  const baseUri = api.baseUri()
  if (!baseUri) {
    const base = new URL()
    return OrderedMap({ base })
  }

  const base = methods.extractBaseUriWithParameters(baseUri, api)
  return OrderedMap({ base })
}

/**
 * extracts all shared objects from a RAML Api and stores them in a Store
 * @param {RAMLApi} api: the api to get the shared objects from
 * @returns {Store} the corresponding store
 */
methods.extractStore = (api) => {
  const constraint = methods.extractConstraintStore(api)
  const endpoint = methods.extractEndpointStore(api)
  const parameter = methods.extractParameterStore(api)
  const auth = methods.extractAuthStore(api)
  const $interface = methods.extractInterfaceStore(api)

  const storeInstance = { constraint, endpoint, parameter, auth, interface: $interface }

  return new Store(storeInstance)
}

/**
 * create a group from a RAML Resource
 * @param {RAMLResource} resource: the resource to convert into a group
 * @returns {Group} the corresponding group
 */
methods.createGroupFromResource = (resource) => {
  const relativeUri = resource.relativeUri()
  if (!relativeUri) {
    return new Group({
      id: resource.completeRelativeUri()
    })
  }

  return new Group({
    id: resource.completeRelativeUri(),
    name: resource.relativeUri().value()
  })
}

/**
 * extracts a group key from a RAML Resource
 * @param {RAMLResource} resource: the resource to extract the key from
 * @returns {string} the corresponding group key
 */
methods.getGroupKeyFromResource = (resource) => resource.completeRelativeUri()

/**
 * converts a resource into a group entry
 * @param {RAMLResource} resource: the resource to converts
 * @returns {Entry<string, Group>} the corresponding group entry
 */
methods.createGroupEntryFromResource = (resource) => {
  const childGroup = methods.createGroupFromResource(resource)

  const key = methods.getGroupKeyFromResource(resource)
  const value = methods.convertResourceIntoGroup(childGroup, resource)

  return { key, value }
}

/**
 * tests whether a RAMLResource has the method `methods`.
 * @param {RAMLResource} resource: the resource to test
 * @returns {boolean} returns true if it has the method `methods`
 */
methods.resourceHasMethods = (resource) => {
  const hasMethods = typeof resource.methods === 'function' ? !!resource.methods().length : false
  return hasMethods
}

/**
 * recursively converts RAML resources into Groups
 * @param {Group} parentGroup: the group to add the children of the RAML resource to.
 * @param {RAMLResource|RAMLApi} resource: the resource to use to create the subgroups
 * @returns {Group} the updated parent group
 */
methods.convertResourceIntoGroup = (parentGroup, resource) => {
  const children = resource.resources()
    .map(methods.createGroupEntryFromResource)

  if (methods.resourceHasMethods(resource)) {
    const absoluteUri = resource.absoluteUri()
    children.push({ key: absoluteUri, value: absoluteUri })
  }

  const childrenMap = children.reduce(convertEntryListInMap, {})

  return parentGroup.set('children', OrderedMap(childrenMap))
}

/**
 * extracts the Group architecture from a RAML Api
 * @param {RAMLApi} api: the api to get the resources from
 * @returns {Group} the root group holding the architecture of the api
 */
methods.createGroups = (api) => {
  return methods.convertResourceIntoGroup(new Group(), api)
}

/**
 * recursively gets all the uriParameters and resources from a RAML resource
 * @param {Array<RAMLTypeDeclaration>} uriParameters: an accumulator that holds uriParameters from
 * the parent resources
 * @param {RAMLResource|RAMLApi} resource: the resource to get all child resources from
 * @returns {Array<{ uriParameters: Array<RAMLTypeDeclaration>, resource: RAMLResource }>} the Array
 * containing all resources and their associated uriParameters.
 */
methods.getAllResources = (uriParameters, resource) => {
  const resources = resource.resources()
    .map((child) => {
      const params = [ ...uriParameters, ...child.uriParameters() ]
      return methods.getAllResources(params, child)
    })
    .reduce(flatten, [])

  return [ { uriParameters, resource }, ...resources ]
}

/**
 * extracts all resources and their associated uriParameters from a RAML Api
 * @param {RAMLApi} api: the api to get the resources from
 * @returns {Array<{ uriParameters: Array<RAMLTypeDeclaration>, resource: RAMLResource }>} the array
 * containing all resources and their associated uriParameters.
 *
 * NOTE: calling resource.uriParameters() does not provide the expected uriParameters, as it only
 * returns the uriParameters that are defined for this specific relativeUri, and does not returns
 * the parent uriParameters. We therefore extract the uriParameters of each parent and propagate
 * them to their children, recursively.
 */
methods.getAllResourcesFromApi = (api) => {
  return api.resources()
    .map((resource) => methods.getAllResources([], resource))
    .reduce(flatten, [])
}

/**
 * converts a string into a Parameter, where the default value is the string.
 * @param {string} str: the string to converts
 * @returns {Parameter} the corresponding Parameter
 */
methods.convertStringIntoParameter = (str) => {
  return new Parameter({
    type: 'string',
    default: str
  })
}

/**
 * converts a schema into a Parameter, where the constraints are the schema.
 * @param {Object} schema: the schema to convert
 * @returns {Parameter} the corresponding Parameter
 */
methods.convertSchemaIntoPathParameter = (schema) => {
  const name = schema.$key || null
  const clone = Object.assign({}, schema)
  delete clone.$key

  return new Parameter({
    in: 'path',
    key: name,
    name: name,
    description: clone.description || null,
    type: clone.type || 'string',
    constraints: List([
      new Constraint.JSONSchema(clone)
    ])
  })
}

/**
 * iteratively constructs a sequence of Parameters by finding the preceding string of each
 * uri parameter, and appending both as parameters to the sequence.
 * @param {Object} acc: the accumulator for the reducer
 * @param {Array<Parameter>} acc.sequence: the sequence of parameters added up to this point
 * @param {string} acc.remaining: what is left of the string after appending each previous parameter
 * and its string prefix. E.g. for the string '/users/{userId}/songs/{songId}', if the sequence is
 * [ P('/users/'), P('{userId}') ], then the remaining string is '/songs/{songId}'.
 * @param {Object} schema: the schema corresponding to a uriParameter to add to the sequence
 * @returns {{ remaining: string, sequence: Array<Parameter>}} the updated accumulator
 *
 * NOTE: There can be some leftover string in the remaining field. The calling method MUST deal
 * with it accordingly
 */
methods.addPathParameterToSequence = ({ remaining, sequence }, schema) => {
  const key = '{' + schema.$key + '}'
  const [ before, ...after ] = remaining.split(key)
  const beforeParam = methods.convertStringIntoParameter(before)
  const param = methods.convertSchemaIntoPathParameter(schema)

  return { sequence: [ ...sequence, beforeParam, param ], remaining: after.join(key) }
}


/**
 * creates a simple component Parameter from a resource uri string
 * @param {string} componentName: the name of the component which this Parameter should represent
 * @param {string} resourceUri: the uri to convert into a pathname Parameter
 * @returns {Parameter} the corresponding Parameter
 */
methods.createSimpleURLComponentParameter = (componentName, resourceUri) => {
  return new Parameter({
    key: componentName,
    name: componentName,
    type: 'string',
    default: resourceUri
  })
}

/**
 * creates a simple pathname Parameter from a resource uri string
 * @param {string} resourceUri: the uri to convert into a pathname Parameter
 * @returns {Parameter} the corresponding Parameter
 */
methods.createSimplePathnameParameter = (resourceUri) => {
  return methods.createSimpleURLComponentParameter('pathname', resourceUri)
}

/**
 * creates a sequence component Parameter from a sequence of parameters
 * @param {string} componentName: the name of the component which this Parameter should represent
 * @param {Array<Parameter>} sequence: the sequence of parameter to use for the Sequence Parameter
 * @returns {Parameter} the corresponding sequence parameter
 */
methods.createSequenceURLComponentParameter = (componentName, sequence) => {
  return new Parameter({
    key: componentName,
    name: componentName,
    type: 'string',
    superType: 'sequence',
    value: List(sequence)
  })
}

/**
 * creates a sequence pathname Parameter from a sequence of parameters
 * @param {Array<Parameter>} sequence: the sequence of parameter to use for the Sequence Parameter
 * @returns {Parameter} the corresponding sequence parameter
 */
methods.createSequencePathnameParameter = (sequence) => {
  return methods.createSequenceURLComponentParameter('pathname', sequence)
}

/**
 * creates a generic URL Component from a resourceUri and a Parameter
 * @param {string} componentName: the name of the component
 * @param {string} resourceUri: the resource uri this URLComponent should represent
 * @param {Parameter} param: the parameter that describes the resourceUri
 * @returns {URLComponent} the corresponding URLComponent
 */
methods.createURLComponentFromParameter = (componentName, resourceUri, param) => {
  const urlComponent = new URLComponent({
    componentName,
    string: resourceUri,
    parameter: param,
    variableDelimiters: List([ '{', '}' ])
  })

  return urlComponent
}

/**
 * creates a pathname URL Component from a resourceUri and a Parameter
 * @param {string} resourceUri: the resource uri this URLComponent should represent
 * @param {Parameter} param: the parameter that describes the resourceUri
 * @returns {URLComponent} the corresponding URLComponent
 */
methods.createPathnameURLComponentFromParameter = (resourceUri, param) => {
  return methods.createURLComponentFromParameter('pathname', resourceUri, param)
}

/**
 * creates a pathname endpoint from a resourceUri and a simple parameter that represents the
 * resourceUri.
 * @param {string} resourceUri: the resource uri string that we want to represent with a URL
 * @param {Parameter} param: the parameter describing the resource uri
 * @returns {URL} the corresponding endpoint
 */
methods.createPathnameEndpointFromParameter = (resourceUri, param) => {
  const pathname = methods.createPathnameURLComponentFromParameter(resourceUri, param)
  return new URL().set('pathname', pathname)
}

/**
 * creates a pathname parameter from a sequence of parameters and a final parameter
 * @param {Array<Parameter>} sequence: the sequence of parameters to use for the creation of the
 * pathname parameter
 * @param {Parameter} finalParam: the parameter to append to the sequence of parameters to create
 * the full sequence of params for the Sequence Parameter
 * @returns {Parameter} the corresponding sequence parameter
 */
methods.createPathnameParameterFromSequenceAndFinalParam = (sequence, finalParam) => {
  const fullSequence = [].concat(sequence, [ finalParam ])
  const param = methods.createSequencePathnameParameter(fullSequence)
  return param
}

/**
 * converts an array of uriParameters and a RAML resource into an endpoint representing a pathname
 * @param {Array<TypeDeclaration>} uriParameters: an array of parameters that are applicable to the
 * resource complete relative uri
 * @param {RAMLResource} resource: the resource to extract the pathname from (i.e. the
 * completeRelativeUri string)
 * @returns {URL} the corresponding endpoint
 */
methods.convertUriParametersAndResourceIntoPath = (uriParameters, resource) => {
  const resourceUri = resource.completeRelativeUri()

  const { sequence, remaining } = uriParameters
    .map(uriParameter => methods.createSchema(uriParameter).map(methods.normalizeSchema)[0])
    .reduce(methods.addPathParameterToSequence, { remaining: resourceUri, sequence: [] })

  const finalComponent = methods.createSimplePathnameParameter(remaining)

  if (remaining === resourceUri) {
    return methods.createPathnameEndpointFromParameter(resourceUri, finalComponent)
  }

  const param = methods.createPathnameParameterFromSequenceAndFinalParam(
    sequence,
    finalComponent.set('key', null).set('name', null)
  )
  return methods.createPathnameEndpointFromParameter(resourceUri, param)
}

/**
 * extract interfaces from a resource
 * @param {RAMLResource} resource: the resource to extract the interfaces from
 * @returns {OrderedMap<string, Reference>} an OrderedMap containing the possible references to
 * interfaces
 */
methods.extractInterfacesFromResource = (resource) => {
  const type = resource.type()
  if (type) {
    const name = type.name() || null
    const uuid = name ? 'resourceType_' + name : null
    if (uuid) {
      return OrderedMap({
        [uuid]: new Reference({ type: 'interface', uuid })
      })
    }
  }

  return OrderedMap()
}

/**
 * creates a Context record from a contentType string
 * @param {string} contentType: the Content-Type that needs to act as a constraint for the Context
 * @returns {Context} the corresponding Context
 */
methods.createContextFromContentType = (contentType) => {
  return new Context({
    constraints: List([
      new Parameter({
        key: 'Content-Type',
        name: 'Content-Type',
        in: 'headers',
        default: contentType
      })
    ])
  })
}

/**
 * extracts a List of Contexts from a RAML request (aka RAMLMethod)
 * @param {RAMLMethod} request: the request to extract the contexts from
 * @returns {List<Context>} the corresponding list of Contexts
 */
methods.extractContextsFromRequest = (request) => {
  const bodies = request.body()
  if (!bodies) {
    return List()
  }

  const contexts = bodies
    .map(body => body.name())
    .map(methods.createContextFromContentType)

  return List(contexts)
}

/**
 * given a location, a name, and a set of constraints as a schema, creates a Parameter that applies
 * only in a list of applicableContexts
 * @param {string} location: the location of the parameter in its ParameterContainer
 * @param {List<Parameter>} contexts: a list of parameters defining the applicableContexts in which
 * this parameter can be used
 * @param {string} name: the name of the parameter
 * @param {Object} schema: the set of constraints this parameter must respect
 * @param {string} uuid: the uuid of the parameter
 * @returns {Parameter} the corresponding Parameter
 */
methods.createParameterFromSchemaAndNameAndContexts = (location, contexts, name, schema, uuid) => {
  return new Parameter({
    key: name,
    name: name,
    uuid: uuid,
    in: location,
    description: schema.description || null,
    type: schema.type || null,
    constraints: List([
      new Constraint.JSONSchema(schema)
    ]),
    applicableContexts: contexts
  })
}

/**
 * given a location (headers, queries, ...) and a list of applicableContexts, converts a schema into
 * a Parameter, in entry format
 * @param {string} location: the location of the parameter in its ParameterContainer
 * @param {List<Parameter>} contexts: the list of applicableContexts for this parameter
 * @param {Object} schema: the schema to convert into a parameter
 * @returns {Entry<string, Parameter>} the corresponding Parameter as an entry
 */
methods.convertSchemaIntoParameterEntry = (location, contexts, schema) => {
  const clone = Object.assign({}, schema)
  delete clone.$key

  const key = schema.$key || null
  const value = methods.createParameterFromSchemaAndNameAndContexts(
    location, contexts, key, clone, key
  )

  return { key, value }
}

/**
 * converts a contentType into a list of Parameters that describe applicable contexts
 * @param {string} contentType: the Content-Type to convert into applicableContexts
 * @returns {List<Parameter>} the corresponding applicableContexts
 */
methods.convertContentTypeToApplicableContexts = (contentType) => {
  return List([
    new Parameter({
      key: 'Content-Type',
      name: 'Content-Type',
      type: 'string',
      constraints: List([
        new Constraint.Enum([ contentType ])
      ])
    })
  ])
}

/**
 * converts a webform TypeDeclaration into an Array of Parameter Entries based on the keys of the
 * web form object properties.
 * @param {RAMLTypeDeclaration} parameter: the type declaration to convert
 * @param {List<Parameter>} contexts: the contexts in which this parameter is applicable
 * @param {string} contentType: the contentType associated with this parameter. This is used to
 * create unique keys for the parameter, as we could have a body that supports both url-encoded and
 * multipart with the same keys, which would cause conflict (as we're using OrderedMaps for the
 * parameters)
 * @returns {Array<Entry<string, Parameter>>} the corresponding array of Parameters as entries
 *
 * NOTE: this will drop complex web forms that have a union data-type or inherited data type
 * e.g.: ( object | array ) will be dropped
 * e.g.: [ object, object ] will be dropped
 * e.g.: Pet will be dropped
 */
methods.convertWebFormParameterIntoParameterEntries = (parameter, contexts, contentType) => {
  const schema = methods.createSchema(parameter).map(methods.normalizeSchema)[0]

  const location = 'body'

  return Object.keys(schema.properties || {}).map(($key) => {
    const currentSchema = schema.properties[$key]

    const key = contentType + '-' + $key
    const value = methods.createParameterFromSchemaAndNameAndContexts(
      location, contexts, $key, currentSchema, key
    )

    return { key, value }
  })
}

/**
 * tests whether a Content-Type is web form or not
 * @param {string} contentType: the Content-Type to test
 * @returns {boolean} true if it is a webform contentType, false otherwise
 */
methods.isWebForm = (contentType) => {
  return !!(
    contentType.match('application/x-www-form-urlencoded') ||
    contentType.match('multipart/form-data')
  )
}

/**
 * converts a standard body parameter into an array of Parameter entries. (We define standard as
 * any TypeDeclaration that is not associated with a webform contentType)
 * @param {TypeDeclaration} parameter: the type declaration to convert
 * @param {List<Parameter>} contexts: the list of contexts in which the parameter is applicable
 * @param {string} key: the key to use for the entry of the parameter (should be contentType)
 * @returns {Array<Entry<string, Parameter>>} the corresponding array of parameters as entries
 */
methods.convertStandardBodyParameterIntoParameterEntries = (parameter, contexts, key) => {
  const schema = methods.createSchema(parameter).map(methods.normalizeSchema)[0]
  const clone = Object.assign({}, schema)
  delete clone.$key

  const value = methods.createParameterFromSchemaAndNameAndContexts(
    'body', contexts, null, clone, key
  )

  return [ { key, value } ]
}

/**
 * converts a Body type declaration into an array of Parameter entries
 * @param {TypeDeclaration} parameter: the type declaration to convert
 * @returns {Array<Entry<string, Parameter>>} the corresponding array of parameters, as entries
 */
methods.convertBodyParameterIntoParameterEntries = (parameter) => {
  const contentType = parameter.name()
  const contexts = methods.convertContentTypeToApplicableContexts(contentType)
  if (contentType && methods.isWebForm(contentType)) {
    return methods.convertWebFormParameterIntoParameterEntries(parameter, contexts, contentType)
  }
  return methods.convertStandardBodyParameterIntoParameterEntries(parameter, contexts, contentType)
}

/**
 * extracts a contentType parameter from a RAML resource, or a RAML response
 * @param {RAMLMethod|RAMLResponse} requestOrResponse: the requestOrResponse to get the
 * contentType from
 * @returns {Parameter?} the corresponding contentType parameter, if it exists
 */
methods.getContentTypeParameterFromRequestOrResponse = (requestOrResponse) => {
  const bodies = requestOrResponse.body()

  if (!bodies) {
    return null
  }

  const contentTypes = bodies.map(body => body.name()).filter(v => !!v)

  if (!contentTypes.length) {
    return null
  }

  return new Parameter({
    key: 'Content-Type',
    name: 'Content-Type',
    in: 'headers',
    type: 'string',
    constraints: List([
      new Constraint.Enum(contentTypes)
    ])
  })
}

/**
 * extracts the global contentType parameter, if it exists
 * @param {RAMLApi} api: the api to get the global contentTypes from
 * @returns {Parameter?} the corresponding contentType parameter, if it exists
 */
methods.getGlobalContentTypeParameter = (api) => {
  const mediaTypes = api.mediaType()

  if (!mediaTypes) {
    return null
  }

  const contentTypes = mediaTypes.map(mediaType => mediaType.value()).filter(v => !!v)

  if (!contentTypes.length) {
    return null
  }

  return new Parameter({
    key: 'Content-Type',
    name: 'Content-Type',
    in: 'headers',
    type: 'string',
    constraints: List([
      new Constraint.Enum(contentTypes)
    ])
  })
}

/**
 * extracts a reference to the global content type of the api, if it exists
 * @param {RAMLApi?} api: the api to get the global contentType from
 * @returns {Reference?} the corresponding reference, if the global contentType exists
 */
methods.getGlobalContentTypeParameterReference = (api) => {
  if (!api) {
    return null
  }

  const mediaTypes = api.mediaType()

  if (!mediaTypes) {
    return null
  }

  const hasMediaType = !!mediaTypes.filter(mediaType => !!mediaType.value()).length
  if (hasMediaType) {
    return new Reference({
      type: 'parameter',
      uuid: 'globalMediaType'
    })
  }

  return null
}

/**
 * extracts the contentType parameter from a request, or from the global contentType of the api, if
 * no contentType is defined in the request
 * @param {RAMLApi?} api: the api to get the global contentType from
 * @param {RAMLMethod | RAMLResponse} request: the request or response from which to get the
 * contentType
 * @returns {Parameter|Reference?} the corresponding contentType parameter or reference
 *
 * NOTE: if this methods is used with a RAMLResponse, the `api` arguments MUST be set to null
 */
methods.getContentTypeParameter = (api, request) => {
  return methods.getContentTypeParameterFromRequestOrResponse(request) ||
    methods.getGlobalContentTypeParameterReference(api)
}

/**
 * creates a ParameterContainer block for queries from a RAML request
 * @param {RAMLMethod} request: the request to extract the query parameters from
 * @returns {OrderedMap<string, Parameter>} an OrderedMap containing all query parameters
 */
methods.createQueryParameterBlockFromRequest = (request) => {
  const qParams = request.queryParameters()
  const qString = request.queryString()

  if (!(qParams && qParams.length) && !qString) {
    return OrderedMap()
  }

  // FIXME: the behavior for the queryString is dubious at best
  const params = qParams && qParams.length ? qParams : [ qString ]

  const queryParameters = params
    .map(parameter => methods.createSchema(parameter).map(methods.normalizeSchema)[0])
    .map((schema) => methods.convertSchemaIntoParameterEntry('queries', List(), schema))
    .reduce(convertEntryListInMap, {})

  return OrderedMap(queryParameters)
}

/**
 * creates a ParameterContainer block for headers from a RAML request
 * @param {RAMLApi} api: the api from which to get the global contentType, if needed
 * @param {RAMLMethod} request: the request from which to get the headers
 * @returns {OrderedMap<string, Parameter>} an OrderedMap containing all headers
 */
methods.createHeaderParameterBlockFromRequest = (api, request) => {
  const params = request.headers() || []

  const headers = params
    .map(parameter => methods.createSchema(parameter).map(methods.normalizeSchema)[0])
    .map((schema) => methods.convertSchemaIntoParameterEntry('headers', List(), schema))
    .reduce(convertEntryListInMap, {})

  const contentTypeParameter = methods.getContentTypeParameter(api, request)

  if (!contentTypeParameter) {
    return OrderedMap(headers)
  }

  return OrderedMap(headers).set('Content-Type', contentTypeParameter)
}

/**
 * creates a ParameterContainer block for body parameters from a RAML request
 * @param {RAMLMethod} request: the request from which to get the body parameters
 * @returns {OrderedMap<string, Parameter>} an OrderedMap containing all the body parameters
 */
methods.createBodyParameterBlockFromRequest = (request) => {
  const bodies = request.body()

  if (!bodies) {
    return OrderedMap()
  }

  const body = bodies
    .map(methods.convertBodyParameterIntoParameterEntries)
    .reduce(flatten, [])
    .reduce(convertEntryListInMap, {})

  return OrderedMap(body)
}

/**
 * extracts a ParameterContainer with all parameters from a RAML request
 * @param {RAMLApi} api: the api from which to get the global contentType, if needed
 * @param {RAMLMethod} request: the request from which to extract all parameters
 * @returns {ParameterContainer} the corresponding ParameterContainer
 */
methods.extractParameterContainerFromRequest = (api, request) => {
  const queries = methods.createQueryParameterBlockFromRequest(request)
  const headers = methods.createHeaderParameterBlockFromRequest(api, request)
  const body = methods.createBodyParameterBlockFromRequest(request)

  const parameterContainerInstance = { headers, queries, body }

  return new ParameterContainer(parameterContainerInstance)
}

/**
 * creates a ParameterContainer Block for headers from a RAML response
 * @param {RAMLResponse} response: the response from which to get the headers
 * @returns {OrderedMap<string, Parameter>} the corresponding OrderedMap containing all headers
 */
methods.createHeaderParameterBlockFromResponse = (response) => {
  const params = response.headers() || []

  const headers = params
    .map(parameter => methods.createSchema(parameter).map(methods.normalizeSchema)[0])
    .map((schema) => {
      const { key, value } = methods.convertSchemaIntoParameterEntry('headers', List(), schema)
      return { key, value: value.set('usedIn', 'response') }
    })
    .reduce(convertEntryListInMap, {})

  const contentTypeParameter = methods.getContentTypeParameterFromRequestOrResponse(response)

  if (!contentTypeParameter) {
    return OrderedMap(headers)
  }

  return OrderedMap(headers).set('Content-Type', contentTypeParameter.set('usedIn', 'response'))
}

/**
 * creates a ParameterContainer block for body parameters from a RAML response
 * @param {RAMLResponse} response: the response to get the body parameters from
 * @returns {OrderedMap<string, Parameter>} the corresponding OrderedMap containing all body
 * parameters
 */
methods.createBodyParameterBlockFromResponse = (response) => {
  const bodies = response.body()

  if (!bodies) {
    return OrderedMap()
  }

  const body = response.body()
    .map(methods.convertBodyParameterIntoParameterEntries)
    .reduce(flatten, [])
    .map(({ key, value }) => ({ key, value: value.set('usedIn', 'response') }))
    .reduce(convertEntryListInMap, {})

  return OrderedMap(body)
}

/**
 * extract a ParameterContainer from a RAML response, containing all parameters of the RAML response
 * @param {RAMLResponse} response: the response from which to get all the parameters
 * @returns {ParameterContainer} the corresponding ParameterContainer
 */
methods.extractParameterContainerFromResponse = (response) => {
  const headers = methods.createHeaderParameterBlockFromResponse(response)
  const body = methods.createBodyParameterBlockFromResponse(response)

  const parameterContainerInstance = { headers, body }

  return new ParameterContainer(parameterContainerInstance)
}

/**
 * converts a RAML Auth reference into an Auth reference
 * @param {RAMLSecuritySchemeRef} auth: the raml auth reference
 * @returns {Reference?} the corresponding auth Reference, or null, if it is a NullRef
 *
 * TODO: check that RAML does return an Auth Ref with non name for null type authentication.
 */
methods.convertRAMLAuthRefIntoAuthReference = (auth) => {
  const uuid = auth.name()

  if (!uuid) {
    return null
  }

  return new Reference({ type: 'auth', uuid })
}

/**
 * extracts a List of Auth References from a RAML request
 * @param {RAMLMethod} request: the request from which to get all the auth references
 * @returns {List<References>} the corresponding List of Referenceså
 */
methods.extractAuthsFromRequest = (request) => {
  const securedBy = request.securedBy() || []

  const auths = securedBy
    .map(methods.convertRAMLAuthRefIntoAuthReference)

  return List(auths)
}

/**
 * converts a RAML Response into a Response Record Entry
 * @param {RAMLResponse} response: the response to converts
 * @returns {Entry<string, Response>} the corresponding Response as an entry
 */
methods.convertRAMLResponseIntoResponseEntry = (response) => {
  const code = response.code().value() || null
  const description = methods.extractDescription(response)

  const parameters = methods.extractParameterContainerFromResponse(response)
  const contexts = methods.extractContextsFromRequest(response)

  const responseInstance = { code, description, parameters, contexts }

  return { key: code, value: new Response(responseInstance) }
}

/**
 * extracts all responses from a request
 * @param {RAMLMethod} request: the request to get the RAML responses from
 * @returns {OrderedMap<string, Response>} the corresponding OrderedMap of Responses
 */
methods.extractResponsesFromRequest = (request) => {
  const responses = (request.responses() || [])
    .map(methods.convertRAMLResponseIntoResponseEntry)
    .reduce(convertEntryListInMap, {})

  return OrderedMap(responses)
}

/**
 * converts a RAML TraitRef into a ReferenceEntry
 * @param {RAMLTraitRef} trait: the trait reference to convert into a Reference
 * @returns {Entry<string, Reference>} the corresponding Reference, as an Entry
 */
methods.convertRAMLTraitRefIntoReferenceEntry = (trait) => {
  const name = trait.name()
  const uuid = 'trait_' + name

  const referenceInstance = {
    type: 'interface',
    uuid
  }

  return { key: uuid, value: new Reference(referenceInstance) }
}

/**
 * extracts all interfaces from a RAML request
 * @param {RAMLMethod} request: the request from which to extract all interfaces
 * @returns {OrderedMap<string, Reference>} the corresponding OrderedMap of References
 *
 * TODO: Add type references
 */
methods.extractInterfacesFromRequest = (request) => {
  const interfaces = (request.is() || [])
    .map(methods.convertRAMLTraitRefIntoReferenceEntry)
    .reduce(convertEntryListInMap, {})

  return OrderedMap(interfaces)
}

/**
 * tests whether the protocols of a request match the ones from the baseUri
 * @param {Array<string>?} first: the protocols from the request
 * @param {RAMLBaseUri?} baseUri: the baseUri to test against
 * @returns {boolean} true iff first is of length 1 and its first protocol is equal to the protocol
 * from the baseUri.
 */
methods.areProtocolsEqual = (first, baseUri) => {
  if (!first || !baseUri || first.length !== 1) {
    return false
  }

  const uri = baseUri.value()

  if (!uri) {
    return false
  }

  const protocol = uri.split('://')[0]

  return first[0].toLowerCase() === protocol.toLowerCase() ||
    (first[0].toLowerCase() === protocol.toLowerCase() + ':')
}

methods.createOverlayForMethodBaseEndpoint = (api, methodBase) => {
  if (
    methodBase.protocols() &&
    api &&
    !methods.areProtocolsEqual(methodBase.protocols(), api.baseUri())
  ) {
    return new URL().set('protocol', List(methodBase.protocols().map(protocol => {
      if (protocol[protocol.length - 1] !== ':') {
        return protocol.toLowerCase() + ':'
      }
      return protocol.toLowerCase()
    })))
  }

  return null
}

methods.extractMethodBaseEndpoints = (api, methodBase) => {
  const overlay = methods.createOverlayForMethodBaseEndpoint(api, methodBase)

  const endpoints = OrderedMap({
    base: new Reference({
      type: 'endpoint',
      uuid: 'base',
      overlay: overlay
    })
  })

  return endpoints
}

/**
 * converts a RAML methodBase into a Request instance
 * @param {RAMLApi} api: the api from which to get the global contentType, if needed
 * @param {RAMLMethodBase | RAMLMethod} methodBase: the method base from which to get most elements
 * of a request instance (like, name, description, contexts, ... But not the method name - 'get')
 * @returns {RequestInstance} the corresponding RequestInstance object
 */
methods.convertRAMLMethodBaseIntoRequestInstance = (api, methodBase) => {
  const endpoints = methods.extractMethodBaseEndpoints(api, methodBase)
  const name = methodBase.displayName() || null
  const description = methods.extractDescription(methodBase)
  const contexts = methods.extractContextsFromRequest(methodBase)
  const parameters = methods.extractParameterContainerFromRequest(api, methodBase)
  const auths = methods.extractAuthsFromRequest(methodBase)
  const responses = methods.extractResponsesFromRequest(methodBase)
  const interfaces = methods.extractInterfacesFromRequest(methodBase)

  const requestInstance = {
    endpoints,
    name,
    description,
    contexts,
    parameters,
    auths,
    responses,
    interfaces
  }

  return requestInstance
}

/**
 * convert a RAML request into a Request Entry
 * @param {RAMLApi} api: the api from which to get the global contentType object, if needed
 * @param {RAMLMethod} method: the RAML request to convert into a Request record
 * @returns {Entry<string, Request>} the corresponding Request, as an Entry
 */
methods.convertRAMLMethodIntoRequestEntry = (api, method) => {
  const baseInstance = methods.convertRAMLMethodBaseIntoRequestInstance(api, method)

  const requestInstance = Object.assign({}, baseInstance, { method: method.method() })

  const request = new Request(requestInstance)
  return { key: method.method(), value: request }
}

/**
 * extract all requests from a RAML resource
 * @param {RAMLApi} api: the api from which to get the global contentType if needed
 * @param {RAMLResource} resource: the resource to extract all requests from
 * @returns {OrderedMap<string, Request>} the corresponding OrderedMap containing all the Request
 * records
 */
methods.extractRequestsFromResource = (api, resource) => {
  const convertRAMLMethodIntoRequestEntry = currify(methods.convertRAMLMethodIntoRequestEntry, api)
  const requests = (resource.methods() || [])
    .map(convertRAMLMethodIntoRequestEntry)
    .reduce(convertEntryListInMap, {})

  return OrderedMap(requests)
}

/**
 * converts a RAML Resource base into a Resource instance
 * @param {RAMLApi} api: the api used to get the global contentType, if needed
 * @param {RAMLResourceBase | RAMLResource} resource: the resource base from which to get most
 * elements of a resource instance (interfaces, methods, ... but not the path, or the endpoints)
 * @returns {resourceInstance} the corresponding resource instance
 */
methods.convertRAMLResourceBaseIntoResourceInstance = (api, resource) => {
  const interfaces = methods.extractInterfacesFromResource(resource)
  const $methods = methods.extractRequestsFromResource(api, resource)

  const resourceInstance = {
    description: methods.extractDescription(resource),
    interfaces: interfaces,
    methods: $methods
  }

  return resourceInstance
}

/**
 * extracts a name for a resource, if appropriate.
 * If the displayName is equal to the relativeUri, we ignore the displayName.
 * @param {RAMLResource} resource: the resource from which to get a name
 * @returns {string?} the corresponding name, if it is appropriate
 */
methods.getNameFromResource = (resource) => {
  const displayName = resource.displayName()
  const relativeUri = resource.relativeUri()

  if (relativeUri && displayName === relativeUri.value()) {
    return null
  }

  return displayName || null
}

/**
 * converts a RAML resource into a Resource record
 * @param {RAMLApi} api: the api from which to get the global contentType, if needed
 * @param {Object} normResource: the object containing the resource and all its associated
 * uriParameters
 * @param {Array<TypeDeclaration>} normResource.uriParameters: the uriParameters of the resource
 * @param {RAMLResource} normResource.resource: the resource to convert
 * @returns {Resource} the corresponding Resource record
 */
methods.convertRAMLResourceIntoResource = (api, { uriParameters, resource }) => {
  const path = methods.convertUriParametersAndResourceIntoPath(uriParameters, resource)
  const endpoints = OrderedMap({
    base: new Reference({
      type: 'endpoint',
      uuid: 'base'
    })
  })

  const baseInstance = methods.convertRAMLResourceBaseIntoResourceInstance(api, resource)
  const name = methods.getNameFromResource(resource)

  const resourceInstance = Object.assign({}, baseInstance, {
    name: name,
    uuid: resource.absoluteUri(),
    path: path,
    endpoints: endpoints
  })

  return new Resource(resourceInstance)
}

/**
 * converts a RAML resource into a Resource record entry
 * @param {RAMLApi} api: the api from which to get the global contentType, if needed
 * @param {Object} normResource: the object containing the resource and all its associated
 * uriParameters
 * @param {Array<TypeDeclaration>} normResource.uriParameters: the uriParameters of the resource
 * @param {RAMLResource} normResource.resource: the resource to convert
 * @returns {Entry<string, Resource>} the corresponding Resource, as an Entry
 */
methods.convertRAMLResourceIntoResourceEntry = (api, normResource) => {
  const key = normResource.resource.absoluteUri()
  const value = methods.convertRAMLResourceIntoResource(api, normResource)
  return { key, value }
}

/**
 * converts a RAML resource list into a Resource record OrderedMap
 * @param {RAMLApi} api: the api from which to get the global contentType, if needed
 * @param {Array<Object>} resources: an array of normalized RAML resources
 * @returns {OrderedMap<string, Resource>} the corresponding OrderedMap of Resource records
 */
methods.convertRAMLResourceListIntoResourceMap = (api, resources) => {
  const convertRAMLResourceIntoResourceEntry = currify(
    methods.convertRAMLResourceIntoResourceEntry, api
  )
  const resourceMap = resources
    .map(convertRAMLResourceIntoResourceEntry)
    .reduce(convertEntryListInMap, {})

  return OrderedMap(resourceMap)
}

/**
 * extracts a title from a RAML api
 * @param {RAMLApi} api: api from which to get the title
 * @returns {string?} the corresponding title, if it exists
 */
methods.extractApiTitle = (api) => api.title() || null

/**
 * extracts a description from a RAML node
 * @param {RAMLNode} obj: the RAML object from which to get the description
 * @returns {string?} the corresponding description, if it exists
 */
methods.extractDescription = (obj) => {
  const descriptor = obj.description()

  if (!descriptor) {
    return null
  }

  return descriptor.value() || null
}

/**
 * extracts the Api version from a RAML api
 * @param {RAMLApi} api: the api to get the version from
 * @returns {string?} the extracted version, if it exists
 */
methods.extractApiVersion = (api) => api.version() || null

/**
 * extracts an Info record from a RAML api
 * @param {RAMLApi} api: the api from which to extract the information pertaining to the Info record
 * @returns {Info} the corresponding Info record
 */
methods.extractInfo = (api) => {
  const title = methods.extractApiTitle(api)
  const description = methods.extractDescription(api)
  const version = methods.extractApiVersion(api)
  const infoInstance = { title, description, version }
  return new Info(infoInstance)
}

// TODO improve behavior around multiple items
methods.parse = ({ options, item }) => {
  const api = item

  const group = methods.createGroups(api)
  const $resources = methods.getAllResourcesFromApi(api)
  const resources = methods.convertRAMLResourceListIntoResourceMap(api, $resources)
  const store = methods.extractStore(api)
  const info = methods.extractInfo(api)

  const apiInstance = { group, resources, info, store }

  return { options, api: new Api(apiInstance) }
}

export const __internals__ = methods
export default RAMLParser
