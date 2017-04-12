/* eslint-disable max-nested-callbacks */
import expect, { spyOn, restoreSpies } from 'expect'

import { __internals__ } from '../Loader'

describe('loaders/postman/v2.0/Loader.js', () => {
  afterEach(() => restoreSpies())
  describe('@isParsable', () => {
    const cases = [
      {
        test: 'should return false if no content',
        input: [],
        expected: false
      },
      {
        test: 'should return false if content',
        input: [ 'some content' ],
        expected: false
      }
    ]

    cases.forEach(({ test = 'should work', input, expected }) => {
      it(test, () => {
        const actual = __internals__.isParsable(...input)
        expect(actual).toEqual(expected)
      })
    })
  })

  describe('@resolve', () => {
    const cases = [
      {
        test: 'should use the httpResolver if uri starts with http',
        input: [
          {
            fsResolver: { resolve: () => 123 },
            httpResolver: { resolve: () => 234 }
          },
          'https://www.example.com/test'
        ],
        expected: 234
      },
      {
        test: 'should use the fsResolver if uri starts with file',
        input: [
          {
            fsResolver: { resolve: () => 123 },
            httpResolver: { resolve: () => 234 }
          },
          'file:///test'
        ],
        expected: 123
      },
      {
        test: 'should ignore the hash fragment with the httpResolver',
        input: [
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
          },
          'https://www.example.com/test#some/hash'
        ],
        expected: 234
      },
      {
        test: 'should ignore the hash fragment with the fsResolver',
        input: [
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
          },
          'file:///test#some/hash'
        ],
        expected: 123
      }
    ]

    cases.forEach(({ test = 'should work', input, expected }) => {
      it(test, () => {
        const actual = __internals__.resolve(...input)
        expect(actual).toEqual(expected)
      })
    })
  })

  describe('@fixPrimary', () => {
    const cases = [
      {
        test: 'should reject if no content',
        input: [
          { someOptions: 123 },
          { content: null }
        ],
        expected: {
          success: (done) => () => done(new Error('should have rejected')),
          error: (done) => () => done()
        }
      },
      {
        test: 'should reject if content',
        input: [
          { someOptions: 123 },
          { content: 'some content' }
        ],
        expected: {
          success: (done) => () => done(new Error('should have rejected')),
          error: (done) => () => done()
        }
      }
    ]

    cases.forEach(({ test = 'should work', input, expected }) => {
      it(test, (done) => {
        __internals__.fixPrimary(...input).then(
          expected.success(done),
          expected.error(done)
        )
      })
    })
  })

  describe('@handleRejection', () => {
    const cases = [
      {
        test: 'should reject',
        input: [
          new Error('failed to resolve uri for some reason')
        ],
        expected: {
          success: (done) => () => done(new Error('should have rejected')),
          error: (done) => () => done()
        }
      }
    ]

    cases.forEach(({ test = 'should work', input, expected }) => {
      it(test, (done) => {
        __internals__.handleRejection(...input).then(
          expected.success(done),
          expected.error(done)
        )
      })
    })
  })

  describe('@load', () => {
    const cases = [
      {
        test: 'should call methods.fixPrimary if methods.resolve successfully resolves',
        before: () => {
          spyOn(__internals__, 'resolve').andReturn(Promise.resolve(123))
          spyOn(__internals__, 'fixPrimary').andCall((opt, { content }) => {
            if (content === 123) {
              return Promise.resolve(234)
            }

            return Promise.reject(new Error('content should have been 123'))
          })
          spyOn(__internals__, 'handleRejection').andReturn(
            Promise.reject(new Error('should not have been called'))
          )
        },
        input: [
          { options: { someOptions: 123 }, uri: 'some-uri' }
        ],
        expected: {
          success: (done) => () => done(),
          error: (done) => (e) => done(new Error(e))
        }
      },
      {
        test: 'should call methods.handleRejection if methods.resolve fails to resolve',
        before: () => {
          spyOn(__internals__, 'resolve').andReturn(Promise.reject(new Error('failed to resolve')))
          spyOn(__internals__, 'fixPrimary').andReturn(
            Promise.reject(new Error('should not have been called'))
          )
          spyOn(__internals__, 'handleRejection').andReturn(
            Promise.resolve('successfully called handleRejection')
          )
        },
        input: [
          { options: { someOptions: 123 }, uri: 'some-uri' }
        ],
        expected: {
          success: (done) => () => done(),
          error: (done) => (e) => done(new Error(e))
        }
      }
    ]

    cases.forEach(({ test = 'should work', before, input, expected }) => {
      it(test, (done) => {
        before()
        __internals__.load(...input).then(
          expected.success(done),
          expected.error(done)
        )
      })
    })
  })
})
