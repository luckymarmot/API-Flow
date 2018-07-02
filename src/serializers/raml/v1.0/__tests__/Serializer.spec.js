/* eslint-disable max-nested-callbacks */
import expect, { spyOn, restoreSpies } from 'expect'
import { OrderedMap, List } from 'immutable'

import { convertEntryListInMap } from '../../../../utils/fp-utils'

import Api from '../../../../models/Api'
import Store from '../../../../models/Store'
import Constraint from '../../../../models/Constraint'
import Info from '../../../../models/Info'
import URL from '../../../../models/URL'
import URLComponent from '../../../../models/URLComponent'
import Parameter from '../../../../models/Parameter'
import Interface from '../../../../models/Interface'
import Resource from '../../../../models/Resource'
import Request from '../../../../models/Request'
import Auth from '../../../../models/Auth'
import ParameterContainer from '../../../../models/ParameterContainer'
import Context from '../../../../models/Context'
import Reference from '../../../../models/Reference'
import Response from '../../../../models/Response'
import Variable from '../../../../models/Variable'

import Serializer, { __internals__ } from '../Serializer'

describe('serializers/raml/v1.0/Serializer.js', () => {
  afterEach(() => restoreSpies())
  describe('{ Serializer }', () => {
    describe('@serialize', () => {
      it('should call __internals__.serialize', () => {
        const expected = 1234
        spyOn(__internals__, 'serialize').andReturn(expected)

        const actual = Serializer.serialize()

        expect(__internals__.serialize).toHaveBeenCalled()
        expect(actual).toEqual(expected)
      })

      it('should call __internals__.serialize with the correct arguments', () => {
        const expected = 1234
        spyOn(__internals__, 'serialize').andReturn(expected)

        const input = '123412312'
        const actual = Serializer.serialize(input)

        expect(__internals__.serialize).toHaveBeenCalledWith(input)
        expect(actual).toEqual(expected)
      })
    })

    describe('@validate', () => {
      it('should call __internals__.validate', () => {
        const expected = 1234
        spyOn(__internals__, 'validate').andReturn(expected)

        const actual = Serializer.validate()

        expect(__internals__.validate).toHaveBeenCalled()
        expect(actual).toEqual(expected)
      })

      it('should call __internals__.validate with the correct arguments', () => {
        const expected = 1234
        spyOn(__internals__, 'validate').andReturn(expected)

        const input = '123412312'
        const actual = Serializer.validate(input)

        expect(__internals__.validate).toHaveBeenCalledWith(input)
        expect(actual).toEqual(expected)
      })
    })
  })

  describe('@getKeysFromRecord', () => {
    it('should work', () => {
      const inputs = [
        [ { s: 'store', res: 'resources' }, new Api({ store: null, resources: null }) ],
        [ { s: 'store', res: 'resources' }, new Api({ store: 345, resources: null }) ],
        [ { s: 'store', res: 'resources' }, new Api({ store: 345, resources: 456 }) ]
      ]
      const expected = [
        {},
        { s: 345 },
        { s: 345, res: 456 }
      ]
      const actual = inputs.map(input => __internals__.getKeysFromRecord(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@validate', () => {
    it('should work', () => {
      const inputs = [
        null
      ]
      const expected = [
        true
      ]
      const actual = inputs.map(input => __internals__.validate(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractRefsFromObject', () => {
    it('should work', () => {
      spyOn(__internals__, 'getRefsFromSchema').andCall(v => v ? [ v * 3 ] : [ 12 ])

      const inputs = [
        [ { a: 123, $ref: 234 }, 'unknown' ],
        [ { a: 123, $ref: 234 }, 'a' ],
        [ { a: 123, $ref: 234 }, '$ref' ]
      ]
      const expected = [
        [ 12 ], [ 369 ], [ 234 ]
      ]

      const actual = inputs.map(input => __internals__.extractRefsFromObject(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@isArray', () => {
    it('should work', () => {
      const inputs = [
        {},
        '123123123123',
        123,
        [ 123, 234, 345 ]
      ]
      const expected = [
        false, false, false, true
      ]
      const actual = inputs.map(input => __internals__.isArray(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@getRefsFromArray', () => {
    it('should work', () => {
      spyOn(__internals__, 'getRefsFromSchema').andCall((a) => a.map(v => v + 1))

      const inputs = [
        [],
        [ [ 123 ] ],
        [ [ 234, 345 ], [ 456, 567 ] ]
      ]
      const expected = [
        [],
        [ 124 ],
        [ 235, 346, 457, 568 ]
      ]
      const actual = inputs.map(input => __internals__.getRefsFromArray(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@getRefsFromObject', () => {
    it('should work', () => {
      spyOn(__internals__, 'getRefsFromSchema').andCall(a => a.map(v => v + 1))

      const inputs = [
        {},
        { a: [ 123, 234 ], b: [ 345, 456 ] }
      ]
      const expected = [
        [],
        [ 124, 235, 346, 457 ]
      ]
      const actual = inputs.map(input => __internals__.getRefsFromObject(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@isNonObjectType', () => {
    it('should work', () => {
      /* eslint-disable no-undefined */
      const inputs = [
        undefined,
        null,
        123,
        '123',
        [ 234 ],
        { a: 345 }
      ]
      /* eslint-enable no-undefined */
      const expected = [
        true, true, true, true, false, false
      ]
      const actual = inputs.map(input => __internals__.isNonObjectType(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@getRefsFromNonObjectTypes', () => {
    it('should work', () => {
      const inputs = [
        null
      ]
      const expected = [
        []
      ]
      const actual = inputs.map(input => __internals__.getRefsFromNonObjectTypes(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@getRefsFromSchema', () => {
    it('should work', () => {
      spyOn(__internals__, 'getRefsFromArray').andCall(a => a.map(v => v + 1))
      spyOn(__internals__, 'getRefsFromObject').andReturn([ 568, 679, 780 ])
      const inputs = [
        null,
        123,
        '234',
        [ 345, 456 ],
        { b: 567, c: 678 }
      ]
      const expected = [
        [],
        [],
        [],
        [ 346, 457 ],
        [ 568, 679, 780 ]
      ]
      const actual = inputs.map(input => __internals__.getRefsFromSchema(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@isConvertible', () => {
    it('should work', () => {
      const inputs = [
        // true
        null,
        123,
        '234',
        [ 345, 456 ],
        { a: 456, b: 567 },
        // false
        { a: 456, b: 567, exclusiveMaximum: true },
        { a: 456, b: 567, exclusiveMinimum: true },
        { a: 456, b: 567, additionalItems: true },
        { a: 456, b: 567, patternProperties: true },
        { a: 456, b: 567, dependencies: true },
        { a: 456, b: 567, oneOf: true },
        { a: 456, b: 567, not: true },
        // true
        [ { a: 456, b: 567 }, { c: 678, d: 789 } ],
        // false
        [ { a: 456, b: 567, not: false }, { c: 678, d: 789 } ],
        [ { a: 456, b: 567 }, { c: 678, d: 789, not: false } ],
        // true
        { a: 456, b: 567, c: { a: 456, b: 567 } },
        // false
        { a: 456, b: 567, c: { a: 456, b: 567, c: { a: 456, b: 567, not: true } } }
      ]
      const expected = [
        true, true, true, true, true,
        false, false, false, false, false, false, false,
        true,
        false, false,
        true,
        false
      ]
      const actual = inputs.map(input => __internals__.isConvertible(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@isObjectType', () => {
    it('should work', () => {
      const inputs = [
        {},
        { a: 123, b: 234 },
        { a: 123, b: 234, properties: 345 },
        { a: 123, b: 234, minProperties: 345 },
        { a: 123, b: 234, maxProperties: 345 },
        { a: 123, b: 234, discriminator: 345 },
        { a: 123, b: 234, discriminatorValue: 345 }
      ]
      const expected = [
        false, false,
        true, true, true, true, true
      ]
      const actual = inputs.map(input => __internals__.isObjectType(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@isArrayType', () => {
    it('should work', () => {
      const inputs = [
        {},
        { a: 123, b: 234 },
        { a: 123, b: 234, items: 345 },
        { a: 123, b: 234, uniqueItems: 345 },
        { a: 123, b: 234, minItems: 345 },
        { a: 123, b: 234, maxItems: 345 }
      ]
      const expected = [
        false, false,
        true, true, true, true
      ]
      const actual = inputs.map(input => __internals__.isArrayType(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@isStringType', () => {
    it('should work', () => {
      const inputs = [
        {},
        { a: 123, b: 234 },
        { a: 123, b: 234, pattern: 345 },
        { a: 123, b: 234, minLength: 345 },
        { a: 123, b: 234, maxLength: 345 }
      ]
      const expected = [
        false, false,
        true, true, true
      ]
      const actual = inputs.map(input => __internals__.isStringType(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@isNumberType', () => {
    it('should work', () => {
      const inputs = [
        {},
        { a: 123, b: 234 },
        { a: 123, b: 234, minimum: 345 },
        { a: 123, b: 234, maximum: 345 },
        { a: 123, b: 234, multipleOf: 345 }
      ]
      const expected = [
        false, false,
        true, true, true
      ]
      const actual = inputs.map(input => __internals__.isNumberType(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@getType', () => {
    it('should work', () => {
      const inputs = [
        { type: 123 },
        { type: 'null' },
        { properties: 234 },
        { minItems: 345 },
        { pattern: 456 },
        { minimum: 567 },
        { something: 'else' }
      ]
      const expected = [
        123, 'nil', 'object', 'array', 'string', 'number', 'any'
      ]
      const actual = inputs.map(input => __internals__.getType(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertSchemaItemsArrayIntoTypes', () => {
    it('should work', () => {
      spyOn(__internals__, 'getTypes').andCall(t => [ t.join(' | ') ])

      const inputs = [
        [ [ 123 ], [ 234, 345 ] ]
      ]
      const expected = [
        [ '(123)[]', '(234 | 345)[]' ]
      ]
      const actual = inputs.map(input => __internals__.convertSchemaItemsArrayIntoTypes(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertSchemaItemsObjectIntoTypes', () => {
    it('should work', () => {
      spyOn(__internals__, 'getTypes').andCall(({ a }) => a.length ? [ a.join(' | ') ] : [])

      const inputs = [
        { a: [] },
        { a: [ 123 ] },
        { a: [ 234, 345 ] }
      ]
      const expected = [
        [],
        [ '123[]' ],
        [ '(234 | 345)[]' ]
      ]
      const actual = inputs.map(input => __internals__.convertSchemaItemsObjectIntoTypes(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertSchemaItemsIntoTypes', () => {
    it('should work', () => {
      spyOn(__internals__, 'convertSchemaItemsArrayIntoTypes').andCall(a => a[0] + 1)
      spyOn(__internals__, 'convertSchemaItemsObjectIntoTypes').andCall(({ a }) => a + 1)

      const inputs = [
        [ 123 ],
        { a: 234 }
      ]
      const expected = [
        124, 235
      ]
      const actual = inputs.map(input => __internals__.convertSchemaItemsIntoTypes(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertSchemaAllOfIntoTypes', () => {
    it('should work', () => {
      spyOn(__internals__, 'getTypes').andCall(a => a.map(v => v + 1))

      const inputs = [
        [ [ 123, 234 ], [ 345, 456 ] ]
      ]
      const expected = [
        [ 123 + 1, 234 + 1, 345 + 1, 456 + 1 ]
      ]
      const actual = inputs.map(input => __internals__.convertSchemaAllOfIntoTypes(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertSchemaAnyOfIntoTypes', () => {
    it('should work', () => {
      spyOn(__internals__, 'getTypes').andCall(a => a.map(v => v + 1))

      const inputs = [
        [ [ 123, 234 ], [ 345, 456 ] ]
      ]
      const expected = [
        [ '124 | 235 | 346 | 457' ]
      ]
      const actual = inputs.map(input => __internals__.convertSchemaAnyOfIntoTypes(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@getTypes', () => {
    it('should work', () => {
      spyOn(__internals__, 'getType').andCall(({ type }) => type + 1)
      spyOn(__internals__, 'convertSchemaItemsIntoTypes').andCall(v => [ v + 1 ])
      spyOn(__internals__, 'convertSchemaAllOfIntoTypes').andCall(v => [ v + 1 ])
      spyOn(__internals__, 'convertSchemaAnyOfIntoTypes').andCall(v => [ v + 1 ])

      const inputs = [
        { type: 456 },
        { $ref: '#/definitions/User' },
        { items: 123 },
        { allOf: 234 },
        { anyOf: 345 }
      ]
      const expected = [
        [ 457 ],
        [ 'User' ],
        [ 124 ],
        [ 235 ],
        [ 346 ]
      ]
      const actual = inputs.map(input => __internals__.getTypes(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@applyCommonProps', () => {
    it('should work', () => {
      const inputs = [
        [ { c: 345 }, { a: 123, b: 234 } ],
        [ { c: 345 }, { a: 123, b: 234,
          minProperties: 1,
          maxProperties: 2,
          discriminator: 3,
          discriminatorValue: 4,
          additionalProperties: 5,
          uniqueItems: 6,
          minItems: 7,
          maxItems: 8,
          pattern: 9,
          minLength: 10,
          maxLength: 11,
          maximum: 12,
          minimum: 13,
          multipleOf: 14,
          enum: 15,
          description: 16
        } ]
      ]
      const expected = [
        { c: 345 },
        {
          c: 345,
          minProperties: 1,
          maxProperties: 2,
          discriminator: 3,
          discriminatorValue: 4,
          additionalProperties: 5,
          uniqueItems: 6,
          minItems: 7,
          maxItems: 8,
          pattern: 9,
          minLength: 10,
          maxLength: 11,
          maximum: 12,
          minimum: 13,
          multipleOf: 14,
          enum: 15,
          description: 16
        }
      ]
      const actual = inputs.map(input => __internals__.applyCommonProps(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@addItemsProp', () => {
    it('should work', () => {
      spyOn(__internals__, 'getTypes').andCall(({ types }) => types)

      const inputs = [
        [ { a: 123 }, {} ],
        [ { a: 123, type: [ 'object' ] }, {} ],
        [ { a: 123, type: [ 'array' ] }, {} ],
        [ { a: 123, type: [ 'object' ] }, { items: { types: 456 } } ],
        [ { a: 123, type: [ 'array' ] }, { items: { types: 456 } } ],
        [ { a: 123, type: [ 'object' ] }, { items: { types: [ 234, 345 ] } } ],
        [ { a: 123, type: [ 'array' ] }, { items: { types: [ 234, 345 ] } } ]
      ]
      const expected = [
        { a: 123 },
        { a: 123, type: [ 'object' ] },
        { a: 123, type: [ 'array' ] },
        { a: 123, type: [ 'object' ] },
        { a: 123, type: [ 'array' ], items: 456 },
        { a: 123, type: [ 'object' ] },
        { a: 123, type: [ 'array' ], items: 234 }
      ]
      const actual = inputs.map(input => __internals__.addItemsProp(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@addPropertiesProp', () => {
    it('should work', () => {
      spyOn(__internals__, 'convertSchemaToDataType').andCall(({ v }) => {
        return { v: v + 1 }
      })

      const inputs = [
        [ { a: 123 }, {} ],
        [ { a: 123 }, { properties: {} } ],
        [ { a: 123 }, { properties: { b: { v: 234 }, c: { v: 345 } } } ],
        [ { a: 123 }, { properties: { b: { v: 234 }, c: { v: 345 } }, required: [ 'c' ] } ]
      ]
      const expected = [
        { a: 123 },
        { a: 123 },
        { a: 123, properties: { b: { v: 235, required: false }, c: { v: 346, required: false } } },
        { a: 123, properties: { b: { v: 235, required: false }, c: { v: 346 } } }
      ]
      const actual = inputs.map(input => __internals__.addPropertiesProp(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertSchemaToDataType', () => {
    it('should work', () => {
      spyOn(__internals__, 'getTypes').andCall(({ a }) => a ? a : [])
      spyOn(__internals__, 'applyCommonProps').andCall((d) => { d.common = 1; return d })
      spyOn(__internals__, 'addItemsProp').andCall((d) => { d.items = 2; return d })
      spyOn(__internals__, 'addPropertiesProp').andCall((d) => { d.props = 3; return d })

      const inputs = [
        {},
        { a: [ 123 ] },
        { a: [ 234, 345 ] }
      ]
      const expected = [
        { type: [], common: 1, items: 2, props: 3 },
        { type: 123, common: 1, items: 2, props: 3 },
        { type: [ 234, 345 ], common: 1, items: 2, props: 3 }
      ]
      const actual = inputs.map(input => __internals__.convertSchemaToDataType(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@dumpJSONIntoDataType', () => {
    it('should work', () => {
      const circular1 = {}
      const circular2 = { circular1 }
      circular1.circular2 = circular2
      const container = { a: { circular1 } }

      const inputs = [
        [ {}, [], OrderedMap() ],
        [ { a: 123 }, [], OrderedMap() ],
        [ { a: 123 }, [ '234', '345' ], OrderedMap() ],
        [ { a: 123 }, [ '234', '345' ], OrderedMap({
          '234': 123,
          '345': 234
        }) ],
        [ { a: 123 }, [ '234', '345' ], OrderedMap({
          '234': { schema: 234 * 2 },
          '345': { schema: 345 * 2 }
        }) ],
        [ container, [], OrderedMap() ]
      ]
      const expected = [
        JSON.stringify({}, null, 2),
        JSON.stringify({ a: 123 }, null, 2),
        JSON.stringify({ a: 123, definitions: { '234': {}, '345': {} } }, null, 2),
        JSON.stringify({ a: 123, definitions: { '234': {}, '345': {} } }, null, 2),
        JSON.stringify({ a: 123, definitions: { '234': 234 * 2, '345': 345 * 2 } }, null, 2),
        container
      ]
      const actual = inputs.map(input => __internals__.dumpJSONIntoDataType(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@getAllDependencies', () => {
    it('should work', () => {
      const inputs = [
        [ OrderedMap(), {}, 'a' ],
        [ OrderedMap(), { a: true }, 'b' ],
        [ OrderedMap({ b: {} }), { a: true }, 'b' ],
        [ OrderedMap({ b: {} }), { a: true }, 'b' ],
        [ OrderedMap({ b: { deps: [] } }), { a: true }, 'b' ],
        [ OrderedMap({ b: { deps: [] } }), { a: true }, 'b' ],
        [ OrderedMap({ b: { deps: [ '#/definitions/User' ] } }), { a: true }, 'b' ],
        [ OrderedMap({ b: { deps: [ '#/definitions/User' ] } }), { a: true }, 'b' ],
        [ OrderedMap({
          b: { deps: [ '#/defs/c' ] },
          c: { deps: [ '#/defs/d' ] }
        }), { a: true }, 'b' ],
        [ OrderedMap({
          b: { deps: [ '#/defs/c' ] },
          c: { deps: [ '#/defs/d' ] }
        }), { a: true }, 'b' ]
      ]
      const expected = [
        { a: true },
        { a: true, b: true },
        { a: true, b: true },
        { a: true, b: true },
        { a: true, b: true },
        { a: true, b: true },
        { a: true, b: true, User: true },
        { a: true, b: true, User: true },
        { a: true, b: true, c: true, d: true },
        { a: true, b: true, c: true, d: true }
      ]
      const actual = inputs.map(input => __internals__.getAllDependencies(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@markSchema', () => {
    it('should work', () => {
      const inputs = [
        [ OrderedMap({ a: { b: 123 } }), 'a' ]
      ]
      const expected = [
        OrderedMap({ a: { b: 123, marked: true } })
      ]
      const actual = inputs.map(input => __internals__.markSchema(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@unmarkSchemas', () => {
    it('should work', () => {
      const inputs = [
        OrderedMap({ a: { b: 123, marked: true }, c: { d: 234, marked: true } })
      ]
      const expected = [
        OrderedMap({ a: { b: 123 }, c: { d: 234 } })
      ]
      const actual = inputs.map(input => __internals__.unmarkSchemas(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@areSchemaAndDepsConvertible', () => {
    it('should work', () => {
      const inputs = [
        [ OrderedMap(), 'a' ],
        [ OrderedMap({ a: {} }), 'a' ],
        [ OrderedMap({ a: { convertible: false } }), 'a' ],
        [ OrderedMap({ a: { convertible: true } }), 'a' ],
        [ OrderedMap({ a: { convertible: true, deps: [] } }), 'a' ],
        [ OrderedMap({
          a: { convertible: true, deps: [ '#/def/b' ] },
          b: { convertible: true }
        }), 'a' ],
        [ OrderedMap({
          a: { convertible: true, deps: [ '#/def/b' ] },
          b: { convertible: false }
        }), 'a' ],
        [ OrderedMap({
          a: { convertible: true, deps: [ '#/def/c' ] },
          b: { convertible: false }
        }), 'a' ]
      ]
      const expected = [
        false,
        false,
        false,
        true,
        true,
        true,
        false,
        true
      ]
      const actual = inputs.map(input => __internals__.areSchemaAndDepsConvertible(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractCoreInformationFromConstraint', () => {
    it('should work', () => {
      spyOn(__internals__, 'getRefsFromSchema').andReturn(123)
      spyOn(__internals__, 'isConvertible').andReturn(true)

      const constraint = { toJSONSchema: () => ({ b: 234 }) }
      const inputs = [
        [ constraint, 'a' ]
      ]
      const expected = [
        { constraint, schema: { b: 234 }, deps: 123, convertible: true, name: 'a' }
      ]
      const actual = inputs.map(
        input => __internals__.extractCoreInformationFromConstraint(...input)
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractDataTypeFromCoreInformation', () => {
    it('should work', () => {
      const api = new Api({ store: new Store({
        constraint: OrderedMap({
          User: new Constraint.JSONSchema({
            type: 'object',
            properties: {
              pet: {
                $ref: '#/definitions/Pet'
              },
              home: {
                $ref: '#/definitions/Home'
              },
              car: {
                $ref: '#/definitions/Car'
              }
            }
          }),
          Pet: new Constraint.JSONSchema({
            type: 'object',
            properties: {
              home: {
                $ref: '#/definitions/Home'
              },
              race: { type: 'string', enum: [ 'cat', 'dog' ] }
            }
          }),
          Home: new Constraint.JSONSchema({
            type: 'object',
            properties: {
              address: {
                type: 'string'
              },
              postalCode: {
                type: 'integer'
              },
              surface: {
                type: 'number'
              }
            }
          }),
          Car: new Constraint.JSONSchema({
            type: 'object',
            properties: {
              numberOfSeats: {
                type: 'integer',
                minimum: 0,
                exclusiveMinimum: true
              }
            }
          })
        })
      }) })
      const coreInfo = __internals__.extractCoreInformationMapFromApi(api)

      const inputs = [
        [
          {
            schema: {
              type: 'object',
              properties: {
                home: {
                  $ref: '#/definitions/Home'
                }
              }
            },
            name: 'Pet',
            deps: [ '#/defintions/Home' ],
            convertible: true
          },
          'Pet',
          coreInfo
        ],
        [
          {
            schema: {
              type: 'object',
              properties: {
                numberOfSeats: {
                  type: 'integer',
                  exclusiveMinimum: true
                }
              }
            },
            name: 'Car',
            deps: [],
            convertible: false
          },
          'Car',
          coreInfo
        ],
        [
          {
            schema: {
              title: 'SimpleExternalSchema',
              type: 'string',
              pattern: '^[0-9a-f]{16}$'
            },
            name: 'SimpleExternalSchema',
            deps: [],
            convertible: true
          },
          null,
          coreInfo
        ],
        [
          {
            schema: {
              title: 'ExternalSchemaWithReference',
              type: 'object',
              properties: {
                home: {
                  $ref: '#/definitions/Home'
                }
              }
            },
            name: 'ExternalSchemaWithReference',
            deps: [ '#/definitions/Home' ],
            convertible: true
          },
          null,
          coreInfo
        ],
        [
          {
            schema: {
              title: 'ExternalJSONSchema',
              type: 'object',
              properties: {
                car: {
                  $ref: '#/definitions/Car'
                }
              }
            },
            name: 'ExternalJSONSchema',
            deps: [ '#/definitions/Car' ],
            convertible: true
          },
          null,
          coreInfo
        ]
      ]
      const expected = [
        {
          key: 'Pet',
          value: { type: 'object', properties: { home: { type: 'Home', required: false } } } },
        { key: 'Car', value: JSON.stringify({
          type: 'object',
          properties: {
            numberOfSeats: {
              type: 'integer',
              exclusiveMinimum: true
            }
          }
        }, null, 2) },
        { key: 'SimpleExternalSchema', value: {
          type: 'string',
          pattern: '^[0-9a-f]{16}$'
        } },
        { key: 'ExternalSchemaWithReference', value: {
          type: 'object',
          properties: {
            home: {
              type: 'Home',
              required: false
            }
          }
        } },
        { key: 'ExternalJSONSchema', value: JSON.stringify({
          title: 'ExternalJSONSchema',
          type: 'object',
          properties: {
            car: {
              $ref: '#/definitions/Car'
            }
          },
          definitions: {
            Car: {
              type: 'object',
              properties: {
                numberOfSeats: {
                  type: 'integer',
                  minimum: 0,
                  exclusiveMinimum: true
                }
              }
            }
          }
        }, null, 2) }
      ]
      const actual = inputs.map(input => __internals__.extractDataTypeFromCoreInformation(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractDataTypeFromCoreInformation', () => {
    /* eslint-disable max-statements */
    it('should work', () => {
      spyOn(__internals__, 'areSchemaAndDepsConvertible').andCall((v, n) => n === 'a')
      spyOn(__internals__, 'unmarkSchemas').andCall(c => c)

      spyOn(__internals__, 'convertSchemaToDataType').andCall(s => s.a)
      spyOn(__internals__, 'getAllDependencies').andReturn({ b: 'ignored', c: 345, d: 456 })
      spyOn(__internals__, 'dumpJSONIntoDataType').andCall((s, d) => {
        return [ s.b, ...d ].join(',')
      })

      const coreInformationData1 = { schema: { a: 123 }, name: 'a' }
      const coreInformationData2 = { schema: { b: 234 }, name: 'b' }
      const inputs = [
        [ coreInformationData1, 'a', OrderedMap({
          a: coreInformationData1,
          b: coreInformationData2
        }) ],
        [ coreInformationData2, 'b', OrderedMap({
          a: coreInformationData1,
          b: coreInformationData2
        }) ]
      ]
      const expected = [
        { key: 'a', value: 123 },
        { key: 'b', value: '234,c,d' }
      ]
      const actual = inputs.map(input => __internals__.extractDataTypeFromCoreInformation(...input))
      expect(actual).toEqual(expected)
    })
    /* eslint-enable max-statements */
  })

  describe('@extractDataTypesFromApi', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractDataTypeFromCoreInformation').andCall(
        (v, k) => ({ key: k, value: v * 2 + 1 })
      )

      const inputs = [
        OrderedMap({ a: 123, b: 234 })
      ]
      const expected = [
        { key: 'types', value: { a: 247, b: 469 } }
      ]
      const actual = inputs.map(input => __internals__.extractDataTypesFromApi(input))
      expect(actual).toEqual(expected)
    })

    it('it should work for real', () => {
      const api = new Api({ store: new Store({
        constraint: OrderedMap({
          User: new Constraint.JSONSchema({
            type: 'object',
            properties: {
              pet: {
                $ref: '#/definitions/Pet'
              },
              home: {
                $ref: '#/definitions/Home'
              },
              car: {
                $ref: '#/definitions/Car'
              }
            }
          }),
          Pet: new Constraint.JSONSchema({
            type: 'object',
            properties: {
              home: {
                $ref: '#/definitions/Home'
              },
              race: { type: 'string', enum: [ 'cat', 'dog' ] }
            }
          }),
          Home: new Constraint.JSONSchema({
            type: 'object',
            properties: {
              address: {
                type: 'string'
              },
              postalCode: {
                type: 'integer'
              },
              surface: {
                type: 'number'
              }
            }
          }),
          Car: new Constraint.JSONSchema({
            type: 'object',
            properties: {
              make: {
                type: 'string'
              },
              milage: {
                type: 'number',
                minimum: 0
              },
              numberOfSeats: {
                type: 'integer',
                minimum: 0,
                exclusiveMinimum: true
              }
            }
          })
        })
      }) })
      const input = __internals__.extractCoreInformationMapFromApi(api)
      const expected = { key: 'types', value: {
        User: JSON.stringify({
          type: 'object',
          properties: {
            pet: {
              $ref: '#/definitions/Pet'
            },
            home: {
              $ref: '#/definitions/Home'
            },
            car: {
              $ref: '#/definitions/Car'
            }
          },
          definitions: {
            Pet: {
              type: 'object',
              properties: {
                home: {
                  $ref: '#/definitions/Home'
                },
                race: { type: 'string', enum: [ 'cat', 'dog' ] }
              }
            },
            Home: {
              type: 'object',
              properties: {
                address: {
                  type: 'string'
                },
                postalCode: {
                  type: 'integer'
                },
                surface: {
                  type: 'number'
                }
              }
            },
            Car: {
              type: 'object',
              properties: {
                make: {
                  type: 'string'
                },
                milage: {
                  type: 'number',
                  minimum: 0
                },
                numberOfSeats: {
                  type: 'integer',
                  minimum: 0,
                  exclusiveMinimum: true
                }
              }
            }
          }
        }, null, 2),
        Home: {
          type: 'object',
          properties: {
            address: {
              required: false,
              type: 'string'
            },
            postalCode: {
              required: false,
              type: 'integer'
            },
            surface: {
              required: false,
              type: 'number'
            }
          }
        },
        Pet: {
          type: 'object',
          properties: {
            home: {
              required: false,
              type: 'Home'
            },
            race: { type: 'string', enum: [ 'cat', 'dog' ], required: false }
          }
        },
        Car: JSON.stringify({
          type: 'object',
          properties: {
            make: {
              type: 'string'
            },
            milage: {
              type: 'number',
              minimum: 0
            },
            numberOfSeats: {
              type: 'integer',
              minimum: 0,
              exclusiveMinimum: true
            }
          }
        }, null, 2)
      } }
      const actual = __internals__.extractDataTypesFromApi(input)

      expect(actual).toEqual(expected)
    })
  })

  describe('@extractTitleFromApi', () => {
    it('should work', () => {
      const inputs = [
        new Api(),
        new Api({ info: new Info() }),
        new Api({ info: new Info({ title: 123 }) })
      ]
      const expected = [
        null, null, { key: 'title', value: 123 }
      ]
      const actual = inputs.map(input => __internals__.extractTitleFromApi(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractDescriptionFromApi', () => {
    it('should work', () => {
      const inputs = [
        new Api(),
        new Api({ info: new Info() }),
        new Api({ info: new Info({ description: 123 }) })
      ]
      const expected = [
        null, null, { key: 'description', value: 123 }
      ]
      const actual = inputs.map(input => __internals__.extractDescriptionFromApi(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractVersionFromApi', () => {
    it('should work', () => {
      const inputs = [
        new Api(),
        new Api({ info: new Info() }),
        new Api({ info: new Info({ version: 123 }) })
      ]
      const expected = [
        null, null, { key: 'version', value: 123 }
      ]
      const actual = inputs.map(input => __internals__.extractVersionFromApi(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractBaseUriFromApi', () => {
    it('should work', () => {
      const inputs = [
        new Api(),
        new Api({ store: new Store() }),
        new Api({ store: new Store({ endpoint: OrderedMap() }) }),
        new Api({ store: new Store({ endpoint: OrderedMap({
          a: new URL({
            url: 'https://echo.paw.cloud/base',
            variableDelimiters: List([ '{', '}' ])
          })
          .set('protocol', List())
          .set('slashes', false)
          .set('hostname', null)
          .set('port', null)
          .set('pathname', null)
        }) }) }),
        new Api({ store: new Store({ endpoint: OrderedMap({
          a: new URL({ url: 'https://echo.paw.cloud/base', variableDelimiters: List([ '{', '}' ]) })
        }) }) }),
        new Api({ store: new Store({ endpoint: OrderedMap({
          a: new URL({ url: 'http://echo.paw.cloud/base', variableDelimiters: List([ '{', '}' ]) }),
          b: new URL({ url: 'http://echo.paw.cloud/:v:', variableDelimiters: List([ ':' ]) }),
          c: new URL({ url: 'https://echo.paw.cloud/base', variableDelimiters: List([ '{', '}' ]) })
        }) }) }),
        new Api({ store: new Store({ endpoint: OrderedMap({
          a: new URL({ url: 'http://echo.paw.cloud/:v:', variableDelimiters: List([ ':' ]) }),
          b: new URL({ url: 'http://echo.paw.cloud/base', variableDelimiters: List([ '{', '}' ]) }),
          c: new URL({ url: 'https://echo.paw.cloud/base', variableDelimiters: List([ '{', '}' ]) })
        }) }) })
      ]
      const expected = [
        null, null, null, null,
        { key: 'baseUri', value: 'https://echo.paw.cloud/base' },
        { key: 'baseUri', value: 'http://echo.paw.cloud/base' },
        { key: 'baseUri', value: 'http://echo.paw.cloud/{v}' }
      ]
      const actual = inputs.map(input => __internals__.extractBaseUriFromApi(input))
      expect(actual).toEqual(expected)
    })

    it('should work with variable', () => {
      const inputs = [
        new Api(),
        new Api({ store: new Store() }),
        new Api({ store: new Store({ variable: OrderedMap() }) }),
        new Api({ store: new Store({ variable: OrderedMap({
          a: new Variable({ name: 'a' })
        }) }) }),
        new Api({ store: new Store({ variable: OrderedMap({
          a: new Variable({
            name: 'a',
            values: OrderedMap({
              default: 'https://echo.paw.cloud/base'
            })
          })
        }) }) }),
        new Api({ store: new Store({ variable: OrderedMap({
          a: new Variable({
            name: 'a',
            values: OrderedMap({
              default: 'https://echo.paw.cloud/base',
              fallback: 'http://echo.paw.cloud/fallback'
            })
          })
        }) }) }),
        new Api({ store: new Store({ variable: OrderedMap({
          a: new Variable({
            name: 'a',
            values: OrderedMap({
              default: 'https://echo.paw.cloud/base',
              fallback: 'http://echo.paw.cloud/fallback'
            })
          }),
          b: new Variable({
            name: 'b',
            values: OrderedMap({
              default: 'https://echo.paw.cloud/other',
              fallback: 'http://echo.paw.cloud/otherfallback'
            })
          })
        }) }) })
      ]
      const expected = [
        null, null, null, null,
        { key: 'baseUri', value: 'https://echo.paw.cloud/base' },
        { key: 'baseUri', value: 'https://echo.paw.cloud/base' },
        { key: 'baseUri', value: 'https://echo.paw.cloud/base' }
      ]
      const actual = inputs.map(input => __internals__.extractBaseUriFromApi(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractParametersFromURLComponent', () => {
    it('should work', () => {
      const inputs = [
        new URLComponent(),
        new URLComponent({
          componentName: 'pathname',
          string: '/base',
          variableDelimiters: List([ '{', '}' ])
        }),
        new URLComponent({
          componentName: 'pathname',
          string: '/base/{userId}',
          variableDelimiters: List([ '{', '}' ])
        }).set('parameter', new Parameter({ superType: 'sequence' })),
        new URLComponent({
          componentName: 'pathname',
          string: '/base/{userId}',
          variableDelimiters: List([ '{', '}' ])
        }),
        new URLComponent({
          componentName: 'pathname',
          string: '/base/{userId}',
          variableDelimiters: List([ '{', '}' ]),
          parameter: new Parameter({
            key: 'pathname',
            name: 'pathname',
            type: 'string',
            constraints: List([ new Constraint.Enum([ '/base/123', '/base/234' ]) ])
          })
        }),
        new URLComponent({
          componentName: 'pathname',
          string: '/base/{userId}',
          variableDelimiters: List([ '{', '}' ]),
          parameter: new Parameter({
            key: 'pathname',
            name: 'pathname',
            type: 'string',
            superType: 'sequence',
            value: List([
              new Parameter({ type: 'string', default: '/base/' }),
              new Parameter({
                key: 'userId',
                name: 'User Id',
                type: 'string',
                constraints: List([ new Constraint.Enum([ '123', '234' ]) ])
              })
            ])
          })
        })
      ]
      const expected = [
        null,
        null,
        null,
        List([
          new Parameter({
            key: 'userId',
            name: 'userId',
            type: 'string',
            default: 'userId'
          })
        ]),
        null,
        List([
          new Parameter({
            key: 'userId',
            name: 'User Id',
            type: 'string',
            constraints: List([ new Constraint.Enum([ '123', '234' ]) ])
          })
        ])
      ]
      const actual = inputs.map(input => __internals__.extractParametersFromURLComponent(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertJSONSchemaIntoNamedParameter', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractCoreInformationFromSchema').andCall(s => {
        s.deps = s.deps.reduce((a, b) => a + b, 0)
        return s
      })

      spyOn(__internals__, 'extractDataTypeFromCoreInformation').andCall(
        ({ deps, convertible, name }, key, core) => {
          core.b = deps
          core.c = convertible
          core.n = name
          return core
        }
      )

      const inputs = [
        [ { a: 123 }, 'application/json', { deps: [ 234, 345 ], convertible: true } ],
        [ { a: 456 }, 'toto', { deps: [], convertible: false } ]
      ]

      const expected = [
        { a: 123, b: 234 + 345, c: true, n: 'application/json' },
        { a: 456, b: 0, c: false, n: 'toto' }
      ]

      const actual = inputs.map(
        input => __internals__.convertJSONSchemaIntoNamedParameter(...input)
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertParameterIntoNamedParameter', () => {
    it('should work', () => {
      spyOn(__internals__, 'convertJSONSchemaIntoNamedParameter').andCall((c, k, s) => {
        return Object.assign({}, s || {}, c, { key: k })
      })

      const inputs = [
        [ { a: 123 }, null ],
        [ { a: 123 }, new Parameter({ key: 234 }) ],
        [ { a: 123 }, new Parameter({
          key: 345,
          constraints: List([ new Constraint.JSONSchema({
            type: 'string',
            enum: [ 'abc', 'def' ]
          }) ])
        }) ]
      ]
      const expected = [
        null,
        { a: 123, key: 234, 'x-title': 234 },
        { a: 123, key: 345, type: 'string', enum: [ 'abc', 'def' ], 'x-title': 345 }
      ]
      const actual = inputs.map(input => __internals__.convertParameterIntoNamedParameter(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractBaseUriParametersFromApi', () => {
    it('should work', () => {
      spyOn(__internals__, 'convertParameterIntoNamedParameter').andCall(({ a }, p) => {
        return { key: p.get('key'), value: a }
      })

      const inputs = [
        [ { a: 123 }, new Api() ],
        [ { a: 123 }, new Api({ store: new Store() }) ],
        [ { a: 123 }, new Api({ store: new Store({ endpoint: OrderedMap() }) }) ],
        [ { a: 123 }, new Api({ store: new Store({ endpoint: OrderedMap({
          b: new URL({
            url: 'https://echo.paw.cloud/base',
            variableDelimiters: List([ '{', '}' ])
          })
        }) }) }) ],
        [ { a: 123 }, new Api({ store: new Store({ endpoint: OrderedMap({
          b: new URL({
            url: 'https://{sub}.paw.cloud:{port}/base/{userId}',
            variableDelimiters: List([ '{', '}' ])
          })
        }) }) }) ],
        [ { a: 234 }, new Api({ store: new Store({ endpoint: OrderedMap({
          b: new URL({
            url: 'https://{sub}.paw.cloud:{port}/base',
            variableDelimiters: List([ '{', '}' ])
          }),
          c: new URL({
            url: 'https://echo.paw.cloud/base/{userId}',
            variableDelimiters: List([ '{', '}' ])
          })
        }) }) }) ]
      ]

      const expected = [
        null,
        null,
        null,
        null,
        { key: 'baseUriParameters', value: { sub: 123, port: 123, userId: 123 } },
        { key: 'baseUriParameters', value: { sub: 234, port: 234 } }
      ]

      const actual = inputs.map(input => __internals__.extractBaseUriParametersFromApi(...input))
      expect(actual).toEqual(expected)
    })

    it('should work with variable', () => {
      spyOn(__internals__, 'convertParameterIntoNamedParameter').andCall(({ a }, p) => {
        return { key: p.get('key'), value: a }
      })

      const inputs = [
        [ { a: 123 }, new Api() ],
        [ { a: 123 }, new Api({ store: new Store() }) ],
        [ { a: 123 }, new Api({ store: new Store({ variable: OrderedMap() }) }) ],
        [ { a: 123 }, new Api({ store: new Store({ variable: OrderedMap({
          b: new Variable()
        }) }) }) ],
        [ { a: 123 }, new Api({ store: new Store({ variable: OrderedMap({
          b: new Variable({
            values: OrderedMap({ default: 'https://echo.paw.cloud/base' })
          })
        }) }) }) ],
        [ { a: 123 }, new Api({ store: new Store({ variable: OrderedMap({
          b: new Variable({
            values: OrderedMap({
              default: 'https://echo.paw.cloud/base',
              fallback: 'http://echo.paw.cloud/fallback'
            })
          })
        }) }) }) ],
        [ { a: 123 }, new Api({ store: new Store({ variable: OrderedMap({
          b: new Variable({
            values: OrderedMap({
              default: 'https://echo.paw.cloud/base'
            })
          }),
          c: new Variable({
            values: OrderedMap({
              default: 'https://echo.paw.cloud/base'
            })
          })
        }) }) }) ]
      ]

      const expected = [
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ]

      const actual = inputs.map(input => __internals__.extractBaseUriParametersFromApi(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractProtocolsFromApi', () => {
    it('should work', () => {
      const inputs = [
        new Api(),
        new Api({ store: new Store() }),
        new Api({ store: new Store({ variable: OrderedMap() }) }),
        new Api({ store: new Store({ variable: OrderedMap({
          b: new Variable()
        }) }) }),
        new Api({ store: new Store({ variable: OrderedMap({
          b: new Variable({
            values: OrderedMap({ default: 'https://echo.paw.cloud/base' })
          })
        }) }) }),
        new Api({ store: new Store({ variable: OrderedMap({
          b: new Variable({
            values: OrderedMap({
              default: 'https://echo.paw.cloud/base',
              fallback: 'http://echo.paw.cloud/fallback'
            })
          })
        }) }) }),
        new Api({ store: new Store({ variable: OrderedMap({
          b: new Variable({
            values: OrderedMap({
              default: 'https://echo.paw.cloud/base'
            })
          }),
          c: new Variable({
            values: OrderedMap({
              default: 'https://echo.paw.cloud/base'
            })
          })
        }) }) })
      ]
      const expected = [
        null,
        null,
        null,
        null,
        { key: 'protocols', value: [ 'HTTPS' ] },
        { key: 'protocols', value: [ 'HTTPS' ] },
        { key: 'protocols', value: [ 'HTTPS' ] }
      ]
      const actual = inputs.map(input => __internals__.extractProtocolsFromApi(input))
      expect(actual).toEqual(expected)
    })

    it('should work with enpoints', () => {
      const inputs = [
        new Api(),
        new Api({ store: new Store() }),
        new Api({ store: new Store({ endpoint: OrderedMap() }) }),
        new Api({ store: new Store({ endpoint: OrderedMap({
          b: new URL({
            url: 'https://echo.paw.cloud/base',
            variableDelimiters: List([ '{', '}' ])
          })
        }) }) }),
        new Api({ store: new Store({ endpoint: OrderedMap({
          b: new URL({
            url: 'https://echo.paw.cloud/base',
            variableDelimiters: List([ '{', '}' ])
          }).set('protocol', List())
        }) }) }),
        new Api({ store: new Store({ endpoint: OrderedMap({
          b: new URL({
            url: 'https://{sub}.paw.cloud:{port}/base/{userId}',
            variableDelimiters: List([ '{', '}' ])
          }).set('protocol', List([ 'http:', 'https:' ]))
        }) }) }),
        new Api({ store: new Store({ endpoint: OrderedMap({
          b: new URL({
            url: 'https://{sub}.paw.cloud:{port}/base/{userId}',
            variableDelimiters: List([ '{', '}' ])
          }).set('protocol', List([ 'http:', 'https:', 'wss:' ]))
        }) }) }),
        new Api({ store: new Store({ endpoint: OrderedMap({
          b: new URL({
            url: 'https://{sub}.paw.cloud:{port}/base/{userId}',
            variableDelimiters: List([ '{', '}' ])
          }).set('protocol', List([ 'ws:', 'wss:' ]))
        }) }) }),
        new Api({ store: new Store({ endpoint: OrderedMap({
          b: new URL({
            url: 'https://{sub}.paw.cloud:{port}/base',
            variableDelimiters: List([ '{', '}' ])
          }).set('protocol', List([ 'http:', 'https:' ])),
          c: new URL({
            url: 'https://echo.paw.cloud/base/{userId}',
            variableDelimiters: List([ '{', '}' ])
          })
        }) }) })
      ]
      const expected = [
        null,
        null,
        null,
        { key: 'protocols', value: [ 'HTTPS' ] },
        null,
        { key: 'protocols', value: [ 'HTTP', 'HTTPS' ] },
        { key: 'protocols', value: [ 'HTTP', 'HTTPS' ] },
        null,
        { key: 'protocols', value: [ 'HTTP', 'HTTPS' ] }
      ]
      const actual = inputs.map(input => __internals__.extractProtocolsFromApi(input))
      expect(actual).toEqual(expected)
    })

    it('should work with undefined', () => {
      const input = new Api({
        store: new Store({
          endpoint: OrderedMap({
            b: new URL({
              url: 'https://echo.paw.cloud/base',
              variableDelimiters: List([ '{', '}' ])
            }).set('protocol', List([ null ]))
          })
        })
      })
      const expected = null
      const actual = __internals__.extractProtocolsFromApi(input)
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractMediaTypeUUIDfromApi', () => {
    it('should work', () => {
      const inputs = [
        new Api(),
        new Api({ store: new Store({ parameter: OrderedMap({
          Irrelevant: new Parameter({
            key: 'user',
            default: '123'
          })
        }) }) }),
        new Api({ store: new Store({ parameter: OrderedMap({
          mediaType: new Parameter({
            key: 'Content-Type',
            default: '123'
          })
        }) }) }),
        new Api({ store: new Store({ parameter: OrderedMap({
          mediaType_1: new Parameter({
            key: 'Content-Type',
            default: '123'
          }),
          mediaType_2: new Parameter({
            key: 'Content-Type',
            default: '234'
          })
        }) }) })
      ]
      const expected = [
        null,
        null,
        'mediaType',
        null
      ]
      const actual = inputs.map(input => __internals__.extractMediaTypeUUIDfromApi(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractMediaTypeFromApi', () => {
    it('should work', () => {
      const inputs = [
        new Api(),
        new Api({ store: new Store() }),
        new Api({ store: new Store({ parameter: OrderedMap() }) }),
        new Api({ store: new Store({ parameter: OrderedMap({
          a: new Parameter({ key: 'Irrelevant' })
        }) }) }),
        new Api({ store: new Store({ parameter: OrderedMap({
          a: new Parameter({ key: 'Irrelevant' }),
          b: new Parameter({ key: 'Content-Type', default: 'application/json' })
        }) }) }),
        new Api({ store: new Store({ parameter: OrderedMap({
          a: new Parameter({ key: 'Irrelevant' }),
          b: new Parameter({ key: 'Content-Type', default: 'application/json' }),
          c: new Parameter({ key: 'Content-Type', default: 'application/xml' })
        }) }) }),
        new Api({ store: new Store({ parameter: OrderedMap({
          a: new Parameter({ key: 'Irrelevant' }),
          b: new Parameter({ key: 'Content-Type', default: 'application/json' }),
          c: new Parameter({ key: 'Content-Type', default: 'application/xml', usedIn: 'response' })
        }) }) }),
        new Api({ store: new Store({ parameter: OrderedMap({
          a: new Parameter({ key: 'Irrelevant' }),
          b: new Parameter({
            key: 'Content-Type',
            constraints: List([ new Constraint.Enum([ 'application/json', 'application/xml' ]) ])
          })
        }) }) }),
        new Api({ store: new Store({ parameter: OrderedMap({
          a: new Parameter({ key: 'Irrelevant' }),
          b: new Parameter({
            key: 'Content-Type',
            constraints: List([ new Constraint.Pattern('application/.*') ])
          })
        }) }) })
      ]
      const expected = [
        null,
        null,
        null,
        null,
        { key: 'mediaType', value: 'application/json' },
        null,
        { key: 'mediaType', value: 'application/json' },
        { key: 'mediaType', value: [ 'application/json', 'application/xml' ] },
        null
      ]
      const actual = inputs.map(input => __internals__.extractMediaTypeFromApi(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractMethodBaseFromRequest', () => {
    /* eslint-disable max-statements */
    it('should work', () => {
      spyOn(__internals__, 'extractDisplayNameFromRequest')
        .andCall(r => r ? { key: 'displayName', value: 123 } : null)
      spyOn(__internals__, 'extractDescriptionFromRequest')
        .andCall(r => r ? { key: 'description', value: 234 } : null)
      spyOn(__internals__, 'extractQueryParametersFromRequest')
        .andCall((c, r) => r ? { key: 'queryParameters', value: 345 } : null)
      spyOn(__internals__, 'extractHeadersFromRequest')
        .andCall((c, r) => r ? { key: 'headers', value: 456 } : null)
      spyOn(__internals__, 'extractBodyFromRequest')
        .andCall((c, r) => r ? { key: 'body', value: 567 } : null)
      spyOn(__internals__, 'extractProtocolsFromRequest')
        .andCall(r => r ? { key: 'protocols', value: 678 } : null)
      spyOn(__internals__, 'extractIsFromRequest')
        .andCall((m, r) => r ? { key: 'is', value: 789 } : null)
      spyOn(__internals__, 'extractSecuredByFromRequest')
        .andCall(r => r ? { key: 'securedBy', value: 890 } : null)
      spyOn(__internals__, 'extractResponsesFromRequest')
        .andCall((c, r) => r ? { key: 'responses', value: 901 } : null)

      const inputs = [
        [ null, null, null ],
        [ null, null, {} ]
      ]
      const expected = [
        null,
        {
          displayName: 123,
          description: 234,
          queryParameters: 345,
          headers: 456,
          body: 567,
          protocols: 678,
          is: 789,
          securedBy: 890,
          responses: 901
        }
      ]
      const actual = inputs.map(input => __internals__.extractMethodBaseFromRequest(...input))
      expect(actual).toEqual(expected)
    })
    /* eslint-enable max-statements */
  })

  describe('@extractTraitsFromInterfaces', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractMethodBaseFromRequest').andCall((m, c, v) => m + c + v)

      const inputs = [
        [ 123, 234, new Api() ],
        [ 123, 234, new Api({
          store: new Store({ interface: OrderedMap({
            abc: new Interface({ uuid: 'abc', level: 'response' })
          }) })
        }) ],
        [ 123, 234, new Api({
          store: new Store({ interface: OrderedMap({
            abc: new Interface({ uuid: 'abc', level: 'request' }),
            def: new Interface({ uuid: 'def', level: 'request', underlay: 345 })
          }) })
        }) ]
      ]
      const expected = [
        [],
        [],
        [ { key: 'abc', value: {} }, { key: 'def', value: 123 + 234 + 345 } ]
      ]
      const actual = inputs.map(input => __internals__.extractTraitsFromInterfaces(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractMethodBaseFromParameter', () => {
    it('should work', () => {
      spyOn(__internals__, 'convertParameterIntoNamedParameter').andCall((c) => {
        if (!c) {
          return null
        }

        if (c % 2 === 0) {
          return { value: c * 3 }
        }

        return { key: c, value: c * 2 }
      })
      const inputs = [
        [ null, new Parameter() ],
        [ 123, new Parameter() ],
        [ 123, new Parameter({ in: 'headers' }) ],
        [ 123, new Parameter({ in: 'queries' }) ],
        [ 123, new Parameter({ in: 'body' }) ],
        [ 234, new Parameter({ in: 'body' }) ]
      ]
      const expected = [
        null,
        null,
        { headers: { '123': 123 * 2 } },
        { queryParameters: { '123': 123 * 2 } },
        { body: { '123': 123 * 2 } },
        { body: 234 * 3 }
      ]
      const actual = inputs.map(input => __internals__.extractMethodBaseFromParameter(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractTraitsFromParameters', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractMethodBaseFromParameter').andCall((c, p) => {
        return p % 2 ? null : p + c
      })

      const inputs = [
        [ 'globalMediaType', 123, new Api() ],
        [ 'globalMediaType', 123, new Api({
          store: new Store({
            parameter: OrderedMap({
              user: 234
            })
          })
        }) ],
        [ 'globalMediaType', 123, new Api({
          store: new Store({
            parameter: OrderedMap({
              user: 234,
              globalMediaType: 345
            })
          })
        }) ],
        [ 'globalMediaType', 123, new Api({
          store: new Store({
            parameter: OrderedMap({
              user: 234,
              removed: 345,
              song: 456
            })
          })
        }) ]
      ]
      const expected = [
        [],
        [ { key: 'user', value: 123 + 234 } ],
        [ { key: 'user', value: 123 + 234 } ],
        [ { key: 'user', value: 123 + 234 }, { key: 'song', value: 123 + 456 } ]
      ]
      const actual = inputs.map(input => __internals__.extractTraitsFromParameters(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractMethodBaseFromResponse', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractResponsesFromRequest').andCall((c, req) => {
        if (req.getIn([ 'responses', '200' ])) {
          return { key: '200', value: c }
        }

        return null
      })

      const inputs = [
        [ 123, new Response() ],
        [ 123, new Response({ code: 200 }) ]
      ]
      const expected = [
        null,
        { '200': 123 }
      ]
      const actual = inputs.map(input => __internals__.extractMethodBaseFromResponse(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractTraitsFromSharedResponses', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractMethodBaseFromResponse').andCall((c, r) => {
        return r % 2 ? null : c + r
      })
      const inputs = [
        [ 123, new Api() ],
        [ 123, new Api({
          store: new Store({
            response: OrderedMap({
              default: 234,
              failure: 345
            })
          })
        }) ],
        [ 123, new Api({
          store: new Store({
            response: OrderedMap({
              default: 234,
              failure: 345,
              internal: 456
            })
          })
        }) ]
      ]
      const expected = [
        [],
        [ { key: 'response_default', value: 234 + 123 } ],
        [
          { key: 'response_default', value: 234 + 123 },
          { key: 'response_internal', value: 456 + 123 }
        ]
      ]
      const actual = inputs.map(input => __internals__.extractTraitsFromSharedResponses(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractTraitsFromApi', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractMethodBaseFromRequest').andCall((m, c, u) => {
        if (!u) {
          return null
        }

        return u.get('description')
      })

      spyOn(__internals__, 'extractTraitsFromParameters').andReturn([])

      const inputs = [
        [ { m: 123 }, { c: 234 }, new Api() ],
        [ { m: 123 }, { c: 234 }, new Api({ store: new Store() }) ],
        [ { m: 123 }, { c: 234 }, new Api({ store: new Store({ interface: OrderedMap() }) }) ],
        [ { m: 123 }, { c: 234 }, new Api({ store: new Store({ interface: OrderedMap({
          a: new Interface({ level: 'resource', uuid: 'a', underlay: new Resource() })
        }) }) }) ],
        [ { m: 123 }, { c: 234 }, new Api({ store: new Store({ interface: OrderedMap({
          a: new Interface({ level: 'resource', uuid: 'a', underlay: new Resource() }),
          b: new Interface({ level: 'request', uuid: 'b', underlay: null })
        }) }) }) ],
        [ { m: 123 }, { c: 234 }, new Api({ store: new Store({ interface: OrderedMap({
          a: new Interface({ level: 'resource', uuid: 'a', underlay: new Resource() }),
          b: new Interface({ level: 'request', uuid: 'b', underlay: null }),
          c: new Interface({ level: 'request', uuid: 'c', underlay: new Request({
            description: 123
          }) })
        }) }) }) ],
        [ { m: 123 }, { c: 234 }, new Api({ store: new Store({ interface: OrderedMap({
          a: new Interface({ level: 'resource', uuid: 'a', underlay: new Resource() }),
          b: new Interface({ level: 'request', uuid: 'b', underlay: null }),
          c: new Interface({ level: 'request', uuid: 'c', underlay: new Request({
            description: 123
          }) }),
          d: new Interface({ level: 'request', uuid: 'd', underlay: new Request({
            description: 234
          }) })
        }) }) }) ]
      ]
      const expected = [
        null,
        null,
        null,
        null,
        { key: 'traits', value: { b: {} } },
        { key: 'traits', value: { b: {}, c: 123 } },
        { key: 'traits', value: { b: {}, c: 123, d: 234 } }
      ]
      const actual = inputs.map(input => __internals__.extractTraitsFromApi(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractResourceTypesFromApi', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractResourceFromResourceRecord').andCall((m, c, v) => m + c + v)

      const inputs = [
        [ 123, 234, new Api() ],
        [ 123, 234, new Api({
          store: new Store({
            interface: OrderedMap({
              Irrelevant: new Interface({ level: 'response' })
            })
          })
        }) ],
        [ 123, 234, new Api({
          store: new Store({
            interface: OrderedMap({
              abc: new Interface({ uuid: 'abc', level: 'resource' }),
              def: new Interface({ uuid: 'def', level: 'resource', underlay: 345 }),
              ghi: new Interface({ uuid: 'ghi', level: 'resource', underlay: 456 })
            })
          })
        }) ]
      ]

      /* eslint-disable no-undefined */
      const expected = [
        null,
        null,
        { key: 'resourceTypes', value: {
          abc: undefined,
          def: 123 + 234 + 345,
          ghi: 123 + 234 + 456
        } }
      ]
      /* eslint-enable no-undefined */

      const actual = inputs.map(input => __internals__.extractResourceTypesFromApi(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractSecuritySchemeFromBasicAuth', () => {
    it('should work', () => {
      const inputs = [
        new Auth.Basic({ authName: 'basic_auth' }),
        new Auth.Basic({ authName: 'basic_auth', description: '123' })
      ]
      const expected = [
        { key: 'basic_auth', value: { type: 'Basic Authentication' } },
        { key: 'basic_auth', value: { type: 'Basic Authentication', description: '123' } }
      ]
      const actual = inputs.map(input => __internals__.extractSecuritySchemeFromBasicAuth(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractSecuritySchemeFromDigestAuth', () => {
    it('should work', () => {
      const inputs = [
        new Auth.Digest({ authName: 'digest_auth' }),
        new Auth.Digest({ authName: 'digest_auth', description: '123' })
      ]
      const expected = [
        { key: 'digest_auth', value: { type: 'Digest Authentication' } },
        { key: 'digest_auth', value: { type: 'Digest Authentication', description: '123' } }
      ]
      const actual = inputs.map(input => __internals__.extractSecuritySchemeFromDigestAuth(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractDescribedByForApiKeyAuth', () => {
    it('should work', () => {
      const inputs = [
        new Auth.ApiKey({ authName: 'api_key' }),
        new Auth.ApiKey({ authName: 'api_key', description: '123' }),
        new Auth.ApiKey({ authName: 'api_key', description: '123', in: 'header', name: 'abc' }),
        new Auth.ApiKey({ authName: 'api_key', description: '123', in: 'query', name: 'abc' })
      ]
      const expected = [
        null,
        null,
        { headers: { abc: { type: 'string' } } },
        { queryParameters: { abc: { type: 'string' } } }
      ]
      const actual = inputs.map(input => __internals__.extractDescribedByForApiKeyAuth(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractSecuritySchemeFromApiKeyAuth', () => {
    it('should work', () => {
      const inputs = [
        new Auth.ApiKey({ authName: 'api_key' }),
        new Auth.ApiKey({ authName: 'api_key', description: '123' }),
        new Auth.ApiKey({ authName: 'api_key', description: '123', in: 'header', name: 'abc' }),
        new Auth.ApiKey({ authName: 'api_key', description: '123', in: 'query', name: 'abc' })
      ]
      const expected = [
        { key: 'api_key', value: { type: 'Pass Through' } },
        { key: 'api_key', value: { type: 'Pass Through', description: '123' } },
        { key: 'api_key', value: { type: 'Pass Through',
          description: '123',
          describedBy: { headers: { abc: { type: 'string' } } }
        } },
        { key: 'api_key', value: { type: 'Pass Through',
          description: '123',
          describedBy: { queryParameters: { abc: { type: 'string' } } }
        } }
      ]
      const actual = inputs.map(input => __internals__.extractSecuritySchemeFromApiKeyAuth(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractSecuritySchemeFromOAuth1Auth', () => {
    it('should work', () => {
      const inputs = [
        new Auth.OAuth1({ authName: 'oauth1' }),
        new Auth.OAuth1({ authName: 'oauth1', description: '123' }),
        new Auth.OAuth1({
          authName: 'oauth1',
          description: '123',
          requestTokenUri: 'https://oauth.example.com/token'
        }),
        new Auth.OAuth1({
          authName: 'oauth1',
          description: '123',
          authorizationUri: 'https://oauth.example.com/authorization',
          tokenCredentialsUri: 'https://oauth.example.com/renew'
        }),
        new Auth.OAuth1({
          authName: 'oauth1',
          description: '123',
          authorizationUri: 'https://oauth.example.com/authorization',
          tokenCredentialsUri: 'https://oauth.example.com/renew',
          signature: 'hmac-sha1'
        })
      ]
      const expected = [
        { key: 'oauth1', value: {
          type: 'OAuth 1.0',
          settings: {
            requestTokenUri: null,
            authorizationUri: null,
            tokenCredentialsUri: null
          }
        } },
        { key: 'oauth1', value: {
          type: 'OAuth 1.0',
          description: '123',
          settings: {
            requestTokenUri: null,
            authorizationUri: null,
            tokenCredentialsUri: null
          }
        } },
        { key: 'oauth1', value: {
          type: 'OAuth 1.0',
          description: '123',
          settings: {
            requestTokenUri: 'https://oauth.example.com/token',
            authorizationUri: null,
            tokenCredentialsUri: null
          }
        } },
        { key: 'oauth1', value: {
          type: 'OAuth 1.0',
          description: '123',
          settings: {
            requestTokenUri: null,
            authorizationUri: 'https://oauth.example.com/authorization',
            tokenCredentialsUri: 'https://oauth.example.com/renew'
          }
        } },
        { key: 'oauth1', value: {
          type: 'OAuth 1.0',
          description: '123',
          settings: {
            requestTokenUri: null,
            authorizationUri: 'https://oauth.example.com/authorization',
            tokenCredentialsUri: 'https://oauth.example.com/renew',
            signatures: [ 'HMAC-SHA1' ]
          }
        } }
      ]
      const actual = inputs.map(input => __internals__.extractSecuritySchemeFromOAuth1Auth(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractSecuritySchemeFromOAuth2Auth', () => {
    it('should work', () => {
      const inputs = [
        new Auth.OAuth2({ authName: 'oauth_2' }),
        new Auth.OAuth2({ authName: 'oauth_2', description: '123' }),
        new Auth.OAuth2({
          authName: 'oauth_2',
          description: '123',
          flow: 'accessCode'
        }),
        new Auth.OAuth2({
          authName: 'oauth_2',
          description: '123',
          flow: 'implicit'
        }),
        new Auth.OAuth2({
          authName: 'oauth_2',
          description: '123',
          flow: 'application'
        }),
        new Auth.OAuth2({
          authName: 'oauth_2',
          description: '123',
          flow: 'password'
        }),
        new Auth.OAuth2({
          authName: 'oauth_2',
          description: '123',
          flow: 'implicit',
          authorizationUrl: 'https://oauth.example.com/portal',
          tokenUrl: 'https://oauth.example.com/renew'
        }),
        new Auth.OAuth2({
          authName: 'oauth_2',
          description: '123',
          flow: 'implicit',
          authorizationUrl: 'https://oauth.example.com/portal',
          tokenUrl: 'https://oauth.example.com/renew',
          scopes: List([ { key: 'read:any', value: '' }, { key: 'write:self', value: '' } ])
        })
      ]
      const expected = [
        { key: 'oauth_2', value: {
          type: 'OAuth 2.0',
          settings: {
            authorizationUri: null,
            accessTokenUri: null,
            authorizationGrants: []
          }
        } },
        { key: 'oauth_2', value: {
          type: 'OAuth 2.0',
          description: '123',
          settings: {
            authorizationUri: null,
            accessTokenUri: null,
            authorizationGrants: []
          }
        } },
        { key: 'oauth_2', value: {
          type: 'OAuth 2.0',
          description: '123',
          settings: {
            authorizationUri: null,
            accessTokenUri: null,
            authorizationGrants: [ 'authorization_code' ]
          }
        } },
        { key: 'oauth_2', value: {
          type: 'OAuth 2.0',
          description: '123',
          settings: {
            authorizationUri: null,
            accessTokenUri: null,
            authorizationGrants: [ 'implicit' ]
          }
        } },
        { key: 'oauth_2', value: {
          type: 'OAuth 2.0',
          description: '123',
          settings: {
            authorizationUri: null,
            accessTokenUri: null,
            authorizationGrants: [ 'client_credentials' ]
          }
        } },
        { key: 'oauth_2', value: {
          type: 'OAuth 2.0',
          description: '123',
          settings: {
            authorizationUri: null,
            accessTokenUri: null,
            authorizationGrants: [ 'password' ]
          }
        } },
        { key: 'oauth_2', value: {
          type: 'OAuth 2.0',
          description: '123',
          settings: {
            authorizationUri: 'https://oauth.example.com/portal',
            accessTokenUri: 'https://oauth.example.com/renew',
            authorizationGrants: [ 'implicit' ]
          }
        } },
        { key: 'oauth_2', value: {
          type: 'OAuth 2.0',
          description: '123',
          settings: {
            authorizationUri: 'https://oauth.example.com/portal',
            accessTokenUri: 'https://oauth.example.com/renew',
            authorizationGrants: [ 'implicit' ],
            scopes: [ 'read:any', 'write:self' ]
          }
        } }
      ]
      const actual = inputs.map(input => __internals__.extractSecuritySchemeFromOAuth2Auth(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractSecuritySchemeFromHawkAuth', () => {
    it('should work', () => {
      const inputs = [
        new Auth.Hawk({
          authName: 'hawk'
        }),
        new Auth.Hawk({
          authName: 'hawk',
          description: '123'
        }),
        new Auth.Hawk({
          authName: 'hawk',
          description: '123',
          id: '234',
          algorithm: 'md5'
        })
      ]
      const expected = [
        { key: 'hawk', value: {
          type: 'x-hawk',
          settings: {
            id: null,
            algorithm: null
          }
        } },
        { key: 'hawk', value: {
          type: 'x-hawk',
          description: '123',
          settings: {
            id: null,
            algorithm: null
          }
        } },
        { key: 'hawk', value: {
          type: 'x-hawk',
          description: '123',
          settings: {
            id: '234',
            algorithm: 'md5'
          }
        } }
      ]
      const actual = inputs.map(input => __internals__.extractSecuritySchemeFromHawkAuth(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractSecuritySchemeFromAWSSig4Auth', () => {
    it('should work', () => {
      const inputs = [
        new Auth.AWSSig4({
          authName: 'aws_sig_4'
        }),
        new Auth.AWSSig4({
          authName: 'aws_sig_4',
          description: '123'
        }),
        new Auth.AWSSig4({
          authName: 'aws_sig_4',
          description: '123',
          region: 'us-east-1',
          service: 'lambda'
        })
      ]
      const expected = [
        { key: 'aws_sig_4', value: {
          type: 'x-aws-sig4',
          settings: {
            region: null,
            service: null
          }
        } },
        { key: 'aws_sig_4', value: {
          type: 'x-aws-sig4',
          description: '123',
          settings: {
            region: null,
            service: null
          }
        } },
        { key: 'aws_sig_4', value: {
          type: 'x-aws-sig4',
          description: '123',
          settings: {
            region: 'us-east-1',
            service: 'lambda'
          }
        } }
      ]
      const actual = inputs.map(input => __internals__.extractSecuritySchemeFromAWSSig4Auth(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractSecuritySchemeFromAuth', () => {
    /* eslint-disable max-statements */
    it('should work', () => {
      spyOn(__internals__, 'extractSecuritySchemeFromBasicAuth').andReturn('Basic')
      spyOn(__internals__, 'extractSecuritySchemeFromDigestAuth').andReturn('Digest')
      spyOn(__internals__, 'extractSecuritySchemeFromApiKeyAuth').andReturn('ApiKey')
      spyOn(__internals__, 'extractSecuritySchemeFromOAuth1Auth').andReturn('OAuth1')
      spyOn(__internals__, 'extractSecuritySchemeFromOAuth2Auth').andReturn('OAuth2')
      spyOn(__internals__, 'extractSecuritySchemeFromHawkAuth').andReturn('Hawk')
      spyOn(__internals__, 'extractSecuritySchemeFromAWSSig4Auth').andReturn('AWSSig4')

      const inputs = [
        new Auth.Basic(),
        new Auth.Digest(),
        new Auth.ApiKey(),
        new Auth.OAuth1(),
        new Auth.OAuth2(),
        new Auth.Hawk(),
        new Auth.AWSSig4(),
        new Auth.NTLM()
      ]
      const expected = [
        'Basic',
        'Digest',
        'ApiKey',
        'OAuth1',
        'OAuth2',
        'Hawk',
        'AWSSig4',
        null
      ]
      const actual = inputs.map(input => __internals__.extractSecuritySchemeFromAuth(input))
      expect(actual).toEqual(expected)
    })
    /* eslint-enable max-statements */
  })

  describe('@extractSecuritySchemesFromApi', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractSecuritySchemeFromAuth').andCall((v, k) => {
        if (v % 2) {
          return { key: k, value: v }
        }

        return null
      })
      const inputs = [
        new Api(),
        new Api({ store: new Store() }),
        new Api({ store: new Store({ auth: OrderedMap() }) }),
        new Api({ store: new Store({ auth: OrderedMap({
          a: 123,
          b: 234,
          c: 345
        }) }) })
      ]
      const expected = [
        null,
        null,
        null,
        { key: 'securitySchemes', value: { a: 123, c: 345 } }
      ]
      const actual = inputs.map(input => __internals__.extractSecuritySchemesFromApi(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractSecuredByFromApi', () => {
    it('should work', () => {
      const inputs = [
        null
      ]
      const expected = [
        null
      ]
      const actual = inputs.map(input => __internals__.extractSecuredByFromApi(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractDisplayNameFromRequest', () => {
    it('should work', () => {
      const inputs = [
        new Request(),
        new Request({ name: '123' })
      ]
      const expected = [
        null,
        { key: 'displayName', value: '123' }
      ]
      const actual = inputs.map(input => __internals__.extractDisplayNameFromRequest(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractDescriptionFromRequest', () => {
    it('should work', () => {
      const inputs = [
        new Request(),
        new Request({ description: '123' })
      ]

      const expected = [
        null,
        { key: 'description', value: '123' }
      ]

      const actual = inputs.map(input => __internals__.extractDescriptionFromRequest(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractQueryParametersFromRequest', () => {
    it('should work', () => {
      spyOn(__internals__, 'convertParameterIntoNamedParameter').andCall(({ a }, v) => {
        return { key: v, value: a }
      })

      const inputs = [
        [ { a: 123 }, new Request() ],
        [ { a: 123 }, new Request({
          parameters: new ParameterContainer()
        }) ],
        [ { a: 123 }, new Request({
          parameters: new ParameterContainer({
            headers: OrderedMap({
              b: 234,
              c: 345
            })
          })
        }) ],
        [ { a: 123 }, new Request({
          parameters: new ParameterContainer({
            headers: OrderedMap({
              b: 234,
              c: 345
            }),
            queries: OrderedMap({
              d: 456,
              e: 567
            })
          })
        }) ]
      ]

      const expected = [
        null,
        null,
        null,
        { key: 'queryParameters', value: { '456': 123, '567': 123 } }
      ]

      const actual = inputs.map(input => __internals__.extractQueryParametersFromRequest(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractHeadersFromRequest', () => {
    it('should work', () => {
      spyOn(__internals__, 'convertParameterIntoNamedParameter').andCall(({ a }, v) => {
        return { key: v, value: a }
      })

      const inputs = [
        [ { a: 123 }, new Request() ],
        [ { a: 123 }, new Request({
          parameters: new ParameterContainer()
        }) ],
        [ { a: 123 }, new Request({
          parameters: new ParameterContainer({
            queries: OrderedMap({
              b: 234,
              c: 345
            })
          })
        }) ],
        [ { a: 123 }, new Request({
          parameters: new ParameterContainer({
            queries: OrderedMap({
              b: 234,
              c: 345
            }),
            headers: OrderedMap({
              d: 456,
              e: 567
            })
          })
        }) ]
      ]

      const expected = [
        null,
        null,
        null,
        { key: 'headers', value: { '456': 123, '567': 123 } }
      ]
      const actual = inputs.map(input => __internals__.extractHeadersFromRequest(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@isBodyContext', () => {
    it('should work', () => {
      const inputs = [
        new Context(),
        new Context({
          constraints: List([
            new Parameter({ key: 'If-Modified-Since', default: '2017-03-01', in: 'headers' })
          ])
        }),
        new Context({
          constraints: List([
            new Parameter({ key: 'Content-Type', default: 'application/json', in: 'body' })
          ])
        }),
        new Context({
          constraints: List([
            new Parameter({
              key: 'Content-Type',
              default: 'application/json',
              in: 'headers',
              usedIn: 'response'
            })
          ])
        }),
        new Context({
          constraints: List([
            new Parameter({ key: 'Content-Type', default: 'application/json', in: 'headers' })
          ])
        }),
        new Context({
          constraints: List([
            new Parameter({ key: 'Content-Type', default: 'application/json', in: 'headers' }),
            new Parameter({ key: 'Some-Other-Constraint', default: '123', in: 'headers' })
          ])
        }),
        new Context({
          constraints: List([
            new Parameter({ key: 'Content-Type', default: 'application/json', in: 'headers' }),
            new Parameter({ key: 'Content-Type', default: 'application/xml', in: 'headers' })
          ])
        })
      ]
      const expected = [
        false, false, false, false, true, true, false
      ]
      const actual = inputs.map(input => __internals__.isBodyContext(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@getBodyContextsFromRequest', () => {
    it('should work', () => {
      spyOn(__internals__, 'isBodyContext').andCall(c => c % 2)

      const inputs = [
        new Request(),
        new Request({
          contexts: List()
        }),
        new Request({
          contexts: List([
            123, 234, 345
          ])
        })
      ]
      const expected = [
        null, null, List([ 123, 345 ])
      ]
      const actual = inputs.map(input => __internals__.getBodyContextsFromRequest(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractSingleParameterFromRequestWithNoContext', () => {
    it('should work', () => {
      spyOn(__internals__, 'convertParameterIntoNamedParameter').andCall(
        ({ a }, v) => ({ value: a * v })
      )

      const inputs = [
        [ { a: 123 }, OrderedMap({ b: 234 }) ]
      ]
      const expected = [
        { key: 'body', value: 123 * 234 }
      ]
      const actual = inputs.map(
        input => __internals__.extractSingleParameterFromRequestWithNoContext(...input)
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractMultipleParametersFromRequestWithNoContext', () => {
    it('should work', () => {
      spyOn(__internals__, 'convertParameterIntoNamedParameter').andCall(({ a }, v) => {
        return { key: v, value: a }
      })

      const inputs = [
        [ { a: 123 }, OrderedMap() ],
        [ { a: 123 }, OrderedMap({ a: 234, b: 345 }) ]
      ]

      const expected = [
        null,
        { key: 'body', value: { properties: { '234': 123, '345': 123 } } }
      ]

      const actual = inputs.map(
        input => __internals__.extractMultipleParametersFromRequestWithNoContext(...input)
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractBodyParamsFromRequestWithNoContext', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractSingleParameterFromRequestWithNoContext').andReturn(100)
      spyOn(__internals__, 'extractMultipleParametersFromRequestWithNoContext').andReturn(200)

      const inputs = [
        [ { a: 123 }, new ParameterContainer() ],
        [ { a: 123 }, new ParameterContainer({ body: OrderedMap({ a: 234 }) }) ],
        [ { a: 123 }, new ParameterContainer({ body: OrderedMap({ a: 234, b: 345 }) }) ]
      ]
      const expected = [
        null,
        100,
        200
      ]

      const actual = inputs.map(
        input => __internals__.extractBodyParamsFromRequestWithNoContext(...input)
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@getContentTypeFromContext', () => {
    it('should work', () => {
      const inputs = [
        new Context(),
        new Context({ constraints: List() }),
        new Context({ constraints: List([
          new Parameter({ key: 'Irrelevant', in: 'headers', default: 123 })
        ]) }),
        new Context({ constraints: List([
          new Parameter({ key: 'Irrelevant', in: 'headers', default: 123 }),
          new Parameter({ key: 'Content-Type', in: 'headers', default: 234 })
        ]) }),
        new Context({ constraints: List([
          new Parameter({ key: 'Irrelevant', in: 'headers', default: 123 }),
          new Parameter({ key: 'Content-Type', in: 'headers', usedIn: 'response', default: 345 })
        ]) }),
        new Context({ constraints: List([
          new Parameter({ key: 'Irrelevant', in: 'headers', default: 234 }),
          new Parameter({ key: 'Content-Type', in: 'queries', default: 456 })
        ]) }),
        new Context({ constraints: List([
          new Parameter({ key: 'Irrelevant', in: 'headers', default: 123 }),
          new Parameter({ key: 'Content-Type', in: 'headers', default: 234 }),
          new Parameter({ key: 'Content-Type', in: 'headers', default: 567 })
        ]) })
      ]
      const expected = [
        null,
        null,
        null,
        234,
        null,
        null,
        234
      ]
      const actual = inputs.map(input => __internals__.getContentTypeFromContext(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractBodyParamsFromRequestForContext', () => {
    it('should work', () => {
      spyOn(__internals__, 'convertParameterIntoNamedParameter').andCall(({ a }, p) => {
        return { key: p.get('default'), value: a }
      })
      const inputs = [
        // null
        [ { a: 123 }, new ParameterContainer(), new Context() ],
        // { key: '*/*', value: { '234': 123 } }
        [
          { a: 123 },
          new ParameterContainer({
            body: OrderedMap({
              a: new Parameter({
                default: 234,
                applicableContexts: List([
                  new Parameter({
                    key: 'Content-Type',
                    constraints: List([ new Constraint.Enum([ 'json', 'xml' ]) ])
                  })
                ])
              })
            })
          }),
          new Context()
        ],
        // null
        [
          { a: 123 },
          new ParameterContainer({
            body: OrderedMap({
              a: new Parameter({
                default: 234,
                applicableContexts: List([
                  new Parameter({
                    key: 'Content-Type',
                    constraints: List([ new Constraint.Enum([ 'json', 'xml' ]) ])
                  })
                ])
              })
            })
          }),
          new Context({
            constraints: List([
              new Parameter({
                key: 'Content-Type',
                default: 'text'
              })
            ])
          })
        ],
        // { key: 'json', value: { '234': 123 } }
        [
          { a: 123 },
          new ParameterContainer({
            body: OrderedMap({
              a: new Parameter({
                default: 234,
                applicableContexts: List([
                  new Parameter({
                    key: 'Content-Type',
                    constraints: List([ new Constraint.Enum([ 'json', 'xml' ]) ])
                  })
                ])
              })
            })
          }),
          new Context({
            constraints: List([
              new Parameter({
                in: 'headers',
                key: 'Content-Type',
                default: 'json'
              })
            ])
          })
        ],
        // { key: 'json', value: 123 }
        [
          { a: 123 },
          new ParameterContainer({
            body: OrderedMap({
              a: new Parameter({
                default: null,
                applicableContexts: List([
                  new Parameter({
                    key: 'Content-Type',
                    constraints: List([ new Constraint.Enum([ 'json', 'xml' ]) ])
                  })
                ])
              })
            })
          }),
          new Context({
            constraints: List([
              new Parameter({
                in: 'headers',
                key: 'Content-Type',
                default: 'json'
              })
            ])
          })
        ],
        // { key: 'json', value: { '234': 123 } }
        [
          { a: 123 },
          new ParameterContainer({
            body: OrderedMap({
              a: new Parameter({
                default: 234,
                applicableContexts: List([
                  new Parameter({
                    key: 'Content-Type',
                    constraints: List([ new Constraint.Enum([ 'json', 'xml' ]) ])
                  })
                ])
              }),
              b: new Parameter({
                default: 345,
                applicableContexts: List([
                  new Parameter({
                    key: 'Content-Type',
                    constraints: List([ new Constraint.Enum([ 'xml', 'text' ]) ])
                  })
                ])
              })
            })
          }),
          new Context({
            constraints: List([
              new Parameter({
                in: 'headers',
                key: 'Content-Type',
                default: 'json'
              })
            ])
          })
        ]
      ]
      const expected = [
        null,
        { key: '*/*', value: { '234': 123 } },
        null,
        { key: 'json', value: { '234': 123 } },
        { key: 'json', value: 123 },
        { key: 'json', value: { '234': 123 } }
      ]
      const actual = inputs.map(
        input => __internals__.extractBodyParamsFromRequestForContext(...input)
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractBodyParamsFromRequestWithContexts', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractBodyParamsFromRequestForContext').andCall(({ a }, p, c) => {
        return p[c] ? { key: p[c], value: a } : null
      })
      const inputs = [
        [ { a: 123 }, List(), { b: 234 } ],
        [ { a: 123 }, List([ 'd' ]), { b: 234, c: 345 } ],
        [ { a: 123 }, List([ 'b' ]), { b: 234, c: 345 } ],
        [ { a: 123 }, List([ 'b', 'c' ]), { b: 234, c: 345 } ],
        [ { a: 123 }, List([ 'b', 'c', 'd' ]), { b: 234, c: 345 } ]
      ]
      const expected = [
        null,
        null,
        { key: 'body', value: { '234': 123 } },
        { key: 'body', value: { '234': 123, '345': 123 } },
        { key: 'body', value: { '234': 123, '345': 123 } }
      ]

      const actual = inputs.map(
        input => __internals__.extractBodyParamsFromRequestWithContexts(...input)
      )
      expect(actual).toEqual(expected)
    })

    it('should work with null single body param', () => {
      spyOn(__internals__, 'extractBodyParamsFromRequestForContext').andCall(({ a }, p, c) => {
        return p[c] ? { key: null, value: a } : null
      })
      const inputs = [
        [ { a: 123 }, List(), { b: 234 } ],
        [ { a: 123 }, List([ 'd' ]), { b: 234, c: 345 } ],
        [ { a: 123 }, List([ 'b' ]), { b: 234, c: 345 } ]
      ]
      const expected = [
        null,
        null,
        { key: 'body', value: 123 }
      ]

      const actual = inputs.map(
        input => __internals__.extractBodyParamsFromRequestWithContexts(...input)
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractBodyFromRequest', () => {
    it('should work', () => {
      spyOn(__internals__, 'getBodyContextsFromRequest').andCall(r => {
        return r.get('contexts').length ? r.get('contexts') : null
      })

      spyOn(__internals__, 'extractBodyParamsFromRequestWithNoContext').andCall(({ a }, p) => {
        return p instanceof ParameterContainer ? null : { key: p.c, value: a }
      })

      spyOn(__internals__, 'extractBodyParamsFromRequestWithContexts').andCall(({ a }, c, p) => {
        return { key: p[c[0]], value: a }
      })

      const inputs = [
        [ { a: 123 }, new Request() ],
        [ { a: 123 }, new Request({ parameters: { b: 234, c: 345 }, contexts: [] }) ],
        [ { a: 123 }, new Request({ parameters: { b: 234, c: 345 }, contexts: [ 'b' ] }) ]
      ]
      const expected = [
        null,
        { key: 345, value: 123 },
        { key: 234, value: 123 }
      ]
      const actual = inputs.map(input => __internals__.extractBodyFromRequest(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractProtocolsFromRequest', () => {
    it('should work', () => {
      const inputs = [
        new Request(),
        new Request({ endpoints: OrderedMap() }),
        new Request({ endpoints: OrderedMap({
          a: new Reference({ uuid: 'a' })
        }) }),
        new Request({ endpoints: OrderedMap({
          a: new URL({ url: 'https://echo.paw.cloud/base' })
        }) }),
        new Request({ endpoints: OrderedMap({
          a: new Reference({ uuid: 'a', overlay: new URL({ url: 'https://echo.paw.cloud/base' }) })
        }) }),
        new Request({ endpoints: OrderedMap({
          a: new URL({ url: 'wss://echo.paw.cloud/socket' }),
          b: new URL({ url: 'https://echo.paw.cloud/base' })
        }) }),
        new Request({ endpoints: OrderedMap({
          a: new URL().set('protocol', List([ 'ws', 'http', 'wss' ])),
          b: new URL({ url: 'https://echo.paw.cloud/base' })
        }) })
      ]
      const expected = [
        null,
        null,
        null,
        { key: 'protocols', value: [ 'HTTPS' ] },
        { key: 'protocols', value: [ 'HTTPS' ] },
        { key: 'protocols', value: [ 'HTTPS' ] },
        { key: 'protocols', value: [ 'HTTP' ] }
      ]
      const actual = inputs.map(input => __internals__.extractProtocolsFromRequest(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractTraitsFromRequestParameters', () => {
    it('should work', () => {
      const inputs = [
        [ 'globalMediaType', new Request() ],
        [ 'globalMediaType', new Request({
          parameters: new ParameterContainer({
            headers: OrderedMap({
              a: new Parameter(),
              b: new Reference({ uuid: 'globalMediaType' }),
              c: new Reference({ uuid: 'someOtherRef' })
            }),
            queries: OrderedMap({
              d: new Parameter(),
              e: new Reference({ uuid: 'someAdditionalRef' })
            }),
            body: OrderedMap({
              f: new Parameter(),
              g: new Reference({ uuid: 'someFinalRef' })
            })
          })
        }) ]
      ]
      const expected = [
        [],
        [ 'someOtherRef', 'someAdditionalRef', 'someFinalRef' ]
      ]
      const actual = inputs.map(input => __internals__.extractTraitsFromRequestParameters(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractTraitsFromResponses', () => {
    it('should work', () => {
      const inputs = [
        new Request(),
        new Request({
          responses: OrderedMap({
            default: new Response(),
            generic: new Reference({ uuid: '#/responses/ErrorResponse' }),
            internal: new Reference({ uuid: 'InternalErrorResponse' }),
            missingUUID: new Reference()
          })
        })
      ]
      const expected = [
        List(),
        List([ 'response_ErrorResponse', 'response_InternalErrorResponse', 'response_' ])
      ]
      const actual = inputs.map(input => __internals__.extractTraitsFromResponses(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractIsFromRequest', () => {
    it('should work', () => {
      const inputs = [
        [ { m: 123 }, new Request() ],
        [ { m: 123 }, new Request({ interfaces: OrderedMap() }) ],
        [ { m: 123 }, new Request({ interfaces: OrderedMap({
          a: new Reference({ uuid: 123 })
        }) }) ],
        [ { m: 123 }, new Request({ interfaces: OrderedMap({
          a: new Reference({ uuid: 123 }),
          b: new Interface({ uuid: 234 })
        }) }) ]
      ]
      const expected = [
        null,
        null,
        { key: 'is', value: [ 123 ] },
        { key: 'is', value: [ 123, 234 ] }
      ]
      const actual = inputs.map(input => __internals__.extractIsFromRequest(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractSecuredByFromRequest', () => {
    it('should work', () => {
      const inputs = [
        new Request(),
        new Request({
          auths: List([ new Auth.Basic() ])
        }),
        new Request({
          auths: List([
            null,
            new Reference({ uuid: 'basic_auth' }),
            new Reference({ uuid: 'basic_auth', overlay: new Auth.Basic({ username: 'john' }) }),
            new Reference({ uuid: 'oauth_2_auth' }),
            new Reference({ uuid: 'oauth_2_auth', overlay: new Auth.OAuth2({
              flow: 'implicit'
            }) }),
            new Reference({ uuid: 'oauth_2_auth', overlay: new Auth.OAuth2({
              scopes: List([ { key: 'read:any' }, { key: 'write:self' } ])
            }) })
          ])
        })
      ]
      const expected = [
        null,
        null,
        { key: 'securedBy', value: [
          null,
          'basic_auth',
          'basic_auth',
          'oauth_2_auth',
          'oauth_2_auth',
          { oauth_2_auth: { scopes: [ 'read:any', 'write:self' ] } }
        ] }
      ]
      const actual = inputs.map(input => __internals__.extractSecuredByFromRequest(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractSecuredByFromRequest', () => {
    it('should work', () => {
      const inputs = [
        new Request(),
        new Request({ auths: List() }),
        new Request({ auths: List([ new Auth.Basic() ]) }),
        new Request({ auths: List([ new Auth.Basic(), new Reference({ uuid: 123 }) ]) }),
        new Request({ auths: List([ new Reference({ uuid: 123 }), new Reference({ uuid: 234 }) ]) })
      ]
      const expected = [
        null,
        null,
        null,
        { key: 'securedBy', value: [ 123 ] },
        { key: 'securedBy', value: [ 123, 234 ] }
      ]
      const actual = inputs.map(input => __internals__.extractSecuredByFromRequest(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractDescriptionFromResponse', () => {
    it('should work', () => {
      const inputs = [
        new Response(),
        new Response({ description: 123 })
      ]
      const expected = [
        null,
        { key: 'description', value: 123 }
      ]
      const actual = inputs.map(input => __internals__.extractDescriptionFromResponse(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractHeadersFromResponse', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractHeadersFromRequest').andCall((c, r) => c + r)
      const inputs = [
        [ 123, 234 ]
      ]
      const expected = [
        123 + 234
      ]
      const actual = inputs.map(input => __internals__.extractHeadersFromResponse(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractBodyFromResponse', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractBodyFromRequest').andCall((c, r) => c + r)

      const inputs = [
        [ 123, 234 ]
      ]
      const expected = [
        123 + 234
      ]
      const actual = inputs.map(input => __internals__.extractBodyFromResponse(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractResponseFromResponseRecord', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractDescriptionFromResponse').andCall(({ desc }) => {
        return desc ? { key: 'description', value: desc } : null
      })

      spyOn(__internals__, 'extractHeadersFromResponse').andCall(({ headers }) => {
        return headers ? { key: 'headers', value: headers } : null
      })

      spyOn(__internals__, 'extractBodyFromResponse').andCall(({ body }) => {
        return body ? { key: 'body', value: body } : null
      })

      const inputs = [
        [ { headers: null, body: null }, { desc: null } ],
        [ { headers: 123, body: 234 }, { desc: null } ],
        [ { headers: null, body: null }, { desc: 345 } ],
        [ { headers: 123, body: 234 }, { desc: 345 } ]
      ]

      const expected = [
        null,
        { headers: 123, body: 234 },
        { description: 345 },
        { description: 345, headers: 123, body: 234 }
      ]

      const actual = inputs.map(input => __internals__.extractResponseFromResponseRecord(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractResponsesFromRequest', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractResponseFromResponseRecord').andCall((c, r) => {
        return r.get('description') ? r.get('description') + c : null
      })

      const inputs = [
        [ 123, new Request() ],
        [ 123, new Request({ responses: OrderedMap() }) ],
        [ 123, new Request({ responses: OrderedMap({
          '200': new Response({ code: 200, description: 234 })
        }) }) ],
        [ 123, new Request({ responses: OrderedMap({
          '200': new Response({ code: 200, description: null })
        }) }) ],
        [ 123, new Request({ responses: OrderedMap({
          '200': new Response({ code: 200, description: 234 }),
          '400': new Response({ code: 400, description: null }),
          '404': new Response({ code: 404, description: 345 })
        }) }) ],
        [ 123, new Request({ responses: OrderedMap({
          default: new Response({ code: 'default', description: 234 }),
          '400': new Response({ code: 400, description: null }),
          '404': new Response({ code: 404, description: 345 })
        }) }) ]
      ]

      const expected = [
        null,
        null,
        { key: 'responses', value: { '200': 234 + 123 } },
        null,
        { key: 'responses', value: { '200': 234 + 123, '404': 345 + 123 } },
        { key: 'responses', value: { '200': 234 + 123, '404': 345 + 123 } }
      ]

      const actual = inputs.map(input => __internals__.extractResponsesFromRequest(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractMethodFromRequest', () => {
    /* eslint-disable max-statements */
    it('should work', () => {
      spyOn(__internals__, 'extractDisplayNameFromRequest').andCall((r) => {
        const key = 'displayName'
        return r[key] ? { key, value: r[key] } : null
      })

      spyOn(__internals__, 'extractDescriptionFromRequest').andCall((r) => {
        const key = 'description'
        return r[key] ? { key, value: r[key] } : null
      })

      spyOn(__internals__, 'extractProtocolsFromRequest').andCall((r) => {
        const key = 'protocols'
        return r[key] ? { key, value: r[key] } : null
      })

      spyOn(__internals__, 'extractIsFromRequest').andCall((_, r) => {
        const key = 'is'
        return r[key] ? { key, value: r[key] } : null
      })

      spyOn(__internals__, 'extractSecuredByFromRequest').andCall((r) => {
        const key = 'securedBy'
        return r[key] ? { key, value: r[key] } : null
      })

      spyOn(__internals__, 'extractQueryParametersFromRequest').andCall((c) => {
        const key = 'queryParameters'
        return c[key] ? { key, value: c[key] } : null
      })

      spyOn(__internals__, 'extractHeadersFromRequest').andCall((c) => {
        const key = 'headers'
        return c[key] ? { key, value: c[key] } : null
      })

      spyOn(__internals__, 'extractBodyFromRequest').andCall((c) => {
        const key = 'body'
        return c[key] ? { key, value: c[key] } : null
      })

      spyOn(__internals__, 'extractResponsesFromRequest').andCall((c) => {
        const key = 'responses'
        return c[key] ? { key, value: c[key] } : null
      })

      const inputs = [
        [ {}, {}, {} ],
        [
          {},
          { queryParameters: 678, headers: 789, body: 890, responses: 901 },
          { displayName: 123, description: 234, protocols: 345, is: 456, securedBy: 567 }
        ]
      ]
      const expected = [
        null,
        {
          queryParameters: 678, headers: 789, body: 890, responses: 901,
          displayName: 123, description: 234, protocols: 345, is: 456, securedBy: 567
        }
      ]
      const actual = inputs.map(input => __internals__.extractMethodFromRequest(...input))
      expect(actual).toEqual(expected)
    })
    /* eslint-enable max-statements */
  })

  describe('@extractMethodEntryFromRequest', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractMethodFromRequest').andCall((m, c, r) => {
        return r.get('method') ? c : null
      })

      const inputs = [
        [ {}, 123, new Request() ],
        [ {}, 123, new Request({ method: 234 }) ]
      ]
      const expected = [
        null,
        { key: 234, value: 123 }
      ]
      const actual = inputs.map(input => __internals__.extractMethodEntryFromRequest(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractMethodsFromResource', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractMethodEntryFromRequest').andCall((m, c, r) => {
        return r % 2 === 0 ? { key: r, value: c } : null
      })

      const inputs = [
        [ {}, 123, new Resource() ],
        [ {}, 123, new Resource({ methods: OrderedMap() }) ],
        [ {}, 123, new Resource({ methods: OrderedMap({
          get: 234,
          post: 345,
          delete: 456
        }) }) ]
      ]
      const expected = [
        [],
        [],
        [ { key: 234, value: 123 }, { key: 456, value: 123 } ]
      ]
      const actual = inputs.map(input => __internals__.extractMethodsFromResource(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractDisplayNameFromResource', () => {
    it('should work', () => {
      const inputs = [
        new Resource(),
        new Resource({ name: 123 })
      ]
      const expected = [
        null,
        { key: 'displayName', value: 123 }
      ]
      const actual = inputs.map(input => __internals__.extractDisplayNameFromResource(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractDescriptionFromResource', () => {
    it('should work', () => {
      const inputs = [
        new Resource(),
        new Resource({ description: 123 })
      ]
      const expected = [
        null,
        { key: 'description', value: 123 }
      ]
      const actual = inputs.map(input => __internals__.extractDescriptionFromResource(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractTypeFromResource', () => {
    it('should work', () => {
      const inputs = [
        new Resource(),
        new Resource({ interfaces: OrderedMap() }),
        new Resource({ interfaces: OrderedMap({
          a: new Interface({ uuid: 123 }),
          b: new Interface({ uuid: 234 })
        }) }),
        new Resource({ interfaces: OrderedMap({
          a: new Interface({ uuid: 123 }),
          b: new Reference({ uuid: 234 }),
          c: new Reference({ uuid: 345 })
        }) })
      ]
      const expected = [
        null,
        null,
        null,
        { key: 'type', value: 234 }
      ]
      const actual = inputs.map(input => __internals__.extractTypeFromResource(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractUriParametersFromResource', () => {
    it('should work', () => {
      spyOn(__internals__, 'convertParameterIntoNamedParameter').andCall((c, p) => {
        return { key: p.get('key'), value: c }
      })

      const inputs = [
        [ 123, new Resource() ],
        [ 123, new Resource({
          path: new URL({
            url: 'https://echo.paw.cloud/users',
            variableDelimiters: List([ '{', '}' ])
          })
        }) ],
        [ 123, new Resource({
          path: new URL({
            url: 'https://echo.paw.cloud/users/{userId}/products',
            variableDelimiters: List([ '{', '}' ])
          })
        }) ]
      ]
      const expected = [
        null, null,
        { key: 'uriParameters', value: { userId: 123 } }
      ]
      const actual = inputs.map(input => __internals__.extractUriParametersFromResource(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractResourceFromResourceRecord', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractDisplayNameFromResource').andCall((r) => {
        const key = 'displayName'
        return r[key] ? { key, value: r[key] } : null
      })

      spyOn(__internals__, 'extractDescriptionFromResource').andCall((r) => {
        const key = 'description'
        return r[key] ? { key, value: r[key] } : null
      })

      spyOn(__internals__, 'extractTypeFromResource').andCall((r) => {
        const key = 'type'
        return r[key] ? { key, value: r[key] } : null
      })

      spyOn(__internals__, 'extractUriParametersFromResource').andCall((c, r) => {
        const key = 'uriParameters'
        return r[key] ? { key, value: r[key] } : null
      })

      spyOn(__internals__, 'extractMethodsFromResource').andCall((m, c) => {
        const key = 'get'
        return c[key] ? [ { key, value: c[key] } ] : []
      })

      const inputs = [
        [ {}, {}, {} ],
        [ {}, { get: 123 }, { displayName: 234, description: 345, type: 456, uriParameters: 567 } ]
      ]
      const expected = [
        {},
        { get: 123, displayName: 234, description: 345, type: 456, uriParameters: 567 }
      ]
      const actual = inputs.map(input => __internals__.extractResourceFromResourceRecord(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@nestResources', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractResourceFromResourceRecord').andCall((m, c, r) => {
        return { [r]: c }
      })

      const inputs = [
        [ {}, 123, [] ],
        [ {}, 123, [ { key: [ '' ], value: 234 } ] ],
        [ {}, 123, [ { key: [ 'paths' ], value: 234 } ] ],
        [ {}, 123, [ { key: [ 'paths', '{pathId}' ], value: 345 } ] ],
        [ {}, 123, [
          { key: [ 'paths' ], value: 234 }, { key: [ 'paths', '{pathId}' ], value: 345 }
        ] ]
      ]
      const expected = [
        {},
        { '/': { '234': 123 } },
        { '/paths': { '234': 123 } },
        { '/paths': { '/{pathId}': { '345': 123 } } },
        { '/paths': { '234': 123, '/{pathId}': { '345': 123 } } }
      ]
      const actual = inputs.map(input => __internals__.nestResources(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractResourcesFromApi', () => {
    it('should work', () => {
      spyOn(__internals__, 'nestResources').andCall((m, c, array) => {
        return array
          .map(({ key }) => ({
            key: '/' + key.join('/'),
            value: c
          }))
          .reduce(convertEntryListInMap, {})
      })

      const inputs = [
        [ {}, 123, new Api() ],
        [ {}, 123, new Api({ resources: OrderedMap() }) ],
        [ {}, 123, new Api({ resources: OrderedMap({
          a: new Resource({
            path: new URL({ url: '/paths/{{pathId}}', variableDelimiters: List([ '{{', '}}' ]) })
          }),
          b: new Resource({
            path: new URL({ url: '/paths', variableDelimiters: List([ '{{', '}}' ]) })
          })
        }) }) ]
      ]
      const expected = [
        [],
        [],
        [ { key: '/paths/{pathId}', value: 123 }, { key: '/paths', value: 123 } ]
      ]
      const actual = inputs.map(input => __internals__.extractResourcesFromApi(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createRAMLJSONModel', () => {
    /* eslint-disable max-statements */
    it('should work', () => {
      spyOn(__internals__, 'extractCoreInformationMapFromApi').andCall(a => {
        const key = 'coreInfo'
        return a[key] ? a[key] : null
      })

      spyOn(__internals__, 'extractMediaTypeUUIDfromApi').andCall(a => {
        const key = 'mediaTypeUUID'
        return a[key] ? a[key] : null
      })

      spyOn(__internals__, 'extractTitleFromApi').andCall(a => {
        const key = 'title'
        return a[key] ? { key, value: a[key] + 1 } : null
      })

      spyOn(__internals__, 'extractDescriptionFromApi').andCall(a => {
        const key = 'description'
        return a[key] ? { key, value: a[key] + 1 } : null
      })

      spyOn(__internals__, 'extractVersionFromApi').andCall(a => {
        const key = 'version'
        return a[key] ? { key, value: a[key] + 1 } : null
      })

      spyOn(__internals__, 'extractBaseUriFromApi').andCall(a => {
        const key = 'baseUri'
        return a[key] ? { key, value: a[key] + 1 } : null
      })

      spyOn(__internals__, 'extractBaseUriParametersFromApi').andCall((c, a) => {
        const key = 'baseUriParameters'
        return a[key] ? { key, value: a[key] + c } : null
      })

      spyOn(__internals__, 'extractProtocolsFromApi').andCall(a => {
        const key = 'protocols'
        return a[key] ? { key, value: a[key] + 1 } : null
      })

      spyOn(__internals__, 'extractMediaTypeFromApi').andCall(a => {
        const key = 'mediaType'
        return a[key] ? { key, value: a[key] + 1 } : null
      })

      spyOn(__internals__, 'extractDataTypesFromApi').andCall(c => {
        return c ? { key: 'types', value: c * 2 } : null
      })

      spyOn(__internals__, 'extractTraitsFromApi').andCall((m, c, a) => {
        const key = 'traits'
        return a[key] ? { key, value: a[key] + 1 } : null
      })

      spyOn(__internals__, 'extractResourceTypesFromApi').andCall((m, c, a) => {
        const key = 'resourceTypes'
        return a[key] ? { key, value: a[key] + 1 } : null
      })

      spyOn(__internals__, 'extractSecuritySchemesFromApi').andCall(a => {
        const key = 'securitySchemes'
        return a[key] ? { key, value: a[key] + 1 } : null
      })

      spyOn(__internals__, 'extractSecuredByFromApi').andCall(a => {
        const key = 'securedBy'
        return a[key] ? { key, value: a[key] + 1 } : null
      })

      spyOn(__internals__, 'extractResourcesFromApi').andCall((m, c, a) => {
        const key = 'resources'
        return a[key] ? [ { key, value: a[key] + c } ] : []
      })

      const inputs = [
        {},
        {
          coreInfo: 123,
          title: 234,
          description: 345,
          version: 456,
          baseUri: 567,
          baseUriParameters: 678,
          protocols: 789,
          mediaType: 890,
          traits: 246,
          resourceTypes: 357,
          securitySchemes: 468,
          securedBy: 579,
          resources: 680
        }
      ]
      const expected = [
        {},
        {
          title: 234 + 1,
          description: 345 + 1,
          version: 456 + 1,
          baseUri: 567 + 1,
          baseUriParameters: 678 + 123,
          protocols: 789 + 1,
          mediaType: 890 + 1,
          types: 123 * 2,
          traits: 246 + 1,
          resourceTypes: 357 + 1,
          securitySchemes: 468 + 1,
          securedBy: 579 + 1,
          resources: 680 + 123
        }
      ]
      const actual = inputs.map(input => __internals__.createRAMLJSONModel(input))
      expect(actual).toEqual(expected)
    })
    /* eslint-enable max-statements */
  })

  describe('@fixResponseCodes', () => {
    it('should work', () => {
      const inputs = [
        `
        #%RAML 1.0
        title: 'whatever'
        /users:
          get:
            description: some description that contains a triple digit - '123'
        `,
        `
        #%RAML 1.0
        title: 'whatever'
        /users:
          get:
            responses:
              '200':
                description: 'some description'
        `,
        `
        #%RAML 1.0
        title: 'whatever'
        /users:
          get:
            responses:
              '200':
                description: some description for '200' code that is not modified
        `
      ]

      const expected = [
        `
        #%RAML 1.0
        title: 'whatever'
        /users:
          get:
            description: some description that contains a triple digit - '123'
        `,
        `
        #%RAML 1.0
        title: 'whatever'
        /users:
          get:
            responses:
              200:
                description: 'some description'
        `,
        `
        #%RAML 1.0
        title: 'whatever'
        /users:
          get:
            responses:
              200:
                description: some description for '200' code that is not modified
        `
      ]

      const actual = inputs.map(input => __internals__.fixResponseCodes(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@serialize', () => {
    it('should work', () => {
      spyOn(__internals__, 'createRAMLJSONModel').andCall(a => a * 2)
      spyOn(__internals__, 'fixResponseCodes').andCall(r => 'fixed:' + r.split('\n')[1])

      const inputs = [
        { api: 123 },
        { api: 234 }
      ]
      const expected = [
        'fixed:246',
        'fixed:468'
      ]
      const actual = inputs.map(input => __internals__.serialize(input))
      expect(actual).toEqual(expected)
    })
  })
})
