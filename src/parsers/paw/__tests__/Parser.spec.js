/* eslint-disable max-nested-callbacks */
import expect, { spyOn, restoreSpies } from 'expect'
import { OrderedMap, List, Seq } from 'immutable'

import { parse } from 'url'

import Contact from '../../../models/Contact'
import Info from '../../../models/Info'
import Group from '../../../models/Group'
import Variable from '../../../models/Variable'
import Parameter from '../../../models/Parameter'
import URL from '../../../models/URL'
import URLComponent from '../../../models/URLComponent'
import Reference from '../../../models/Reference'
import Resource from '../../../models/Resource'
import Constraint from '../../../models/Constraint'
import ParameterContainer from '../../../models/ParameterContainer'
import Request from '../../../models/Request'
import Auth from '../../../models/Auth'
import Store from '../../../models/Store'
import Api from '../../../models/Api'

import Parser, { __internals__ } from '../Parser'

describe('parsers/paw/Parser.js', () => {
  afterEach(() => restoreSpies())
  describe('{ Parser }', () => {
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

  describe('@addGenerationMessage', () => {
    it('should work', () => {
      const contexts = [
        { document: {} },
        { document: { cloudProject: {} } },
        { document: { cloudProject: { currentBranch: 'test' } } },
        { document: { cloudProject: { currentBranch: 'test', commitSha: 123 } } }
      ]

      const expected = [
        null,
        null,
        'This document was generated from the branch test.',
        'This document was generated from the branch test on commit 123.'
      ]

      const actual = contexts.map(__internals__.addGenerationMessage)

      expect(actual).toEqual(expected)
    })
  })

  describe('@addContributionMessage', () => {
    it('should work', () => {
      const inputs = [
        { document: {} },
        { document: { isCloudProject: false } },
        { document: { isCloudProject: true } },
        { document: { isCloudProject: false, cloudProject: {}, cloudTeam: {} } },
        { document: { isCloudProject: true, cloudProject: {}, cloudTeam: {} } },
        { document: { isCloudProject: false, cloudProject: {}, cloudTeam: { id: 321 } } },
        { document: { isCloudProject: true, cloudProject: {}, cloudTeam: { id: 321 } } },
        { document: { isCloudProject: false, cloudProject: { id: 123 }, cloudTeam: {} } },
        { document: { isCloudProject: true, cloudProject: { id: 123 }, cloudTeam: {} } },
        { document: { isCloudProject: false, cloudProject: { id: 123 }, cloudTeam: { id: 321 } } },
        { document: { isCloudProject: true, cloudProject: { id: 123 }, cloudTeam: { id: 321 } } }
      ]
      const expected = [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        'If you are a contributor to this project, you may access it here: ' +
          'https://paw.cloud/account/teams/321/projects/123'
      ]
      const actual = inputs.map(__internals__.addContributionMessage)

      expect(actual).toEqual(expected)
    })
  })

  describe('@extractDescription', () => {
    it('should call expected methods', () => {
      spyOn(__internals__, 'addGenerationMessage').andReturn(null)
      spyOn(__internals__, 'addContributionMessage').andReturn(null)

      const input = { document: 'test' }
      __internals__.extractDescription(input)

      expect(__internals__.addGenerationMessage).toHaveBeenCalledWith(input)
      expect(__internals__.addContributionMessage).toHaveBeenCalledWith(input)
    })

    it('should work if no message', () => {
      spyOn(__internals__, 'addGenerationMessage').andReturn(null)
      spyOn(__internals__, 'addContributionMessage').andReturn(null)

      const input = {}
      const expected = null

      const actual = __internals__.extractDescription(input)

      expect(actual).toEqual(expected)
    })

    it('should work if contribution message', () => {
      spyOn(__internals__, 'addGenerationMessage').andReturn(null)
      spyOn(__internals__, 'addContributionMessage').andReturn('hey there')

      const input = {}
      const expected = 'hey there'

      const actual = __internals__.extractDescription(input)

      expect(actual).toEqual(expected)
    })

    it('should work if generation message', () => {
      spyOn(__internals__, 'addGenerationMessage').andReturn('gen msg')
      spyOn(__internals__, 'addContributionMessage').andReturn(null)

      const input = {}
      const expected = 'gen msg'

      const actual = __internals__.extractDescription(input)

      expect(actual).toEqual(expected)
    })

    it('should work if both messages', () => {
      spyOn(__internals__, 'addGenerationMessage').andReturn('gen msg')
      spyOn(__internals__, 'addContributionMessage').andReturn('contrib msg')

      const input = {}
      const expected = 'gen msg\n\ncontrib msg'

      const actual = __internals__.extractDescription(input)

      expect(actual).toEqual(expected)
    })
  })

  describe('@extractContact', () => {
    it('should work', () => {
      const inputs = [
        { document: {} },
        { document: { cloudTeam: {} } },
        { document: { cloudTeam: { id: 123 } } },
        { document: { cloudTeam: { id: 123, name: 'Dev Team' } } }
      ]
      const expected = [
        null,
        null,
        new Contact({ url: 'https://paw.cloud/account/teams/123' }),
        new Contact({ url: 'https://paw.cloud/account/teams/123', name: 'Dev Team' })
      ]

      const actual = inputs.map(__internals__.extractContact)

      expect(actual).toEqual(expected)
    })
  })

  describe('@extractVersion', () => {
    it('should work', () => {
      const inputs = [
        { document: {} },
        { document: { cloudProject: {} } },
        { document: { cloudProject: { commitSha: '123' } } }
      ]
      const expected = [
        'v0.0.0',
        'v0.0.0',
        'v0.0.0-123'
      ]
      const actual = inputs.map(__internals__.extractVersion)

      expect(actual).toEqual(expected)
    })
  })

  describe('@extractTitle', () => {
    it('should work', () => {
      const inputs = [
        { document: {} },
        { document: { name: 'Dev Api' } }
      ]
      const expected = [
        null,
        'Dev Api'
      ]
      const actual = inputs.map(__internals__.extractTitle)

      expect(actual).toEqual(expected)
    })
  })

  describe('@extractInfo', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractTitle').andReturn(123)
      spyOn(__internals__, 'extractVersion').andReturn(321)
      spyOn(__internals__, 'extractDescription').andReturn(234)
      spyOn(__internals__, 'extractContact').andReturn(432)

      const input = {}
      const expected = new Info({
        title: 123,
        version: 321,
        description: 234,
        contact: 432
      })

      const actual = __internals__.extractInfo(input)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getPathForRequestOrGroup', () => {
    it('should work with root (null)', () => {
      const path = [ 123, 123, 123 ]
      const input = null
      const expected = path
      const actual = __internals__.getPathForRequestOrGroup(path, input)

      expect(actual).toEqual(expected)
    })

    it('should call getPathForRequestOrGroup if reqOrGroup exists', () => {
      spyOn(__internals__, 'getPathForRequestOrGroup').andCallThrough()

      const path = [ 321, 432, 543 ]
      const input = { parent: null }
      const expected = [ input ].concat(path)
      const actual = __internals__.getPathForRequestOrGroup(path, input)

      expect(__internals__.getPathForRequestOrGroup).toHaveBeenCalledWith(path, input)
      expect(__internals__.getPathForRequestOrGroup).toHaveBeenCalledWith([ input, ...path ], null)
      expect(actual).toEqual(expected)
    })
  })

  describe('@getPathForRequest', () => {
    it('should call getPathForRequestOrGroup with correct arguments', () => {
      spyOn(__internals__, 'getPathForRequestOrGroup').andReturn(234)

      const input = { reqId: 123 }
      const expected = 234
      const actual = __internals__.getPathForRequest(input)

      expect(__internals__.getPathForRequestOrGroup).toHaveBeenCalledWith([], input)
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertPawGroupIntoGroup', () => {
    it('should work', () => {
      const inputs = [
        {},
        { id: 123 },
        { name: 321 },
        { id: 123, name: 321 }
      ]
      const expected = [
        new Group(),
        new Group({ id: 123 }),
        new Group({ name: 321 }),
        new Group({ id: 123, name: 321 })
      ]
      const actual = inputs.map(__internals__.convertPawGroupIntoGroup)
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertPawPathIntoGroupPath', () => {
    it('it should work', () => {
      const path = [ 234, 321 ]
      const input = { id: 123 }
      const expected = [ ...path, 'children', 123 ]
      const actual = __internals__.convertPawPathIntoGroupPath(path, input)
      expect(actual).toEqual(expected)
    })
  })

  describe('@createNestedGroups', () => {
    it('should work if group already exist', () => {
      spyOn(__internals__, 'convertPawGroupIntoGroup').andReturn(123)
      const acc = new Group({
        children: OrderedMap({
          '123': new Group({
            children: OrderedMap({
              '321': new Group({
                children: OrderedMap({
                  '234': new Group()
                })
              })
            })
          })
        })
      })
      const item = '321'
      const index = 1
      const input = [ { id: '123' }, { id: '321' }, { id: '234' } ]
      const expected = acc
      const actual = __internals__.createNestedGroups(acc, item, index, input)
      expect(actual).toEqual(expected)
    })

    it('should work if group does not already exist', () => {
      spyOn(__internals__, 'convertPawGroupIntoGroup').andReturn('group')
      const acc = new Group({
        children: OrderedMap({
          '123': new Group({
            children: OrderedMap({
              '321': new Group({
                children: OrderedMap({
                  '234': new Group()
                })
              })
            })
          })
        })
      })
      const item = { id: '789' }
      const index = 1
      const input = [ { id: '123' }, { id: '789' }, { id: '234' } ]
      const expected = acc.setIn([ 'children', '123', 'children', '789' ], 'group')
      const actual = __internals__.createNestedGroups(acc, item, index, input)
      expect(actual).toEqual(expected)
    })

    it('should add leaves', () => {
      spyOn(__internals__, 'convertPawGroupIntoGroup').andReturn('group')
      const acc = new Group({
        children: OrderedMap({
          '123': new Group({
            children: OrderedMap({
              '321': new Group({
                children: OrderedMap({
                  '234': new Group()
                })
              })
            })
          })
        })
      })
      const item = { id: '789' }
      const index = 1
      const input = [ { id: '123' }, { id: '789' } ]
      const expected = acc.setIn([ 'children', '123', 'children', '789' ], '789')
      const actual = __internals__.createNestedGroups(acc, item, index, input)
      expect(actual).toEqual(expected)
    })
  })

  describe('@storeRequest', () => {
    it('should work', () => {
      spyOn(__internals__, 'createNestedGroups').andReturn(234)
      const group = new Group()
      const input = [ { id: '123' }, { id: '321' }, { id: '234' } ]
      const expected = 234
      const actual = __internals__.storeRequest(group, input)

      expect(__internals__.createNestedGroups.calls.length).toEqual(3)
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractGroup', () => {
    it('should work', () => {
      spyOn(__internals__, 'getPathForRequest').andReturn(123)
      spyOn(__internals__, 'storeRequest').andReturn(234)

      const input = [ { reqId: 1 }, { reqId: 2 }, { reqId: 3 }, { reqId: 4 } ]
      const expected = 234
      const actual = __internals__.extractGroup(input)

      expect(__internals__.getPathForRequest.calls.length).toEqual(4)
      expect(__internals__.getPathForRequest.calls[0].arguments.slice(0, 1)).toEqual([ input[0] ])

      expect(__internals__.storeRequest.calls.length).toEqual(4)
      expect(__internals__.storeRequest.calls[1].arguments.slice(0, 2)).toEqual([ 234, 123 ])
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
          entries: [ { key: 'http://echo.paw.cloud/users/234', value: 234 } ],
          lcPathname: [ '', 'users', '234' ]
        }
      }
      const inputs = [
        { key: 'http://echo.paw.cloud/users/123', value: 123 },
        { key: 'https://beta.paw.cloud/users/321', value: 321 }
      ]
      const expected = {
        'echo.paw.cloud': {
          entries: [
            { key: 'http://echo.paw.cloud/users/234', value: 234 },
            { key: 'http://echo.paw.cloud/users/123',
              value: 123,
              urlObject: parse('http://echo.paw.cloud/users/123') }
          ],
          lcPathname: [ '', 'users' ]
        },
        'beta.paw.cloud': {
          entries: [
            { key: 'https://beta.paw.cloud/users/321',
              value: 321,
              urlObject: parse('https://beta.paw.cloud/users/321') }
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
    it('should work if underlying methods are correct', () => {
      spyOn(__internals__, 'addHostEntryToHostMap').andReturn({ a: 321, b: 321, c: 321 })
      spyOn(__internals__, 'updateHostKeyWithLongestCommonPathname').andReturn(123)
      const req1 = { getUrlBase: () => {} }
      spyOn(req1, 'getUrlBase').andReturn('https://echo.paw.cloud/users')
      const input = [ req1, req1, req1 ]
      const expected = Seq([ 123, 123, 123 ])
      const actual = __internals__.extractCommonHostsFromRequests(input)
      expect(actual.toList()).toEqual(expected.toList())
    })
  })

  describe('@convertDynamicStringComponentIntoEntry', () => {
    it('should work', () => {
      const component = {
        getEvaluatedString: () => {}
      }

      spyOn(component, 'getEvaluatedString').andReturn(123)

      const inputs = [
        'some/component',
        component
      ]

      const expected = [
        { key: 'some/component', value: 'some/component' },
        { key: 123, value: component }
      ]

      const actual = inputs.map(__internals__.convertDynamicStringComponentIntoEntry)
      expect(actual).toEqual(expected)
    })
  })

  describe('@isPartOfBaseUrl', () => {
    it('should work', () => {
      const defaultUrl = 'http://echo.paw.cloud/users'
      const defaultSecureUrl = 'https://echo.paw.cloud/users'
      const inputs = [ '/users', '/users/123', '/pets' ]
      const expected = [ true, false, false ]
      const actual = inputs.map((input) => {
        return __internals__.isPartOfBaseUrl(defaultUrl, defaultSecureUrl, input)
      })
      expect(actual).toEqual(expected)
    })
  })

  describe('@findIntersection', () => {
    it('should work', () => {
      const defaultUrl = 'http://echo.paw.cloud/pets'
      const inputs = [ '/pets', '/pets/234', '/234' ]
      const expected = [
        { inside: '/pets', outside: '' },
        { inside: '/pets', outside: '/234' },
        { inside: '', outside: '/234' }
      ]
      const actual = inputs.map(input => __internals__.findIntersection(defaultUrl, input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@addComponentToBaseOrPath', () => {
    it('should work', () => {
      const defaultUrl = 'http://echo.paw.cloud/users/123/pets'
      const defaultSecureUrl = 'https://echo.paw.cloud/users/123/pets'

      const accumulator = {
        baseComponents: [],
        pathComponents: []
      }

      const inputs = [
        { key: 'http://echo.paw.cloud', value: 'serverUrl' },
        { key: '/users/', value: '/users/' },
        { key: '123', value: 'userId' },
        { key: '/pets/234', value: '/pets/petId' },
        { key: '/address', value: 'address' }
      ]

      const expected = {
        baseComponents: [
          { key: 'http://echo.paw.cloud', value: 'serverUrl' },
          { key: '/users/', value: '/users/' },
          { key: '123', value: 'userId' },
          { key: '/pets', value: '/pets' }
        ],
        pathComponents: [
          { key: '/234', value: '/234' },
          { key: '/address', value: 'address' }
        ]
      }
      const actual = inputs.reduce((acc, input) => {
        return __internals__.addComponentToBaseOrPath(defaultUrl, defaultSecureUrl, acc, input)
      }, accumulator)
      expect(actual).toEqual(expected)
    })
  })

  describe('@isEnvironmentVariable', () => {
    it('should work', () => {
      const input = [
        'some/string',
        { type: 'com.luckymarmot.SomeRandomDV' },
        { type: 'com.luckymarmot.EnvironmentVariableDynamicValue' }
      ]
      const expected = [ false, false, true ]
      const actual = input.map(__internals__.isEnvironmentVariable)
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractPossibleValuesFromEnvironmentVariableDV', () => {
    it('should work', () => {
      const domain = {
        environments: [
          { name: 'Default' },
          { name: 'Production' },
          { name: 'Test' }
        ]
      }

      const variable = {
        domain: domain,
        getValue: (env) => { return { getEvaluatedString: () => { return '**' + env.name } } }
      }

      const context = {
        getEnvironmentVariableById: () => { return variable }
      }

      const input = { EnvironmentVariable: 123 }
      const expected = [
        { key: 'Default', value: '**Default' },
        { key: 'Production', value: '**Production' },
        { key: 'Test', value: '**Test' }
      ]
      const actual = __internals__.extractPossibleValuesFromEnvironmentVariableDV(context, input)
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractPossibleValuesFromDVEntry', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractPossibleValuesFromEnvironmentVariableDV').andReturn([
        { key: 123, value: 123 }, { key: 321, value: 321 }
      ])
      const context = {}
      const inputs = [
        { key: '/users', value: 'ignored' },
        { key: '/234', value: { type: 'com.luckymarmot.EnvironmentVariableDynamicValue' } }
      ]
      const expected = [
        [ { key: '', value: '/users' } ],
        [ { key: 123, value: 123 }, { key: 321, value: 321 } ]
      ]

      const actual = inputs.map(input => {
        return __internals__.extractPossibleValuesFromDVEntry(context, input)
      })

      expect(actual).toEqual(expected)
    })
  })

  describe('@combinePossibleValues', () => {
    it('should work', () => {
      const combinations = [ { key: '1@', value: '123@' }, { key: '2@', value: '234@' } ]
      const input = [ { key: '#1', value: '#123' }, { key: '#2', value: '#234' } ]
      const expected = [
        { key: '1@#1', value: '123@#123' },
        { key: '1@#2', value: '123@#234' },
        { key: '2@#1', value: '234@#123' },
        { key: '2@#2', value: '234@#234' }
      ]

      const actual = __internals__.combinePossibleValues(combinations, input)
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertBaseComponentsIntoVariable', () => {
    it('should work if no env dv', () => {
      const context = {}
      const defaultHost = 'echo.paw.cloud/123'
      const input = [ { key: '123', value: '123' }, { key: '234', value: '234' } ]
      const expected = null
      const actual = __internals__.convertBaseComponentsIntoVariable(context, defaultHost, input)
      expect(actual).toEqual(expected)
    })

    it('should work if 2+ env dv', () => {
      const context = {}
      const defaultHost = 'echo.paw.cloud/123'
      const input = [ { key: '123', value: {
        type: 'com.luckymarmot.EnvironmentVariableDynamicValue'
      } }, { key: '234', value: {
        type: 'com.luckymarmot.EnvironmentVariableDynamicValue'
      } } ]
      const expected = null
      const actual = __internals__.convertBaseComponentsIntoVariable(context, defaultHost, input)
      expect(actual).toEqual(expected)
    })

    it('should work with a single env dv', () => {
      spyOn(__internals__, 'extractPossibleValuesFromDVEntry').andCall((c, v, i) => {
        return i ?
          [ { key: 'default', value: '123' }, { key: 'production', value: '234' } ] :
          [ { key: '', value: 'https://echo.paw.cloud/users/' } ]
      })

      const context = {}
      const defaultHost = 'echo.paw.cloud/users/123'
      const input = [
        { key: 'https://echo.paw.cloud/users/', value: 'https://echo.paw.cloud/users/' },
        { key: '123', value: { type: 'com.luckymarmot.EnvironmentVariableDynamicValue' } }
      ]
      const expected = new Variable({
        name: 'echo.paw.cloud/users/123',
        values: OrderedMap({
          default: 'https://echo.paw.cloud/users/123',
          production: 'https://echo.paw.cloud/users/234'
        })
      })

      const actual = __internals__.convertBaseComponentsIntoVariable(context, defaultHost, input)

      expect(actual).toEqual(expected)
    })
  })

  describe('@extractBaseVariableAndPathComponentsFromRequest', () => {
    it('should work', () => {
      spyOn(__internals__, 'convertDynamicStringComponentIntoEntry').andCall(v => (v + 1))
      spyOn(__internals__, 'convertBaseComponentsIntoVariable').andReturn(123)
      const context = {}
      const defaultHost = 'echo.paw.cloud/users'
      const request = { getUrlBase: () => { return { components: [ 1, 2, 3 ] } } }
      const input = { value: request }
      const reducer = ({ pathComponents }, val) => {
        return { pathComponents: [ ...pathComponents, val * 2 ] }
      }
      const expected = {
        request: request,
        baseVariable: 123,
        pathComponents: [ 4, 6, 8 ]
      }
      const actual = __internals__.extractBaseVariableAndPathComponentsFromRequest(
        context, defaultHost, reducer, input
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@findBaseVariableForRequestEntries', () => {
    it('should work if no variable', () => {
      const acc = {
        hostVariable: null,
        requestEntries: []
      }
      const inputs = [
        { request: 123, baseVariable: null, pathComponents: [ 1, 2, 3 ] },
        { request: 234, baseVariable: null, pathComponents: [ 2, 3, 4 ] }
      ]
      const expected = {
        hostVariable: null,
        requestEntries: [
          { request: 123, pathComponents: [ 1, 2, 3 ] },
          { request: 234, pathComponents: [ 2, 3, 4 ] }
        ]
      }
      const actual = inputs.reduce(__internals__.findBaseVariableForRequestEntries, acc)
      expect(actual).toEqual(expected)
    })

    it('should work if variable', () => {
      const acc = {
        hostVariable: null,
        requestEntries: []
      }
      const inputs = [
        { request: 123, baseVariable: 345, pathComponents: [ 1, 2, 3 ] },
        { request: 234, baseVariable: null, pathComponents: [ 2, 3, 4 ] }
      ]
      const expected = {
        hostVariable: 345,
        requestEntries: [
          { request: 123, pathComponents: [ 1, 2, 3 ] },
          { request: 234, pathComponents: [ 2, 3, 4 ] }
        ]
      }
      const actual = inputs.reduce(__internals__.findBaseVariableForRequestEntries, acc)
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertComponentEntryIntoStringOrParam', () => {
    it('should work', () => {
      spyOn(__internals__, 'convertRequestVariableDVIntoParameter').andReturn({ value: '456' })
      const request = {}

      const inputs = [
        { key: '123', value: '123' },
        { key: '234', value: { type: 'some.random.dvType' } },
        { key: '345', value: { type: 'com.luckymarmot.RequestVariableDynamicValue' } }
      ]
      const expected = [
        '123',
        '234',
        '456'
      ]

      const actual = inputs.map(input => {
        return __internals__.convertComponentEntryIntoStringOrParam(request, input)
      })
      expect(actual).toEqual(expected)
    })
  })

  describe('@mergeSequencialStrings', () => {
    it('should work', () => {
      const acc = []
      const inputs = [
        'to', ' concatenate', 123, 'and', ' this', ' too'
      ]
      const expected = [ 'to concatenate', 123, 'and this too' ]
      const actual = inputs.reduce(__internals__.mergeSequencialStrings, acc)
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertStringOrParameterIntoParameter', () => {
    it('should work', () => {
      const inputs = [
        'test', 123
      ]
      const expected = [ new Parameter({ type: 'string', default: 'test' }), 123 ]
      const actual = inputs.map(__internals__.convertStringOrParameterIntoParameter)
      expect(actual).toEqual(expected)
    })
  })

  describe('@createDefaultPathEndpoint', () => {
    it('should work', () => {
      const expected = new URL().set('pathname', new URLComponent({
        componentName: 'pathname',
        string: '',
        parameter: new Parameter({
          key: 'pathname',
          in: 'path',
          type: 'string',
          default: '/'
        })
      }))

      const actual = __internals__.createDefaultPathEndpoint()
      expect(actual).toEqual(expected)
    })
  })

  describe('@insertEmptyParameterIfNeeded', () => {
    it('should work', () => {
      const inputs = [
        [ new Parameter({ key: 123 }) ],
        [ new Parameter() ]
      ]
      const expected = [
        [ new Parameter({ type: 'string', default: '' }), new Parameter({ key: 123 }) ],
        [ new Parameter() ]
      ]
      const actual = inputs.map(__internals__.insertEmptyParameterIfNeeded)
      expect(actual).toEqual(expected)
    })
  })

  describe('@createPathEndpoint', () => {
    it('should work', () => {
      const input = [ 123, 123, 123 ]
      const expected = new URL().set('pathname', new URLComponent({
        componentName: 'pathname',
        string: '',
        parameter: new Parameter({
          key: 'pathname',
          in: 'path',
          type: 'string',
          superType: 'sequence',
          value: List(input)
        })
      }))
      const actual = __internals__.createPathEndpoint(input)
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertPathComponentsIntoPathEndpoint', () => {
    it('should work if underlying methods are correct', () => {
      spyOn(__internals__, 'convertComponentEntryIntoStringOrParam').andReturn(345)
      spyOn(__internals__, 'mergeSequencialStrings').andReturn([ 456, 456, 456 ])
      spyOn(__internals__, 'convertStringOrParameterIntoParameter').andReturn(567)
      spyOn(__internals__, 'insertEmptyParameterIfNeeded').andReturn(678)
      spyOn(__internals__, 'createPathEndpoint').andReturn(234)

      const request = { reqId: 234 }
      const input = [ 123, 123, 123 ]
      const expected = 234
      const actual = __internals__.convertPathComponentsIntoPathEndpoint(request, input)

      expect(__internals__.convertComponentEntryIntoStringOrParam.calls[0].arguments.slice(0, 2))
        .toEqual([ request, 123 ])
      expect(__internals__.mergeSequencialStrings.calls[1].arguments.slice(0, 2)).toEqual([
        [ 456, 456, 456 ], 345
      ])
      expect(__internals__.convertStringOrParameterIntoParameter.calls[0].arguments.slice(0, 1))
        .toEqual([ 456 ])
      expect(__internals__.insertEmptyParameterIfNeeded).toHaveBeenCalledWith([ 567, 567, 567 ])
      expect(__internals__.createPathEndpoint).toHaveBeenCalledWith(678)
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractResourceFromPawRequest', () => {
    it('should work if underlying methods are correct', () => {
      spyOn(__internals__, 'extractRequestMapFromPawRequest').andReturn(456)
      spyOn(__internals__, 'convertPathComponentsIntoPathEndpoint').andReturn(567)

      const context = {}
      const reference = new Reference({ type: 'endpoint', uuid: 345 })
      const input = { request: { id: 123 }, pathComponents: [ 234, 234, 234 ] }
      const expected = { key: 123, value: new Resource({
        endpoints: OrderedMap({ '345': reference }),
        path: 567,
        methods: 456
      }) }

      const actual = __internals__.extractResourceFromPawRequest(context, reference, input)
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertHostEntriesIntoHostVariableAndRequestEntries', () => {
    it('should work if underlying methods are correct', () => {
      spyOn(__internals__, 'extractBaseVariableAndPathComponentsFromRequest').andCall(
        (c, d, r, v) => v + 1
      )
      spyOn(__internals__, 'findBaseVariableForRequestEntries').andCall((acc, v) => {
        acc.hostVariable = 234
        acc.requestEntries.push(v * 2)
        return acc
      })

      const context = {}
      const defaultHost = 'echo.paw.cloud/users'
      const input = [ 123, 123, 123, 123 ]
      const expected = { hostVariable: 234, requestEntries: [ 248, 248, 248, 248 ] }
      const actual = __internals__.convertHostEntriesIntoHostVariableAndRequestEntries(
        context, defaultHost, input
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@createDefaultHostEndpoint', () => {
    it('should work', () => {
      const defaultHost = 'echo.paw.cloud/users'
      const input = [
        { urlObject: { protocol: 'http' } },
        { urlObject: { protocol: 'https' } },
        { urlObject: { protocol: 'http' } }
      ]

      const expected = {
        key: 'echo.paw.cloud/users',
        value: new URL({
          url: 'http://echo.paw.cloud/users'
        }).set('protocol', List([ 'http', 'https' ]))
      }
      const actual = __internals__.createDefaultHostEndpoint(defaultHost, input)
      expect(actual).toEqual(expected)
    })
  })

  describe('@getResourcesFromRequestEntries', () => {
    it('should work if underlying methods are correct', () => {
      spyOn(__internals__, 'extractResourceFromPawRequest').andCall((c, r, v) => v * 2)
      const context = {}
      const defaultHost = 'echo.paw.cloud/users'
      const hostVariable = null
      const input = [ 123, 123, 123, 123 ]
      const expected = [ 246, 246, 246, 246 ]
      const actual = __internals__.getResourcesFromRequestEntries(
        context, defaultHost, hostVariable, input
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertHostIntoResources', () => {
    it('should work if underlying methods are correct', () => {
      spyOn(__internals__, 'convertHostEntriesIntoHostVariableAndRequestEntries').andReturn({
        hostVariable: null,
        requestEntries: [ 456, 456, 456 ]
      })
      spyOn(__internals__, 'createDefaultHostEndpoint').andReturn(345)
      spyOn(__internals__, 'getResourcesFromRequestEntries').andReturn(234)

      const context = {}
      const input = { key: 'echo.paw.cloud/users', value: [ 123, 123, 123 ] }
      const expected = { resources: 234, variable: null, endpoint: 345 }
      const actual = __internals__.convertHostIntoResources(context, input)
      expect(actual).toEqual(expected)
    })
  })

  describe('@getVariableFromUuid', () => {
    it('should work', () => {
      const request = { getVariableById: () => 246 }
      const input = 123
      const expected = 246
      const actual = __internals__.getVariableFromUuid(request, input)
      expect(actual).toEqual(expected)
    })
  })

  describe('@isRequestVariableDynamicValue', () => {
    it('should work', () => {
      const inputs = [
        123,
        { type: 'some.random.DV' },
        { type: 'com.luckymarmot.RequestVariableDynamicValue' }
      ]
      const expected = [ false, false, true ]
      const actual = inputs.map(__internals__.isRequestVariableDynamicValue)
      expect(actual).toEqual(expected)
    })
  })

  describe('@isRequestVariableDS', () => {
    it('should work', () => {
      const inputs = [
        { length: 2, components: [ 1, 2 ] },
        { length: 1, components: [ 123 ] },
        { length: 1, components: [ { type: 'some.random.DV' } ] },
        { length: 1, components: [ { type: 'com.luckymarmot.RequestVariableDynamicValue' } ] },
        { length: 2, components: [ { type: 'com.luckymarmot.RequestVariableDynamicValue' } ] }
      ]
      const expected = [ false, false, false, true, false ]
      const actual = inputs.map(__internals__.isRequestVariableDS)
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertRequestVariableDVIntoParameter', () => {
    it('should work', () => {
      const variable = {
        name: 'userId',
        value: { getEvaluatedString: () => 123 },
        schema: 234,
        type: 345,
        description: 456
      }
      const request = { getVariableById: () => variable }
      const location = 'queries'
      const contexts = List([ 567, 567 ])
      const paramName = 'UserId'
      const input = { variableUUID: 678 }
      const expected = {
        key: 'UserId',
        value: new Parameter({
          in: 'queries',
          key: 'userId',
          name: 'userId',
          type: 345,
          description: 456,
          default: 123,
          constraints: List([
            new Constraint.JSONSchema(234)
          ]),
          applicableContexts: List([ 567, 567 ])
        })
      }

      const actual = __internals__.convertRequestVariableDVIntoParameter(
        request, location, contexts, input, paramName
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertRequestVariableDSIntoParameter', () => {
    it('should work if underlying methods are correct', () => {
      spyOn(__internals__, 'convertRequestVariableDVIntoParameter').andReturn(567)
      const request = {}
      const location = 123
      const contexts = 234
      const paramName = 345
      const input = { components: [ 456 ] }
      const expected = 567
      const actual = __internals__.convertRequestVariableDSIntoParameter(
        request, location, contexts, input, paramName)
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertStandardDSIntoParameter', () => {
    it('should work', () => {
      const location = 234
      const contexts = 345
      const paramName = 456
      const input = { getEvaluatedString: () => 123 }
      const expected = {
        key: 456,
        value: new Parameter({
          in: 234,
          key: 456,
          name: 456,
          type: 'string',
          default: 123,
          applicableContexts: 345
        })
      }
      const actual = __internals__.convertStandardDSIntoParameter(
        location, contexts, input, paramName)
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertParameterDynamicStringIntoParameter', () => {
    it('should work if underlying methods are correct (request variable)', () => {
      spyOn(__internals__, 'isRequestVariableDS').andReturn(true)
      spyOn(__internals__, 'convertRequestVariableDSIntoParameter').andReturn(567)
      spyOn(__internals__, 'convertStandardDSIntoParameter').andReturn(678)

      const request = {}
      const location = 123
      const contexts = 234
      const paramName = 345
      const input = 456
      const expected = 567
      const actual = __internals__.convertParameterDynamicStringIntoParameter(
        request, location, contexts, input, paramName)
      expect(actual).toEqual(expected)
    })

    it('should work if underlying methods are correct (not a request variable)', () => {
      spyOn(__internals__, 'isRequestVariableDS').andReturn(false)
      spyOn(__internals__, 'convertRequestVariableDSIntoParameter').andReturn(567)
      spyOn(__internals__, 'convertStandardDSIntoParameter').andReturn(678)

      const request = {}
      const location = 123
      const contexts = 234
      const paramName = 345
      const input = 456
      const expected = 678
      const actual = __internals__.convertParameterDynamicStringIntoParameter(
        request, location, contexts, input, paramName)
      expect(actual).toEqual(expected)
    })
  })

  describe('@isRequestBodyUrlEncoded', () => {
    it('should work', () => {
      const inputs = [
        { getHeaderByName: () => 'application/json' },
        { getHeaderByName: () => 'application/x-www-form-urlencoded' },
        { getHeaderByName: () => 'application/x-www-form-urlencoded; charset=utf-8' }
      ]
      const expected = [ false, true, true ]
      const actual = inputs.map(__internals__.isRequestBodyUrlEncoded)
      expect(actual).toEqual(expected)
    })
  })

  describe('@isRequestBodyMultipart', () => {
    it('should work', () => {
      const inputs = [
        { getHeaderByName: () => 'multipart/weird' },
        { getHeaderByName: () => 'multipart/form-data' },
        { getHeaderByName: () => 'multipart/form-data; charset=utf-8' }
      ]
      const expected = [ false, true, true ]
      const actual = inputs.map(__internals__.isRequestBodyMultipart)
      expect(actual).toEqual(expected)
    })
  })

  describe('@getContentTypeContexts', () => {
    it('should work', () => {
      const input = 'some/Content-Type'
      const expected = List([
        new Parameter({
          key: 'Content-Type',
          name: 'Content-Type',
          in: 'headers',
          type: 'string',
          constraints: List([
            new Constraint.Enum([ 'some/Content-Type' ])
          ])
        })
      ])
      const actual = __internals__.getContentTypeContexts(input)
      expect(actual).toEqual(expected)
    })
  })

  describe('@createDefaultArrayParameter', () => {
    it('should work', () => {
      const contexts = 234
      const input = 123
      const expected = {
        key: 123,
        value: new Parameter({
          key: 123,
          name: 123,
          in: 'body',
          type: 'array',
          format: 'multi',
          value: new Parameter({
            type: 'string'
          }),
          applicableContexts: 234
        })
      }
      const actual = __internals__.createDefaultArrayParameter(contexts, input)
      expect(actual).toEqual(expected)
    })
  })

  describe('@createUrlEncodedOrMultipartBodyParameters', () => {
    it('should work if underlying methods are correct', () => {
      spyOn(__internals__, 'createDefaultArrayParameter').andReturn({ key: 234, value: 345 })
      spyOn(__internals__, 'convertParameterDynamicStringIntoParameter').andReturn({
        key: 123, value: 456
      })

      const input = {
        toto: 123,
        titi: [ 234, 234 ]
      }
      const contexts = []
      const request = {}

      const expected = OrderedMap({
        '234': 345,
        '123': 456
      })

      const actual = __internals__.createUrlEncodedOrMultipartBodyParameters(
        input, contexts, request
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@createUrlEncodedBodyParameters', () => {
    it('should work', () => {
      spyOn(__internals__, 'createUrlEncodedOrMultipartBodyParameters').andReturn(234)
      const input = { getUrlEncodedBody: () => 123 }
      const expected = 234
      const actual = __internals__.createUrlEncodedBodyParameters(input)
      expect(actual).toEqual(expected)
    })
  })

  describe('@createMultipartBodyParameters', () => {
    it('should work', () => {
      spyOn(__internals__, 'createUrlEncodedOrMultipartBodyParameters').andReturn(234)
      const input = { getMultipartBody: () => 123 }
      const expected = 234
      const actual = __internals__.createMultipartBodyParameters(input)
      expect(actual).toEqual(expected)
    })
  })

  describe('@createStandardBodyParameters', () => {
    it('should work', () => {
      spyOn(__internals__, 'convertParameterDynamicStringIntoParameter').andReturn({
        key: 234, value: 345
      })
      const input = { getBody: () => 123 }
      const expected = OrderedMap({ '234': 345 })
      const actual = __internals__.createStandardBodyParameters(input)
      expect(actual).toEqual(expected)
    })
  })

  describe('@getBodyParameters', () => {
    it('should work if underlying methods are correct', () => {
      const urlEncoded = [ true, false, false ]
      const multipart = [ true, false ]
      spyOn(__internals__, 'isRequestBodyUrlEncoded').andCall(() => urlEncoded.shift())
      spyOn(__internals__, 'isRequestBodyMultipart').andCall(() => multipart.shift())

      spyOn(__internals__, 'createUrlEncodedBodyParameters').andReturn(123)
      spyOn(__internals__, 'createMultipartBodyParameters').andReturn(234)
      spyOn(__internals__, 'createStandardBodyParameters').andReturn(345)

      const inputs = [ 1, 2, 3 ]
      const expected = [ 123, 234, 345 ]
      const actual = inputs.map(__internals__.getBodyParameters)
      expect(actual).toEqual(expected)
    })
  })

  describe('@getHeadersMapFromRequest', () => {
    it('should work', () => {
      spyOn(__internals__, 'convertParameterDynamicStringIntoParameter').andReturn({
        key: '234',
        value: 345
      })
      const input = { getHeaders: () => ({ '123': 123 }) }
      const expected = OrderedMap({ '234': 345 })
      const actual = __internals__.getHeadersMapFromRequest(input)
      expect(actual).toEqual(expected)
    })

    it('should ignore Auth headers', () => {
      spyOn(__internals__, 'convertParameterDynamicStringIntoParameter').andReturn({
        key: '234',
        value: 345
      })
      const input = { getHeaders: () => ({ Authorization: 123 }) }
      const expected = OrderedMap()
      const actual = __internals__.getHeadersMapFromRequest(input)
      expect(actual).toEqual(expected)
    })
  })

  describe('@getQueriesMapFromRequest', () => {
    it('should work', () => {
      spyOn(__internals__, 'convertParameterDynamicStringIntoParameter').andReturn({
        key: '234',
        value: 345
      })
      const input = { getUrlParameters: () => ({ '123': 123 }) }
      const expected = OrderedMap({ '234': 345 })
      const actual = __internals__.getQueriesMapFromRequest(input)
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractParameterContainerFromRequest', () => {
    it('should work if underlying methods are correct', () => {
      spyOn(__internals__, 'getHeadersMapFromRequest').andReturn(123)
      spyOn(__internals__, 'getQueriesMapFromRequest').andReturn(234)
      spyOn(__internals__, 'getBodyParameters').andReturn(345)

      const input = { reqId: 123 }
      const expected = new ParameterContainer({ headers: 123, queries: 234, body: 345 })
      const actual = __internals__.extractParameterContainerFromRequest(input)
      expect(actual).toEqual(expected)
    })
  })

  describe('@getAuthNameFromOAuth2DV', () => {
    it('should work', () => {
      const inputs = [
        {},
        { grantType: 0 },
        { grantType: 1,
          authorizationURL: { getEvaluatedString: () => 'http://auth.paw.cloud/oauth' } }
      ]
      const expected = [
        'oauth_2_auth',
        'oauth_2_code_auth',
        'oauth_2_paw_implicit_auth'
      ]
      const actual = inputs.map(__internals__.getAuthNameFromOAuth2DV)
      expect(actual).toEqual(expected)
    })
  })

  describe('@getAuthNameFromAuthDV', () => {
    it('should work if underlying methods are correct', () => {
      const envVar = [ false, false, false, true ]
      const reqVar = [ false, false, true, false ]

      spyOn(__internals__, 'isEnvironmentVariable').andCall(() => envVar.shift())
      spyOn(__internals__, 'isRequestVariableDynamicValue').andCall(() => reqVar.shift())

      const context = { getEnvironmentVariableById: () => {} }
      spyOn(context, 'getEnvironmentVariableById').andReturn({ name: 123 })

      const request = { getVariableById: () => {} }
      spyOn(request, 'getVariableById').andReturn(789)
      spyOn(__internals__, 'getAuthNameFromAuth').andReturn(234)
      spyOn(__internals__, 'getAuthNameFromOAuth2DV').andReturn(345)

      const inputs = [
        {},
        { type: 'com.luckymarmot.OAuth2DynamicValue' },
        {},
        {}
      ]
      const expected = [
        null,
        345,
        234,
        123
      ]
      const actual = inputs.map(input => {
        return __internals__.getAuthNameFromAuthDV(context, request, input)
      })
      expect(actual).toEqual(expected)
    })
  })

  describe('@getAuthNameFromAuthString', () => {
    it('should work', () => {
      const inputs = [
        { getEvaluatedString: () => 'Basic 12fb43bf1b2eb==' },
        { getEvaluatedString: () => 'Digest realm=123' },
        { getEvaluatedString: () => 'Hawk someVars' },
        { getEvaluatedString: () => 'AWS4-HMAC-SHA256 stuff' },
        { getEvaluatedString: () => 'OAuth version=1' },
        { getEvaluatedString: () => 'Bearer 1251f21f21bceb123a123' }
      ]
      const expected = [
        'basic_auth',
        'digest_auth',
        'hawk_auth',
        'aws_sig4_auth',
        'oauth_1_auth',
        'oauth_2_auth'
      ]
      const actual = inputs.map(__internals__.getAuthNameFromAuthString)
      expect(actual).toEqual(expected)
    })
  })

  describe('@getAuthNameFromAuth', () => {
    it('should work if underlying methods are correct', () => {
      spyOn(__internals__, 'getAuthNameFromAuthDV').andCall((c, r, dv) => dv.name)
      spyOn(__internals__, 'getAuthNameFromAuthString').andReturn(123)

      const context = {}
      const request = {}
      const inputs = [
        { getOnlyDynamicValue: () => null },
        { getOnlyDynamicValue: () => ({ type: 'some.random.DV' }) },
        { getOnlyDynamicValue: () => ({ type: 'some.random.DV', name: 'auth_name' }) }
      ]

      const expected = [
        123,
        123,
        'auth_name'
      ]

      const actual = inputs.map((input) => {
        return __internals__.getAuthNameFromAuth(context, request, input)
      })

      expect(actual).toEqual(expected)
    })
  })

  describe('@extractAuthReferencesFromRequest', () => {
    it('should work if underlying methods are correct', () => {
      spyOn(__internals__, 'getAuthNameFromAuth').andReturn(123)

      const context = {}
      const inputs = [
        { getHeaderByName: () => { return null } },
        { getHeaderByName: () => { return 'someDynamicString' } }
      ]
      const expected = [
        List(),
        List([ new Reference({ type: 'auth', uuid: 123 }) ])
      ]

      const actual = inputs.map(input => {
        return __internals__.extractAuthReferencesFromRequest(context, input)
      })

      expect(actual).toEqual(expected)
    })
  })

  describe('@extractRequestMapFromPawRequest', () => {
    it('should work if underlying methods are correct', () => {
      spyOn(__internals__, 'extractParameterContainerFromRequest').andReturn(678)
      spyOn(__internals__, 'extractAuthReferencesFromRequest').andReturn(789)
      const context = {}
      const endpoints = { '123': 234 }
      const input = { id: 345, name: 456, description: 567, getMethod: () => 234 }
      const expected = OrderedMap({
        '234': new Request({
          id: 345,
          name: 456,
          description: 567,
          endpoints: OrderedMap({ '123': 234 }),
          method: 234,
          parameters: 678,
          auths: 789
        })
      })
      const actual = __internals__.extractRequestMapFromPawRequest(context, input, endpoints)
      expect(actual).toEqual(expected)
    })
  })

  describe('@groupResourcesVariablesAndEndpoints', () => {
    it('should work', () => {
      const inputs = [
        { resources: [ 123, 234, 345 ], variable: null, endpoint: 321 },
        { resources: [ 456, 567, 678 ], variable: 432, endpoint: null },
        { resources: [ 789, 890, 901 ], variable: 543, endpoint: 654 },
        { resources: [], variable: null, endpoint: null }
      ]
      const expected = {
        resources: [ 123, 234, 345, 456, 567, 678, 789, 890, 901 ],
        variables: [ 432, 543 ],
        endpoints: [ 321, 654 ]
      }
      const actual = inputs.reduce(
        __internals__.groupResourcesVariablesAndEndpoints,
        { resources: [], variables: [], endpoints: [] }
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractAuthFromOAuth2DV', () => {
    it('should work', () => {
      spyOn(__internals__, 'getAuthNameFromAuth').andReturn(567)

      const context = {}
      const request = {}
      const authDS = {}

      const inputs = [
        {
          authorizationURL: { getEvaluatedString: () => null },
          tokenURL: { getEvaluatedString: () => null },
          grantType: 0
        },
        {
          authorizationURL: { getEvaluatedString: () => null },
          tokenURL: { getEvaluatedString: () => 123 },
          grantType: 1
        },
        {
          authorizationURL: { getEvaluatedString: () => 234 },
          tokenURL: { getEvaluatedString: () => null },
          grantType: 2
        },
        {
          authorizationURL: { getEvaluatedString: () => 345 },
          tokenURL: { getEvaluatedString: () => 456 },
          grantType: 3
        }
      ]

      const expected = [
        {
          key: 567,
          value: new Auth.OAuth2({
            authName: 567,
            flow: 'accessCode'
          })
        },
        {
          key: 567,
          value: new Auth.OAuth2({
            authName: 567,
            tokenUrl: 123,
            flow: 'implicit'
          })
        },
        {
          key: 567,
          value: new Auth.OAuth2({
            authName: 567,
            authorizationUrl: 234,
            flow: 'password'
          })
        },
        {
          key: 567,
          value: new Auth.OAuth2({
            authName: 567,
            authorizationUrl: 345,
            tokenUrl: 456,
            flow: 'application'
          })
        }
      ]

      const actual = inputs.map(input => {
        return __internals__.extractAuthFromOAuth2DV(context, request, authDS, input)
      })
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractAuthFromDV', () => {
    it('should work if underlying methods are correct', () => {
      const envVars = [ false, false, false, true ]
      const reqVars = [ false, false, true, false ]
      spyOn(__internals__, 'isEnvironmentVariable').andCall(() => envVars.shift())
      spyOn(__internals__, 'isRequestVariableDynamicValue').andCall(() => reqVars.shift())

      spyOn(__internals__, 'extractAuthsFromRequest').andCall((c, r, v) => v)
      spyOn(__internals__, 'extractAuthFromOAuth2DV').andReturn(345)
      spyOn(__internals__, 'extractAuthFromAuthString').andReturn(456)

      const context = { getEnvironmentVariableById: () => ({ getCurrentValue: () => 123 }) }
      const request = { getVariableById: () => ({ value: 234 }) }
      const authDS = {}
      const inputs = [
        {},
        { type: 'com.luckymarmot.OAuth2DynamicValue' },
        {},
        {}
      ]

      const expected = [ 456, 345, 234, 123 ]
      const actual = inputs.map(input => {
        return __internals__.extractAuthFromDV(context, request, authDS, input)
      })
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractAuthFromAuthString', () => {
    it('should work', () => {
      const inputs = [
        { getEvaluatedString: () => 'Basic 12fb43bf1b2eb==' },
        { getEvaluatedString: () => 'Digest realm=123' },
        { getEvaluatedString: () => 'Hawk someVars' },
        { getEvaluatedString: () => 'AWS4-HMAC-SHA256 stuff' },
        { getEvaluatedString: () => 'OAuth version=1' },
        { getEvaluatedString: () => 'Bearer 1251f21f21bceb123a123' }
      ]
      const expected = [
        { key: 'basic_auth', value: new Auth.Basic({ authName: 'basic_auth' }) },
        { key: 'digest_auth', value: new Auth.Digest({ authName: 'digest_auth' }) },
        { key: 'hawk_auth', value: new Auth.Hawk({ authName: 'hawk_auth' }) },
        { key: 'aws_sig4_auth', value: new Auth.AWSSig4({ authName: 'aws_sig4_auth' }) },
        { key: 'oauth_1_auth', value: new Auth.OAuth1({ authName: 'oauth_1_auth' }) },
        { key: 'oauth_2_auth', value: new Auth.OAuth2({ authName: 'oauth_2_auth' }) }
      ]

      const actual = inputs.map(__internals__.extractAuthFromAuthString)

      expect(actual).toEqual(expected)
    })
  })

  describe('@extractAuthsFromRequest', () => {
    it('should work if underlying methods are correct', () => {
      spyOn(__internals__, 'extractAuthFromDV').andCall((c, r, d, v) => v * 2)
      spyOn(__internals__, 'extractAuthFromAuthString').andReturn(345)

      const inputs = [
        null,
        null,
        { getOnlyDynamicValue: () => null },
        { getOnlyDynamicValue: () => 123 }
      ]

      const authDSs = [
        { getOnlyDynamicValue: () => null },
        { getOnlyDynamicValue: () => 234 }
      ]

      const context = {}
      const request = { getHeaderByName: () => authDSs.shift() }

      const expected = [ 345, 468, 345, 246 ]
      const actual = inputs.map(input => {
        return __internals__.extractAuthsFromRequest(context, request, input)
      })
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractResources', () => {
    it('should work if underlying methods are correct', () => {
      spyOn(__internals__, 'extractCommonHostsFromRequests').andReturn([ 123, 123, 123 ])
      spyOn(__internals__, 'convertHostIntoResources').andReturn(234)
      spyOn(__internals__, 'groupResourcesVariablesAndEndpoints').andReturn({
        resources: [
          { key: 'abc', value: 123 },
          { key: 'def', value: 456 },
          { key: 'ghi', value: 789 }
        ],
        variables: 321,
        endpoints: 432
      })

      const context = {}
      const input = []
      const expected = {
        resources: OrderedMap({ abc: 123, def: 456, ghi: 789 }),
        variables: 321,
        endpoints: 432
      }

      const actual = __internals__.extractResources(context, input)
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractStore', () => {
    it('should work if underlying methods are correct', () => {
      spyOn(__internals__, 'extractAuthsFromRequest').andCall((c, r) => {
        const v = r.getHeaderByName()
        return { key: v, value: 2 * v }
      })

      const context = {}
      const variables = [
        { key: 'abc', value: 123 },
        { key: 'def', value: 456 }
      ]
      const endpoints = [
        { key: 'adf', value: 147 },
        { key: 'fed', value: 654 }
      ]
      const input = [
        { getHeaderByName: () => null },
        { getHeaderByName: () => 123 },
        { getHeaderByName: () => 234 }
      ]

      const expected = new Store({
        variable: OrderedMap({ abc: 123, def: 456 }),
        endpoint: OrderedMap({ adf: 147, fed: 654 }),
        auth: OrderedMap({ '123': 246, '234': 468 })
      })

      const actual = __internals__.extractStore(context, variables, endpoints, input)
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractResourcesAndStore', () => {
    it('should work if underlying methods are correct', () => {
      spyOn(__internals__, 'extractResources').andReturn({ resources: 123 })
      spyOn(__internals__, 'extractStore').andReturn(234)

      const context = {}
      const input = []
      const expected = { resources: 123, store: 234 }

      const actual = __internals__.extractResourcesAndStore(context, input)
      expect(actual).toEqual(expected)
    })
  })

  describe('@parse', () => {
    it('should work if underlying methods are correct', () => {
      spyOn(__internals__, 'extractInfo').andReturn(123)
      spyOn(__internals__, 'extractGroup').andReturn(234)
      spyOn(__internals__, 'extractResourcesAndStore').andReturn({ resources: 345, store: 456 })

      const options = { context: {}, reqs: [] }
      const input = { options }

      const expected = {
        options,
        api: new Api({
          info: 123,
          group: 234,
          resources: 345,
          store: 456
        })
      }

      const actual = __internals__.parse(input)
      expect(actual).toEqual(expected)
    })
  })
})
