/* eslint-disable max-nested-callbacks */
import { Record } from 'immutable'
import expect from 'expect'

import { BasicAuth } from '../Basic'

describe('models/auths/BasicAuth.js', () => {
  describe('{ BasicAuth }', () => {
    it('should be a Record', () => {
      const instance = new BasicAuth({})

      expect(instance).toBeA(Record)
    })

    describe('#fields', () => {
      const fields = [
        'description',
        'authName',
        'username',
        'password',
        'raw'
      ]

      for (const field of fields) {
        it('should have a `' + field + '` field', () => {
          const key = field
          const value = 'test'
          const data = {}

          data[key] = value
          const instance = new BasicAuth(data)

          expect(instance.get(key)).toEqual(value)
        })
      }
    })
  })
})
