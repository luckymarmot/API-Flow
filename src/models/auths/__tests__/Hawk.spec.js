/* eslint-disable max-nested-callbacks */
import { Record } from 'immutable'
import expect from 'expect'

import { HawkAuth } from '../Hawk'

describe('models/auths/HawkAuth.js', () => {
  describe('{ HawkAuth }', () => {
    it('should be a Record', () => {
      const instance = new HawkAuth({})

      expect(instance).toBeA(Record)
    })

    describe('#fields', () => {
      const fields = [
        'description',
        'authName',
        'id',
        'key',
        'algorithm'
      ]

      for (const field of fields) {
        it('should have a `' + field + '` field', () => {
          const key = field
          const value = 'test'
          const data = {}

          data[key] = value
          const instance = new HawkAuth(data)

          expect(instance.get(key)).toEqual(value)
        })
      }
    })
  })
})
