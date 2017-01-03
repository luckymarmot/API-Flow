/* eslint-disable max-nested-callbacks */
import { Record } from 'immutable'
import expect from 'expect'

import { ApiKeyAuth } from '../ApiKey'

describe('models/auths/ApiKeyAuth.js', () => {
  describe('{ ApiKeyAuth }', () => {
    it('should be a Record', () => {
      const instance = new ApiKeyAuth({})

      expect(instance).toBeA(Record)
    })

    describe('#fields', () => {
      const fields = [
        'description',
        'authName',
        'name',
        'in',
        'key'
      ]

      for (const field of fields) {
        it('should have a `' + field + '` field', () => {
          const key = field
          const value = 'test'
          const data = {}

          data[key] = value
          const instance = new ApiKeyAuth(data)

          expect(instance.get(key)).toEqual(value)
        })
      }
    })
  })
})
