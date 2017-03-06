/* eslint-disable max-nested-callbacks */
import expect, { spyOn, restoreSpies } from 'expect'
import { Record, OrderedMap, List } from 'immutable'

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
      spyOn(__internals__, 'convertSchemaToDataType').andCall(v => v + 1)

      const inputs = [
        [ { a: 123 }, {} ],
        [ { a: 123 }, { properties: {} } ],
        [ { a: 123 }, { properties: { b: 234, c: 345 } } ]
      ]
      const expected = [
        { a: 123 },
        { a: 123 },
        { a: 123, properties: { b: 235, c: 346 } }
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
        }) ]
      ]
      const expected = [
        JSON.stringify({}, null, 2),
        JSON.stringify({ a: 123 }, null, 2),
        JSON.stringify({ a: 123, definitions: { '234': {}, '345': {} } }, null, 2),
        JSON.stringify({ a: 123, definitions: { '234': {}, '345': {} } }, null, 2),
        JSON.stringify({ a: 123, definitions: { '234': 234 * 2, '345': 345 * 2 } }, null, 2)
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
        }), 'a' ]
      ]
      const expected = [
        false,
        false,
        false,
        true,
        true,
        true,
        false
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
        { key: 'Pet', value: { type: 'object', properties: { home: { type: 'Home' } } } },
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
              type: 'Home'
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
        Pet: {
          type: 'object',
          properties: {
            home: {
              type: 'Home'
            },
            race: { type: 'string', enum: [ 'cat', 'dog' ] }
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
        null, null, null,
        { key: 'baseUri', value: 'https://echo.paw.cloud/base' },
        { key: 'baseUri', value: 'http://echo.paw.cloud/base' },
        { key: 'baseUri', value: 'http://echo.paw.cloud/{v}' }
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
        { a: 123, key: 234, type: 'string', 'x-title': 234 },
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
  })

  describe('@extractProtocolsFromApi', () => {
    it('should work', () => {
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
        { key: 'mediaType', value: [ 'application/json', 'application/xml' ] }
      ]
      const actual = inputs.map(input => __internals__.extractMediaTypeFromApi(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractTraitsFromApi', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractMethodBaseFromRequest').andCall((u) => {
        if (!u) {
          return null
        }

        return u.get('description')
      })

      const inputs = [
        new Api(),
        new Api({ store: new Store() }),
        new Api({ store: new Store({ interface: OrderedMap() }) }),
        new Api({ store: new Store({ interface: OrderedMap({
          a: new Interface({ level: 'resource', uuid: 'a', underlay: new Resource() })
        }) }) }),
        new Api({ store: new Store({ interface: OrderedMap({
          a: new Interface({ level: 'resource', uuid: 'a', underlay: new Resource() }),
          b: new Interface({ level: 'request', uuid: 'b', underlay: null })
        }) }) }),
        new Api({ store: new Store({ interface: OrderedMap({
          a: new Interface({ level: 'resource', uuid: 'a', underlay: new Resource() }),
          b: new Interface({ level: 'request', uuid: 'b', underlay: null }),
          c: new Interface({ level: 'request', uuid: 'c', underlay: new Request({
            description: 123
          }) })
        }) }) }),
        new Api({ store: new Store({ interface: OrderedMap({
          a: new Interface({ level: 'resource', uuid: 'a', underlay: new Resource() }),
          b: new Interface({ level: 'request', uuid: 'b', underlay: null }),
          c: new Interface({ level: 'request', uuid: 'c', underlay: new Request({
            description: 123
          }) }),
          d: new Interface({ level: 'request', uuid: 'd', underlay: new Request({
            description: 234
          }) })
        }) }) })
      ]
      const expected = [
        null,
        null,
        null,
        null,
        null,
        { key: 'traits', value: { c: 123 } },
        { key: 'traits', value: { c: 123, d: 234 } }
      ]
      const actual = inputs.map(input => __internals__.extractTraitsFromApi(input))
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
        })
      ]
      const expected = [
        { key: 'oauth_2', value: {
          type: 'OAuth 2.0',
          settings: {
            authorizationUri: null,
            accessTokenUri: null,
            authorizationGrants: null
          }
        } },
        { key: 'oauth_2', value: {
          type: 'OAuth 2.0',
          description: '123',
          settings: {
            authorizationUri: null,
            accessTokenUri: null,
            authorizationGrants: null
          }
        } },
        { key: 'oauth_2', value: {
          type: 'OAuth 2.0',
          description: '123',
          settings: {
            authorizationUri: null,
            accessTokenUri: null,
            authorizationGrants: 'authorization_code'
          }
        } },
        { key: 'oauth_2', value: {
          type: 'OAuth 2.0',
          description: '123',
          settings: {
            authorizationUri: null,
            accessTokenUri: null,
            authorizationGrants: 'implicit'
          }
        } },
        { key: 'oauth_2', value: {
          type: 'OAuth 2.0',
          description: '123',
          settings: {
            authorizationUri: null,
            accessTokenUri: null,
            authorizationGrants: 'client_credentials'
          }
        } },
        { key: 'oauth_2', value: {
          type: 'OAuth 2.0',
          description: '123',
          settings: {
            authorizationUri: null,
            accessTokenUri: null,
            authorizationGrants: 'password'
          }
        } },
        { key: 'oauth_2', value: {
          type: 'OAuth 2.0',
          description: '123',
          settings: {
            authorizationUri: 'https://oauth.example.com/portal',
            accessTokenUri: 'https://oauth.example.com/renew',
            authorizationGrants: 'implicit'
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
})
