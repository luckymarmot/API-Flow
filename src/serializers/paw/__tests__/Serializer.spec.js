/* eslint-disable max-nested-callbacks */
import expect, { spyOn, restoreSpies } from 'expect'
import { OrderedMap, List } from 'immutable'

import { DynamicString, DynamicValue, RecordParameter } from '../../../mocks/PawMocks'

import Api from '../../../models/Api'
import Info from '../../../models/Info'
import Store from '../../../models/Store'
import Constraint from '../../../models/Constraint'
import URLComponent from '../../../models/URLComponent'
import URL from '../../../models/URL'
import Parameter from '../../../models/Parameter'
import Auth from '../../../models/Auth'
import Variable from '../../../models/Variable'
import Reference from '../../../models/Reference'
import ParameterContainer from '../../../models/ParameterContainer'
import Context from '../../../models/Context'
import Request from '../../../models/Request'
import Resource from '../../../models/Resource'
import Group from '../../../models/Group'

import Serializer, { __internals__ } from '../Serializer'

describe('serializers/paw/Serializer.js', () => {
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

        const args = { options: { context: 123, items: 321 }, api: 234 }
        const actual = Serializer.serialize(args)

        expect(__internals__.serialize).toHaveBeenCalledWith(args)
        expect(actual).toEqual(expected)
      })
    })
  })

  describe('@wrapDV', () => {
    it('should return a DynamicString', () => {
      const dv = new DynamicValue('some.dv.name', {})
      const actual = __internals__.wrapDV(dv)

      expect(actual).toBeA(DynamicString)
    })

    it('should work', () => {
      const dv = new DynamicValue('some.dv.name', {})
      const expected = new DynamicString(dv)
      const actual = __internals__.wrapDV(dv)

      expect(actual).toEqual(expected)
    })
  })

  describe('@createJSONDV', () => {
    it('should return a DynamicValue', () => {
      const json = { some: 'json' }
      const actual = __internals__.createJSONDV(json)

      expect(actual).toBeA(DynamicValue)
    })

    it('should work', () => {
      const json = { some: 'json' }
      const expected = new DynamicValue('com.luckymarmot.JSONDynamicValue', {
        json: '{"some":"json"}'
      })
      const actual = __internals__.createJSONDV(json)

      expect(actual).toEqual(expected)
    })
  })

  describe('@createUrlEncodedBodyDV', () => {
    it('should return a DynamicValue', () => {
      const keyValues = [ new RecordParameter(123, 321, true) ]
      const actual = __internals__.createUrlEncodedBodyDV(keyValues)

      expect(actual).toBeA(DynamicValue)
    })

    it('should work', () => {
      const keyValues = [ new RecordParameter(123, 321, true) ]
      const expected = new DynamicValue(
        'com.luckymarmot.BodyFormKeyValueDynamicValue', {
          keyValues: keyValues
        }
      )
      const actual = __internals__.createUrlEncodedBodyDV(keyValues)

      expect(actual).toEqual(expected)
    })
  })

  describe('@createMultipartBodyDV', () => {
    it('should return a DynamicValue', () => {
      const keyValues = [ new RecordParameter(123, 321, true) ]
      const actual = __internals__.createMultipartBodyDV(keyValues)

      expect(actual).toBeA(DynamicValue)
    })

    it('should work', () => {
      const keyValues = [ new RecordParameter(123, 321, true) ]
      const expected = new DynamicValue(
        'com.luckymarmot.BodyMultipartFormDataDynamicValue', {
          keyValues: keyValues
        }
      )
      const actual = __internals__.createMultipartBodyDV(keyValues)

      expect(actual).toEqual(expected)
    })
  })

  describe('@createMultiSelectorDv', () => {
    it('should work', () => {
      const inputs = [
        [ 123, 234, 345 ]
      ]
      const expected = [
        new DynamicValue('me.elliotchance.MultiSelectorDynamicValue', {
          choices: [ 123, 234, 345 ],
          separator: ','
        })
      ]
      const actual = inputs.map(input => __internals__.createMultiSelectorDv(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@getTitleFromApi', () => {
    it('should work', () => {
      const api = new Api({
        info: new Info({
          title: 'this should work'
        })
      })

      const expected = 'this should work'
      const actual = __internals__.getTitleFromApi(api)

      expect(actual).toEqual(expected)
    })

    it('should work if no title', () => {
      const api = new Api({
        info: new Info({
          title: null
        })
      })

      const expected = 'Imports'
      const actual = __internals__.getTitleFromApi(api)

      expect(actual).toEqual(expected)
    })
  })

  describe('@createStandardEnvironmentDomain', () => {
    it('should call getTitleFromApi', () => {
      spyOn(__internals__, 'getTitleFromApi').andReturn('hello')

      const context = {
        createEnvironmentDomain: () => {}
      }

      spyOn(context, 'createEnvironmentDomain').andReturn('done')

      const api = new Api()
      __internals__.createStandardEnvironmentDomain(context, api)

      expect(__internals__.getTitleFromApi).toHaveBeenCalledWith(api)
    })

    it('should call context.createEnvironmentDomain', () => {
      spyOn(__internals__, 'getTitleFromApi').andReturn('hello')

      const context = {
        createEnvironmentDomain: () => {}
      }

      spyOn(context, 'createEnvironmentDomain').andReturn('done')

      const api = new Api()

      __internals__.createStandardEnvironmentDomain(context, api)

      expect(context.createEnvironmentDomain).toHaveBeenCalledWith('hello')
    })
  })

  describe('@getStandardEnvironmentDomainSize', () => {
    it('should return 0 if no record in store', () => {
      const api = new Api({
        store: new Store()
      })

      const expected = 0
      const actual = __internals__.getStandardEnvironmentDomainSize(api)

      expect(actual).toEqual(expected)
    })

    it('should return 0 if only variable in store', () => {
      const api = new Api({
        store: new Store({
          variable: new OrderedMap({
            abc: 123,
            bca: 231
          })
        })
      })

      const expected = 0
      const actual = __internals__.getStandardEnvironmentDomainSize(api)

      expect(actual).toEqual(expected)
    })

    it('should work otherwise', () => {
      const api = new Api({
        store: new Store({
          endpoint: new OrderedMap({ abc: 123, cba: 321 }),
          auth: new OrderedMap({ qwe: 234, ewq: 432 }),
          variable: new OrderedMap({ asd: 345, dsa: 543 })
        })
      })

      const expected = 4
      const actual = __internals__.getStandardEnvironmentDomainSize(api)

      expect(actual).toEqual(expected)
    })
  })

  describe('@needsStandardEnvironmentDomain', () => {
    it('should return false if domain size is 0', () => {
      spyOn(__internals__, 'getStandardEnvironmentDomainSize').andReturn(0)
      const api = new Api()

      const expected = false
      const actual = __internals__.needsStandardEnvironmentDomain(api)

      expect(__internals__.getStandardEnvironmentDomainSize).toHaveBeenCalled()
      expect(actual).toEqual(expected)
    })

    it('should return true if domain size is 1 or more', () => {
      spyOn(__internals__, 'getStandardEnvironmentDomainSize').andReturn(10)
      const api = new Api()

      const expected = true
      const actual = __internals__.needsStandardEnvironmentDomain(api)

      expect(__internals__.getStandardEnvironmentDomainSize).toHaveBeenCalled()
      expect(actual).toEqual(expected)
    })
  })

  describe('@createVariableEnvironmentDomain', () => {
    it('should call getTitleFromApi', () => {
      spyOn(__internals__, 'getTitleFromApi').andReturn('hello')

      const context = {
        createEnvironmentDomain: () => {}
      }

      spyOn(context, 'createEnvironmentDomain').andReturn('done')

      const api = new Api()
      __internals__.createVariableEnvironmentDomain(context, api)

      expect(__internals__.getTitleFromApi).toHaveBeenCalledWith(api)
    })

    it('should call context.createEnvironmentDomain', () => {
      spyOn(__internals__, 'getTitleFromApi').andReturn('hello')

      const context = {
        createEnvironmentDomain: () => {}
      }

      spyOn(context, 'createEnvironmentDomain').andReturn('done')

      const api = new Api()

      __internals__.createVariableEnvironmentDomain(context, api)

      expect(context.createEnvironmentDomain).toHaveBeenCalledWith('Vars - hello')
    })
  })

  describe('@addConstraintToDomain', () => {
    /* eslint-disable max-statements */
    it('should work if underlying methods are correct', () => {
      const domain = { createEnvironmentVariable: () => {} }
      const environment = {}
      const constraint = new Constraint.JSONSchema({ type: 'string' })
      const key = 'User'

      const variable = { setValue: () => {} }
      spyOn(domain, 'createEnvironmentVariable').andReturn(variable)
      spyOn(variable, 'setValue').andReturn(null)

      spyOn(__internals__, 'createJSONDV').andCallThrough()
      spyOn(__internals__, 'wrapDV').andReturn('123')

      const expected = variable
      const actual = __internals__.addConstraintToDomain(domain, environment, constraint, key)

      expect(domain.createEnvironmentVariable).toHaveBeenCalledWith(key)
      expect(__internals__.createJSONDV).toHaveBeenCalledWith({ type: 'string' })
      expect(__internals__.wrapDV).toHaveBeenCalled()
      expect(variable.setValue).toHaveBeenCalledWith('123', environment)
      expect(actual).toEqual(expected)
    })
    /* eslint-enable max-statements */
  })

  describe('@addConstraintsToDomain', () => {
    it('should work if underlying methods are correct', () => {
      spyOn(__internals__, 'addConstraintToDomain').andReturn('test')

      const domain = {}
      const environment = {}
      const api = new Api({
        store: new Store({
          constraint: new OrderedMap({
            abc: 123,
            bca: 231
          })
        })
      })

      const expected = new OrderedMap({ abc: 'test', bca: 'test' })
      const actual = __internals__.addConstraintsToDomain(domain, environment, api)

      expect(__internals__.addConstraintToDomain.calls.length).toEqual(2)
      expect(actual).toEqual(expected)
    })
  })

  describe('@removeDotsFromProtocol', () => {
    it('should work', () => {
      const input = [ 'http', 'https:' ]

      const expected = [ 'http', 'https' ]
      const actual = input.map(__internals__.removeDotsFromProtocol)

      expect(actual).toEqual(expected)
    })
  })

  describe('@convertProtocolIntoRecordParameter', () => {
    it('should work', () => {
      const inputs = [
        [ 'http', 0 ],
        [ 'https:', 1 ]
      ]
      const expected = [
        new RecordParameter('http', ', ', true),
        new RecordParameter('https', ', ', false)
      ]

      const actual = inputs.map(input => __internals__.convertProtocolIntoRecordParameter(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createProtocolDV', () => {
    it('should work if no protocol', () => {
      const protocol = null
      const expected = 'http'
      const actual = __internals__.createProtocolDV(protocol)

      expect(actual).toEqual(expected)
    })

    it('should work if single protocol', () => {
      const protocol = List([ 'https:' ])
      const expected = 'https'
      const actual = __internals__.createProtocolDV(protocol)

      expect(actual).toEqual(expected)
    })

    it('should work if multiple protocol', () => {
      spyOn(__internals__, 'convertProtocolIntoRecordParameter').andReturn(123)
      spyOn(__internals__, 'createMultiSelectorDv').andReturn(321)

      const protocol = List([ 'https:', 'http' ])
      const expected = 321
      const actual = __internals__.createProtocolDV(protocol)

      expect(__internals__.convertProtocolIntoRecordParameter.calls.length).toEqual(2)
      expect(__internals__.createMultiSelectorDv).toHaveBeenCalledWith([ 123, 123 ])
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertURLComponentToDynamicString', () => {
    it('should work', () => {
      const urlComponent = new URLComponent({
        componentName: 'pathname',
        string: '/some/path',
        variableDelimiters: List([ '{', '}' ])
      })

      const expected = '/some/path'
      const actual = __internals__.convertURLComponentToDynamicString(urlComponent)

      expect(actual).toEqual(expected)
    })
  })

  describe('@createEndpointDynamicString', () => {
    it('should work', () => {
      const endpoint = new URL({
        url: 'https://echo.paw.cloud/{version}/users',
        variableDelimiters: List([ '{', '}' ])
      })

      const expected = new DynamicString(
        'https',
        '://',
        'echo.paw.cloud',
        '', '',
        '/{version}/users'
      )
      const actual = __internals__.createEndpointDynamicString(endpoint)

      expect(actual).toEqual(expected)
    })

    it('should work with port and dirty path', () => {
      const endpoint = new URL({
        url: 'https://echo.paw.cloud:8080/{version}/users/',
        variableDelimiters: List([ '{', '}' ])
      })

      const expected = new DynamicString(
        'https',
        '://',
        'echo.paw.cloud',
        ':', '8080',
        '/{version}/users'
      )
      const actual = __internals__.createEndpointDynamicString(endpoint)

      expect(actual).toEqual(expected)
    })
  })

  describe('@addEndpointToDomain', () => {
    /* eslint-disable max-statements */
    it('should work', () => {
      const domain = { createEnvironmentVariable: () => {} }
      const environment = {}
      const endpoint = new URL({
        url: 'https://echo.paw.cloud'
      })
      const key = 'server1'

      const variable = { setValue: () => {} }
      spyOn(domain, 'createEnvironmentVariable').andReturn(variable)
      spyOn(variable, 'setValue').andReturn(null)

      spyOn(__internals__, 'createEndpointDynamicString').andReturn('123')

      const expected = variable
      const actual = __internals__.addEndpointToDomain(domain, environment, endpoint, key)

      expect(domain.createEnvironmentVariable).toHaveBeenCalledWith(key)
      expect(__internals__.createEndpointDynamicString).toHaveBeenCalledWith(endpoint)
      expect(variable.setValue).toHaveBeenCalledWith('123', environment)
      expect(actual).toEqual(expected)
    })
    /* eslint-enable max-statements */
  })

  describe('@addEndpointsToDomain', () => {
    it('should work if underlying methods are correct', () => {
      spyOn(__internals__, 'addEndpointToDomain').andReturn('test')

      const domain = {}
      const environment = {}
      const api = new Api({
        store: new Store({
          endpoint: new OrderedMap({
            abc: 123,
            bca: 231
          })
        })
      })

      const expected = new OrderedMap({ abc: 'test', bca: 'test' })
      const actual = __internals__.addEndpointsToDomain(domain, environment, api)

      expect(__internals__.addEndpointToDomain.calls.length).toEqual(2)
      expect(actual).toEqual(expected)
    })
  })

  describe('@addParameterToDomain', () => {
    /* eslint-disable max-statements */
    it('should work if underlying methods are correct', () => {
      const domain = { createEnvironmentVariable: () => {} }
      const environment = {}
      const parameter = new Parameter({ type: 'string' })
      const key = 'User'

      const variable = { setValue: () => {} }
      spyOn(domain, 'createEnvironmentVariable').andReturn(variable)
      spyOn(variable, 'setValue').andReturn(null)

      spyOn(__internals__, 'createJSONDV').andCallThrough()
      spyOn(__internals__, 'wrapDV').andReturn('123')

      const expected = { variable, parameter }
      const actual = __internals__.addParameterToDomain(domain, environment, parameter, key)

      expect(domain.createEnvironmentVariable).toHaveBeenCalledWith(key)
      expect(__internals__.createJSONDV).toHaveBeenCalledWith({ type: 'string' })
      expect(__internals__.wrapDV).toHaveBeenCalled()
      expect(variable.setValue).toHaveBeenCalledWith('123', environment)
      expect(actual).toEqual(expected)
    })
    /* eslint-enable max-statements */
  })

  describe('@addParametersToDomain', () => {
    it('should work if underlying methods are correct', () => {
      spyOn(__internals__, 'addParameterToDomain').andReturn('test')

      const domain = {}
      const environment = {}
      const api = new Api({
        store: new Store({
          parameter: new OrderedMap({
            abc: 123,
            bca: 231
          })
        })
      })

      const expected = new OrderedMap({ abc: 'test', bca: 'test' })
      const actual = __internals__.addParametersToDomain(domain, environment, api)

      expect(__internals__.addParameterToDomain.calls.length).toEqual(2)
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertBasicAuthIntoDynamicValue', () => {
    it('should work', () => {
      const auth = new Auth.Basic({
        username: 'user',
        password: 'pass'
      })

      const expected = new DynamicValue('com.luckymarmot.BasicAuthDynamicValue', {
        username: 'user',
        password: 'pass'
      })

      const actual = __internals__.convertBasicAuthIntoDynamicValue(auth)
      expect(actual).toEqual(expected)
    })

    it('should work with defaults', () => {
      const auth = new Auth.Basic()

      const expected = new DynamicValue('com.luckymarmot.BasicAuthDynamicValue', {
        username: '',
        password: ''
      })

      const actual = __internals__.convertBasicAuthIntoDynamicValue(auth)
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertDigestAuthIntoDynamicValue', () => {
    it('should work', () => {
      const auth = new Auth.Digest({
        username: 'user',
        password: 'pass'
      })

      const expected = new DynamicValue('com.luckymarmot.PawExtensions.DigestAuthDynamicValue', {
        username: 'user',
        password: 'pass'
      })

      const actual = __internals__.convertDigestAuthIntoDynamicValue(auth)
      expect(actual).toEqual(expected)
    })

    it('should work with defaults', () => {
      const auth = new Auth.Digest()

      const expected = new DynamicValue('com.luckymarmot.PawExtensions.DigestAuthDynamicValue', {
        username: '',
        password: ''
      })

      const actual = __internals__.convertDigestAuthIntoDynamicValue(auth)
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertOAuth1AuthIntoDynamicValue', () => {
    it('should work', () => {
      const auth = new Auth.OAuth1({
        callback: 'https://echo.paw.cloud/callback',
        consumerSecret: 'consumerSecret',
        tokenSecret: 'tokenSecret',
        consumerKey: 'consumerKey',
        algorithm: 'md5',
        nonce: '12345',
        additionalParameters: 'none',
        timestamp: 'some date',
        token: 'some token'
      })

      const expected = new DynamicValue('com.luckymarmot.OAuth1HeaderDynamicValue', {
        callback: 'https://echo.paw.cloud/callback',
        consumerSecret: 'consumerSecret',
        tokenSecret: 'tokenSecret',
        consumerKey: 'consumerKey',
        algorithm: 'md5',
        nonce: '12345',
        additionalParameters: 'none',
        timestamp: 'some date',
        token: 'some token'
      })

      const actual = __internals__.convertOAuth1AuthIntoDynamicValue(auth)
      expect(actual).toEqual(expected)
    })

    it('should work with default', () => {
      const auth = new Auth.OAuth1()

      const expected = new DynamicValue('com.luckymarmot.OAuth1HeaderDynamicValue', {
        callback: '',
        consumerSecret: '',
        tokenSecret: '',
        consumerKey: '',
        algorithm: '',
        nonce: '',
        additionalParameters: '',
        timestamp: '',
        token: ''
      })

      const actual = __internals__.convertOAuth1AuthIntoDynamicValue(auth)
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertOAuth2AuthIntoDynamicValue', () => {
    it('should work', () => {
      const auth = new Auth.OAuth2({
        authorizationUrl: 'https://echo.paw.cloud/auth-portal',
        tokenUrl: 'https://echo.paw.cloud/token-portal',
        flow: 'implicit',
        scopes: List([ { key: 'write:self' } ])
      })

      const expected = new DynamicValue('com.luckymarmot.OAuth2DynamicValue', {
        authorizationURL: 'https://echo.paw.cloud/auth-portal',
        accessTokenURL: 'https://echo.paw.cloud/token-portal',
        grantType: 1,
        scopes: 'write:self'
      })

      const actual = __internals__.convertOAuth2AuthIntoDynamicValue(auth)
      expect(actual).toEqual(expected)
    })

    it('should work with defaults', () => {
      const auth = new Auth.OAuth2()

      const expected = new DynamicValue('com.luckymarmot.OAuth2DynamicValue', {
        authorizationURL: '',
        accessTokenURL: '',
        grantType: 0,
        scopes: ''
      })

      const actual = __internals__.convertOAuth2AuthIntoDynamicValue(auth)
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertAuthIntoDynamicValue', () => {
    it('should work', () => {
      spyOn(__internals__, 'convertBasicAuthIntoDynamicValue').andReturn(123)
      spyOn(__internals__, 'convertDigestAuthIntoDynamicValue').andReturn(321)
      spyOn(__internals__, 'convertOAuth1AuthIntoDynamicValue').andReturn(234)
      spyOn(__internals__, 'convertOAuth2AuthIntoDynamicValue').andReturn(432)

      const input = [
        new Auth.Basic(),
        new Auth.Digest(),
        new Auth.OAuth1(),
        new Auth.OAuth2(),
        new Auth.Negotiate()
      ]

      const expected = [ 123, 321, 234, 432, '' ]
      const actual = input.map(__internals__.convertAuthIntoDynamicValue)

      expect(actual).toEqual(expected)
    })
  })

  describe('@addAuthToDomain', () => {
    /* eslint-disable max-statements */
    it('should work', () => {
      const domain = { createEnvironmentVariable: () => {} }
      const environment = {}
      const auth = new Auth.Basic()
      const key = 'basic_auth'

      const variable = { setValue: () => {} }
      spyOn(domain, 'createEnvironmentVariable').andReturn(variable)
      spyOn(variable, 'setValue').andReturn(null)

      spyOn(__internals__, 'convertAuthIntoDynamicValue').andReturn(123)
      spyOn(__internals__, 'wrapDV').andReturn('123')

      const expected = { variable, auth }
      const actual = __internals__.addAuthToDomain(domain, environment, auth, key)

      expect(domain.createEnvironmentVariable).toHaveBeenCalledWith(key)
      expect(__internals__.convertAuthIntoDynamicValue).toHaveBeenCalledWith(auth)
      expect(variable.setValue).toHaveBeenCalledWith('123', environment)
      expect(actual).toEqual(expected)
    })
    /* eslint-enable max-statements */
  })

  describe('@addAuthsToDomain', () => {
    it('should work if underlying methods are correct', () => {
      spyOn(__internals__, 'addAuthToDomain').andReturn('test')

      const domain = {}
      const environment = {}
      const api = new Api({
        store: new Store({
          auth: new OrderedMap({
            abc: 123,
            bca: 231
          })
        })
      })

      const expected = new OrderedMap({ abc: 'test', bca: 'test' })
      const actual = __internals__.addAuthsToDomain(domain, environment, api)

      expect(__internals__.addAuthToDomain.calls.length).toEqual(2)
      expect(actual).toEqual(expected)
    })
  })

  describe('@addVariablesToStandardDomain', () => {
    /* eslint-disable max-statements */
    it('should work if underlying methods are correct', () => {
      const domain = { createEnvironment: () => {} }
      spyOn(domain, 'createEnvironment').andReturn('env')

      spyOn(__internals__, 'addConstraintsToDomain').andReturn(123)
      spyOn(__internals__, 'addEndpointsToDomain').andReturn(321)
      spyOn(__internals__, 'addParametersToDomain').andReturn(234)
      spyOn(__internals__, 'addAuthsToDomain').andReturn(432)

      const api = new Api()

      const expected = new Store({
        constraint: 123,
        endpoint: 321,
        parameter: 234,
        auth: 432
      })

      const actual = __internals__.addVariablesToStandardDomain(domain, api)

      expect(domain.createEnvironment).toHaveBeenCalled()
      expect(__internals__.addConstraintsToDomain).toHaveBeenCalled()
      expect(__internals__.addEndpointsToDomain).toHaveBeenCalled()
      expect(__internals__.addParametersToDomain).toHaveBeenCalled()
      expect(__internals__.addAuthsToDomain).toHaveBeenCalled()
      expect(actual).toEqual(expected)
    })
    /* eslint-enable max-statements */
  })

  describe('@getVariableEnvironmentDomainSize', () => {
    it('should return 0 if variable TypedStore is empty', () => {
      const api = new Api({
        store: new Store()
      })

      const expected = 0
      const actual = __internals__.getVariableEnvironmentDomainSize(api)

      expect(actual).toEqual(expected)
    })

    it('should return the correct number otherwise', () => {
      const api = new Api({
        store: new Store({
          variable: new OrderedMap({
            abc: 123,
            bca: 231
          })
        })
      })

      const expected = 2
      const actual = __internals__.getVariableEnvironmentDomainSize(api)

      expect(actual).toEqual(expected)
    })
  })

  describe('@needsVariableEnvironmentDomain', () => {
    it('should return false if size is 0', () => {
      spyOn(__internals__, 'getVariableEnvironmentDomainSize').andReturn(0)

      const api = new Api()
      const expected = false
      const actual = __internals__.needsVariableEnvironmentDomain(api)

      expect(actual).toEqual(expected)
    })

    it('should return true if size is >= 1', () => {
      spyOn(__internals__, 'getVariableEnvironmentDomainSize').andReturn(10)

      const api = new Api()
      const expected = true
      const actual = __internals__.needsVariableEnvironmentDomain(api)

      expect(actual).toEqual(expected)
    })
  })

  describe('@updateEnvironmentVariableWithEnvironmentValue', () => {
    /* eslint-disable max-statements */
    it('should work', () => {
      const domain = {
        getEnvironmentByName: () => {},
        createEnvironment: () => {}
      }

      const variable = {
        setValue: () => {}
      }

      const value = '123'
      const envName = '321'

      spyOn(domain, 'getEnvironmentByName').andReturn(null)
      spyOn(domain, 'createEnvironment').andReturn(432)
      spyOn(variable, 'setValue').andReturn(345)

      const expected = variable
      const actual = __internals__.updateEnvironmentVariableWithEnvironmentValue(
        domain, variable, value, envName
      )

      expect(domain.getEnvironmentByName).toHaveBeenCalled()
      expect(domain.createEnvironment).toHaveBeenCalled()
      expect(variable.setValue).toHaveBeenCalledWith(value, 432)
      expect(actual).toEqual(expected)
    })

    it('should work if env already exists', () => {
      const domain = {
        getEnvironmentByName: () => {},
        createEnvironment: () => {}
      }

      const variable = {
        setValue: () => {}
      }

      const value = '123'
      const envName = '321'

      spyOn(domain, 'getEnvironmentByName').andReturn(432)
      spyOn(domain, 'createEnvironment').andReturn(null)
      spyOn(variable, 'setValue').andReturn(345)

      const expected = variable
      const actual = __internals__.updateEnvironmentVariableWithEnvironmentValue(
        domain, variable, value, envName
      )

      expect(domain.getEnvironmentByName).toHaveBeenCalled()
      expect(domain.createEnvironment).toNotHaveBeenCalled()
      expect(variable.setValue).toHaveBeenCalledWith(value, 432)
      expect(actual).toEqual(expected)
    })
    /* eslint-enable max-statements */
  })

  describe('@convertVariableIntoEnvironmentVariable', () => {
    it('should work', () => {
      const domain = {
        createEnvironmentVariable: () => {}
      }

      const variable = new Variable({
        values: OrderedMap({
          a: 321,
          b: 123
        })
      })

      const key = 'pet_name'

      spyOn(domain, 'createEnvironmentVariable').andReturn(234)
      spyOn(__internals__, 'updateEnvironmentVariableWithEnvironmentValue').andReturn(432)

      const expected = 432
      const actual = __internals__.convertVariableIntoEnvironmentVariable(domain, variable, key)

      expect(__internals__.updateEnvironmentVariableWithEnvironmentValue.calls.length).toEqual(2)
      expect(actual).toEqual(expected)
    })
  })

  describe('@addVariablesToVariableDomain', () => {
    it('should work', () => {
      spyOn(__internals__, 'convertVariableIntoEnvironmentVariable').andReturn('test')
      const domain = {}

      const api = new Api({
        store: new Store({
          variable: OrderedMap({
            a: 123, b: 312
          })
        })
      })

      const expected = new Store({
        variable: OrderedMap({
          a: 'test', b: 'test'
        })
      })

      const actual = __internals__.addVariablesToVariableDomain(domain, api)

      expect(__internals__.convertVariableIntoEnvironmentVariable.calls.length).toEqual(2)
      expect(actual).toEqual(expected)
    })
  })

  describe('@createEnvironments', () => {
    /* eslint-disable max-statements */
    it('should work', () => {
      spyOn(__internals__, 'needsStandardEnvironmentDomain').andReturn(true)
      spyOn(__internals__, 'createStandardEnvironmentDomain').andReturn(123)
      spyOn(__internals__, 'addVariablesToStandardDomain').andReturn(new Store({
        constraint: 234
      }))

      spyOn(__internals__, 'needsVariableEnvironmentDomain').andReturn(true)
      spyOn(__internals__, 'createVariableEnvironmentDomain').andReturn(123)
      spyOn(__internals__, 'addVariablesToVariableDomain').andReturn(new Store({
        variable: 432
      }))

      const context = {}

      const api = new Api({
        store: new Store({
          constraint: OrderedMap({
            a: 123
          }),
          variable: OrderedMap({
            b: 321
          })
        })
      })

      const expected = new Store({
        constraint: 234,
        variable: 432
      })

      const actual = __internals__.createEnvironments(context, api)

      expect(actual).toEqual(expected)
    })
    /* eslint-enable max-statements */

    it('should work if api does not need env domains', () => {
      spyOn(__internals__, 'needsStandardEnvironmentDomain').andReturn(false)

      spyOn(__internals__, 'needsVariableEnvironmentDomain').andReturn(false)

      const context = {}

      const api = new Api({
        store: new Store({
          constraint: OrderedMap({
            a: 123
          }),
          variable: OrderedMap({
            b: 321
          })
        })
      })

      const expected = new Store()
      const actual = __internals__.createEnvironments(context, api)

      expect(actual).toEqual(expected)
    })
  })

  describe('@convertSequenceParameterIntoVariableDS', () => {
    it('should work', () => {
      const pawreq = {}

      spyOn(__internals__, 'convertParameterIntoVariableDS').andReturn(123)

      const param = new Parameter({
        superType: 'sequence',
        value: List([
          new Parameter({ type: 'string', default: '/path' }),
          new Parameter({
            type: 'string',
            constraints: List([ new Constraint.Enum([ 'simple', 'long' ]) ])
          }),
          new Parameter({ type: 'string', default: '/users' })
        ])
      })

      const expected = new DynamicString('/path', 123, '/users')
      const actual = __internals__.convertSequenceParameterIntoVariableDS(pawreq, param)

      expect(actual).toEqual(expected)
    })
  })

  describe('@convertParameterIntoVariableDS', () => {
    it('should call convertSequenceParameterIntoVariableDS if superType is sequence', () => {
      const pawReq = {}
      const param = new Parameter({ superType: 'sequence' })

      spyOn(__internals__, 'convertSequenceParameterIntoVariableDS').andReturn(123)

      const expected = 123
      const actual = __internals__.convertParameterIntoVariableDS(pawReq, param)

      expect(__internals__.convertSequenceParameterIntoVariableDS).toHaveBeenCalled()
      expect(actual).toEqual(expected)
    })

    /* eslint-disable max-statements */
    it('should create variable otherwise', () => {
      const pawReq = {
        addVariable: () => {}
      }

      const param = new Parameter({
        key: 'user',
        type: 'string',
        constraints: List([ new Constraint.JSONSchema({ pattern: '^.{16}$' }) ])
      })

      const variable = {
        createDynamicString: () => {}
      }

      spyOn(__internals__, 'getVariableArgumentsFromParameter').andReturn({
        name: 'user',
        value: 'somerandomstring',
        description: 'dummy desc'
      })

      spyOn(pawReq, 'addVariable').andReturn(variable)

      spyOn(variable, 'createDynamicString').andReturn(123)

      const expected = 123
      const actual = __internals__.convertParameterIntoVariableDS(pawReq, param)

      expect(__internals__.getVariableArgumentsFromParameter).toHaveBeenCalled()
      expect(pawReq.addVariable).toHaveBeenCalled()
      expect(variable.createDynamicString).toHaveBeenCalled()
      expect(actual).toEqual(expected)
    })
    /* eslint-enable max-statements */
  })

  describe('@convertPathnameIntoDynamicString', () => {
    it('should return a string if param is not a sequence', () => {
      const component = new URLComponent({
        componentName: 'pathname',
        string: '/paths',
        variableDelimiters: List([ '{{', '}}' ])
      })

      const pawReq = {}

      const expected = '/paths'
      const actual = __internals__.convertPathnameIntoDynamicString(pawReq, component)

      expect(actual).toEqual(expected)
    })

    it('should call convertSequenceParameterIntoVariableDS if superType is sequence', () => {
      spyOn(__internals__, 'convertSequenceParameterIntoVariableDS').andReturn(123)

      const component = new URLComponent({
        componentName: 'pathname',
        string: '/paths/{{pathId}}',
        variableDelimiters: List([ '{{', '}}' ])
      })

      const pawReq = {}

      const expected = 123
      const actual = __internals__.convertPathnameIntoDynamicString(pawReq, component)

      expect(actual).toEqual(expected)
    })
  })

  describe('@convertEndpointOrReferenceIntoDS', () => {
    it('should work is endpoint is reference', () => {
      const variable = {
        createDynamicString: () => {}
      }

      spyOn(variable, 'createDynamicString').andReturn(123)

      const store = new Store({
        endpoint: OrderedMap({
          a: variable
        })
      })

      const endpoint = new Reference({
        uuid: 'a'
      })

      const expected = 123
      const actual = __internals__.convertEndpointOrReferenceIntoDS(store, endpoint)

      expect(actual).toEqual(expected)
    })

    it('should work is endpoint is reference and variable does not exist', () => {
      const variable = {
        createDynamicString: () => {}
      }

      spyOn(variable, 'createDynamicString').andReturn(123)

      const store = new Store({
        endpoint: OrderedMap({
          b: variable
        })
      })

      const endpoint = new Reference({
        uuid: 'a'
      })

      const expected = null
      const actual = __internals__.convertEndpointOrReferenceIntoDS(store, endpoint)

      expect(actual).toEqual(expected)
    })

    it('should work is endpoint is url', () => {
      spyOn(__internals__, 'createEndpointDynamicString').andReturn(123)

      const store = new Store({
        endpoint: 321
      })

      const endpoint = new URL({
        url: 'https://echo.paw.cloud'
      })

      const expected = 123
      const actual = __internals__.convertEndpointOrReferenceIntoDS(store, endpoint)

      expect(actual).toEqual(expected)
    })
  })

  describe('@convertEndpointsDSArrayIntoVariableDV', () => {
    it('should return first item in endpoint array is array.length === 1', () => {
      const pawRequest = {}
      const endpoints = [ 123 ]
      const expected = 123
      const actual = __internals__.convertEndpointsDSArrayIntoVariableDV(pawRequest, endpoints)
      expect(actual).toEqual(expected)
    })

    it('should create variable otherwise', () => {
      const variable = {
        createDynamicValue: () => {}
      }
      spyOn(variable, 'createDynamicValue').andReturn(234)

      const pawRequest = {
        addVariable: () => {}
      }
      spyOn(pawRequest, 'addVariable').andReturn(variable)

      const endpoints = [ 123, 321 ]
      const expected = 234
      const actual = __internals__.convertEndpointsDSArrayIntoVariableDV(pawRequest, endpoints)
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertEndpointsAndPathnameIntoDS', () => {
    it('should work', () => {
      spyOn(__internals__, 'convertEndpointOrReferenceIntoDS').andReturn(234)
      spyOn(__internals__, 'convertEndpointsDSArrayIntoVariableDV').andReturn(432)
      spyOn(__internals__, 'convertPathnameIntoDynamicString').andReturn(345)

      const pawReq = {}
      const store = new Store()
      const endpoints = List([ 123, 321 ])
      const path = new URL({
        url: 'https://echo.paw.cloud'
      })

      const expected = new DynamicString(432, 345)
      const actual = __internals__.convertEndpointsAndPathnameIntoDS(pawReq, store, endpoints, path)

      expect(actual).toEqual(expected)
    })
  })

  describe('getDefaultValueFromParameter', () => {
    it('should work', () => {
      const param = new Parameter({
        default: 123
      })

      const expected = '123'
      const actual = __internals__.getDefaultValueFromParameter(param)

      expect(actual).toEqual(expected)
    })

    it('should work if defaultValue is string', () => {
      const param = new Parameter({
        default: '123'
      })

      const expected = '123'
      const actual = __internals__.getDefaultValueFromParameter(param)

      expect(actual).toEqual(expected)
    })

    it('should work if defaultValue is null', () => {
      const param = new Parameter({
        default: null
      })

      const expected = ''
      const actual = __internals__.getDefaultValueFromParameter(param)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getVariableArgumentsFromParameter', () => {
    it('should work', () => {
      spyOn(__internals__, 'getDefaultValueFromParameter').andReturn('123')
      const param = new Parameter({
        key: 'userId',
        description: 'some userid desc',
        default: 123
      })

      const expected = {
        name: 'userId',
        value: '123',
        description: 'some userid desc'
      }
      const actual = __internals__.getVariableArgumentsFromParameter(param)

      expect(actual).toEqual(expected)
    })

    it('should work if minimum info', () => {
      spyOn(__internals__, 'getDefaultValueFromParameter').andReturn('123')
      const param = new Parameter({
        default: 123
      })

      const expected = {
        name: '',
        value: '123',
        description: ''
      }
      const actual = __internals__.getVariableArgumentsFromParameter(param)

      expect(actual).toEqual(expected)
    })

    it('should work if description in schema', () => {
      spyOn(__internals__, 'getDefaultValueFromParameter').andReturn('123')
      const param = new Parameter({
        default: 123,
        constraints: List([ new Constraint.JSONSchema({ description: 'some desc' }) ])
      })

      const expected = {
        name: '',
        value: '123',
        description: 'some desc'
      }
      const actual = __internals__.getVariableArgumentsFromParameter(param)

      expect(actual).toEqual(expected)
    })
  })

  describe('@convertParameterFromReference', () => {
    it('should work', () => {
      spyOn(__internals__, 'getVariableArgumentsFromParameter').andReturn({
        name: 321,
        value: 345,
        description: 543
      })
      const variable = {
        createDynamicString: () => {}
      }
      spyOn(variable, 'createDynamicString').andReturn(123)

      const pawReq = {
        addVariable: () => {}
      }
      spyOn(pawReq, 'addVariable').andReturn(variable)

      const store = new Store({
        parameter: OrderedMap({
          a: {
            parameter: 234,
            variable: 432
          }
        })
      })

      const reference = new Reference({
        uuid: 'a'
      })

      const expected = { key: 321, value: 123 }
      const actual = __internals__.convertParameterFromReference(pawReq, store, reference)

      expect(actual).toEqual(expected)
    })

    it('should work if parameter is not found', () => {
      spyOn(__internals__, 'getVariableArgumentsFromParameter').andReturn({
        name: 321,
        value: 345,
        description: 543
      })
      const variable = {
        createDynamicString: () => {}
      }
      spyOn(variable, 'createDynamicString').andReturn(123)

      const pawReq = {
        addVariable: () => {}
      }
      spyOn(pawReq, 'addVariable').andReturn(variable)

      const store = new Store({
        parameter: OrderedMap({
          b: {
            parameter: 234,
            variable: 432
          }
        })
      })

      const reference = new Reference({
        uuid: 'a'
      })

      const expected = { key: '', value: '' }
      const actual = __internals__.convertParameterFromReference(pawReq, store, reference)

      expect(actual).toEqual(expected)
    })
  })

  describe('@convertReferenceOrParameterToDsEntry', () => {
    it('should call convertParameterFromReference if param is reference', () => {
      const pawReq = null
      const store = null
      const ref = new Reference()

      spyOn(__internals__, 'convertParameterFromReference').andReturn({ key: 123, value: 321 })

      const expected = { key: 123, value: 321 }
      const actual = __internals__.convertReferenceOrParameterToDsEntry(pawReq, store, ref)

      expect(actual).toEqual(expected)
    })

    it('should call convertParameterIntoVariableDS if param is Parameter', () => {
      const pawReq = null
      const store = null
      const ref = new Parameter({
        key: 123
      })

      spyOn(__internals__, 'convertParameterIntoVariableDS').andReturn(321)

      const expected = { key: 123, value: 321 }
      const actual = __internals__.convertReferenceOrParameterToDsEntry(pawReq, store, ref)

      expect(actual).toEqual(expected)
    })
  })

  describe('@addHeaderToRequest', () => {
    it('should work', () => {
      const pawReq = { addHeader: () => {} }
      spyOn(pawReq, 'addHeader').andReturn(123)

      const headerEntry = { key: 123, value: 321 }
      const expected = pawReq
      const actual = __internals__.addHeaderToRequest(pawReq, headerEntry)

      expect(pawReq.addHeader).toHaveBeenCalledWith(123, 321)
      expect(actual).toEqual(expected)
    })
  })

  describe('@addHeadersToRequest', () => {
    it('should work', () => {
      spyOn(__internals__, 'convertReferenceOrParameterToDsEntry').andReturn({ key: 12, value: 21 })
      spyOn(__internals__, 'addHeaderToRequest').andReturn(123)

      const pawReq = null
      const store = null
      const container = new ParameterContainer({
        headers: OrderedMap({
          a: 234,
          b: 432,
          c: 345
        })
      })

      const expected = 123
      const actual = __internals__.addHeadersToRequest(pawReq, store, container)

      expect(__internals__.convertReferenceOrParameterToDsEntry.calls.length).toEqual(3)
      expect(__internals__.addHeaderToRequest.calls.length).toEqual(3)
      expect(actual).toEqual(expected)
    })
  })

  describe('@addUrlParamToRequest', () => {
    it('should work', () => {
      const pawReq = { addUrlParameter: () => {} }
      spyOn(pawReq, 'addUrlParameter').andReturn(123)

      const headerEntry = { key: 123, value: 321 }
      const expected = pawReq
      const actual = __internals__.addUrlParamToRequest(pawReq, headerEntry)

      expect(pawReq.addUrlParameter).toHaveBeenCalledWith(123, 321)
      expect(actual).toEqual(expected)
    })
  })

  describe('@addUrlParamsToRequest', () => {
    it('should work', () => {
      spyOn(__internals__, 'convertReferenceOrParameterToDsEntry').andReturn({ key: 12, value: 21 })
      spyOn(__internals__, 'addUrlParamToRequest').andReturn(123)

      const pawReq = null
      const store = null
      const container = new ParameterContainer({
        queries: OrderedMap({
          a: 234,
          b: 432,
          c: 345
        })
      })

      const expected = 123
      const actual = __internals__.addUrlParamsToRequest(pawReq, store, container)

      expect(__internals__.convertReferenceOrParameterToDsEntry.calls.length).toEqual(3)
      expect(__internals__.addUrlParamToRequest.calls.length).toEqual(3)
      expect(actual).toEqual(expected)
    })
  })

  describe('@isParameterValidWithMultiPartContext', () => {
    it('should work', () => {
      const input = [
        new Parameter(),
        new Parameter({
          applicableContexts: List([
            new Parameter({
              key: 'Content-Type',
              constraints: List([
                new Constraint.Enum([ 'multipart/form-data' ])
              ])
            })
          ])
        }),
        new Parameter({
          applicableContexts: List([
            new Parameter({
              key: 'Accept',
              constraints: List([
                new Constraint.Enum([ 'multipart/form-data' ])
              ])
            })
          ])
        })
      ]

      const expected = [ true, true, false ]
      const actual = input.map(__internals__.isParameterValidWithMultiPartContext)

      expect(actual).toEqual(expected)
    })
  })

  describe('@isParameterValidWithUrlEncodedContext', () => {
    it('should work', () => {
      const input = [
        new Parameter(),
        new Parameter({
          applicableContexts: List([
            new Parameter({
              key: 'Content-Type',
              constraints: List([
                new Constraint.Enum([ 'application/x-www-form-urlencoded' ])
              ])
            })
          ])
        }),
        new Parameter({
          applicableContexts: List([
            new Parameter({
              key: 'Accept',
              constraints: List([
                new Constraint.Enum([ 'multipart/form-data' ])
              ])
            })
          ])
        })
      ]

      const expected = [ true, true, false ]
      const actual = input.map(__internals__.isParameterValidWithUrlEncodedContext)

      expect(actual).toEqual(expected)
    })
  })

  describe('@isBodyParameter', () => {
    it('should work', () => {
      const input = [
        new Parameter(),
        new Parameter({ in: 'body' }),
        new Parameter({
          in: 'body',
          applicableContexts: List([
            new Parameter({
              key: 'Content-Type',
              constraints: List([
                new Constraint.Enum([ 'application/json' ])
              ])
            })
          ])
        }),
        new Parameter({
          in: 'body',
          applicableContexts: List([
            new Parameter({
              key: 'Content-Type',
              constraints: List([
                new Constraint.Enum([ 'application/x-www-form-urlencoded' ])
              ])
            })
          ])
        }),
        new Parameter({
          in: 'body',
          applicableContexts: List([
            new Parameter({
              key: 'Content-Type',
              constraints: List([
                new Constraint.Enum([ 'multipart/form-data' ])
              ])
            })
          ])
        })
      ]

      const expected = [ false, true, true, false, false ]
      const actual = input.map(__internals__.isBodyParameter)

      expect(actual).toEqual(expected)
    })
  })

  describe('@setRawBody', () => {
    it('should work', () => {
      const pawReq = {}
      const params = List([
        new Parameter({ type: 'integer', constraints: List([ new Constraint.Enum([ 123 ]) ]) })
      ])

      const expected = {
        body: new DynamicString(
          new DynamicValue('com.luckymarmot.PawExtensions.JSONSchemaFakerDynamicValue', {
            schema: JSON.stringify({ enum: [ 123 ], type: 'integer' })
          })
        )
      }

      const actual = __internals__.setRawBody(pawReq, params)

      expect(actual).toEqual(expected)
    })
  })

  describe('@isContextWithUrlEncoded', () => {
    it('should work', () => {
      const input = [
        new Context({
          constraints: List([
            new Parameter({
              key: 'Content-Type',
              default: 'application/x-www-form-urlencoded'
            })
          ])
        }),
        new Context({
          constraints: List([
            new Parameter({
              key: 'Content-Type',
              default: 'multipart/form-data'
            })
          ])
        }),
        new Context({
          constraints: List([
            new Parameter({
              key: 'Content-Type',
              default: 'application/json'
            })
          ])
        })
      ]

      const expected = [ true, false, false ]
      const actual = input.map(__internals__.isContextWithUrlEncoded)

      expect(actual).toEqual(expected)
    })
  })

  describe('@isContextWithMultiPart', () => {
    it('should work', () => {
      const input = [
        new Context({
          constraints: List([
            new Parameter({
              key: 'Content-Type',
              default: 'application/x-www-form-urlencoded'
            })
          ])
        }),
        new Context({
          constraints: List([
            new Parameter({
              key: 'Content-Type',
              default: 'multipart/form-data'
            })
          ])
        }),
        new Context({
          constraints: List([
            new Parameter({
              key: 'Content-Type',
              default: 'application/json'
            })
          ])
        })
      ]

      const expected = [ false, true, false ]
      const actual = input.map(__internals__.isContextWithMultiPart)

      expect(actual).toEqual(expected)
    })
  })

  describe('@addEntryToRecordParameterArray', () => {
    it('should work', () => {
      const kvList = [ 123 ]
      const entry = { key: 234, value: 345 }
      const expected = [ 123, new RecordParameter(234, 345, true) ]
      const actual = __internals__.addEntryToRecordParameterArray(kvList, entry)

      expect(actual).toEqual(expected)
    })
  })

  describe('@setFormDataBody', () => {
    /* eslint-disable max-statements */
    it('should work with urlEncoded', () => {
      const pawReq = {}
      const store = new Store()
      const params = [ 123, 321, 234, 432 ]
      const context = new Context()

      spyOn(__internals__, 'convertReferenceOrParameterToDsEntry').andReturn(123)
      spyOn(__internals__, 'addEntryToRecordParameterArray').andReturn([ 123, 234, 345, 456, 567 ])

      spyOn(__internals__, 'isContextWithUrlEncoded').andReturn(true)
      spyOn(__internals__, 'isContextWithMultiPart').andReturn(false)

      spyOn(__internals__, 'createUrlEncodedBodyDV').andReturn(678)
      spyOn(__internals__, 'wrapDV').andReturn('test')

      const expected = {
        body: 'test'
      }

      const actual = __internals__.setFormDataBody(pawReq, store, params, context)

      expect(__internals__.convertReferenceOrParameterToDsEntry.calls.length).toEqual(4)
      expect(__internals__.addEntryToRecordParameterArray.calls.length).toEqual(4)
      expect(__internals__.isContextWithUrlEncoded).toHaveBeenCalled()
      expect(__internals__.isContextWithMultiPart).toHaveBeenCalled()
      expect(__internals__.createUrlEncodedBodyDV).toHaveBeenCalled()
      expect(__internals__.wrapDV).toHaveBeenCalled()
      expect(actual).toEqual(expected)
    })

    it('should work with multipart', () => {
      const pawReq = {}
      const store = new Store()
      const params = [ 123, 321, 234, 432 ]
      const context = new Context()

      spyOn(__internals__, 'convertReferenceOrParameterToDsEntry').andReturn(123)
      spyOn(__internals__, 'addEntryToRecordParameterArray').andReturn([ 123, 234, 345, 456, 567 ])

      spyOn(__internals__, 'isContextWithUrlEncoded').andReturn(false)
      spyOn(__internals__, 'isContextWithMultiPart').andReturn(true)

      spyOn(__internals__, 'createMultipartBodyDV').andReturn(678)
      spyOn(__internals__, 'wrapDV').andReturn('test')

      const expected = {
        body: 'test'
      }

      const actual = __internals__.setFormDataBody(pawReq, store, params, context)

      expect(__internals__.convertReferenceOrParameterToDsEntry.calls.length).toEqual(4)
      expect(__internals__.addEntryToRecordParameterArray.calls.length).toEqual(4)
      expect(__internals__.isContextWithUrlEncoded).toHaveBeenCalled()
      expect(__internals__.isContextWithMultiPart).toHaveBeenCalled()
      expect(__internals__.createMultipartBodyDV).toHaveBeenCalled()
      expect(__internals__.wrapDV).toHaveBeenCalled()
      expect(actual).toEqual(expected)
    })

    it('should work with no valid content type', () => {
      const pawReq = {}
      const store = new Store()
      const params = [ 123, 321, 234, 432 ]
      const context = new Context()

      spyOn(__internals__, 'convertReferenceOrParameterToDsEntry').andReturn(123)
      spyOn(__internals__, 'addEntryToRecordParameterArray').andReturn([ 123, 234, 345, 456, 567 ])

      spyOn(__internals__, 'isContextWithUrlEncoded').andReturn(false)
      spyOn(__internals__, 'isContextWithMultiPart').andReturn(false)

      spyOn(__internals__, 'wrapDV').andReturn('test')

      const expected = {
        body: 'test'
      }

      const actual = __internals__.setFormDataBody(pawReq, store, params, context)

      expect(__internals__.convertReferenceOrParameterToDsEntry.calls.length).toEqual(4)
      expect(__internals__.addEntryToRecordParameterArray.calls.length).toEqual(4)
      expect(__internals__.isContextWithUrlEncoded).toHaveBeenCalled()
      expect(__internals__.isContextWithMultiPart).toHaveBeenCalled()
      expect(__internals__.wrapDV).toHaveBeenCalled()
      expect(actual).toEqual(expected)
    })
    /* eslint-enable max-statements */
  })

  describe('@addBodyToRequest', () => {
    it('should work with raw body params', () => {
      const pawReq = {}
      const store = new Store()
      const container = new ParameterContainer({
        body: OrderedMap({
          a: 123,
          b: 321
        })
      })
      const context = new Context()

      spyOn(__internals__, 'isBodyParameter').andReturn(true)
      spyOn(__internals__, 'setRawBody').andReturn(123)

      const expected = 123
      const actual = __internals__.addBodyToRequest(pawReq, store, container, context)

      expect(__internals__.setRawBody).toHaveBeenCalled()
      expect(actual).toEqual(expected)
    })

    it('should work with formdata body params', () => {
      const pawReq = {}
      const store = new Store()
      const container = new ParameterContainer({
        body: OrderedMap({
          a: 123,
          b: 321
        })
      })
      const context = new Context()

      spyOn(__internals__, 'isBodyParameter').andReturn(false)
      spyOn(__internals__, 'setFormDataBody').andReturn(123)

      const expected = 123
      const actual = __internals__.addBodyToRequest(pawReq, store, container, context)

      expect(__internals__.setFormDataBody).toHaveBeenCalled()
      expect(actual).toEqual(expected)
    })

    it('should work with formdata body params and no context', () => {
      const pawReq = {}
      const store = new Store()
      const container = new ParameterContainer({
        body: OrderedMap({
          a: 123,
          b: 321
        })
      })
      const context = null

      spyOn(__internals__, 'isBodyParameter').andReturn(false)
      spyOn(__internals__, 'setFormDataBody').andReturn(123)

      const expected = pawReq
      const actual = __internals__.addBodyToRequest(pawReq, store, container, context)

      expect(__internals__.setFormDataBody).toNotHaveBeenCalled()
      expect(actual).toEqual(expected)
    })

    it('should work with no formdata body params and context', () => {
      const pawReq = {}
      const store = new Store()
      const container = new ParameterContainer({
        body: OrderedMap()
      })
      const context = new Context()

      spyOn(__internals__, 'isBodyParameter').andReturn(false)
      spyOn(__internals__, 'setFormDataBody').andReturn(123)

      const expected = pawReq
      const actual = __internals__.addBodyToRequest(pawReq, store, container, context)

      expect(__internals__.setFormDataBody).toNotHaveBeenCalled()
      expect(actual).toEqual(expected)
    })
  })

  describe('@getContainerFromRequest', () => {
    it('should work with no context in request', () => {
      const request = new Request({
        parameters: new ParameterContainer({
          headers: OrderedMap({ a: 123, b: 321 })
        })
      })

      const expected = {
        container: new ParameterContainer({
          headers: OrderedMap({ a: 123, b: 321 })
        })
      }

      const actual = __internals__.getContainerFromRequest(request)

      expect(actual).toEqual(expected)
    })

    it('should work with context in request', () => {
      const request = new Request({
        parameters: new ParameterContainer({
          headers: OrderedMap({
            a: new Parameter({
              key: 'a',
              applicableContexts: List([
                new Parameter({
                  key: 'a',
                  constraints: List([ new Constraint.Enum([ 123, 321 ]) ])
                })
              ])
            }),
            b: new Parameter({
              key: 'a',
              applicableContexts: List([
                new Parameter({
                  key: 'a',
                  constraints: List([ new Constraint.Enum([ 234, 432 ]) ])
                })
              ])
            })
          })
        }),
        contexts: List([
          new Context({
            constraints: List([
              new Parameter({
                key: 'a',
                default: 123
              })
            ])
          })
        ])
      })

      const expected = {
        container: new ParameterContainer({
          headers: OrderedMap({
            a: new Parameter({
              key: 'a',
              applicableContexts: List([
                new Parameter({
                  key: 'a',
                  constraints: List([ new Constraint.Enum([ 123, 321 ]) ])
                })
              ])
            })
          })
        }),
        requestContext: new Context({
          constraints: List([
            new Parameter({
              key: 'a',
              default: 123
            })
          ])
        })
      }

      const actual = __internals__.getContainerFromRequest(request)

      expect(actual).toEqual(expected)
    })
  })

  describe('@convertAuthFromReference', () => {
    it('should work', () => {
      const variable = { createDynamicString: () => {} }
      spyOn(variable, 'createDynamicString').andReturn(123)

      const store = new Store({
        auth: OrderedMap({ a: { variable: variable, auth: 'my-auth' } })
      })

      const ref = new Reference({ uuid: 'a' })

      const expected = { auth: 'my-auth', variable: 123 }
      const actual = __internals__.convertAuthFromReference(store, ref)

      expect(actual).toEqual(expected)
    })
  })

  describe('@convertReferenceOrAuthToDsEntry', () => {
    it('should work with reference', () => {
      spyOn(__internals__, 'convertAuthFromReference').andReturn(123)
      const store = new Store()
      const ref = new Reference()

      const expected = 123
      const actual = __internals__.convertReferenceOrAuthToDsEntry(store, ref)

      expect(actual).toEqual(expected)
    })

    it('should work with auth', () => {
      spyOn(__internals__, 'convertAuthIntoDynamicValue').andReturn(123)
      spyOn(__internals__, 'wrapDV').andReturn('123')
      const store = new Store()
      const auth = new Auth.Basic()

      const expected = { variable: '123', auth }
      const actual = __internals__.convertReferenceOrAuthToDsEntry(store, auth)

      expect(actual).toEqual(expected)
    })
  })

  describe('@addAuthToRequest', () => {
    it('should work', () => {
      const pawReq = { setHeader: () => {} }
      spyOn(pawReq, 'setHeader').andReturn(123)
      const authData = { variable: 'some dynamic string', auth: new Auth.Basic() }

      const expected = pawReq
      const actual = __internals__.addAuthToRequest(pawReq, authData)

      expect(pawReq.setHeader).toHaveBeenCalledWith('Authorization', authData.variable)
      expect(actual).toEqual(expected)
    })

    it('should work with ApiKeys custom headers', () => {
      const pawReq = { setHeader: () => {} }
      spyOn(pawReq, 'setHeader').andReturn(123)
      const authData = {
        variable: 'some dynamic string',
        auth: new Auth.ApiKey({ name: 'X-Auth-Token' })
      }

      const expected = pawReq
      const actual = __internals__.addAuthToRequest(pawReq, authData)

      expect(pawReq.setHeader).toHaveBeenCalledWith('X-Auth-Token', authData.variable)
      expect(actual).toEqual(expected)
    })
  })

  describe('@addAuthsToRequest', () => {
    it('should work', () => {
      const pawReq = {}
      const store = new Store()
      const request = new Request({ auths: List([ 1, 2, 3, 4 ]) })

      spyOn(__internals__, 'convertReferenceOrAuthToDsEntry').andReturn(123)
      spyOn(__internals__, 'addAuthToRequest').andReturn(234)

      const expected = 234
      const actual = __internals__.addAuthsToRequest(pawReq, store, request)

      expect(__internals__.convertReferenceOrAuthToDsEntry.calls.length).toEqual(4)
      expect(__internals__.addAuthToRequest.calls.length).toEqual(4)
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertRequestIntoPawRequest', () => {
    /* eslint-disable max-statements */
    it('should work', () => {
      const context = {
        createRequest: () => {}
      }
      spyOn(context, 'createRequest').andReturn({})
      spyOn(__internals__, 'convertEndpointsAndPathnameIntoDS').andReturn(123)
      spyOn(__internals__, 'getContainerFromRequest').andReturn({ container: 1, requestContext: 2 })
      spyOn(__internals__, 'addHeadersToRequest').andReturn(345)
      spyOn(__internals__, 'addUrlParamsToRequest').andReturn(456)
      spyOn(__internals__, 'addBodyToRequest').andReturn(567)
      spyOn(__internals__, 'addAuthsToRequest').andReturn(678)

      const store = new Store()
      const path = new URL({
        url: '/paths/simple'
      })
      const request = new Request()

      const expected = {
        url: 123
      }

      const actual = __internals__.convertRequestIntoPawRequest(context, store, path, request)

      expect(__internals__.convertEndpointsAndPathnameIntoDS).toHaveBeenCalled()
      expect(__internals__.getContainerFromRequest).toHaveBeenCalled()
      expect(__internals__.addHeadersToRequest).toHaveBeenCalled()
      expect(__internals__.addUrlParamsToRequest).toHaveBeenCalled()
      expect(__internals__.addBodyToRequest).toHaveBeenCalled()
      expect(__internals__.addAuthsToRequest).toHaveBeenCalled()
      expect(actual).toEqual(expected)
    })
    /* eslint-enable max-statements */
  })

  describe('@convertResourceIntoGroup', () => {
    /* eslint-disable max-statements */
    it('should work', () => {
      const context = { createRequestGroup: () => {} }
      const group = { appendChild: () => {} }

      spyOn(__internals__, 'convertRequestIntoPawRequest').andReturn(123)
      spyOn(context, 'createRequestGroup').andReturn(group)
      spyOn(group, 'appendChild').andReturn(123)

      const store = new Store()
      const resource = new Resource({
        path: new URL({ url: '/paths/simple' }),
        methods: OrderedMap({
          get: 123,
          post: 321,
          put: 234
        })
      })

      const expected = group
      const actual = __internals__.convertResourceIntoGroup(context, store, resource)

      expect(context.createRequestGroup).toHaveBeenCalled()
      expect(__internals__.convertRequestIntoPawRequest.calls.length).toEqual(3)
      expect(group.appendChild.calls.length).toEqual(3)
      expect(actual).toEqual(expected)
    })
    /* eslint-enable max-statements */
  })

  describe('@createRequests', () => {
    it('should work', () => {
      const context = {}
      const store = new Store()
      const api = new Api({ resources: OrderedMap({ a: 1, b: 2, c: 3 }) })

      spyOn(__internals__, 'convertResourceIntoGroup').andReturn(123)

      const expected = OrderedMap({ a: 123, b: 123, c: 123 })
      const actual = __internals__.createRequests(context, store, api)

      expect(__internals__.convertResourceIntoGroup.calls.length).toEqual(3)
      expect(actual).toEqual(expected)
    })
  })

  describe('@createPawGroupFromGroup', () => {
    it('should work', () => {
      spyOn(__internals__, 'createGroups').andCall((_, __, v) => {
        return v % 2 ? v : null
      })
      const children = []
      const inputs = [
        [ {}, {}, new Group(), 'abc' ],
        [ {}, {}, new Group({ name: 'def', children: OrderedMap({ a: 123, b: 234 }) }), 'abc' ],
        [ {
          createRequestGroup: (name) => {
            return {
              name, children, appendChild: (v) => children.push(v)
            }
          }
        }, {}, new Group({ name: 'def', children: OrderedMap({ a: 123, b: 234, c: 345 }) }) ]
      ]

      const expected = [
        null,
        123,
        { name: 'def', children: [ 123, 345 ], appendChild: (v) => children.push(v) }
      ]

      const actual = inputs.map(input => __internals__.createPawGroupFromGroup(...input))
      expect(JSON.stringify(actual)).toEqual(JSON.stringify(expected))
    })
  })

  describe('@createGroups', () => {
    it('should work', () => {
      spyOn(__internals__, 'createPawGroupFromGroup').andCall((c, r, g, gn) => {
        return gn
      })

      const inputs = [
        [ {}, OrderedMap(), null, 'abc' ],
        [ {}, OrderedMap(), 'some weird group', 'abc' ],
        [ {}, OrderedMap(), new Group(), 'abc' ]
      ]
      const expected = [
        null, null, 'abc'
      ]

      const actual = inputs.map(input => __internals__.createGroups(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@serialize', () => {
    it('should work', () => {
      spyOn(__internals__, 'createEnvironments').andReturn(123)
      spyOn(__internals__, 'createRequests').andReturn(321)
      spyOn(__internals__, 'createGroups').andReturn(123)
      spyOn(__internals__, 'getTitleFromApi').andReturn('someTitle')

      const context = {}
      const api = new Api()
      __internals__.serialize({ options: { context }, api })

      expect(__internals__.createEnvironments).toHaveBeenCalledWith(context, api)
      expect(__internals__.createRequests).toHaveBeenCalledWith(context, 123, api)
      expect(__internals__.createGroups).toHaveBeenCalledWith(context, 321, null, 'someTitle')
    })

    it('should work with minimum info', () => {
      const expected = true
      const actual = __internals__.serialize()

      expect(actual).toEqual(expected)
    })
  })
})
