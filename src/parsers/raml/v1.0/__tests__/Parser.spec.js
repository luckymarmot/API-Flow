/* eslint-disable max-nested-callbacks */
import expect, { spyOn, restoreSpies } from 'expect'
import { OrderedMap, List } from 'immutable'

import Constraint from '../../../../models/Constraint'
import Auth from '../../../../models/Auth'
import Interface from '../../../../models/Interface'
import Store from '../../../../models/Store'
import Group from '../../../../models/Group'
import Parameter from '../../../../models/Parameter'
import URLComponent from '../../../../models/URLComponent'
import URL from '../../../../models/URL'

import Parser, { __internals__ } from '../Parser'

describe('parsers/raml/v1.0/Parser.js', () => {
  afterEach(() => restoreSpies())
  describe('{ Parser }', () => {
    describe('@parse', () => {
      it('should call __internals__.parse', () => {
        const expected = 1234
        spyOn(__internals__, 'parse').andReturn(expected)

        const parser = new Parser()
        const actual = parser.parse()

        expect(__internals__.parse).toHaveBeenCalled()
        expect(actual).toEqual(expected)
      })

      it('should call __internals__.parse with the correct arguments', () => {
        const expected = 1234
        spyOn(__internals__, 'parse').andReturn(expected)

        const options = { context: 123, items: 321, options: 234 }
        const input = '1235124125412'
        const parser = new Parser()
        const actual = parser.parse(options, input)

        expect(__internals__.parse).toHaveBeenCalledWith(options, input)
        expect(actual).toEqual(expected)
      })
    })
  })

  describe('@detect', () => {
    it('should work', () => {
      const input = '#%RAML 1.0'
      const expected = [ { format: 'raml', version: 'v1.0', score: 1 } ]
      const actual = __internals__.detect(input)
      expect(actual).toEqual(expected)
    })

    it('should return 0, if not exactly expected first line', () => {
      const input = '#%RAML 1.0 Overlay'
      const expected = [ { format: 'raml', version: 'v1.0', score: 0 } ]
      const actual = __internals__.detect(input)
      expect(actual).toEqual(expected)
    })
  })

  describe('@getAPIName', () => {
    it('should work', () => {
      const input = 'title: toto\nsomething: else'
      const expected = 'toto'
      const actual = __internals__.getAPIName(input)
      expect(actual).toEqual(expected)
    })
  })

  describe('@addTitle', () => {
    it('should work', () => {
      const schema = { a: 123 }
      const inputs = [
        { displayName: () => null, name: () => 'toto' },
        { displayName: () => 'toto', name: () => 'toto' },
        { displayName: () => 'titi', name: () => 'toto' }
      ]

      const expected = [
        { a: 123 },
        { a: 123 },
        { a: 123, title: 'titi' }
      ]

      const clone = (obj) => Object.assign({}, obj)

      const actual = inputs.map(input => __internals__.addTitle(clone(schema), input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@addDescription', () => {
    it('should work', () => {
      const inputs = [
        [ { a: 123 }, { description: () => null } ],
        [ { a: 123 }, { description: () => ({ toJSON: () => 'titi' }) } ]
      ]

      const expected = [
        { a: 123 },
        { a: 123, description: 'titi' }
      ]

      const actual = inputs.map(input => __internals__.addDescription(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@addExamples', () => {
    it('should work', () => {
      const inputs = [
        // No example
        [ { a: 123 }, { example: () => null, examples: () => [], kind: () => null } ],
        // Single Example, node is string
        [ { a: 123 }, {
          example: () => ({ value: () => '123' }),
          examples: () => [],
          kind: () => 'StringTypeDeclaration'
        } ],
        // Single Example, node is not a string (try to parse as JSON object)
        [ { a: 123 }, {
          example: () => ({ value: () => '{ "test": 234 }' }),
          examples: () => [],
          kind: () => 'JSONTypeDeclaration'
        } ],
        // Single Example, node is declared as not a string, but example is string
        [ { a: 123 }, {
          example: () => ({ value: () => 'abc345' }),
          examples: () => [],
          kind: () => 'JSONTypeDeclaration'
        } ],
        // examples key, node is tring
        [ { a: 123 }, {
          example: () => null,
          examples: () => [ { value: () => '456' } ],
          kind: () => 'StringTypeDeclaration'
        } ],
        // examples key, node is not a string
        [ { a: 123 }, {
          example: () => null,
          examples: () => [ { value: () => '{ "test": 567 }' } ],
          kind: () => 'JSONTypeDeclaration'
        } ],
        // examples key, node is declared as not a string, example is string
        [ { a: 123 }, {
          example: () => null,
          examples: () => [ { value: () => 'abc678' } ],
          kind: () => 'JSONTypeDeclaration'
        } ],
        // examples key overrides example key
        [ { a: 123 }, {
          example: () => ({ value: () => '789' }),
          examples: () => [ { value: () => '890' } ],
          kind: () => 'StringTypeDeclaration'
        } ]
      ]
      const expected = [
        // no example
        { a: 123 },
        // single example, node is string
        { a: 123, 'x-examples': [ '123' ] },
        // single example, node is not a string
        { a: 123, 'x-examples': [ { test: 234 } ] },
        // single example, node is not a string, but example is string
        { a: 123, 'x-examples': [ 'abc345' ] },
        // examples key, node is string
        { a: 123, 'x-examples': [ '456' ] },
        // examples key, node is not a string
        { a: 123, 'x-examples': [ { test: 567 } ] },
        // examples key, node is not a string, but example is string
        { a: 123, 'x-examples': [ 'abc678' ] },
        // override
        { a: 123, 'x-examples': [ '890' ] }
      ]
      const actual = inputs.map(input => __internals__.addExamples(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@addDescriptiveFields', () => {
    it('should work', () => {
      const merge = (...toAssign) => Object.assign({}, ...toAssign)

      spyOn(__internals__, 'addKey').andCall((obj) => merge(obj, { b: 234 }))
      spyOn(__internals__, 'addTitle').andCall((obj) => merge(obj, { c: 345 }))
      spyOn(__internals__, 'addDescription').andCall((obj) => merge(obj, { d: 456 }))
      spyOn(__internals__, 'addExamples').andCall((obj) => merge(obj, { e: 567 }))

      const input = { a: 123 }
      const node = { test: 'test' }
      const expected = { a: 123, b: 234, c: 345, d: 456, e: 567 }
      const actual = __internals__.addDescriptiveFields(input, node)

      expect(actual).toEqual(expected)

      expect(__internals__.addKey).toHaveBeenCalledWith({ a: 123 }, node)
      expect(__internals__.addTitle).toHaveBeenCalledWith({ a: 123, b: 234 }, node)
      expect(__internals__.addDescription).toHaveBeenCalledWith({ a: 123, b: 234, c: 345 }, node)
      expect(__internals__.addExamples).toHaveBeenCalledWith(
        { a: 123, b: 234, c: 345, d: 456 }, node
      )
    })
  })

  describe('@isMaybeJSON', () => {
    it('should work', () => {
      const inputs = [
        '{ "some": "JSON" }',
        '<not>a json</not>'
      ]
      const expected = [ true, false ]

      const actual = inputs.map(__internals__.isMaybeJSON)

      expect(actual).toEqual(expected)
    })
  })

  describe('@isMaybeXML', () => {
    it('should work', () => {
      const inputs = [
        '{ "not": "XML" }',
        '<xml>this is xml</xml>'
      ]
      const expected = [ false, true ]

      const actual = inputs.map(__internals__.isMaybeXML)

      expect(actual).toEqual(expected)
    })
  })

  describe('@isTypeDeclaration', () => {
    it('should work', () => {
      const inputs = [
        { kind: () => 'TypeDeclaration' },
        { kind: () => 'NotATypeDeclaration' }
      ]
      const expected = [ true, false ]
      const actual = inputs.map(__internals__.isTypeDeclaration)
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertJSONTypeDeclaration', () => {
    it('should work', () => {
      const inputs = [
        'notAJSONTypeDeclaration',
        '{ "a": [ "simple", "json", "declaration" ] }',
        '{ "rich": "a", "definitions": { "User": { "b": 123 }, "Song": { "c": 234 } } }'
      ]

      const expected = [
        [],
        [ { a: [ 'simple', 'json', 'declaration' ] } ],
        [ { rich: 'a' }, { $key: 'User', b: 123 }, { $key: 'Song', c: 234 } ]
      ]

      const actual = inputs.map(input => __internals__.convertJSONTypeDeclaration(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertXMLTypeDeclaration', () => {
    it('should work', () => {
      const inputs = [
        '<some>XML</some>'
      ]
      const expected = [
        [ { 'x-xml': '<some>XML</some>' } ]
      ]
      const actual = inputs.map(input => __internals__.convertXMLTypeDeclaration(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertInPlaceTypeDeclaration', () => {
    it('should work', () => {
      const inputs = [
        'User'
      ]
      const expected = [
        [ { $ref: '#/definitions/User' } ]
      ]
      const actual = inputs.map(input => __internals__.convertInPlaceTypeDeclaration(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@isAnyType', () => {
    it('should work', () => {
      const inputs = [
        'any',
        'NotAnAnyType'
      ]
      const expected = [
        true, false
      ]
      const actual = inputs.map(input => __internals__.isAnyType(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertAnyTypeDeclaration', () => {
    it('should work', () => {
      const inputs = [
        null
      ]
      const expected = [
        [ {} ]
      ]
      const actual = inputs.map(input => __internals__.convertAnyTypeDeclaration(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertTypeDeclaration', () => {
    it('should work', () => {
      const inputs = [
        { type: () => [ '{ "some": "json" }' ] },
        { type: () => [ '<some>XML</some>' ] },
        { type: () => [ 'any' ] },
        { type: () => [ 'User' ] }
      ]
      const expected = [
        [ { some: 'json' } ],
        [ { 'x-xml': '<some>XML</some>' } ],
        [ {} ],
        [ { $ref: '#/definitions/User' } ]
      ]
      const actual = inputs.map(input => __internals__.convertTypeDeclaration(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@addSimpleObjectFieldsToSchema', () => {
    it('should work', () => {
      const inputs = [
        [ { a: 123 }, {
          minProperties: () => null,
          maxProperties: () => null,
          additionalProperties: () => null,
          discriminator: () => null,
          discriminatorValue: () => null
        } ],
        [ { a: 123 }, {
          minProperties: () => 123,
          maxProperties: () => 234,
          additionalProperties: () => 345,
          discriminator: () => 456,
          discriminatorValue: () => 567
        } ]
      ]
      const expected = [
        { a: 123 },
        {
          a: 123,
          minProperties: 123,
          maxProperties: 234,
          additionalProperties: 345,
          discriminator: 456,
          discriminatorValue: 567
        }
      ]
      const actual = inputs.map(input => __internals__.addSimpleObjectFieldsToSchema(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertPropertyIntoSchemaEntry', () => {
    it('should work', () => {
      spyOn(__internals__, 'createSchema').andReturn([ 345, 456, 567 ])
      spyOn(__internals__, 'normalizeSchema').andCall(v => v * 2)

      const inputs = [
        { name: () => 123, required: () => true },
        { name: () => 234, required: () => false }
      ]
      const expected = [
        { key: 123, required: true, value: 690, deps: [ 456, 567 ] },
        { key: 234, required: false, value: 690, deps: [ 456, 567 ] }
      ]
      const actual = inputs.map(input => __internals__.convertPropertyIntoSchemaEntry(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@addPropertiesKeyToSchema', () => {
    it('should work', () => {
      const spy = spyOn(__internals__, 'addPropertyEntryToSchema').andReturn({ b: 234, c: 345 })

      const inputs = [
        [ { a: 123 }, [] ],
        [ { a: 123 }, [ 234, 345 ] ]
      ]
      const expected = [
        { a: 123 },
        { a: 123, properties: { b: 234, c: 345 } }
      ]
      const actual = inputs.map(input => __internals__.addPropertiesKeyToSchema(...input))
      expect(actual).toEqual(expected)

      expect(spy.calls.length).toEqual(2)
    })
  })

  describe('@addPropertyEntryToSchema', () => {
    it('should work', () => {
      const inputs = [
        [ { a: 123 }, { key: 234, value: { $key: 345, other: 456 } } ]
      ]

      const expected = [
        { a: 123, '234': { other: 456 } }
      ]

      const actual = inputs.map(input => __internals__.addPropertyEntryToSchema(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@addRequiredKeyToSchema', () => {
    it('should work', () => {
      const inputs = [
        [ { a: 123 }, [ { required: false, key: 123 }, { required: true, key: 234 } ] ]
      ]
      const expected = [
        { a: 123, required: [ 234 ] }
      ]
      const actual = inputs.map(input => __internals__.addRequiredKeyToSchema(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@getOtherSchemasFromPropertiesSchemas', () => {
    it('should work', () => {
      const inputs = [
        [],
        [ { deps: [ 123, 234 ] }, { deps: [ 345, 456 ] } ]
      ]
      const expected = [
        [],
        [ 123, 234, 345, 456 ]
      ]
      const actual = inputs.map(input => __internals__.getOtherSchemasFromPropertiesSchemas(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@getPropertiesSchema', () => {
    it('should work', () => {
      spyOn(__internals__, 'convertPropertyIntoSchemaEntry').andCall(v => v * 2)

      const inputs = [
        { properties: () => null },
        { properties: () => [] },
        { properties: () => [ 123, 234 ] }
      ]
      const expected = [
        [],
        [],
        [ 246, 468 ]
      ]
      const actual = inputs.map(input => __internals__.getPropertiesSchema(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@addPropertiesToSchema', () => {
    it('should work', () => {
      const merge = (...toAssign) => Object.assign({}, ...toAssign)

      const propsSchemas = [
        { deps: [] },
        { properties: { b: 234, c: 345 }, required: [ 'b', 'c' ], deps: [] },
        { deps: [ { b: 456 }, { c: 567 } ] }
      ]

      spyOn(__internals__, 'getPropertiesSchema').andCall(({ v }) => {
        return propsSchemas[v]
      })
      spyOn(__internals__, 'addPropertiesKeyToSchema').andCall((s, { properties }) => {
        if (properties) {
          return merge(s, { properties })
        }

        return s
      })
      spyOn(__internals__, 'addRequiredKeyToSchema').andCall((s, { required }) => {
        if (required) {
          return merge(s, { required })
        }

        return s
      })
      spyOn(__internals__, 'getOtherSchemasFromPropertiesSchemas').andCall(p => p.deps)

      const inputs = [
        [ { a: 123 }, { this: 'is a node', v: 0 } ],
        [ { a: 123 }, { this: 'is a node', v: 1 } ],
        [ { a: 123 }, { this: 'is a node', v: 2 } ]
      ]
      const expected = [
        [ { a: 123 } ],
        [ { a: 123, properties: { b: 234, c: 345 }, required: [ 'b', 'c' ] } ],
        [ { a: 123 }, { b: 456 }, { c: 567 } ]
      ]

      const actual = inputs.map(input => __internals__.addPropertiesToSchema(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@isJSONSchemaType', () => {
    it('should work', () => {
      const inputs = [
        'array', 'object', 'number', 'integer', 'string', 'boolean', 'nil', 'any', 'array | object'
      ]
      const expected = [
        true, true, true, true, true, true, false, false, false
      ]
      const actual = inputs.map(input => __internals__.isJSONSchemaType(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@isNilType', () => {
    it('should work', () => {
      const inputs = [
        'nil',
        'notNil'
      ]
      const expected = [
        true, false
      ]
      const actual = inputs.map(input => __internals__.isNilType(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@isImplicitArrayType', () => {
    it('should work', () => {
      const inputs = [
        'shouldMatch[]',
        'shouldNotMatch',
        '(complex|match)[]',
        '(complex[] | non-match[])'
      ]
      const expected = [
        true, false, true, false
      ]
      const actual = inputs.map(input => __internals__.isImplicitArrayType(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@getSchemaFromArrayType', () => {
    it('should work', () => {
      spyOn(__internals__, 'getSchemaFromType').andCall(({ schemas }) => schemas)

      const inputs = [
        { schemas: [ { a: 123 } ] },
        { schemas: [ { a: 234 }, { b: 345 } ] }
      ]
      const expected = [
        { type: 'array', items: { a: 123 } },
        { type: 'array', items: [ { a: 234 }, { b: 345 } ] }
      ]
      const actual = inputs.map(input => __internals__.getSchemaFromArrayType(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@getSchemaFromImplicitArrayType', () => {
    it('should work', () => {
      spyOn(__internals__, 'getSchemaFromArrayType').andCall(v => v)

      const inputs = [
        '(mixed|type)[]',
        'uniqueType[]',
        'weird[]|type[]'
      ]
      const expected = [
        'mixed|type',
        'uniqueType',
        null
      ]
      const actual = inputs.map(input => __internals__.getSchemaFromImplicitArrayType(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@getSchemaFromUnionType', () => {
    it('should work', () => {
      spyOn(__internals__, 'getSchemaListFromTypes').andCall(v => v)

      const inputs = [
        'union|type',
        'union | type',
        'weird |'
      ]
      const expected = [
        { anyOf: [ 'union', 'type' ] },
        { anyOf: [ 'union', 'type' ] },
        null
      ]
      const actual = inputs.map(input => __internals__.getSchemaFromUnionType(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@getSchemaFromReferenceType', () => {
    it('should work', () => {
      const inputs = [
        'User',
        'Song'
      ]
      const expected = [
        { $ref: '#/definitions/User' },
        { $ref: '#/definitions/Song' }
      ]
      const actual = inputs.map(input => __internals__.getSchemaFromReferenceType(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@getSchemaFromJSONType', () => {
    it('should work', () => {
      const inputs = [
        'array', 'object', 'number', 'integer', 'string', 'boolean', 'nil', 'any'
      ]
      const expected = [
        { type: 'array' },
        { type: 'object' },
        { type: 'number' },
        { type: 'integer' },
        { type: 'string' },
        { type: 'boolean' },
        null,
        null
      ]
      const actual = inputs.map(input => __internals__.getSchemaFromJSONType(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@getSchemaFromNilType', () => {
    it('should work', () => {
      const inputs = [
        'nil',
        'NotNil'
      ]
      const expected = [
        { type: 'null' },
        null
      ]
      const actual = inputs.map(input => __internals__.getSchemaFromNilType(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@getSchemaFromType', () => {
    it('should work', () => {
      const inputs = [
        'array', 'object', 'string', 'number', 'integer', 'boolean',
        'nil',
        'object[]',
        'object|array',
        'User'
      ]
      const expected = [
        { type: 'array' },
        { type: 'object' },
        { type: 'string' },
        { type: 'number' },
        { type: 'integer' },
        { type: 'boolean' },
        { type: 'null' },
        { type: 'array', items: { type: 'object' } },
        { anyOf: [ { type: 'object' }, { type: 'array' } ] },
        { $ref: '#/definitions/User' }
      ]
      const actual = inputs.map(input => __internals__.getSchemaFromType(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@getSchemaListFromTypes', () => {
    it('should work', () => {
      spyOn(__internals__, 'getSchemaFromType').andCall(v => v)

      const inputs = [
        [ 123, 234 ],
        [ 345, 456 ]
      ]
      const expected = [
        [ 123, 234 ],
        [ 345, 456 ]
      ]
      const actual = inputs.map(input => __internals__.getSchemaListFromTypes(input))
      expect(actual).toEqual(expected)
      expect(__internals__.getSchemaFromType.calls.length).toEqual(4)
    })
  })

  describe('@convertMultipleInheritanceObject', () => {
    it('should work', () => {
      const inputs = [
        [ 'User[]' ],
        [ 'User', 'Resident' ],
        [ 'array', 'Songs' ],
        [ 'Songs', 'array' ],
        [ 'array', '(Visitor|Resident)[]' ]
      ]
      const expected = [
        { type: 'array', items: { $ref: '#/definitions/User' } },
        { allOf: [ { $ref: '#/definitions/User' }, { $ref: '#/definitions/Resident' } ] },
        { type: 'array', allOf: [ { $ref: '#/definitions/Songs' } ] },
        { type: 'array', allOf: [ { $ref: '#/definitions/Songs' } ] },
        { allOf: [
          { type: 'array' },
          { type: 'array', items: {
            anyOf: [
              { $ref: '#/definitions/Visitor' },
              { $ref: '#/definitions/Resident' }
            ]
          } }
        ] }
      ]
      const actual = inputs.map(input => __internals__.convertMultipleInheritanceObject(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@getSchemasFromTypes', () => {
    it('should work', () => {
      spyOn(__internals__, 'convertMultipleInheritanceObject').andCall(v => v)

      const inputs = [
        123, 234, 345
      ]
      const expected = [
        123, 234, 345
      ]
      const actual = inputs.map(input => __internals__.getSchemasFromTypes(input))
      expect(actual).toEqual(expected)
      expect(__internals__.convertMultipleInheritanceObject.calls.length).toEqual(3)
    })
  })

  describe('@addInheritedTypes', () => {
    it('should work', () => {
      const inputs = [
        [ { a: 123 }, { type: () => [ 'nil' ] } ],
        [ { a: 123 }, { type: () => [ 'User' ] } ],
        [ { a: 123 }, { type: () => [ 'object[]' ] } ],
        [ { a: 123 }, { type: () => [ 'User', 'Resident' ] } ]
      ]
      const expected = [
        { a: 123, type: 'null' },
        { a: 123, allOf: [ { $ref: '#/definitions/User' } ] },
        { a: 123, type: 'array', items: { type: 'object' } },
        { a: 123, allOf: [ { $ref: '#/definitions/User' }, { $ref: '#/definitions/Resident' } ] }
      ]
      const actual = inputs.map(input => __internals__.addInheritedTypes(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertObjectTypeDeclaration', () => {
    it('should work', () => {
      const merge = (...toMerge) => Object.assign({}, ...toMerge)

      spyOn(__internals__, 'addInheritedTypes').andCall(s => merge(s, { a: 123 }))
      spyOn(__internals__, 'addSimpleObjectFieldsToSchema').andCall(s => merge(s, { b: 234 }))
      spyOn(__internals__, 'addPropertiesToSchema').andCall(s => {
        return [ merge(s, { c: 345 }), { d: 456 }, { e: 567 } ]
      })

      const inputs = [
        {}
      ]
      const expected = [
        [ { a: 123, b: 234, c: 345 }, { d: 456 }, { e: 567 } ]
      ]
      const actual = inputs.map(input => __internals__.convertObjectTypeDeclaration(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@addSimpleArrayFieldsToSchema', () => {
    it('should work', () => {
      const inputs = [
        [ { a: 123 }, {
          uniqueItems: () => null,
          minItems: () => null,
          maxItems: () => null
        } ],
        [ { a: 123 }, {
          uniqueItems: () => true,
          minItems: () => 2,
          maxItems: () => 5
        } ]
      ]
      const expected = [
        { a: 123 },
        { a: 123, uniqueItems: true, minItems: 2, maxItems: 5 }
      ]
      const actual = inputs.map(input => __internals__.addSimpleArrayFieldsToSchema(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@isNonDescriptKey', () => {
    it('should work', () => {
      const inputs = [
        'title', 'description', '$key', 'minItems', 'minimum', 'pattern'
      ]
      const expected = [
        false, false, false, true, true, true
      ]
      const actual = inputs.map(input => __internals__.isNonDescriptKey(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@normalizeSchema', () => {
    it('should work', () => {
      const inputs = [
        { title: 123, description: 234, $key: 345 },
        { title: 123, description: 234, $key: 345, type: 'array' },
        { title: 123, description: 234, $key: 345, type: 'array', minItems: 456 },
        { title: 123, description: 234, $key: 345, type: 'array', allOf: [ 567 ] },
        { title: 123, description: 234, $key: 345, allOf: [ 678, 789 ] },
        { title: 123, description: 234, $key: 345, allOf: [ { a: 890 } ] },
        { title: 123, description: 234, $key: 345, allOf: [ { title: 901 } ] }
      ]
      const expected = [
        { title: 123, description: 234, $key: 345 },
        { title: 123, description: 234, $key: 345, type: 'array' },
        { title: 123, description: 234, $key: 345, type: 'array', minItems: 456 },
        { title: 123, description: 234, $key: 345, type: 'array', allOf: [ 567 ] },
        { title: 123, description: 234, $key: 345, allOf: [ 678, 789 ] },
        { title: 123, description: 234, $key: 345, a: 890 },
        { title: 901, description: 234, $key: 345 }
      ]
      const actual = inputs.map(input => __internals__.normalizeSchema(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@getItemTypes', () => {
    it('should work', () => {
      const inputs = [
        { items: () => null, type: () => [] },
        { items: () => null, type: () => [ 'User' ] },
        { items: () => null, type: () => [ 'User[]' ] },
        { items: () => null, type: () => [ '(Visitor|Resident)[]' ] },
        { items: () => null, type: () => [ '(Visitor|Resident)[]', 'User[]' ] },
        { items: () => [], type: () => [] },
        { items: () => [], type: () => [ 'User' ] },
        { items: () => [], type: () => [ 'User[]' ] },
        { items: () => [], type: () => [ '(Visitor|Resident)[]' ] },
        { items: () => [], type: () => [ '(Visitor|Resident)[]', 'User[]' ] },
        { items: () => [ 'User', 'Resident' ], type: () => [] },
        { items: () => [ 'User', 'Resident' ], type: () => [ 'User' ] },
        { items: () => [ 'User', 'Resident' ], type: () => [ 'User[]' ] },
        { items: () => [ 'User', 'Resident' ], type: () => [ '(Visitor|Resident)[]' ] },
        { items: () => [ 'User', 'Resident' ], type: () => [ '(Visitor|Resident)[]', 'User[]' ] }
      ]
      const expected = [
        [],
        [],
        [ 'User' ],
        [ 'Visitor|Resident' ],
        [ 'Visitor|Resident', 'User' ],
        [],
        [],
        [ 'User' ],
        [ 'Visitor|Resident' ],
        [ 'Visitor|Resident', 'User' ],
        [ 'User', 'Resident' ],
        [ 'User', 'Resident' ],
        [ 'User', 'Resident' ],
        [ 'User', 'Resident' ],
        [ 'User', 'Resident' ]
      ]
      const actual = inputs.map(input => __internals__.getItemTypes(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@addItemFieldToSchema', () => {
    it('should work', () => {
      spyOn(__internals__, 'getItemTypes').andCall(({ b }) => b)
      spyOn(__internals__, 'getSchemasFromTypes').andCall(v => {
        if (v.c) {
          return ({ c: v.c * 2 })
        }

        return v
      })
      spyOn(__internals__, 'normalizeSchema').andCall(v => {
        if (v.c) {
          return ({ c: v.c + 1 })
        }

        return v
      })

      const inputs = [
        [ { a: 123 }, { b: { c: 234 } } ],
        [ { a: 123 }, { b: {} } ]
      ]
      const expected = [
        { a: 123, items: { c: 469 } },
        { a: 123 }
      ]
      const actual = inputs.map(input => __internals__.addItemFieldToSchema(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertArrayTypeDeclaration', () => {
    it('should work', () => {
      const merge = (...sources) => Object.assign({}, ...sources)

      spyOn(__internals__, 'addInheritedTypes').andCall((s, { a }) => merge(s, { a }, { b: a * 2 }))
      spyOn(__internals__, 'addSimpleArrayFieldsToSchema').andCall((s, { a }) => {
        return merge(s, { c: a * 3 })
      })
      spyOn(__internals__, 'addItemFieldToSchema').andCall((s, { a }) => {
        return merge(s, { d: a * 2 + 1 })
      })

      const inputs = [
        { a: 123 }
      ]
      const expected = [
        [ { a: 123, b: 246, c: 369, d: 247 } ]
      ]
      const actual = inputs.map(input => __internals__.convertArrayTypeDeclaration(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertUnionTypeDeclaration', () => {
    it('should work', () => {
      spyOn(__internals__, 'addInheritedTypes').andCall((s, { a }) => ({ a: a * 2 }))

      const inputs = [
        { a: 123 }
      ]
      const expected = [
        [ { a: 246 } ]
      ]
      const actual = inputs.map(input => __internals__.convertUnionTypeDeclaration(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@addSimpleStringFieldsToSchema', () => {
    it('should work', () => {
      const inputs = [
        [ { a: 123 }, {
          minLength: () => null,
          maxLength: () => null,
          pattern: () => null
        } ],
        [ { a: 123 }, {
          minLength: () => 123,
          maxLength: () => 234,
          pattern: () => 345
        } ]
      ]
      const expected = [
        { a: 123 },
        { a: 123, minLength: 123, maxLength: 234, pattern: 345 }
      ]
      const actual = inputs.map(input => __internals__.addSimpleStringFieldsToSchema(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertStringTypeDeclaration', () => {
    it('should work', () => {
      const merge = (...sources) => Object.assign({}, ...sources)

      spyOn(__internals__, 'addInheritedTypes').andCall((s, { a }) => merge(s, { a }, { b: a * 2 }))
      spyOn(__internals__, 'addSimpleStringFieldsToSchema').andCall((s, { a }) => {
        return merge(s, { c: a * 3 })
      })

      const inputs = [
        { a: 123 }
      ]
      const expected = [
        [ { a: 123, b: 246, c: 369 } ]
      ]
      const actual = inputs.map(input => __internals__.convertStringTypeDeclaration(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@addSimpleNumberFieldsToSchema', () => {
    it('should work', () => {
      const inputs = [
        [ { a: 123 }, {
          minimum: () => null,
          maximum: () => null,
          multipleOf: () => null
        } ],
        [ { a: 123 }, {
          minimum: () => 234,
          maximum: () => 345,
          multipleOf: () => 456
        } ]
      ]
      const expected = [
        { a: 123 },
        { a: 123, minimum: 234, maximum: 345, multipleOf: 456 }
      ]
      const actual = inputs.map(input => __internals__.addSimpleNumberFieldsToSchema(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertNumberTypeDeclaration', () => {
    it('should work', () => {
      const merge = (...sources) => Object.assign({}, ...sources)

      spyOn(__internals__, 'addInheritedTypes').andCall((s, { a }) => merge(s, { a }, { b: a * 2 }))
      spyOn(__internals__, 'addSimpleNumberFieldsToSchema').andCall((s, { a }) => {
        return merge(s, { c: a * 3 })
      })

      const inputs = [
        { a: 123 }
      ]
      const expected = [
        [ { a: 123, b: 246, c: 369 } ]
      ]
      const actual = inputs.map(input => __internals__.convertNumberTypeDeclaration(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertDateOnlyTypeDeclaration', () => {
    it('should work', () => {
      const inputs = [
        null
      ]
      const expected = [
        [
          {
            type: 'string',
            $ref: '#/definitions/$DateOnly'
          },
          {
            $key: '$DateOnly',
            type: 'string',
            pattern: '^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$',
            description: 'full-date as defined in RFC#3339'
          }
        ]
      ]
      const actual = inputs.map(input => __internals__.convertDateOnlyTypeDeclaration(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertTimeOnlyTypeDeclaration', () => {
    it('should work', () => {
      const inputs = [
        null
      ]
      const expected = [
        [
          {
            type: 'string',
            $ref: '#/definitions/$TimeOnly'
          },
          {
            $key: '$TimeOnly',
            type: 'string',
            pattern: '^([01][0-9]|20|21|22|23):[0-5][0-9]:([0-5][0-9]|60)(.[0-9]+)?$',
            description: 'full-time as defined in RFC#3339'
          }
        ]
      ]
      const actual = inputs.map(input => __internals__.convertTimeOnlyTypeDeclaration(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertDateTimeOnlyTypeDeclaration', () => {
    it('should work', () => {
      const inputs = [
        null
      ]
      const expected = [
        [
          {
            type: 'string',
            $ref: '#/definitions/$DateTimeOnly'
          },
          {
            $key: '$DateTimeOnly',
            type: 'string',
            pattern: '^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])T' +
              '([01][0-9]|20|21|22|23):[0-5][0-9]:([0-5][0-9]|60)(.[0-9]+)?$',
            description: 'full-time as defined in RFC#3339'
          }
        ]
      ]
      const actual = inputs.map(input => __internals__.convertDateTimeOnlyTypeDeclaration(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertDateTimeTypeDeclaration', () => {
    it('should work', () => {
      const inputs = [
        null
      ]
      const expected = [
        [
          {
            type: 'string',
            $ref: '#/definitions/$DateTime'
          },
          {
            $key: '$DateTime',
            type: 'string',
            description: 'datetime'
          }
        ]
      ]
      const actual = inputs.map(input => __internals__.convertDateTimeTypeDeclaration(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertFileTypeDeclaration', () => {
    it('should work', () => {
      const inputs = [
        null
      ]
      const expected = [
        [
          {
            type: 'string',
            $ref: '#/definitions/$File'
          },
          {
            $key: '$File',
            type: 'string',
            description: 'file',
            pattern: '^[^\u0000]*\u0000$'
          }
        ]
      ]
      const actual = inputs.map(input => __internals__.convertFileTypeDeclaration(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createSchema', () => {
    it('should work', () => {
      const merge = (...sources) => Object.assign({}, ...sources)

      spyOn(__internals__, 'convertTypeDeclaration').andReturn([ { a: 1 }, { b: 2 }, { c: 3 } ])
      spyOn(__internals__, 'convertObjectTypeDeclaration').andReturn([
        { a: 4 }, { b: 5 }, { c: 6 }
      ])
      spyOn(__internals__, 'convertObjectTypeDeclaration').andReturn([
        { a: 4 }, { b: 5 }, { c: 6 }
      ])
      spyOn(__internals__, 'convertArrayTypeDeclaration').andReturn([
        { a: 7 }, { b: 8 }, { c: 9 }
      ])
      spyOn(__internals__, 'convertUnionTypeDeclaration').andReturn([
        { a: 10 }, { b: 11 }, { c: 12 }
      ])
      spyOn(__internals__, 'convertStringTypeDeclaration').andReturn([
        { a: 13 }, { b: 14 }, { c: 15 }
      ])
      spyOn(__internals__, 'convertNumberTypeDeclaration').andReturn([
        { a: 16 }, { b: 17 }, { c: 18 }
      ])
      spyOn(__internals__, 'convertBooleanTypeDeclaration').andReturn([
        { a: 19 }, { b: 20 }, { c: 21 }
      ])
      spyOn(__internals__, 'convertDateOnlyTypeDeclaration').andReturn([
        { a: 22 }, { b: 23 }, { c: 24 }
      ])
      spyOn(__internals__, 'convertTimeOnlyTypeDeclaration').andReturn([
        { a: 25 }, { b: 26 }, { c: 27 }
      ])
      spyOn(__internals__, 'convertDateTimeOnlyTypeDeclaration').andReturn([
        { a: 28 }, { b: 29 }, { c: 30 }
      ])
      spyOn(__internals__, 'convertDateTimeTypeDeclaration').andReturn([
        { a: 31 }, { b: 32 }, { c: 33 }
      ])
      spyOn(__internals__, 'convertFileTypeDeclaration').andReturn([
        { a: 34 }, { b: 35 }, { c: 36 }
      ])
      spyOn(__internals__, 'addDescriptiveFields').andCall((s, { n }) => merge(s, { n }))


      const inputs = [
        { n: 0, kind: () => 'TypeDeclaration' },
        { n: 1, kind: () => 'ObjectTypeDeclaration' },
        { n: 2, kind: () => 'ArrayTypeDeclaration' },
        { n: 3, kind: () => 'UnionTypeDeclaration' },
        { n: 4, kind: () => 'StringTypeDeclaration' },
        { n: 5, kind: () => 'NumberTypeDeclaration' },
        { n: 6, kind: () => 'IntegerTypeDeclaration' },
        { n: 7, kind: () => 'BooleanTypeDeclaration' },
        { n: 8, kind: () => 'DateOnlyTypeDeclaration' },
        { n: 9, kind: () => 'TimeOnlyTypeDeclaration' },
        { n: 10, kind: () => 'DateTimeOnlyTypeDeclaration' },
        { n: 11, kind: () => 'DateTimeTypeDeclaration' },
        { n: 12, kind: () => 'FileTypeDeclaration' },
        { n: 13, kind: () => 'WeirdTypeDeclaration' },
        { n: 14, kind: () => null }
      ]
      const expected = [
        [ { a: 1, n: 0 }, { b: 2 }, { c: 3 } ],
        [ { a: 4, n: 1 }, { b: 5 }, { c: 6 } ],
        [ { a: 7, n: 2 }, { b: 8 }, { c: 9 } ],
        [ { a: 10, n: 3 }, { b: 11 }, { c: 12 } ],
        [ { a: 13, n: 4 }, { b: 14 }, { c: 15 } ],
        [ { a: 16, n: 5 }, { b: 17 }, { c: 18 } ],
        [ { a: 16, n: 6 }, { b: 17 }, { c: 18 } ],
        [ { a: 19, n: 7 }, { b: 20 }, { c: 21 } ],
        [ { a: 22, n: 8 }, { b: 23 }, { c: 24 } ],
        [ { a: 25, n: 9 }, { b: 26 }, { c: 27 } ],
        [ { a: 28, n: 10 }, { b: 29 }, { c: 30 } ],
        [ { a: 31, n: 11 }, { b: 32 }, { c: 33 } ],
        [ { a: 34, n: 12 }, { b: 35 }, { c: 36 } ],
        [ { n: 13 } ],
        [ { n: 14 } ]
      ]
      const actual = inputs.map(input => __internals__.createSchema(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@addSchemaToDefinitionsReducer', () => {
    it('should work', () => {
      const inputs = [
        [ { a: 123 }, { b: 234, $key: 'b' } ]
      ]
      const expected = [
        { a: 123, b: { b: 234 } }
      ]
      const actual = inputs.map(input => __internals__.addSchemaToDefinitionsReducer(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@addDefinitionsReducer', () => {
    it('should work', () => {
      spyOn(__internals__, 'createSchema').andCall(({ b, c }) => [ { b: b * 2 }, { c: c - 11 } ])
      spyOn(__internals__, 'normalizeSchema').andCall(({ b, c }) => {
        if (b) {
          return { b: b + 1 }
        }

        return { c: c * 2 }
      })
      spyOn(__internals__, 'addSchemaToDefinitionsReducer').andCall((s, n) => {
        return Object.assign({}, s, n)
      })

      const inputs = [
        [ { a: 123 }, { b: 234, c: 345 } ]
      ]
      const expected = [
        { a: 123, b: 469, c: 668 }
      ]
      const actual = inputs.map(input => __internals__.addDefinitionsReducer(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createDefinitions', () => {
    it('should work', () => {
      spyOn(__internals__, 'addDefinitionsReducer').andCall((s, v) => Object.assign(s, { [v]: v }))

      const inputs = [
        { types: () => [] },
        { types: () => [ 123, 234, 345 ] }
      ]
      const expected = [
        { definitions: {} },
        { definitions: { '123': 123, '234': 234, '345': 345 } }
      ]
      const actual = inputs.map(input => __internals__.createDefinitions(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractConstraintStore', () => {
    it('should work', () => {
      spyOn(__internals__, 'createDefinitions').andCall(v => v)
      const inputs = [
        { definitions: { User: 123, Song: 234 } }
      ]
      const expected = [
        OrderedMap({
          User: new Constraint.JSONSchema(123),
          Song: new Constraint.JSONSchema(234)
        })
      ]
      const actual = inputs.map(input => __internals__.extractConstraintStore(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractParameterStore', () => {
    it('should work', () => {
      spyOn(__internals__, 'getGlobalContentTypeParameter').andCall(v => v * 2)
      const inputs = [
        123
      ]
      const expected = [
        OrderedMap({ globalMediaType: 246 })
      ]
      const actual = inputs.map(input => __internals__.extractParameterStore(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractScopesFromOAuth2Settings', () => {
    it('should work', () => {
      const inputs = [
        { scopes: () => [] },
        { scopes: () => [ 'user:write', 'document:read' ] }
      ]
      const expected = [
        List(),
        List([ { key: 'user:write', value: '' }, { key: 'document:read', value: '' } ])
      ]
      const actual = inputs.map(input => __internals__.extractScopesFromOAuth2Settings(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractFlowFromOAuth2Settings', () => {
    it('should work', () => {
      const inputs = [
        { authorizationGrants: () => null },
        { authorizationGrants: () => [] },
        { authorizationGrants: () => [ 'authorization_code' ] },
        { authorizationGrants: () => [ 'implicit' ] },
        { authorizationGrants: () => [ 'password' ] },
        { authorizationGrants: () => [ 'client_credentials' ] },
        { authorizationGrants: () => [ 'implicit', 'authorization_code' ] },
        { authorizationGrants: () => [ 'weird' ] }
      ]
      const expected = [
        null,
        null,
        'code',
        'implicit',
        'resource_owner',
        'client_credentials',
        'implicit',
        null
      ]
      const actual = inputs.map(input => __internals__.extractFlowFromOAuth2Settings(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractTokenUrlFromOAuth2Settings', () => {
    it('should work', () => {
      const inputs = [
        { accessTokenUri: () => null },
        { accessTokenUri: () => 123 }
      ]
      const expected = [
        null,
        123
      ]
      const actual = inputs.map(input => __internals__.extractTokenUrlFromOAuth2Settings(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractAuthNameFromAuthScheme', () => {
    it('should work', () => {
      const inputs = [
        { name: () => null },
        { name: () => 123 }
      ]
      const expected = [
        null, 123
      ]
      const actual = inputs.map(input => __internals__.extractAuthNameFromAuthScheme(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertRAMLAuthIntoOAuth2AuthEntry', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractAuthNameFromAuthScheme').andCall(({ name }) => name)
      spyOn(__internals__, 'extractDescription').andCall(({ desc }) => desc)

      spyOn(__internals__, 'extractFlowFromOAuth2Settings').andCall(v => v + 1)
      spyOn(__internals__, 'extractAuthorizationUrlFromOAuth2Settings').andCall(v => v * 2)
      spyOn(__internals__, 'extractTokenUrlFromOAuth2Settings').andCall(v => v * 2 + 1)
      spyOn(__internals__, 'extractScopesFromOAuth2Settings').andCall(v => v * 3)

      const inputs = [
        { settings: () => 123, name: 234, desc: 345 }
      ]
      const expected = [
        { key: 234, value: new Auth.OAuth2({
          authName: 234,
          description: 345,
          flow: 124,
          authorizationUrl: 246,
          tokenUrl: 247,
          scopes: 369
        }) }
      ]
      const actual = inputs.map(input => __internals__.convertRAMLAuthIntoOAuth2AuthEntry(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractRequestTokenUriFromOAuth1Settings', () => {
    it('should work', () => {
      const inputs = [
        { requestTokenUri: () => null },
        { requestTokenUri: () => 123 }
      ]
      const expected = [
        null, 123
      ]
      const actual = inputs.map(
        input => __internals__.extractRequestTokenUriFromOAuth1Settings(input)
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractAuthorizationUriFromOAuth1Settings', () => {
    it('should work', () => {
      const inputs = [
        { authorizationUri: () => null },
        { authorizationUri: () => 123 }
      ]
      const expected = [
        null, 123
      ]
      const actual = inputs.map(
        input => __internals__.extractAuthorizationUriFromOAuth1Settings(input)
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractTokenCredentialsUriFromOAuth1Settings', () => {
    it('should work', () => {
      const inputs = [
        { tokenCredentialsUri: () => null },
        { tokenCredentialsUri: () => 123 }
      ]
      const expected = [
        null, 123
      ]

      const actual = inputs.map(
        input => __internals__.extractTokenCredentialsUriFromOAuth1Settings(input)
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractSignatureFromOAuth1Settings', () => {
    it('should work', () => {
      const inputs = [
        { signatures: () => null },
        { signatures: () => [] },
        { signatures: () => [ 123 ] }
      ]
      const expected = [
        null, null, 123
      ]
      const actual = inputs.map(input => __internals__.extractSignatureFromOAuth1Settings(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertRAMLAuthIntoOAuth1AuthEntry', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractAuthNameFromAuthScheme').andCall(({ name }) => name)
      spyOn(__internals__, 'extractDescription').andCall(({ desc }) => desc)

      spyOn(__internals__, 'extractRequestTokenUriFromOAuth1Settings').andCall(v => v + 1)
      spyOn(__internals__, 'extractAuthorizationUriFromOAuth1Settings').andCall(v => v * 2)
      spyOn(__internals__, 'extractTokenCredentialsUriFromOAuth1Settings').andCall(v => v * 2 + 1)
      spyOn(__internals__, 'extractSignatureFromOAuth1Settings').andCall(v => v * 3)

      const inputs = [
        { settings: () => 123, name: 234, desc: 345 }
      ]
      const expected = [
        {
          key: 234, value: new Auth.OAuth1({
            authName: 234,
            description: 345,
            requestTokenUri: 124,
            authorizationUri: 246,
            tokenCredentialsUri: 247,
            signature: 369
          })
        }
      ]
      const actual = inputs.map(input => __internals__.convertRAMLAuthIntoOAuth1AuthEntry(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractLocationAndKeyFromApiKeyScheme', () => {
    it('should work', () => {
      const inputs = [
        { describedBy: () => null },
        { describedBy: () => ({ headers: () => null, queryParameters: () => null }) },
        { describedBy: () => ({ headers: () => [], queryParameters: () => null }) },
        { describedBy: () => ({ headers: () => null, queryParameters: () => [] }) },
        { describedBy: () => ({ headers: () => [], queryParameters: () => [] }) },
        { describedBy: () => ({
          headers: () => [ { name: () => 123 }, { name: () => 234 } ],
          queryParameters: () => null
        }) },
        { describedBy: () => ({
          headers: () => null,
          queryParameters: () => [ { name: () => 345 }, { name: () => 456 } ]
        }) },
        { describedBy: () => ({
          headers: () => [ { name: () => 123 }, { name: () => 234 } ],
          queryParameters: () => [ { name: () => 345 }, { name: () => 456 } ]
        }) }
      ]
      const expected = [
        { key: null, location: null },
        { key: null, location: null },
        { key: null, location: null },
        { key: null, location: null },
        { key: null, location: null },
        { key: 123, location: 'header' },
        { key: 345, location: 'query' },
        { key: 123, location: 'header' }
      ]
      const actual = inputs.map(input => __internals__.extractLocationAndKeyFromApiKeyScheme(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertRAMLAuthIntoApiKeyAuthEntry', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractAuthNameFromAuthScheme').andCall(({ name }) => name)
      spyOn(__internals__, 'extractDescription').andCall(({ desc }) => desc)

      spyOn(__internals__, 'extractLocationAndKeyFromApiKeyScheme').andReturn({
        key: 456, location: 567
      })

      const inputs = [
        { name: 234, desc: 345 }
      ]
      const expected = [
        { key: 234, value: new Auth.ApiKey({
          authName: 234,
          description: 345,
          key: 456,
          in: 567
        }) }
      ]
      const actual = inputs.map(input => __internals__.convertRAMLAuthIntoApiKeyAuthEntry(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertRAMLAuthIntoBasicAuthEntry', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractAuthNameFromAuthScheme').andCall(({ name }) => name)
      spyOn(__internals__, 'extractDescription').andCall(({ desc }) => desc)

      const inputs = [
        { name: 234, desc: 345 }
      ]
      const expected = [
        { key: 234, value: new Auth.Basic({
          authName: 234, description: 345
        }) }
      ]
      const actual = inputs.map(input => __internals__.convertRAMLAuthIntoBasicAuthEntry(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertRAMLAuthIntoDigestAuthEntry', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractAuthNameFromAuthScheme').andCall(({ name }) => name)
      spyOn(__internals__, 'extractDescription').andCall(({ desc }) => desc)

      const inputs = [
        { name: 234, desc: 345 }
      ]
      const expected = [
        { key: 234, value: new Auth.Digest({
          authName: 234, description: 345
        }) }
      ]
      const actual = inputs.map(input => __internals__.convertRAMLAuthIntoDigestAuthEntry(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertRAMLAuthIntoAuthEntry', () => {
    it('should work', () => {
      spyOn(__internals__, 'convertRAMLAuthIntoOAuth2AuthEntry').andReturn(123)
      spyOn(__internals__, 'convertRAMLAuthIntoOAuth1AuthEntry').andReturn(234)
      spyOn(__internals__, 'convertRAMLAuthIntoApiKeyAuthEntry').andReturn(345)
      spyOn(__internals__, 'convertRAMLAuthIntoBasicAuthEntry').andReturn(456)
      spyOn(__internals__, 'convertRAMLAuthIntoDigestAuthEntry').andReturn(567)

      const inputs = [
        { kind: () => null },
        { kind: () => 'OAuth2SecurityScheme' },
        { kind: () => 'OAuth1SecurityScheme' },
        { kind: () => 'PassThroughSecurityScheme' },
        { kind: () => 'BasicSecurityScheme' },
        { kind: () => 'DigestSecurityScheme' },
        { kind: () => 'CustomSecurityScheme' }
      ]
      const expected = [
        null,
        123, 234, 345, 456, 567,
        null
      ]
      const actual = inputs.map(input => __internals__.convertRAMLAuthIntoAuthEntry(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractAuthStore', () => {
    it('should work', () => {
      spyOn(__internals__, 'convertRAMLAuthIntoAuthEntry').andCall(v => {
        if (!v) {
          return v
        }
        return { key: v, value: v }
      })

      const inputs = [
        { securitySchemes: () => null },
        { securitySchemes: () => [] },
        { securitySchemes: () => [ null, 123, 234 ] },
        { securitySchemes: () => [ 345, 456, null ] }
      ]
      const expected = [
        OrderedMap(),
        OrderedMap(),
        OrderedMap({ '123': 123, '234': 234 }),
        OrderedMap({ '345': 345, '456': 456 })
      ]
      const actual = inputs.map(input => __internals__.extractAuthStore(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractInterfaceNameFromResourceBase', () => {
    it('should work', () => {
      const inputs = [
        { name: () => null },
        { name: () => 123 }
      ]
      const expected = [
        null, 123
      ]
      const actual = inputs.map(input => __internals__.extractInterfaceNameFromResourceBase(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractInterfaceUUIDFromResourceName', () => {
    it('should work', () => {
      const inputs = [
        123, 234
      ]
      const expected = [
        'resourceType_123', 'resourceType_234'
      ]
      const actual = inputs.map(input => __internals__.extractInterfaceUUIDFromResourceName(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractInterfaceDescriptionFromResourceBase', () => {
    it('should work', () => {
      const inputs = [
        { usage: () => null },
        { usage: () => 123 }
      ]
      const expected = [
        null, 123
      ]
      const actual = inputs.map(
        input => __internals__.extractInterfaceDescriptionFromResourceBase(input)
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertResourceBaseIntoInterfaceEntry', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractInterfaceNameFromResourceBase').andCall(({ name }) => name)
      spyOn(__internals__, 'extractInterfaceDescriptionFromResourceBase').andCall(
        ({ desc }) => desc
      )
      spyOn(__internals__, 'convertRAMLResourceBaseIntoResourceInstance').andCall(
        (_, { underlay }) => underlay
      )

      spyOn(__internals__, 'extractInterfaceUUIDFromResourceName').andCall(v => v * 2)

      const inputs = [
        { name: 123, desc: 234, underlay: 345 }
      ]
      const expected = [
        { key: 246, value: new Interface({
          name: 123, uuid: 246, description: 234, underlay: 345, level: 'resource'
        }) }
      ]
      const actual = inputs.map(input => __internals__.convertResourceBaseIntoInterfaceEntry(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractInterfaceNameFromMethodBase', () => {
    it('should work', () => {
      const inputs = [
        { name: () => null },
        { name: () => 234 }
      ]
      const expected = [
        null, 234
      ]
      const actual = inputs.map(input => __internals__.extractInterfaceNameFromMethodBase(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractInterfaceUUIDFromMethodName', () => {
    it('should work', () => {
      const inputs = [
        123, 234
      ]
      const expected = [
        'trait_123', 'trait_234'
      ]
      const actual = inputs.map(input => __internals__.extractInterfaceUUIDFromMethodName(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractInterfaceDescriptionFromMethodBase', () => {
    it('should work', () => {
      const inputs = [
        { usage: () => null },
        { usage: () => 234 }
      ]
      const expected = [
        null, 234
      ]
      const actual = inputs.map(
        input => __internals__.extractInterfaceDescriptionFromMethodBase(input)
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertMethodBaseIntoInterfaceEntry', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractInterfaceNameFromMethodBase').andCall(({ name }) => name)
      spyOn(__internals__, 'extractInterfaceDescriptionFromMethodBase').andCall(
        ({ desc }) => desc
      )
      spyOn(__internals__, 'convertRAMLMethodBaseIntoRequestInstance').andCall(
        (_, { underlay }) => underlay
      )

      spyOn(__internals__, 'extractInterfaceUUIDFromMethodName').andCall(v => v * 2)

      const inputs = [
        { name: 123, desc: 234, underlay: 345 }
      ]
      const expected = [
        { key: 246, value: new Interface({
          name: 123, uuid: 246, description: 234, underlay: 345, level: 'request'
        }) }
      ]
      const actual = inputs.map(input => __internals__.convertMethodBaseIntoInterfaceEntry(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractInterfaceStore', () => {
    it('should work', () => {
      spyOn(__internals__, 'convertResourceBaseIntoInterfaceEntry').andCall(
        v => ({ key: v, value: v })
      )
      spyOn(__internals__, 'convertMethodBaseIntoInterfaceEntry').andCall(
        v => ({ key: v, value: v })
      )

      const inputs = [
        { resourceTypes: () => null, traits: () => null },
        { resourceTypes: () => [], traits: () => null },
        { resourceTypes: () => [ 123, 234 ], traits: () => null },
        { resourceTypes: () => null, traits: () => [] },
        { resourceTypes: () => [], traits: () => [] },
        { resourceTypes: () => [ 123, 234 ], traits: () => [] },
        { resourceTypes: () => null, traits: () => [ 345, 456 ] },
        { resourceTypes: () => [], traits: () => [ 345, 456 ] },
        { resourceTypes: () => [ 123, 234 ], traits: () => [ 345, 456 ] }
      ]
      const expected = [
        OrderedMap(),
        OrderedMap(),
        OrderedMap({ '123': 123, '234': 234 }),
        OrderedMap(),
        OrderedMap(),
        OrderedMap({ '123': 123, '234': 234 }),
        OrderedMap({ '345': 345, '456': 456 }),
        OrderedMap({ '345': 345, '456': 456 }),
        OrderedMap({ '123': 123, '234': 234, '345': 345, '456': 456 })
      ]
      const actual = inputs.map(input => __internals__.extractInterfaceStore(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractStore', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractConstraintStore').andCall(({ constraint: v }) => v + 1)
      spyOn(__internals__, 'extractParameterStore').andCall(({ parameter: v }) => v + 2)
      spyOn(__internals__, 'extractAuthStore').andCall(({ auth: v }) => v + 3)
      spyOn(__internals__, 'extractInterfaceStore').andCall(({ interface: v }) => v + 4)

      const inputs = [
        { constraint: 123, parameter: 234, auth: 345, interface: 456 }
      ]
      const expected = [
        new Store({
          constraint: 124, parameter: 236, auth: 348, interface: 460
        })
      ]
      const actual = inputs.map(input => __internals__.extractStore(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createGroupFromResource', () => {
    it('should work', () => {
      const inputs = [
        { completeRelativeUri: () => null, relativeUri: () => null },
        { completeRelativeUri: () => 123, relativeUri: () => null },
        { completeRelativeUri: () => null, relativeUri: () => ({ value: () => null }) },
        { completeRelativeUri: () => null, relativeUri: () => ({ value: () => 234 }) },
        { completeRelativeUri: () => 123, relativeUri: () => ({ value: () => null }) },
        { completeRelativeUri: () => 123, relativeUri: () => ({ value: () => 234 }) }
      ]
      const expected = [
        new Group(),
        new Group({ id: 123 }),
        new Group(),
        new Group({ name: 234 }),
        new Group({ id: 123 }),
        new Group({ id: 123, name: 234 })
      ]
      const actual = inputs.map(input => __internals__.createGroupFromResource(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@getGroupKeyFromResource', () => {
    it('should work', () => {
      const inputs = [
        { completeRelativeUri: () => null },
        { completeRelativeUri: () => 123 }
      ]
      const expected = [
        null, 123
      ]
      const actual = inputs.map(input => __internals__.getGroupKeyFromResource(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createGroupEntryFromResource', () => {
    it('should work', () => {
      spyOn(__internals__, 'createGroupFromResource').andCall(({ child }) => child)
      spyOn(__internals__, 'getGroupKeyFromResource').andCall(({ child }) => child)
      spyOn(__internals__, 'convertResourceIntoGroup').andCall((v, { child }) => v + child)

      const inputs = [
        { child: 123 }
      ]
      const expected = [
        { key: 123, value: 246 }
      ]
      const actual = inputs.map(input => __internals__.createGroupEntryFromResource(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@resourceHasMethods', () => {
    it('should work', () => {
      const inputs = [
        {},
        { methods: null },
        { methods: () => [] },
        { methods: () => [ 123, 234 ] }
      ]
      const expected = [
        false, false, false, true
      ]
      const actual = inputs.map(input => __internals__.resourceHasMethods(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertResourceIntoGroup', () => {
    it('should work', () => {
      spyOn(__internals__, 'createGroupEntryFromResource').andCall(v => ({ key: v, value: v }))
      spyOn(__internals__, 'resourceHasMethods').andCall(({ hasMethods }) => hasMethods)

      const inputs = [
        [ new Group(), { resources: () => [], hasMethods: false, absoluteUri: () => 345 } ],
        [ new Group(), {
          resources: () => [ 123, 234 ],
          hasMethods: false,
          absoluteUri: () => 345
        } ],
        [ new Group(), { resources: () => [], hasMethods: true, absoluteUri: () => 345 } ],
        [ new Group(), { resources: () => [ 123, 234 ], hasMethods: true, absoluteUri: () => 345 } ]
      ]
      const expected = [
        new Group({ children: OrderedMap() }),
        new Group({ children: OrderedMap({ '123': 123, '234': 234 }) }),
        new Group({ children: OrderedMap({ '345': 345 }) }),
        new Group({ children: OrderedMap({ '123': 123, '234': 234, '345': 345 }) })
      ]
      const actual = inputs.map(input => __internals__.convertResourceIntoGroup(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createGroups', () => {
    it('should work', () => {
      spyOn(__internals__, 'convertResourceIntoGroup').andCall((_, v) => v * 2)

      const inputs = [
        123
      ]
      const expected = [
        246
      ]
      const actual = inputs.map(input => __internals__.createGroups(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@getAllResources', () => {
    it('should work', () => {
      const resC = { uriParameters: () => [ 345 ], resources: () => [] }
      const resD = { uriParameters: () => [ 456 ], resources: () => [] }

      const resA = { resources: () => [] }
      const resB = { resources: () => [
        resC,
        resD
      ] }

      const inputs = [
        [ [ 123, 234 ], resA ],
        [ [ 123, 234 ], resB ]
      ]
      const expected = [
        [ { uriParameters: [ 123, 234 ], resource: resA } ],
        [ { uriParameters: [ 123, 234 ], resource: resB }, {
          uriParameters: [ 123, 234, 345 ],
          resource: resC
        }, {
          uriParameters: [ 123, 234, 456 ],
          resource: resD
        } ]
      ]
      const actual = inputs.map(input => __internals__.getAllResources(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@getAllResourcesFromApi', () => {
    it('should work', () => {
      spyOn(__internals__, 'getAllResources').andCall((_, v) => [ v + 111 ])

      const inputs = [
        { resources: () => [ 123, 345 ] }
      ]
      const expected = [
        [ 234, 456 ]
      ]
      const actual = inputs.map(input => __internals__.getAllResourcesFromApi(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertStringIntoParameter', () => {
    it('should work', () => {
      const inputs = [
        'qwerty',
        'asdfgh'
      ]
      const expected = [
        new Parameter({ type: 'string', default: 'qwerty' }),
        new Parameter({ type: 'string', default: 'asdfgh' })
      ]
      const actual = inputs.map(input => __internals__.convertStringIntoParameter(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertSchemaIntoPathParameter', () => {
    it('should work', () => {
      const inputs = [
        {},
        { $key: 123, type: 234, description: 345 }
      ]
      const expected = [
        new Parameter({
          in: 'path',
          type: 'string',
          constraints: new List([ new Constraint.JSONSchema({}) ])
        }),
        new Parameter({
          in: 'path',
          key: 123,
          name: 123,
          description: 345,
          type: 234,
          constraints: new List([ new Constraint.JSONSchema({ type: 234, description: 345 }) ])
        })
      ]
      const actual = inputs.map(input => __internals__.convertSchemaIntoPathParameter(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@addPathParameterToSequence', () => {
    it('should work', () => {
      const inputs = [
        [
          { remaining: '/users/{userId}/songs/{songId}/test', sequence: [] },
          { $key: 'userId', a: 123 }
        ],
        [
          { remaining: '/songs/{songId}/test', sequence: [
            new Parameter({ type: 'string', default: '/users/' }),
            new Parameter({
              in: 'path',
              key: 'userId',
              name: 'userId',
              type: 'string',
              constraints: List([ new Constraint.JSONSchema({ a: 123 }) ])
            })
          ] },
          { $key: 'songId', b: 234 } ]
      ]
      const expected = [
        { remaining: '/songs/{songId}/test', sequence: [
          new Parameter({ type: 'string', default: '/users/' }),
          new Parameter({
            in: 'path',
            key: 'userId',
            name: 'userId',
            type: 'string',
            constraints: List([ new Constraint.JSONSchema({ a: 123 }) ])
          })
        ] },
        { remaining: '/test', sequence: [
          new Parameter({ type: 'string', default: '/users/' }),
          new Parameter({
            in: 'path',
            key: 'userId',
            name: 'userId',
            type: 'string',
            constraints: List([ new Constraint.JSONSchema({ a: 123 }) ])
          }),
          new Parameter({ type: 'string', default: '/songs/' }),
          new Parameter({
            in: 'path',
            key: 'songId',
            name: 'songId',
            type: 'string',
            constraints: List([ new Constraint.JSONSchema({ b: 234 }) ])
          })
        ] }
      ]
      const actual = inputs.map(input => __internals__.addPathParameterToSequence(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createSimplePathnameParameter', () => {
    it('should work', () => {
      const inputs = [
        123, 234
      ]
      const expected = [
        new Parameter({
          key: 'pathname',
          name: 'pathname',
          type: 'string',
          default: 123
        }),
        new Parameter({
          key: 'pathname',
          name: 'pathname',
          type: 'string',
          default: 234
        })
      ]
      const actual = inputs.map(input => __internals__.createSimplePathnameParameter(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createSequencePathnameParameter', () => {
    it('should work', () => {
      const inputs = [
        [ 123, 234, 345 ],
        [ 456, 567, 678 ]
      ]
      const expected = [
        new Parameter({
          key: 'pathname',
          name: 'pathname',
          type: 'string',
          superType: 'sequence',
          value: List([ 123, 234, 345 ])
        }),
        new Parameter({
          key: 'pathname',
          name: 'pathname',
          type: 'string',
          superType: 'sequence',
          value: List([ 456, 567, 678 ])
        })
      ]
      const actual = inputs.map(input => __internals__.createSequencePathnameParameter(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createPathnameURLComponentFromParameter', () => {
    it('should work', () => {
      const inputs = [
        [ 123, 234 ],
        [ 345, 456 ]
      ]
      const expected = [
        new URLComponent({
          componentName: 'pathname',
          string: 123,
          parameter: 234,
          variableDelimiters: List([ '{', '}' ])
        }),
        new URLComponent({
          componentName: 'pathname',
          string: 345,
          parameter: 456,
          variableDelimiters: List([ '{', '}' ])
        })
      ]
      const actual = inputs.map(
        input => __internals__.createPathnameURLComponentFromParameter(...input)
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@createPathnameEndpointFromParameter', () => {
    it('should work', () => {
      spyOn(__internals__, 'createPathnameURLComponentFromParameter').andCall((a, b) => a + b)

      const inputs = [
        [ 123, 234 ],
        [ 345, 456 ]
      ]
      const expected = [
        new URL().set('pathname', 123 + 234),
        new URL().set('pathname', 345 + 456)
      ]

      const actual = inputs.map(
        input => __internals__.createPathnameEndpointFromParameter(...input)
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@createPathnameParameterFromSequenceAndFinalParam', () => {
    it('should work', () => {
      spyOn(__internals__, 'createSequencePathnameParameter').andCall(v => v.map(i => i + 111))
      const inputs = [
        [ [ 123, 234 ], 345 ],
        [ [ 456, 567 ], 678 ]
      ]
      const expected = [
        [ 234, 345, 456 ],
        [ 567, 678, 789 ]
      ]
      const actual = inputs.map(
        input => __internals__.createPathnameParameterFromSequenceAndFinalParam(...input)
      )
      expect(actual).toEqual(expected)
    })
  })
})
