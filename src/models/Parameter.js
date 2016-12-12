// @flow
import { List, Record } from 'immutable'
import jsf from 'json-schema-faker'

import Model from './ModelInfo'
import Reference from './references/Reference'

import type { SchemaType } from './Utils'
import type { Constraint } from './Constraint'

export type ParameterType = {
  _model: Model,
  key: ?string,
  value: ?any,
  type: ?string,
  format: ?string,
  required: boolean,
  description: ?string,
  example: ?(List<*>),
  internals: List<Constraint>,
  externals: List<*>
};

const ParameterSpec: ParameterType = {
    _model: new Model({
        name: 'parameter.core.models',
        version: '0.1.0'
    }),
    key: null,
    value: null,
    type: null,
    format: null,
    name: null,
    required: false,
    description: null,
    example: null,
    internals: List(),
    externals: List()
}

const methods = {}

export class Parameter extends Record(ParameterSpec) {
    getJSONSchema(
        useFaker: boolean = true,
        replaceRefs: boolean = true
    ): SchemaType {
        return methods.getJSONSchema(this, useFaker, replaceRefs)
    }

    generate(
        useDefault: boolean,
        _constraintSet: SchemaType
    ): ?any {
        return methods.generate(this, useDefault, _constraintSet)
    }

    validate(value: ?any): boolean {
        return methods.validate(this, value)
    }

    isValid(param: Parameter): boolean {
        return methods.isValid(this, param)
    }
}

methods.addConstraintsToSchema = (
    param: Parameter,
    schema: SchemaType
): SchemaType => {
    const constraints: List<Constraint> = param.get('internals')

    return constraints.reduce((
        set: SchemaType,
        constraint: Constraint
    ): SchemaType => {
        let obj = constraint.toJSONSchema()
        Object.assign(set, obj)
        return set
    }, schema)
}

methods.inferType = (type: string): string => {
    if (type.match(/double/) || type.match(/float/)) {
        return 'number'
    }

    if (type.match(/date/)) {
        return 'string'
    }

    return type || 'string'
}

methods.addTypeFromParameterToSchema = (
    param: Parameter,
    schema: SchemaType
): SchemaType => {
    const types: Array<string> = [
        'integer', 'number', 'array', 'string', 'object', 'boolean', 'null'
    ]

    let type: string = param.get('type') || ''

    if (types.indexOf(type) === -1) {
        type = methods.inferType(type)
    }

    schema.type = type
    return schema
}

methods.addTitleFromParameterToSchema = (
    param: Parameter,
    schema: SchemaType
): SchemaType => {
    if (param.get('key')) {
        schema['x-title'] = param.get('key')
    }

    return schema
}

methods.addDefaultFromParameterToSchema = (
    param: Parameter,
    schema: SchemaType
): SchemaType => {
    if (param.get('default') || param.get('value')) {
        schema.default = param.get('default') || param.get('value')
    }

    return schema
}

methods.getJSONSchemaFromSimpleParameter = (
    simple: Parameter,
): SchemaType => {
    let schema: SchemaType = {}
    schema = methods.addConstraintsToSchema(simple, schema)
    schema = methods.addTypeFromParameterToSchema(simple, schema)
    schema = methods.addTitleFromParameterToSchema(simple, schema)
    schema = methods.addDefaultFromParameterToSchema(simple, schema)

    return schema
}

methods.addSequenceToSchema = (
    sequenceParam: Parameter,
    schema: SchemaType,
    useFaker: boolean = true
): SchemaType => {
    const sequence = sequenceParam.get('value')
    if (!sequence) {
        return schema
    }

    schema['x-sequence'] = sequence.map((
        param: Parameter
    ): SchemaType => {
        return methods.getJSONSchema(param, useFaker)
    })
    return schema
}

methods.getJSONSchemaFromSequenceParameter = (
    sequenceParam: Parameter,
    useFaker: boolean = true
): SchemaType => {
    let schema = {}
    schema = methods.addConstraintsToSchema(sequenceParam, schema)
    schema = methods.addTypeFromParameterToSchema(sequenceParam, schema)
    schema = methods.addTitleFromParameterToSchema(sequenceParam, schema)
    schema = methods.addSequenceToSchema(sequenceParam, schema, useFaker)

    return schema
}

methods.addItemstoSchema = (
    param: Parameter,
    schema: SchemaType,
    useFaker: boolean = true
): SchemaType => {
    let items = param.get('value')
    if (items instanceof Parameter) {
        schema.items = methods.getJSONSchema(items, useFaker)
    }

    return schema
}

methods.getJSONSchemaFromArrayParameter = (
    arrayParam: Parameter,
    useFaker: boolean = true
): SchemaType => {
    let schema = {}
    schema = methods.addConstraintsToSchema(arrayParam, schema)
    schema = methods.addTypeFromParameterToSchema(arrayParam, schema)
    schema = methods.addTitleFromParameterToSchema(arrayParam, schema)
    schema = methods.addItemstoSchema(arrayParam, schema, useFaker)

    return schema
}

methods.addReferenceToSchema = (
  param: Parameter,
  schema: SchemaType
): SchemaType => {
    let ref = param.get('value')
    if (!(ref instanceof Reference)) {
        return schema
    }

    if (typeof ref.get('value') === 'string') {
        schema.type = 'string'
        schema.default = ref.get('value')
        return schema
    }

    if (
      ref.get('value') &&
      typeof ref.get('value') === 'object'
    ) {
        Object.assign(schema, ref.get('value'))
        return schema
    }

    schema.$ref = ref.get('relative') || ref.get('uri')
    return schema
}

methods.getJSONSchemaFromReferenceParameter = (
    refParam: Parameter
): SchemaType => {
    let schema = {}

    schema = methods.addConstraintsToSchema(refParam, schema)
    schema = methods.addTitleFromParameterToSchema(refParam, schema)
    schema = methods.addReferenceToSchema(refParam, schema)

    return schema
}

methods.updateSchemaWithFaker = (
    param: Parameter,
    schema: SchemaType
): SchemaType => {
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

    const format = param.get('type')

    if (fakerFormatMap[format]) {
        let constraint = fakerFormatMap[format]
        Object.assign(schema, constraint)
    }

    return schema
}

methods.unescapeURIFragment = (uriFragment: string): string => {
    return uriFragment.replace(/~1/g, '/').replace(/~0/g, '~')
}

methods.replaceRefs = (obj: any): any => {
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
            let content = obj[i]
            obj[i] = methods.replaceRefs(content)
        }
    }
    else {
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                obj[key] = methods.replaceRefs(obj[key])
            }
        }
    }

    return obj
}

methods.simplifyRefs = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) {
        return obj
    }

    if (obj.$ref instanceof Reference) {
        obj.$ref = obj.$ref.get('relative') || obj.$ref.get('uri')
    }

    if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i += 1) {
            let content = obj[i]
            obj[i] = methods.simplifyRefs(content)
        }
    }
    else {
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                obj[key] = methods.simplifyRefs(obj[key])
            }
        }
    }

    return obj
}

methods.isSimpleParameter = (
  param: Parameter
): boolean => {
    let type: string = param.get('type') || ''

    let types: Array<string> = [
        'integer', 'number', 'string', 'object', 'boolean', 'null'
    ]

    if (types.indexOf(type) === -1) {
        return true
    }

    return false
}

methods.isSequenceParameter = (
  param: Parameter
): boolean => {
    let format: string = param.get('format') || ''

    return format === 'sequence'
}

methods.isArrayParameter = (
  param: Parameter
): boolean => {
    let type: string = param.get('type') || ''

    return type === 'array'
}

methods.isReferenceParameter = (
  param: Parameter
): boolean => {
    let type: string = param.get('type') || ''

    return type === 'reference'
}

methods.getJSONSchema = (
    parameter: Parameter,
    useFaker: boolean = true,
    replaceRefs: boolean = true
): SchemaType => {
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

methods.generateFromDefault = (parameter: Parameter): ?any => {
    return parameter.get('value') !== null
}

methods.addFakerFunctionalities = (
  schema: SchemaType
): SchemaType => {
    if (
        schema.type === 'string' &&
        schema.format !== 'sequence' &&
        !schema.faker &&
        !schema['x-faker']
    ) {
        schema['x-faker'] = 'company.bsNoun'
    }

    jsf.format('sequence', (gen: any, _schema: SchemaType): any => {
        let result = ''
        for (let item of _schema['x-sequence']) {
            if (
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

    return schema
}

methods.generate = (
    parameter: Parameter,
    useDefault: boolean,
    _schema: SchemaType
): ?any => {
    if (useDefault) {
        const _default = methods.generateFromDefault(parameter)
        if (_default) {
            return _default
        }
    }

    let schema = JSON.parse(JSON.stringify(
        _schema || methods.getJSONSchema(parameter)
    ))

    schema = methods.replaceRefs(schema)
    schema = methods.addFakerFunctionalities(schema)

    if (schema.default) {
        schema.enum = [ schema.default ]
    }

    let generated = jsf(schema)
    return generated
}

methods.validate = (
    parameter: Parameter,
    value: ?any
): boolean => {
    const constraints = parameter.get('internals')
    return constraints.reduce((
        bool: boolean,
        cond: Constraint
    ): boolean => {
        return bool && cond.evaluate(value)
    }, true)
}

methods.isValid = (
    source: Parameter,
    param: Parameter
): boolean => {
    let list = source.get('externals')
    // No external constraint
    if (list.size === 0) {
        return true
    }

    return list.reduce((
        bool: boolean,
        _param: Parameter
    ): boolean => {
        // && has precedence on ||
        return bool ||
            _param.get('key') === param.get('key') &&
            _param.validate(param.get('value'))
    }, false)
}

export const __internals__ = methods
export default Parameter
