/* eslint-disable max-nested-callbacks */
import { Record, List } from 'immutable'
import expect, { spyOn, restoreSpies } from 'expect'

import { Parameter, __internals__ } from '../Parameter'
import Reference from '../Reference'
import Constraint from '../Constraint'

describe('models/Parameter.js', () => {
  afterEach(() => restoreSpies())
  describe('{ Parameter }', () => {
    it('should be a Record', () => {
      const instance = new Parameter()

      expect(instance).toBeA(Record)
    })

    describe('#fields', () => {
      const fields = [
        'in',
        'uuid',
        'key',
        'default',
        'value',
        'type',
        'superType',
        'format',
        'name',
        'required',
        'description',
        'examples',
        'constraints',
        'applicableContexts',
        'interfaces'
      ]

      for (const field of fields) {
        it('should have a `' + field + '` field', () => {
          const key = field
          const value = 'test'
          const data = {}

          data[key] = value
          const instance = new Parameter(data)

          expect(instance.get(key)).toEqual(value)
        })
      }
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
          expect(__internals__.getJSONSchema.calls[0].arguments).toEqual([ param, false, false ])
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
    it('should return string if type is badly-typed (e.g. type=123)', () => {
      const input = 123

      const expected = 'string'
      const actual = __internals__.inferType(input)

      expect(actual).toEqual(expected)
    })

    it('should return number if type is double or float', () => {
      const inputs = [
        'double',
        'float',
        'DoUble',
        'FloAt'
      ]

      const expected = [ 'number', 'number', 'number', 'number' ]
      const actual = inputs.map(input => __internals__.inferType(input))
      expect(actual).toEqual(expected)
    })

    it('should return string if type is date', () => {
      const type = 'date'
      const expected = 'string'
      const actual = __internals__.inferType(type)

      expect(actual).toEqual(expected)
    })

    it('should return null if no type provided', () => {
      const type = null
      const expected = null
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
      const inputs = [
        [ new Parameter({ type: 'integer' }), {} ],
        [ new Parameter({ type: 'number' }), {} ],
        [ new Parameter({ type: 'array' }), {} ],
        [ new Parameter({ type: 'string' }), {} ],
        [ new Parameter({ type: 'object' }), {} ],
        [ new Parameter({ type: 'boolean' }), {} ],
        [ new Parameter({ type: 'null' }), {} ]
      ]

      const expected = [
        { type: 'integer' },
        { type: 'number' },
        { type: 'array' },
        { type: 'string' },
        { type: 'object' },
        { type: 'boolean' },
        { type: 'null' }
      ]

      const actual = inputs.map(input => __internals__.addTypeFromParameterToSchema(...input))
      expect(actual).toEqual(expected)
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

    it('should add a $ref field', () => {
      const param = new Parameter({
        value: new Reference({
          uuid: '#/definitions/UserId'
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
          uuid: '#/definitions/UserId'
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

    it('should replace $ref by default', () => {
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

    it('should call ignoring keys from the prototype chain if it is an object', () => {
      spyOn(__internals__, 'replaceRefs').andCallThrough()
      function A() {
        this.a = 1
        this.b = 2
        this.c = 3
      }
      A.prototype.d = 4
      A.prototype.e = 5

      const input = new A()
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

    it('should replace $ref by uuid if $ref is a Reference record', () => {
      const input = {
        type: 'integer',
        $ref: new Reference({
          uuid: '#/definitions/UserId'
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

    it('should call ignoring keys from the prototype chain if it is an object', () => {
      spyOn(__internals__, 'simplifyRefs').andCallThrough()
      function A() {
        this.a = 1
        this.b = 2
        this.c = 3
      }
      A.prototype.d = 4
      A.prototype.e = 5

      const input = new A()
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

    it('should return false if param has a superType', () => {
      const input = new Parameter({
        superType: 'sequence',
        type: 'string'
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

    it('should return false if superType is not set', () => {
      const input = new Parameter()

      const actual = __internals__.isSequenceParameter(input)
      expect(actual).toBeFalsy()
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

    it('should return false if superType is not set', () => {
      const input = new Parameter()

      const actual = __internals__.isArrayParameter(input)
      expect(actual).toBeFalsy()
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

    it('should return false if superType is not set', () => {
      const input = new Parameter()

      const actual = __internals__.isReferenceParameter(input)
      expect(actual).toBeFalsy()
    })

    it('should return false otherwise', () => {
      const input = new Parameter({ superType: 'qowqwbq' })
      const actual = __internals__.isReferenceParameter(input)
      expect(actual).toBeFalsy()
    })
  })

  describe('@getRawJSONSchema', () => {
    /* eslint-disable max-statements */
    it('should work', () => {
      spyOn(__internals__, 'isSimpleParameter').andCall(({ simple }) => !!simple)
      spyOn(__internals__, 'getJSONSchemaFromSimpleParameter').andCall(({ simple }) => simple)
      spyOn(__internals__, 'isSequenceParameter').andCall(({ sequence }) => !!sequence)
      spyOn(__internals__, 'getJSONSchemaFromSequenceParameter').andCall(({ sequence }) => sequence)
      spyOn(__internals__, 'isArrayParameter').andCall(({ array }) => !!array)
      spyOn(__internals__, 'getJSONSchemaFromArrayParameter').andCall(({ array }) => array)
      spyOn(__internals__, 'isReferenceParameter').andCall(({ reference }) => !!reference)
      spyOn(__internals__, 'getJSONSchemaFromReferenceParameter')
        .andCall(({ reference }) => reference)

      const inputs = [
        [ { simple: 123 }, false ],
        [ { sequence: 234 }, false ],
        [ { array: 345 }, false ],
        [ { reference: 456 }, false ],
        [ { other: 567 }, false ]
      ]
      const expected = [
        123, 234, 345, 456, {}
      ]
      const actual = inputs.map(input => __internals__.getRawJSONSchema(...input))
      expect(actual).toEqual(expected)
    })
    /* eslint-enable max-statements */
  })

  describe('@getJSONSchema', () => {
    it('should call getRawJSONSchema', () => {
      spyOn(__internals__, 'getRawJSONSchema').andReturn({})
      const param = new Parameter()

      __internals__.getJSONSchema(param)

      expect(__internals__.getRawJSONSchema).toHaveBeenCalled()
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

  describe('@generate', () => {
    it('should call generateFromSequenceDefaults if param has sequence superType', () => {
      spyOn(__internals__, 'generateFromSequenceDefaults').andReturn(true)

      const param = new Parameter({ superType: 'sequence' })

      __internals__.generate(param, true)

      expect(__internals__.generateFromSequenceDefaults).toHaveBeenCalled()
    })

    it('should call generateFromDefault otherwise', () => {
      spyOn(__internals__, 'generateFromDefault').andReturn(true)

      const param = new Parameter()

      __internals__.generate(param, true)

      expect(__internals__.generateFromDefault).toHaveBeenCalled()
    })

    it('should return generateFromSequenceDefaults value if superType is sequence', () => {
      spyOn(__internals__, 'generateFromSequenceDefaults').andReturn(12345)

      const param = new Parameter({ superType: 'sequence' })

      const expected = 12345
      const actual = __internals__.generate(param, true)

      expect(actual).toEqual(expected)
    })

    it('should return generateFromDefault value otherwise', () => {
      spyOn(__internals__, 'generateFromDefault').andReturn(12345)

      const param = new Parameter()

      const expected = 12345
      const actual = __internals__.generate(param, true)

      expect(actual).toEqual(expected)
    })

    it('should work', () => {
      const inputs = [
        new Parameter(),
        new Parameter({ default: 123 }),
        new Parameter({ superType: 'sequence' }),
        new Parameter({ superType: 'sequence', value: List() }),
        new Parameter({ superType: 'sequence', value: List([
          new Parameter(),
          new Parameter({ default: 234 }),
          new Parameter({ default: 345 })
        ]) }),
        new Parameter({ superType: 'sequence', value: List([
          new Parameter(),
          new Parameter({ default: 456 }),
          new Parameter({ superType: 'sequence', value: List([
            new Parameter(),
            new Parameter({ default: 567 }),
            new Parameter({ default: 678 })
          ]) })
        ]) })
      ]

      const expected = [ null, 123, null, '', '234345', '456567678' ]
      const actual = inputs.map(input => __internals__.generate(input))

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

    /* eslint-disable max-statements */
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

    it('should work', () => {
      const withCorrectContentTypeHeader = new Parameter({
        key: 'Content-Type',
        default: 'application/json',
        constraints: List([
          new Constraint.Enum([
            'application/json',
            'application/xml'
          ])
        ])
      })
      const withCorrectAcceptHeader = new Parameter({
        key: 'Accept',
        default: 'image/svg+xml',
        constraints: List([
          new Constraint.Enum([
            'image/png',
            'image/svg+xml'
          ])
        ])
      })

      // valid with correct contentType *OR* accept header
      const source = new Parameter({
        applicableContexts: List([ withCorrectContentTypeHeader, withCorrectAcceptHeader ])
      })

      const invalidInputIncompatibleKey = new Parameter({
        key: 'X-Previous-Response-Format',
        default: 'image/svg+xml'
      })

      let actual

      actual = __internals__.isValid(source, invalidInputIncompatibleKey)
      expect(actual).toEqual(false)

      const invalidInputInvalidValue = new Parameter({
        key: 'Accept',
        default: 'image/jpeg'
      })

      actual = __internals__.isValid(source, invalidInputInvalidValue)
      expect(actual).toEqual(false)

      const validInput = new Parameter({
        key: 'Accept',
        default: 'image/png'
      })

      actual = __internals__.isValid(source, validInput)
      expect(actual).toEqual(true)
    })
    /* eslint-enable max-statements */
  })
})
