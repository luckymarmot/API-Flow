/* eslint-disable max-nested-callbacks */
import { OrderedMap, List } from 'immutable'
import expect, { spyOn, restoreSpies } from 'expect'

import Info from '../../../../models/Info'
import Constraint from '../../../../models/Constraint'
import Group from '../../../../models/Group'
import Parameter from '../../../../models/Parameter'
import ParameterContainer from '../../../../models/ParameterContainer'
import Auth from '../../../../models/Auth'
import Store from '../../../../models/Store'
import URL from '../../../../models/URL'
import Reference from '../../../../models/Reference'
import Request from '../../../../models/Request'
import Resource from '../../../../models/Resource'
import Api from '../../../../models/Api'

import Parser, { __internals__ } from '../Parser'

describe('parsers/postman/v2.0/Parser.js', () => {
  afterEach(() => restoreSpies())
  describe('{ Parser }', () => {
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

        const content = 'some content'
        const actual = Parser.detect(content)

        expect(__internals__.detect).toHaveBeenCalledWith(content)
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

        const content = 'some content'
        const actual = Parser.getAPIName(content)

        expect(__internals__.getAPIName).toHaveBeenCalledWith(content)
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

        const options = { context: 123, items: 321, options: 234 }
        const actual = Parser.parse({ options })

        expect(__internals__.parse).toHaveBeenCalledWith({ options })
        expect(actual).toEqual(expected)
      })
    })
  })

  describe('@detect', () => {
    it('should work', () => {
      const inputs = [
        'some weird content',
        JSON.stringify({}),
        JSON.stringify({ info: 123 }),
        JSON.stringify({ item: 234 }),
        JSON.stringify({ info: 123, item: 234 }),
        JSON.stringify({ info: { name: 345 }, item: 234 }),
        JSON.stringify({ info: { schema: 456 }, item: 234 }),
        JSON.stringify({ info: { name: 345, schema: 456 }, item: 234 })
      ]
      const expected = [
        [ {
          format: 'postman-collection',
          version: 'v2.0',
          score: 0
        } ],
        [ {
          format: 'postman-collection',
          version: 'v2.0',
          score: 0
        } ],
        [ {
          format: 'postman-collection',
          version: 'v2.0',
          score: 0
        } ],
        [ {
          format: 'postman-collection',
          version: 'v2.0',
          score: 0
        } ],
        [ {
          format: 'postman-collection',
          version: 'v2.0',
          score: 0
        } ],
        [ {
          format: 'postman-collection',
          version: 'v2.0',
          score: 0
        } ],
        [ {
          format: 'postman-collection',
          version: 'v2.0',
          score: 0
        } ],
        [ {
          format: 'postman-collection',
          version: 'v2.0',
          score: 1
        } ]
      ]
      const actual = inputs.map(input => __internals__.detect(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@getAPIName', () => {
    it('should work', () => {
      const inputs = [
        'some weird content',
        JSON.stringify({}),
        JSON.stringify({ info: 123 }),
        JSON.stringify({ item: 234 }),
        JSON.stringify({ info: 123, item: 234 }),
        JSON.stringify({ info: { name: 345 }, item: 234 }),
        JSON.stringify({ info: { schema: 456 }, item: 234 }),
        JSON.stringify({ info: { name: 345, schema: 456 }, item: 234 })
      ]
      const expected = [
        null, null, null, null, null, null, null,
        345
      ]
      const actual = inputs.map(input => __internals__.getAPIName(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractInfoTitle', () => {
    it('should work', () => {
      const inputs = [
        {},
        { info: {} },
        { info: { name: 123 } }
      ]
      const expected = [
        null, null, { key: 'title', value: 123 }
      ]
      const actual = inputs.map(input => __internals__.extractInfoTitle(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractInfoDescriptionFromDescriptionString', () => {
    it('should work', () => {
      const inputs = [
        'abcd'
      ]
      const expected = [
        { key: 'description', value: 'abcd' }
      ]
      const actual = inputs.map(
        input => __internals__.extractInfoDescriptionFromDescriptionString(input)
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractInfoDescriptionFromDescriptionObject', () => {
    it('should work', () => {
      const inputs = [
        {},
        { content: 123 }
      ]
      const expected = [
        null, { key: 'description', value: 123 }
      ]
      const actual = inputs.map(
        input => __internals__.extractInfoDescriptionFromDescriptionObject(input)
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractInfoDescription', () => {
    it('should work', () => {
      const inputs = [
        {},
        { info: {} },
        { info: { description: 'abc' } },
        { info: { description: { content: 123 } } }
      ]
      const expected = [
        null,
        null,
        { key: 'description', value: 'abc' },
        { key: 'description', value: 123 }
      ]
      const actual = inputs.map(input => __internals__.extractInfoDescription(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractInfoTermsOfService', () => {
    it('should work', () => {
      const inputs = [
        'whatever'
      ]
      const expected = [
        null
      ]
      const actual = inputs.map(input => __internals__.extractInfoTermsOfService(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractInfoContact', () => {
    it('should work', () => {
      const inputs = [
        'whatever'
      ]
      const expected = [
        null
      ]
      const actual = inputs.map(input => __internals__.extractInfoContact(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractInfoLicense', () => {
    it('should work', () => {
      const inputs = [
        'whatever'
      ]
      const expected = [
        null
      ]
      const actual = inputs.map(input => __internals__.extractInfoLicense(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractInfoVersionFromVersionString', () => {
    it('should work', () => {
      const inputs = [
        'v1.0.0'
      ]
      const expected = [
        { key: 'version', value: 'v1.0.0' }
      ]
      const actual = inputs.map(input => __internals__.extractInfoVersionFromVersionString(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractInfoVersionFromVersionObject', () => {
    it('should work', () => {
      const inputs = [
        {},
        { major: '1', minor: '2' },
        { major: '1', patch: '3' },
        { minor: '2', patch: '3' },
        { major: '1', minor: '2', patch: '3' }
      ]
      const expected = [
        null,
        { key: 'version', value: '1.2.0' },
        { key: 'version', value: '1.0.3' },
        { key: 'version', value: '0.2.3' },
        { key: 'version', value: '1.2.3' }
      ]
      const actual = inputs.map(input => __internals__.extractInfoVersionFromVersionObject(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractInfoVersion', () => {
    it('should work', () => {
      const inputs = [
        {},
        { info: {} },
        { info: { version: '1.2.3' } },
        { info: { version: { major: '2', minor: '4', patch: '6' } } }
      ]
      const expected = [
        null, null,
        { key: 'version', value: '1.2.3' },
        { key: 'version', value: '2.4.6' }
      ]
      const actual = inputs.map(input => __internals__.extractInfoVersion(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractInfoInstance', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractInfoTitle').andCall(({ t }) => ({ key: 'title', value: t }))
      spyOn(__internals__, 'extractInfoDescription')
        .andCall(({ d }) => ({ key: 'description', value: d }))
      spyOn(__internals__, 'extractInfoTermsOfService')
        .andCall(({ o }) => ({ key: 'tos', value: o }))
      spyOn(__internals__, 'extractInfoContact')
        .andCall(({ c }) => ({ key: 'contact', value: c }))
      spyOn(__internals__, 'extractInfoLicense').andCall(({ l }) => ({ key: 'license', value: l }))
      spyOn(__internals__, 'extractInfoVersion').andCall(({ v }) => ({ key: 'version', value: v }))

      const inputs = [
        { t: 1, d: 2, o: 3, c: 4, l: 5, v: 6 }
      ]
      const expected = [
        { title: 1, description: 2, tos: 3, contact: 4, license: 5, version: 6 }
      ]
      const actual = inputs.map(input => __internals__.extractInfoInstance(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractInfo', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractInfoInstance').andCall(v => v)

      const inputs = [
        { title: 123 }
      ]
      const expected = [
        { key: 'info', value: new Info({ title: 123 }) }
      ]
      const actual = inputs.map(input => __internals__.extractInfo(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractGroupId', () => {
    it('should work', () => {
      const inputs = [
        'whatever'
      ]
      const expected = [
        null
      ]
      const actual = inputs.map(input => __internals__.extractGroupId(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractGroupName', () => {
    it('should work', () => {
      const inputs = [
        null,
        {},
        { name: 123 }
      ]
      const expected = [
        null, null,
        { key: 'name', value: 123 }
      ]
      const actual = inputs.map(input => __internals__.extractGroupName(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractGroupDescription', () => {
    it('should work', () => {
      const inputs = [
        null,
        {},
        { description: 123 }
      ]
      const expected = [
        null, null, { key: 'description', value: 123 }
      ]
      const actual = inputs.map(input => __internals__.extractGroupDescription(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@isItem', () => {
    it('should work', () => {
      const inputs = [
        null,
        {},
        { request: 123 }
      ]
      const expected = [
        false, false, true
      ]
      const actual = inputs.map(input => __internals__.isItem(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractGroupResourceChildren', () => {
    it('should work', () => {
      const inputs = [
        {},
        { id: 123 },
        { name: 234 },
        { id: 123, name: 234 }
      ]
      const expected = [
        { key: null, value: null },
        { key: 123, value: 123 },
        { key: 234, value: 234 },
        { key: 123, value: 123 }
      ]
      const actual = inputs.map(input => __internals__.extractGroupResourceChildren(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractGroupChildrenEntry', () => {
    it('should work', () => {
      spyOn(__internals__, 'isItem').andCall(({ r }) => !!r)
      spyOn(__internals__, 'extractGroupResourceChildren').andCall(({ r }) => r)
      spyOn(__internals__, 'extractGroup').andCall(({ g }) => g)

      const inputs = [
        { g: 123 },
        { r: 234 }
      ]
      const expected = [
        123,
        234
      ]
      const actual = inputs.map(input => __internals__.extractGroupChildrenEntry(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractGroupChildren', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractGroupChildrenEntry').andCall(v => {
        if (v % 2) {
          return { key: v, value: v }
        }

        return null
      })

      const inputs = [
        {},
        { item: 123 },
        { item: [ 123, 234, 345 ] },
        { item: [ 234 ] }
      ]
      const expected = [
        null, null,
        { key: 'children', value: OrderedMap({ '123': 123, '345': 345 }) },
        null
      ]
      const actual = inputs.map(input => __internals__.extractGroupChildren(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractGroupInstance', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractGroupId')
        .andCall(({ i }) => i ? { key: 'id', value: i } : null)
      spyOn(__internals__, 'extractGroupName')
        .andCall(({ n }) => n ? { key: 'name', value: n } : null)
      spyOn(__internals__, 'extractGroupDescription')
        .andCall(({ d }) => d ? { key: 'description', value: d } : null)
      spyOn(__internals__, 'extractGroupChildren')
        .andCall(({ c }) => c ? { key: 'children', value: c } : null)

      const inputs = [
        {},
        { i: 123, n: 234, d: 345, c: 456 }
      ]
      const expected = [
        {},
        { id: 123, name: 234, description: 345, children: 456 }
      ]
      const actual = inputs.map(input => __internals__.extractGroupInstance(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractGroup', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractGroupInstance').andReturn({ id: 123 })

      const inputs = [
        {},
        { name: 234 }
      ]
      const expected = [
        { key: 'group', value: new Group({ id: 123 }) },
        { key: 234, value: new Group({ id: 123 }) }
      ]
      const actual = inputs.map(input => __internals__.extractGroup(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractParameterInstanceFromVariable', () => {
    it('should work', () => {
      const inputs = [
        {},
        { type: 'weird' },
        { type: 'integer', id: 123, name: 234, value: 345 },
        { type: 'integer', name: 234, value: 345 }
      ]
      const expected = [
        { key: null, name: null, type: 'string', default: null },
        { key: null, name: null, type: 'string', default: null },
        { key: 123, name: 234, type: 'integer', default: 345 },
        { key: 234, name: 234, type: 'integer', default: 345 }
      ]
      const actual = inputs.map(input => __internals__.extractParameterInstanceFromVariable(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractParameterEntryFromVariable', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractParameterInstanceFromVariable').andReturn({ key: 345 })

      const inputs = [
        {},
        { id: 123 },
        { name: 234 },
        { id: 123, name: 234 }
      ]
      const expected = [
        { key: null, value: new Parameter({ key: 345 }) },
        { key: 123, value: new Parameter({ key: 345 }) },
        { key: 234, value: new Parameter({ key: 345 }) },
        { key: 123, value: new Parameter({ key: 345 }) }
      ]
      const actual = inputs.map(input => __internals__.extractParameterEntryFromVariable(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractParameterTypedStore', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractParameterEntryFromVariable').andCall(v => ({ key: v, value: v }))

      const inputs = [
        null,
        {},
        { variable: 123 },
        { variable: [ 123, 234, 345 ] }
      ]
      const expected = [
        null, null, null,
        { key: 'parameter', value: OrderedMap({ '123': 123, '234': 234, '345': 345 }) }
      ]
      const actual = inputs.map(input => __internals__.extractParameterTypedStore(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractEndpointTypedStore', () => {
    it('should work', () => {
      const inputs = [
        [],
        [ { key: 123, value: 234 }, { key: 345, value: 456 } ]
      ]
      const expected = [
        { key: 'endpoint', value: OrderedMap() },
        { key: 'endpoint', value: OrderedMap({ '123': 234, '345': 456 }) }
      ]
      const actual = inputs.map(input => __internals__.extractEndpointTypedStore(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractAWSSig4AuthFromAuth', () => {
    it('should work', () => {
      const inputs = [
        { type: 'awsv4' },
        { type: 'awsv4', awsv4: {} },
        { type: 'awsv4', awsv4: {
          accessKey: 123, secretKey: 234, region: 345, service: 456
        } }
      ]
      const expected = [
        { key: 'awsv4', value: new Auth.AWSSig4({ authName: 'awsv4' }) },
        { key: 'awsv4', value: new Auth.AWSSig4({ authName: 'awsv4' }) },
        { key: 'awsv4', value: new Auth.AWSSig4({
          authName: 'awsv4',
          key: 123,
          secret: 234,
          region: 345,
          service: 456
        }) }
      ]
      const actual = inputs.map(input => __internals__.extractAWSSig4AuthFromAuth(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractBasicAuthFromAuth', () => {
    it('should work', () => {
      const inputs = [
        { type: 'basic' },
        { type: 'basic', basic: { username: 123, password: 234 } }
      ]
      const expected = [
        { key: 'basic', value: new Auth.Basic({ authName: 'basic' }) },
        { key: 'basic', value: new Auth.Basic({
          authName: 'basic',
          username: 123,
          password: 234
        }) }
      ]
      const actual = inputs.map(input => __internals__.extractBasicAuthFromAuth(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractDigestAuthFromAuth', () => {
    it('should work', () => {
      const inputs = [
        { type: 'digest' },
        { type: 'digest', digest: { username: 123, password: 234 } }
      ]
      const expected = [
        { key: 'digest', value: new Auth.Digest({ authName: 'digest' }) },
        { key: 'digest', value: new Auth.Digest({
          authName: 'digest',
          username: 123,
          password: 234
        }) }
      ]
      const actual = inputs.map(input => __internals__.extractDigestAuthFromAuth(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractHawkAuthFromAuth', () => {
    it('should work', () => {
      const inputs = [
        { type: 'hawk' },
        { type: 'hawk', hawk: { authId: 123, authKey: 234, algorithm: 345 } }
      ]
      const expected = [
        { key: 'hawk', value: new Auth.Hawk({ authName: 'hawk' }) },
        { key: 'hawk', value: new Auth.Hawk({
          authName: 'hawk',
          id: 123,
          key: 234,
          algorithm: 345
        }) }
      ]
      const actual = inputs.map(input => __internals__.extractHawkAuthFromAuth(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractOAuth1AuthFromAuth', () => {
    it('should work', () => {
      const inputs = [
        { type: 'oauth1' },
        { type: 'oauth1', oauth1: {
          consumerSecret: 123,
          consumerKey: 234,
          token: 345,
          tokenSecret: 456
        } }
      ]
      const expected = [
        { key: 'oauth1', value: new Auth.OAuth1({ authName: 'oauth1' }) },
        { key: 'oauth1', value: new Auth.OAuth1({
          authName: 'oauth1',
          consumerSecret: 123,
          consumerKey: 234,
          token: 345,
          tokenSecret: 456
        }) }
      ]
      const actual = inputs.map(input => __internals__.extractOAuth1AuthFromAuth(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractOAuth2AuthFromAuth', () => {
    it('should work', () => {
      const inputs = [
        { type: 'oauth2' },
        { type: 'oauth2', oauth2: {
          authUrl: 123,
          accessTokenUrl: 234
        } }
      ]
      const expected = [
        { key: 'oauth2', value: new Auth.OAuth2({ authName: 'oauth2' }) },
        { key: 'oauth2', value: new Auth.OAuth2({
          authName: 'oauth2',
          authorizationUrl: 123,
          tokenUrl: 234
        }) }
      ]
      const actual = inputs.map(input => __internals__.extractOAuth2AuthFromAuth(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractAuthFromPostmanAuth', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractAWSSig4AuthFromAuth').andReturn(123)
      spyOn(__internals__, 'extractBasicAuthFromAuth').andReturn(234)
      spyOn(__internals__, 'extractDigestAuthFromAuth').andReturn(345)
      spyOn(__internals__, 'extractHawkAuthFromAuth').andReturn(456)
      spyOn(__internals__, 'extractOAuth1AuthFromAuth').andReturn(567)
      spyOn(__internals__, 'extractOAuth2AuthFromAuth').andReturn(678)

      const inputs = [
        { type: 'awsv4' },
        { type: 'basic' },
        { type: 'digest' },
        { type: 'hawk' },
        { type: 'noauth' },
        { type: 'oauth1' },
        { type: 'oauth2' },
        { type: 'unknown' }
      ]
      const expected = [
        123,
        234,
        345,
        456,
        null,
        567,
        678,
        null
      ]
      const actual = inputs.map(input => __internals__.extractAuthFromPostmanAuth(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractAuthTypedStore', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractAuthFromPostmanAuth')
        .andCall(v => v % 2 ? { key: v, value: v } : null)

      const inputs = [
        [],
        [ null, {}, { request: {} }, { request: '123123' } ],
        [ { request: { auth: 123 } }, { request: { auth: 234 } }, { request: { auth: 345 } } ]
      ]
      const expected = [
        { key: 'auth', value: OrderedMap() },
        { key: 'auth', value: OrderedMap() },
        { key: 'auth', value: OrderedMap({
          '123': 123,
          '345': 345
        }) }
      ]
      const actual = inputs.map(input => __internals__.extractAuthTypedStore(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractConstraintTypedStore', () => {
    it('should work', () => {
      const inputs = [
        {},
        { globals: {} },
        { globals: { abc: 123, def: 234 } }
      ]
      const expected = [
        { key: 'constraint', value: OrderedMap() },
        { key: 'constraint', value: OrderedMap() },
        { key: 'constraint', value: OrderedMap({
          abc: new Constraint.JSONSchema({
            title: 'abc'
          }),
          def: new Constraint.JSONSchema({
            title: 'def'
          })
        }) }
      ]
      const actual = inputs.map(input => __internals__.extractConstraintTypedStore(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractStoreInstance', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractAuthTypedStore')
        .andCall(v => v ? { key: 'auth', value: v } : null)
      spyOn(__internals__, 'extractEndpointTypedStore')
        .andCall(v => v ? { key: 'endpoint', value: v } : null)
      spyOn(__internals__, 'extractParameterTypedStore')
        .andCall(v => v ? { key: 'parameter', value: v } : null)
      spyOn(__internals__, 'extractConstraintTypedStore')
        .andCall(v => v ? { key: 'constraint', value: v * 2 } : null)

      const inputs = [
        [],
        [ 123, 234, 345 ]
      ]
      const expected = [
        {},
        { auth: 123, endpoint: 234, parameter: 345, constraint: 345 * 2 }
      ]
      const actual = inputs.map(input => __internals__.extractStoreInstance(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractStore', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractStoreInstance').andCall((i, e, c) => {
        return { auth: i, endpoint: e, parameter: c }
      })

      const inputs = [
        [ 123, 234, 345 ]
      ]
      const expected = [
        {
          key: 'store',
          value: new Store({
            auth: 123,
            endpoint: 234,
            parameter: 345
          })
        }
      ]
      const actual = inputs.map(input => __internals__.extractStore(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractItems', () => {
    it('should work', () => {
      const inputs = [
        [ [ { request: 123 } ], {} ],
        [ [ { request: 123 } ], { request: 234 } ],
        [ [ { request: 123 } ], { item: 234 } ],
        [
          [ { request: 123 } ],
          { item: [
            { request: 234 },
            { item: [
              { request: 345 }
            ] }
          ] }
        ]
      ]

      const expected = [
        [ { request: 123 } ],
        [ { request: 123 }, { request: 234 } ],
        [ { request: 123 } ],
        [ { request: 123 }, { request: 234 }, { request: 345 } ]
      ]

      const actual = inputs.map(input => __internals__.extractItems(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@findLongestCommonPath', () => {
    it('should work', () => {
      const lcPathname = [ '', 'users', '{userId}', 'pets', '{petId}' ]
      const inputs = [
        '/users/{userId}/pets/{petId}',
        '/users/{userId}/pets/{petId}/address',
        '/users/{userId}/pets',
        '/users/{userId}/petitions',
        '/users',
        '/usage'
      ]

      const expected = [
        [ '', 'users', '{userId}', 'pets', '{petId}' ],
        [ '', 'users', '{userId}', 'pets', '{petId}' ],
        [ '', 'users', '{userId}', 'pets' ],
        [ '', 'users', '{userId}' ],
        [ '', 'users' ],
        [ '' ]
      ]
      const actual = inputs.map(input => __internals__.findLongestCommonPath(lcPathname, input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@addHostEntryToHostMap', () => {
    it('should work', () => {
      const hostMap = {
        'echo.paw.cloud': {
          entries: [
            {
              key: new URL({
                url: 'http://echo.paw.cloud/users/234',
                variableDelimiters: List([ '{{', '}}', ':' ])
              }),
              value: 234
            }
          ],
          lcPathname: [ '', 'users', '234' ]
        }
      }
      const inputs = [
        {
          key: new URL({
            url: 'http://echo.paw.cloud:8080/users/456',
            variableDelimiters: List([ '{{', '}}', ':' ])
          }),
          value: 456
        },
        {
          key: new URL({
            url: 'http://echo.paw.cloud/users/123',
            variableDelimiters: List([ '{{', '}}', ':' ])
          }),
          value: 123
        },
        {
          key: new URL({
            url: 'https://beta.paw.cloud/users/321',
            variableDelimiters: List([ '{{', '}}', ':' ])
          }),
          value: 321
        },
        {
          key: new URL({
            url: 'https:///users/321',
            variableDelimiters: List([ '{{', '}}', ':' ])
          }),
          value: 321
        }
      ]
      const expected = {
        'echo.paw.cloud:8080': {
          entries: [
            {
              key: new URL({
                url: 'http://echo.paw.cloud:8080/users/456',
                variableDelimiters: List([ '{{', '}}', ':' ])
              }),
              value: 456
            }
          ],
          lcPathname: [ '', 'users', '456' ]
        },
        'echo.paw.cloud': {
          entries: [
            {
              key: new URL({
                url: 'http://echo.paw.cloud/users/234',
                variableDelimiters: List([ '{{', '}}', ':' ])
              }),
              value: 234
            },
            {
              key: new URL({
                url: 'http://echo.paw.cloud/users/123',
                variableDelimiters: List([ '{{', '}}', ':' ])
              }),
              value: 123
            }
          ],
          lcPathname: [ '', 'users' ]
        },
        'beta.paw.cloud': {
          entries: [
            {
              key: new URL({
                url: 'https://beta.paw.cloud/users/321',
                variableDelimiters: List([ '{{', '}}', ':' ])
              }),
              value: 321
            }
          ],
          lcPathname: [ '', 'users', '321' ]
        },
        '': {
          entries: [
            {
              key: new URL({
                url: 'https:///users/321',
                variableDelimiters: List([ '{{', '}}', ':' ])
              }),
              value: 321
            }
          ],
          lcPathname: [ '', 'users', '321' ]
        }
      }

      const actual = inputs.reduce(__internals__.addHostEntryToHostMap, hostMap)
      expect(actual).toEqual(expected)
    })
  })

  describe('@getLongestCommonPathnameAsString', () => {
    it('should work', () => {
      const inputs = [
        [ '', 'users', '123' ],
        [ '' ]
      ]
      const expected = [
        '/users/123',
        '/'
      ]
      const actual = inputs.map(__internals__.getLongestCommonPathnameAsString)
      expect(actual).toEqual(expected)
    })
  })

  describe('@updateHostKeyWithLongestCommonPathname', () => {
    it('should work', () => {
      const key = 'echo.paw.cloud'
      const input = { entries: [ 123, 123, 123 ], lcPathname: [ '', 'users' ] }
      const expected = { key: 'echo.paw.cloud/users', value: [ 123, 123, 123 ] }
      const actual = __internals__.updateHostKeyWithLongestCommonPathname(input, key)
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractCommonHostsFromRequests', () => {
    it('should work', () => {
      const inputs = [
        [
          { request: { urlString: 'https://echo.paw.cloud/users/123' } },
          { request: { urlString: 'https://echo.paw.cloud/users/234' } },
          { request: { urlString: 'https://beta.paw.cloud/users/123' } }
        ]
      ]
      const expected = [
        List([
          {
            key: 'echo.paw.cloud/users',
            value: [
              {
                key: new URL({
                  url: 'https://echo.paw.cloud/users/123',
                  variableDelimiters: List([ '{{', '}}', ':' ])
                }),
                value: { request: { urlString: 'https://echo.paw.cloud/users/123' } }
              },
              {
                key: new URL({
                  url: 'https://echo.paw.cloud/users/234',
                  variableDelimiters: List([ '{{', '}}', ':' ])
                }),
                value: { request: { urlString: 'https://echo.paw.cloud/users/234' } }
              }
            ]
          },
          {
            key: 'beta.paw.cloud/users/123',
            value: [
              {
                key: new URL({
                  url: 'https://beta.paw.cloud/users/123',
                  variableDelimiters: List([ '{{', '}}', ':' ])
                }),
                value: { request: { urlString: 'https://beta.paw.cloud/users/123' } }
              }
            ]
          }
        ])
      ]
      const actual = inputs.map(input => __internals__.extractCommonHostsFromRequests(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createEndpointFromHost', () => {
    it('should work', () => {
      const inputs = [
        [ 'echo.paw.cloud', [ { key: new URL({ url: 'http://echo.paw.cloud' }) } ] ],
        [
          'echo.paw.cloud',
          [
            { key: new URL({ url: 'http://echo.paw.cloud' }) },
            { key: new URL({ url: 'https://echo.paw.cloud' }) }
          ]
        ]
      ]
      const expected = [
        {
          key: 'echo.paw.cloud',
          value: new URL({
            url: 'http://echo.paw.cloud',
            variableDelimiters: List([ '{{', '}}', ':' ])
          })
        },
        {
          key: 'echo.paw.cloud',
          value: (new URL({
            url: 'http://echo.paw.cloud',
            variableDelimiters: List([ '{{', '}}', ':' ])
          })).set('protocol', List([ 'http:', 'https:' ]))
        }
      ]

      const actual = inputs.map(input => __internals__.createEndpointFromHost(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractResourceEndpointsFromItem', () => {
    it('should work', () => {
      const inputs = [
        'echo.paw.cloud'
      ]
      const expected = [
        {
          key: 'endpoints',
          value: OrderedMap({
            'echo.paw.cloud': new Reference({ type: 'endpoint', uuid: 'echo.paw.cloud' })
          })
        }
      ]
      const actual = inputs.map(input => __internals__.extractResourceEndpointsFromItem(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractResourcePathFromItem', () => {
    it('should work', () => {
      const inputs = [
        [ 'echo.paw.cloud', { request: { urlString: 'https://beta.paw/cloud' } } ],
        [ 'echo.paw.cloud', { request: { urlString: 'https://echo.paw/cloud' } } ],
        [ 'echo.paw.cloud', { request: { urlString: 'https://echo.paw/cloud/' } } ],
        [ 'echo.paw.cloud', { request: { urlString: 'https://echo.paw/cloud/users/123' } } ],
        [ 'echo.paw.cloud', { request: { urlString: 'https://echo.paw/cloud/users/123?t=234' } } ]
      ]
      const expected = [
        { key: 'path', value: new URL({ url: '/' }) },
        {
          key: 'path',
          value: new URL({ url: '/', variableDelimiters: List([ '{{', '}}', ':' ]) })
        },
        {
          key: 'path',
          value: new URL({ url: '/', variableDelimiters: List([ '{{', '}}', ':' ]) })
        },
        {
          key: 'path',
          value: new URL({ url: '/users/123', variableDelimiters: List([ '{{', '}}', ':' ]) })
        },
        {
          key: 'path',
          value: new URL({ url: '/users/123', variableDelimiters: List([ '{{', '}}', ':' ]) })
        }
      ]
      const actual = inputs.map(input => __internals__.extractResourcePathFromItem(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractResourceDescriptionFromItem', () => {
    it('should work', () => {
      const inputs = [
        'whatever'
      ]
      const expected = [
        null
      ]
      const actual = inputs.map(input => __internals__.extractResourceDescriptionFromItem(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractRequestNameFromItem', () => {
    it('should work', () => {
      const inputs = [
        null,
        {},
        { name: 123 }
      ]

      const expected = [
        null, null, { key: 'name', value: 123 }
      ]

      const actual = inputs.map(input => __internals__.extractRequestNameFromItem(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractRequestDescriptionFromItem', () => {
    it('should work', () => {
      const inputs = [
        'whatever',
        {},
        { description: 123 },
        { request: {} },
        { request: { description: 234 } },
        { description: 123, request: { description: 234 } }
      ]
      const expected = [
        null,
        null,
        { key: 'description', value: 123 },
        null,
        { key: 'description', value: 234 },
        { key: 'description', value: 123 }
      ]
      const actual = inputs.map(input => __internals__.extractRequestDescriptionFromItem(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractParameterEntryFromQueryParameter', () => {
    it('should work', () => {
      const inputs = [
        {},
        { key: 123 },
        { key: 123, value: 234 },
        { key: 123, value: '{{ref}}' }
      ]
      const expected = [
        null,
        {
          key: 123,
          value: new Parameter({
            key: 123,
            name: 123,
            type: 'string',
            default: null
          })
        },
        {
          key: 123,
          value: new Parameter({
            key: 123,
            name: 123,
            type: 'string',
            default: 234
          })
        },
        {
          key: 123,
          value: new Parameter({
            key: 123,
            name: 123,
            type: 'string',
            default: null,
            constraints: List([ new Constraint.JSONSchema({ $ref: '#/definitions/ref' }) ])
          })
        }
      ]
      const actual = inputs.map(
        input => __internals__.extractParameterEntryFromQueryParameter(input)
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractQueryBlockFromQueryParams', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractParameterEntryFromQueryParameter').andCall(v => v)

      const inputs = [
        null,
        [],
        [ { key: 123, value: 234 }, { key: 345, value: 456 } ]
      ]
      const expected = [
        null, null,
        { key: 'queries', value: OrderedMap({ '123': 234, '345': 456 }) }
      ]
      const actual = inputs.map(input => __internals__.extractQueryBlockFromQueryParams(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractHeaderParameterFromString', () => {
    it('should work', () => {
      const inputs = [
        '',
        'Content-Type:',
        'Content-Type: application/json',
        'Content-Type: {{cType}}'
      ]
      const expected = [
        null,
        {
          key: 'Content-Type',
          value: new Parameter({
            key: 'Content-Type',
            name: 'Content-Type',
            type: 'string',
            default: null
          })
        },
        {
          key: 'Content-Type',
          value: new Parameter({
            key: 'Content-Type',
            name: 'Content-Type',
            type: 'string',
            default: 'application/json'
          })
        },
        {
          key: 'Content-Type',
          value: new Parameter({
            key: 'Content-Type',
            name: 'Content-Type',
            type: 'string',
            default: null,
            constraints: List([ new Constraint.JSONSchema({ $ref: '#/definitions/cType' }) ])
          })
        }
      ]
      const actual = inputs.map(input => __internals__.extractHeaderParameterFromString(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractHeaderBlockFromHeaderString', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractHeaderParameterFromString').andCall(l => {
        const [ key = '', value = '' ] = l.split(':')
        if (!key) {
          return null
        }
        return { key: key.trim(), value: value.trim() }
      })

      const inputs = [
        '',
        'Content-Type: application/json\nAccept: application/json\n'
      ]
      const expected = [
        { key: 'headers', value: OrderedMap() },
        {
          key: 'headers',
          value: OrderedMap({
            'Content-Type': 'application/json',
            Accept: 'application/json'
          })
        }
      ]
      const actual = inputs.map(input => __internals__.extractHeaderBlockFromHeaderString(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractHeaderParameterFromObject', () => {
    it('should work', () => {
      const inputs = [
        null,
        {},
        { key: '123' },
        { key: '123', value: 234 },
        { key: '123', value: '{{ref}}' }
      ]
      const expected = [
        null, null,
        { key: '123', value: new Parameter({ key: '123', name: '123', type: 'string' }) },
        {
          key: '123',
          value: new Parameter({ key: '123', name: '123', type: 'string', default: '234' })
        },
        {
          key: '123',
          value: new Parameter({
            key: '123',
            name: '123',
            type: 'string',
            default: null,
            constraints: List([ new Constraint.JSONSchema({ $ref: '#/definitions/ref' }) ])
          })
        }
      ]
      const actual = inputs.map(input => __internals__.extractHeaderParameterFromObject(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractHeaderParameter', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractHeaderParameterFromString').andReturn(123)
      spyOn(__internals__, 'extractHeaderParameterFromObject').andReturn(234)

      const inputs = [
        'Content-Type: application/json',
        { key: 'Content-Type', value: 'application/json' }
      ]
      const expected = [
        123,
        234
      ]
      const actual = inputs.map(input => __internals__.extractHeaderParameter(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractHeaderBlockFromHeaderArray', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractHeaderParameter')
        .andCall(v => v % 2 ? { key: v, value: v } : null)

      const inputs = [
        [],
        [ 123, 234, 345 ]
      ]

      const expected = [
        { key: 'headers', value: OrderedMap() },
        { key: 'headers', value: OrderedMap({ '123': 123, '345': 345 }) }
      ]

      const actual = inputs.map(input => __internals__.extractHeaderBlockFromHeaderArray(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractHeaderBlockFromHeaders', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractHeaderBlockFromHeaderString').andReturn(123)
      spyOn(__internals__, 'extractHeaderBlockFromHeaderArray').andReturn(234)

      const inputs = [
        null,
        'Content-Type: application/json\n',
        { some: 'weird header object' },
        [],
        [ { key: 'Content-Type', value: 'application/json' } ]
      ]
      const expected = [
        null, 123, null, null, 234
      ]

      const actual = inputs.map(input => __internals__.extractHeaderBlockFromHeaders(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractBodyParameterFromUrlEncodedOrFormDataBody', () => {
    it('should work', () => {
      const inputs = [
        {},
        { key: 123, value: 234 }
      ]
      const expected = [
        null,
        { key: 123, value: new Parameter({ key: 123, name: 123, type: 'string', default: 234 }) }
      ]
      const actual = inputs.map(
        input => __internals__.extractBodyParameterFromUrlEncodedOrFormDataBody(input)
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractBodyBlockFromUrlEncodedOrFormDataBody', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractBodyParameterFromUrlEncodedOrFormDataBody').andCall(v => {
        return v % 2 ? { key: v, value: v } : null
      })

      const inputs = [
        { mode: 'urlencoded' },
        { mode: 'formdata' },
        { mode: 'urlencoded', urlencoded: [ 123, 234, 345 ] },
        { mode: 'formdata', formdata: [ 123, 234, 345 ] }
      ]
      const expected = [
        { key: 'body', value: OrderedMap() },
        { key: 'body', value: OrderedMap() },
        { key: 'body', value: OrderedMap({ '123': 123, '345': 345 }) },
        { key: 'body', value: OrderedMap({ '123': 123, '345': 345 }) }
      ]
      const actual = inputs.map(
        input => __internals__.extractBodyBlockFromUrlEncodedOrFormDataBody(input)
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractBodyBlockFromFileBody', () => {
    it('should work', () => {
      const inputs = [
        null,
        {},
        { file: {} },
        { file: { content: 123 } }
      ]
      const expected = [
        { key: 'body', value: OrderedMap({ file: new Parameter({ type: 'string' }) }) },
        { key: 'body', value: OrderedMap({ file: new Parameter({ type: 'string' }) }) },
        { key: 'body', value: OrderedMap({ file: new Parameter({ type: 'string' }) }) },
        {
          key: 'body',
          value: OrderedMap({ file: new Parameter({ type: 'string', default: 123 }) })
        }
      ]
      const actual = inputs.map(input => __internals__.extractBodyBlockFromFileBody(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractBodyBlockFromRawBody', () => {
    it('should work', () => {
      const inputs = [
        null,
        {},
        { raw: 123 }
      ]
      const expected = [
        { key: 'body', value: OrderedMap({ raw: new Parameter({ type: 'string' }) }) },
        { key: 'body', value: OrderedMap({ raw: new Parameter({ type: 'string' }) }) },
        {
          key: 'body',
          value: OrderedMap({ raw: new Parameter({ type: 'string', default: 123 }) })
        }
      ]
      const actual = inputs.map(input => __internals__.extractBodyBlockFromRawBody(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractBodyBlockFromBody', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractBodyBlockFromRawBody').andReturn(123)
      spyOn(__internals__, 'extractBodyBlockFromUrlEncodedOrFormDataBody').andReturn(234)
      spyOn(__internals__, 'extractBodyBlockFromFileBody').andReturn(345)

      const inputs = [
        null,
        {},
        { mode: 'urlencoded' },
        { mode: 'formdata' },
        { mode: 'file' },
        { mode: 'raw' }
      ]
      const expected = [
        null,
        null,
        234,
        234,
        345,
        123
      ]
      const actual = inputs.map(input => __internals__.extractBodyBlockFromBody(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractRequestParameterContainerInstanceFromItem', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractQueryBlockFromQueryParams')
        .andCall(v => v ? { key: 'queries', value: v } : null)
      spyOn(__internals__, 'extractHeaderBlockFromHeaders')
        .andCall(v => v ? { key: 'headers', value: v } : null)
      spyOn(__internals__, 'extractBodyBlockFromBody')
        .andCall(v => v ? { key: 'body', value: v } : null)

      const inputs = [
        null,
        {},
        { request: {} },
        { request: { url: {}, header: 234, body: 345 } },
        { request: { url: { query: 123 }, header: 234, body: 345 } }
      ]
      const expected = [
        {},
        {},
        {},
        { headers: 234, body: 345 },
        { queries: 123, headers: 234, body: 345 }
      ]
      const actual = inputs.map(
        input => __internals__.extractRequestParameterContainerInstanceFromItem(input)
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractRequestParametersFromItem', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractRequestParameterContainerInstanceFromItem').andCall(v => v)
      const inputs = [
        { body: 123, headers: 234 }
      ]
      const expected = [
        { key: 'parameters', value: new ParameterContainer({ body: 123, headers: 234 }) }
      ]
      const actual = inputs.map(input => __internals__.extractRequestParametersFromItem(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractAuthRefsFromAWSV4Auth', () => {
    it('should work', () => {
      const inputs = [
        { type: 'awsv4' }
      ]
      const expected = [
        {
          key: 'auths',
          value: List([
            new Reference({
              type: 'auth',
              uuid: 'awsv4'
            })
          ])
        }
      ]
      const actual = inputs.map(input => __internals__.extractAuthRefsFromAWSV4Auth(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractAuthRefsFromBasicAuth', () => {
    it('should work', () => {
      const inputs = [
        { type: 'basic' }
      ]
      const expected = [
        {
          key: 'auths',
          value: List([
            new Reference({
              type: 'auth',
              uuid: 'basic'
            })
          ])
        }
      ]
      const actual = inputs.map(input => __internals__.extractAuthRefsFromBasicAuth(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractAuthRefsFromDigestAuth', () => {
    it('should work', () => {
      const inputs = [
        { type: 'digest' }
      ]
      const expected = [
        {
          key: 'auths',
          value: List([
            new Reference({
              type: 'auth',
              uuid: 'digest'
            })
          ])
        }
      ]
      const actual = inputs.map(input => __internals__.extractAuthRefsFromDigestAuth(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractAuthRefsFromHawkAuth', () => {
    it('should work', () => {
      const inputs = [
        { type: 'hawk' }
      ]
      const expected = [
        {
          key: 'auths',
          value: List([
            new Reference({
              type: 'auth',
              uuid: 'hawk'
            })
          ])
        }
      ]
      const actual = inputs.map(input => __internals__.extractAuthRefsFromHawkAuth(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractAuthRefsFromAWSV4Auth', () => {
    it('should work', () => {
      const inputs = [
        { type: 'noauth' }
      ]
      const expected = [
        {
          key: 'auths',
          value: List([
            null
          ])
        }
      ]
      const actual = inputs.map(input => __internals__.extractAuthRefsFromNoAuthAuth(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractAuthRefsFromOAuth1Auth', () => {
    it('should work', () => {
      const inputs = [
        { type: 'oauth1' }
      ]
      const expected = [
        {
          key: 'auths',
          value: List([
            new Reference({
              type: 'auth',
              uuid: 'oauth1'
            })
          ])
        }
      ]
      const actual = inputs.map(input => __internals__.extractAuthRefsFromOAuth1Auth(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractAuthRefsFromOAuth2Auth', () => {
    it('should work', () => {
      const inputs = [
        { type: 'oauth2' }
      ]
      const expected = [
        {
          key: 'auths',
          value: List([
            new Reference({
              type: 'auth',
              uuid: 'oauth2'
            })
          ])
        }
      ]
      const actual = inputs.map(input => __internals__.extractAuthRefsFromOAuth2Auth(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractAuthsFromItem', () => {
    /* eslint-disable max-statements */
    it('should work', () => {
      spyOn(__internals__, 'extractAuthRefsFromAWSV4Auth').andReturn(123)
      spyOn(__internals__, 'extractAuthRefsFromBasicAuth').andReturn(234)
      spyOn(__internals__, 'extractAuthRefsFromDigestAuth').andReturn(345)
      spyOn(__internals__, 'extractAuthRefsFromHawkAuth').andReturn(456)
      spyOn(__internals__, 'extractAuthRefsFromNoAuthAuth').andReturn(567)
      spyOn(__internals__, 'extractAuthRefsFromOAuth1Auth').andReturn(678)
      spyOn(__internals__, 'extractAuthRefsFromOAuth2Auth').andReturn(789)

      const inputs = [
        null,
        {},
        { request: { auth: { type: 'awsv4' } } },
        { request: { auth: { type: 'basic' } } },
        { request: { auth: { type: 'digest' } } },
        { request: { auth: { type: 'hawk' } } },
        { request: { auth: { type: 'noauth' } } },
        { request: { auth: { type: 'oauth1' } } },
        { request: { auth: { type: 'oauth2' } } },
        { request: { auth: { type: 'weird' } } }
      ]
      const expected = [
        null,
        null,
        123, 234, 345, 456, 567, 678, 789,
        null
      ]
      const actual = inputs.map(input => __internals__.extractAuthsFromItem(input))
      expect(actual).toEqual(expected)
    })
    /* eslint-enable max-statements */
  })

  describe('@extractRequestMethodFromItem', () => {
    it('should work', () => {
      const inputs = [
        null,
        {},
        { request: {} },
        { request: { method: 'PUT' } }
      ]
      const expected = [
        { key: 'method', value: 'get' },
        { key: 'method', value: 'get' },
        { key: 'method', value: 'get' },
        { key: 'method', value: 'put' }
      ]
      const actual = inputs.map(input => __internals__.extractRequestMethodFromItem(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractRequestInstanceFromItem', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractRequestNameFromItem')
        .andCall(({ n }) => n ? { key: 'name', value: n } : null)
      spyOn(__internals__, 'extractRequestDescriptionFromItem')
        .andCall(({ d }) => d ? { key: 'description', value: d } : null)
      spyOn(__internals__, 'extractRequestParametersFromItem')
        .andCall(({ p }) => p ? { key: 'parameters', value: p } : null)
      spyOn(__internals__, 'extractRequestMethodFromItem')
        .andCall(({ m }) => m ? { key: 'method', value: m } : null)
      spyOn(__internals__, 'extractAuthsFromItem')
        .andCall(({ a }) => a ? { key: 'auths', value: a } : null)

      const inputs = [
        [ null, {} ],
        [ { key: 'endpoints', value: 123 }, { n: 234, d: 345, p: 456, m: 567, a: 678 } ]
      ]
      const expected = [
        {},
        { endpoints: 123, name: 234, description: 345, parameters: 456, method: 567, auths: 678 }
      ]
      const actual = inputs.map(input => __internals__.extractRequestInstanceFromItem(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractRequestFromItem', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractRequestInstanceFromItem')
        .andCall((e, i) => ({ name: e, description: i }))

      const inputs = [
        [ 123, 234 ]
      ]
      const expected = [
        new Request({ name: 123, description: 234 })
      ]
      const actual = inputs.map(input => __internals__.extractRequestFromItem(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractResourceMethodsFromItem', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractRequestMethodFromItem').andCall(i => ({ value: i }))
      spyOn(__internals__, 'extractRequestFromItem').andCall((e) => e)

      const inputs = [
        [ 123, 234 ]
      ]
      const expected = [
        { key: 'methods', value: OrderedMap({ '234': 123 }) }
      ]
      const actual = inputs.map(input => __internals__.extractResourceMethodsFromItem(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractResourceInstanceFromItem', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractResourceEndpointsFromItem').andCall(v => v)
      spyOn(__internals__, 'extractResourcePathFromItem')
        .andCall((_, { p }) => p ? { key: 'path', value: p } : null)
      spyOn(__internals__, 'extractResourceDescriptionFromItem')
        .andCall(({ d }) => d ? { key: 'description', value: d } : null)
      spyOn(__internals__, 'extractResourceMethodsFromItem')
        .andCall((_, { m }) => m ? { key: 'methods', value: m } : null)

      const inputs = [
        [ null, {} ],
        [ { key: 'endpoints', value: 123 }, { p: 234, d: 345, m: 456 } ]
      ]
      const expected = [
        {},
        { endpoints: 123, path: 234, description: 345, methods: 456 }
      ]
      const actual = inputs.map(input => __internals__.extractResourceInstanceFromItem(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractResourceFromItem', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractResourceInstanceFromItem').andCall(h => ({ name: h }))

      const inputs = [
        [ 123, {} ],
        [ 123, { id: 234 } ],
        [ 123, { id: 234, name: 345 } ],
        [ 123, { name: 345 } ]
      ]
      const expected = [
        { key: null, value: new Resource({ name: 123 }) },
        { key: 234, value: new Resource({ name: 123 }) },
        { key: 234, value: new Resource({ name: 123 }) },
        { key: 345, value: new Resource({ name: 123 }) }
      ]
      const actual = inputs.map(input => __internals__.extractResourceFromItem(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@getResourcesFromItemEntries', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractResourceFromItem').andCall((h, v) => h + v)

      const inputs = [
        [ 123, [] ],
        [ 123, [ { value: 234 }, { value: 345 } ] ]
      ]
      const expected = [
        [],
        [ 123 + 234, 123 + 345 ]
      ]
      const actual = inputs.map(input => __internals__.getResourcesFromItemEntries(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertHostIntoResources', () => {
    it('should work', () => {
      spyOn(__internals__, 'createEndpointFromHost').andCall((h, e) => h + e)
      spyOn(__internals__, 'getResourcesFromItemEntries').andCall((h, e) => h * e)

      const inputs = [
        { key: 123, value: 234 }
      ]
      const expected = [
        { resources: 123 * 234, endpoint: 123 + 234 }
      ]
      const actual = inputs.map(input => __internals__.convertHostIntoResources(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@groupResourcesAndEndpoints', () => {
    it('should work', () => {
      const inputs = [
        [
          { resources: [ 123 ], endpoints: [ 'abc' ] },
          { resources: [ 234, 345 ], endpoint: 'def' }
        ],
        [
          { resources: [ 123 ], endpoints: [ 'abc' ] },
          { resources: null, endpoint: 'def' }
        ]
      ]
      const expected = [
        { resources: [ 123, 234, 345 ], endpoints: [ 'abc', 'def' ] },
        { resources: [ 123 ], endpoints: [ 'abc', 'def' ] }
      ]
      const actual = inputs.map(input => __internals__.groupResourcesAndEndpoints(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@mergeResources', () => {
    it('should work', () => {
      const inputs = [
        [
          { abc: new Resource({ methods: OrderedMap({ get: 123, put: 234 }) }) },
          { key: 'abc', value: new Resource({ methods: OrderedMap({ post: 345 }) }) }
        ],
        [
          { abc: new Resource({ methods: OrderedMap({ get: 123, put: 234 }) }) },
          { key: 'def', value: new Resource({ methods: OrderedMap({ post: 345 }) }) }
        ]
      ]
      const expected = [
        { abc: new Resource({ methods: OrderedMap({ get: 123, put: 234, post: 345 }) }) },
        {
          abc: new Resource({ methods: OrderedMap({ get: 123, put: 234 }) }),
          def: new Resource({ methods: OrderedMap({ post: 345 }) })
        }
      ]
      const actual = inputs.map(input => __internals__.mergeResources(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractResources', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractItems').andCall((acc, c) => c)
      spyOn(__internals__, 'extractCommonHostsFromRequests').andCall(i => i)
      spyOn(__internals__, 'convertHostIntoResources')
        .andCall(v => ({ resources: [ { key: v, value: v } ], endpoint: v % 2 }))

      const inputs = [
        [],
        [ 123, 234, 345 ]
      ]
      const expected = [
        { resources: OrderedMap(), endpoints: [], items: [] },
        {
          resources: OrderedMap({ '123': 123, '234': 234, '345': 345 }),
          endpoints: [ 1, 0, 1 ],
          items: [ 123, 234, 345 ]
        }
      ]
      const actual = inputs.map(input => __internals__.extractResources(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractApi', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractResources').andCall(
        ({ r, e, it }) => ({ resources: r || null, endpoints: e || null, items: it || null })
      )
      spyOn(__internals__, 'extractInfo').andCall(({ i }) => i ? { key: 'info', value: i } : null)
      spyOn(__internals__, 'extractGroup').andCall(({ g }) => g ? { key: 'group', value: g } : null)
      spyOn(__internals__, 'extractStore')
        .andCall((it, e) => it && e ? { key: 'store', value: it + e } : null)

      const inputs = [
        {},
        { r: 123, e: 234, it: 345, i: 456, g: 567 }
      ]
      const expected = [
        { resources: null },
        { resources: 123, info: 456, group: 567, store: 234 + 345 }
      ]
      const actual = inputs.map(input => __internals__.extractApi(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@parse', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractApi').andCall(v => ({ resources: v * 2 }))

      const inputs = [
        { options: 123, item: 234 }
      ]
      const expected = [
        { options: 123, api: new Api({ resources: 234 * 2 }) }
      ]
      const actual = inputs.map(input => __internals__.parse(input))
      expect(actual).toEqual(expected)
    })
  })
})
