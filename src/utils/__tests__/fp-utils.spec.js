/* eslint-disable require-jsdoc */
import expect, { spyOn, restoreSpies } from 'expect'
import { __internals__ } from '../fp-utils'

describe('utils/fp-utils', () => {
  afterEach(() => restoreSpies())
  describe('@currify', () => {
    it('should return a function', () => {
      const f1 = (a, b, c) => a + b + c
      const currified = __internals__.currify(f1, 2)
      expect(currified).toBeA(Function)
    })

    it('should call original function', () => {
      const stub = {
        f1: (a, b, c) => a + b + c
      }

      spyOn(stub, 'f1').andCallThrough()

      const currified = __internals__.currify(stub.f1, 2)
      currified(3, 4)

      expect(stub.f1).toHaveBeenCalledWith(2, 3, 4)
    })

    it('should call original function with correct parameters, in correct order', () => {
      const stub = {
        f1: (a, b, c) => a * b + c
      }

      const currified = __internals__.currify(stub.f1, 2)
      const expected = 2 * 3 + 4
      const actual = currified(3, 4)

      expect(actual).toEqual(expected)
    })
  })

  describe('@keys', () => {
    it('should return an object keys', () => {
      const input = { a: 123, b: 234 }
      const expected = [ 'a', 'b' ]
      const actual = __internals__.keys(input)

      expect(actual).toEqual(expected)
    })

    it('should return an empty list if input is not an object', () => {
      const input = 'some string'
      const expected = []
      const actual = __internals__.keys(input)

      expect(actual).toEqual(expected)
    })
  })

  describe('@values', () => {
    it('should return an object values', () => {
      const input = { a: 123, b: 234 }
      const expected = [ 123, 234 ]
      const actual = __internals__.values(input)

      expect(actual).toEqual(expected)
    })

    it('should return an empty list if input is not an object', () => {
      const input = 'some string'
      const expected = []
      const actual = __internals__.values(input)

      expect(actual).toEqual(expected)
    })
  })

  describe('@entries', () => {
    it('should return an object entries', () => {
      const input = { a: 123, b: 234 }
      const expected = [ { key: 'a', value: 123 }, { key: 'b', value: 234 } ]
      const actual = __internals__.entries(input)

      expect(actual).toEqual(expected)
    })

    it('should return an empty list if input is not an object', () => {
      const input = 'some string'
      const expected = []
      const actual = __internals__.entries(input)

      expect(actual).toEqual(expected)
    })
  })

  describe('@convertEntryListInMap', () => {
    it('should return previous dict if no key and no value', () => {
      const obj = { a: 123, b: 234 }
      const expected = obj
      const actual = __internals__.convertEntryListInMap(obj)

      expect(actual).toEqual(expected)
    })

    it('should update dict if key and value', () => {
      const obj = { a: 123, b: 234 }
      const kv = { key: 'c', value: 345 }

      const expected = {
        a: 123, b: 234, c: 345
      }
      const actual = __internals__.convertEntryListInMap(obj, kv)

      expect(actual).toEqual(expected)
    })

    it('should update dict if key and no value', () => {
      const obj = { a: 123, b: 234 }
      const kv = { key: 'c' }

      /* eslint-disable no-undefined */
      const expected = {
        a: 123, b: 234, c: undefined
      }
      /* eslint-enable no-undefined */
      const actual = __internals__.convertEntryListInMap(obj, kv)

      expect(actual).toEqual(expected)
    })

    it('should update dict if value and no key', () => {
      const obj = { a: 123, b: 234 }
      const kv = { value: 345 }

      const expected = {
        a: 123, b: 234, undefined: 345
      }
      const actual = __internals__.convertEntryListInMap(obj, kv)

      expect(actual).toEqual(expected)
    })
  })
})
/* eslint-enable require-jsdoc */
