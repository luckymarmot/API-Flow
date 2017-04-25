/* eslint-disable max-nested-callbacks */
import { Record } from 'immutable'
import expect from 'expect'

import { CustomAuth } from '../Custom'

describe('models/auths/CustomAuth.js', () => {
  describe('{ CustomAuth }', () => {
    it('should be a Record', () => {
      const instance = new CustomAuth({})

      expect(instance).toBeA(Record)
    })

    describe('#fields', () => {
      const fields = [
        'description',
        'authName',
        'setup'
      ]

      for (const field of fields) {
        it('should have a `' + field + '` field', () => {
          const key = field
          const value = 'test'
          const data = {}

          data[key] = value
          const instance = new CustomAuth(data)

          expect(instance.get(key)).toEqual(value)
        })
      }
    })
  })
})
