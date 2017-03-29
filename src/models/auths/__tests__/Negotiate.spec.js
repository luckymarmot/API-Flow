/* eslint-disable max-nested-callbacks */
import { Record } from 'immutable'
import expect from 'expect'

import { NegotiateAuth } from '../Negotiate'

describe('models/auths/NegotiateAuth.js', () => {
  describe('{ NegotiateAuth }', () => {
    it('should be a Record', () => {
      const instance = new NegotiateAuth({})

      expect(instance).toBeA(Record)
    })

    describe('#fields', () => {
      const fields = [
        'description',
        'authName',
        'username',
        'password'
      ]

      for (const field of fields) {
        it('should have a `' + field + '` field', () => {
          const key = field
          const value = 'test'
          const data = {}

          data[key] = value
          const instance = new NegotiateAuth(data)

          expect(instance.get(key)).toEqual(value)
        })
      }
    })
  })
})
