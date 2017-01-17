/* eslint-disable max-nested-callbacks */
import expect from 'expect'

import Api from '../Api'

describe('models/Api.js', () => {
  describe('{ Api }', () => {
    describe('#fields', () => {
      const fields = [
        'resources',
        'group',
        'store',
        'info'
      ]

      for (const field of fields) {
        it('should have a `' + field + '` field', () => {
          const key = field
          const value = 'test'
          const data = {}

          data[key] = value
          const instance = new Api(data)

          expect(instance.get(key)).toEqual(value)
        })
      }
    })
  })
})
