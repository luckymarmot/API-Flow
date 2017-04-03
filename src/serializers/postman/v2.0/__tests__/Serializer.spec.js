/* eslint-disable max-nested-callbacks */
import expect, { spyOn, restoreSpies } from 'expect'
import { OrderedMap, List } from 'immutable'

import Api from '../../../../models/Api'
import Info from '../../../../models/Info'
import Group from '../../../../models/Group'
import Resource from '../../../../models/Resource'
import Request from '../../../../models/Request'
import Variable from '../../../../models/Variable'
import Reference from '../../../../models/Reference'
import Store from '../../../../models/Store'
import Parameter from '../../../../models/Parameter'
import Constraint from '../../../../models/Constraint'
import ParameterContainer from '../../../../models/ParameterContainer'
import URL from '../../../../models/URL'
import Auth from '../../../../models/Auth'
import Context from '../../../../models/Context'

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

  describe('@createInfoName', () => {
    it('should work', () => {
      const inputs = [
        new Api(),
        new Api({ info: new Info() }),
        new Api({ info: new Info({ title: 123 }) })
      ]
      const expected = [
        { key: 'name', value: 'API-Flow export' },
        { key: 'name', value: 'API-Flow export' },
        { key: 'name', value: 123 }
      ]
      const actual = inputs.map(input => __internals__.createInfoName(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createInfoSchema', () => {
    it('should work', () => {
      const inputs = [
        null
      ]
      const expected = [
        {
          key: 'schema',
          value: 'https://schema.getpostman.com/json/collection/v2.0.0/collection.json'
        }
      ]
      const actual = inputs.map(input => __internals__.createInfoSchema(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createInfoDescription', () => {
    it('should work', () => {
      const inputs = [
        new Api(),
        new Api({ info: new Info() }),
        new Api({ info: new Info({ description: 123 }) })
      ]
      const expected = [
        null, null, { key: 'description', value: 123 }
      ]
      const actual = inputs.map(input => __internals__.createInfoDescription(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createInfoVersion', () => {
    it('should work', () => {
      const inputs = [
        new Api(),
        new Api({ info: new Info() }),
        new Api({ info: new Info({ version: 123 }) })
      ]
      const expected = [
        null, null, { key: 'version', value: 123 }
      ]
      const actual = inputs.map(input => __internals__.createInfoVersion(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createInfo', () => {
    it('should work', () => {
      const inputs = [
        new Api(),
        new Api({ info: new Info() }),
        new Api({ info: new Info({
          title: 123,
          version: 234,
          description: 345
        }) })
      ]
      const expected = [
        {
          key: 'info',
          value: {
            name: 'API-Flow export',
            schema: 'https://schema.getpostman.com/json/collection/v2.0.0/collection.json'
          }
        },
        {
          key: 'info',
          value: {
            name: 'API-Flow export',
            schema: 'https://schema.getpostman.com/json/collection/v2.0.0/collection.json'
          }
        },
        {
          key: 'info',
          value: {
            schema: 'https://schema.getpostman.com/json/collection/v2.0.0/collection.json',
            name: 123,
            version: 234,
            description: 345
          }
        }
      ]
      const actual = inputs.map(input => __internals__.createInfo(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createItemName', () => {
    it('should work', () => {
      const inputs = [
        new Group(),
        new Group({ name: 123 }),
        new Resource(),
        new Resource({ name: 234 }),
        new Request(),
        new Request({ name: 345 })
      ]
      const expected = [
        null,
        { key: 'name', value: 123 },
        null,
        { key: 'name', value: 234 },
        null,
        { key: 'name', value: 345 }
      ]
      const actual = inputs.map(input => __internals__.createItemName(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createItemDescription', () => {
    it('should work', () => {
      const inputs = [
        new Group(),
        new Group({ description: 123 }),
        new Resource(),
        new Resource({ description: 234 }),
        new Request(),
        new Request({ description: 345 })
      ]
      const expected = [
        null,
        { key: 'description', value: 123 },
        null,
        { key: 'description', value: 234 },
        null,
        { key: 'description', value: 345 }
      ]
      const actual = inputs.map(input => __internals__.createItemDescription(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@getEndpointOrReferenceFromResourceAndRequest', () => {
    it('should work', () => {
      const inputs = [
        [ new Resource(), new Request() ],
        [ new Resource({
          endpoints: OrderedMap({
            base: 123,
            dropped: 234
          })
        }), new Request() ],
        [ new Resource(), new Request({
          endpoints: OrderedMap({
            base: 345,
            dropped: 456
          })
        }) ],
        [ new Resource({
          endpoints: OrderedMap({
            base: 123,
            dropped: 234
          })
        }), new Request({
          endpoints: OrderedMap({
            base: 345,
            dropped: 456
          })
        }) ]
      ]
      const expected = [
        null, 123, 345, 345
      ]
      const actual = inputs.map(
        input => __internals__.getEndpointOrReferenceFromResourceAndRequest(...input)
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@getEndpointFromVariable', () => {
    it('should work', () => {
      const inputs = [
        null,
        new Variable(),
        new Variable({
          values: OrderedMap({ base: 123, dropped: 234 })
        })
      ]
      const expected = [
        null, null, 123
      ]
      const actual = inputs.map(input => __internals__.getEndpointFromVariable(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@getEndpointFromReference', () => {
    it('should work', () => {
      spyOn(__internals__, 'getEndpointFromVariable').andCall(v => v + 1)
      const inputs = [
        [ new Api(), new Reference() ],
        [ new Api(), new Reference({
          uuid: 'base'
        }) ],
        [ new Api({
          store: new Store({
            endpoint: OrderedMap({
              base: 123
            })
          })
        }), new Reference({
          uuid: 'base'
        }) ],
        [ new Api({
          store: new Store({
            endpoint: OrderedMap({
              base: 123
            })
          })
        }), new Reference({
          type: 'endpoint',
          uuid: 'base'
        }) ],
        [ new Api({
          store: new Store({
            variable: OrderedMap({
              base: 234
            })
          })
        }), new Reference({
          type: 'variable',
          uuid: 'base'
        }) ],
        [ new Api({
          store: new Store({
            endpoint: OrderedMap({
              base: 123
            }),
            variable: OrderedMap({
              base: 234
            })
          })
        }), new Reference({
          type: 'variable',
          uuid: 'base'
        }) ]
      ]
      const expected = [
        null, null, 123, 123, 235, 235
      ]
      const actual = inputs.map(input => __internals__.getEndpointFromReference(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractQueryKeyValuePairFromReference', () => {
    it('should work', () => {
      const inputs = [
        [ new Api(), new Reference() ],
        [ new Api(), new Reference({
          uuid: 'param'
        }) ],
        [ new Api({
          store: new Store({
            parameter: OrderedMap({
              param: new Parameter()
            })
          })
        }), new Reference({
          uuid: 'param'
        }) ],
        [ new Api({
          store: new Store({
            parameter: OrderedMap({
              param: new Parameter({
                key: 234
              })
            })
          })
        }), new Reference({
          uuid: 'param'
        }) ]
      ]
      const expected = [
        null,
        null,
        'null={{param}}',
        '234={{param}}'
      ]
      const actual = inputs.map(
        input => __internals__.extractQueryKeyValuePairFromReference(...input)
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractQueryKeyValuePairFromParameter', () => {
    it('should work', () => {
      const inputs = [
        new Parameter(),
        new Parameter({
          key: 123
        }),
        new Parameter({
          key: 234,
          default: 345
        }),
        new Parameter({
          key: 456,
          constraints: List([
            new Constraint.JSONSchema({
              type: 'integer',
              default: 567
            })
          ])
        })
      ]
      const expected = [
        'null=',
        '123=',
        '234=345',
        '456=567'
      ]
      const actual = inputs.map(input => __internals__.extractQueryKeyValuePairFromParameter(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractQueryKeyValuePairFromParameterOrReference', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractQueryKeyValuePairFromParameter').andReturn(123)
      spyOn(__internals__, 'extractQueryKeyValuePairFromReference').andReturn(234)

      const inputs = [
        [ new Api(), new Parameter() ],
        [ new Api(), new Reference() ]
      ]
      const expected = [
        123,
        234
      ]
      const actual = inputs.map(
        input => __internals__.extractQueryKeyValuePairFromParameterOrReference(...input)
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractQueryStringFromRequest', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractQueryKeyValuePairFromParameterOrReference').andCall((a, p) => {
        return p % 2 ? p : null
      })

      const inputs = [
        [ new Api(), new Request() ],
        [ new Api(), new Request({
          parameters: new ParameterContainer({
            queries: OrderedMap({
              a: 123,
              b: 234,
              c: 345
            })
          })
        }) ],
        [ new Api(), new Request({
          parameters: new ParameterContainer({
            queries: OrderedMap({
              b: 234
            })
          })
        }) ]
      ]
      const expected = [
        '', '?123&345', ''
      ]
      const actual = inputs.map(input => __internals__.extractQueryStringFromRequest(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@combineUrlComponents', () => {
    it('should work', () => {
      const inputs = [
        [ 'http://echo.paw.cloud', '/example', '?some=query&string' ],
        [ 'http://echo.paw.cloud/', '/example', '?some=query&string' ]
      ]
      const expected = [
        { key: 'url', value: 'http://echo.paw.cloud/example?some=query&string' },
        { key: 'url', value: 'http://echo.paw.cloud/example?some=query&string' }
      ]
      const actual = inputs.map(
        input => __internals__.combineUrlComponents(...input)
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractBaseUrlFromEndpoint', () => {
    it('should work', () => {
      const inputs = [
        'someEndpoint',
        new URL({ url: 'https://example.com' }),
        new URL({ url: 'https://example.com/{version}', variableDelimiters: List([ '{', '}' ]) })
      ]
      const expected = [
        'someEndpoint',
        'https://example.com/',
        'https://example.com/{{version}}'
      ]
      const actual = inputs.map(input => __internals__.extractBaseUrlFromEndpoint(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractPathFromResource', () => {
    it('should work', () => {
      const inputs = [
        new Resource(),
        new Resource({
          path: new URL({ url: '/songs/{songId}', variableDelimiters: List([ '{', '}' ]) })
        })
      ]
      const expected = [
        '/',
        '/songs/:songId'
      ]
      const actual = inputs.map(input => __internals__.extractPathFromResource(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createRequestUrl', () => {
    it('should work', () => {
      spyOn(__internals__, 'getEndpointOrReferenceFromResourceAndRequest').andCall((res, req) => {
        const value = (req || res) + 1
        return value === 1 ? null : value
      })
      spyOn(__internals__, 'getEndpointFromReference').andCall((a, e) => {
        return e.get('uuid')
      })

      spyOn(__internals__, 'extractBaseUrlFromEndpoint').andCall(e => e * 2)
      spyOn(__internals__, 'extractPathFromResource').andCall(r => (r || 100) * 3)
      spyOn(__internals__, 'extractQueryStringFromRequest').andCall((a, r) => {
        return (a || 0) + (r || 0)
      })

      spyOn(__internals__, 'combineUrlComponents').andCall((b, p, q) => {
        return p + q - b
      })

      const inputs = [
        // [ new Api(), new Resource(), new Request() ],
        [ null, 234, 345 ],
        [ 123, null, 345 ],
        [ 123, 234, null ],
        [ 123, null, null ]
      ]
      const expected = [
        355, 76, 355, null
      ]
      const actual = inputs.map(input => __internals__.createRequestUrl(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createRequestAuthFromAWSSig4Auth', () => {
    it('should work', () => {
      const inputs = [
        new Auth.AWSSig4(),
        new Auth.AWSSig4({
          key: 123,
          secret: 234,
          region: 345,
          service: 456
        })
      ]
      const expected = [
        { type: 'awsv4' },
        { type: 'awsv4', awsv4: { accessKey: 123, secretKey: 234, region: 345, service: 456 } }
      ]
      const actual = inputs.map(input => __internals__.createRequestAuthFromAWSSig4Auth(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createRequestAuthFromBasicAuth', () => {
    it('should work', () => {
      const inputs = [
        new Auth.Basic(),
        new Auth.Basic({
          username: 123,
          password: 234
        })
      ]
      const expected = [
        { type: 'basic' },
        { type: 'basic', basic: { username: 123, password: 234 } }
      ]
      const actual = inputs.map(input => __internals__.createRequestAuthFromBasicAuth(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createRequestAuthFromDigestAuth', () => {
    it('should work', () => {
      const inputs = [
        new Auth.Digest(),
        new Auth.Digest({
          username: 123,
          password: 234
        })
      ]
      const expected = [
        { type: 'digest' },
        { type: 'digest', digest: { username: 123, password: 234 } }
      ]
      const actual = inputs.map(input => __internals__.createRequestAuthFromDigestAuth(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createRequestAuthFromHawkAuth', () => {
    it('should work', () => {
      const inputs = [
        new Auth.Hawk(),
        new Auth.Hawk({
          id: 123,
          key: 234,
          algorithm: 345
        })
      ]
      const expected = [
        { type: 'hawk' },
        { type: 'hawk', hawk: { authId: 123, authKey: 234, algorithm: 345 } }
      ]
      const actual = inputs.map(input => __internals__.createRequestAuthFromHawkAuth(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createRequestAuthFromOAuth1Auth', () => {
    it('should work', () => {
      const inputs = [
        new Auth.OAuth1(),
        new Auth.OAuth1({
          consumerSecret: 123,
          consumerKey: 234,
          token: 345,
          tokenSecret: 456,
          algorithm: 567,
          nonce: 678,
          version: 789
        })
      ]
      const expected = [
        { type: 'oauth1' },
        { type: 'oauth1', oauth1: {
          consumerSecret: 123,
          consumerKey: 234,
          token: 345,
          tokenSecret: 456,
          signatureMethod: 567,
          nonce: 678,
          version: 789
        } }
      ]
      const actual = inputs.map(input => __internals__.createRequestAuthFromOAuth1Auth(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createRequestAuthFromOAuth2Auth', () => {
    it('should work', () => {
      const inputs = [
        new Auth.OAuth2(),
        new Auth.OAuth2({
          authorizationUrl: 123,
          tokenUrl: 234,
          scopes: List([ { key: 345 }, { key: 456 } ])
        })
      ]
      const expected = [
        { type: 'oauth2' },
        { type: 'oauth2', oauth2: { authUrl: 123, accessTokenUrl: 234, scope: '345 456' } }
      ]
      const actual = inputs.map(input => __internals__.createRequestAuthFromOAuth2Auth(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createRequestAuthFromAuth', () => {
    it('should work', () => {
      spyOn(__internals__, 'createRequestAuthFromAWSSig4Auth').andReturn(123)
      spyOn(__internals__, 'createRequestAuthFromBasicAuth').andReturn(234)
      spyOn(__internals__, 'createRequestAuthFromDigestAuth').andReturn(345)
      spyOn(__internals__, 'createRequestAuthFromHawkAuth').andReturn(456)
      spyOn(__internals__, 'createRequestAuthFromOAuth1Auth').andReturn(567)
      spyOn(__internals__, 'createRequestAuthFromOAuth2Auth').andReturn(678)

      const inputs = [
        new Auth.AWSSig4(),
        new Auth.Basic(),
        new Auth.Digest(),
        new Auth.Hawk(),
        new Auth.OAuth1(),
        new Auth.OAuth2(),
        new Auth.Custom()
      ]

      const expected = [
        { key: 'auth', value: 123 },
        { key: 'auth', value: 234 },
        { key: 'auth', value: 345 },
        { key: 'auth', value: 456 },
        { key: 'auth', value: 567 },
        { key: 'auth', value: 678 },
        null
      ]

      const actual = inputs.map(input => __internals__.createRequestAuthFromAuth(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createRequestAuth', () => {
    it('should work', () => {
      spyOn(__internals__, 'createRequestAuthFromAuth').andCall(v => {
        return v
      })
      const inputs = [
        [ new Api(), new Request() ],
        [ new Api(), new Request({
          auths: List([ null ])
        }) ],
        [ new Api(), new Request({
          auths: List([ new Reference({ uuid: 'auth' }) ])
        }) ],
        [
          new Api({
            store: new Store({
              auth: OrderedMap({
                auth: 123
              })
            })
          }),
          new Request({
            auths: List([ new Reference({ uuid: 'auth' }) ])
          })
        ]
      ]

      const expected = [
        null,
        { key: 'auth', value: { type: 'noauth', noauth: {} } },
        null,
        123
      ]
      const actual = inputs.map(input => __internals__.createRequestAuth(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createMethod', () => {
    it('should work', () => {
      const inputs = [
        new Request(),
        new Request({
          method: 'get'
        })
      ]
      const expected = [
        null,
        { key: 'method', value: 'GET' }
      ]
      const actual = inputs.map(input => __internals__.createMethod(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createHeaderFromReference', () => {
    it('should work', () => {
      const inputs = [
        [ new Api(), new Reference() ],
        [ new Api(), new Reference({ uuid: 'abc' }) ],
        [ new Api({
          store: new Store({
            parameter: OrderedMap({
              abc: new Parameter({
                key: 123
              })
            })
          })
        }), new Reference({ uuid: 'abc' }) ]
      ]
      const expected = [
        null, null, { key: 123, value: '{{abc}}' }
      ]
      const actual = inputs.map(input => __internals__.createHeaderFromReference(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createHeaderFromParameter', () => {
    it('should work', () => {
      const inputs = [
        new Parameter(),
        new Parameter({ key: 123 }),
        new Parameter({
          key: 234,
          constraints: List([ new Constraint.JSONSchema({ default: 'abc' }) ])
        }),
        new Parameter({
          key: 345,
          constraints: List([ new Constraint.JSONSchema({ enum: [ 'def', 'ghi' ] }) ])
        })
      ]
      const expected = [
        null,
        { key: 123, value: null },
        { key: 234, value: 'abc' },
        { key: 345, value: 'def' }
      ]
      const actual = inputs.map(input => __internals__.createHeaderFromParameter(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createHeaderFromParameterOrReference', () => {
    it('should work', () => {
      spyOn(__internals__, 'createHeaderFromReference').andReturn('ref')
      spyOn(__internals__, 'createHeaderFromParameter').andReturn('param')

      const inputs = [
        [ new Api(), null ],
        [ new Api(), new Reference() ],
        [ new Api(), new Parameter() ],
        [ new Api(), new Parameter({ key: 123 }) ]
      ]
      const expected = [
        null,
        'ref',
        null,
        'param'
      ]

      const actual = inputs.map(
        input => __internals__.createHeaderFromParameterOrReference(...input)
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@createHeader', () => {
    it('should work', () => {
      spyOn(__internals__, 'createHeaderFromParameterOrReference').andCall((a, h) => {
        return h % 2 ? null : a + h
      })

      const inputs = [
        [ 123, new Request() ],
        [ 123, new Request({
          parameters: new ParameterContainer({
            headers: OrderedMap({
              abc: 234,
              def: 345
            })
          })
        }) ]
      ]
      const expected = [
        null,
        { key: 'header', value: [ 234 + 123 ] }
      ]
      const actual = inputs.map(input => __internals__.createHeader(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@getContentTypeParamsFromHeaders', () => {
    it('should work', () => {
      const inputs = [
        [ new Api(), new Request() ],
        [ new Api(), new Request({
          parameters: new ParameterContainer({
            headers: OrderedMap({
              abc: new Parameter({
                key: 'Accept'
              }),
              def: new Parameter({
                key: 'Content-Type'
              })
            })
          })
        }) ]
      ]
      const expected = [
        List(),
        List([ new Parameter({ key: 'Content-Type' }) ])
      ]
      const actual = inputs.map(input => __internals__.getContentTypeParamsFromHeaders(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@getContentTypeParamsFromContext', () => {
    it('should work', () => {
      const inputs = [
        new Context(),
        new Context({
          constraints: List([
            new Parameter({
              key: 'Accept',
              in: 'headers',
              usedIn: 'request'
            })
          ])
        }),
        new Context({
          constraints: List([
            new Parameter({
              key: 'Content-Type',
              in: 'headers',
              usedIn: 'request'
            })
          ])
        }),
        new Context({
          constraints: List([
            new Parameter({
              key: 'Content-Type',
              in: 'body',
              usedIn: 'request'
            })
          ])
        }),
        new Context({
          constraints: List([
            new Parameter({
              key: 'Content-Type',
              in: 'headers',
              usedIn: 'response'
            })
          ])
        }),
        new Context({
          constraints: List([
            new Parameter({
              key: 'Content-Type',
              in: 'headers',
              usedIn: 'request',
              value: 123
            }),
            new Parameter({
              key: 'Accept',
              in: 'headers',
              usedIn: 'request'
            }),
            new Parameter({
              key: 'Content-Type',
              in: 'headers',
              usedIn: 'request',
              value: 234
            })
          ])
        })
      ]
      const expected = [
        List(),
        List(),
        List([
          new Parameter({
            key: 'Content-Type',
            in: 'headers',
            usedIn: 'request'
          })
        ]),
        List(),
        List(),
        List([
          new Parameter({
            key: 'Content-Type',
            in: 'headers',
            usedIn: 'request',
            value: 123
          }),
          new Parameter({
            key: 'Content-Type',
            in: 'headers',
            usedIn: 'request',
            value: 234
          })
        ])
      ]
      const actual = inputs.map(input => __internals__.getContentTypeParamsFromContext(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@getContentTypeParamsFromRequestOrContext', () => {
    it('should work', () => {
      spyOn(__internals__, 'getContentTypeParamsFromHeaders').andCall((a, r) => a + r)
      spyOn(__internals__, 'getContentTypeParamsFromContext').andCall(c => c * 2)

      const inputs = [
        [ 123, 234, null ],
        [ 123, 234, 345 ]
      ]
      const expected = [
        123 + 234,
        345 * 2
      ]
      const actual = inputs.map(
        input => __internals__.getContentTypeParamsFromRequestOrContext(...input)
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@createBodyModeFromSchemaDefault', () => {
    it('should work', () => {
      const inputs = [
        { default: 'application/json' },
        { default: 'application/x-www-form-urlencoded' },
        { default: 'application/x-www-form-urlencoded; charset=utf-8' },
        { default: 'multipart/form-data' },
        { default: 'multipart/form-data; boundary=__**__' }
      ]
      const expected = [
        'raw',
        'urlencoded',
        'urlencoded',
        'formdata',
        'formdata'
      ]
      const actual = inputs.map(input => __internals__.createBodyModeFromSchemaDefault(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createBodyModeFromSchemaEnum', () => {
    it('should work', () => {
      const inputs = [
        { enum: [ 'application/json' ] },
        { enum: [ 'application/json', 'application/xml' ] },
        { enum: [ 'application/x-www-form-urlencoded' ] },
        { enum: [ 'application/x-www-form-urlencoded', 'application/text' ] },
        { enum: [ 'application/text', 'application/x-www-form-urlencoded' ] },
        { enum: [ 'application/x-www-form-urlencoded; charset=utf-8' ] },
        { enum: [ 'multipart/form-data' ] },
        { enum: [ 'multipart/form-data', 'application/text' ] },
        { enum: [ 'application/text', 'multipart/form-data' ] },
        { enum: [ 'multipart/form-data; boundary=__**__' ] },
        { enum: [ 'application/x-www-form-urlencoded', 'multipart/form-data' ] }
      ]
      const expected = [
        'raw',
        'raw',
        'urlencoded',
        'urlencoded',
        'urlencoded',
        'urlencoded',
        'formdata',
        'formdata',
        'formdata',
        'formdata',
        'urlencoded'
      ]
      const actual = inputs.map(input => __internals__.createBodyModeFromSchemaEnum(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createBodyModeFromContentTypeParams', () => {
    it('should work', () => {
      spyOn(__internals__, 'createBodyModeFromSchemaDefault').andCall(({ default: d }) => d)
      spyOn(__internals__, 'createBodyModeFromSchemaEnum').andCall(({ enum: e }) => e[0])

      const inputs = [
        List(),
        List([ new Parameter(), new Parameter() ]),
        List([ new Parameter() ]),
        List([ new Parameter({
          default: 123
        }) ]),
        List([ new Parameter({
          constraints: List([ new Constraint.Enum([ 234 ]) ])
        }) ])
      ]
      const expected = [
        'raw',
        'raw',
        'raw',
        123,
        234
      ]
      const actual = inputs.map(input => __internals__.createBodyModeFromContentTypeParams(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createBodyMode', () => {
    it('should work', () => {
      spyOn(__internals__, 'getContentTypeParamsFromRequestOrContext').andCall((a, r, c) => {
        return a + r + c
      })
      spyOn(__internals__, 'createBodyModeFromContentTypeParams').andCall(ct => ct * 2)

      const inputs = [
        [ 123, 234, 345 ]
      ]
      const expected = [
        (123 + 234 + 345) * 2
      ]
      const actual = inputs.map(input => __internals__.createBodyMode(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertBodyParametersIntoRawParameters', () => {
    it('should work', () => {
      const inputs = [
        OrderedMap(),
        OrderedMap({
          abc: new Parameter({
            key: 123
          }),
          def: new Parameter({
            constraints: List([ new Constraint.JSONSchema({ type: 'string', default: 'def' }) ])
          })
        })
      ]
      const expected = [
        '',
        '{{123}}\n' + JSON.stringify({ type: 'string', default: 'def' }, null, 2)
      ]
      const actual = inputs.map(
        input => __internals__.convertBodyParametersIntoRawParameters(input)
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@createBodyFromRawMode', () => {
    it('should work', () => {
      spyOn(__internals__, 'convertBodyParametersIntoRawParameters').andReturn(123)

      const inputs = [
        OrderedMap(),
        OrderedMap({
          abc: 123
        })
      ]
      const expected = [
        null,
        { key: 'raw', value: 123 }
      ]

      const actual = inputs.map(input => __internals__.createBodyFromRawMode(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createBodyFromUrlEncodedMode', () => {
    it('should work', () => {
      const inputs = [
        OrderedMap(),
        OrderedMap({
          abc: new Parameter({
            key: 123,
            default: 234
          }),
          def: new Parameter({
            key: 345
          })
        })
      ]
      const expected = [
        { key: 'urlencoded', value: [] },
        { key: 'urlencoded', value: [
          { key: 123, value: 234, enabled: true },
          { key: 345, value: '{{345}}', enabled: true }
        ] }
      ]
      const actual = inputs.map(input => __internals__.createBodyFromUrlEncodedMode(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createBodyFromFormDataMode', () => {
    it('should work', () => {
      const inputs = [
        OrderedMap(),
        OrderedMap({
          abc: new Parameter({
            key: 123,
            default: 234
          }),
          def: new Parameter({
            key: 345
          })
        })
      ]
      const expected = [
        { key: 'formdata', value: [] },
        { key: 'formdata', value: [
          { key: 123, value: 234, enabled: true },
          { key: 345, value: '{{345}}', enabled: true }
        ] }
      ]
      const actual = inputs.map(input => __internals__.createBodyFromFormDataMode(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createBodyFromMode', () => {
    it('should work', () => {
      spyOn(__internals__, 'createBodyFromRawMode').andCall(p => p * 2)
      spyOn(__internals__, 'createBodyFromUrlEncodedMode').andCall(p => p * 3)
      spyOn(__internals__, 'createBodyFromFormDataMode').andCall(p => p * 4)

      const inputs = [
        [ 123, 'raw' ],
        [ 123, 'urlencoded' ],
        [ 123, 'formdata' ],
        [ 123, 'weird' ]
      ]
      const expected = [
        123 * 2,
        123 * 3,
        123 * 4,
        null
      ]
      const actual = inputs.map(input => __internals__.createBodyFromMode(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@getBodyParamsFromRequest', () => {
    it('should work', () => {
      const inputs = [
        [ new Api(), new Request(), null ],
        [ new Api({
          store: new Store({
            parameter: OrderedMap({
              abc: new Parameter({
                key: 'userId',
                default: '123'
              })
            })
          })
        }), new Request({
          parameters: new ParameterContainer({
            body: OrderedMap({
              abc: new Reference({
                type: 'parameter',
                uuid: 'abc'
              })
            })
          })
        }), null ],
        [ new Api({
          store: new Store({
            parameter: OrderedMap({
              abc: new Parameter({
                key: 'userId',
                default: '123'
              }),
              jkl: new Parameter({
                key: 'productId',
                default: '123',
                applicableContexts: List([
                  new Parameter({
                    key: 'Content-Type',
                    constraints: List([
                      new Constraint.Enum([
                        'application/xml'
                      ])
                    ])
                  })
                ])
              })
            })
          })
        }), new Request({
          parameters: new ParameterContainer({
            body: OrderedMap({
              abc: new Reference({
                type: 'parameter',
                uuid: 'abc'
              }),
              def: new Parameter({
                key: 'queryType',
                default: 'serialized',
                applicableContexts: List([
                  new Parameter({
                    key: 'Content-Type',
                    constraints: List([ new Constraint.Enum([
                      'application/xml'
                    ]) ])
                  })
                ])
              }),
              ghi: new Parameter({
                key: 'limit',
                default: '100',
                applicableContexts: List([
                  new Parameter({
                    key: 'Content-Type',
                    constraints: List([ new Constraint.Enum([
                      'application/json'
                    ]) ])
                  })
                ])
              }),
              jkl: new Reference({
                type: 'parameter',
                uuid: 'jkl'
              })
            })
          })
        }), new Context({
          constraints: List([ new Parameter({
            key: 'Content-Type',
            default: 'application/json'
          }) ])
        }) ]
      ]
      const expected = [
        OrderedMap(),
        OrderedMap({
          abc: new Parameter({
            key: 'userId',
            default: '123'
          })
        }),
        OrderedMap({
          abc: new Parameter({
            key: 'userId',
            default: '123'
          }),
          ghi: new Parameter({
            key: 'limit',
            default: '100',
            applicableContexts: List([
              new Parameter({
                key: 'Content-Type',
                constraints: List([ new Constraint.Enum([
                  'application/json'
                ]) ])
              })
            ])
          })
        })
      ]
      const actual = inputs.map(input => __internals__.getBodyParamsFromRequest(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createBody', () => {
    it('should work', () => {
      spyOn(__internals__, 'getBodyParamsFromRequest').andCall((a, r, c) => {
        return a + (c || 0)
      })
      spyOn(__internals__, 'createBodyMode').andCall((a, r, c) => {
        return c ? c : a
      })
      spyOn(__internals__, 'createBodyFromMode').andCall((b, m) => {
        return { key: b, value: m }
      })

      const inputs = [
        [ 123, new Request() ],
        [ 123, new Request({
          contexts: List([ 234 ])
        }) ]
      ]
      const expected = [
        { key: 'body', value: { '123': 123, mode: 123 } },
        { key: 'body', value: { [123 + 234 + '']: 234, mode: 234 } }
      ]
      const actual = inputs.map(input => __internals__.createBody(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createRequestFromRequest', () => {
    it('should work', () => {
      spyOn(__internals__, 'createRequestUrl').andCall((a, res, req) => {
        return !a ? null : { key: 'url', value: a + res + (req || 0) }
      })

      spyOn(__internals__, 'createRequestAuth').andCall((a, r) => {
        if (!a) {
          return null
        }
        return r ? { key: 'auth', value: a + r } : null
      })

      spyOn(__internals__, 'createMethod').andCall(r => {
        return r ? { key: 'method', value: r * 2 } : null
      })

      spyOn(__internals__, 'createHeader').andCall((a, r) => {
        if (!a) {
          return null
        }
        return r ? { key: 'header', value: r * 3 } : { key: 'header', value: a * 3 }
      })

      spyOn(__internals__, 'createBody').andCall((a, r) => {
        if (!a) {
          return null
        }
        return r ? { key: 'body', value: r * 4 } : { key: 'body', value: a * 4 }
      })

      const inputs = [
        [ null, null, null ],
        [ 123, 234, null ],
        [ 123, 234, 345 ]
      ]
      const expected = [
        null,
        { key: 'request', value: { url: 123 + 234, header: 123 * 3, body: 123 * 4 } },
        { key: 'request', value: {
          url: 123 + 234 + 345,
          auth: 123 + 345,
          method: 345 * 2,
          header: 345 * 3,
          body: 345 * 4
        } }
      ]
      const actual = inputs.map(input => __internals__.createRequestFromRequest(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createItemFromRequest', () => {
    it('should work', () => {
      spyOn(__internals__, 'createItemName').andCall(r => {
        return r ? { key: 'name', value: r * 2 } : null
      })

      spyOn(__internals__, 'createItemDescription').andCall(r => {
        return r ? { key: 'description', value: r * 3 } : null
      })

      spyOn(__internals__, 'createRequestFromRequest').andCall((a, res, req) => {
        if (!a) {
          return null
        }
        return { key: 'request', value: a + res + (req || 0) }
      })

      const inputs = [
        [ null, null, null ],
        [ 123, 234, null ],
        [ 123, 234, 345 ]
      ]
      const expected = [
        {},
        { request: 123 + 234 },
        { name: 345 * 2, description: 345 * 3, request: 123 + 234 + 345 }
      ]
      const actual = inputs.map(input => __internals__.createItemFromRequest(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createItemsFromResource', () => {
    it('should work', () => {
      spyOn(__internals__, 'createItemFromRequest').andCall((a, res, req) => {
        return a + req
      })
      const inputs = [
        [ 123, new Resource() ],
        [ 123, new Resource({
          methods: OrderedMap({
            abc: 234,
            def: 345
          })
        }) ]
      ]
      const expected = [
        [],
        [ 123 + 234, 123 + 345 ]
      ]
      const actual = inputs.map(input => __internals__.createItemsFromResource(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createItemNameFromResource', () => {
    it('should work', () => {
      const inputs = [
        new Resource({
          name: 123
        }),
        new Resource({
          description: 234
        }),
        new Resource({
          path: new URL({
            url: '/some/path/{pathId}',
            variableDelimiters: List([ '{', '}' ])
          })
        })
      ]
      const expected = [
        { key: 'name', value: 123 },
        { key: 'name', value: 234 },
        { key: 'name', value: '/some/path/:pathId' }
      ]
      const actual = inputs.map(input => __internals__.createItemNameFromResource(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createItemGroupFromResource', () => {
    it('should work', () => {
      spyOn(__internals__, 'createItemsFromResource').andCall((a, r) => r)

      spyOn(__internals__, 'createItemNameFromResource').andCall(r => {
        return r === 345 ? { key: 'name', value: r * 2 } : null
      })

      spyOn(__internals__, 'createItemDescription').andCall(r => {
        return r === 345 ? { key: 'description', value: r * 3 } : null
      })

      const inputs = [
        [ new Api(), 'abc' ],
        [ new Api({
          resources: OrderedMap({
            abc: 123
          })
        }), 'abc' ],
        [ new Api({
          resources: OrderedMap({
            abc: 234
          })
        }), 'abc' ],
        [ new Api({
          resources: OrderedMap({
            abc: 345
          })
        }), 'abc' ]
      ]
      const expected = [
        null,
        { item: 123 },
        { item: 234 },
        { item: 345, name: 345 * 2, description: 345 * 3 }
      ]
      const actual = inputs.map(input => __internals__.createItemGroupFromResource(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@mergeItemGroupsWithSameName', () => {
    it('should work', () => {
      const inputs = [
        [ OrderedMap(), { name: 'abc', item: [ 123 ] } ],
        [ OrderedMap({ abc: { name: 'abc', item: [ 123 ] } }), { name: 'abc', item: [ 234 ] } ],
        [ OrderedMap({ abc: { name: 'abc', item: [ 123 ] } }), { name: 'def', item: [ 234 ] } ]
      ]
      const expected = [
        OrderedMap({
          abc: {
            name: 'abc',
            item: [ 123 ]
          }
        }),
        OrderedMap({
          abc: {
            name: 'abc',
            item: [ 123, 234 ]
          }
        }),
        OrderedMap({
          abc: {
            name: 'abc',
            item: [ 123 ]
          },
          def: {
            name: 'def',
            item: [ 234 ]
          }
        })
      ]
      const actual = inputs.map(input => __internals__.mergeItemGroupsWithSameName(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createRootItem', () => {
    it('should work', () => {
      spyOn(__internals__, 'createItemGroupFromResource').andCall((a, id) => {
        if (id === 'a') {
          return null
        }

        return { c: id }
      })

      spyOn(__internals__, 'mergeItemGroupsWithSameName').andCall((acc, { c }) => {
        return acc.set('c', [].concat(acc.get('c', []), c))
      })

      const inputs = [
        new Api(),
        new Api({
          group: new Group(),
          resources: OrderedMap()
        }),
        new Api({
          group: new Group(),
          resources: OrderedMap({
            a: 123,
            b: 234,
            c: 345
          })
        })
      ]
      const expected = [
        { key: 'item', value: [] },
        { key: 'item', value: [] },
        { key: 'item', value: [ [ 'b', 'c' ] ] }
      ]
      const actual = inputs.map(input => __internals__.createRootItem(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertParameterIntoVariable', () => {
    it('should work', () => {
      const inputs = [
        [ new Parameter(), 123 ],
        [ new Parameter({
          key: 'Content-Type',
          default: 'application/json',
          type: 'string'
        }), 123 ]
      ]
      const expected = [
        { id: 123 },
        { id: 123, value: 'application/json', type: 'string', name: 'Content-Type' }
      ]
      const actual = inputs.map(input => __internals__.convertParameterIntoVariable(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createVariable', () => {
    it('should work', () => {
      spyOn(__internals__, 'convertParameterIntoVariable').andCall(v => v % 2 ? v * 2 : null)

      const inputs = [
        new Api(),
        new Api({
          store: new Store({
            parameter: OrderedMap({
              a: 234,
              b: 456,
              c: 678
            })
          })
        }),
        new Api({
          store: new Store({
            parameter: OrderedMap({
              a: 123,
              b: 234,
              c: 345
            })
          })
        })
      ]
      const expected = [
        null,
        null,
        { key: 'variable', value: [ 123 * 2, 345 * 2 ] }
      ]
      const actual = inputs.map(input => __internals__.createVariable(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createPostmanCollection', () => {
    it('should work', () => {
      spyOn(__internals__, 'createInfo').andCall(a => a ? { key: 'info', value: a * 2 } : null)
      spyOn(__internals__, 'createRootItem').andCall(a => a ? { key: 'item', value: a * 3 } : null)
      spyOn(__internals__, 'createVariable').andCall(a => {
        return a ? { key: 'variable', value: a * 4 } : null
      })

      const inputs = [
        null,
        123
      ]
      const expected = [
        {},
        { info: 123 * 2, item: 123 * 3, variable: 123 * 4 }
      ]
      const actual = inputs.map(input => __internals__.createPostmanCollection(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@serialize', () => {
    it('should work', () => {
      spyOn(__internals__, 'createPostmanCollection').andReturn({
        serialized: 123
      })

      const inputs = [
        { api: 123 }
      ]
      const expected = [
        JSON.stringify({ serialized: 123 }, null, 2)
      ]

      const actual = inputs.map(input => __internals__.serialize(input))
      expect(actual).toEqual(expected)
    })

    it('should throw if postmanCollection has circular reference', () => {
      const a = { c: 123 }
      const b = { a }
      a.b = b
      spyOn(__internals__, 'createPostmanCollection').andReturn(a)

      const input = { api: 123 }
      expect(() => __internals__.serialize(input)).toThrow()
    })
  })
})
