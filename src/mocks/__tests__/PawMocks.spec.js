/* eslint-disable max-nested-callbacks */
import expect from 'expect'

import {
  Mock,
  ClassMock,
  PawContextMock,
  PawRequestMock,
  DynamicValue,
  DynamicString,
  InputField,
  NetworkHTTPRequest,
  RecordParameter,
  registerImporter, registerCodeGenerator
} from '../PawMocks'

describe('mocks/PawMocks.js', () => {
  describe('{ Mock }', () => {
    describe('~constructor', () => {
      it('should only wrap functions field in object', () => {
        const obj = { a: 123, b: 234, c: 345 }
        const mock = new Mock(obj)

        expect(mock.$$_spy).toEqual({})
        expect(mock.$$_spyOn).toBeA(Function)
        expect(mock.$$_getSpy).toBeA(Function)
        delete mock.$$_spy
        delete mock.$$_spyOn
        delete mock.$$_getSpy
        expect(JSON.parse(JSON.stringify(mock))).toEqual(obj)
      })

      it('should only use provided prefix', () => {
        const obj = { a: 123, b: 234, c: 345 }
        const mock = new Mock(obj, '__')

        expect(mock.__spy).toExist()
        expect(mock.__spyOn).toExist()
        expect(mock.__getSpy).toExist()
      })

      it('should only ignore not own properties', () => {
        function A() {
          this.a = 123
        }
        A.prototype.b = 123

        const obj = new A()
        const mock = new Mock(obj, '__')

        expect(mock.__spy).toExist()
        expect(mock.__spyOn).toExist()
        expect(mock.__getSpy).toExist()
        expect(mock.a).toExist()
        expect(mock.b).toNotExist()
      })

      it('should wrap function fields with spy', () => {
        const obj = { wrapped: () => 123 }
        const mock = new Mock(obj, '')

        expect(mock.spy.wrapped).toEqual({ count: 0, calls: [], func: obj.wrapped })
      })

      it('should replace wrapped function fields with spy function with spyOn', () => {
        const obj = { wrapped: () => 123 }
        const mock = new Mock(obj, '')

        expect(mock.spy.wrapped).toEqual({ count: 0, calls: [], func: obj.wrapped })
        const replaceFunc = () => 234
        mock.spyOn('wrapped', replaceFunc)
        expect(mock.spy.wrapped).toEqual({ count: 0, calls: [], func: replaceFunc })
      })

      it('should replace update spy on call', () => {
        const obj = { wrapped: () => 123 }
        const mock = new Mock(obj, '')

        expect(mock.spy.wrapped).toEqual({ count: 0, calls: [], func: obj.wrapped })
        const replaceFunc = () => 234
        mock.spyOn('wrapped', replaceFunc)
        expect(mock.spy.wrapped).toEqual({ count: 0, calls: [], func: replaceFunc })
        mock.wrapped('abc', 'def')
        expect(mock.spy.wrapped).toEqual({
          count: 1,
          calls: [ [ 'abc', 'def' ] ],
          func: replaceFunc
        })
      })

      it('should get correct spy on getSpy call', () => {
        const obj = { wrapped: () => 123, secret: () => 345 }
        const mock = new Mock(obj, '')

        const replaceFunc = () => 234
        const replaceSecretFunc = () => 456
        mock.spyOn('wrapped', replaceFunc)
        mock.spyOn('secret', replaceSecretFunc)

        mock.wrapped('abc', 'def')
        expect(mock.getSpy('wrapped')).toEqual({
          count: 1,
          calls: [ [ 'abc', 'def' ] ],
          func: replaceFunc
        })
      })
    })
  })

  describe('{ ClassMock }', () => {
    describe('~constructor', () => {
      it('should use 1st param as instance to mock', () => {
        class Test {
          constructor() {}

          someMethod() {
            return this.a + this.b
          }
        }
        const instance = new Test()
        const params = [ instance ]
        const actual = new ClassMock(...params)
        expect(actual.someMethod).toBeA(Function)
      })
    })
  })

  describe('{ PawContextMock }', () => {
    /* eslint-disable max-statements */
    describe('~constructor', () => {
      it('should merge 1st param into Mock', () => {
        const params = [ { a: 123, b: 234, c: 345 } ]
        const actual = new PawContextMock(...params)
        expect(actual.a).toEqual(123)
        expect(actual.b).toEqual(234)
        expect(actual.c).toEqual(345)
      })

      it('should expose `getCurrentRequest` method', () => {
        const params = [ { a: 123, b: 234, c: 345 } ]
        const actual = new PawContextMock(...params)
        expect(actual.getCurrentRequest).toBeA(Function)
        expect(actual.getCurrentRequest()).toNotExist()
      })

      it('should expose `getRequestByName` method', () => {
        const params = [ { a: 123, b: 234, c: 345 } ]
        const actual = new PawContextMock(...params)
        expect(actual.getRequestByName).toBeA(Function)
        expect(actual.getRequestByName()).toNotExist()
      })

      it('should expose `getRequestGroupByName` method', () => {
        const params = [ { a: 123, b: 234, c: 345 } ]
        const actual = new PawContextMock(...params)
        expect(actual.getRequestGroupByName).toBeA(Function)
        expect(actual.getRequestGroupByName()).toNotExist()
      })

      it('should expose `getRootRequestTreeItems` method', () => {
        const params = [ { a: 123, b: 234, c: 345 } ]
        const actual = new PawContextMock(...params)
        expect(actual.getRootRequestTreeItems).toBeA(Function)
        expect(actual.getRootRequestTreeItems()).toNotExist()
      })

      it('should expose `getRootRequests` method', () => {
        const params = [ { a: 123, b: 234, c: 345 } ]
        const actual = new PawContextMock(...params)
        expect(actual.getRootRequests).toBeA(Function)
        expect(actual.getRootRequests()).toNotExist()
      })

      it('should expose `getAllRequests` method', () => {
        const params = [ { a: 123, b: 234, c: 345 } ]
        const actual = new PawContextMock(...params)
        expect(actual.getAllRequests).toBeA(Function)
        expect(actual.getAllRequests()).toNotExist()
      })

      it('should expose `getAllGroups` method', () => {
        const params = [ { a: 123, b: 234, c: 345 } ]
        const actual = new PawContextMock(...params)
        expect(actual.getAllGroups).toBeA(Function)
        expect(actual.getAllGroups()).toNotExist()
      })

      it('should expose `getEnvironmentDomainByName` method', () => {
        const params = [ { a: 123, b: 234, c: 345 } ]
        const actual = new PawContextMock(...params)
        expect(actual.getEnvironmentDomainByName).toBeA(Function)
        expect(actual.getEnvironmentDomainByName()).toNotExist()
      })

      it('should expose `getEnvironmentVariableByName` method', () => {
        const params = [ { a: 123, b: 234, c: 345 } ]
        const actual = new PawContextMock(...params)
        expect(actual.getEnvironmentVariableByName).toBeA(Function)
        expect(actual.getEnvironmentVariableByName()).toNotExist()
      })

      it('should expose `getRequestById` method', () => {
        const params = [ { a: 123, b: 234, c: 345 } ]
        const actual = new PawContextMock(...params)
        expect(actual.getRequestById).toBeA(Function)
        expect(actual.getRequestById()).toNotExist()
      })

      it('should expose `getRequestGroupById` method', () => {
        const params = [ { a: 123, b: 234, c: 345 } ]
        const actual = new PawContextMock(...params)
        expect(actual.getRequestGroupById).toBeA(Function)
        expect(actual.getRequestGroupById()).toNotExist()
      })

      it('should expose `getEnvironmentDomainById` method', () => {
        const params = [ { a: 123, b: 234, c: 345 } ]
        const actual = new PawContextMock(...params)
        expect(actual.getEnvironmentDomainById).toBeA(Function)
        expect(actual.getEnvironmentDomainById()).toNotExist()
      })

      it('should expose `getEnvironmentVariableById` method', () => {
        const params = [ { a: 123, b: 234, c: 345 } ]
        const actual = new PawContextMock(...params)
        expect(actual.getEnvironmentVariableById).toBeA(Function)
        expect(actual.getEnvironmentVariableById()).toNotExist()
      })

      it('should expose `getEnvironmentById` method', () => {
        const params = [ { a: 123, b: 234, c: 345 } ]
        const actual = new PawContextMock(...params)
        expect(actual.getEnvironmentById).toBeA(Function)
        expect(actual.getEnvironmentById()).toNotExist()
      })

      it('should expose `createRequest` method', () => {
        const params = [ { a: 123, b: 234, c: 345 } ]
        const actual = new PawContextMock(...params)
        expect(actual.createRequest).toBeA(Function)
        expect(actual.createRequest()).toNotExist()
      })

      it('should expose `createRequestGroup` method', () => {
        const params = [ { a: 123, b: 234, c: 345 } ]
        const actual = new PawContextMock(...params)
        expect(actual.createRequestGroup).toBeA(Function)
        expect(actual.createRequestGroup()).toNotExist()
      })

      it('should expose `createEnvironmentDomain` method', () => {
        const params = [ { a: 123, b: 234, c: 345 } ]
        const actual = new PawContextMock(...params)
        expect(actual.createEnvironmentDomain).toBeA(Function)
        expect(actual.createEnvironmentDomain()).toNotExist()
      })
    })
    /* eslint-enable max-statements */
  })

  describe('{ PawRequestMock }', () => {
    /* eslint-disable max-statements */
    describe('~constructor', () => {
      it('should merge 1st param into Mock', () => {
        const params = [ { a: 123, b: 234, c: 345 } ]
        const actual = new PawRequestMock(...params)
        expect(actual.a).toEqual(123)
        expect(actual.b).toEqual(234)
        expect(actual.c).toEqual(345)
      })

      it('should expose `id` field', () => {
        const params = [ { a: 123, b: 234, c: 345 } ]
        const actual = new PawRequestMock(...params)
        expect(actual.id).toEqual(null)
      })

      it('should expose `name` field', () => {
        const params = [ { a: 123, b: 234, c: 345 } ]
        const actual = new PawRequestMock(...params)
        expect(actual.name).toEqual(null)
      })

      it('should expose `order` field', () => {
        const params = [ { a: 123, b: 234, c: 345 } ]
        const actual = new PawRequestMock(...params)
        expect(actual.order).toEqual(null)
      })

      it('should expose `parent` field', () => {
        const params = [ { a: 123, b: 234, c: 345 } ]
        const actual = new PawRequestMock(...params)
        expect(actual.parent).toEqual(null)
      })

      it('should expose `url` field', () => {
        const params = [ { a: 123, b: 234, c: 345 } ]
        const actual = new PawRequestMock(...params)
        expect(actual.url).toEqual(null)
      })

      it('should expose `method` field', () => {
        const params = [ { a: 123, b: 234, c: 345 } ]
        const actual = new PawRequestMock(...params)
        expect(actual.method).toEqual(null)
      })

      it('should expose `headers` field', () => {
        const params = [ { a: 123, b: 234, c: 345 } ]
        const actual = new PawRequestMock(...params)
        expect(actual.headers).toEqual(null)
      })

      it('should expose `httpBasicAuth` field', () => {
        const params = [ { a: 123, b: 234, c: 345 } ]
        const actual = new PawRequestMock(...params)
        expect(actual.httpBasicAuth).toEqual(null)
      })

      it('should expose `oauth1` field', () => {
        const params = [ { a: 123, b: 234, c: 345 } ]
        const actual = new PawRequestMock(...params)
        expect(actual.oauth1).toEqual(null)
      })

      it('should expose `oauth2` field', () => {
        const params = [ { a: 123, b: 234, c: 345 } ]
        const actual = new PawRequestMock(...params)
        expect(actual.oauth2).toEqual(null)
      })

      it('should expose `body` field', () => {
        const params = [ { a: 123, b: 234, c: 345 } ]
        const actual = new PawRequestMock(...params)
        expect(actual.body).toEqual(null)
      })

      it('should expose `urlEncodedBody` field', () => {
        const params = [ { a: 123, b: 234, c: 345 } ]
        const actual = new PawRequestMock(...params)
        expect(actual.urlEncodedBody).toEqual(null)
      })

      it('should expose `multipartBody` field', () => {
        const params = [ { a: 123, b: 234, c: 345 } ]
        const actual = new PawRequestMock(...params)
        expect(actual.multipartBody).toEqual(null)
      })

      it('should expose `jsonBody` field', () => {
        const params = [ { a: 123, b: 234, c: 345 } ]
        const actual = new PawRequestMock(...params)
        expect(actual.jsonBody).toEqual(null)
      })

      it('should expose `timeout` field', () => {
        const params = [ { a: 123, b: 234, c: 345 } ]
        const actual = new PawRequestMock(...params)
        expect(actual.timeout).toEqual(null)
      })

      it('should expose `followRedirects` field', () => {
        const params = [ { a: 123, b: 234, c: 345 } ]
        const actual = new PawRequestMock(...params)
        expect(actual.followRedirects).toEqual(null)
      })

      it('should expose `redirectAuthorization` field', () => {
        const params = [ { a: 123, b: 234, c: 345 } ]
        const actual = new PawRequestMock(...params)
        expect(actual.redirectAuthorization).toEqual(null)
      })

      it('should expose `sendCookies` field', () => {
        const params = [ { a: 123, b: 234, c: 345 } ]
        const actual = new PawRequestMock(...params)
        expect(actual.sendCookies).toEqual(null)
      })

      it('should expose `redirectMethod` field', () => {
        const params = [ { a: 123, b: 234, c: 345 } ]
        const actual = new PawRequestMock(...params)
        expect(actual.redirectMethod).toEqual(null)
      })

      it('should expose `storeCookies` field', () => {
        const params = [ { a: 123, b: 234, c: 345 } ]
        const actual = new PawRequestMock(...params)
        expect(actual.storeCookies).toEqual(null)
      })

      it('should expose `getUrl` method', () => {
        const params = [ 123, { b: 234, c: 345 } ]
        const actual = new PawRequestMock(...params)
        expect(actual.getUrl).toBeA(Function)
        expect(actual.getUrl()).toNotExist()
      })

      it('should expose `getUrlBase` method', () => {
        const params = [ 123, { b: 234, c: 345 } ]
        const actual = new PawRequestMock(...params)
        expect(actual.getUrlBase).toBeA(Function)
        expect(actual.getUrlBase()).toNotExist()
      })

      it('should expose `getUrlParams` method', () => {
        const params = [ 123, { b: 234, c: 345 } ]
        const actual = new PawRequestMock(...params)
        expect(actual.getUrlParams).toBeA(Function)
        expect(actual.getUrlParams()).toNotExist()
      })

      it('should expose `getUrlParameters` method', () => {
        const params = [ 123, { b: 234, c: 345 } ]
        const actual = new PawRequestMock(...params)
        expect(actual.getUrlParameters).toBeA(Function)
        expect(actual.getUrlParameters()).toNotExist()
      })

      it('should expose `getHeaders` method', () => {
        const params = [ 123, { b: 234, c: 345 } ]
        const actual = new PawRequestMock(...params)
        expect(actual.getHeaders).toBeA(Function)
        expect(actual.getHeaders()).toNotExist()
      })

      it('should expose `getHeaderByName` method', () => {
        const params = [ 123, { b: 234, c: 345 } ]
        const actual = new PawRequestMock(...params)
        expect(actual.getHeaderByName).toBeA(Function)
        expect(actual.getHeaderByName()).toNotExist()
      })

      it('should expose `setHeader` method', () => {
        const params = [ 123, { b: 234, c: 345 } ]
        const actual = new PawRequestMock(...params)
        expect(actual.setHeader).toBeA(Function)
        expect(actual.setHeader()).toNotExist()
      })

      it('should expose `getHttpBasicAuth` method', () => {
        const params = [ 123, { b: 234, c: 345 } ]
        const actual = new PawRequestMock(...params)
        expect(actual.getHttpBasicAuth).toBeA(Function)
        expect(actual.getHttpBasicAuth()).toNotExist()
      })

      it('should expose `getOAuth1` method', () => {
        const params = [ 123, { b: 234, c: 345 } ]
        const actual = new PawRequestMock(...params)
        expect(actual.getOAuth1).toBeA(Function)
        expect(actual.getOAuth1()).toNotExist()
      })

      it('should expose `getOAuth2` method', () => {
        const params = [ 123, { b: 234, c: 345 } ]
        const actual = new PawRequestMock(...params)
        expect(actual.getOAuth2).toBeA(Function)
        expect(actual.getOAuth2()).toNotExist()
      })

      it('should expose `getBody` method', () => {
        const params = [ 123, { b: 234, c: 345 } ]
        const actual = new PawRequestMock(...params)
        expect(actual.getBody).toBeA(Function)
        expect(actual.getBody()).toNotExist()
      })

      it('should expose `getUrlEncodedBody` method', () => {
        const params = [ 123, { b: 234, c: 345 } ]
        const actual = new PawRequestMock(...params)
        expect(actual.getUrlEncodedBody).toBeA(Function)
        expect(actual.getUrlEncodedBody()).toNotExist()
      })

      it('should expose `getMultipartBody` method', () => {
        const params = [ 123, { b: 234, c: 345 } ]
        const actual = new PawRequestMock(...params)
        expect(actual.getMultipartBody).toBeA(Function)
        expect(actual.getMultipartBody()).toNotExist()
      })

      it('should expose `getLastExchange` method', () => {
        const params = [ 123, { b: 234, c: 345 } ]
        const actual = new PawRequestMock(...params)
        expect(actual.getLastExchange).toBeA(Function)
        expect(actual.getLastExchange()).toNotExist()
      })
    })
    /* eslint-enable max-statements */
  })

  describe('{ DynamicValue }', () => {
    describe('~constructor', () => {
      it('should expose 1st param as `type` field', () => {
        const params = [ 123, { b: 234, c: 345 } ]
        const actual = new DynamicValue(...params)
        expect(actual.type).toEqual(123)
      })

      it('should merge 2nd param into Mock', () => {
        const params = [ 123, { b: 234, c: 345 } ]
        const actual = new DynamicValue(...params)
        expect(actual.b).toEqual(234)
        expect(actual.c).toEqual(345)
      })

      it('should expose `toString` method', () => {
        const params = [ 123, { b: 234, c: 345 } ]
        const actual = new DynamicValue(...params)
        expect(actual.toString).toBeA(Function)
        expect(actual.toString()).toNotExist()
      })

      it('should expose `getEvaluatedString` method', () => {
        const params = [ 123, { b: 234, c: 345 } ]
        const actual = new DynamicValue(...params)
        expect(actual.getEvaluatedString).toBeA(Function)
        expect(actual.getEvaluatedString()).toNotExist()
      })
    })
  })

  describe('{ DynamicString }', () => {
    /* eslint-disable max-statements */
    describe('~constructor', () => {
      it('should expose params as `components` field', () => {
        const params = [ 123, { b: 234, c: 345 } ]
        const actual = new DynamicString(...params)
        expect(actual.components).toEqual(params)
      })

      it('should expose `length` field', () => {
        const params = [ 123, { b: 234, c: 345 } ]
        const actual = new DynamicString(...params)
        expect(actual.length).toEqual(null)
      })

      it('should expose `toString` method', () => {
        const params = [ 123, { b: 234, c: 345 } ]
        const actual = new DynamicString(...params)
        expect(actual.toString).toBeA(Function)
        expect(actual.toString()).toNotExist()
      })

      it('should expose `getComponentAtIndex` method', () => {
        const params = [ 123, { b: 234, c: 345 } ]
        const actual = new DynamicString(...params)
        expect(actual.getComponentAtIndex).toBeA(Function)
        expect(actual.getComponentAtIndex()).toNotExist()
      })

      it('should expose `getSimpleString` method', () => {
        const params = [ 123, { b: 234, c: 345 } ]
        const actual = new DynamicString(...params)
        expect(actual.getSimpleString).toBeA(Function)
        expect(actual.getSimpleString()).toNotExist()
      })

      it('should expose `getOnlyString` method', () => {
        const params = [ 123, { b: 234, c: 345 } ]
        const actual = new DynamicString(...params)
        expect(actual.getOnlyString).toBeA(Function)
        expect(actual.getOnlyString()).toNotExist()
      })

      it('should expose `getOnlyDynamicValue` method', () => {
        const params = [ 123, { b: 234, c: 345 } ]
        const actual = new DynamicString(...params)
        expect(actual.getOnlyDynamicValue).toBeA(Function)
        expect(actual.getOnlyDynamicValue()).toNotExist()
      })

      it('should expose `getEvaluatedString` method', () => {
        const params = [ 123, { b: 234, c: 345 } ]
        const actual = new DynamicString(...params)
        expect(actual.getEvaluatedString).toBeA(Function)
        expect(actual.getEvaluatedString()).toNotExist()
      })

      it('should expose `copy` method', () => {
        const params = [ 123, { b: 234, c: 345 } ]
        const actual = new DynamicString(...params)
        expect(actual.copy).toBeA(Function)
        expect(actual.copy()).toNotExist()
      })

      it('should expose `appendString` method', () => {
        const params = [ 123, { b: 234, c: 345 } ]
        const actual = new DynamicString(...params)
        expect(actual.appendString).toBeA(Function)
        expect(actual.appendString()).toNotExist()
      })

      it('should expose `appendDynamicValue` method', () => {
        const params = [ 123, { b: 234, c: 345 } ]
        const actual = new DynamicString(...params)
        expect(actual.appendDynamicValue).toBeA(Function)
        expect(actual.appendDynamicValue()).toNotExist()
      })

      it('should expose `appendDynamicString` method', () => {
        const params = [ 123, { b: 234, c: 345 } ]
        const actual = new DynamicString(...params)
        expect(actual.appendDynamicString).toBeA(Function)
        expect(actual.appendDynamicString()).toNotExist()
      })
    })
    /* eslint-enable max-statements */
  })

  describe('{ InputField }', () => {
    describe('~constructor', () => {
      it('should expose 1st param as `key` field', () => {
        const params = [ 123, 234, 345, 456 ]
        const actual = new InputField(...params)
        expect(actual.key).toEqual(123)
      })

      it('should expose 2nd param as `name` field', () => {
        const params = [ 123, 234, 345, 456 ]
        const actual = new InputField(...params)
        expect(actual.name).toEqual(234)
      })

      it('should expose 3rd param as `type` field', () => {
        const params = [ 123, 234, 345, 456 ]
        const actual = new InputField(...params)
        expect(actual.type).toEqual(345)
      })

      it('should expose 4th param as `options` field', () => {
        const params = [ 123, 234, 345, 456 ]
        const actual = new InputField(...params)
        expect(actual.options).toEqual(456)
      })
    })
  })

  describe('{ NetworkHTTPRequest }', () => {
    /* eslint-disable max-statements */
    describe('~constructor', () => {
      it('should expose `requestUrl` field', () => {
        const actual = new NetworkHTTPRequest()
        expect(actual.requestUrl).toEqual(null)
      })

      it('should expose `requestMethod` field', () => {
        const actual = new NetworkHTTPRequest()
        expect(actual.requestMethod).toEqual(null)
      })

      it('should expose `requestTimeout` field', () => {
        const actual = new NetworkHTTPRequest()
        expect(actual.requestTimeout).toEqual(null)
      })

      it('should expose `requestBody` field', () => {
        const actual = new NetworkHTTPRequest()
        expect(actual.requestBody).toEqual(null)
      })

      it('should expose `responseStatusCode` field', () => {
        const actual = new NetworkHTTPRequest()
        expect(actual.responseStatusCode).toEqual(null)
      })

      it('should expose `responseHeaders` field', () => {
        const actual = new NetworkHTTPRequest()
        expect(actual.responseHeaders).toEqual(null)
      })

      it('should expose `responseBody` field', () => {
        const actual = new NetworkHTTPRequest()
        expect(actual.responseBody).toEqual(null)
      })

      it('should expose `setRequestHeader` method', () => {
        const actual = new NetworkHTTPRequest()

        expect(actual.setRequestHeader).toBeA(Function)
        expect(actual.setRequestHeader()).toNotExist()
      })

      it('should expose `getRequestHeader` method', () => {
        const actual = new NetworkHTTPRequest()

        expect(actual.getRequestHeader).toBeA(Function)
        expect(actual.getRequestHeader()).toNotExist()
      })

      it('should expose `getResponseHeader` method', () => {
        const actual = new NetworkHTTPRequest()

        expect(actual.getResponseHeader).toBeA(Function)
        expect(actual.getResponseHeader()).toNotExist()
      })

      it('should expose `send` method', () => {
        const actual = new NetworkHTTPRequest()

        expect(actual.send).toBeA(Function)
        expect(actual.send()).toNotExist()
      })
    })
    /* eslint-enable max-statements */
  })

  describe('{ RecordParameter }', () => {
    describe('~constructor', () => {
      it('should set first param as `key` in Mock', () => {
        const params = [ 123, 234, 345 ]
        const actual = new RecordParameter(...params)

        expect(actual.key).toEqual(123)
      })

      it('should set second param as `value` in Mock', () => {
        const params = [ 123, 234, 345 ]
        const actual = new RecordParameter(...params)

        expect(actual.value).toEqual(234)
      })

      it('should set third param as `enabled` in Mock', () => {
        const params = [ 123, 234, 345 ]
        const actual = new RecordParameter(...params)

        expect(actual.enabled).toEqual(345)
      })

      it('should expose `toString` method', () => {
        const params = [ 123, 234, 345 ]
        const actual = new RecordParameter(...params)

        expect(actual.toString).toBeA(Function)
        expect(actual.toString()).toNotExist()
      })
    })
  })

  describe('@registerImporter', () => {
    it('should do nothing', () => {
      const nested = { a: 123, b: 234 }
      const obj = { c: nested, d: nested }

      const expected = obj
      const actual = registerImporter(obj)

      expect(actual).toEqual(expected)
    })
  })

  describe('@registerCodeGenerator', () => {
    it('should do nothing', () => {
      const nested = { a: 123, b: 234 }
      const obj = { c: nested, d: nested }

      const expected = obj
      const actual = registerCodeGenerator(obj)

      expect(actual).toEqual(expected)
    })
  })
})
