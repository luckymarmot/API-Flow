/* eslint-disable max-nested-callbacks */
import expect from 'expect'

import Store from '../Store'

describe('models/Store.js', () => {
  describe('{ Store }', () => {
    describe('#fields', () => {
      const fields = [
        'endpoint',
        'constraint',
        'variable',
        'parameter',
        'response',
        'interface'
      ]

      for (const field of fields) {
        it('should have a `' + field + '` field', () => {
          const key = field
          const value = 'test'
          const data = {}

          data[key] = value
          const instance = new Store(data)

          expect(instance.get(key)).toEqual(value)
        })
      }
    })
  })
})
