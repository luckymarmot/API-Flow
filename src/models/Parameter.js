import { List, Map, Record } from 'immutable'
import jsf from 'json-schema-faker'

import Model from './ModelInfo'
import Reference from './Reference'

/**
 * Metadata about the Parameter Record.
 * Used for internal serialization and deserialization
 */
const modelInstance = {
  name: 'parameter.core.models',
  version: '0.1.0'
}
const model = new Model(modelInstance)

/**
 * Default Spec for the Parameter Record.
 * @property {string} in: the location of the parameter (header, query, body, ...). Mainly used for
 * shared parameters, as the ParameterStore is location agnostic
 * @property {string} usedIn: the type of object that holds the parameter (can be either request or
 * response)
 * @property {string} uuid:  a string that uniquely identifies this parameter (not a true uuid)
 * @property {string} key: the key of the Parameter as used in the header, query, body, etc.
 * @property {string} name?: a humand readable name for the Parameter like `Access token`
 * @property {string} description: a description of the purpose of the parameter
 * @property {List<*>} examples: a List of values that are valid representations of the parameter
 * @property {string} type: the JSON type of the Parameter
 * @property {string} format: the format of the Parameter (highly coupled with type)
 * @property {any} default: the default value of the Parameter
 * @property {boolean} required: whether the Parameter is mandatory or not.
 * @property {string} superType: some Parameters have complex representations, like sequences of
 * string Parameters that combine together create what would be a DynamicString in Paw or a string
 * with environment variables in Postman. the superType helps further define what the behavior of
 * the parameter is, without supercharging other fields (like format or type) with semantics that
 * are only relevant inside the model
 * @property {any} value: an object that is relevant to the construction of the Parameter, depending
 * on the superType. For instance, it could be a List<Parameter>, if the superType is "sequence".
 * @property {List<Constraint>} constraints: a List of Constraint that the Parameter must respect.
 * it is used to generate a JSON Schema out of the Parameter, and also to test if a value is valid
 * with respect to the Parameter. For instance, 'application/json' is not a valid Value for a
 * Parameter with the constraints: List([ new Contraint.Enum([ 'application/xml' ]) ])
 * @property {List<Parameter>} applicableContexts: a List of Parameters that help define whether
 * the Parameter can used in a given Context. @see methods.@isValid for more information
 * @property {Map<*, Reference)>} interfaces: a List of Interfaces implemented by the Parameter.
 * This is used to extract shared features at difference levels (like Resource, Request, Response,
 * URL, and Parameter).
 */
const ParameterSpec = {
  _model: model,
  in: null,
  usedIn: 'request',
  uuid: null,
  key: null,
  name: null,
  description: null,
  examples: List(),
  type: null,
  format: null,
  default: null,
  required: false,
  superType: null,
  value: null,
  constraints: List(),
  applicableContexts: List(),
  interfaces: Map()
}

/**
 * Holds all the internal methods used in tandem with a Parameter
 */
const methods = {}

/**
 * The Parameter Record
 */
export class Parameter extends Record(ParameterSpec) {
  getJSONSchema(useFaker = true, replaceRefs = true) {
    return methods.getJSONSchema(this, useFaker, replaceRefs)
  }

  generate(useDefault, _constraintSet) {
    return methods.generate(this, useDefault, _constraintSet)
  }

  validate(value) {
    return methods.validate(this, value)
  }

  isValid(param) {
    return methods.isValid(this, param)
  }
}

/**
 * merges a constraint schema with a schema
 * @param {schema} set: the schema to update
 * @param {schema} constraint: the constraint schema to merge
 * @returns {schema} the updated schema
 */
methods.mergeConstraintInSchema = (set, constraint) => {
  const obj = constraint.toJSONSchema()
  Object.assign(set, obj)
  return set
}

/**
 * adds constraints from a Parameter to a schema
 * @param {Parameter} param: the parameter to get the constraints from
 * @param {schema} schema: the schema to update
 * @returns {schema} the updated schema
 */
methods.addConstraintsToSchema = (param, schema) => {
  const constraints = param.get('constraints')
  const _schema = constraints.reduce(methods.mergeConstraintInSchema, schema)
  return _schema
}

/**
 * normalizes the type from a Parameter
 * @param {string | any} type: the type to normalize
 * @returns {string} the infered type
 */
methods.inferType = (type) => {
  if (!type || typeof type !== 'string') {
    return 'string'
  }

  if (type.match(/double/i) || type.match(/float/i)) {
    return 'number'
  }

  if (type.match(/date/i)) {
    return 'string'
  }

  return type || 'string'
}

/**
 * adds type from a Parameter to a schema
 * @param {Parameter} param: the parameter to get the type from
 * @param {schema} schema: the schema to update
 * @returns {schema} the updated schema
 */
methods.addTypeFromParameterToSchema = (param, schema) => {
  const types = [
    'integer', 'number', 'array', 'string', 'object', 'boolean', 'null'
  ]

  let type = param.get('type') || ''

  if (types.indexOf(type) === -1) {
    type = methods.inferType(type)
  }

  schema.type = type
  return schema
}

/**
 * adds title from a Parameter to a schema
 * @param {Parameter} param: the parameter to get the title from
 * @param {schema} schema: the schema to update
 * @returns {schema} the updated schema
 */
methods.addTitleFromParameterToSchema = (param, schema) => {
  const key = param.get('key')
  if (key) {
    schema['x-title'] = key
  }

  return schema
}

/**
 * adds the default value from a Parameter to a schema
 * @param {Parameter} param: the parameter to get the default value from
 * @param {schema} schema: the schema to update
 * @returns {schema} the updated schema
 */
methods.addDefaultFromParameterToSchema = (param, schema) => {
  const _default = param.get('default')
  if (_default !== null && typeof _default !== 'undefined') {
    schema.default = param.get('default')
  }

  return schema
}

/**
 * transforms a simple Parameter into a schema
 * @param {Parameter} simple: the parameter to transform
 * @returns {schema} the corresponding schema
 */
methods.getJSONSchemaFromSimpleParameter = (simple) => {
  let schema = {}
  schema = methods.addConstraintsToSchema(simple, schema)
  schema = methods.addTypeFromParameterToSchema(simple, schema)
  schema = methods.addTitleFromParameterToSchema(simple, schema)
  schema = methods.addDefaultFromParameterToSchema(simple, schema)

  return schema
}

/**
 * extracts the sequence from a SequenceParameter into a schema
 * @param {Parameter} sequenceParam: the parameter to get the sequence from
 * @param {schema} schema: the schema to update
 * @param {boolean} useFaker: whether we should use Faker or not
 * @returns {schema} the updated schema
 */
methods.addSequenceToSchema = (sequenceParam, schema, useFaker = true) => {
  const sequence = sequenceParam.get('value')
  if (!sequence) {
    return schema
  }

  schema['x-sequence'] = sequence.map((
        param
    ) => {
    return methods.getJSONSchema(param, useFaker)
  }).toJS()

  schema.format = 'sequence'

  return schema
}

/**
 * transforms a SequenceParameter into a schema
 * @param {Parameter} sequenceParam: the parameter to transform
 * @param {boolean} useFaker: whether we should use Faker or not
 * @returns {schema} the corresponding schema
 */
methods.getJSONSchemaFromSequenceParameter = (sequenceParam, useFaker = true) => {
  let schema = {}
  schema = methods.addConstraintsToSchema(sequenceParam, schema)
  schema = methods.addTypeFromParameterToSchema(sequenceParam, schema)
  schema = methods.addTitleFromParameterToSchema(sequenceParam, schema)
  schema = methods.addSequenceToSchema(sequenceParam, schema, useFaker)
  return schema
}

/**
 * extracts the items field from an ArrayParameter into a schema
 * @param {Parameter} param: the parameter to transform
 * @param {schema} schema: the schema to update
 * @param {boolean} useFaker: whether we should use Faker or not
 * @returns {schema} the updated schema
 */
methods.addItemstoSchema = (param, schema, useFaker = true) => {
  const items = param.get('value')
  if (items instanceof Parameter) {
    schema.items = methods.getJSONSchema(items, useFaker)
  }

  return schema
}

/**
 * transforms an ArrayParameter into a schema
 * @param {Parameter} arrayParam: the parameter to transform
 * @param {boolean} useFaker: whether we should use Faker or not
 * @returns {schema} the corresponding schema
 */
methods.getJSONSchemaFromArrayParameter = (arrayParam, useFaker = true) => {
  let schema = {}
  schema = methods.addConstraintsToSchema(arrayParam, schema)
  schema = methods.addTypeFromParameterToSchema(arrayParam, schema)
  schema = methods.addTitleFromParameterToSchema(arrayParam, schema)
  schema = methods.addItemstoSchema(arrayParam, schema, useFaker)

  return schema
}

/**
 * applies the reference field from a ReferenceParameter to a schema
 * @param {Parameter} param: the parameter to get the reference from
 * @param {schema} schema: the schema to update
 * @returns {schema} the updated schema
 */
methods.addReferenceToSchema = (param, schema) => {
  const ref = param.get('value')

  if (!(ref instanceof Reference)) {
    return schema
  }

  schema.$ref = ref.get('uuid')
  return schema
}

/**
 * transforms a ReferenceParameter into a schema
 * @param {Parameter} refParam: the parameter to transform
 * @returns {schema} the corresponding schema
 */
methods.getJSONSchemaFromReferenceParameter = (refParam) => {
  let schema = {}

  schema = methods.addConstraintsToSchema(refParam, schema)
  schema = methods.addTitleFromParameterToSchema(refParam, schema)
  schema = methods.addReferenceToSchema(refParam, schema)

  return schema
}

/**
 * adds Faker fields if applicable based on format of Parameter
 * @param {Parameter} param: the parameter to get the reference from
 * @param {schema} schema: the schema to update
 * @returns {schema} the updated schema
 */
methods.updateSchemaWithFaker = (param, schema) => {
  const fakerFormatMap = {
    email: {
      faker: 'internet.email'
    },
      // base64 endoded
    byte: {
      pattern: '^(?:[A-Za-z0-9+/]{4})*' +
                   '(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$'
    },
      // not really binary but who cares
    binary: {
      pattern: '^.*$'
    },
    'date-time': {
      faker: 'date.recent'
    },
    password: {
      pattern: '^.*$'
    },
    sequence: {
      format: 'sequence'
    }
  }

  const format = param.get('format') || ''

  if (fakerFormatMap[format]) {
    const constraint = fakerFormatMap[format]
    const key = Object.keys(constraint)[0]
    if (key && !schema[key]) {
      Object.assign(schema, constraint)
    }
  }

  return schema
}

/**
 * unescapes a URI fragment
 * @param {string} uriFragment: the uri fragment to unescape
 * @returns {string} the updated schema
 */
methods.unescapeURIFragment = (uriFragment) => {
  return uriFragment.replace(/~1/g, '/').replace(/~0/g, '~')
}

/**
 * replaces References in a pseudo-schema with default values to make it a simple schema
 * @param {object} obj: the pseudo-schema to transform in a schema
 * @returns {schema} the corresponding schema
 */
methods.replaceRefs = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }

  if (obj.$ref) {
    if (obj.$ref instanceof Reference) {
      obj.$ref = obj.$ref.get('relative') || obj.$ref.get('uri')
    }

    obj.default = methods
          .unescapeURIFragment(obj.$ref.split('/').slice(-1)[0])
    obj.type = 'string'
    delete obj.$ref
  }

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i += 1) {
      const content = obj[i]
      obj[i] = methods.replaceRefs(content)
    }
  }
  else {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        obj[key] = methods.replaceRefs(obj[key])
      }
    }
  }

  return obj
}

/**
 * replaces References in a pseudo-schema with $refs to make it a valid schema
 * @param {object} obj: the pseudo-schema to transform in a schema
 * @returns {schema} the corresponding schema
 */
methods.simplifyRefs = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }

  if (obj.$ref instanceof Reference) {
    obj.$ref = obj.$ref.get('uuid')
  }

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i += 1) {
      const content = obj[i]
      obj[i] = methods.simplifyRefs(content)
    }
  }
  else {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        obj[key] = methods.simplifyRefs(obj[key])
      }
    }
  }

  return obj
}

/**
 * tests wether a Parameter is simple (standard type, no weird things)
 * @param {Parameter} param: the parameter to test
 * @returns {boolean} the corresponding schema
 */
methods.isSimpleParameter = (
  param
) => {
  if (param.get('superType')) {
    return false
  }

  // if no type is provided assume simple
  const type = param.get('type') || 'string'

  const types = [
    'integer', 'number', 'string', 'object', 'boolean', 'null'
  ]

  if (types.indexOf(type) === -1) {
    return false
  }

  return true
}

/**
 * tests wether a Parameter is a SequenceParameter
 * @param {Parameter} param: the parameter to test
 * @returns {boolean} the corresponding schema
 */
methods.isSequenceParameter = (
  param
) => {
  const superType = param.get('superType') || ''

  return superType === 'sequence'
}

/**
 * tests wether a Parameter is an ArrayParameter
 * @param {Parameter} param: the parameter to test
 * @returns {boolean} the corresponding schema
 */
methods.isArrayParameter = (
  param
) => {
  const type = param.get('type') || ''

  return type === 'array'
}

/**
 * tests wether a Parameter is a ReferenceParameter
 * @param {Parameter} param: the parameter to test
 * @returns {boolean} the corresponding schema
 */
methods.isReferenceParameter = (
  param
) => {
  const superType = param.get('superType') || ''

  return superType === 'reference'
}

/**
 * transforms a Parameter into a JSON Schema
 * @param {Parameter} parameter: the parameter to transform
 * @param {boolean} useFaker: whether to use Faker or not
 * @param {boolean} replaceRefs: whether to replace refs with simple strings or to replace them with
 * $refs
 * @returns {schema} the corresponding schema
 */
methods.getJSONSchema = (
    parameter,
    useFaker = true,
    replaceRefs = true
) => {
  let schema = {}

  const isSimple = methods.isSimpleParameter(parameter)
  if (isSimple) {
    schema = methods.getJSONSchemaFromSimpleParameter(parameter)
  }

  const isSequence = methods.isSequenceParameter(parameter)
  if (isSequence) {
    schema = methods.getJSONSchemaFromSequenceParameter(parameter, useFaker)
  }

  const isArray = methods.isArrayParameter(parameter)
  if (isArray) {
    schema = methods.getJSONSchemaFromArrayParameter(parameter, useFaker)
  }

  const isReference = methods.isReferenceParameter(parameter)
  if (isReference) {
    schema = methods.getJSONSchemaFromReferenceParameter(parameter)
  }

  if (useFaker) {
    schema = methods.updateSchemaWithFaker(parameter, schema)
  }

  if (replaceRefs) {
    schema = methods.replaceRefs(schema)
  }
  else {
    schema = methods.simplifyRefs(schema)
  }

  return schema
}

/**
 * Gets the default value of a Parameter, if applicable
 * @param {Parameter} parameter: the parameter to get the default value of
 * @returns {any} the default value
 */
methods.generateFromDefault = (parameter) => {
  const _default = parameter.get('default')
  if (_default !== null && typeof _default !== 'undefined') {
    return _default
  }

  return null
}

/**
 * Adds Faker fields to improve generation, if applicable
 * @param {schema} schema: the schema to improve the generation of
 * @returns {schema} the improved schema
 */
methods.addFakerFunctionalities = (
  schema
) => {
  if (
        schema.type === 'string' &&
        schema.format !== 'sequence' &&
        !schema.faker &&
        !schema['x-faker']
    ) {
    schema['x-faker'] = 'company.bsNoun'
  }

  return schema
}

/**
 * generates a value from a Parameter or a JSON Schema.
 * @param {Parameter} parameter: the Parameter to get a JSON Schema from
 * @param {boolean} useDefault: whether to use the default value or not
 * @param {schema} _schema: an optional schema to generate from. If this schema is provided, the
 * Parameter is ignored.
 * @returns {any} the generated value
 */
methods.generate = (
    parameter,
    useDefault,
    _schema
) => {
  if (useDefault) {
    const _default = methods.generateFromDefault(parameter)
    if (_default !== null) {
      return _default
    }
  }

  let schema = JSON.parse(JSON.stringify(
        _schema || methods.getJSONSchema(parameter)
    ))

  schema = methods.replaceRefs(schema)
  schema = methods.addFakerFunctionalities(schema)

  jsf.format('sequence', (gen, $schema) => {
    let result = ''
    for (const item of $schema['x-sequence']) {
      if (useDefault && typeof item.default !== 'undefined' && item.default !== null) {
        item.enum = [ item.default ]
      }
      else if (
                item.type === 'string' &&
                item.format !== 'sequence' &&
                !item.faker &&
                !item['x-faker']
            ) {
        item['x-faker'] = 'company.bsNoun'
      }
      result += jsf(item)
    }
    return result
  })


  const generated = jsf(schema)
  return generated
}

/**
 * validates a value against the constraints of a Parameter
 * @param {Parameter} parameter: the Parameter to test the value against
 * @param {any} value: the value to test
 * @returns {boolean} whether the value respects all the constraints of the Parameter or not
 */
methods.validate = (
    parameter,
    value
) => {
  const constraints = parameter.get('constraints')
  return constraints.reduce((
        bool,
        cond
    ) => {
    return bool && cond.evaluate(value)
  }, true)
}

/**
 * tests whether there is an applicableContext in which the param is validated
 * @param {Parameter} source: the Parameter to get the applicableContexts from
 * @param {Parameter} param: the param to validate
 * @returns {boolean} whether the param respects all the constraints of one of the
 * applicableContexts or not
 */
methods.isValid = (
    source,
    param
) => {
  const list = source.get('applicableContexts')
    // No external constraint
  if (list.size === 0) {
    return true
  }

  return list.reduce((
        bool,
        _param
    ) => {
    // && has precedence on ||
    // === (1 || (2a && 2b))
    return bool || (
      _param.get('key') === param.get('key') &&
      _param.validate(param.get('default'))
    )
  }, false)
}

export const __internals__ = methods
export default Parameter
