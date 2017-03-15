/* eslint-disable max-nested-callbacks */
import expect, { spyOn, restoreSpies } from 'expect'
import { Record, OrderedMap, List } from 'immutable'

import Api from '../../../../models/Api'
import Info from '../../../../models/Info'
import Contact from '../../../../models/Contact'
import License from '../../../../models/License'
import Reference from '../../../../models/Reference'
import Parameter from '../../../../models/Parameter'
import Resource from '../../../../models/Resource'
import URL from '../../../../models/URL'
import Store from '../../../../models/Store'
import Constraint from '../../../../models/Constraint'
import ParameterContainer from '../../../../models/ParameterContainer'
import Response from '../../../../models/Response'
import Auth from '../../../../models/Auth'
import Interface from '../../../../models/Interface'
import Request from '../../../../models/Request'

import Serializer, { __internals__ } from '../Serializer'

describe('serializers/swagger/v2.0/Serializer.js', () => {
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
      const Test = Record({ a: 123, b: 234, c: 345 })
      const test = new Test({ a: 'abc', b: 987 })

      const keyMap = {
        newA: 'a',
        newC: 'c'
      }

      const expected = {
        newA: 'abc',
        newC: 345
      }

      const actual = __internals__.getKeysFromRecord(keyMap, test)

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

  describe('@getQualityScore', () => {
    it('should work', () => {
      const inputs = [
        {},
        { swagger: '1.2' },
        { swagger: '2.0', info: {}, paths: {} },
        { swagger: '2.0', info: {}, paths: { '/a': 1, '/b': 2, '/c': 3 } },
        {
          swagger: '2.0', info: {},
          paths: { '/a': 1, '/b': 2, '/c': 3 },
          host: 'd', schemes: 'e'
        },
        {
          swagger: '2.0', info: {},
          paths: { '/a': 1, '/b': 2, '/c': 3 },
          host: 'd', schemes: 'e',
          securityDefinitions: 'f', definitions: 'g', parameters: 'h'
        }
      ]

      const expected = [
        0,
        0,
        0,
        0.55,
        0.95,
        1
      ]

      const actual = inputs.map(__internals__.getQualityScore)

      expect(actual).toEqual(expected)
    })
  })

  describe('@validate', () => {
    it('should call parseJSONorYAML', () => {
      spyOn(__internals__, 'parseJSONorYAML').andReturn(null)

      const input = 'not-some-swagger-file'

      __internals__.validate(input)

      expect(__internals__.parseJSONorYAML).toHaveBeenCalledWith(input)
    })

    it('should call getQualityScore if input can be parsed', () => {
      const parsed = { some: 'fakeSwaggerFile' }
      spyOn(__internals__, 'parseJSONorYAML').andReturn(parsed)
      spyOn(__internals__, 'getQualityScore').andReturn(0)

      const input = 'not-some-swagger-file'

      __internals__.validate(input)

      expect(__internals__.getQualityScore).toHaveBeenCalledWith(parsed)
    })

    it('should work', () => {
      const input = JSON.stringify({
        swagger: '2.0',
        info: { title: 'some swagger file' },
        paths: {
          '/root': {
            get: {}
          }
        },
        host: 'some.host.com',
        schemes: [ 'https' ]
      })

      const expected = 0.7
      const actual = __internals__.validate(input)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getSwaggerFormatObject', () => {
    it('should work', () => {
      const expected = '2.0'
      const actual = __internals__.getSwaggerFormatObject()

      expect(actual).toEqual(expected)
    })
  })

  describe('@getDefaultInfoObject', () => {
    it('should work', () => {
      const expected = {
        title: 'Unknown API',
        version: 'v0.0.0'
      }
      const actual = __internals__.getDefaultInfoObject()

      expect(actual).toEqual(expected)
    })
  })

  describe('@getDefaultContactObject', () => {
    it('should work', () => {
      const expected = {}
      const actual = __internals__.getDefaultContactObject()

      expect(actual).toEqual(expected)
    })
  })

  describe('@getContactObject', () => {
    it('should call getDefaultContactObject if no contact', () => {
      spyOn(__internals__, 'getDefaultContactObject').andReturn(123)

      const expected = 123
      const actual = __internals__.getContactObject(new Info())

      expect(__internals__.getDefaultContactObject).toHaveBeenCalled()
      expect(actual).toEqual(expected)
    })

    it('should work', () => {
      const input = new Info({
        contact: new Contact({
          name: 'someName',
          url: 'someUrl',
          email: 'someEmail'
        })
      })

      const expected = {
        name: 'someName',
        url: 'someUrl',
        email: 'someEmail'
      }
      const actual = __internals__.getContactObject(input)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getDefaultLicenseObject', () => {
    it('should work', () => {
      const expected = {
        name: 'informal'
      }
      const actual = __internals__.getDefaultLicenseObject()

      expect(actual).toEqual(expected)
    })
  })

  describe('@getLicenseObject', () => {
    it('should call getDefaultLicenseObject if no license', () => {
      spyOn(__internals__, 'getDefaultLicenseObject').andReturn(123)

      const expected = 123
      const actual = __internals__.getLicenseObject(new Info())

      expect(__internals__.getDefaultLicenseObject).toHaveBeenCalled()
      expect(actual).toEqual(expected)
    })

    it('should work', () => {
      const input = new Info({
        license: new License({
          name: 'someName',
          url: 'someUrl'
        })
      })

      const expected = {
        name: 'someName',
        url: 'someUrl'
      }
      const actual = __internals__.getLicenseObject(input)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getInfoObject', () => {
    it('should call getDefaultInfoObject if no Info', () => {
      spyOn(__internals__, 'getDefaultInfoObject').andReturn(123)

      const expected = 123
      const actual = __internals__.getInfoObject(
        new Api({
          info: null
        })
      )

      expect(__internals__.getDefaultInfoObject).toHaveBeenCalled()
      expect(actual).toEqual(expected)
    })

    it('should call getContactObject if info has contact', () => {
      spyOn(__internals__, 'getContactObject').andReturn(123)
      const input = new Api({
        info: new Info({
          contact: new Contact()
        })
      })

      __internals__.getInfoObject(input)

      expect(__internals__.getContactObject).toHaveBeenCalled()
    })

    it('should call getLicenseObject if info has license', () => {
      spyOn(__internals__, 'getLicenseObject').andReturn(123)
      const input = new Api({
        info: new Info({
          license: new License()
        })
      })

      __internals__.getInfoObject(input)

      expect(__internals__.getLicenseObject).toHaveBeenCalled()
    })

    it('should work', () => {
      const input = new Api({
        info: new Info({
          title: 'some api',
          description: 'some description',
          tos: 'some tos',
          version: 'v1',
          contact: new Contact({
            name: 'alex'
          }),
          license: new License({
            name: 'MIT'
          })
        })
      })

      const expected = {
        title: 'some api',
        description: 'some description',
        termsOfService: 'some tos',
        version: 'v1',
        contact: {
          name: 'alex'
        },
        license: {
          name: 'MIT'
        }
      }
      const actual = __internals__.getInfoObject(input)

      expect(actual).toEqual(expected)
    })
  })

  describe('@isReference', () => {
    it('should work', () => {
      const input = [
        new Reference(),
        new Parameter()
      ]

      const expected = [ true, false ]
      const actual = input.map(__internals__.isReference)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getEnpointsSharedByResource', () => {
    it('should work', () => {
      const input = new Resource({
        endpoints: new OrderedMap({
          test: new Reference(),
          notaref: new URL({
            url: 'https://echo.paw.cloud/base'
          })
        })
      })

      const expected = new OrderedMap({
        test: new Reference()
      })

      const actual = __internals__.getEnpointsSharedByResource(input)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getUuidOfReference', () => {
    it('should work', () => {
      const reference = new Reference({ uuid: 1234 })
      const expected = 1234
      const actual = __internals__.getUuidOfReference(reference)
      expect(actual).toEqual(expected)
    })
  })

  describe('@getMostCommonEndpoint', () => {
    it('should work', () => {
      const api = new Api({
        resources: new OrderedMap({
          a: new Resource({
            endpoints: new OrderedMap({
              '123': new Reference({ uuid: '123' }),
              '321': new Reference({ uuid: '321' })
            })
          }),
          b: new Resource({
            endpoints: new OrderedMap({
              '123': new Reference({ uuid: '123' }),
              '234': new Reference({ uuid: '234' })
            })
          }),
          c: new Resource({
            endpoints: new OrderedMap({
              '123': new Reference({ uuid: '123' }),
              '234': new Reference({ uuid: '234' })
            })
          }),
          d: new Resource({
            endpoints: new OrderedMap({
              '432': new Reference({ uuid: '432' }),
              '321': new Reference({ uuid: '321' })
            })
          })
        }),
        store: new Store({
          endpoint: new OrderedMap({
            '123': 'expectedValue',
            '321': 'incorrect',
            '234': 'incorrect',
            '432': 'incorrect'
          })
        })
      })

      const expected = 'expectedValue'
      const actual = __internals__.getMostCommonEndpoint(api)

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

  describe('@getSchemesFromEndpoint', () => {
    it('should work', () => {
      const endpoint = new URL({
        url: 'https://echo.paw.cloud/base'
      }).set('protocol', List([ 'https:', 'http:' ]))

      const expected = [ 'https', 'http' ]
      const actual = __internals__.getSchemesFromEndpoint(endpoint)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getHostAndBasePathFromEndpoint', () => {
    it('should work', () => {
      const endpoint = new URL({
        url: 'https://echo.paw.cloud/base'
      })

      const expected = {
        host: 'echo.paw.cloud',
        basePath: '/base'
      }
      const actual = __internals__.getHostAndBasePathFromEndpoint(endpoint)

      expect(actual).toEqual(expected)
    })

    it('should work without a basePath', () => {
      const endpoint = new URL({
        url: 'https://echo.paw.cloud'
      })

      const expected = {
        host: 'echo.paw.cloud',
        basePath: '/'
      }
      const actual = __internals__.getHostAndBasePathFromEndpoint(endpoint)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getEndpointRelatedObjects', () => {
    it('should work if all the expected underlying methods are correct', () => {
      spyOn(__internals__, 'getMostCommonEndpoint').andReturn(new URL())
      spyOn(__internals__, 'getSchemesFromEndpoint').andReturn([ 'wss' ])
      spyOn(__internals__, 'getHostAndBasePathFromEndpoint').andReturn({
        host: 'someHost',
        basePath: '/path'
      })

      const input = new Api()
      const expected = {
        schemes: [ 'wss' ],
        host: 'someHost',
        basePath: '/path'
      }
      const actual = __internals__.getEndpointRelatedObjects(input)

      expect(__internals__.getMostCommonEndpoint).toHaveBeenCalled()
      expect(__internals__.getSchemesFromEndpoint).toHaveBeenCalled()
      expect(__internals__.getHostAndBasePathFromEndpoint).toHaveBeenCalled()

      expect(actual).toEqual(expected)
    })
  })

  describe('@getDefinitions', () => {
    it('should work', () => {
      const api = new Api({
        store: new Store({
          constraint: new OrderedMap({
            ignored: new Constraint.Enum([ 1, 2, 3 ]),
            userId: new Constraint.JSONSchema({ type: 'integer', minimum: 0 }),
            petName: new Constraint.JSONSchema({ type: 'string', pattern: '^.{3,10}$' })
          })
        })
      })

      const expected = {
        userId: { type: 'integer', minimum: 0 },
        petName: { type: 'string', pattern: '^.{3,10}$' }
      }
      const actual = __internals__.getDefinitions(api)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getHeadersFromResponse', () => {
    it('should work if underlying methods are correct', () => {
      spyOn(__internals__, 'convertParameterToHeaderObject').andReturn({
        key: 123,
        value: 321
      })

      const store = new Store()
      const response = new Response({
        parameters: new ParameterContainer({
          headers: new OrderedMap({
            userId: new Parameter(),
            petId: new Parameter()
          })
        })
      })

      const expected = { '123': 321 }
      const actual = __internals__.getHeadersFromResponse(store, response)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getSchemaFromResponse', () => {
    it('should work', () => {
      const expected = {
        type: 'string',
        maxLength: 100
      }

      const response = new Response({
        parameters: new ParameterContainer({
          body: new OrderedMap({
            '123': new Parameter({
              constraints: new List([
                new Constraint.JSONSchema(expected)
              ])
            })
          })
        })
      })

      const actual = __internals__.getSchemaFromResponse(response)

      expect(actual).toEqual(expected)
    })
  })

  describe('@convertResponseRecordToResponseObject', () => {
    it('should work', () => {
      const store = new Store()
      const entry = {
        key: 123,
        value: new Response({
          parameters: new ParameterContainer({
            headers: new OrderedMap({
              userId: new Parameter({ key: 'userId', type: 'string' }),
              petId: new Parameter({ key: 'petId', type: 'number' })
            }),
            body: new OrderedMap({
              '123': new Parameter({
                constraints: new List([
                  new Constraint.JSONSchema({ type: 'string', maxLength: '140' })
                ])
              })
            })
          })
        })
      }

      const expectedValue = {
        description: 'no description was provided for this response',
        headers: {
          userId: { type: 'string' },
          petId: { type: 'number' }
        },
        schema: {
          type: 'string',
          maxLength: '140'
        }
      }

      const expected = {
        key: 123,
        value: expectedValue
      }

      const actual = __internals__.convertResponseRecordToResponseObject(store, entry)

      /* the objects are not really equal, as the actual object has many undefined fields, like
      * maximum
      */
      expect(JSON.stringify(actual)).toEqual(JSON.stringify(expected))
    })
  })

  describe('@getResponseDefinitions', () => {
    it('should work if underlying methods are correct', () => {
      spyOn(__internals__, 'convertResponseRecordToResponseObject').andReturn({ key: 12, value: 1 })

      const input = new Api({
        store: new Store({
          response: new OrderedMap({
            a: new Response(),
            b: new Response()
          })
        })
      })
      const expected = { '12': 1 }
      const actual = __internals__.getResponseDefinitions(input)
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertBasicAuth', () => {
    it('should work', () => {
      const input = new Auth.Basic({
        authName: 'basic_auth',
        description: 'basic auth desc'
      })
      const expected = {
        key: 'basic_auth',
        value: {
          type: 'basic',
          description: 'basic auth desc'
        }
      }

      const actual = __internals__.convertBasicAuth(input)

      expect(actual).toEqual(expected)
    })
  })

  describe('@convertApiKeyAuth', () => {
    it('should work', () => {
      const input = new Auth.ApiKey({
        authName: 'apikey_auth',
        description: 'apikey auth desc',
        name: 'api_key',
        in: 'query'
      })
      const expected = {
        key: 'apikey_auth',
        value: {
          type: 'apiKey',
          description: 'apikey auth desc',
          name: 'api_key',
          in: 'query'
        }
      }

      const actual = __internals__.convertApiKeyAuth(input)

      expect(actual).toEqual(expected)
    })
  })

  describe('@convertOAuth2Auth', () => {
    it('should work', () => {
      const input = new Auth.OAuth2({
        authName: 'oauth2_auth',
        description: 'oauth 2 auth desc',
        flow: 'implicit',
        authorizationUrl: 'authurl',
        tokenUrl: 'tokenurl',
        scopes: List([ { key: 'write:self', value: 'some desc' } ])
      })
      const expected = {
        key: 'oauth2_auth',
        value: {
          type: 'oauth2',
          description: 'oauth 2 auth desc',
          flow: 'implicit',
          authorizationUrl: 'authurl',
          tokenUrl: 'tokenurl',
          scopes: {
            'write:self': 'some desc'
          }
        }
      }

      const actual = __internals__.convertOAuth2Auth(input)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getSecurityDefinitions', () => {
    it('should work', () => {
      const input = new Api({
        store: new Store({
          auth: new OrderedMap({
            basic_auth: new Auth.Basic({ authName: 'basic_auth' }),
            api_key_auth: new Auth.ApiKey({
              authName: 'api_key_auth',
              name: 'Api-Key',
              in: 'header'
            }),
            hawk_auth: new Auth.Hawk({ authName: 'hawk_auth' })
          })
        })
      })

      const expected = {
        basic_auth: {
          type: 'basic'
        },
        api_key_auth: {
          type: 'apiKey',
          name: 'Api-Key',
          in: 'header'
        }
      }

      const actual = __internals__.getSecurityDefinitions(input)

      expect(actual).toEqual(expected)
    })
  })

  describe('@convertParameterToSchemaParameter', () => {
    it('should work', () => {
      const input = new Parameter({
        type: 'string',
        constraints: List([ new Constraint.Enum([ 'test', 'fake' ]) ])
      })
      const key = 123

      const expected = {
        key,
        value: {
          in: 'body',
          required: false,
          name: 'body',
          schema: {
            type: 'string',
            enum: [ 'test', 'fake' ]
          }
        }
      }
      const actual = __internals__.convertParameterToSchemaParameter(input, key)
      expect(actual).toEqual(expected)
    })
  })

  describe('@isBodyParameter', () => {
    it('should return false if param not in body', () => {
      const input = new Parameter({
        in: 'header'
      })

      const expected = false
      const actual = __internals__.isBodyParameter(input)
      expect(actual).toEqual(expected)
    })

    it('should return true if param is in body and has no applicableContexts', () => {
      const input = new Parameter({
        in: 'body'
      })

      const expected = true
      const actual = __internals__.isBodyParameter(input)
      expect(actual).toEqual(expected)
    })

    it('should return false if param is in body and has ctxs that validate formData', () => {
      const input = new Parameter({
        in: 'body',
        applicableContexts: List([
          new Parameter({
            key: 'Content-Type',
            constraints: List([
              new Constraint.Enum([
                'application/x-www-form-urlencoded',
                'multipart/form-data'
              ])
            ])
          })
        ])
      })

      const expected = false
      const actual = __internals__.isBodyParameter(input)
      expect(actual).toEqual(expected)
    })
  })

  describe('@getParamLocation', () => {
    it('should work', () => {
      const inputs = [
        new Parameter({ in: 'body' }),
        new Parameter({ in: 'path' }),
        new Parameter({ in: 'headers' }),
        new Parameter({ in: 'queries' })
      ]

      const expected = [ 'formData', 'path', 'header', 'query' ]
      const actual = inputs.map(__internals__.getParamLocation)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getCommonFieldsFromParameter', () => {
    it('should work', () => {
      const input = new Parameter({
        type: 'string',
        default: 'test',
        constraints: List([
          new Constraint.ExclusiveMinimum(12),
          new Constraint.ExclusiveMaximum(42),
          new Constraint.MultipleOf(3),
          new Constraint.MinimumLength(3),
          new Constraint.MaximumLength(8),
          new Constraint.Pattern('[12]{5}'),
          new Constraint.MinimumItems(4),
          new Constraint.MaximumItems(6),
          new Constraint.UniqueItems(true),
          new Constraint.Enum([ 1, 2, 3, 4 ])
        ])
      })

      /* eslint-disable no-undefined */
      const expected = {
        type: 'string',
        minimum: 12,
        exclusiveMinimum: true,
        maximum: 42,
        exclusiveMaximum: true,
        multipleOf: 3,
        minLength: 3,
        maxLength: 8,
        pattern: '[12]{5}',
        minItems: 4,
        maxItems: 6,
        uniqueItems: true,
        enum: [ 1, 2, 3, 4 ],
        default: 'test',
        'x-real-type': undefined
      }
      /* eslint-enable no-undefined */

      const actual = __internals__.getCommonFieldsFromParameter(input)
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertParameterToItemsObject', () => {
    it('should work if underlying methods are correct', () => {
      spyOn(__internals__, 'getCommonFieldsFromParameter').andReturn(123)

      const input = '123'
      const expected = {
        value: 123
      }
      const actual = __internals__.convertParameterToItemsObject(input)

      expect(actual).toEqual(expected)
    })
  })

  describe('@convertParameterToHeaderObject', () => {
    it('should work if underlying methods are correct', () => {
      spyOn(__internals__, 'getCommonFieldsFromParameter').andReturn({ a: 321 })

      const parameter = new Parameter({
        key: 123,
        description: 'test'
      })

      const expected = {
        key: 123,
        value: {
          a: 321,
          description: 'test'
        }
      }

      const actual = __internals__.convertParameterToHeaderObject(parameter)
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertParameterToStandardParameter', () => {
    it('should work if underlying methods are correct', () => {
      spyOn(__internals__, 'getCommonFieldsFromParameter').andReturn({ a: 321 })

      const parameter = new Parameter({
        key: 'someParamName',
        description: 'test',
        required: true,
        in: 'headers'
      })
      const key = 123

      const expected = {
        key,
        value: {
          a: 321,
          description: 'test',
          name: 'someParamName',
          required: true,
          in: 'header'
        }
      }

      const actual = __internals__.convertParameterToStandardParameterObject(parameter, key)
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertParameterToParameterObject', () => {
    it('should work if underlying methods are correct, and param is body', () => {
      spyOn(__internals__, 'isBodyParameter').andReturn(true)
      spyOn(__internals__, 'convertParameterToSchemaParameter').andReturn(123)
      spyOn(__internals__, 'convertParameterToStandardParameterObject').andReturn(321)

      const param = new Parameter()
      const key = 1234

      const expected = 123
      const actual = __internals__.convertParameterToParameterObject(param, key)

      expect(actual).toEqual(expected)
    })

    it('should work if underlying methods are correct, and param is not body', () => {
      spyOn(__internals__, 'isBodyParameter').andReturn(false)
      spyOn(__internals__, 'convertParameterToSchemaParameter').andReturn(123)
      spyOn(__internals__, 'convertParameterToStandardParameterObject').andReturn(321)

      const param = new Parameter()
      const key = 1234

      const expected = 321
      const actual = __internals__.convertParameterToParameterObject(param, key)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getParameterDefinitions', () => {
    it('should work if underlying methods are correct', () => {
      spyOn(__internals__, 'isConsumesHeader').andReturn(false)
      spyOn(__internals__, 'isProducesHeader').andReturn(false)
      spyOn(__internals__, 'convertParameterToParameterObject').andReturn({
        key: 123,
        value: 321
      })

      const input = new Api({
        store: new Store({
          parameter: new OrderedMap({
            a: 'b'
          })
        })
      })

      const expected = { '123': 321 }
      const actual = __internals__.getParameterDefinitions(input)

      expect(actual).toEqual(expected)
    })
  })

  describe('@isUseableAsTag', () => {
    it('should work', () => {
      const inputs = [
        null,
        new Interface({ level: 'request' }),
        new Interface({ level: 'resource' }),
        new Interface({ level: 'auth' }),
        new Interface({ level: 'parameter' })
      ]

      const expected = [ false, true, true, false, false ]
      const actual = inputs.map(__internals__.isUseableAsTag)

      expect(actual).toEqual(expected)
    })
  })

  describe('@convertInterfaceToTagObject', () => {
    it('should work', () => {
      const input = new Interface({
        name: 'someItf',
        uuid: 'someItf',
        description: 'some desc'
      })

      const expected = {
        name: 'someItf',
        description: 'some desc'
      }
      const actual = __internals__.convertInterfaceToTagObject(input)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getTagDefinitions', () => {
    it('should work', () => {
      const api = new Api({
        store: new Store({
          interface: new OrderedMap({
            a: new Interface({
              name: 'user',
              uuid: 'user',
              level: 'request',
              description: 'a user related request'
            }),
            b: new Interface({
              name: 'pet',
              uuid: 'pet',
              level: 'resource',
              description: 'a pet related request'
            }),
            c: new Interface({
              name: 'high-security',
              uuid: 'high-security',
              level: 'auth',
              description: 'a security related auth'
            })
          })
        })
      })

      const expected = [
        {
          name: 'user',
          description: 'a user related request'
        },
        {
          name: 'pet',
          description: 'a pet related request'
        }
      ]

      const actual = __internals__.getTagDefinitions(api)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getPathFromResource', () => {
    it('should work', () => {
      const input = new Resource({
        path: new URL({
          url: '/my/path/{pathId}',
          variableDelimiters: List([ '{', '}' ])
        })
      })

      const expected = '/my/path/{pathId}'
      const actual = __internals__.getPathFromResource(input)

      expect(actual).toEqual(expected)
    })
  })

  describe('@convertInterfaceToTagString', () => {
    it('should work', () => {
      const input = new Reference({ uuid: 123 })
      const expected = 123
      const actual = __internals__.convertInterfaceToTagString(input)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getTagStrings', () => {
    it('should work', () => {
      const input = new Request({
        interfaces: new OrderedMap({
          a: new Interface({ uuid: 123 }),
          b: new Reference({ uuid: 321 })
        })
      })

      const expected = [ 123, 321 ]
      const actual = __internals__.getTagStrings(input)

      expect(actual).toEqual(expected)
    })
  })

  describe('@addTagsToOperation', () => {
    it('should work', () => {
      spyOn(__internals__, 'getTagStrings').andReturn([ 123, 321 ])

      const request = new Request()
      const operation = { tags: [ 234, 432 ] }

      const expected = { tags: [ 234, 432, 123, 321 ] }
      const actual = __internals__.addTagsToOperation(request, operation)

      expect(actual).toEqual(expected)
    })
  })

  describe('@equalSet', () => {
    it('should work', () => {
      const first = [ 1, 2, 3 ]
      const second = [ 1, 3, 2 ]

      const expected = true
      const actual = __internals__.equalSet(first, second)

      expect(actual).toEqual(expected)
    })
  })

  /* eslint-disable no-undefined */
  describe('@getConsumesEntry', () => {
    it('should return undefined if no global or local consumes', () => {
      spyOn(__internals__, 'getContentTypeFromFilteredParams').andReturn([])
      const globalConsumes = undefined
      const container = new ParameterContainer()

      const actual = __internals__.getConsumesEntry(globalConsumes, container)

      expect(actual).toNotExist()
    })

    it('should return undefined if local consumes equals global one', () => {
      spyOn(__internals__, 'getContentTypeFromFilteredParams').andReturn([ 'a', 'b' ])
      const globalConsumes = [ 'a', 'b' ]
      const container = new ParameterContainer()

      const actual = __internals__.getConsumesEntry(globalConsumes, container)

      expect(actual).toNotExist()
    })

    it('should return local if different from global', () => {
      spyOn(__internals__, 'getContentTypeFromFilteredParams').andReturn([ 'c', 'b' ])
      const globalConsumes = [ 'a', 'b' ]
      const container = new ParameterContainer()

      const expected = [ 'c', 'b' ]
      const actual = __internals__.getConsumesEntry(globalConsumes, container)

      expect(actual).toEqual(expected)
    })
  })
  /* eslint-enable no-undefined */

  /* eslint-disable no-undefined */
  describe('@getProducesEntry', () => {
    it('should return undefined if no global or local produces', () => {
      spyOn(__internals__, 'getContentTypeFromFilteredParams').andReturn([])
      const store = new Store()
      const request = new Request()
      const globalProduces = undefined

      const actual = __internals__.getProducesEntry(store, request, globalProduces)

      expect(actual).toNotExist()
    })

    it('should return undefined if local produces equals global one', () => {
      spyOn(__internals__, 'getContentTypeFromFilteredParams').andReturn([ 'a', 'b' ])
      const store = new Store()
      const request = new Request({
        responses: OrderedMap({
          '200': new Response({
            parameters: new ParameterContainer({
              headers: OrderedMap({ a: 'a', b: 'b' })
            })
          })
        })
      })

      const globalProduces = [ 'a', 'b' ]

      const actual = __internals__.getProducesEntry(store, request, globalProduces)

      expect(actual).toNotExist()
    })

    it('should return local if different from global', () => {
      spyOn(__internals__, 'getContentTypeFromFilteredParams').andReturn([ 'c', 'b' ])
      const store = new Store()
      const request = new Request({
        responses: OrderedMap({
          '200': new Response({
            parameters: new ParameterContainer({
              headers: OrderedMap({ c: 'c', d: 'd' })
            })
          })
        })
      })
      const globalProduces = [ 'a', 'b' ]

      const expected = [ 'c', 'b' ]
      const actual = __internals__.getProducesEntry(store, request, globalProduces)

      expect(actual).toEqual(expected)
    })
  })
  /* eslint-enable no-undefined */

  describe('@convertReferenceToParameterObject', () => {
    it('should work', () => {
      const input = new Reference({
        uuid: '1234'
      })

      const expected = {
        value: {
          $ref: '#/parameters/1234'
        }
      }
      const actual = __internals__.convertReferenceToParameterObject(input)

      expect(actual).toEqual(expected)
    })
  })

  describe('@convertReferenceOrParameterToParameterObject', () => {
    it('should call convertReferenceToParameterObject if input is reference', () => {
      spyOn(__internals__, 'convertReferenceToParameterObject').andReturn(123)

      const input = new Reference()
      const expected = 123
      const actual = __internals__.convertReferenceOrParameterToParameterObject(input)

      expect(__internals__.convertReferenceToParameterObject).toHaveBeenCalledWith(input)
      expect(actual).toEqual(expected)
    })

    it('should call convertParameterToParameterObject if input is parameter', () => {
      spyOn(__internals__, 'convertParameterToParameterObject').andReturn(321)

      const input = new Parameter()
      const key = 'abc'
      const expected = 321
      const actual = __internals__.convertReferenceOrParameterToParameterObject(input, key)

      expect(__internals__.convertParameterToParameterObject).toHaveBeenCalledWith(input, key)
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertParameterMapToParameterObjectArray', () => {
    it('should work if underlying methods are correct', () => {
      spyOn(__internals__, 'convertReferenceOrParameterToParameterObject').andReturn({ value: 123 })

      const params = new OrderedMap({
        a: 123,
        b: 321,
        c: 234
      })

      const expected = [ 123, 123, 123 ]
      const actual = __internals__.convertParameterMapToParameterObjectArray(params)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getParametersFromRequest', () => {
    it('should call convertParameterMapToParameterObjectArray for each container block', () =>{
      const test = { default: 123, in: 'formData' }
      spyOn(__internals__, 'convertParameterMapToParameterObjectArray').andReturn([ test ])

      const store = new Store()
      const request = new Request({
        parameters: new ParameterContainer()
      })

      const expected = [ test, test, test ]
      const actual = __internals__.getParametersFromRequest(store, request)

      expect(__internals__.convertParameterMapToParameterObjectArray.calls.length).toEqual(3)
      expect(actual).toEqual(expected)
    })

    it('should return only one body param', () => {
      let calls = 0
      const buffer = { c: 234 }
      const test = [ { a: 123, in: 'body' }, { b: 321, in: 'body' } ]
      spyOn(__internals__, 'convertParameterMapToParameterObjectArray').andCall(() => {
        calls += 1
        if (calls === 3) {
          return test
        }
        return buffer
      })

      const store = new Store()
      const request = new Request({
        parameters: new ParameterContainer()
      })

      const expected = [ buffer, buffer, { a: 123, in: 'body' } ]
      const actual = __internals__.getParametersFromRequest(store, request)

      expect(actual).toEqual(expected)
    })
  })

  describe('@convertReferenceToResponseObject', () => {
    it('should work', () => {
      const input = new Reference({ uuid: '1234' })
      const key = 'abc'
      const expected = {
        key,
        value: {
          $ref: '#/responses/1234'
        }
      }
      const actual = __internals__.convertReferenceToResponseObject(input, key)

      expect(actual).toEqual(expected)
    })
  })

  describe('@convertReferenceOrResponseRecordToResponseObject', () => {
    it('should call convertReferenceToResponseObject if input is reference', () => {
      spyOn(__internals__, 'convertReferenceToResponseObject').andReturn(123)
      const store = new Store()
      const input = new Reference()
      const key = 'abc'
      const expected = 123
      const actual = __internals__.convertReferenceOrResponseRecordToResponseObject(
        store, input, key
      )
      expect(__internals__.convertReferenceToResponseObject).toHaveBeenCalledWith(input, key)
      expect(actual).toEqual(expected)
    })

    it('should call convertResponseRecordToResponseObject if input is response', () => {
      spyOn(__internals__, 'convertResponseRecordToResponseObject').andReturn(123)
      const store = new Store()
      const input = new Response()
      const key = 'abc'
      const expected = 123
      const actual = __internals__.convertReferenceOrResponseRecordToResponseObject(
        store, input, key
      )
      expect(__internals__.convertResponseRecordToResponseObject)
        .toHaveBeenCalledWith(store, { value: input, key })
      expect(actual).toEqual(expected)
    })
  })

  describe('@getResponsesFromRequest', () => {
    it('should work if underlying methods are correct', () => {
      spyOn(__internals__, 'convertReferenceOrResponseRecordToResponseObject')
        .andReturn({ key: 'abc', value: 123 })

      const store = new Store()
      const request = new Request({
        responses: new OrderedMap({
          a: 234,
          b: 345
        })
      })

      const expected = { abc: 123 }
      const actual = __internals__.getResponsesFromRequest(store, request)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getSchemesFromRequestEndpointOverlay', () => {
    it('should return undefined if request has no endpoints', () => {
      const request = new Request()
      const actual = __internals__.getSchemesFromRequestEndpointOverlay(request)
      expect(actual).toNotExist()
    })

    it('should return undefined if request has multiple endpoints', () => {
      const request = new Request({
        endpoints: new OrderedMap({
          a: 123,
          b: 321
        })
      })

      const actual = __internals__.getSchemesFromRequestEndpointOverlay(request)
      expect(actual).toNotExist()
    })

    it('should return undefined if endpoint has no overlay', () => {
      const request = new Request({
        endpoints: new OrderedMap({
          a: new Reference({ uuid: 'a' })
        })
      })

      const actual = __internals__.getSchemesFromRequestEndpointOverlay(request)
      expect(actual).toNotExist()
    })

    it('should work otherwise', () => {
      const request = new Request({
        endpoints: new OrderedMap({
          a: new Reference({
            uuid: 'a',
            overlay: new URL({
              url: 'https://someHost.com/'
            }).set('protocol', List([ 'https:', 'http' ]))
          })
        })
      })

      const expected = [ 'https', 'http' ]
      const actual = __internals__.getSchemesFromRequestEndpointOverlay(request)
      expect(actual).toEqual(expected)
    })
  })

  describe('@getSecurityRequirementForBasicOrApiKeyAuth', () => {
    it('should work', () => {
      const name = 'basic_auth'
      const expected = {
        basic_auth: []
      }
      const actual = __internals__.getSecurityRequirementForBasicOrApiKeyAuth(name)
      expect(actual).toEqual(expected)
    })
  })

  describe('@getSecurityRequirementForOAuth2Auth', () => {
    it('should work', () => {
      const name = 'petstore_auth'
      const reference = new Reference({
        overlay: new Auth.OAuth2({
          scopes: List([ { key: 'write:self' } ])
        })
      })

      const expected = {
        petstore_auth: [ 'write:self' ]
      }
      const actual = __internals__.getSecurityRequirementForOAuth2Auth(name, reference)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getSecurityRequirementFromReference', () => {
    it('should call getSecurityRequirementForBasicOrApiKeyAuth if referenced auth is basic', () => {
      spyOn(__internals__, 'getSecurityRequirementForBasicOrApiKeyAuth').andReturn(123)

      const store = new Store({
        auth: new OrderedMap({
          abc: new Auth.Basic()
        })
      })
      const reference = new Reference({ uuid: 'abc' })

      const expected = 123
      const actual = __internals__.getSecurityRequirementFromReference(store, reference)

      expect(__internals__.getSecurityRequirementForBasicOrApiKeyAuth).toHaveBeenCalled()
      expect(actual).toEqual(expected)
    })

    it('should call getSecurityRequirementForBasicOrApiKeyAuth if refed auth is api-key', () => {
      spyOn(__internals__, 'getSecurityRequirementForBasicOrApiKeyAuth').andReturn(123)

      const store = new Store({
        auth: new OrderedMap({
          abc: new Auth.ApiKey()
        })
      })
      const reference = new Reference({ uuid: 'abc' })

      const expected = 123
      const actual = __internals__.getSecurityRequirementFromReference(store, reference)

      expect(__internals__.getSecurityRequirementForBasicOrApiKeyAuth).toHaveBeenCalled()
      expect(actual).toEqual(expected)
    })

    it('should call getSecurityRequirementForOAuth2Auth if referenced auth is oauth2', () => {
      spyOn(__internals__, 'getSecurityRequirementForOAuth2Auth').andReturn(123)

      const store = new Store({
        auth: new OrderedMap({
          abc: new Auth.OAuth2()
        })
      })
      const reference = new Reference({ uuid: 'abc' })

      const expected = 123
      const actual = __internals__.getSecurityRequirementFromReference(store, reference)

      expect(__internals__.getSecurityRequirementForOAuth2Auth).toHaveBeenCalled()
      expect(actual).toEqual(expected)
    })

    it('should return null if auth not supported', () => {
      const store = new Store({
        auth: new OrderedMap({
          abc: new Auth.Hawk()
        })
      })
      const reference = new Reference({ uuid: 'abc' })

      const expected = null
      const actual = __internals__.getSecurityRequirementFromReference(store, reference)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getSecurityRequirementsFromRequest', () => {
    it('should work if underlying methods are correct', () => {
      spyOn(__internals__, 'getSecurityRequirementFromReference').andReturn(123)

      const request = new Request({
        auths: new List([
          new Reference(),
          new Reference(),
          'ignored because not a Reference',
          new Reference()
        ])
      })

      const expected = [ 123, 123, 123 ]
      const actual = __internals__.getSecurityRequirementsFromRequest(null, request)

      expect(actual).toEqual(expected)
    })
  })

  describe('@convertRequestToOperationObject', () => {
    it('should work if underlying methods are correct', () => {
      spyOn(__internals__, 'getTagStrings').andReturn([ 'pet', 'store' ])
      spyOn(__internals__, 'getKeysFromRecord').andReturn({
        summary: 'update a Pet',
        description: 'updates a pet with some params',
        operationId: 'updatePet'
      })

      spyOn(__internals__, 'getConsumesEntry').andReturn([ 'application/json' ])
      spyOn(__internals__, 'getProducesEntry').andReturn([ 'application/xml' ])
      spyOn(__internals__, 'getParametersFromRequest').andReturn([ {
        in: 'query',
        name: 'petId',
        type: 'string'
      } ])
      spyOn(__internals__, 'getSchemesFromRequestEndpointOverlay').andReturn([ 'https' ])
      spyOn(__internals__, 'getSecurityRequirementsFromRequest').andReturn([
        {
          petstore_auth: [ 'write:self' ]
        }
      ])
      spyOn(__internals__, 'getResponsesFromRequest').andReturn({
        '200': {
          description: 'this method should return 200'
        }
      })

      const store = new Store()
      const globalInfo = {}
      const request = new Request()
      const key = '/some/path'

      const expectedValue = {
        tags: [ 'pet', 'store' ],
        summary: 'update a Pet',
        description: 'updates a pet with some params',
        operationId: 'updatePet',
        consumes: [ 'application/json' ],
        produces: [ 'application/xml' ],
        parameters: [
          {
            in: 'query',
            name: 'petId',
            type: 'string'
          }
        ],
        schemes: [ 'https' ],
        security: [
          {
            petstore_auth: [ 'write:self' ]
          }
        ],
        responses: {
          '200': {
            description: 'this method should return 200'
          }
        }
      }

      const expected = { key, value: expectedValue }
      const actual = __internals__.convertRequestToOperationObject(store, globalInfo, request, key)

      expect(actual).toEqual(expected)
    })
  })

  describe('@convertResourceToPathItemObject', () => {
    it('should work if underlying methods are correct', () => {
      spyOn(__internals__, 'getPathFromResource').andReturn('/some/path')
      spyOn(__internals__, 'addPathParametersToOperation').andCall((r, v) => v)

      const store = new Store()
      const globalInfo = {}
      const resource = new Resource({
        methods: new OrderedMap({
          get: new Request(),
          post: new Request(),
          put: new Request()
        })
      })

      const expected = {
        key: '/some/path',
        value: {
          get: {
            responses: {
              default: {
                description: 'no response description was provided for this operation'
              }
            }
          },
          post: {
            responses: {
              default: {
                description: 'no response description was provided for this operation'
              }
            }
          },
          put: {
            responses: {
              default: {
                description: 'no response description was provided for this operation'
              }
            }
          }
        }
      }
      const actual = __internals__.convertResourceToPathItemObject(store, globalInfo, resource)
      expect(actual).toEqual(expected)
    })
  })

  describe('@getPathObject', () => {
    it('should work if underlying methods are correct', () => {
      spyOn(__internals__, 'convertResourceToPathItemObject').andReturn({ key: 'abc', value: 123 })
      const api = new Api({
        resources: new OrderedMap({
          a: new Resource()
        })
      })

      const expected = {
        abc: 123
      }

      const actual = __internals__.getPathObject(api)
      expect(actual).toEqual(expected)
    })
  })

  describe('isConsumesHeader', () => {
    it('should work', () => {
      const inputs = [
        new Parameter({
          key: 'Whatever'
        }),
        new Parameter({
          key: 'Content-Type',
          usedIn: 'response'
        }),
        new Parameter({
          key: 'Content-Type',
          usedIn: 'request',
          in: 'query'
        }),
        new Parameter({
          key: 'Content-Type',
          usedIn: 'request',
          in: 'headers'
        })
      ]

      const expected = [ false, false, false, true ]
      const actual = inputs.map(__internals__.isConsumesHeader)

      expect(actual).toEqual(expected)
    })
  })

  describe('isProducesHeader', () => {
    it('should work', () => {
      const inputs = [
        new Parameter({
          key: 'Whatever'
        }),
        new Parameter({
          key: 'Content-Type',
          usedIn: 'request'
        }),
        new Parameter({
          key: 'Content-Type',
          usedIn: 'response',
          in: 'query'
        }),
        new Parameter({
          key: 'Content-Type',
          usedIn: 'response',
          in: 'headers'
        })
      ]

      const expected = [ false, false, false, true ]
      const actual = inputs.map(__internals__.isProducesHeader)

      expect(actual).toEqual(expected)
    })
  })

  describe('@extractContentTypesFromParam', () => {
    it('should work', () => {
      const param = new Parameter({
        constraints: List([
          new Constraint.Enum([ 'application/json' ])
        ])
      })

      const expected = [ 'application/json' ]
      const actual = __internals__.extractContentTypesFromParam(param)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getGlobalConsumes', () => {
    it('should work if underlying methods are correct', () => {
      spyOn(__internals__, 'getContentTypeFromFilteredParams').andReturn([ 123 ])

      const api = new Api()
      const expected = [ 123 ]
      const actual = __internals__.getGlobalConsumes(api)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getGlobalProduces', () => {
    it('should work if underlying methods are correct', () => {
      spyOn(__internals__, 'getContentTypeFromFilteredParams').andReturn([ 123 ])

      const api = new Api()
      const expected = [ 123 ]
      const actual = __internals__.getGlobalProduces(api)

      expect(actual).toEqual(expected)
    })
  })

  describe('@createSwaggerObject', () => {
    it('should work if underlying methods are correct', () => {
      spyOn(__internals__, 'getSwaggerFormatObject').andReturn(123)
      spyOn(__internals__, 'getInfoObject').andReturn(321)
      spyOn(__internals__, 'getEndpointRelatedObjects').andReturn({
        schemes: 234,
        host: 432,
        basePath: 345
      })
      spyOn(__internals__, 'getGlobalConsumes').andReturn(543)
      spyOn(__internals__, 'getGlobalProduces').andReturn(456)
      spyOn(__internals__, 'getDefinitions').andReturn(654)
      spyOn(__internals__, 'getSecurityDefinitions').andReturn(567)
      spyOn(__internals__, 'getParameterDefinitions').andReturn(765)
      spyOn(__internals__, 'getResponseDefinitions').andReturn(678)
      spyOn(__internals__, 'getTagDefinitions').andReturn(876)
      spyOn(__internals__, 'getPathObject').andReturn(789)

      const api = new Api()
      const expected = {
        swagger: 123,
        info: 321,
        host: 432,
        schemes: 234,
        basePath: 345,
        consumes: 543,
        produces: 456,
        paths: 789,
        definitions: 654,
        parameters: 765,
        responses: 678,
        securityDefinitions: 567,
        tags: 876
      }
      const actual = __internals__.createSwaggerObject(api)
      expect(actual).toEqual(expected)
    })
  })

  describe('@serialize', () => {
    it('should work', () => {
      spyOn(__internals__, 'createSwaggerObject').andReturn({ a: 123 })
      const api = new Api()

      const expected = JSON.stringify({ a: 123 }, null, 2)
      const actual = __internals__.serialize(api)

      expect(actual).toEqual(expected)
    })
  })
})
