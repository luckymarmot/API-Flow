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

        const serializer = new Serializer()
        const actual = serializer.serialize()

        expect(__internals__.serialize).toHaveBeenCalled()
        expect(actual).toEqual(expected)
      })

      it('should call __internals__.serialize with the correct arguments', () => {
        const expected = 1234
        spyOn(__internals__, 'serialize').andReturn(expected)

        const input = '123412312'
        const serializer = new Serializer()
        const actual = serializer.serialize(input)

        expect(__internals__.serialize).toHaveBeenCalledWith(input)
        expect(actual).toEqual(expected)
      })
    })

    describe('@validate', () => {
      it('should call __internals__.validate', () => {
        const expected = 1234
        spyOn(__internals__, 'validate').andReturn(expected)

        const serializer = new Serializer()
        const actual = serializer.validate()

        expect(__internals__.validate).toHaveBeenCalled()
        expect(actual).toEqual(expected)
      })

      it('should call __internals__.validate with the correct arguments', () => {
        const expected = 1234
        spyOn(__internals__, 'validate').andReturn(expected)

        const input = '123412312'
        const serializer = new Serializer()
        const actual = serializer.validate(input)

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
        { swagger: 'v1.2' },
        { swagger: 'v2', info: {}, paths: {} },
        { swagger: 'v2', info: {}, paths: { '/a': 1, '/b': 2, '/c': 3 } },
        {
          swagger: 'v2', info: {},
          paths: { '/a': 1, '/b': 2, '/c': 3 },
          host: 'd', schemes: 'e'
        },
        {
          swagger: 'v2', info: {},
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
        swagger: 'v2',
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
      const expected = 'v2'
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
      const response = new Response({
        parameters: new ParameterContainer({
          headers: new OrderedMap({
            userId: new Parameter(),
            petId: new Parameter()
          })
        })
      })

      const expected = { '123': 321 }
      const actual = __internals__.getHeadersFromResponse(response)

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
      const entry = {
        key: 123,
        value: new Response({
          parameters: new ParameterContainer({
            headers: new OrderedMap({
              userId: new Parameter({ key: 'userId', type: 'string' }),
              petId: new Parameter({ key: 'userId', type: 'number' })
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

      const actual = __internals__.convertResponseRecordToResponseObject(entry)

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
        default: 'test'
      }

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
        description: 'test'
      })
      const key = 123

      const expected = {
        key,
        value: {
          a: 321,
          description: 'test'
        }
      }

      const actual = __internals__.convertParameterToHeaderObject(parameter, key)
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
              level: 'request',
              description: 'a user related request'
            }),
            b: new Interface({
              name: 'pet',
              level: 'resource',
              description: 'a pet related request'
            }),
            c: new Interface({
              name: 'high-security',
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

  describe('@getConsumesEntry', () => {
    // TODO
  })
})
