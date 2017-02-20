/* eslint-disable max-nested-callbacks */
import expect, { spyOn, restoreSpies } from 'expect'

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
})
