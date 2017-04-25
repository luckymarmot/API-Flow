/* eslint-disable max-nested-callbacks */
import { parse } from 'url'
import { Record, List } from 'immutable'
import expect, { spyOn, restoreSpies } from 'expect'

import { URL, __internals__ } from '../URL'
import URLComponent from '../URLComponent'

describe('models/URL.js', () => {
  afterEach(() => restoreSpies())
  describe('{ URL }', () => {
    it('should be a Record', () => {
      const instance = new URL({})

      expect(instance).toBeA(Record)
    })

    /* eslint-disable max-statements */
    describe('#fields', () => {
      it('should have a `protocol` field', () => {
        const key = 'protocol'
        const value = 'test'
        const data = { url: {} }
        data.url[key] = value

        const instance = new URL(data)

        expect(instance.get(key)).toEqual(List([ value ]))
      })

      it('should have a `slashes` field', () => {
        const key = 'slashes'
        const value = 'test'
        const data = { url: {} }
        data.url[key] = value

        const instance = new URL(data)

        expect(instance.get(key)).toEqual(value)
      })

      it('should have a `auth` field', () => {
        const key = 'auth'
        const value = 'test'
        const data = { url: {} }
        data.url[key] = value

        const instance = new URL(data)

        expect(instance.get(key)).toEqual(value)
      })

      it('should have a `host` field', () => {
        const key = 'host'
        const value = 'test'
        const data = { url: {} }
        data.url[key] = value

        const instance = new URL(data)

        expect(instance.get(key)).toEqual(value)
      })

      it('should have a `hostname` field', () => {
        spyOn(__internals__, 'convertURLObjectToURLComponents').andCall((urlObject) => urlObject)

        const key = 'hostname'
        const value = 'test'
        const data = { url: {} }
        data.url[key] = value

        const instance = new URL(data)

        expect(instance.get(key)).toEqual(value)
      })

      it('should have a `port` field', () => {
        spyOn(__internals__, 'convertURLObjectToURLComponents').andCall((urlObject) => urlObject)

        const key = 'port'
        const value = 'test'
        const data = { url: {} }
        data.url[key] = value

        const instance = new URL(data)

        expect(instance.get(key)).toEqual(value)
      })

      it('should have a `path` field', () => {
        const key = 'path'
        const value = 'test'
        const data = { url: {} }
        data.url[key] = value

        const instance = new URL(data)

        expect(instance.get(key)).toEqual(value)
      })

      it('should have a `pathname` field', () => {
        spyOn(__internals__, 'convertURLObjectToURLComponents').andCall((urlObject) => urlObject)

        const key = 'pathname'
        const value = 'test'
        const data = { url: {} }
        data.url[key] = value

        const instance = new URL(data)

        expect(instance.get(key)).toEqual(value)
      })

      it('should have a `search` field', () => {
        const key = 'search'
        const value = 'test'
        const data = { url: {} }
        data.url[key] = value

        const instance = new URL(data)

        expect(instance.get(key)).toEqual(value)
      })

      it('should have a `query` field', () => {
        const key = 'query'
        const value = 'test'
        const data = { url: {} }
        data.url[key] = value

        const instance = new URL(data)

        expect(instance.get(key)).toEqual(value)
      })

      it('should have a `hash` field', () => {
        const key = 'hash'
        const value = 'test'
        const data = { url: {} }
        data.url[key] = value

        const instance = new URL(data)

        expect(instance.get(key)).toEqual(value)
      })

      it('should have a `href` field', () => {
        const key = 'href'
        const value = 'test'
        const data = { url: {} }
        data.url[key] = value

        const instance = new URL(data)

        expect(instance.get(key)).toEqual(value)
      })

      it('should have a `secure` field', () => {
        const key = 'secure'
        const value = 'test'
        const data = {}
        data[key] = value

        const instance = new URL(data)

        expect(instance.get(key)).toEqual(value)
      })

      it('should have a `variableDelimiters` field', () => {
        const key = 'variableDelimiters'
        const value = 'test'
        const data = {}
        data[key] = value

        const instance = new URL(data)

        expect(instance.get(key)).toEqual(value)
      })

      it('should have a `uuid` field', () => {
        const key = 'uuid'
        const value = 'test'
        const data = {}
        data[key] = value

        const instance = new URL(data)

        expect(instance.get(key)).toEqual(value)
      })

      it('should have a `description` field', () => {
        const key = 'description'
        const value = 'test'
        const data = {}
        data[key] = value

        const instance = new URL(data)

        expect(instance.get(key)).toEqual(value)
      })
    })
    /* eslint-enable max-statements */

    describe('-methods', () => {
      describe('@generate', () => {
        it('should call __internals__.generate', () => {
          const expected = 123141
          spyOn(__internals__, 'generate').andReturn(expected)

          const component = new URL({ url: {} })
          const actual = component.generate()

          expect(actual).toEqual(expected)
          expect(__internals__.generate).toHaveBeenCalled()
        })

        it('should call __internals__.generate with correct arguments', () => {
          const expected = 123141
          spyOn(__internals__, 'generate').andReturn(expected)

          const component = new URL({ url: {} })
          const actual = component.generate(List([ 1, 2 ]), true)

          expect(actual).toEqual(expected)
          expect(__internals__.generate).toHaveBeenCalled(component, List([ 1, 2 ]), true)
        })
      })

      describe('@resolve', () => {
        it('should call __internals__.resolve', () => {
          const expected = 123141
          spyOn(__internals__, 'resolve').andReturn(expected)

          const component = new URL({ url: {} })
          const actual = component.resolve()

          expect(actual).toEqual(expected)
          expect(__internals__.resolve).toHaveBeenCalled()
        })

        it('should call __internals__.resolve with correct arguments', () => {
          const expected = 123141
          spyOn(__internals__, 'resolve').andReturn(expected)

          const url = new URL({ url: {} })
          const delimiters = List([ 1, 2 ])
          const component = new URL({ url: {} })
          const actual = component.resolve(url, delimiters, true)

          expect(actual).toEqual(expected)
          expect(__internals__.resolve).toHaveBeenCalled(
            component, url, delimiters, true
          )
        })
      })

      describe('@toURLObject', () => {
        it('should call __internals__.convertURLComponentsToURLObject', () => {
          const expected = 123141
          spyOn(__internals__, 'convertURLComponentsToURLObject').andReturn(expected)

          const component = new URL({ url: {} })
          const actual = component.toURLObject()

          expect(actual).toEqual(expected)
          expect(__internals__.convertURLComponentsToURLObject).toHaveBeenCalled()
        })

        it('should call __internals__.convertURLComponentsToURLObject with correct args', () => {
          const expected = 123141
          spyOn(__internals__, 'convertURLComponentsToURLObject').andReturn(expected)

          const component = new URL({ url: {} })
          const actual = component.toURLObject(List([ 1, 2 ]), true)

          expect(actual).toEqual(expected)
          expect(__internals__.convertURLComponentsToURLObject).toHaveBeenCalled(
            component, List([ 1, 2 ]), true
          )
        })
      })
    })

    it('should work as expected with path urls', () => {
      const instance = new URL({
        url: '/some/path/{pathId}',
        variableDelimiters: List([ '{', '}' ])
      })

      expect(instance.toURLObject(List([ '{{', '}}' ])).pathname).toEqual('/some/path/{{pathId}}')
    })
  })

  describe('@convertURLObjectToURLComponents', () => {
    it('should call fixUrlObject', () => {
      const url = 'https://echo.paw.cloud/users'
      spyOn(__internals__, 'fixUrlObject').andReturn(parse(url))

      const urlObject = parse(url)
      const variableDelimiters = List([ '{', '}' ])

      __internals__.convertURLObjectToURLComponents(urlObject, variableDelimiters)

      expect(__internals__.fixUrlObject).toHaveBeenCalledWith(urlObject)
    })

    it('should work', () => {
      const urlObject = parse('https://jon:paw@{sub}.paw.{ext}:{port}/users/{userId}?min={op}#home')
      const variableDelimiters = List([ '{', '}' ])

      const expected = {
        protocol: List([ urlObject.protocol ]),
        slashes: true,
        auth: 'jon:paw',
        host: '{sub}.paw.{ext}:{port}',
        hostname: new URLComponent({
          componentName: 'hostname',
          string: '{sub}.paw.{ext}',
          variableDelimiters
        }),
        port: new URLComponent({
          componentName: 'port',
          string: '{port}',
          variableDelimiters
        }),
        path: '/users/{userId}?min={op}',
        pathname: new URLComponent({
          componentName: 'pathname',
          string: '/users/{userId}',
          variableDelimiters
        }),
        search: '?min={op}',
        query: 'min={op}',
        hash: '#home',
        href: 'https://jon:paw@{sub}.paw.{ext}:{port}/users/{userId}?min={op}#home',
        secure: false
      }

      const actual = __internals__.convertURLObjectToURLComponents(urlObject, variableDelimiters)
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertURLComponentsToURLObject', () => {
    it('should use default values if not provided', () => {
      const url = new URL({
        url: 'http://echo.paw.cloud:80/users/123'
      })

      const expected = {
        protocol: 'http:',
        slashes: true,
        host: 'echo.paw.cloud:80',
        hostname: 'echo.paw.cloud',
        port: '80',
        pathname: '/users/123'
      }

      const actual = __internals__.convertURLComponentsToURLObject(url)

      expect(actual).toEqual(expected)
    })

    it('should work', () => {
      const delimiters = List([ '{', '}' ])
      const url = new URL({
        url: 'https://{sub}.paw.{ext}:{port}/users/{userId}',
        variableDelimiters: delimiters
      })
      const newDelimiters = List([ '{', '}' ])
      const useDefault = true

      const expected = {
        protocol: 'https:',
        slashes: true,
        host: '{sub}.paw.{ext}:{port}',
        hostname: '{sub}.paw.{ext}',
        port: '{port}',
        pathname: '/users/{userId}'
      }

      const actual = __internals__.convertURLComponentsToURLObject(url, newDelimiters, useDefault)

      expect(actual).toEqual(expected)
    })

    it('should respect `secure` constraint', () => {
      const delimiters = List([ '{', '}' ])
      const url = (new URL({
        url: 'https://{sub}.paw.{ext}:{port}/users/{userId}',
        variableDelimiters: delimiters
      }))
        .set('protocol', List([ 'https:', 'http:', 'ws:' ]))
        .set('secure', true)
      const newDelimiters = List([ '{', '}' ])
      const useDefault = true

      const expected = {
        protocol: 'https:',
        slashes: true,
        host: '{sub}.paw.{ext}:{port}',
        hostname: '{sub}.paw.{ext}',
        port: '{port}',
        pathname: '/users/{userId}'
      }

      const actual = __internals__.convertURLComponentsToURLObject(url, newDelimiters, useDefault)

      expect(actual).toEqual(expected)
    })

    it('should return null for pathname if no pathname in url', () => {
      const delimiters = List([ '{', '}' ])
      const url = (new URL({
        url: 'https://{sub}.paw.{ext}:{port}/users/{userId}',
        variableDelimiters: delimiters
      })).set('pathname', null)
      const newDelimiters = List([ '{', '}' ])
      const useDefault = true

      const expected = {
        protocol: 'https:',
        slashes: true,
        host: '{sub}.paw.{ext}:{port}',
        hostname: '{sub}.paw.{ext}',
        port: '{port}',
        pathname: null
      }

      const actual = __internals__.convertURLComponentsToURLObject(url, newDelimiters, useDefault)

      expect(actual).toEqual(expected)
    })
  })

  describe('@generate', () => {
    it('should call convertURLComponentsToURLObject', () => {
      const urlString = 'https://sub.paw.ext/users/:userId'
      spyOn(__internals__, 'convertURLComponentsToURLObject').andReturn(parse(urlString))

      const delimiters = List([ '{', '}' ])
      const useDefault = true
      const url = new URL({
        url: 'https://{sub}.paw.{ext}/users/{userId}',
        variableDelimiters: delimiters
      })

      __internals__.generate(url, delimiters, useDefault)

      expect(__internals__.convertURLComponentsToURLObject)
        .toHaveBeenCalledWith(url, delimiters, useDefault)
    })

    it('should work', () => {
      const delimiters = List([ '{', '}' ])
      const useDefault = true
      const url = new URL({
        url: 'https://{sub}.paw.{ext}/users/{userId}',
        variableDelimiters: delimiters
      })

      const expected = 'https://{sub}.paw.{ext}/users/{userId}'
      const actual = __internals__.generate(url, delimiters, useDefault)

      expect(actual).toEqual(expected)
    })

    it('should work with defaults', () => {
      const delimiters = List([ '{', '}' ])
      const url = new URL({
        url: 'https://{sub}.paw.{ext}/users/{userId}',
        variableDelimiters: delimiters
      })

      const expected = 'https://sub.paw.ext/users/userId'
      const actual = __internals__.generate(url)

      expect(actual).toEqual(expected)
    })
  })

  describe('@resolve', () => {
    it('should call generate', () => {
      spyOn(__internals__, 'generate').andReturn('https://{sub}.paw.{ext}/users/{userId}/')
      const delimiters = List([ '{', '}' ])
      const from = new URL({
        url: 'https://{sub}.paw.{ext}/users/{userId}/',
        variableDelimiters: delimiters
      })
      const to = './purchases/{purchaseId}'
      const useDefault = true

      __internals__.resolve(from, to, delimiters, useDefault)

      expect(__internals__.generate).toHaveBeenCalled()
    })

    it('should work', () => {
      const delimiters = List([ '{', '}' ])
      const from = new URL({
        url: 'https://{sub}.paw.{ext}/users/{userId}/',
        variableDelimiters: delimiters
      })
      const to = './purchases/{purchaseId}'
      const useDefault = true

      const expected = new URL({
        url: 'https://{sub}.paw.{ext}/users/{userId}/purchases/{purchaseId}',
        variableDelimiters: delimiters
      })
      const actual = __internals__.resolve(from, to, delimiters, useDefault)

      expect(actual).toEqual(expected)
    })

    it('should work with defaults', () => {
      const delimiters = List([ '{', '}' ])
      const from = new URL({
        url: 'https://{sub}.paw.{ext}/users/{userId}/',
        variableDelimiters: delimiters
      })
      const to = './purchases/{purchaseId}'

      const expected = new URL({
        url: 'https://{sub}.paw.{ext}/users/{userId}/purchases/{purchaseId}',
        variableDelimiters: delimiters
      })
      const actual = __internals__.resolve(from, to, delimiters)

      expect(actual).toEqual(expected)
    })
  })

  describe('@decodeUrlObject', () => {
    it('should decode every field that is a string', () => {
      const urlObject = {
        hostname: 'echo.paw.cloud',
        pathname: '/users/%7BuserId%7D'
      }
      const expected = {
        hostname: 'echo.paw.cloud',
        pathname: '/users/{userId}'
      }
      const actual = __internals__.decodeUrlObject(urlObject)

      expect(actual).toEqual(expected)
    })

    it('should ignore fields that are not strings', () => {
      const urlObject = {
        slashes: true,
        hostname: 'echo.paw.cloud',
        port: 8000,
        pathname: '/users/%7BuserId%7D'
      }
      const expected = {
        slashes: true,
        hostname: 'echo.paw.cloud',
        port: 8000,
        pathname: '/users/{userId}'
      }

      const actual = __internals__.decodeUrlObject(urlObject)

      expect(actual).toEqual(expected)
    })
  })

  describe('@splitHostInHostnameAndPort', () => {
    it('should set both to null if empty string', () => {
      const host = ''

      const expected = { hostname: null, port: null }
      const actual = __internals__.splitHostInHostnameAndPort(host)

      expect(actual).toEqual(expected)
    })

    it('should set port to null if no colon', () => {
      const host = 'echo.paw.cloud'

      const expected = { hostname: 'echo.paw.cloud', port: null }
      const actual = __internals__.splitHostInHostnameAndPort(host)

      expect(actual).toEqual(expected)
    })

    it('should set port and hostname to null if host is only colon', () => {
      const host = ':'

      const expected = { hostname: null, port: null }
      const actual = __internals__.splitHostInHostnameAndPort(host)

      expect(actual).toEqual(expected)
    })

    it('should work', () => {
      const host = 'echo.paw.cloud:8080'

      const expected = { hostname: 'echo.paw.cloud', port: '8080' }
      const actual = __internals__.splitHostInHostnameAndPort(host)

      expect(actual).toEqual(expected)
    })
  })

  describe('@splitPathnameInHostAndPathname', () => {
    it('should set both host and pathname to null if empty string', () => {
      const pathname = ''

      const expected = { host: null, pathname: null }
      const actual = __internals__.splitPathnameInHostAndPathname(pathname)

      expect(actual).toEqual(expected)
    })

    it('should set both host to previous pathname if it has no slash', () => {
      const pathname = '{sub}.paw.{ext}'

      const expected = { host: pathname, pathname: null }
      const actual = __internals__.splitPathnameInHostAndPathname(pathname)

      expect(actual).toEqual(expected)
    })

    it('should set host to null if previous pathname starts with slash', () => {
      const pathname = '/users/{userId}'

      const expected = { host: null, pathname }
      const actual = __internals__.splitPathnameInHostAndPathname(pathname)

      expect(actual).toEqual(expected)
    })

    it('should work', () => {
      const pathname = '{sub}.paw.{ext}/users/{userId}/purchases/{purchaseId}'

      const expected = {
        host: '{sub}.paw.{ext}',
        pathname: '/users/{userId}/purchases/{purchaseId}'
      }

      const actual = __internals__.splitPathnameInHostAndPathname(pathname)

      expect(actual).toEqual(expected)
    })
  })

  describe('@createPathFromPathNameAndSearch', () => {
    it('should return null if no pathname or search', () => {
      const pathname = null
      const search = null

      const expected = null
      const actual = __internals__.createPathFromPathNameAndSearch(pathname, search)

      expect(actual).toEqual(expected)
    })

    it('should ignore null pathname', () => {
      const pathname = null
      const search = '?query=true'

      const expected = search
      const actual = __internals__.createPathFromPathNameAndSearch(pathname, search)

      expect(actual).toEqual(expected)
    })

    it('should ignore null search', () => {
      const pathname = '/users/{userId}'
      const search = null

      const expected = pathname
      const actual = __internals__.createPathFromPathNameAndSearch(pathname, search)

      expect(actual).toEqual(expected)
    })

    it('should work', () => {
      const pathname = '/users/{userId}'
      const search = '?query=true'

      const expected = pathname + search
      const actual = __internals__.createPathFromPathNameAndSearch(pathname, search)

      expect(actual).toEqual(expected)
    })
  })

  describe('@createHrefFromBaseAndHostAndPathName', () => {
    it('should work', () => {
      const base = {
        protocol: 'https',
        slashes: true,
        auth: 'jon:paw',
        host: 'old.host.com:8080',
        pathname: '/old/path/to/resource',
        search: '?query=true',
        hash: '#NoHashtag'
      }

      const host = 'new.host.io:443'
      const pathname = '/new/awesome/path'

      const expected = 'https://jon:paw@new.host.io:443/new/awesome/path?query=true#NoHashtag'
      const actual = __internals__.createHrefFromBaseAndHostAndPathName(base, host, pathname)

      expect(actual).toEqual(expected)
    })

    it('should work with missing pathname', () => {
      const base = {
        protocol: 'https',
        slashes: true,
        auth: 'jon:paw',
        host: 'old.host.com:8080',
        pathname: '/old/path/to/resource',
        search: '?query=true',
        hash: '#NoHashtag'
      }

      const host = 'new.host.io:443'

      const expected = 'https://jon:paw@new.host.io:443/?query=true#NoHashtag'
      const actual = __internals__.createHrefFromBaseAndHostAndPathName(base, host)

      expect(actual).toEqual(expected)
    })

    it('should work with missing params', () => {
      const base = {
        protocol: 'https',
        slashes: true,
        auth: 'jon:paw',
        host: 'old.host.com:8080',
        pathname: '/old/path/to/resource',
        search: '?query=true',
        hash: '#NoHashtag'
      }

      const expected = 'https:///?query=true#NoHashtag'
      const actual = __internals__.createHrefFromBaseAndHostAndPathName(base)

      expect(actual).toEqual(expected)
    })
  })

  describe('@fixUrlObject', () => {
    it('should call decodeUrlObject', () => {
      spyOn(__internals__, 'decodeUrlObject').andReturn({ host: 'echo.paw.cloud' })

      const urlObject = {}

      __internals__.fixUrlObject(urlObject)

      expect(__internals__.decodeUrlObject).toHaveBeenCalled()
    })

    it('should return decoded UrlObject if host or no pathname', () => {
      spyOn(__internals__, 'decodeUrlObject').andReturn({ host: 'echo.paw.cloud' })

      const urlObject = {}

      const expected = { host: 'echo.paw.cloud' }
      const actual = __internals__.fixUrlObject(urlObject)

      expect(actual).toEqual(expected)
    })

    it('should call splitPathnameInHostAndPathname if no host', () => {
      spyOn(__internals__, 'splitPathnameInHostAndPathname').andReturn({
        host: 'echo.paw.cloud',
        pathname: '/users/{userId}'
      })

      const urlObject = {
        pathname: '/users/{userId}'
      }

      __internals__.fixUrlObject(urlObject)

      expect(__internals__.splitPathnameInHostAndPathname).toHaveBeenCalled()
    })

    it('should call splitHostInHostnameAndPort if no host', () => {
      spyOn(__internals__, 'splitHostInHostnameAndPort').andReturn({
        hostname: '{sub}.paw.{ext}',
        port: '{port}'
      })

      const urlObject = {
        pathname: '{sub}.paw.{ext}:{port}/users/{userId}'
      }

      __internals__.fixUrlObject(urlObject)

      expect(__internals__.splitHostInHostnameAndPort).toHaveBeenCalled()
    })

    it('should call createPathFromPathNameAndSearch', () => {
      spyOn(__internals__, 'createPathFromPathNameAndSearch').andReturn('/users/{userId}')

      const urlObject = {
        pathname: '{sub}.paw.{ext}:{port}/users/{userId}'
      }

      __internals__.fixUrlObject(urlObject)

      expect(__internals__.createPathFromPathNameAndSearch).toHaveBeenCalled()
    })

    it('should call createHrefFromBaseAndHostAndPathName', () => {
      spyOn(__internals__, 'createHrefFromBaseAndHostAndPathName')
        .andReturn('https://{sub}.paw.{ext}:{port}/users/{userId}')

      const urlObject = {
        protocol: 'https:',
        slashes: true,
        pathname: '{sub}.paw.{ext}:{port}/users/{userId}'
      }

      __internals__.fixUrlObject(urlObject)

      expect(__internals__.createHrefFromBaseAndHostAndPathName).toHaveBeenCalled()
    })

    it('should work', () => {
      const urlObject = {
        protocol: 'https:',
        slashes: true,
        pathname: '{sub}.paw.{ext}:{port}/users/{userId}'
      }

      const expected = {
        protocol: 'https:',
        slashes: true,
        host: '{sub}.paw.{ext}:{port}',
        hostname: '{sub}.paw.{ext}',
        port: '{port}',
        path: '/users/{userId}',
        pathname: '/users/{userId}',
        href: 'https://{sub}.paw.{ext}:{port}/users/{userId}'
      }
      const actual = __internals__.fixUrlObject(urlObject)

      expect(actual).toEqual(expected)
    })
  })
})
