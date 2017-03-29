import Immutable from 'immutable'

import {
    UnitTest,
    registerTest,
    against,
    targets
} from '../../../utils/TestUtils'

import { ClassMock } from '../../../mocks/PawMocks'

import {
    Info, Contact, License
} from '../../../models/Utils'

import Auth from '../../../models/Auth'
import Constraint from '../../../models/Constraint'
import URL from '../../../models/URL'
import Request from '../../../models/Request'
import Context, {
    Body,
    Response,
    Parameter,
    ParameterContainer
} from '../../../models/Core'
import RAMLSerializer from '../Serializer'

import ReferenceContainer from '../../../models/references/Container'
import ExoticReference from '../../../models/references/Exotic'
import JSONSchemaReference from '../../../models/references/JSONSchema'

@registerTest
@against(RAMLSerializer)
export class TestRAMLSerializer extends UnitTest {

    @targets('serialize')
  testSerializeWithEmptyContext() {
    const s = this.__init()

    s.spyOn('_formatStructure', () => {
      return null
    })

    const input = new Context()

    const result = s.serialize(input)

    const expected =
            '#%RAML 0.8\n' +
            'null\n'

    this.assertEqual(expected, result)
  }

    @targets('_formatStructure')
  testFormatStructureWithEmptyContext() {
    const s = this.__init()

    s.spyOn('_formatBasicInfo', () => {
      return {}
    })

    s.spyOn('_formatURLInfo', () => {

    })

    const input = new Context()

    const result = s._formatStructure(input)

    const expected = null

    this.assertEqual(expected, result)
    this.assertEqual(s.spy._formatBasicInfo.count, 1)
    this.assertEqual(s.spy._formatURLInfo.count, 0)
  }

    @targets('_formatStructure')
  testFormatStructureWithSimpleContext() {
    const s = this.__init()

    s.spyOn('_formatBasicInfo', () => {
      return {
        baseUri: '{version}.uri.com',
        version: 'v1'
      }
    })

    s.spyOn('_formatURLInfo', () => {
      return {
        uriParameters: {
          value: 12
        }
      }
    })

    s.spyOn('_formatSecuritySchemes', () => {
      return {
        securitySchemes: true
      }
    })

    s.spyOn('_formatPaths', () => {
      return {
        '/a-path': 90
      }
    })

    const input = new Context({
      requests: new Immutable.OrderedMap({ a: 12 })
    })

    const expected = {
      baseUri: '{version}.uri.com',
      version: 'v1',
      uriParameters: {
        value: 12
      },
      securitySchemes: true,
      '/a-path': 90
    }

    const result = s._formatStructure(input)

    this.assertEqual(expected, result)
    this.assertEqual(s.spy._formatBasicInfo.count, 1)
    this.assertEqual(s.spy._formatURLInfo.count, 1)
    this.assertEqual(s.spy._formatSecuritySchemes.count, 1)
    this.assertEqual(s.spy._formatPaths.count, 1)
  }

    @targets('_formatBasicInfo')
  testFormatBasicInfoWithEmptyContext() {
    const s = this.__init()

    const input = new Context()

    const expected = {}

    const result = s._formatBasicInfo(input)

    this.assertEqual(expected, result)
    this.assertEqual(s.spy._formatContact.count, 0)
    this.assertEqual(s.spy._formatLicense.count, 0)
  }

    @targets('_formatBasicInfo')
  testFormatBasicInfoWithSimpleContextInfo() {
    const s = this.__init()

    const input = new Context({
      info: new Info({
        title: 'Test API',
        description: 'a simple description',
        tos: 'http://tos.api.com',
        version: 'v1'
      })
    })

    const expected = {
      title: 'Test API',
      documentation: [
        {
          title: 'Description',
          content: 'a simple description'
        },
        {
          title: 'Terms of Service',
          content: 'http://tos.api.com'
        }
      ],
      version: 'v1'
    }

    const result = s._formatBasicInfo(input)

    this.assertEqual(expected, result)
    this.assertEqual(s.spy._formatContact.count, 0)
    this.assertEqual(s.spy._formatLicense.count, 0)
  }

    @targets('_formatBasicInfo')
  testFormatBasicInfoWithContactContextInfo() {
    const s = this.__init()

    s.spyOn('_formatContact', () => {
      return 'name: test\nurl: contact.luckymarmot.com\n'
    })

    const input = new Context({
      info: new Info({
        title: 'Test API',
        description: 'a simple description',
        tos: 'http://tos.api.com',
        version: 'v1',
        contact: new Contact()
      })
    })

    const expected = {
      title: 'Test API',
      documentation: [
        {
          title: 'Description',
          content: 'a simple description'
        },
        {
          title: 'Terms of Service',
          content: 'http://tos.api.com'
        },
        {
          title: 'Contact',
          content: 'name: test\nurl: contact.luckymarmot.com\n'
        }
      ],
      version: 'v1'
    }

    const result = s._formatBasicInfo(input)

    this.assertEqual(expected, result)
    this.assertEqual(s.spy._formatContact.count, 1)
    this.assertEqual(s.spy._formatLicense.count, 0)
  }

    @targets('_formatBasicInfo')
  testFormatBasicInfoWithLicenseContextInfo() {
    const s = this.__init()

    s.spyOn('_formatLicense', () => {
      return 'name: MIT\nurl: license.luckymarmot.com\n'
    })

    const input = new Context({
      info: new Info({
        title: 'Test API',
        description: 'a simple description',
        tos: 'http://tos.api.com',
        version: 'v1',
        license: new License()
      })
    })

    const expected = {
      title: 'Test API',
      documentation: [
        {
          title: 'Description',
          content: 'a simple description'
        },
        {
          title: 'Terms of Service',
          content: 'http://tos.api.com'
        },
        {
          title: 'License',
          content: 'name: MIT\nurl: license.luckymarmot.com\n'
        }
      ],
      version: 'v1'
    }

    const result = s._formatBasicInfo(input)

    this.assertEqual(expected, result)
    this.assertEqual(s.spy._formatContact.count, 0)
    this.assertEqual(s.spy._formatLicense.count, 1)
  }

    @targets('_formatContact')
  testFormatContactWithEmptyContact() {
    const s = this.__init()

    const contact = new Contact()

    const expected = ''
    const result = s._formatContact(contact)

    this.assertEqual(expected, result)
  }

    @targets('_formatContact')
  testFormatContactWithRichContact() {
    const s = this.__init()

    const contact = new Contact({
      name: 'test',
      url: 'test.lucky.com',
      email: 'test@lucky.com'
    })

    const expected =
            'name: test\n' +
            'url: test.lucky.com\n' +
            'email: test@lucky.com\n'

    const result = s._formatContact(contact)

    this.assertEqual(expected, result)
  }

    @targets('_formatLicense')
  testFormatLicenseWithEmptyLicense() {
    const s = this.__init()

    const license = new License()

    const expected = ''
    const result = s._formatLicense(license)

    this.assertEqual(expected, result)
  }

    @targets('_formatLicense')
  testFormatLicenseWithRichLicense() {
    const s = this.__init()

    const license = new License({
      name: 'MIT',
      url: 'license.lucky.com'
    })

    const expected =
            'name: MIT\n' +
            'url: license.lucky.com\n'

    const result = s._formatLicense(license)

    this.assertEqual(expected, result)
  }

    @targets('_formatURLInfo')
  testFormatURLInfoWithEmptyRequestList() {
    const s = this.__init()
    const reqs = new Immutable.List()

    const expected = {}
    const result = s._formatURLInfo(reqs)

    this.assertEqual(expected, result)
    this.assertEqual(s.spy._updateProtocols.count, 0)
    this.assertEqual(s.spy._generateSequenceParam.count, 0)
    this.assertEqual(s.spy._formatURIParameters.count, 0)
  }

    @targets('_formatURLInfo')
  testFormatURLInfoWithTwoRequests() {
    const s = this.__init()

    s.spyOn('_updateProtocols', () => {
      return { http: true, https: true }
    })

    s.spyOn('_generateSequenceParam', () => {
      return 'test.luckymarmot.com'
    })

    s.spyOn('_formatURIParameters', () => {
      return [ { baseUriParameters: 42 }, 'v1' ]
    })

    const reqs = new Immutable.List([
      new Request(),
      new Request()
    ])

    const expected = {
      protocols: [ 'HTTP', 'HTTPS' ],
      baseUri: 'http://test.luckymarmot.com',
      version: 'v1',
      baseUriParameters: 42
    }

    const result = s._formatURLInfo(reqs)

    this.assertEqual(expected, result)
    this.assertEqual(s.spy._updateProtocols.count, 2)
    this.assertEqual(s.spy._generateSequenceParam.count, 1)
    this.assertEqual(s.spy._formatURIParameters.count, 1)
  }

    @targets('_updateProtocols')
  testUpdateProtocolsWithEmptyURL() {
    const s = this.__init()

    const protocols = {
      http: true
    }
    const url = new URL()

    const expected = {
      http: true
    }

    const result = s._updateProtocols(protocols, url)

    this.assertEqual(expected, result)
  }

    @targets('_updateProtocols')
  testUpdateProtocolsWithSimpleURL() {
    const s = this.__init()

    const protocols = {
      http: true
    }
    const url = new URL('https://luckymarmot.com')

    const expected = {
      http: true,
      https: true
    }

    const result = s._updateProtocols(protocols, url)

    this.assertEqual(expected, result)
  }

    @targets('_updateProtocols')
  testUpdateProtocolsWithSocketURL() {
    const s = this.__init()

    const protocols = {
      http: true
    }
    const url = new URL('wss://luckymarmot.com')

    const expected = {
      http: true
    }

    const result = s._updateProtocols(protocols, url)

    this.assertEqual(expected, result)
  }

    @targets('_generateSequenceParam')
  testGenerateSequenceParamWithSimpleParam() {
    const s = this.__init()

    const url = new URL({
      host: new Parameter({
        key: 'host',
        type: 'string',
        internals: new Immutable.List([
          new Constraint.Enum([
            'luckymarmot.com'
          ])
        ])
      })
    })

    const expected = 'luckymarmot.com'
    const result = s._generateSequenceParam(url, 'host')

    this.assertEqual(expected, result)
  }

    @targets('_generateSequenceParam')
  testGenerateSequenceParamWithSequenceParam() {
    const s = this.__init()

    const url = new URL({
      host: new Parameter({
        key: 'host',
        type: 'string',
        value: new Immutable.List([
          new Parameter({
            key: 'version',
            type: 'string',
            internals: new Immutable.List([
              new Constraint.Enum([ 'v0.8', 'v1' ])
            ])
          }),
          new Parameter({
            type: 'string',
            internals: new Immutable.List([
              new Constraint.Enum([ '.luckymarmot.' ])
            ])
          }),
          new Parameter({
            key: 'extension',
            type: 'string',
            internals: new Immutable.List([
              new Constraint.Enum([
                'com', 'co.uk', 'io'
              ])
            ])
          })
        ]),
        format: 'sequence'
      })
    })

    const expected = '{version}.luckymarmot.{extension}'
    const result = s._generateSequenceParam(url, 'host')

    this.assertEqual(expected, result)
  }

    @targets('_formatURIParameters')
  testFormatURIParametersWithSimpleParam() {
    const s = this.__init()

    const param = new Parameter({
      type: 'string',
      internals: new Immutable.List([
        new Constraint.Enum([ 'luckymarmot.com' ])
      ])
    })
    const target = 'baseUriParameters'

    const expected = [ {}, null ]
    const result = s._formatURIParameters(param, target)

    this.assertEqual(expected, result)
    this.assertEqual(s.spy._convertJSONSchemaToNamedParameter.count, 0)
  }

    @targets('_formatURIParameters')
  testFormatURIParametersWithSequenceParam() {
    const s = this.__init()

    s.spyOn('_convertJSONSchemaToNamedParameter', () => {
      return {
        extension: {
          displayName: 'extension',
          type: 'string',
          enum: [ 'com', 'co.uk', 'io' ]
        }
      }
    })

    const param = new Parameter({
      key: 'host',
      type: 'string',
      value: new Immutable.List([
        new Parameter({
          key: 'version',
          type: 'string',
          internals: new Immutable.List([
            new Constraint.Enum([ 'v1' ])
          ])
        }),
        new Parameter({
          type: 'string',
          internals: new Immutable.List([
            new Constraint.Enum([ '.luckymarmot.' ])
          ])
        }),
        new Parameter({
          key: 'extension',
          type: 'string',
          internals: new Immutable.List([
            new Constraint.Enum([
              'com', 'co.uk', 'io'
            ])
          ])
        })
      ]),
      format: 'sequence'
    })
    const target = 'baseUriParameters'

    const expected = [ {
      baseUriParameters: {
        extension: {
          displayName: 'extension',
          type: 'string',
          enum: [ 'com', 'co.uk', 'io' ]
        }
      }
    }, 'v1' ]
    const result = s._formatURIParameters(param, target)

    this.assertEqual(expected, result)
    this.assertEqual(s.spy._convertJSONSchemaToNamedParameter.count, 1)
  }

    @targets('_convertJSONSchemaToNamedParameter')
  testConvertJSONToNamedParameterWithSimpleSchema() {
    const s = this.__init()

    const schema = {}

        /* eslint-disable no-undefined */
    const expected = {
      null: {}
    }
        /* eslint-enable no-undefined */
    const result = s._convertJSONSchemaToNamedParameter(schema)

    this.assertEqual(expected, result)
  }

    @targets('_convertJSONSchemaToNamedParameter')
  testConvertJSONToNamedParameterWithRichSchema() {
    const s = this.__init()

    const schema = {
      'x-title': 'extension',
      type: 'string',
      enum: [ 'com', 'io' ],
      minimumLength: 2,
      maximumLength: 3
    }

    const expected = {
      extension: {
        displayName: 'extension',
        type: 'string',
        enum: [ 'com', 'io' ],
        minLength: 2,
        maxLength: 3
      }
    }
    const result = s._convertJSONSchemaToNamedParameter(schema)

    this.assertEqual(expected, result)
  }

    @targets('_convertJSONSchemaToNamedParameter')
  testConvertJSONToNamedParameterWithNumberSchema() {
    const s = this.__init()

    const schema = {
      'x-title': 'version',
      type: 'integer',
      minimum: 1,
      maximum: 4
    }

    const expected = {
      version: {
        displayName: 'version',
        type: 'integer',
        minimum: 1,
        maximum: 4
      }
    }
    const result = s._convertJSONSchemaToNamedParameter(schema)

    this.assertEqual(expected, result)
  }

    @targets('_convertParameterToNamedParameter')
  testConvertParameterToNamedParameterWithSimpleParam() {
    const s = this.__init()

    const param = new Parameter()

    const expected = {
      required: false
    }

    const result = s._convertParameterToNamedParameter(param)

    this.assertEqual(expected, result)
  }

    @targets('_convertParameterToNamedParameter')
  testConvertParameterToNamedParameterWithRichParam() {
    const s = this.__init()

    const param = new Parameter({
      key: 'extension',
      type: 'string',
      internals: new Immutable.List([
        new Constraint.Enum([ 'com', 'io' ])
      ]),
      example: 'com',
      description: 'the extension of the domain',
      required: true
    })

    const expected = {
      extension: {
        displayName: 'extension',
        type: 'string',
        enum: [ 'com', 'io' ],
        required: true,
        example: 'com',
        description: 'the extension of the domain'
      }
    }

    const result = s._convertParameterToNamedParameter(param)

    this.assertEqual(expected, result)
  }

    @targets('_formatSecuritySchemes')
  testFormatSecuritySchemesWithEmptyRequestList() {
    const s = this.__init()

    const reqs = new Immutable.List()

    const expected = {}

    const result = s._formatSecuritySchemes(reqs)

    this.assertEqual(expected, result)
  }

    @targets('_formatSecuritySchemes')
  testFormatSecuritySchemesWithTwoRequests() {
    const s = this.__init()

    s.spyOn('_formatBasic', () => {
      return {
        basic: {
          type: 'Basic Authentication'
        }
      }
    })

    s.spyOn('_formatOAuth2', () => {
      return {
        oauth_2_0: {
          type: 'OAuth 2.0',
          settings: {
            authorizationUri: 'api.com/oauth2/authorize',
            accessTokenUri: 'api.com/oauth2/token',
            authorizationGrants: [ 'token' ]
          }
        }
      }
    })

    const reqs = new Immutable.List([
      new Request({
        auths: new Immutable.List([
          null,
          new Auth.OAuth2({
            flow: 'implicit',
            authorizationUrl: 'api.com/oauth2/authorize',
            tokenUrl: 'api.com/oauth2/token',
            scopes: Immutable.List([ 'read:any', 'write:own' ])
          })
        ])
      }),
      new Request({
        auths: new Immutable.List([
          null,
          new Auth.Basic({
            username: 'admin'
          })
        ])
      })
    ])

    const expected = {
      securitySchemes: [
        {
          oauth_2_0: {
            type: 'OAuth 2.0',
            settings: {
              authorizationUri: 'api.com/oauth2/authorize',
              accessTokenUri: 'api.com/oauth2/token',
              authorizationGrants: [ 'token' ]
            }
          }
        },
        {
          basic: {
            type: 'Basic Authentication'
          }
        }
      ]
    }

    const result = s._formatSecuritySchemes(reqs)

    this.assertEqual(expected, result)
  }

    @targets('_formatOAuth2')
  testFormatOAuth2WithSimpleAuth() {
    const s = this.__init()

    const auth = new Auth.OAuth2()

    const expected = {
      oauth_2_0: {
        type: 'OAuth 2.0',
        settings: {
          authorizationUri: '',
          accessTokenUri: '',
          authorizationGrants: [ null ]
        }
      }
    }

    const result = s._formatOAuth2(auth)

    this.assertJSONEqual(expected, result)
  }

    @targets('_formatOAuth2')
  testFormatOAuth2WithRichAuth() {
    const s = this.__init()

    const auth = new Auth.OAuth2({
      flow: 'implicit',
      authorizationUrl: 'api.com/oauth2/authorize',
      tokenUrl: 'api.com/oauth2/token',
      scopes: Immutable.List([ 'read:any', 'write:own' ])
    })

    const expected = {
      oauth_2_0: {
        type: 'OAuth 2.0',
        settings: {
          authorizationUri: 'api.com/oauth2/authorize',
          accessTokenUri: 'api.com/oauth2/token',
          authorizationGrants: [ 'token' ]
        }
      }
    }

    const result = s._formatOAuth2(auth)

    this.assertEqual(expected, result)
  }

    @targets('_formatOAuth1')
  testFormatOAuth1WithSimpleAuth() {
    const s = this.__init()

    const auth = new Auth.OAuth1()

    const expected = {
      oauth_1_0: {
        type: 'OAuth 1.0'
      }
    }

    const result = s._formatOAuth1(auth)

    this.assertEqual(expected, result)
  }

    @targets('_formatOAuth1')
  testFormatOAuth1WithRichAuth() {
    const s = this.__init()

    const auth = new Auth.OAuth1({
      callback: 'http://api.com/oauth1/callback',
      consumerSecret: 'consumer secret',
      tokenSecret: 'token secret',
      consumerKey: 'consumer key',
      algorithm: 'super secret algorithm',
      nonce: '12345',
      additionalParameters: 'none',
      timestamp: 'now',
      token: 'token',
      version: '1.0',
      signature: 'this is signed',
      tokenCredentialsUri: 'http://api.com/oauth1/credentials',
      requestTokenUri: 'http://api.com/oauth1/request',
      authorizationUri: 'http://api.com/oauth1/authorize'
    })

    const expected = {
      oauth_1_0: {
        type: 'OAuth 1.0',
        settings: {
          callback: 'http://api.com/oauth1/callback',
          consumerSecret: 'consumer secret',
          tokenSecret: 'token secret',
          consumerKey: 'consumer key',
          algorithm: 'super secret algorithm',
          nonce: '12345',
          additionalParameters: 'none',
          timestamp: 'now',
          token: 'token',
          version: '1.0',
          signature: 'this is signed',
          tokenCredentialsUri: 'http://api.com/oauth1/credentials',
          requestTokenUri: 'http://api.com/oauth1/request',
          authorizationUri: 'http://api.com/oauth1/authorize'
        }
      }
    }

    const result = s._formatOAuth1(auth)

    this.assertEqual(expected, result)
  }

    @targets('_formatDigest')
  testFormatDigest() {
    const s = this.__init()

    const input = new Auth.Digest({
      description: 'some desc'
    })

    const expected = {
      digest: {
        description: 'some desc',
        type: 'Digest Authentication'
      }
    }

    const result = s._formatDigest(input)

    this.assertEqual(expected, result)
  }

    @targets('_formatBasic')
  testFormatBasic() {
    const s = this.__init()

    const input = new Auth.Digest({
      description: 'some desc'
    })

    const expected = {
      basic: {
        description: 'some desc',
        type: 'Basic Authentication'
      }
    }

    const result = s._formatBasic(input)

    this.assertEqual(expected, result)
  }

    @targets('_formatPaths')
  testFormatPathsWithEmptyList() {
    const s = this.__init()

    const group = new Immutable.List()

    const expected = {}
    const result = s._formatPaths(group)

    this.assertEqual(expected, result)
  }

    @targets('_formatPaths')
  testFormatPathsWithSimpleGroup() {
    const s = this.__init()

    s.spyOn('_formatRequest', (req) => {
      const res = {}
      res[req.get('method')] = true
      return res
    })

    s.spyOn('_formatURIParametersForFragment', () => {
      return {}
    })

    const requests = new Immutable.List([
      new Request({
        url: new URL({
          pathname: new Parameter({
            key: 'pathname',
            type: 'string',
            value: new Immutable.List([
              new Parameter({
                type: 'string',
                internals: new Immutable.List([
                  new Constraint.Enum([ '/songs' ])
                ])
              })
            ]),
            format: 'sequence'
          })
        }),
        method: 'get'
      }),
      new Request({
        url: new URL({
          pathname: new Parameter({
            key: 'pathname',
            type: 'string',
            value: new Immutable.List([
              new Parameter({
                type: 'string',
                internals: new Immutable.List([
                  new Constraint.Enum([ '/songs' ])
                ])
              })
            ]),
            format: 'sequence'
          })
        }),
        method: 'post'
      }),
      new Request({
        url: new URL({
          pathname: new Parameter({
            key: 'pathname',
            type: 'string',
            value: new Immutable.List([
              new Parameter({
                type: 'string',
                internals: new Immutable.List([
                  new Constraint.Enum([ '/songs/' ])
                ])
              }),
              new Parameter({
                key: 'songId',
                type: 'integer',
                internals: new Immutable.List([
                  new Constraint.Enum([ 0, 1, 3 ])
                ])
              })
            ]),
            format: 'sequence'
          })
        }),
        method: 'get'
      })
    ])

    const expected = {
      '/songs': {
        get: true,
        post: true,
        '/{songId}': {
          get: true
        }
      }
    }

    const result = s._formatPaths(requests)

    this.assertEqual(expected, result)
    this.assertEqual(s.spy._formatRequest.count, 3)
    this.assertEqual(s.spy._formatURIParametersForFragment.count, 4)
  }

    @targets('_formatRequest')
  testFormatRequestWithEmptyRequest() {
    const s = this.__init()
    const req = new Request()

    const expected = {}
    const result = s._formatRequest(req)

    this.assertEqual(expected, result)
  }

    @targets('_formatRequest')
  testFormatRequestWithSimpleRequest() {
    const s = this.__init()

    s.spyOn('_formatParameters', () => {
      return {
        headers: true
      }
    })

    s.spyOn('_formatBody', () => {
      return {
        body: true
      }
    })

    s.spyOn('_formatURIParameters', (_, target) => {
      const res = {}
      res[target] = true
      return [ res, null ]
    })

    const req = new Request({
      method: 'get',
      description: 'a simple description'
    })

    const expected = {
      get: {
        description: 'a simple description',
        headers: true,
        body: true,
        baseUriParameters: true
      }
    }

    const result = s._formatRequest(req)

    this.assertEqual(expected, result)
    this.assertEqual(s.spy._formatParameters.count, 1)
    this.assertEqual(s.spy._formatBody.count, 1)
    this.assertEqual(s.spy._formatURIParameters.count, 1)
  }

    @targets('_formatParameters')
  testFormatParametersWithEmptyContainer() {
    const s = this.__init()

    const container = new ParameterContainer()

    const expected = {}

    const result = s._formatParameters(container)

    this.assertEqual(expected, result)
    this.assertEqual(s.spy._formatHeaders.count, 0)
    this.assertEqual(s.spy._formatQueries.count, 0)
  }

    @targets('_formatParameters')
  testFormatParametersWithSimpleContainer() {
    const s = this.__init()

    s.spyOn('_formatHeaders', () => {
      return {
        'Content-Type': true
      }
    })

    s.spyOn('_formatQueries', () => {
      return {
        access_token: true
      }
    })

    const container = new ParameterContainer({
      headers: new Immutable.List([
        new Parameter({
          key: 'Content-Type',
          type: 'string',
          internals: new Immutable.List([
            new Constraint.Enum([
              'application/json'
            ])
          ])
        })
      ]),
      queries: new Immutable.List([
        new Parameter({
          key: 'access_token',
          type: 'string',
          internals: new Immutable.List([
            new Constraint.Pattern(/[a-f0-9]{32}/)
          ])
        })
      ])
    })

    const expected = {
      headers: {
        'Content-Type': true
      },
      queryParameters: {
        access_token: true
      }
    }

    const result = s._formatParameters(container)

    this.assertEqual(expected, result)
  }

    @targets('_formatHeaders')
  testFormatHeadersWithEmptyHeaders() {
    const s = this.__init()

    const headers = new Immutable.List()

    const expected = {}

    const result = s._formatHeaders(headers)

    this.assertEqual(expected, result)
  }

    @targets('_formatHeaders')
  testFormatHeadersWithSimpleHeaders() {
    const s = this.__init()

    const headers = new Immutable.List([
      new Parameter({
        key: 'Content-Type',
        type: 'string',
        internals: new Immutable.List([
          new Constraint.Enum([
            'application/json'
          ])
        ])
      }),
      new Parameter({
        key: 'Expect',
        type: 'string',
        internals: new Immutable.List([
          new Constraint.Enum([
            '100-continue'
          ])
        ])
      })
    ])

    const expected = {
      'Content-Type': {
        displayName: 'Content-Type',
        type: 'string',
        enum: [ 'application/json' ],
        required: false
      },
      Expect: {
        displayName: 'Expect',
        type: 'string',
        enum: [ '100-continue' ],
        required: false
      }
    }

    const result = s._formatHeaders(headers)

    this.assertEqual(expected, result)
    this.assertEqual(s.spy._convertParameterToNamedParameter.count, 2)
  }

        @targets('_formatQueries')
  testFormatQueriesWithEmptyQueries() {
    const s = this.__init()

    const queries = new Immutable.List()

    const expected = {}

    const result = s._formatQueries(queries)

    this.assertEqual(expected, result)
  }

    @targets('_formatQueries')
  testFormatQueriesWithSimpleQueries() {
    const s = this.__init()

    const queries = new Immutable.List([
      new Parameter({
        key: 'access_token',
        type: 'string',
        internals: new Immutable.List([
          new Constraint.MinimumLength(32)
        ])
      }),
      new Parameter({
        key: 'count',
        type: 'integer',
        internals: new Immutable.List([
          new Constraint.Minimum(1),
          new Constraint.Maximum(500)
        ])
      })
    ])

    const expected = {
      access_token: {
        displayName: 'access_token',
        type: 'string',
        minLength: 32,
        required: false
      },
      count: {
        displayName: 'count',
        type: 'integer',
        minimum: 1,
        maximum: 500,
        required: false
      }
    }

    const result = s._formatQueries(queries)

    this.assertEqual(expected, result)
    this.assertEqual(s.spy._convertParameterToNamedParameter.count, 2)
  }

    @targets('_formatBody')
  testFormatBodyWithEmptyBodyList() {
    const s = this.__init()

    const container = new ParameterContainer()
    const bodies = new Immutable.List()

    const expected = {}
    const result = s._formatBody(container, bodies)

    this.assertEqual(expected, result)
  }

    @targets('_formatBody')
  testFormatBodyWithSimpleBodyList() {
    const s = this.__init()

    s.spyOn('_getContentTypeConstraint', () => {
      return 'application/json'
    })

    const container = new ParameterContainer({
      body: new Immutable.List([
        new Parameter({
          key: 'schema',
          type: 'string',
          value: '{ "super": "schema" }',
          externals: new Immutable.List([
            new Parameter({
              key: 'Content-Type',
              type: 'string',
              internals: new Immutable.List([
                new Constraint.Enum([ 'application/json' ])
              ])
            })
          ])
        })
      ])
    })

    const bodies = new Immutable.List([
      new Body({
        constraints: new Immutable.List([
          new Parameter({
            key: 'Content-Type',
            type: 'string',
            value: 'application/json'
          })
        ])
      })
    ])

    const expected = {
      body: {
        'application/json': {
          schema: '{ "super": "schema" }'
        }
      }
    }

    const result = s._formatBody(container, bodies)

    this.assertEqual(expected, result)
  }

    @targets('_formatBody')
  testFormatBodyWithFormBodyList() {
    const s = this.__init()

    s.spyOn('_getContentTypeConstraint', () => {
      return 'application/x-www-form-urlencoded'
    })

    const container = new ParameterContainer({
      body: new Immutable.List([
        new Parameter({
          key: 'count',
          type: 'integer',
          internals: new Immutable.List([
            new Constraint.Minimum(0),
            new Constraint.Maximum(100)
          ]),
          externals: new Immutable.List([
            new Parameter({
              key: 'Content-Type',
              type: 'string',
              internals: new Immutable.List([
                new Constraint.Enum([
                  'application/x-www-form-urlencoded'
                ])
              ])
            })
          ])
        })
      ])
    })

    const bodies = new Immutable.List([
      new Body({
        constraints: new Immutable.List([
          new Parameter({
            key: 'Content-Type',
            type: 'string',
            value: 'application/x-www-form-urlencoded'
          })
        ])
      })
    ])

    const expected = {
      body: {
        'application/x-www-form-urlencoded': {
          formParameters: {
            count: {
              displayName: 'count',
              type: 'integer',
              minimum: 0,
              maximum: 100,
              required: false
            }
          }
        }
      }
    }

    const result = s._formatBody(container, bodies)

    this.assertEqual(expected, result)
  }

    @targets('_getContentTypeConstraint')
  testGetContentTypeConstraintWithEmptyBody() {
    const s = this.__init()

    const body = new Body()

    const expected = null

    const result = s._getContentTypeConstraint(body)

    this.assertEqual(expected, result)
  }

    @targets('_getContentTypeConstraint')
  testGetContentTypeConstraintWithSimpleBody() {
    const s = this.__init()
    const body = new Body({
      constraints: new Immutable.List([
        new Parameter({
          key: 'Content-Type',
          type: 'string',
          value: 'application/json'
        })
      ])
    })

    const expected = 'application/json'

    const result = s._getContentTypeConstraint(body)

    this.assertEqual(expected, result)
  }

    @targets('_getContentTypeConstraint')
  testGetContentTypeConstraintWithSimpleBody() {
    const s = this.__init()
    const body = new Body({
      constraints: new Immutable.List([
        new Parameter({
          key: 'Expect',
          type: 'string',
          value: '100-continue'
        }),
        new Parameter({
          key: 'Content-Type',
          type: 'string',
          value: 'application/json'
        }),
        new Parameter({
          key: 'Warning',
          type: 'string',
          value: 'client-load:0.8'
        })
      ])
    })

    const expected = 'application/json'

    const result = s._getContentTypeConstraint(body)

    this.assertEqual(expected, result)
  }

    @targets('_formatSchemas')
  testFormatSchemas() {
    const s = this.__init()
    let references = new ReferenceContainer()
    references = references.update(
            new ExoticReference({
              uri: '/absolute/path/some-song.mp3',
              relative: 'some-song.mp3',
              resolved: true
            })
        ).update(
            new JSONSchemaReference({
              uri: '/absolute/path/current.json#/definitions/User',
              relative: '#/definitions/User',
              value: { test: 12 },
              resolved: true
            })
        ).update(
            new JSONSchemaReference({
              uri: '/absolute/path/other.json',
              relative: 'other.json',
              resolved: true
            })
        )

    const expected = {
      schemas: [
        {
          'some-song.mp3': JSON.stringify({
            type: 'string',
            default: 'null'
          }, null, '  '),
          'other.json': '!include other.json',
          '#/definitions/User': JSON.stringify({
            test: 12
          }, null, '  ')
        }
      ]
    }

    const result = s._formatSchemas(new Immutable.OrderedMap({
      raml: references
    }))

    this.assertEqual(expected, result)
  }

    @targets('_formatResponses')
  testFormatResponsesCallsFormatBody() {
    const s = this.__init()

    let count = 0
    s.spyOn('_formatBody', () => {
      count += 1
      return {
        body: count
      }
    })

    const responses = new Immutable.List([
      new Response({
        code: 200
      }),
      new Response({
        code: 404
      })
    ])

    const expected = {
      responses: {
        '200': {
          body: 1
        },
        '404': {
          body: 2
        }
      }
    }

    const result = s._formatResponses(responses)

    this.assertEqual(expected, result)
  }

    @targets('_formatResponses')
  testFormatResponsesAddsDescription() {
    const s = this.__init()

    let count = 0
    s.spyOn('_formatBody', () => {
      count += 1
      return {
        body: {
          count: count
        }
      }
    })

    const responses = new Immutable.List([
      new Response({
        code: 200,
        description: 'basic'
      }),
      new Response({
        code: 404,
        description: 'other'
      })
    ])

    const expected = {
      responses: {
        '200': {
          body: {
            count: 1
          },
          description: 'basic'
        },
        '404': {
          body: {
            count: 2
          },
          description: 'other'
        }
      }
    }

    const result = s._formatResponses(responses)

    this.assertEqual(expected, result)
  }

    @targets('_formatURIParametersForFragment')
  testFormatURIParametersForFragmentWithSimpleFragment() {
    const s = this.__init()

    s.spyOn('_formatURIParameters', () => {
      return [ { uriParameters: {} } ]
    })

    const fragment = '/songs'
    const url = new URL('http://echo.luckymarmot.com/songs/{songId}')

    const expected = {}
    const result = s._formatURIParametersForFragment(fragment, url)

    this.assertEqual(expected, result)
  }

    @targets('_formatURIParametersForFragment')
  testFormatURIParametersForFragmentWithRichFragment() {
    const s = this.__init()

    s.spyOn('_formatURIParameters', () => {
      return [ { uriParameters: {
        songId: {
          type: 'integer',
          minimum: 0
        }
      } } ]
    })

    const fragment = '/{songId}'
    const url = new URL({
      protocol: new Parameter({
        key: 'protocol',
        type: 'string',
        value: 'http',
        internals: new Immutable.List([
          new Constraint.Enum([
            'http'
          ])
        ])
      }),
      host: new Parameter({
        key: 'host',
        type: 'string',
        value: 'echo.luckymarmot.com',
        internals: new Immutable.List([
          new Constraint.Enum([
            'echo.luckymarmot.com'
          ])
        ])
      }),
      pathname: new Parameter({
        key: 'pathname',
        type: 'string',
        format: 'sequence',
        value: new Immutable.List([
          new Parameter({
            type: 'string',
            value: '/songs/',
            internals: new Immutable.List([
              new Constraint.Enum([
                '/songs/'
              ])
            ])
          }),
          new Parameter({
            key: 'songId',
            type: 'integer',
            internals: new Immutable.List([
              new Constraint.Minimum(0)
            ])
          })
        ])
      })
    })

    const expected = {
      uriParameters: {
        songId: {
          type: 'integer',
          minimum: 0
        }
      }
    }
    const result = s._formatURIParametersForFragment(fragment, url)

    this.assertEqual(expected, result)
  }

    @targets('_formatAuths')
  testFormatAuthsWithNoAuth() {
    const s = this.__init()

    const input = new Immutable.List()

    const expected = {}
    const result = s._formatAuths(input)

    this.assertEqual(expected, result)
  }

    @targets('_formatAuths')
  testFormatAuthsWithNullAuth() {
    const s = this.__init()

    const input = new Immutable.List([ null ])

    const expected = {
      securedBy: [ null ]
    }
    const result = s._formatAuths(input)

    this.assertEqual(expected, result)
  }

    @targets('_formatAuths')
  testFormatAuthsWithBasicAuth() {
    const s = this.__init()

    const input = new Immutable.List([
      new Auth.Basic()
    ])

    const expected = {
      securedBy: [ 'basic' ]
    }
    const result = s._formatAuths(input)

    this.assertEqual(expected, result)
  }

    @targets('_formatAuths')
  testFormatAuthsWithDigestAuth() {
    const s = this.__init()

    const input = new Immutable.List([
      new Auth.Digest()
    ])

    const expected = {
      securedBy: [ 'digest' ]
    }
    const result = s._formatAuths(input)

    this.assertEqual(expected, result)
  }

    @targets('_formatAuths')
  testFormatAuthsWithOAuth1Auth() {
    const s = this.__init()

    const input = new Immutable.List([
      new Auth.OAuth1()
    ])

    const expected = {
      securedBy: [ 'oauth_1_0' ]
    }
    const result = s._formatAuths(input)

    this.assertEqual(expected, result)
  }

    @targets('_formatAuths')
  testFormatAuthsWithOAuth2Auth() {
    const s = this.__init()

    const input = new Immutable.List([
      new Auth.OAuth2()
    ])

    const expected = {
      securedBy: [ 'oauth_2_0' ]
    }
    const result = s._formatAuths(input)

    this.assertEqual(expected, result)
  }

    @targets('_formatAuths')
  testFormatAuthsWithOAuth2AuthAndScopes() {
    const s = this.__init()

    const input = new Immutable.List([
      new Auth.OAuth2({
        scopes: new Immutable.List([
          'read:any', 'write:self'
        ])
      })
    ])

    const expected = {
      securedBy: [
        {
          oauth_2_0: {
            scopes: [ 'read:any', 'write:self' ]
          }
        }
      ]
    }
    const result = s._formatAuths(input)

    this.assertEqual(expected, result)
  }

    @targets('_formatAuths')
  testFormatAuthsWithMultipleAuth() {
    const s = this.__init()

    const input = new Immutable.List([
      null,
      new Auth.Basic(),
      new Auth.Digest()
    ])

    const expected = {
      securedBy: [ null, 'basic', 'digest' ]
    }
    const result = s._formatAuths(input)

    this.assertEqual(expected, result)
  }

    @targets('_isInlineRef')
  testIsInlineRefWithEmptyReferenceMap() {
    const parser = this.__init()

    parser.references = new Immutable.OrderedMap()

    const input = new JSONSchemaReference({
      uri: '#/definitions/User'
    })

    const expected = true
    const result = parser._isInlineRef(input)

    this.assertEqual(expected, result)
  }

    @targets('_isInlineRef')
  testIsInlineRefWithEmptyContainer() {
    const parser = this.__init()

    parser.references = new Immutable.OrderedMap({
      paw: new ReferenceContainer()
    })

    const input = new JSONSchemaReference({
      uri: '#/definitions/User'
    })

    const expected = true
    const result = parser._isInlineRef(input)

    this.assertEqual(expected, result)
  }

    @targets('_isInlineRef')
  testIsInlineRefWithNoMatchingReference() {
    const parser = this.__init()

    const references = new Immutable.List([
      new JSONSchemaReference({
        uri: '#/definitions/Team'
      }),
      new JSONSchemaReference({
        uri: '#/definitions/Admin'
      })
    ])

    parser.references = new Immutable.OrderedMap({
      paw: (new ReferenceContainer()).create(references)
    })

    const input = new JSONSchemaReference({
      uri: '#/definitions/User'
    })

    const expected = true
    const result = parser._isInlineRef(input)

    this.assertEqual(expected, result)
  }

    @targets('_isInlineRef')
  testIsInlineRefWithMatchingRef() {
    const parser = this.__init()

    const references = new Immutable.List([
      new JSONSchemaReference({
        uri: '#/definitions/Team'
      }),
      new JSONSchemaReference({
        uri: '#/definitions/User'
      }),
      new JSONSchemaReference({
        uri: '#/definitions/Admin'
      })
    ])

    parser.references = new Immutable.OrderedMap({
      paw: (new ReferenceContainer()).create(references)
    })

    const input = new JSONSchemaReference({
      uri: '#/definitions/User'
    })

    const expected = false
    const result = parser._isInlineRef(input)

    this.assertEqual(expected, result)
  }

    @targets('_formatBodyParam')
  testFormatBodyParamCallsConvertToNamedParameterIfNotReference() {
    const s = this.__init()

    s.spyOn('_convertParameterToNamedParameter', () => {
      return 12
    })

    const input = new Parameter({
      type: 'string'
    })

    const expected = 12
    const result = s._formatBodyParam(input)

    this.assertEqual(s.spy._convertParameterToNamedParameter.count, 1)
    this.assertEqual(expected, result)
  }

    @targets('_formatBodyParam')
  testFormatBodyParamCallsIsInlineRefIfReference() {
    const s = this.__init()

    s.spyOn('_isInlineRef', () => {
      return true
    })

    const input = new Parameter({
      type: 'reference',
      value: new JSONSchemaReference({
        value: {
          type: 'integer',
          default: 42
        }
      })
    })

    const expected = {
      schema: JSON.stringify({
        type: 'integer',
        default: 42
      }, null, '  ')
    }
    const result = s._formatBodyParam(input)

    this.assertEqual(s.spy._convertParameterToNamedParameter.count, 0)
    this.assertEqual(s.spy._isInlineRef.count, 1)
    this.assertEqual(expected, result)
  }

    @targets('_formatBodyParam')
  testFormatBodyParamReturnsExpectedSchemaIfNotInline() {
    const s = this.__init()

    s.spyOn('_isInlineRef', () => {
      return false
    })

    const input = new Parameter({
      type: 'reference',
      value: new JSONSchemaReference({
        uri: '#/definitions/User',
        relative: '#/definitions/User',
        value: {
          type: 'integer',
          default: 42
        }
      })
    })

    const expected = {
      schema: '#/definitions/User'
    }
    const result = s._formatBodyParam(input)

    this.assertEqual(s.spy._convertParameterToNamedParameter.count, 0)
    this.assertEqual(s.spy._isInlineRef.count, 1)
    this.assertEqual(expected, result)
  }


    @targets('validate')
  _testValidate() {
        // TODO
  }

  __init() {
    const serializer = new RAMLSerializer()
    return new ClassMock(serializer, '')
  }
}
