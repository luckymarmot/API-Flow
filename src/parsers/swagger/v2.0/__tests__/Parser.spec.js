/* eslint-disable max-nested-callbacks */
import expect, { spyOn, restoreSpies } from 'expect'
import { List, Map, OrderedMap } from 'immutable'

import Contact from '../../../../models/Contact'
import License from '../../../../models/License'
import Info from '../../../../models/Info'
import Api from '../../../../models/Api'
import Reference from '../../../../models/Reference'
import Store from '../../../../models/Store'
import Parameter from '../../../../models/Parameter'
import Constraint from '../../../../models/Constraint'
import ParameterContainer from '../../../../models/ParameterContainer'
import Auth from '../../../../models/Auth'
import Response from '../../../../models/Response'
import Interface from '../../../../models/Interface'
import URL from '../../../../models/URL'
import Request from '../../../../models/Request'
import Resource from '../../../../models/Resource'
import Group from '../../../../models/Group'

import Parser, { __internals__ } from '../Parser'

describe('parsers/swagger/v2.0/Parser.js', () => {
  afterEach(() => restoreSpies())
  describe('{ Parser }', () => {
    describe('#detect', () => {
      it('should call __internals__.detect', () => {
        const expected = 1234
        spyOn(__internals__, 'detect').andReturn(expected)

        const actual = Parser.detect()

        expect(__internals__.detect).toHaveBeenCalled()
        expect(actual).toEqual(expected)
      })

      it('should call __internals__.detect with the correct arguments', () => {
        const expected = 1234
        spyOn(__internals__, 'detect').andReturn(expected)

        const input = '1235124125412'
        const actual = Parser.detect(input)

        expect(__internals__.detect).toHaveBeenCalledWith(input)
        expect(actual).toEqual(expected)
      })
    })

    describe('@detect', () => {
      it('should call __internals__.detect', () => {
        const expected = 1234
        spyOn(__internals__, 'detect').andReturn(expected)

        const actual = Parser.detect()

        expect(__internals__.detect).toHaveBeenCalled()
        expect(actual).toEqual(expected)
      })

      it('should call __internals__.detect with the correct arguments', () => {
        const expected = 1234
        spyOn(__internals__, 'detect').andReturn(expected)

        const input = '1235124125412'
        const actual = Parser.detect(input)

        expect(__internals__.detect).toHaveBeenCalledWith(input)
        expect(actual).toEqual(expected)
      })
    })

    describe('#getAPIName', () => {
      it('should call __internals__.getAPIName', () => {
        const expected = 1234
        spyOn(__internals__, 'getAPIName').andReturn(expected)

        const actual = Parser.getAPIName()

        expect(__internals__.getAPIName).toHaveBeenCalled()
        expect(actual).toEqual(expected)
      })

      it('should call __internals__.getAPIName with the correct arguments', () => {
        const expected = 1234
        spyOn(__internals__, 'getAPIName').andReturn(expected)

        const input = '1235124125412'
        const actual = Parser.getAPIName(input)

        expect(__internals__.getAPIName).toHaveBeenCalledWith(input)
        expect(actual).toEqual(expected)
      })
    })

    describe('@getAPIName', () => {
      it('should call __internals__.getAPIName', () => {
        const expected = 1234
        spyOn(__internals__, 'getAPIName').andReturn(expected)

        const actual = Parser.getAPIName()

        expect(__internals__.getAPIName).toHaveBeenCalled()
        expect(actual).toEqual(expected)
      })

      it('should call __internals__.getAPIName with the correct arguments', () => {
        const expected = 1234
        spyOn(__internals__, 'getAPIName').andReturn(expected)

        const input = '1235124125412'
        const actual = Parser.getAPIName(input)

        expect(__internals__.getAPIName).toHaveBeenCalledWith(input)
        expect(actual).toEqual(expected)
      })
    })

    describe('@parse', () => {
      it('should call __internals__.parse', () => {
        const expected = 1234
        spyOn(__internals__, 'parse').andReturn(expected)

        const actual = Parser.parse()

        expect(__internals__.parse).toHaveBeenCalled()
        expect(actual).toEqual(expected)
      })

      it('should call __internals__.parse with the correct arguments', () => {
        const expected = 1234
        spyOn(__internals__, 'parse').andReturn(expected)

        const input = {
          content: '...some swagger file'
        }

        const actual = Parser.parse(input)

        expect(__internals__.parse).toHaveBeenCalledWith(input)
        expect(actual).toEqual(expected)
      })
    })
  })

  describe('@parse', () => {
    it('should call isSwagger', () => {
      spyOn(__internals__, 'isSwagger').andReturn(false)

      const item = {
        content: 'some content'
      }

      const input = { item }

      try {
        __internals__.parse(input)
      }
      catch (e) {
        // do nothing
      }

      expect(__internals__.isSwagger).toHaveBeenCalledWith(item)
    })

    it('should call handleInvalidSwagger if isSwagger returns false', () => {
      spyOn(__internals__, 'isSwagger').andReturn(false)
      spyOn(__internals__, 'handleInvalidSwagger').andReturn(null)

      const item = {
        content: 'some content'
      }
      const input = { item }

      try {
        __internals__.parse(input)
      }
      catch (e) {
        // do nothing
      }

      expect(__internals__.handleInvalidSwagger).toHaveBeenCalled()
    })

    it('should call createApi otherwise', () => {
      const parsed = 1234

      spyOn(__internals__, 'isSwagger').andReturn(true)
      spyOn(__internals__, 'createApi').andReturn(parsed)

      const item = {
        content: 'some content'
      }
      const options = { test: 123, other: 234 }
      const input = { options, item }

      const expected = { options, api: parsed }
      const actual = __internals__.parse(input)

      expect(__internals__.createApi).toHaveBeenCalledWith(item)
      expect(actual).toEqual(expected)
    })
  })

  describe('@parseJSONorYAML', () => {
    it('should parse JSON', () => {
      const jsonInput = {
        some: 'object',
        other: 'field'
      }

      const input = JSON.stringify(jsonInput)
      const expected = jsonInput
      const actual = __internals__.parseJSONorYAML(input)

      expect(actual).toEqual(expected)
    })

    it('should parse YAML', () => {
      const input = `
        types:
          User:
            type: object
      `

      const expected = {
        types: {
          User: {
            type: 'object'
          }
        }
      }
      const actual = __internals__.parseJSONorYAML(input)

      expect(actual).toEqual(expected)
    })

    it('should return null otherwise', () => {
      const input = `{
        !Yaml.Or.JSON
      }`

      const expected = null
      const actual = __internals__.parseJSONorYAML(input)

      expect(actual).toEqual(expected)
    })
  })

  describe('@handleUnkownFormat', () => {
    it('should throw a SyntaxError', () => {
      try {
        __internals__.handleUnkownFormat()
        expect(true).toEqual(false)
      }
      catch (e) {
        expect(e).toBeA(SyntaxError)
      }
    })
  })

  describe('@isSwagger', () => {
    it('should return true for a valid input', () => {
      const input = {
        swagger: '2.0',
        info: {
          title: 'some title'
        },
        paths: {}
      }

      const expected = true
      const actual = __internals__.isSwagger(input)

      expect(actual).toEqual(expected)
    })

    it('should return false for an invalid input', () => {
      const input = {
        swagger: '2.0',
        info: {
          title: 'some title'
        }
        // missing paths object
      }

      const expected = false
      const actual = __internals__.isSwagger(input)

      expect(actual).toEqual(expected)
    })
  })

  describe('@handleInvalidSwagger', () => {
    it('should throw a SyntaxError', () => {
      try {
        __internals__.handleInvalidSwagger()
        expect(true).toEqual(false)
      }
      catch (e) {
        expect(e).toBeA(TypeError)
      }
    })
  })

  describe('@formatDetectionObject', () => {
    it('should work', () => {
      const score = 1241251

      const expected = [ { version: 'v2.0', format: 'swagger', score } ]
      const actual = __internals__.formatDetectionObject(score)

      expect(actual).toEqual(expected)
    })
  })

  describe('@detect', () => {
    it('should call parseJSONorYAML', () => {
      spyOn(__internals__, 'parseJSONorYAML').andReturn(null)

      const input = 'some random input'
      __internals__.detect(input)

      expect(__internals__.parseJSONorYAML).toHaveBeenCalledWith(input)
    })

    it('should call formatDetectionObject', () => {
      const expected = 12313
      spyOn(__internals__, 'formatDetectionObject').andReturn(expected)

      const input = 'some random input'
      const actual = __internals__.detect(input)

      expect(__internals__.formatDetectionObject).toHaveBeenCalled()
      expect(actual).toEqual(expected)
    })

    it('should return 0 if parseJSONorYAML returns null', () => {
      spyOn(__internals__, 'parseJSONorYAML').andReturn(null)
      spyOn(__internals__, 'formatDetectionObject').andCall((score) => score)

      const input = 'some random input'
      const expected = 0
      const actual = __internals__.detect(input)

      expect(actual).toEqual(expected)
    })

    it('should return 0.25 if v1.2', () => {
      const parsed = { swagger: '1.2', apis: [] }
      spyOn(__internals__, 'parseJSONorYAML').andReturn(parsed)
      spyOn(__internals__, 'formatDetectionObject').andCall((score) => score)

      const input = 'some random input'
      const expected = 0.25
      const actual = __internals__.detect(input)

      expect(actual).toEqual(expected)
    })

    it('should return 1.00 if v2.0', () => {
      const parsed = { swagger: '2.0', info: {}, paths: {} }
      spyOn(__internals__, 'parseJSONorYAML').andReturn(parsed)
      spyOn(__internals__, 'formatDetectionObject').andCall((score) => score)

      const input = 'some random input'
      const expected = 1
      const actual = __internals__.detect(input)

      expect(actual).toEqual(expected)
    })

    it('should return 0.75 if v3.0', () => {
      const parsed = { swagger: '3.0', info: {}, paths: {} }
      spyOn(__internals__, 'parseJSONorYAML').andReturn(parsed)
      spyOn(__internals__, 'formatDetectionObject').andCall((score) => score)

      const input = 'some random input'
      const expected = 0.75
      const actual = __internals__.detect(input)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getAPIName', () => {
    it('should call parseJSONorYAML', () => {
      spyOn(__internals__, 'parseJSONorYAML').andReturn(null)

      const input = 'some random input'
      __internals__.getAPIName(input)

      expect(__internals__.parseJSONorYAML).toHaveBeenCalledWith(input)
    })

    it('should return null if no title in info', () => {
      spyOn(__internals__, 'parseJSONorYAML').andReturn(null)
      const input = 'some random input'

      const expected = null
      const actual = __internals__.getAPIName(input)

      expect(actual).toEqual(expected)
    })

    it('should return title if it exists', () => {
      const expected = 'my API title'
      const parsed = {
        info: {
          title: expected
        }
      }

      spyOn(__internals__, 'parseJSONorYAML').andReturn(parsed)

      const input = 'some random input'
      const actual = __internals__.getAPIName(input)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getContact', () => {
    it('should return a Contact Record', () => {
      const actual = __internals__.getContact()
      expect(actual).toBeA(Contact)
    })

    it('should add all relevant fields to the Contact Record', () => {
      const input = {
        name: 'some name',
        url: 'some url',
        email: 'some email'
      }

      const expected = new Contact(input)
      const actual = __internals__.getContact(input)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getLicense', () => {
    it('should return a License Record', () => {
      const actual = __internals__.getLicense()
      expect(actual).toBeA(License)
    })

    it('should add all relevant fields to the License Record', () => {
      const input = {
        name: 'some name',
        url: 'some url'
      }

      const expected = new License(input)
      const actual = __internals__.getLicense(input)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getInfo', () => {
    it('should return an Info Record', () => {
      const actual = __internals__.getInfo()
      expect(actual).toBeAn(Info)
    })

    it('should call getContact', () => {
      spyOn(__internals__, 'getContact').andReturn(null)

      __internals__.getInfo()

      expect(__internals__.getContact).toHaveBeenCalled()
    })

    it('should call getLicense', () => {
      spyOn(__internals__, 'getLicense').andReturn(null)

      __internals__.getInfo()

      expect(__internals__.getLicense).toHaveBeenCalled()
    })

    it('should add all relevant fields to the Info Record', () => {
      spyOn(__internals__, 'getContact').andReturn(123)
      spyOn(__internals__, 'getLicense').andReturn(321)

      const input = {
        contact: 123,
        license: 321,
        title: 'some title',
        description: 'some desc',
        termsOfService: 'some termsOfService',
        version: 345
      }

      const expected = new Info({ ...input, tos: input.termsOfService })
      const actual = __internals__.getInfo(input)

      expect(actual).toEqual(expected)
    })
  })

  describe('@fixExternalContextDependencies', () => {
    it('should do nothing if the swagger file is fine', () => {
      const swagger = {
        host: 'some.host.com',
        schemes: [ 'https' ]
      }

      const url = 'http://some.otherhost.com'

      const expected = swagger
      const actual = __internals__.fixExternalContextDependencies(swagger, url)

      expect(actual).toEqual(expected)
    })

    it('should update the swagger host with the url if provided', () => {
      const swagger = {
        schemes: [ 'https' ]
      }

      const url = 'http://some.otherhost.com'

      const expected = {
        schemes: [ 'https' ],
        host: 'some.otherhost.com'
      }
      const actual = __internals__.fixExternalContextDependencies(swagger, url)

      expect(actual).toEqual(expected)
    })

    it('should update the swagger host with localhost if no url provided', () => {
      const swagger = {
        schemes: [ 'https' ]
      }

      const expected = {
        schemes: [ 'https' ],
        host: 'localhost'
      }
      const actual = __internals__.fixExternalContextDependencies(swagger, '')

      expect(actual).toEqual(expected)
    })

    it('should update the swagger schemes with the url if provided', () => {
      const swagger = {
        host: 'some.host.com'
      }

      const url = 'http://some.otherhost.com'

      const expected = {
        schemes: [ 'http' ],
        host: 'some.host.com'
      }
      const actual = __internals__.fixExternalContextDependencies(swagger, url)

      expect(actual).toEqual(expected)
    })

    it('should update the swagger schemes with http if no url provided', () => {
      const swagger = {
        host: 'some.host.com'
      }

      const expected = {
        schemes: [ 'http' ],
        host: 'some.host.com'
      }
      const actual = __internals__.fixExternalContextDependencies(swagger, '')

      expect(actual).toEqual(expected)
    })
  })

  describe('@getMethodsFromResourceObject', () => {
    it('should return an array', () => {
      const resource = { get: {}, put: {}, post: {}, test: {}, random: {} }
      const actual = __internals__.getMethodsFromResourceObject(resource)

      expect(actual).toBeAn(Array)
    })

    it('array items should be entries', () => {
      const resource = { get: 123, put: 123, post: 123, test: 123, random: 123 }
      const actual = __internals__.getMethodsFromResourceObject(resource)

      actual.forEach(entry => {
        expect(entry.key).toBeA('string')
        expect(entry.value).toEqual(123)
      })
    })

    it('entry keys should only be methods name', () => {
      const resource = { get: 123, put: 123, post: 123, test: 123, random: 123 }
      const actual = __internals__.getMethodsFromResourceObject(resource)

      const keys = actual.map(({ key }) => key)
      expect(keys).toExclude('test')
      expect(keys).toExclude('random')
    })

    it('should not modify values of resource when filtering', () => {
      const resource = { get: 415, put: 123, post: 32, test: 46854, random: 2352 }
      const actual = __internals__.getMethodsFromResourceObject(resource)

      actual.forEach(({ key, value }) => {
        const obj = {}
        obj[key] = value
        expect(resource).toInclude(obj)
      })
    })
  })

  describe('@getParametersAndReferencesFromParameterArray', () => {
    it('should split refs from params', () => {
      const input = [
        {
          title: 'some ref',
          $ref: '#/parameter/SomeParam'
        },
        {
          title: 'some param',
          name: 'param1',
          in: 'query',
          type: 'string'
        },
        {
          title: 'some ref',
          $ref: '#/parameter/SomeOtherParam'
        },
        {
          title: 'some other param',
          name: 'param2',
          in: 'header',
          type: 'string'
        }
      ]

      const expected = {
        references: [
          {
            key: '#/parameter/SomeParam',
            value: {
              title: 'some ref',
              $ref: '#/parameter/SomeParam'
            }
          },
          {
            key: '#/parameter/SomeOtherParam',
            value: {
              title: 'some ref',
              $ref: '#/parameter/SomeOtherParam'
            }
          }
        ],
        parameters: [
          {
            key: 'param1-query',
            value: {
              title: 'some param',
              name: 'param1',
              in: 'query',
              type: 'string'
            }
          },
          {
            key: 'param2-header',
            value: {
              title: 'some other param',
              name: 'param2',
              in: 'header',
              type: 'string'
            }
          }
        ]
      }

      const actual = __internals__.getParametersAndReferencesFromParameterArray(input)

      expect(actual).toEqual(expected)
    })
  })

  describe('@convertReferenceObjectEntryIntoReferenceEntry', () => {
    it('should work', () => {
      const type = 'parameter'
      const entry = { key: 123, value: 321 }

      const expected = { key: 123, value: new Reference({ type, uuid: 123 }) }
      const actual = __internals__.convertReferenceObjectEntryIntoReferenceEntry(type, entry)

      expect(actual).toEqual(expected)
    })
  })

  describe('@convertReferenceArrayIntoReferenceMap', () => {
    it('should call convertReferenceObjectEntryIntoReferenceEntry for each entry', () => {
      spyOn(__internals__, 'convertReferenceObjectEntryIntoReferenceEntry').andCall((type, val) => {
        return {
          key: val,
          value: val
        }
      })

      const refs = [ 123, 321, 234 ]
      const type = 'number'

      __internals__.convertReferenceArrayIntoReferenceMap(type, refs)

      expect(__internals__.convertReferenceObjectEntryIntoReferenceEntry.calls.length).toEqual(3)
    })

    it('should work if convertReferenceObjectEntryIntoReferenceEntry works', () => {
      spyOn(__internals__, 'convertReferenceObjectEntryIntoReferenceEntry').andCall((type, val) => {
        return {
          key: val,
          value: val
        }
      })

      const refs = [ 123, 321, 234 ]
      const type = 'number'

      const expected = { '123': 123, '321': 321, '234': 234 }
      const actual = __internals__.convertReferenceArrayIntoReferenceMap(type, refs)

      expect(actual).toEqual(expected)
    })

    it('should work', () => {
      const refs = [ { key: 123 }, { key: 321 } ]
      const type = 'parameter'

      const expected = {
        '123': new Reference({
          type, uuid: 123
        }),
        '321': new Reference({
          type, uuid: 321
        })
      }
      const actual = __internals__.convertReferenceArrayIntoReferenceMap(type, refs)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getConsumesParamFromOperation', () => {
    it('should return nothing interesting if no global or local consumes', () => {
      const store = new Store()
      const operation = {}

      const expected = {
        consumeParameter: null,
        consumeReference: null,
        consumeInterface: null
      }
      const actual = __internals__.getConsumesParamFromOperation(store, operation)

      expect(actual).toEqual(expected)
    })

    it('should return local consumes if it exists', () => {
      const store = new Store()
      const operation = {
        consumes: [ 'application/json' ]
      }

      const expected = {
        consumeParameter: new Parameter({
          uuid: 'Content-Type-header',
          in: 'headers',
          key: 'Content-Type',
          name: 'Content Type Header',
          description: 'describes the media type of the request',
          type: 'string',
          required: true,
          constraints: List([
            new Constraint.Enum([ 'application/json' ])
          ])
        }),
        consumeReference: null,
        consumeInterface: null
      }
      const actual = __internals__.getConsumesParamFromOperation(store, operation)

      expect(actual).toEqual(expected)
    })

    it('should use global consumes if no local consumes exists', () => {
      const globalParam = new Parameter({
        name: 'global consume param'
      })

      const store = new Store({
        parameter: new OrderedMap({ globalConsumes: globalParam })
      })
      const operation = {}

      const expected = {
        consumeParameter: null,
        consumeReference: new Reference({ type: 'parameter', uuid: 'globalConsumes' }),
        consumeInterface: null
      }
      const actual = __internals__.getConsumesParamFromOperation(store, operation)

      expect(actual).toEqual(expected)
    })

    it('should ignore global consumes if local consumes exists', () => {
      const globalParam = new Parameter({
        name: 'global consume param'
      })

      const store = new Store({
        parameter: new OrderedMap({ globalConsumes: globalParam })
      })
      const operation = {
        consumes: [ 'application/json' ]
      }

      const expected = {
        consumeParameter: new Parameter({
          uuid: 'Content-Type-header',
          in: 'headers',
          key: 'Content-Type',
          name: 'Content Type Header',
          description: 'describes the media type of the request',
          type: 'string',
          required: true,
          constraints: List([
            new Constraint.Enum([ 'application/json' ])
          ])
        }),
        consumeReference: null,
        consumeInterface: null
      }
      const actual = __internals__.getConsumesParamFromOperation(store, operation)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getProducesParamFromOperation', () => {
    it('should return nothing interesting if no global or local produces', () => {
      const store = new Store()
      const operation = {}

      const expected = {
        produceParameter: null,
        produceInterface: null
      }
      const actual = __internals__.getProducesParamFromOperation(store, operation)

      expect(actual).toEqual(expected)
    })

    it('should return local produces if it exists', () => {
      const store = new Store()
      const operation = {
        produces: [ 'application/json' ]
      }

      const expected = {
        produceParameter: new Parameter({
          uuid: 'Content-Type-header',
          in: 'headers',
          usedIn: 'response',
          key: 'Content-Type',
          name: 'Content Type Header',
          description: 'describes the media type of the response',
          type: 'string',
          required: true,
          constraints: List([
            new Constraint.Enum([ 'application/json' ])
          ])
        }),
        produceInterface: null
      }
      const actual = __internals__.getProducesParamFromOperation(store, operation)

      expect(actual).toEqual(expected)
    })

    it('should use global consumes if no local produces exists', () => {
      const globalParam = new Parameter({
        name: 'global produce param'
      })

      const store = new Store({
        parameter: new OrderedMap({ globalProduces: globalParam })
      })
      const operation = {}

      const expected = {
        produceParameter: new Reference({ type: 'parameter', uuid: 'globalProduces' }),
        produceInterface: null
      }
      const actual = __internals__.getProducesParamFromOperation(store, operation)

      expect(actual).toEqual(expected)
    })

    it('should ignore global produces if local consumes exists', () => {
      const globalParam = new Parameter({
        name: 'global produce param'
      })

      const store = new Store({
        parameter: new OrderedMap({ globalProduces: globalParam })
      })
      const operation = {
        produces: [ 'application/json' ]
      }

      const expected = {
        produceParameter: new Parameter({
          uuid: 'Content-Type-header',
          usedIn: 'response',
          in: 'headers',
          key: 'Content-Type',
          name: 'Content Type Header',
          description: 'describes the media type of the response',
          type: 'string',
          required: true,
          constraints: List([
            new Constraint.Enum([ 'application/json' ])
          ])
        }),
        produceInterface: null
      }
      const actual = __internals__.getProducesParamFromOperation(store, operation)

      expect(actual).toEqual(expected)
    })
  })

  describe('@mapParamLocationToParamContainerField', () => {
    it('should return null if no valid location', () => {
      const location = 1241
      const expected = null
      const actual = __internals__.mapParamLocationToParamContainerField(location)

      expect(actual).toEqual(expected)
    })

    it('should work', () => {
      const locations = [ 'path', 'header', 'query', 'body', 'formData' ]
      const expected = [ 'path', 'headers', 'queries', 'body', 'body' ]
      const actual = locations.map(location =>
        __internals__.mapParamLocationToParamContainerField(location)
      )

      expect(actual).toEqual(expected)
    })
  })

  describe('@addParameterToContainerBlock', () => {
    it('should not crash if unknown location', () => {
      const container = {
        headers: {}
      }

      const entry = {
        key: 'someKey',
        value: new Parameter({
          in: 'invalidLocation'
        })
      }

      try {
        __internals__.addParameterToContainerBlock(container, entry)
        expect(true).toEqual(true)
      }
      catch (e) {
        expect(false).toEqual(true)
      }
    })

    it('should work', () => {
      const container = {
        headers: {}
      }

      const param = new Parameter({
        in: 'headers'
      })

      const entry = {
        key: 'someKey',
        value: param
      }

      const expected = {
        headers: {
          someKey: param
        }
      }

      const actual = __internals__.addParameterToContainerBlock(container, entry)

      expect(actual).toEqual(expected)
    })
  })

  describe('@resolveReferenceFromKey', () => {
    it('should work', () => {
      const store = new Store({
        parameter: new OrderedMap({
          '123': 234
        })
      })

      const type = 'parameter'

      const entry = {
        key: '123',
        value: 'whatever'
      }

      const expected = {
        key: '123',
        value: 234
      }

      const actual = __internals__.resolveReferenceFromKey(store, type, entry)

      expect(actual).toEqual(expected)
    })
  })

  describe('@addReferenceToContainerBlock', () => {
    it('should not crash if unknown location', () => {
      const container = {
        headers: {}
      }

      const entry = {
        key: 'someKey',
        value: new Parameter({
          in: 'invalidLocation'
        })
      }

      try {
        __internals__.addReferenceToContainerBlock(container, entry)
        expect(true).toEqual(true)
      }
      catch (e) {
        expect(false).toEqual(true)
      }
    })

    it('should work', () => {
      const container = {
        headers: {}
      }

      const param = new Parameter({
        in: 'headers'
      })

      const entry = {
        key: 'someKey',
        value: param
      }

      const expected = {
        headers: {
          someKey: new Reference({
            type: 'parameter',
            uuid: 'someKey'
          })
        }
      }

      const actual = __internals__.addReferenceToContainerBlock(container, entry)

      expect(actual).toEqual(expected)
    })
  })

  describe('@createParameterContainer', () => {
    it('should make expected calls for each param', () => {
      spyOn(__internals__, 'addParameterToContainerBlock').andReturn({
        headers: { '123': 321 }
      })

      spyOn(__internals__, 'resolveReferenceFromKey').andReturn({ value: 234 })

      spyOn(__internals__, 'addReferenceToContainerBlock').andReturn({
        headers: { '987': 789 }
      })

      const store = new Store()
      const params = [ 1, 2, 3 ]
      const refs = [ 4, 5, 6, 7 ]

      __internals__.createParameterContainer(store, params, refs)

      expect(__internals__.addParameterToContainerBlock.calls.length).toEqual(3)
      expect(__internals__.resolveReferenceFromKey.calls.length).toEqual(4)
      expect(__internals__.addReferenceToContainerBlock.calls.length).toEqual(4)
    })

    it('should work if underlying calls are correct', () => {
      spyOn(__internals__, 'addParameterToContainerBlock').andReturn({
        headers: { '123': 321 }
      })

      spyOn(__internals__, 'resolveReferenceFromKey').andReturn({ value: 234 })

      spyOn(__internals__, 'addReferenceToContainerBlock').andReturn({
        headers: { '987': 789 }
      })

      const store = new Store()
      const params = [ 1, 2, 3 ]
      const refs = [ 4, 5, 6, 7 ]

      const expected = new ParameterContainer({
        headers: new OrderedMap({ '987': 789 })
      })
      const actual = __internals__.createParameterContainer(store, params, refs)

      expect(actual).toEqual(expected)
    })

    it('should work', () => {
      const param1 = new Parameter({ in: 'headers', type: 'string' })
      const param2 = new Parameter({ in: 'queries', type: 'number' })
      const param3 = new Parameter({ in: 'queries', type: 'boolean' })

      const store = new Store({
        parameter: new OrderedMap({
          param3: param3
        })
      })
      const params = [ { key: 'param1', value: param1 }, { key: 'param2', value: param2 } ]
      const refs = [ { key: 'param3' } ]

      const expected = new ParameterContainer({
        headers: new OrderedMap({
          param1
        }),
        queries: new OrderedMap({
          param2,
          param3: new Reference({
            type: 'parameter',
            uuid: 'param3'
          })
        })
      })
      const actual = __internals__.createParameterContainer(store, params, refs)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getOverlayFromRequirement', () => {
    it('should do nothing if auth is not OAuth2', () => {
      const auth = new Auth.Basic()
      const scopes = []

      const expected = null
      const actual = __internals__.getOverlayFromRequirement(auth, scopes)

      expect(actual).toEqual(expected)
    })

    it('should return an OAuth2 with the correct scopes if auth is OAuth2', () => {
      const auth = new Auth.OAuth2()
      const scopes = [ 'read:any', 'write:self' ]

      const expected = new Auth.OAuth2({
        scopes: List([
          {
            key: 'read:any'
          },
          {
            key: 'write:self'
          }
        ])
      })
      const actual = __internals__.getOverlayFromRequirement(auth, scopes)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getAuthReferences', () => {
    it('should call getOverlayFromRequirement for each requirement', () => {
      spyOn(__internals__, 'getOverlayFromRequirement').andReturn(null)

      const store = new Store()
      const requirements = [
        { petstore_auth: 123 },
        { basic_auth: 321 }
      ]

      __internals__.getAuthReferences(store, requirements)

      expect(__internals__.getOverlayFromRequirement.calls.length).toEqual(2)
    })

    it('should work', () => {
      const store = new Store({
        auth: new OrderedMap({
          petstore_auth: new Auth.OAuth2({
            scopes: List([
              {
                key: 'overriden',
                value: 'by scopes in security requirements'
              }
            ])
          }),
          basic_auth: new Auth.Basic()
        })
      })

      const requirements = [
        { petstore_auth: [ 'read:any', 'write:self' ] },
        { basic_auth: [ 'ignored' ] }
      ]

      const expected = List([
        new Reference({
          type: 'auth',
          uuid: 'petstore_auth',
          overlay: new Auth.OAuth2({
            scopes: List([
              {
                key: 'read:any'
              },
              {
                key: 'write:self'
              }
            ])
          })
        }),
        new Reference({
          type: 'auth',
          uuid: 'basic_auth',
          overlay: null
        })
      ])
      const actual = __internals__.getAuthReferences(store, requirements)

      expect(actual).toEqual(expected)
    })
  })

  describe('@updateParamsWithConsumeParameter', () => {
    it('should call getConsumesParamFromOperation', () => {
      spyOn(__internals__, 'getConsumesParamFromOperation').andReturn({})

      const store = new Store()
      const operation = {}
      const parameters = []
      const references = []

      __internals__.updateParamsWithConsumeParameter(store, operation, parameters, references)

      expect(__internals__.getConsumesParamFromOperation).toHaveBeenCalledWith(store, operation)
    })

    it('should add parameter to parameters', () => {
      spyOn(__internals__, 'getConsumesParamFromOperation').andReturn({
        consumeParameter: new Parameter({ uuid: 123 })
      })

      const store = new Store()
      const operation = {}
      const parameters = []
      const references = []

      const expected = [
        [
          {
            key: 123,
            value: new Parameter({ uuid: 123 })
          }
        ],
        []
      ]
      const actual = __internals__.updateParamsWithConsumeParameter(
        store, operation, parameters, references
      )

      expect(actual).toEqual(expected)
    })

    it('should add reference to references', () => {
      spyOn(__internals__, 'getConsumesParamFromOperation').andReturn({
        consumeReference: new Reference({ uuid: 123 })
      })

      const store = new Store()
      const operation = {}
      const parameters = []
      const references = []

      const expected = [
        [],
        [
          {
            key: 123,
            value: new Reference({ uuid: 123 })
          }
        ]
      ]
      const actual = __internals__.updateParamsWithConsumeParameter(
         store, operation, parameters, references
       )

      expect(actual).toEqual(expected)
    })
  })

  describe('@addCodeToResponseEntry', () => {
    it('should work', () => {
      const entry = {
        key: 200,
        value: { description: 'a response' }
      }

      const expected = {
        key: 200,
        value: {
          description: 'a response',
          code: 200
        }
      }

      const actual = __internals__.addCodeToResponseEntry(entry)

      expect(actual).toEqual(expected)
    })
  })

  describe('@updateResponseReferenceWithProduceParameter', () => {
    it('should create an overlay if none exists', () => {
      const producesParameter = new Reference({
        type: 'parameter', uuid: 'someRef'
      })

      const entry = {
        key: 123,
        value: new Reference({
          type: 'response',
          uuid: 123,
          overlay: null
        })
      }

      const expected = {
        key: 123,
        value: new Reference({
          type: 'response',
          uuid: 123,
          overlay: new Response({
            parameters: new ParameterContainer({
              headers: new OrderedMap({
                someRef: producesParameter
              })
            })
          })
        })
      }

      const actual = __internals__.updateResponseReferenceWithProduceParameter(
        producesParameter, entry
      )

      expect(actual).toEqual(expected)
    })

    it('should update the overlay if it already exists', () => {
      const producesParameter = new Reference({
        type: 'parameter', uuid: 'someRef'
      })

      const entry = {
        key: 123,
        value: new Reference({
          type: 'response',
          uuid: 123,
          overlay: new Response({
            code: 200,
            parameters: new ParameterContainer({
              headers: new OrderedMap({
                abc: new Parameter()
              })
            })
          })
        })
      }

      const expected = {
        key: 123,
        value: new Reference({
          type: 'response',
          uuid: 123,
          overlay: new Response({
            code: 200,
            parameters: new ParameterContainer({
              headers: new OrderedMap({
                abc: new Parameter(),
                someRef: producesParameter
              })
            })
          })
        })
      }

      const actual = __internals__.updateResponseReferenceWithProduceParameter(
        producesParameter, entry
      )

      expect(actual).toEqual(expected)
    })
  })

  describe('@updateResponseRecordWithProduceParameter', () => {
    it('should work', () => {
      const producesParameter = new Parameter({
        type: 'string',
        uuid: 'someUUID'
      })

      const entry = {
        key: 'someResponseRef',
        value: new Response({
          parameters: new ParameterContainer({
            queries: new OrderedMap({
              '123': 321
            })
          })
        })
      }

      const expected = {
        key: 'someResponseRef',
        value: new Response({
          parameters: new ParameterContainer({
            headers: new OrderedMap({
              someUUID: producesParameter
            }),
            queries: new OrderedMap({
              '123': 321
            })
          })
        })
      }

      const actual = __internals__.updateResponseRecordWithProduceParameter(
        producesParameter, entry
      )

      expect(actual).toEqual(expected)
    })
  })

  describe('@updateResponsesWithProduceParameter', () => {
    it('should do nothing if no producesParameter', () => {
      const producesParameter = null
      const entry = {
        key: 'someKey',
        value: new Response()
      }
      const expected = entry
      const actual = __internals__.updateResponsesWithProduceParameter(producesParameter, entry)

      expect(actual).toEqual(expected)
    })

    it('should call updateResponseReferenceWithProduceParameter if entry is Reference', () => {
      spyOn(__internals__, 'updateResponseReferenceWithProduceParameter').andReturn(123)

      const producesParameter = new Parameter()
      const entry = {
        key: 'someKey',
        value: new Reference()
      }
      const expected = 123
      const actual = __internals__.updateResponsesWithProduceParameter(producesParameter, entry)

      expect(__internals__.updateResponseReferenceWithProduceParameter).toHaveBeenCalledWith(
        producesParameter, entry
      )
      expect(actual).toEqual(expected)
    })

    it('should call updateResponseRecordWithProduceParameter if entry is Response Record', () => {
      spyOn(__internals__, 'updateResponseRecordWithProduceParameter').andReturn(321)

      const producesParameter = new Parameter()
      const entry = {
        key: 'someKey',
        value: new Response()
      }
      const expected = 321
      const actual = __internals__.updateResponsesWithProduceParameter(producesParameter, entry)

      expect(__internals__.updateResponseRecordWithProduceParameter).toHaveBeenCalledWith(
        producesParameter, entry
      )
      expect(actual).toEqual(expected)
    })

    it('should work', () => {
      const producesParameter = new Parameter({
        uuid: 'abc',
        type: 'string'
      })
      const entry = {
        key: 'someKey',
        value: new Response({
          code: 200
        })
      }
      const expected = {
        key: 'someKey',
        value: new Response({
          code: 200,
          parameters: new ParameterContainer({
            headers: new OrderedMap({
              abc: producesParameter
            })
          })
        })
      }
      const actual = __internals__.updateResponsesWithProduceParameter(producesParameter, entry)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getInterfacesFromTags', () => {
    it('should work', () => {
      const tags = [ 'abc', '123' ]
      const expected = OrderedMap({
        abc: new Interface({ name: 'abc', uuid: 'abc', level: 'request' }),
        '123': new Interface({ name: '123', uuid: '123', level: 'request' })
      })
      const actual = __internals__.getInterfacesFromTags(tags)

      expect(actual).toEqual(expected)
    })
  })

  describe('@addEndpointOverlayFromOperation', () => {
    it('should return a Reference', () => {
      const operation = {}
      const value = 'whatever'
      const key = '123'

      const actual = __internals__.addEndpointOverlayFromOperation(operation, value, key)
      expect(actual).toBeA(Reference)
    })

    it('should put no overlay in Reference if no operation.schemes', () => {
      const operation = {}
      const value = 'whatever'
      const key = '123'

      const expected = new Reference({
        type: 'endpoint',
        uuid: '123'
      })
      const actual = __internals__.addEndpointOverlayFromOperation(operation, value, key)

      expect(actual).toEqual(expected)
    })

    it('should put an overlay in Reference if operation.schemes is defined', () => {
      const operation = {
        schemes: [ 'http', 'https' ]
      }
      const value = 'whatever'
      const key = '123'

      const expected = new Reference({
        type: 'endpoint',
        uuid: '123',
        overlay: new URL({
          variableDelimiters: List([ '{', '}' ])
        }).set('protocol', List([ 'http:', 'https:' ]))
      })
      const actual = __internals__.addEndpointOverlayFromOperation(operation, value, key)

      expect(actual).toEqual(expected)
    })
  })

  describe('@isMethodWithBody', () => {
    it('should work', () => {
      const inputs = [ 'get', 'put', 'post', 'patch', 'delete', 'options', 'trace' ]

      const expected = [ false, true, true, true, true, true, false ]
      const actual = inputs.map(__internals__.isMethodWithBody)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getParameterContainerForOperation', () => {
    it('should call all the expected methods', () => {
      spyOn(__internals__, 'getParametersAndReferencesFromParameterArray').andReturn({
        parameters: [ 1, 2, 3, 4 ],
        references: [ 5 ]
      })
      spyOn(__internals__, 'convertParameterObjectIntoParameter').andReturn(123)
      spyOn(__internals__, 'isMethodWithBody').andReturn(true)
      spyOn(__internals__, 'updateParamsWithConsumeParameter').andReturn([ [ 12, 23 ], [ 34, 45 ] ])
      spyOn(__internals__, 'createParameterContainer').andReturn(12345)

      const store = new Store()
      const operation = {
        parameters: [ 6, 7, 8, 9 ]
      }
      const method = 'post'

      const expected = 12345
      const actual = __internals__.getParameterContainerForOperation(store, operation, method)

      expect(__internals__.getParametersAndReferencesFromParameterArray).toHaveBeenCalledWith([
        6, 7, 8, 9
      ])
      expect(__internals__.convertParameterObjectIntoParameter.calls.length).toEqual(4)
      expect(__internals__.isMethodWithBody).toHaveBeenCalledWith(method)
      expect(__internals__.updateParamsWithConsumeParameter).toHaveBeenCalledWith(
        store, operation, [ 123, 123, 123, 123 ], [ 5 ]
      )
      expect(__internals__.createParameterContainer).toHaveBeenCalledWith(
        store, [ 12, 23 ], [ 34, 45 ]
      )
      expect(actual).toEqual(expected)
    })

    xit('it should work', () => {
      // TODO implement this test
    })
  })

  describe('@getEndpointsForOperation', () => {
    it('should call addOverlayToEndpoints for each endpoint in store', () => {
      spyOn(__internals__, 'addEndpointOverlayFromOperation').andReturn('abc')
      const store = new Store({
        endpoint: new OrderedMap({
          '123': 123,
          '321': 321
        })
      })

      const operation = {}

      const expected = new OrderedMap({ '123': 'abc', '321': 'abc' })
      const actual = __internals__.getEndpointsForOperation(store, operation)

      expect(__internals__.addEndpointOverlayFromOperation.calls.length).toEqual(2)
      expect(actual).toEqual(expected)
    })
  })

  describe('@getRequestIdFromOperation', () => {
    it('should return operationId if it exists', () => {
      const operation = {
        operationId: 123
      }

      const expected = 123
      const actual = __internals__.getRequestIdFromOperation(operation)

      expect(actual).toEqual(expected)
    })

    it('should return null if operationId does not exists', () => {
      const operation = {}

      const expected = null
      const actual = __internals__.getRequestIdFromOperation(operation)

      expect(actual).toEqual(expected)
    })
  })

  describe('@convertOperationIntoRequest', () => {
    it('should call all expected methods', () => {
      spyOn(__internals__, 'getRequestIdFromOperation').andReturn(123)
      spyOn(__internals__, 'getParameterContainerForOperation').andReturn(321)
      spyOn(__internals__, 'getAuthReferences').andReturn(234)
      spyOn(__internals__, 'getResponsesForOperation').andReturn(432)
      spyOn(__internals__, 'getInterfacesFromTags').andReturn(345)
      spyOn(__internals__, 'getEndpointsForOperation').andReturn(543)

      const description = 'some desc'
      const summary = 'someName'

      const store = new Store()
      const operation = { description, summary, security: [ 1, 2, 3 ], tags: [ 4, 5 ] }
      const security = null
      const entry = {
        key: 'post',
        value: operation
      }

      const expected = {
        key: 'post',
        value: new Request({
          id: 123,
          endpoints: 543,
          name: summary,
          description,
          parameters: 321,
          method: 'post',
          auths: 234,
          responses: 432,
          interfaces: 345
        })
      }

      const actual = __internals__.convertOperationIntoRequest(store, security, entry)

      expect(__internals__.getRequestIdFromOperation).toHaveBeenCalledWith(operation)
      expect(__internals__.getParameterContainerForOperation).toHaveBeenCalledWith(
        store, operation, 'post'
      )
      expect(__internals__.getAuthReferences).toHaveBeenCalledWith(store, [ 1, 2, 3 ])
      expect(__internals__.getResponsesForOperation).toHaveBeenCalledWith(store, operation)
      expect(__internals__.getInterfacesFromTags).toHaveBeenCalledWith([ 4, 5 ])
      expect(__internals__.getEndpointsForOperation).toHaveBeenCalledWith(store, operation)
      expect(actual).toEqual(expected)
    })

    it('should call getAuthReferences with global security if no local security', () => {
      spyOn(__internals__, 'getRequestIdFromOperation').andReturn(123)
      spyOn(__internals__, 'getParameterContainerForOperation').andReturn(321)
      spyOn(__internals__, 'getAuthReferences').andReturn(234)
      spyOn(__internals__, 'getResponsesForOperation').andReturn(432)
      spyOn(__internals__, 'getInterfacesFromTags').andReturn(345)
      spyOn(__internals__, 'getEndpointsForOperation').andReturn(543)

      const description = 'some desc'
      const summary = 'someName'

      const store = new Store()
      const operation = { description, summary, tags: [ 4, 5 ] }
      const security = [ 1, 2, 3 ]
      const entry = {
        key: 'post',
        value: operation
      }

      const expected = {
        key: 'post',
        value: new Request({
          id: 123,
          endpoints: 543,
          name: summary,
          description,
          parameters: 321,
          method: 'post',
          auths: 234,
          responses: 432,
          interfaces: 345
        })
      }

      const actual = __internals__.convertOperationIntoRequest(store, security, entry)

      expect(__internals__.getRequestIdFromOperation).toHaveBeenCalledWith(operation)
      expect(__internals__.getParameterContainerForOperation).toHaveBeenCalledWith(
        store, operation, 'post'
      )
      expect(__internals__.getAuthReferences).toHaveBeenCalledWith(store, [ 1, 2, 3 ])
      expect(__internals__.getResponsesForOperation).toHaveBeenCalledWith(store, operation)
      expect(__internals__.getInterfacesFromTags).toHaveBeenCalledWith([ 4, 5 ])
      expect(__internals__.getEndpointsForOperation).toHaveBeenCalledWith(store, operation)
      expect(actual).toEqual(expected)
    })
  })

  describe('@createReferencesForEndpoints', () => {
    it('should work', () => {
      const store = new Store({
        endpoint: new OrderedMap({
          '123': 123,
          '321': 321
        })
      })

      const expected = new OrderedMap({
        '123': new Reference({ type: 'endpoint', uuid: '123' }),
        '321': new Reference({ type: 'endpoint', uuid: '321' })
      })

      const actual = __internals__.createReferencesForEndpoints(store)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getRequestsForResource', () => {
    it('should call all expected methods', () => {
      spyOn(__internals__, 'getMethodsFromResourceObject').andReturn([
        {
          key: 1,
          value: 1
        }, {
          key: 2,
          value: 2
        }, {
          key: 3,
          value: 3
        }
      ])
      spyOn(__internals__, 'updateOperationEntryWithSharedParameters').andReturn({
        key: 123, value: 321
      })
      spyOn(__internals__, 'convertOperationIntoRequest').andReturn({
        key: 321, value: 321
      })

      const store = new Store()
      const security = null
      const resourceObject = {
        parameters: [ 1, 2, 3, 4 ]
      }

      const expected = { '321': 321 }
      const actual = __internals__.getRequestsForResource(store, security, resourceObject)

      expect(__internals__.getMethodsFromResourceObject).toHaveBeenCalledWith(resourceObject)
      expect(__internals__.updateOperationEntryWithSharedParameters.calls.length).toEqual(3)
      expect(__internals__.convertOperationIntoRequest.calls.length).toEqual(3)
      expect(actual).toEqual(expected)
    })
  })

  describe('@getResource', () => {
    it('should work if underlying methods work', () => {
      spyOn(__internals__, 'getRequestsForResource').andReturn({ a: 123 })
      spyOn(__internals__, 'createReferencesForEndpoints').andReturn(321)
      spyOn(__internals__, 'updatePathWithParametersFromOperations').andCall((s, p) => p)

      const store = new Store()
      const security = null
      const paths = {}
      const path = '/some/path'

      const expected = new Resource({
        path: new URL({
          url: path,
          variableDelimiters: List([ '{', '}' ])
        }),
        endpoints: 321,
        uuid: path,
        methods: Map({ a: 123 })
      })

      const actual = __internals__.getResource(store, security, paths, path)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getResources', () => {
    it('should work if underlying methods work', () => {
      spyOn(__internals__, 'getResource').andReturn(new Resource({ uuid: 123 }))

      const store = new Store()
      const swagger = {
        paths: {
          a: '123'
        }
      }

      const expected = new OrderedMap({
        '123': new Resource({ uuid: 123 })
      })

      const actual = __internals__.getResources(store, swagger)

      expect(actual).toEqual(expected)
    })
  })

  describe('@addDotsToScheme', () => {
    it('should work', () => {
      const inputs = [ 'http', 'https:', 'ns:urn' ]

      const expected = [ 'http:', 'https:', 'ns:urn:' ]
      const actual = inputs.map(__internals__.addDotsToScheme)
      expect(actual).toEqual(expected)
    })
  })

  describe('@getSharedEndpoints', () => {
    it('should work', () => {
      const swagger = {
        schemes: [ 'https:' ],
        host: 'some.host.com',
        basePath: '/v2'
      }

      const expected = {
        base: new URL({
          url: 'https://some.host.com/v2',
          uuid: 'base',
          secure: true,
          variableDelimiters: List([ '{', '}' ])
        })
      }
      const actual = __internals__.getSharedEndpoints(swagger)

      expect(actual).toEqual(expected)
    })

    it('should work with missing basePath', () => {
      const swagger = {
        schemes: [ 'https:' ],
        host: 'some.host.com'
      }

      const expected = {
        base: new URL({
          url: 'https://some.host.com/',
          uuid: 'base',
          secure: true,
          variableDelimiters: List([ '{', '}' ])
        })
      }
      const actual = __internals__.getSharedEndpoints(swagger)

      expect(actual).toEqual(expected)
    })

    it('should work with missing host', () => {
      const swagger = {
        schemes: [ 'https:' ]
      }

      const expected = {
        base: new URL({
          url: 'https://localhost/',
          uuid: 'base',
          secure: true,
          variableDelimiters: List([ '{', '}' ])
        })
      }
      const actual = __internals__.getSharedEndpoints(swagger)

      expect(actual).toEqual(expected)
    })

    it('should work with everything missing', () => {
      const swagger = {}

      const expected = {
        base: new URL({
          url: 'http://localhost/',
          uuid: 'base',
          secure: false,
          variableDelimiters: List([ '{', '}' ])
        })
      }
      const actual = __internals__.getSharedEndpoints(swagger)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getParamsFromConsumes', () => {
    it('should work', () => {
      const contentTypes = [ 'application/json', 'application/xml' ]
      const expected = {
        consumesParams: {
          globalConsumes: new Parameter({
            uuid: 'globalConsumes',
            in: 'headers',
            key: 'Content-Type',
            name: 'Content Type Header',
            description: 'describes the media type of the request',
            type: 'string',
            required: true,
            constraints: List([
              new Constraint.Enum(contentTypes)
            ]),
            interfaces: Map({
              apiRequestMediaType: new Reference({
                type: 'interface',
                uuid: 'apiRequestMediaType'
              })
            })
          })
        },
        consumeInterfaces: {
          apiRequestMediaType: new Interface({
            name: 'apiRequestMediaType',
            uuid: 'apiRequestMediaType',
            level: 'request',
            description: 'defines the common media type of requests in the API.'
          })
        }
      }

      const actual = __internals__.getParamsFromConsumes(contentTypes)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getParamsFromProduces', () => {
    it('should work', () => {
      const contentTypes = [ 'application/json', 'application/xml' ]
      const expected = {
        producesParams: {
          globalProduces: new Parameter({
            usedIn: 'response',
            uuid: 'globalProduces',
            in: 'headers',
            key: 'Content-Type',
            name: 'Content Type Header',
            description: 'describes the media type of the response',
            type: 'string',
            required: true,
            constraints: List([
              new Constraint.Enum(contentTypes)
            ]),
            interfaces: Map({
              apiResponseMediaType: new Reference({
                type: 'interface',
                uuid: 'apiResponseMediaType'
              })
            })
          })
        },
        produceInterfaces: {
          apiResponseMediaType: new Interface({
            name: 'apiResponseMediaType',
            uuid: 'apiResponseMediaType',
            level: 'response',
            description: 'defines the common media type of responses in the API.'
          })
        }
      }

      const actual = __internals__.getParamsFromProduces(contentTypes)

      expect(actual).toEqual(expected)
    })
  })

  describe('@formatConstraint', () => {
    it('should work with exclusiveMinimum', () => {
      const param = {
        minimum: 123,
        exclusiveMinimum: true
      }

      const entry = {
        key: 'exclusiveMinimum',
        value: true
      }

      const expected = new Constraint.ExclusiveMinimum(123)
      const actual = __internals__.formatConstraint(param, entry)

      expect(actual).toEqual(expected)
    })

    it('should work with exclusiveMaximum', () => {
      const param = {
        maximum: 123,
        exclusiveMaximum: true
      }

      const entry = {
        key: 'exclusiveMaximum',
        value: true
      }

      const expected = new Constraint.ExclusiveMaximum(123)
      const actual = __internals__.formatConstraint(param, entry)

      expect(actual).toEqual(expected)
    })

    it('should work in general', () => {
      const param = {}

      const entries = [
        {
          key: 'minimum',
          value: 12
        },
        {
          key: 'maximum',
          value: 12
        },
        {
          key: 'multipleOf',
          value: 12
        },
        {
          key: 'minLength',
          value: 12
        },
        {
          key: 'maxLength',
          value: 12
        },
        {
          key: 'pattern',
          value: '^.{12}$'
        },
        {
          key: 'minItems',
          value: 12
        },
        {
          key: 'maxItems',
          value: 12
        },
        {
          key: 'uniqueItems',
          value: 12
        },
        {
          key: 'enum',
          value: [ 12 ]
        },
        {
          key: 'schema',
          value: { enum: [ 12 ] }
        }
      ]

      const expected = [
        new Constraint.Minimum(12),
        new Constraint.Maximum(12),
        new Constraint.MultipleOf(12),
        new Constraint.MinimumLength(12),
        new Constraint.MaximumLength(12),
        new Constraint.Pattern('^.{12}$'),
        new Constraint.MinimumItems(12),
        new Constraint.MaximumItems(12),
        new Constraint.UniqueItems(12),
        new Constraint.Enum([ 12 ]),
        new Constraint.JSONSchema({ enum: [ 12 ] })
      ]

      const actual = entries.map((entry) => __internals__.formatConstraint(param, entry))

      expect(actual).toEqual(expected)
    })
  })

  describe('@filterConstraintEntries', () => {
    it('should work', () => {
      const entries = [
        { key: 'minimum' },
        { key: 'maximum' },
        { key: 'exclusiveMinimum' },
        { key: 'exclusiveMaximum' },
        { key: 'multipleOf' },
        { key: 'minLength' },
        { key: 'maxLength' },
        { key: 'pattern' },
        { key: 'minItems' },
        { key: 'maxItems' },
        { key: 'uniqueItems' },
        { key: 'enum' },
        { key: 'schema' },
        { key: 'notAConstraint' },
        { key: 'alsoNotAConstraint' }
      ]

      const expected = [
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        false,
        false
      ]

      const actual = entries.map(__internals__.filterConstraintEntries)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getConstraintsFromParam', () => {
    it('should work', () => {
      const param = {
        maximum: 321,
        minimum: 123,
        multipleOf: 5
      }

      const expected = List([
        new Constraint.Maximum(321),
        new Constraint.Minimum(123),
        new Constraint.MultipleOf(5)
      ])

      const actual = __internals__.getConstraintsFromParam(param)

      expect(actual).toEqual(expected)
    })
  })

  describe('@convertParameterObjectIntoParameter', () => {
    it('should work', () => {
      const entry = {
        key: 'UserId',
        value: {
          name: 'userId',
          in: 'query',
          type: 'integer',
          description: 'the user id',
          required: true,
          maximum: 321,
          minimum: 123,
          multipleOf: 5,
          default: 100
        }
      }

      const expected = {
        key: 'UserId',
        value: new Parameter({
          key: 'userId',
          name: 'userId',
          in: 'queries',
          uuid: 'UserId',
          description: 'the user id',
          required: true,
          type: 'integer',
          default: 100,
          constraints: List([
            new Constraint.Maximum(321),
            new Constraint.Minimum(123),
            new Constraint.MultipleOf(5)
          ])
        })
      }

      const actual = __internals__.convertParameterObjectIntoParameter(entry)

      expect(actual).toEqual(expected)
    })

    it('should work with type array', () => {
      const entry = {
        key: 'UserIds',
        value: {
          name: 'userIds',
          in: 'query',
          type: 'array',
          items: {
            name: 'userId',
            in: 'query',
            type: 'integer',
            description: 'the user id',
            required: true,
            maximum: 321,
            minimum: 123,
            multipleOf: 5,
            default: 100
          }
        }
      }

      const expected = {
        key: 'UserIds',
        value: new Parameter({
          in: 'queries',
          key: 'userIds',
          name: 'userIds',
          uuid: 'UserIds',
          type: 'array',
          required: false,
          value: new Parameter({
            key: 'userId',
            name: 'userId',
            in: 'queries',
            description: 'the user id',
            required: true,
            type: 'integer',
            default: 100,
            constraints: List([
              new Constraint.Maximum(321),
              new Constraint.Minimum(123),
              new Constraint.MultipleOf(5)
            ])
          })
        })
      }

      const actual = __internals__.convertParameterObjectIntoParameter(entry)

      expect(actual).toEqual(expected)
    })
  })

  describe('@convertParameterObjectArrayIntoParameterMap', () => {
    it('should call convertParameterObjectIntoParameter for each entry', () => {
      spyOn(__internals__, 'convertParameterObjectIntoParameter').andReturn({
        key: '123',
        value: 123
      })

      const params = [ 1, 2, 3 ]
      const expected = { '123': 123 }
      const actual = __internals__.convertParameterObjectArrayIntoParameterMap(params)

      expect(__internals__.convertParameterObjectIntoParameter.calls.length).toEqual(3)
      expect(actual).toEqual(expected)
    })
  })

  describe('@getSharedParameters', () => {
    it('should work if underlying methods are correct', () => {
      spyOn(__internals__, 'getParamsFromConsumes').andReturn({
        consumesParams: { a: 123 },
        consumeInterfaces: { d: 432 }
      })
      spyOn(__internals__, 'getParamsFromProduces').andReturn({
        producesParams: { b: 321 },
        produceInterfaces: { e: 345 }
      })
      spyOn(__internals__, 'convertParameterObjectArrayIntoParameterMap').andReturn({ c: 234 })

      const swagger = {}

      const expected = {
        sharedParameters: { a: 123, b: 321, c: 234 },
        parameterInterfaces: { d: 432, e: 345 }
      }
      const actual = __internals__.getSharedParameters(swagger)

      expect(actual).toEqual(expected)
    })
  })

  describe('@convertSchemaIntoParameterEntry', () => {
    it('should work', () => {
      const schema = {
        type: 'string'
      }

      const expected = {
        key: 'body',
        value: new Parameter({
          usedIn: 'response',
          uuid: 'body',
          constraints: List([
            new Constraint.JSONSchema(schema)
          ])
        })
      }
      const actual = __internals__.convertSchemaIntoParameterEntry(schema)

      expect(actual).toEqual(expected)
    })
  })

  describe('@createResponseParameterContainer', () => {
    it('should work if underlying methods are correct', () => {
      spyOn(__internals__, 'convertSchemaIntoParameterEntry').andReturn({
        key: '321', value: 321
      })
      spyOn(__internals__, 'convertParameterObjectArrayIntoParameterMap').andReturn({
        '123': 123
      })

      const responseObj = {
        schema: {},
        headers: { a: 'bc' }
      }

      const expected = new ParameterContainer({
        body: new OrderedMap({ '321': 321 }),
        headers: new OrderedMap({ '123': 123 })
      })

      const actual = __internals__.createResponseParameterContainer(responseObj)

      expect(actual).toEqual(expected)
    })
  })

  describe('@convertResponseObjectIntoResponse', () => {
    it('should work with reference', () => {
      const entry = {
        key: 123,
        value: {
          code: 200,
          $ref: 321
        }
      }

      const expected = {
        key: 123,
        value: new Reference({
          type: 'response',
          uuid: 321,
          overlay: new Response({ code: 200 })
        })
      }

      const actual = __internals__.convertResponseObjectIntoResponse(entry)

      expect(actual).toEqual(expected)
    })

    it('should work with response', () => {
      const entry = {
        key: 123,
        value: {
          code: 200,
          description: 'desc'
        }
      }

      const expected = {
        key: 123,
        value: new Response({
          code: 200,
          description: 'desc'
        })
      }

      const actual = __internals__.convertResponseObjectIntoResponse(entry)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getSharedResponses', () => {
    it('should work if underlying methods are correct', () => {
      spyOn(__internals__, 'convertResponseObjectIntoResponse').andReturn({
        key: '321',
        value: 321
      })

      const swagger = {
        responses: {
          a: 123
        }
      }

      const expected = {
        '321': 321
      }

      const actual = __internals__.getSharedResponses(swagger)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getAuthType', () => {
    it('should work', () => {
      const auth = {
        type: 'basic'
      }

      const expected = 'basic'
      const actual = __internals__.getAuthType(auth)

      expect(actual).toEqual(expected)
    })
  })

  describe('@addInterfaceToAuthInstance', () => {
    it('should work', () => {
      const authInstance = {
        someKey: 123
      }

      const itf = new Interface({
        name: 'someName'
      })

      const expected = {
        someKey: 123,
        interfaces: Map({
          someName: itf
        })
      }

      const actual = __internals__.addInterfaceToAuthInstance(authInstance, itf)

      expect(actual).toEqual(expected)
    })
  })

  describe('@convertBasicAuth', () => {
    it('should work', () => {
      const itf = new Interface({
        name: 'someName'
      })

      const authInstance = {
        description: 123
      }

      const authName = 'basic_auth'

      const expected = new Auth.Basic({
        description: 123,
        authName: 'basic_auth',
        interfaces: Map({
          someName: itf
        })
      })

      const actual = __internals__.convertBasicAuth(itf, authName, authInstance)

      expect(actual).toEqual(expected)
    })
  })

  describe('@convertApiKeyAuth', () => {
    it('should work', () => {
      const itf = new Interface({
        name: 'someName'
      })

      const authName = 'apikey_auth'

      const authInstance = {
        description: 123,
        name: 'api_key'
      }

      const expected = new Auth.ApiKey({
        description: 123,
        name: 'api_key',
        authName: 'apikey_auth',
        interfaces: Map({
          someName: itf
        })
      })

      const actual = __internals__.convertApiKeyAuth(itf, authName, authInstance)

      expect(actual).toEqual(expected)
    })
  })

  describe('@convertOAuth2Auth', () => {
    it('should work', () => {
      const itf = new Interface({
        name: 'someName'
      })

      const authName = 'oauth2_auth'

      const authInstance = {
        description: 123,
        flow: 321,
        tokenUrl: 234,
        authorizationUrl: 432
      }

      const expected = new Auth.OAuth2({
        description: 123,
        flow: 321,
        tokenUrl: 234,
        authorizationUrl: 432,
        authName: 'oauth2_auth',
        interfaces: Map({
          someName: itf
        })
      })

      const actual = __internals__.convertOAuth2Auth(itf, authName, authInstance)

      expect(actual).toEqual(expected)
    })
  })

  describe('@convertAuthObjectIntoAuth', () => {
    it('should work', () => {
      const itfs = []
      const entry = {
        key: 'petstore_auth',
        value: {
          type: 'oauth2'
        }
      }

      const expected = {
        key: 'petstore_auth',
        value: new Auth.OAuth2({
          authName: 'petstore_auth'
        })
      }

      const actual = __internals__.convertAuthObjectIntoAuth(itfs, entry)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getSharedAuths', () => {
    it('should work if underlying methods are correct', () => {
      spyOn(__internals__, 'convertAuthObjectIntoAuth').andReturn({
        key: '123',
        value: 123
      })

      const itfs = {}
      const swagger = {
        securityDefinitions: {
          a: 321
        }
      }

      const expected = { '123': 123 }
      const actual = __internals__.getSharedAuths(itfs, swagger)

      expect(actual).toEqual(expected)
    })
  })

  describe('@convertSecurityRequirementEntryIntoInterfaceEntry', () => {
    it('should work', () => {
      const entry = { key: 123 }
      const expected = {
        key: 123,
        value: new Interface({
          name: 123,
          uuid: 123,
          level: 'auth'
        })
      }
      const actual = __internals__.convertSecurityRequirementEntryIntoInterfaceEntry(entry)
      expect(actual).toEqual(expected)
    })
  })

  describe('@getSharedAuthInterfaces', () => {
    it('should work if underlying methods are correct', () => {
      spyOn(__internals__, 'convertSecurityRequirementEntryIntoInterfaceEntry').andReturn({
        key: '123',
        value: 123
      })

      const swagger = {
        security: [
          {
            petstore_auth: []
          }
        ]
      }

      const expected = { '123': 123 }
      const actual = __internals__.getSharedAuthInterfaces(swagger)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getSimpleStore', () => {
    it('should work if underlying calls are correct', () => {
      spyOn(__internals__, 'getSharedEndpoints').andReturn({ a: 123 })
      spyOn(__internals__, 'getSharedParameters').andReturn({
        sharedParameters: { b: 234 },
        parameterInterfaces: { f: 678 }
      })
      spyOn(__internals__, 'getSharedResponses').andReturn({ c: 345 })
      spyOn(__internals__, 'getSharedAuthInterfaces').andReturn({ d: 456 })
      spyOn(__internals__, 'getSharedAuths').andReturn({ e: 567 })

      const swagger = {}

      const expected = new Store({
        endpoint: OrderedMap({ a: 123 }),
        parameter: OrderedMap({ b: 234 }),
        response: OrderedMap({ c: 345 }),
        auth: OrderedMap({ e: 567 }),
        interface: OrderedMap({ f: 678, d: 456 })
      })

      const actual = __internals__.getSimpleStore(swagger)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getGroup', () => {
    it('should work', () => {
      const swagger = {
        paths: {
          a: 123,
          b: 321
        }
      }

      const expected = new Group({
        id: null,
        name: null,
        description: 'All the requests',
        children: new OrderedMap({
          a: 'a',
          b: 'b'
        })
      })

      const actual = __internals__.getGroup(swagger)

      expect(actual).toEqual(expected)
    })
  })

  describe('@createApi', () => {
    it('should return an Api', () => {
      const actual = __internals__.createApi()
      expect(actual).toBeAn(Api)
    })

    it('should call getInfo', () => {
      spyOn(__internals__, 'getInfo').andReturn(new Info())

      const info = {
        title: 'some API title'
      }

      const input = {
        info
      }

      __internals__.createApi(input)

      expect(__internals__.getInfo).toHaveBeenCalledWith(info)
    })

    xit('should call getResources')
  })
})
