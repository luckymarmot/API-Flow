/* eslint-disable max-nested-callbacks */
import expect, { spyOn, restoreSpies } from 'expect'

import URL from '../../../../models/URL'

import { __internals__ } from '../Loader'

describe('loaders/postman/v2.0/Loader.js', () => {
  afterEach(() => restoreSpies())
  describe('@isParsable', () => {
    it('should work', () => {
      const inputs = [
        'not a json',
        JSON.stringify(null, null, 2),
        JSON.stringify({ info: 'some info' }, null, 2),
        JSON.stringify({ info: { schema: 'some schema' } }, null, 2),
        JSON.stringify({
          info: { schema: 'https://schema.getpostman.com/json/collection/v2.0.0/' }
        }, null, 2),
        JSON.stringify({
          info: { schema: 'https://schema.getpostman.com/json/collection/v2.0.0/' },
          item: 'some weird item'
        }, null, 2),
        // true
        JSON.stringify({
          info: { schema: 'https://schema.getpostman.com/json/collection/v2.0.0/' },
          item: []
        }, null, 2),
        JSON.stringify({ info: 'some info', item: [] }, null, 2),
        JSON.stringify({ item: [] }, null, 2)
      ]
      const expected = [
        false,
        false,
        false,
        false,
        false,
        false,
        true,
        false,
        false
      ]
      const actual = inputs.map(input => __internals__.isParsable(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@resolve', () => {
    it('should work', () => {
      const inputs = [
        [
          {
            fsResolver: { resolve: () => 123 },
            httpResolver: { resolve: () => 234 }
          }, 'https://www.example.com/test'
        ],
        [
          {
            fsResolver: { resolve: () => 123 },
            httpResolver: { resolve: () => 234 }
          }, 'file:///test'
        ],
        [
          {
            fsResolver: {
              resolve: (u) => {
                return u === 'file:///test' ? 123 : 456
              }
            },
            httpResolver: {
              resolve: (u) => {
                return u === 'https://www.example.com/test' ? 234 : 345
              }
            }
          }, 'https://www.example.com/test#some/hash'
        ],
        [
          {
            fsResolver: {
              resolve: (u) => {
                return u === 'file:///test' ? 123 : 456
              }
            },
            httpResolver: {
              resolve: (u) => {
                return u === 'https://www.example.com/test' ? 234 : 345
              }
            }
          }, 'file:///test#some/hash'
        ]
      ]
      const expected = [
        234, 123, 234, 123
      ]
      const actual = inputs.map(input => __internals__.resolve(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@normalizeRequestItem', () => {
    it('should work', () => {
      const inputs = [
        {},
        { request: {} },
        { request: 'https://www.example.com' }
      ]
      const expected = [
        {},
        { request: {} },
        { request: { url: 'https://www.example.com', method: 'GET' } }
      ]
      const actual = inputs.map(input => __internals__.normalizeRequestItem(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@normalizeAuthItem', () => {
    it('should work', () => {
      const inputs = [
        [ null, {} ],
        [ { a: 123 }, {} ],
        [ { a: 123 }, { request: {} } ],
        [ { a: 123 }, { request: { auth: { b: 234 } } } ]
      ]
      const expected = [
        {},
        { auth: { a: 123 } },
        { request: { auth: { a: 123 } } },
        { request: { auth: { b: 234 } } }
      ]
      const actual = inputs.map(input => __internals__.normalizeAuthItem(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractPostmanURLDomainFromURL', () => {
    it('should work', () => {
      const inputs = [
        new URL({ url: 'file:///test' }),
        new URL({ url: 'https://www.example.com:5050/test' })
      ]
      const expected = [
        null,
        { key: 'domain', value: 'www.example.com' }
      ]
      const actual = inputs.map(input => __internals__.extractPostmanURLDomainFromURL(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractPostmanURLPortFromURL', () => {
    it('should work', () => {
      const inputs = [
        new URL({ url: 'file:///test' }),
        new URL({ url: 'https://www.example.com:5050/test' })
      ]
      const expected = [
        null,
        { key: 'port', value: '5050' }
      ]
      const actual = inputs.map(input => __internals__.extractPostmanURLPortFromURL(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractPostmanURLPathFromURL', () => {
    it('should work', () => {
      const inputs = [
        new URL({ url: 'https://www.example.com:5050' }),
        new URL({ url: 'https://www.example.com:5050/test' })
      ]
      const expected = [
        { key: 'path', value: '/' },
        { key: 'path', value: '/test' }
      ]
      const actual = inputs.map(input => __internals__.extractPostmanURLPathFromURL(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractPostmanURLQueryFromURL', () => {
    it('should work', () => {
      const inputs = [
        'https://www.example.com/test',
        'https://www.example.com/test?some=query&limit=5',
        'https://www.example.com/test?some=query&limit=5#/some/hash'
      ]
      const expected = [
        null,
        {
          key: 'query',
          value: [ { key: 'some', value: 'query' }, { key: 'limit', value: '5' } ]
        },
        {
          key: 'query',
          value: [ { key: 'some', value: 'query' }, { key: 'limit', value: '5' } ]
        }
      ]
      const actual = inputs.map(input => __internals__.extractPostmanURLQueryFromURL(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractPostmanURLProtocolFromURL', () => {
    it('should work', () => {
      const inputs = [
        new URL({ url: '/test' }),
        new URL({ url: 'https://www.example.com:5050/test' })
      ]
      const expected = [
        { key: 'protocol', value: 'http' },
        { key: 'protocol', value: 'https' }
      ]
      const actual = inputs.map(input => __internals__.extractPostmanURLProtocolFromURL(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createPostmanURLObjectFromURLString', () => {
    it('should work', () => {
      const inputs = [
        '/test',
        'https:///test/final',
        'https://www.example.com:5050/test?some=query&limit=5',
        'https://www.example.com/test?some=query&limit=5#/some/hash'
      ]
      const expected = [
        {
          protocol: 'http',
          path: '/test'
        },
        {
          protocol: 'https',
          path: '/test/final'
        },
        {
          protocol: 'https',
          domain: 'www.example.com',
          port: '5050',
          path: '/test',
          query: [
            { key: 'some', value: 'query' },
            { key: 'limit', value: '5' }
          ]
        },
        {
          protocol: 'https',
          domain: 'www.example.com',
          path: '/test',
          query: [
            { key: 'some', value: 'query' },
            { key: 'limit', value: '5' }
          ]
        }
      ]
      const actual = inputs.map(input => __internals__.createPostmanURLObjectFromURLString(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractProtocolStringFromPostmanURLObject', () => {
    it('should work', () => {
      const inputs = [
        {},
        { protocol: 'https' }
      ]
      const expected = [
        'http://',
        'https://'
      ]
      const actual = inputs.map(
        input => __internals__.extractProtocolStringFromPostmanURLObject(input)
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractDomainStringFromPostmanURLObject', () => {
    it('should work', () => {
      const inputs = [
        {},
        { domain: '' },
        { domain: 'www.example.com' },
        { domain: [] },
        { domain: [ 'www', 'example', 'com' ] }
      ]
      const expected = [
        'localhost',
        'localhost',
        'www.example.com',
        'localhost',
        'www.example.com'
      ]
      const actual = inputs.map(
        input => __internals__.extractDomainStringFromPostmanURLObject(input)
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractPortStringFromPostmanURLObject', () => {
    it('should work', () => {
      const inputs = [
        {},
        { port: '5050' }
      ]
      const expected = [
        '',
        ':5050'
      ]
      const actual = inputs.map(input => __internals__.extractPortStringFromPostmanURLObject(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractPathStringFromPostmanURLObject', () => {
    it('should work', () => {
      const inputs = [
        {},
        { path: '/some/path' },
        { path: 1231231 },
        { path: [] },
        { path: [ 'some', 'path' ] },
        { path: [ 'some', { type: 'string', value: 'path' } ] }
      ]
      const expected = [
        '/',
        '/some/path',
        '/',
        '/',
        '/some/path',
        '/some/path'
      ]
      const actual = inputs.map(input => __internals__.extractPathStringFromPostmanURLObject(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractQueryStringFromPostmanURLObject', () => {
    it('should work', () => {
      const inputs = [
        {},
        { query: 123 },
        { query: [] },
        { query: [ {} ] },
        { query: [ { key: 123 }, { value: 234 } ] },
        { query: [ { key: 123, value: 234 }, { key: 345, value: 456 } ] }
      ]
      const expected = [
        '',
        '',
        '',
        '?=',
        '?123=&=234',
        '?123=234&345=456'
      ]
      const actual = inputs.map(
        input => __internals__.extractQueryStringFromPostmanURLObject(input)
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@createPostmanURLStringFromURLObject', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractProtocolStringFromPostmanURLObject')
        .andCall(({ protocol }) => protocol || '')
      spyOn(__internals__, 'extractDomainStringFromPostmanURLObject')
        .andCall(({ domain }) => domain || '')
      spyOn(__internals__, 'extractPortStringFromPostmanURLObject')
        .andCall(({ port }) => port || '')
      spyOn(__internals__, 'extractPathStringFromPostmanURLObject')
        .andCall(({ path }) => path || '')
      spyOn(__internals__, 'extractQueryStringFromPostmanURLObject')
        .andCall(({ query }) => query || '')

      const inputs = [
        null,
        {},
        { protocol: 12, domain: 34, port: 56, path: 78, query: 90 }
      ]
      const expected = [
        'http://localhost/',
        '',
        '1234567890'
      ]
      const actual = inputs.map(input => __internals__.createPostmanURLStringFromURLObject(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@normalizeRequestURL', () => {
    it('should work', () => {
      spyOn(__internals__, 'createPostmanURLObjectFromURLString').andCall(v => v + v)
      spyOn(__internals__, 'createPostmanURLStringFromURLObject').andCall(v => v / 2)

      const inputs = [
        { request: { url: '123' } },
        { request: { url: 234 } }
      ]
      const expected = [
        { request: { url: '123123', urlString: '123' } },
        { request: { url: 234, urlString: 234 / 2 } }
      ]
      const actual = inputs.map(input => __internals__.normalizeRequestURL(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@normalizeChild', () => {
    it('should work', () => {
      spyOn(__internals__, 'normalizeRequestItem').andCall(v => v * 2)
      spyOn(__internals__, 'normalizeAuthItem').andCall((a, v) => a + v)
      spyOn(__internals__, 'normalizeRequestURL').andCall(v => v * 3)

      const inputs = [
        [ 123, 234 ]
      ]
      const expected = [
        ((234 * 2) + 123) * 3
      ]

      const actual = inputs.map(input => __internals__.normalizeChild(...input))
      expect(actual).toEqual(expected)
    })

    it('should work with real example', () => {
      const inputs = [
        [
          {
            type: 'basic',
            basic: { username: 'jon' }
          },
          {
            name: 'some ItemGroup',
            item: []
          }
        ],
        [
          {
            type: 'basic',
            basic: { username: 'jon' }
          },
          {
            name: 'some Item',
            request: 'https://www.example.com'
          }
        ],
        [
          {
            type: 'basic',
            basic: { username: 'jon' }
          },
          {
            name: 'some Item',
            request: {
              url: 'https://www.example.com'
            }
          }
        ],
        [
          {
            type: 'basic',
            basic: { username: 'jon' }
          },
          {
            name: 'some Item',
            request: {
              url: {
                protocol: 'https',
                domain: 'www.example.com',
                path: '/some/path',
                query: [
                  { key: 'limit', value: 5 }
                ]
              }
            }
          }
        ]
      ]
      const expected = [
        {
          name: 'some ItemGroup',
          item: [],
          auth: {
            type: 'basic',
            basic: { username: 'jon' }
          }
        },
        {
          name: 'some Item',
          request: {
            method: 'GET',
            url: {
              protocol: 'https',
              domain: 'www.example.com',
              path: '/'
            },
            urlString: 'https://www.example.com',
            auth: {
              type: 'basic',
              basic: { username: 'jon' }
            }
          }
        },
        {
          name: 'some Item',
          request: {
            url: {
              protocol: 'https',
              domain: 'www.example.com',
              path: '/'
            },
            urlString: 'https://www.example.com',
            auth: {
              type: 'basic',
              basic: { username: 'jon' }
            }
          }
        },
        {
          name: 'some Item',
          request: {
            url: {
              protocol: 'https',
              domain: 'www.example.com',
              path: '/some/path',
              query: [
                { key: 'limit', value: 5 }
              ]
            },
            urlString: 'https://www.example.com/some/path?limit=5',
            auth: {
              type: 'basic',
              basic: { username: 'jon' }
            }
          }
        }
      ]

      const actual = inputs.map(input => __internals__.normalizeChild(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@normalizeItems', () => {
    it('should work', () => {
      spyOn(__internals__, 'normalizeChild').andCall((a, i) => {
        if (a) {
          i.auth = a + 1
        }
        return i
      })
      const inputs = [
        {},
        { request: {} },
        { item: [] },
        { item: [
          { request: {} },
          { request: {} }
        ] },
        { item: [
          { request: {} },
          { request: {} }
        ], auth: 123 },
        { item: [
          { request: {} },
          { request: {} },
          { item: [
            { request: {} }
          ] }
        ], auth: 123 }
      ]
      const expected = [
        {},
        { request: {} },
        { item: [] },
        { item: [
          { request: {} },
          { request: {} }
        ] },
        { item: [
          { request: {}, auth: 124 },
          { request: {}, auth: 124 }
        ], auth: 123 },
        { item: [
          { request: {}, auth: 124 },
          { request: {}, auth: 124 },
          { item: [
            { request: {}, auth: 125 }
          ], auth: 124 }
        ], auth: 123 }
      ]
      const actual = inputs.map(input => __internals__.normalizeItems(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@fixPrimary', () => {
    it('should work', (done) => {
      spyOn(__internals__, 'normalizeItems').andCall(c => c)

      const inputs = [
        [ 123, { content: null } ],
        [ 123, { content: 'null' } ],
        [ 123, { content: JSON.stringify({ a: 123 }, null, 2) } ]
      ]

      const expected = [
        {
          success: () => { throw new Error('should have failed') },
          error: () => true
        },
        {
          success: () => { throw new Error('should have failed') },
          error: () => true
        },
        {
          success: ({ options, item }) => {
            expect(options).toEqual(123)
            expect(item).toEqual({ a: 123, globals: {} })
          },
          error: (e) => { throw e || new Error('should not have failed') }
        }
      ]

      Promise.all(inputs.map((input, index) => {
        return __internals__.fixPrimary(...input)
          .then(expected[index].success, expected[index].error)
      })).then(
        () => done(),
        e => done(e || new Error('one assertion failed'))
      )
    })
  })

  describe('@handleRejection', () => {
    it('should work', (done) => {
      const input = 123123
      __internals__.handleRejection(input)
        .then(
          () => done(new Error('should have been rejected')),
          () => done()
        )
    })
  })
})
