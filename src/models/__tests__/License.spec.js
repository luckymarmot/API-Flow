/* eslint-disable max-nested-callbacks */
import { Record } from 'immutable'
import expect from 'expect'

import { License } from '../License'

describe('models/License.js', () => {
  describe('{ License }', () => {
    it('should be a Record', () => {
      const instance = new License({})

      expect(instance).toBeA(Record)
    })

    describe('#fields', () => {
      const fields = [
        'name',
        'url'
      ]

      for (const field of fields) {
        it('should have a `' + field + '` field', () => {
          const key = field
          const value = 'test'
          const data = {}

          data[key] = value
          const instance = new License(data)

          expect(instance.get(key)).toEqual(value)
        })
      }
    })
  })
})
