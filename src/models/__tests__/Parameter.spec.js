/* eslint-disable max-nested-callbacks */
import { Record, List } from 'immutable'
import expect, { spyOn, restoreSpies } from 'expect'

import { Parameter, __internals__ } from '../Parameter'
import Reference from '../references/Reference'
import Constraint from '../Constraint'

describe('models/Parameter.js', () => {
  afterEach(() => restoreSpies())
  describe('{ Parameter }', () => {
    it('should be a Record', () => {
      const instance = new Parameter()

      expect(instance).toBeA(Record)
    })

    describe('#fields', () => {
      it('should have a `key` field', () => {
        const key = 'test'
        const data = { key }

        const instance = new Parameter(data)

        expect(instance.get('key')).toEqual(key)
      })

      it('should have a `default` field', () => {
        const value = 'test'
        const data = { default: value }

        const instance = new Parameter(data)

        expect(instance.get('default')).toEqual(value)
      })

      it('should have a `value` field', () => {
        const value = 'test'
        const data = { value }

        const instance = new Parameter(data)

        expect(instance.get('value')).toEqual(value)
      })

      it('should have a `format` field', () => {
        const format = 'test'
        const data = { format }

        const instance = new Parameter(data)

        expect(instance.get('format')).toEqual(format)
      })

      it('should have a `name` field', () => {
        const name = 'test'
        const data = { name }

        const instance = new Parameter(data)

        expect(instance.get('name')).toEqual(name)
      })

      it('should have a `required` field', () => {
        const required = 'test'
        const data = { required }

        const instance = new Parameter(data)

        expect(instance.get('required')).toEqual(required)
      })

      it('should have a `description` field', () => {
        const description = 'test'
        const data = { description }

        const instance = new Parameter(data)

        expect(instance.get('description')).toEqual(description)
      })

      it('should have an `example` field', () => {
        const example = 'test'
        const data = { example }

        const instance = new Parameter(data)

        expect(instance.get('example')).toEqual(example)
      })

      it('should have an `constraints` field', () => {
        const constraints = 'test'
        const data = { constraints }

        const instance = new Parameter(data)

        expect(instance.get('constraints')).toEqual(constraints)
      })

      it('should have an `applicableContexts` field', () => {
        const applicableContexts = 'test'
        const data = { applicableContexts }

        const instance = new Parameter(data)

        expect(instance.get('applicableContexts')).toEqual(applicableContexts)
      })
    })

    describe('-methods', () => {
      describe('@getJSONSchema', () => {
        it('should call __internals__.getJSONSchema', () => {
          const expected = 123141
          spyOn(__internals__, 'getJSONSchema').andReturn(expected)

          const param = new Parameter()
          const actual = param.getJSONSchema()

          expect(actual).toEqual(expected)
          expect(__internals__.getJSONSchema).toHaveBeenCalled()
        })

        it('should call __internals__.getJSONSchema with correct default arguments', () => {
          const expected = 123141
          spyOn(__internals__, 'getJSONSchema').andReturn(expected)

          const param = new Parameter()
          const actual = param.getJSONSchema()

          expect(actual).toEqual(expected)
          expect(__internals__.getJSONSchema).toHaveBeenCalledWith(param, true, true)
        })

        it('should call __internals__.getJSONSchema with correct arguments', () => {
          const expected = 123141
          spyOn(__internals__, 'getJSONSchema').andReturn(expected)

          const param = new Parameter()
          const actual = param.getJSONSchema(false, false)

          expect(actual).toEqual(expected)
          expect(__internals__.getJSONSchema).toHaveBeenCalled(param, false, false)
        })
      })

      describe('@generate', () => {
        it('should call __internals__.generate', () => {
          const expected = 123141
          spyOn(__internals__, 'generate').andReturn(expected)

          const param = new Parameter()
          const actual = param.generate()

          expect(actual).toEqual(expected)
          expect(__internals__.generate).toHaveBeenCalled()
        })

        it('should call __internals__.generate with correct arguments', () => {
          const expected = 123141
          spyOn(__internals__, 'generate').andReturn(expected)

          const param = new Parameter()
          const actual = param.generate(false, { a: 123 })

          expect(actual).toEqual(expected)
          expect(__internals__.generate).toHaveBeenCalledWith(param, false, { a: 123 })
        })
      })

      describe('@validate', () => {
        it('should call __internals__.validate', () => {
          const expected = 123141
          spyOn(__internals__, 'validate').andReturn(expected)

          const param = new Parameter()
          const actual = param.validate()

          expect(actual).toEqual(expected)
          expect(__internals__.validate).toHaveBeenCalled()
        })

        it('should call __internals__.validate with correct arguments', () => {
          const expected = 123141
          spyOn(__internals__, 'validate').andReturn(expected)

          const param = new Parameter()
          const actual = param.validate(1234)

          expect(actual).toEqual(expected)
          expect(__internals__.validate).toHaveBeenCalledWith(param, 1234)
        })
      })

      describe('@isValid', () => {
        it('should call __internals__.isValid', () => {
          const expected = 123141
          spyOn(__internals__, 'isValid').andReturn(expected)

          const param = new Parameter()
          const actual = param.isValid()

          expect(actual).toEqual(expected)
          expect(__internals__.isValid).toHaveBeenCalled()
        })

        it('should call __internals__.isValid with correct arguments', () => {
          const expected = 123141
          spyOn(__internals__, 'isValid').andReturn(expected)

          const param = new Parameter()
          const actual = param.isValid(12345)

          expect(actual).toEqual(expected)
          expect(__internals__.isValid).toHaveBeenCalledWith(param, 12345)
        })
      })
    })
  })

  describe('@mergeConstraintInSchema', () => {
    it('should call constraint.toJSONSchema', () => {
      const set = { abc: 123 }
      const constraint = new Constraint.Enum()

      spyOn(constraint, 'toJSONSchema').andReturn({ enum: [ 1, 2, 3 ] })
      __internals__.mergeConstraintInSchema(set, constraint)

      expect(constraint.toJSONSchema).toHaveBeenCalled()
    })

    it('should merge constraint.toJSONSchema with schema', () => {
      const schema = { type: 'integer' }
      const constraint = new Constraint.Enum()

      spyOn(constraint, 'toJSONSchema').andReturn({ enum: [ 1, 2, 3 ] })

      const expected = {
        type: 'integer',
        enum: [ 1, 2, 3 ]
      }

      const actual = __internals__.mergeConstraintInSchema(schema, constraint)

      expect(actual).toEqual(expected)
    })
  })

  describe('@addConstraintsToSchema', () => {
    it('should call __internals__.mergeConstraintInSchema for each constraint', () => {
      const parameter = new Parameter({
        constraints: List([
          new Constraint.Enum([ 1, 2, 3 ]),
          new Constraint.Maximum(2)
        ])
      })
      const schema = {}

      spyOn(__internals__, 'mergeConstraintInSchema').andReturn({ type: 'string' })

      __internals__.addConstraintsToSchema(parameter, schema)

      expect(__internals__.mergeConstraintInSchema.calls.length).toEqual(2)
    })

    it('should merge the schemas from all the constraints', () => {
      const parameter = new Parameter({
        constraints: List([
          new Constraint.Enum([ 1, 2, 3 ]),
          new Constraint.Maximum(2)
        ])
      })
      const schema = { type: 'integer' }

      const expected = {
        type: 'integer',
        enum: [ 1, 2, 3 ],
        maximum: 2
      }
      const actual = __internals__.addConstraintsToSchema(parameter, schema)

      expect(actual).toEqual(expected)
    })
  })

  describe('@inferType', () => {
    it('should return number if type is double or float', () => {
      const expected = 'number'
      let actual

      const input1 = 'double'
      const input2 = 'float'

      const input3 = 'DoUble'
      const input4 = 'FloAt'

      actual = __internals__.inferType(input1)
      expect(actual).toEqual(expected)

      actual = __internals__.inferType(input2)
      expect(actual).toEqual(expected)

      actual = __internals__.inferType(input3)
      expect(actual).toEqual(expected)

      actual = __internals__.inferType(input4)
      expect(actual).toEqual(expected)
    })

    it('should return string if type is date', () => {
      const type = 'date'
      const expected = 'string'
      const actual = __internals__.inferType(type)

      expect(actual).toEqual(expected)
    })

    it('should return string if no type provided', () => {
      const type = null
      const expected = 'string'
      const actual = __internals__.inferType(type)

      expect(actual).toEqual(expected)
    })

    it('should return type otherwise', () => {
      const type = 'complex-type'
      const expected = type
      const actual = __internals__.inferType(type)

      expect(actual).toEqual(expected)
    })
  })

  describe('@addTypeFromParameterToSchema', () => {
    it('should add type to schema if javascript type', () => {
      const schema = {}

      const param1 = new Parameter({ type: 'integer' })
      const expected1 = { type: 'integer' }
      const actual1 = __internals__.addTypeFromParameterToSchema(param1, schema)
      expect(actual1).toEqual(expected1)

      const param2 = new Parameter({ type: 'number' })
      const expected2 = { type: 'number' }
      const actual2 = __internals__.addTypeFromParameterToSchema(param2, schema)
      expect(actual2).toEqual(expected2)

      const param3 = new Parameter({ type: 'array' })
      const expected3 = { type: 'array' }
      const actual3 = __internals__.addTypeFromParameterToSchema(param3, schema)
      expect(actual3).toEqual(expected3)

      const param4 = new Parameter({ type: 'string' })
      const expected4 = { type: 'string' }
      const actual4 = __internals__.addTypeFromParameterToSchema(param4, schema)
      expect(actual4).toEqual(expected4)

      const param5 = new Parameter({ type: 'object' })
      const expected5 = { type: 'object' }
      const actual5 = __internals__.addTypeFromParameterToSchema(param5, schema)
      expect(actual5).toEqual(expected5)

      const param6 = new Parameter({ type: 'boolean' })
      const expected6 = { type: 'boolean' }
      const actual6 = __internals__.addTypeFromParameterToSchema(param6, schema)
      expect(actual6).toEqual(expected6)

      const param7 = new Parameter({ type: 'null' })
      const expected7 = { type: 'null' }
      const actual7 = __internals__.addTypeFromParameterToSchema(param7, schema)
      expect(actual7).toEqual(expected7)
    })

    it('should call inferType if type if not standard', () => {
      const param = new Parameter({ type: 'double' })
      const schema = {}

      spyOn(__internals__, 'inferType').andReturn('number')

      const expected = {
        type: 'number'
      }

      const actual = __internals__.addTypeFromParameterToSchema(param, schema)

      expect(__internals__.inferType).toHaveBeenCalled()
      expect(actual).toEqual(expected)
    })

    it('should keep other fields in schema', () => {
      const param = new Parameter({ type: 'string' })
      const schema = {
        enum: [ 'a', 'b', 'c' ]
      }

      const expected = {
        type: 'string',
        enum: [ 'a', 'b', 'c' ]
      }

      const actual = __internals__.addTypeFromParameterToSchema(param, schema)

      expect(actual).toEqual(expected)
    })
  })

  describe('@addTitleFromParameterToSchema', () => {
    it('should not do anything if no title exists', () => {
      const param = new Parameter()
      const schema = { type: 'string', pattern: '^.{5}$' }
      const expected = schema

      const actual = __internals__.addTitleFromParameterToSchema(param, schema)
      expect(actual).toEqual(expected)
    })

    it('should add title if it exists', () => {
      const param = new Parameter({ key: 'someTitle' })
      const schema = { type: 'string', pattern: '^.{5}$', 'x-title': 'someTitle' }
      const expected = schema

      const actual = __internals__.addTitleFromParameterToSchema(param, schema)
      expect(actual).toEqual(expected)
    })
  })

  describe('@addDefaultFromParameterToSchema', () => {
    it('should not do anything if no default exist', () => {
      const param = new Parameter()
      const schema = { type: 'string', pattern: '^.{5}$' }
      const expected = schema

      const actual = __internals__.addDefaultFromParameterToSchema(param, schema)
      expect(actual).toEqual(expected)
    })

    it('should add default if it exists', () => {
      const param = new Parameter({ default: 'default' })
      const schema = { type: 'string', pattern: '^.{5}$', default: 'default' }
      const expected = schema

      const actual = __internals__.addTitleFromParameterToSchema(param, schema)
      expect(actual).toEqual(expected)
    })
  })

  describe('@getJSONSchemaFromSimpleParameter', () => {
    it('should call addConstraintsToSchema', () => {
      spyOn(__internals__, 'addConstraintsToSchema').andReturn({ $schema: 'withConstraints' })

      const param = new Parameter()
      __internals__.getJSONSchemaFromSimpleParameter(param)

      expect(__internals__.addConstraintsToSchema).toHaveBeenCalled()
    })

    it('should call addTypeFromParameterToSchema', () => {
      spyOn(__internals__, 'addTypeFromParameterToSchema').andReturn({ $schema: 'withConstraints' })

      const param = new Parameter()
      __internals__.getJSONSchemaFromSimpleParameter(param)

      expect(__internals__.addTypeFromParameterToSchema).toHaveBeenCalled()
    })

    it('should call addTitleFromParameterToSchema', () => {
      spyOn(__internals__, 'addTitleFromParameterToSchema').andReturn({
        $schema: 'withConstraints'
      })

      const param = new Parameter()
      __internals__.getJSONSchemaFromSimpleParameter(param)

      expect(__internals__.addTitleFromParameterToSchema).toHaveBeenCalled()
    })

    it('should call addDefaultFromParameterToSchema', () => {
      spyOn(__internals__, 'addDefaultFromParameterToSchema').andReturn({
        $schema: 'withConstraints'
      })

      const param = new Parameter()
      __internals__.getJSONSchemaFromSimpleParameter(param)

      expect(__internals__.addDefaultFromParameterToSchema).toHaveBeenCalled()
    })

    it('should work', () => {
      const param = new Parameter({
        key: 'Content-Type',
        type: 'string',
        default: 'application/json',
        constraints: List([
          new Constraint.Enum([ 'application/json', 'application/xml' ])
        ])
      })

      const expected = {
        'x-title': 'Content-Type',
        type: 'string',
        default: 'application/json',
        enum: [ 'application/json', 'application/xml' ]
      }

      const actual = __internals__.getJSONSchemaFromSimpleParameter(param)

      expect(actual).toEqual(expected)
    })
  })

  describe('@addSequenceToSchema', () => {
    it('should do nothing if no sequence', () => {
      const param = new Parameter()
      const schema = { type: 'string' }

      const expected = schema
      const actual = __internals__.addSequenceToSchema(param, schema)

      expect(actual).toEqual(expected)
    })

    it('should call getJSONSchema for each Parameter in the sequence', () => {
      spyOn(__internals__, 'getJSONSchema').andReturn(true)
      const param = new Parameter({
        value: List([
          new Parameter(),
          new Parameter()
        ])
      })
      const schema = { type: 'string' }

      __internals__.addSequenceToSchema(param, schema)

      expect(__internals__.getJSONSchema.calls.length).toEqual(2)
    })

    it('should add an x-sequence field that is an array', () => {
      spyOn(__internals__, 'getJSONSchema').andReturn(true)
      const param = new Parameter({
        value: List([
          new Parameter(),
          new Parameter()
        ])
      })
      const schema = { type: 'string' }

      const actual = __internals__.addSequenceToSchema(param, schema)

      expect(actual['x-sequence']).toBeAn(Array)
    })

    it('should put the returned values in the x-sequence field', () => {
      spyOn(__internals__, 'getJSONSchema').andReturn(true)
      const param = new Parameter({
        value: List([
          new Parameter(),
          new Parameter()
        ])
      })
      const schema = {}

      const expected = {
        format: 'sequence',
        'x-sequence': [ true, true ]
      }
      const actual = __internals__.addSequenceToSchema(param, schema)

      expect(actual).toEqual(expected)
    })

    it('should not destroy other fields', () => {
      spyOn(__internals__, 'getJSONSchema').andReturn(true)
      const param = new Parameter({
        value: List([
          new Parameter(),
          new Parameter()
        ])
      })

      const schema = {
        type: 'string',
        enum: [ '1', '2', '3', '4' ],
        default: '1'
      }

      const expected = {
        type: 'string',
        enum: [ '1', '2', '3', '4' ],
        default: '1',
        format: 'sequence',
        'x-sequence': [ true, true ]
      }

      const actual = __internals__.addSequenceToSchema(param, schema)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getJSONSchemaFromSequenceParameter', () => {
    it('should call addConstraintsToSchema', () => {
      spyOn(__internals__, 'addConstraintsToSchema').andReturn({ $schema: 'withConstraints' })

      const param = new Parameter()
      __internals__.getJSONSchemaFromSequenceParameter(param)

      expect(__internals__.addConstraintsToSchema).toHaveBeenCalled()
    })

    it('should call addTypeFromParameterToSchema', () => {
      spyOn(__internals__, 'addTypeFromParameterToSchema').andReturn({ $schema: 'withConstraints' })

      const param = new Parameter()
      __internals__.getJSONSchemaFromSequenceParameter(param)

      expect(__internals__.addTypeFromParameterToSchema).toHaveBeenCalled()
    })

    it('should call addTitleFromParameterToSchema', () => {
      spyOn(__internals__, 'addTitleFromParameterToSchema').andReturn({
        $schema: 'withConstraints'
      })

      const param = new Parameter()
      __internals__.getJSONSchemaFromSequenceParameter(param)

      expect(__internals__.addTitleFromParameterToSchema).toHaveBeenCalled()
    })

    it('should call addSequenceToSchema', () => {
      spyOn(__internals__, 'addSequenceToSchema').andReturn({
        $schema: 'withConstraints'
      })

      const param = new Parameter()
      __internals__.getJSONSchemaFromSequenceParameter(param)

      expect(__internals__.addSequenceToSchema).toHaveBeenCalled()
    })

    it('should work', () => {
      const param = new Parameter({
        key: 'Content-Type',
        type: 'string',
        value: List([
          new Parameter({
            type: 'string',
            default: 'application/'
          }),
          new Parameter({
            key: 'format',
            type: 'string',
            constraints: List([
              new Constraint.Enum([ 'json', 'xml' ])
            ])
          })
        ]),
        constraints: List([
          new Constraint.Enum([ 'application/json', 'application/xml' ])
        ])
      })

      const expected = {
        'x-title': 'Content-Type',
        type: 'string',
        format: 'sequence',
        'x-sequence': [
          { type: 'string', default: 'application/' },
          { type: 'string', 'x-title': 'format', enum: [ 'json', 'xml' ] }
        ],
        enum: [ 'application/json', 'application/xml' ]
      }

      const actual = __internals__.getJSONSchemaFromSequenceParameter(param)

      expect(actual).toEqual(expected)
    })
  })

  describe('@addItemstoSchema', () => {
    it('should do nothing if no item', () => {
      const param = new Parameter()
      const schema = { type: 'array' }

      const expected = schema
      const actual = __internals__.addItemstoSchema(param, schema)

      expect(actual).toEqual(expected)
    })

    it('should do nothing if item is not a Parameter', () => {
      const param = new Parameter({
        value: [ 'some', 'list' ]
      })
      const schema = { type: 'array' }

      const expected = schema
      const actual = __internals__.addItemstoSchema(param, schema)

      expect(actual).toEqual(expected)
    })

    it('should call getJSONSchema with items param', () => {
      spyOn(__internals__, 'getJSONSchema')

      const items = new Parameter({
        type: 'number'
      })
      const param = new Parameter({
        value: items
      })

      const schema = { type: 'array' }

      __internals__.addItemstoSchema(param, schema)

      expect(__internals__.getJSONSchema).toHaveBeenCalledWith(items, true)
    })

    it('should add items schema to items field in schema', () => {
      const itemSchema = { type: 'number' }
      spyOn(__internals__, 'getJSONSchema').andReturn(itemSchema)

      const items = new Parameter({
        type: 'number'
      })
      const param = new Parameter({
        value: items
      })
      const schema = {}

      const expected = {
        items: itemSchema
      }
      const actual = __internals__.addItemstoSchema(param, schema)

      expect(actual).toEqual(expected)
    })

    it('should not override any other fields in schema', () => {
      const itemSchema = { 'x-title': 'diceThrow', type: 'integer', minimum: 1, maximum: 6 }
      spyOn(__internals__, 'getJSONSchema').andReturn(itemSchema)

      const items = new Parameter({
        'x-title': 'diceThrow',
        type: 'integer',
        constraints: List([
          new Constraint.Minimum(1),
          new Constraint.Maximum(6)
        ])
      })
      const param = new Parameter({
        value: items
      })
      const schema = {
        type: 'array',
        default: [ 1, 2, 3 ],
        maxItems: 5,
        minItems: 2,
        'x-title': 'diceThrows'
      }

      const expected = {
        type: 'array',
        default: [ 1, 2, 3 ],
        maxItems: 5,
        minItems: 2,
        'x-title': 'diceThrows',
        items: itemSchema
      }
      const actual = __internals__.addItemstoSchema(param, schema)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getJSONSchemaFromArrayParameter', () => {
    it('should call addConstraintsToSchema', () => {
      spyOn(__internals__, 'addConstraintsToSchema').andReturn({ $schema: 'withConstraints' })

      const param = new Parameter()
      __internals__.getJSONSchemaFromArrayParameter(param)

      expect(__internals__.addConstraintsToSchema).toHaveBeenCalled()
    })

    it('should call addTypeFromParameterToSchema', () => {
      spyOn(__internals__, 'addTypeFromParameterToSchema').andReturn({ $schema: 'withConstraints' })

      const param = new Parameter()
      __internals__.getJSONSchemaFromArrayParameter(param)

      expect(__internals__.addTypeFromParameterToSchema).toHaveBeenCalled()
    })

    it('should call addTitleFromParameterToSchema', () => {
      spyOn(__internals__, 'addTitleFromParameterToSchema').andReturn({
        $schema: 'withConstraints'
      })

      const param = new Parameter()
      __internals__.getJSONSchemaFromArrayParameter(param)

      expect(__internals__.addTitleFromParameterToSchema).toHaveBeenCalled()
    })

    it('should call addItemstoSchema', () => {
      spyOn(__internals__, 'addItemstoSchema').andReturn({
        $schema: 'withConstraints'
      })

      const param = new Parameter()
      __internals__.getJSONSchemaFromArrayParameter(param)

      expect(__internals__.addItemstoSchema).toHaveBeenCalled()
    })

    it('should work', () => {
      const param = new Parameter({
        key: 'diceThrows',
        type: 'array',
        value: new Parameter({
          key: 'diceThrow',
          type: 'integer',
          constraints: List([
            new Constraint.Minimum(1),
            new Constraint.Maximum(6)
          ])
        }),
        constraints: List([
          new Constraint.MinimumItems(3),
          new Constraint.MaximumItems(6)
        ])
      })

      const expected = {
        'x-title': 'diceThrows',
        type: 'array',
        items: {
          'x-title': 'diceThrow',
          type: 'integer',
          minimum: 1,
          maximum: 6
        },
        minItems: 3,
        maxItems: 6
      }

      const actual = __internals__.getJSONSchemaFromArrayParameter(param)

      expect(actual).toEqual(expected)
    })
  })

  describe('@addReferenceToSchema', () => {
    it('should do nothing if no reference', () => {
      const param = new Parameter()
      const schema = { type: 'string' }

      const expected = schema
      const actual = __internals__.addReferenceToSchema(param, schema)

      expect(actual).toEqual(expected)
    })

    it('should do nothing if value is not a reference', () => {
      const param = new Parameter({
        value: 'not a reference'
      })
      const schema = { type: 'string' }

      const expected = schema
      const actual = __internals__.addReferenceToSchema(param, schema)

      expect(actual).toEqual(expected)
    })

    it('should update type and default of schema if reference value is a string', () => {
      const param = new Parameter({
        value: new Reference({
          value: 'some string'
        })
      })
      const schema = { type: 'number' }

      const expected = {
        type: 'string',
        default: 'some string'
      }
      const actual = __internals__.addReferenceToSchema(param, schema)

      expect(actual).toEqual(expected)
    })

    it('should merge schema and Reference if reference value is an object', () => {
      const param = new Parameter({
        value: new Reference({
          value: {
            type: 'string',
            pattern: '^.{5}$'
          }
        })
      })
      const schema = { type: 'number', enum: [ 1, 2, 3 ] }

      const expected = {
        type: 'string',
        pattern: '^.{5}$',
        enum: [ 1, 2, 3 ]
      }
      const actual = __internals__.addReferenceToSchema(param, schema)

      expect(actual).toEqual(expected)
    })

    it('should add a $ref field if reference has no value', () => {
      const param = new Parameter({
        value: new Reference({
          uri: '#/definitions/UserId'
        })
      })
      const schema = { type: 'number', enum: [ 1, 2, 3 ] }

      const expected = {
        type: 'number', enum: [ 1, 2, 3 ], $ref: '#/definitions/UserId'
      }
      const actual = __internals__.addReferenceToSchema(param, schema)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getJSONSchemaFromReferenceParameter', () => {
    it('should call addConstraintsToSchema', () => {
      spyOn(__internals__, 'addConstraintsToSchema').andReturn({ $schema: 'withConstraints' })

      const param = new Parameter()
      __internals__.getJSONSchemaFromReferenceParameter(param)

      expect(__internals__.addConstraintsToSchema).toHaveBeenCalled()
    })

    it('should call addTitleFromParameterToSchema', () => {
      spyOn(__internals__, 'addTitleFromParameterToSchema').andReturn({
        $schema: 'withConstraints'
      })

      const param = new Parameter()
      __internals__.getJSONSchemaFromReferenceParameter(param)

      expect(__internals__.addTitleFromParameterToSchema).toHaveBeenCalled()
    })

    it('should call addReferenceToSchema', () => {
      spyOn(__internals__, 'addReferenceToSchema').andReturn({
        $schema: 'withConstraints'
      })

      const param = new Parameter()
      __internals__.getJSONSchemaFromReferenceParameter(param)

      expect(__internals__.addReferenceToSchema).toHaveBeenCalled()
    })

    it('should work', () => {
      const param = new Parameter({
        key: 'userId',
        type: 'reference',
        value: new Reference({
          uri: '#/definitions/UserId'
        }),
        constraints: List([
          new Constraint.Enum([ 1, 2, 3 ])
        ])
      })

      const expected = {
        'x-title': 'userId',
        $ref: '#/definitions/UserId',
        enum: [ 1, 2, 3 ]
      }

      const actual = __internals__.getJSONSchemaFromReferenceParameter(param)

      expect(actual).toEqual(expected)
    })
  })

  describe('@updateSchemaWithFaker', () => {
    it('should do nothing if no format', () => {
      const param = new Parameter()
      const schema = { type: 'string' }

      const expected = schema
      const actual = __internals__.updateSchemaWithFaker(param, schema)

      expect(actual).toEqual(expected)
    })

    it('should update schema with matching faker field', () => {
      const param = new Parameter({
        format: 'email'
      })
      const schema = {}

      const expected = { faker: 'internet.email' }
      const actual = __internals__.updateSchemaWithFaker(param, schema)

      expect(actual).toEqual(expected)
    })

    it('should not override schema field with matching faker field', () => {
      const param = new Parameter({
        format: 'password'
      })
      // super secure password scheme
      const schema = {
        pattern: '^[a-z]{4-8}$'
      }

      const expected = schema
      const actual = __internals__.updateSchemaWithFaker(param, schema)

      expect(actual).toEqual(expected)
    })

    it('should not destroy other fields', () => {
      const param = new Parameter({
        format: 'password'
      })
      // super secure password scheme
      const schema = {
        type: 'string',
        minLength: 4,
        maxLength: 8
      }

      const expected = {
        type: 'string',
        minLength: 4,
        maxLength: 8,
        pattern: '^.*$'
      }

      const actual = __internals__.updateSchemaWithFaker(param, schema)

      expect(actual).toEqual(expected)
    })
  })

  describe('@unescapeURIFragment', () => {
    it('should work', () => {
      const fragments = [
        '#/definitions/User',
        '#/definitions/User~01',
        '#/definitions/User~10',
        '#/definitions/User~0~1',
        '#/definitions/User~1~0'
      ]

      const expected = [
        '#/definitions/User',
        '#/definitions/User~1',
        '#/definitions/User/0',
        '#/definitions/User~/',
        '#/definitions/User/~'
      ]

      for (let i = 0; i < fragments.length; i += 1) {
        const actual = __internals__.unescapeURIFragment(fragments[i])
        expect(actual).toEqual(expected[i])
      }
    })
  })

  describe('@replaceRefs', () => {
    it('should do nothing if input is not an object', () => {
      const input = 'some object'

      const expected = input
      const actual = __internals__.replaceRefs(input)

      expect(actual).toEqual(expected)
    })

    it('should replace $ref by default and type=string', () => {
      const input = {
        type: 'integer',
        $ref: '#/definitions/UserId'
      }

      const expected = {
        type: 'string',
        default: 'UserId'
      }
      const actual = __internals__.replaceRefs(input)

      expect(actual).toEqual(expected)
    })

    it('should call itself for each item in array if input is array', () => {
      spyOn(__internals__, 'replaceRefs').andCallThrough()
      const input = [ 1, 2, 3 ]

      __internals__.replaceRefs(input)

      expect(__internals__.replaceRefs.calls.length).toEqual(4)
    })

    it('should call itself for each key in object if input is object', () => {
      spyOn(__internals__, 'replaceRefs').andCallThrough()
      const input = { a: 1, b: 2, c: 3 }

      __internals__.replaceRefs(input)

      expect(__internals__.replaceRefs.calls.length).toEqual(4)
    })
  })

  describe('@simplifyRefs', () => {
    it('should do nothing if input is not an object', () => {
      const input = 'some object'

      const expected = input
      const actual = __internals__.simplifyRefs(input)

      expect(actual).toEqual(expected)
    })

    it('should replace $ref by uri if $ref is a Reference record', () => {
      const input = {
        type: 'integer',
        $ref: new Reference({
          uri: '#/definitions/UserId'
        })
      }

      const expected = {
        type: 'integer',
        $ref: '#/definitions/UserId'
      }
      const actual = __internals__.simplifyRefs(input)

      expect(actual).toEqual(expected)
    })

    it('should call itself for each item in array if input is array', () => {
      spyOn(__internals__, 'simplifyRefs').andCallThrough()
      const input = [ 1, 2, 3 ]

      __internals__.simplifyRefs(input)

      expect(__internals__.simplifyRefs.calls.length).toEqual(4)
    })

    it('should call itself for each key in object if input is object', () => {
      spyOn(__internals__, 'simplifyRefs').andCallThrough()
      const input = { a: 1, b: 2, c: 3 }

      __internals__.simplifyRefs(input)

      expect(__internals__.simplifyRefs.calls.length).toEqual(4)
    })
  })

  describe('@isSimpleParameter', () => {
    it('should return true if type if common js type but not array', () => {
      const inputs = [
        'number', 'string', 'object', 'boolean', 'null'
      ]

      for (const input of inputs) {
        const param = new Parameter({
          type: input
        })
        const actual = __internals__.isSimpleParameter(param)
        expect(actual).toBeTruthy()
      }
    })

    it('should return true if type if integer', () => {
      const input = new Parameter({
        type: 'integer'
      })

      const actual = __internals__.isSimpleParameter(input)

      expect(actual).toBeTruthy()
    })

    it('should return false if array', () => {
      const input = new Parameter({
        type: 'array'
      })

      const actual = __internals__.isSimpleParameter(input)

      expect(actual).toBeFalsy()
    })

    it('should return false otherwise', () => {
      const input = new Parameter({
        type: 'qwirqwfhqow'
      })

      const actual = __internals__.isSimpleParameter(input)

      expect(actual).toBeFalsy()
    })
  })

  describe('@isSequenceParameter', () => {
    it('should return true if superType === sequence', () => {
      const input = new Parameter({ superType: 'sequence' })

      const actual = __internals__.isSequenceParameter(input)
      expect(actual).toBeTruthy()
    })

    it('should return false otherwise', () => {
      const input = new Parameter({ superType: 'qowqwbq' })
      const actual = __internals__.isSequenceParameter(input)
      expect(actual).toBeFalsy()
    })
  })

  describe('@isArrayParameter', () => {
    it('should return true if type === array', () => {
      const input = new Parameter({ type: 'array' })

      const actual = __internals__.isArrayParameter(input)
      expect(actual).toBeTruthy()
    })

    it('should return false otherwise', () => {
      const input = new Parameter({ type: 'qowqwbq' })
      const actual = __internals__.isArrayParameter(input)
      expect(actual).toBeFalsy()
    })
  })

  describe('@isReferenceParameter', () => {
    it('should return true if superType === reference', () => {
      const input = new Parameter({ superType: 'reference' })

      const actual = __internals__.isReferenceParameter(input)
      expect(actual).toBeTruthy()
    })

    it('should return false otherwise', () => {
      const input = new Parameter({ superType: 'qowqwbq' })
      const actual = __internals__.isReferenceParameter(input)
      expect(actual).toBeFalsy()
    })
  })

  describe('@getJSONSchema', () => {
    it('should call isSimpleParameter', () => {
      spyOn(__internals__, 'isSimpleParameter').andReturn(false)
      const param = new Parameter()

      __internals__.getJSONSchema(param)

      expect(__internals__.isSimpleParameter).toHaveBeenCalled()
    })

    it('should call isSequenceParameter', () => {
      spyOn(__internals__, 'isSequenceParameter').andReturn(false)
      const param = new Parameter()

      __internals__.getJSONSchema(param)

      expect(__internals__.isSequenceParameter).toHaveBeenCalled()
    })

    it('should call isArrayParameter', () => {
      spyOn(__internals__, 'isArrayParameter').andReturn(false)
      const param = new Parameter()

      __internals__.getJSONSchema(param)

      expect(__internals__.isArrayParameter).toHaveBeenCalled()
    })

    it('should call isReferenceParameter', () => {
      spyOn(__internals__, 'isReferenceParameter').andReturn(false)
      const param = new Parameter()

      __internals__.getJSONSchema(param)

      expect(__internals__.isReferenceParameter).toHaveBeenCalled()
    })

    it('should call getJSONSchemaFromSimpleParameter if isSimple', () => {
      spyOn(__internals__, 'isSimpleParameter').andReturn(true)
      spyOn(__internals__, 'getJSONSchemaFromSimpleParameter').andReturn({})
      const param = new Parameter()

      __internals__.getJSONSchema(param)

      expect(__internals__.getJSONSchemaFromSimpleParameter).toHaveBeenCalled()
    })

    it('should call getJSONSchemaFromSequenceParameter if isSequence', () => {
      spyOn(__internals__, 'isSequenceParameter').andReturn(true)
      spyOn(__internals__, 'getJSONSchemaFromSequenceParameter').andReturn({})
      const param = new Parameter()

      __internals__.getJSONSchema(param)

      expect(__internals__.getJSONSchemaFromSequenceParameter).toHaveBeenCalled()
    })

    it('should call getJSONSchemaFromArrayParameter if isArray', () => {
      spyOn(__internals__, 'isArrayParameter').andReturn(true)
      spyOn(__internals__, 'getJSONSchemaFromArrayParameter').andReturn({})
      const param = new Parameter()

      __internals__.getJSONSchema(param)

      expect(__internals__.getJSONSchemaFromArrayParameter).toHaveBeenCalled()
    })

    it('should call getJSONSchemaFromReferenceParameter if isReference', () => {
      spyOn(__internals__, 'isReferenceParameter').andReturn(true)
      spyOn(__internals__, 'getJSONSchemaFromReferenceParameter').andReturn({})
      const param = new Parameter()

      __internals__.getJSONSchema(param)

      expect(__internals__.getJSONSchemaFromReferenceParameter).toHaveBeenCalled()
    })

    it('should call updateSchemaWithFaker if useFaker', () => {
      spyOn(__internals__, 'updateSchemaWithFaker').andReturn({})
      const param = new Parameter()

      __internals__.getJSONSchema(param, true)

      expect(__internals__.updateSchemaWithFaker).toHaveBeenCalled()
    })

    it('should not call updateSchemaWithFaker if not useFaker', () => {
      spyOn(__internals__, 'updateSchemaWithFaker').andReturn({})
      const param = new Parameter()

      __internals__.getJSONSchema(param, false)

      expect(__internals__.updateSchemaWithFaker).toNotHaveBeenCalled()
    })

    it('should call replaceRefs if replaceRefs', () => {
      spyOn(__internals__, 'replaceRefs').andReturn({})
      const param = new Parameter()

      __internals__.getJSONSchema(param, false, true)

      expect(__internals__.replaceRefs).toHaveBeenCalled()
    })

    it('should call simplifyRefs if not replaceRefs', () => {
      spyOn(__internals__, 'simplifyRefs').andReturn({})
      const param = new Parameter()

      __internals__.getJSONSchema(param, false, false)

      expect(__internals__.simplifyRefs).toHaveBeenCalled()
    })
  })

  describe('@generateFromDefault', () => {
    it('should return null if no default', () => {
      const param = new Parameter()

      const actual = __internals__.generateFromDefault(param)
      expect(actual).toEqual(null)
    })

    it('should return value if default', () => {
      const param = new Parameter({
        default: false
      })

      const actual = __internals__.generateFromDefault(param)
      expect(actual).toEqual(false)
    })
  })

  describe('@addFakerFunctionalities', () => {
    it('should add helper if schema is for simple string without faker information', () => {
      const schema = {
        type: 'string'
      }

      const expected = {
        type: 'string',
        'x-faker': 'company.bsNoun'
      }
      const actual = __internals__.addFakerFunctionalities(schema)

      expect(actual).toEqual(expected)
    })

    it('should do nothing if not string type', () => {
      const schema = {
        type: 'number'
      }

      const expected = schema
      const actual = __internals__.addFakerFunctionalities(schema)

      expect(actual).toEqual(expected)
    })

    it('should do nothing if format is sequence', () => {
      const schema = {
        type: 'string',
        format: 'sequence'
      }

      const expected = schema
      const actual = __internals__.addFakerFunctionalities(schema)

      expect(actual).toEqual(expected)
    })

    it('should do nothing if faker already present', () => {
      const schema = {
        type: 'string',
        faker: 'internet.email'
      }

      const expected = schema
      const actual = __internals__.addFakerFunctionalities(schema)

      expect(actual).toEqual(expected)
    })

    it('should do nothing if x-faker already present', () => {
      const schema = {
        type: 'string',
        'x-faker': 'internet.email'
      }

      const expected = schema
      const actual = __internals__.addFakerFunctionalities(schema)

      expect(actual).toEqual(expected)
    })
  })

  describe('@generate', () => {
    it('should call generateFromDefault if useDefault', () => {
      spyOn(__internals__, 'generateFromDefault').andReturn(true)

      const param = new Parameter()

      __internals__.generate(param, true)

      expect(__internals__.generateFromDefault).toHaveBeenCalled()
    })

    it('should return generateFromDefault value if not null', () => {
      spyOn(__internals__, 'generateFromDefault').andReturn(12345)

      const param = new Parameter()

      const expected = 12345
      const actual = __internals__.generate(param, true)

      expect(actual).toEqual(expected)
    })

    it('should call getJSONSchema if no schema is provided', () => {
      spyOn(__internals__, 'getJSONSchema').andReturn({ type: 'integer' })

      const param = new Parameter()

      __internals__.generate(param)

      expect(__internals__.getJSONSchema).toHaveBeenCalled()
    })

    it('should not call getJSONSchema if a schema is provided', () => {
      spyOn(__internals__, 'getJSONSchema').andReturn({ type: 'integer' })

      __internals__.generate(null, false, { type: 'number' })

      expect(__internals__.getJSONSchema).toNotHaveBeenCalled()
    })

    it('should call replaceRefs on schema', () => {
      spyOn(__internals__, 'replaceRefs').andReturn({ type: 'integer' })

      __internals__.generate(null, false, { type: 'number' })

      expect(__internals__.replaceRefs).toHaveBeenCalled()
    })

    it('should call addFakerFunctionalities on schema', () => {
      spyOn(__internals__, 'addFakerFunctionalities').andReturn({ type: 'integer' })

      __internals__.generate(null, false, { type: 'number' })

      expect(__internals__.addFakerFunctionalities).toHaveBeenCalled()
    })

    it('should work', () => {
      const schema = {
        type: 'string',
        enum: [ 123 ]
      }

      const expected = 123
      const actual = __internals__.generate(null, false, schema)

      expect(actual).toEqual(expected)
    })
  })

  describe('@validate', () => {
    it('should return true if no constraints', () => {
      const param = new Parameter()
      const value = 'whatever'

      const expected = true
      const actual = __internals__.validate(param, value)

      expect(actual).toEqual(expected)
    })

    it('should return true if value matches constraints', () => {
      const param = new Parameter({
        type: 'string',
        constraints: List([
          new Constraint.MaximumLength(15),
          new Constraint.MinimumLength(5),
          new Constraint.Pattern('^what')
        ])
      })
      const value = 'whatever'

      const expected = true
      const actual = __internals__.validate(param, value)

      expect(actual).toEqual(expected)
    })

    it('should return false if value fails to match 1 constraint', () => {
      const param = new Parameter({
        type: 'string',
        constraints: List([
          new Constraint.MaximumLength(6),
          new Constraint.MinimumLength(2),
          new Constraint.Pattern('^what')
        ])
      })
      const value = 'whatever'

      const expected = false
      const actual = __internals__.validate(param, value)

      expect(actual).toEqual(expected)
    })
  })

  describe('@isValid', () => {
    it('should return true if no applicableContexts', () => {
      const source = new Parameter()
      const input = new Parameter()

      const expected = true
      const actual = __internals__.isValid(source, input)

      expect(actual).toEqual(expected)
    })

    it('should call validate for applicableContexts with same key until one is valid', () => {
      const ext1 = new Parameter({ key: 'test', default: 'ext1' })
      const ext2 = new Parameter({ key: 'test', default: 'ext2' })

      spyOn(ext1, 'validate').andReturn(false)
      spyOn(ext2, 'validate').andReturn(false)

      const source = new Parameter({
        applicableContexts: List([ ext1, ext2 ])
      })
      const input = new Parameter({ key: 'test' })

      const expected = false
      const actual = __internals__.isValid(source, input)

      expect(ext1.validate).toHaveBeenCalled()
      expect(ext2.validate).toHaveBeenCalled()
      expect(actual).toEqual(expected)
    })

    it('should not call validate for applicableContexts with different key', () => {
      const ext1 = new Parameter({ key: 'test1', default: 'ext1' })
      const ext2 = new Parameter({ key: 'test2', default: 'ext2' })

      spyOn(ext1, 'validate').andReturn(false)
      spyOn(ext2, 'validate').andReturn(false)

      const source = new Parameter({
        applicableContexts: List([ ext1, ext2 ])
      })
      const input = new Parameter({ key: 'test1' })

      const expected = false
      const actual = __internals__.isValid(source, input)

      expect(ext1.validate).toHaveBeenCalled()
      expect(ext2.validate).toNotHaveBeenCalled()
      expect(actual).toEqual(expected)
    })

    it('should return false if no valid applicableContexts', () => {
      const ext1 = new Parameter({ key: 'test1', default: 'ext1' })
      const ext2 = new Parameter({ key: 'test2', default: 'ext2' })

      spyOn(ext1, 'validate').andReturn(true)
      spyOn(ext2, 'validate').andReturn(true)

      const source = new Parameter({
        applicableContexts: List([ ext1, ext2 ])
      })
      const input = new Parameter({ key: 'test0' })

      const expected = false
      const actual = __internals__.isValid(source, input)

      expect(ext1.validate).toNotHaveBeenCalled()
      expect(ext2.validate).toNotHaveBeenCalled()
      expect(actual).toEqual(expected)
    })
  })
})
