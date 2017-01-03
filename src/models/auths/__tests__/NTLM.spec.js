/* eslint-disable max-nested-callbacks */
import { Record } from 'immutable'
import expect from 'expect'

import { NTLMAuth } from '../NTLM'

describe('models/auths/NTLMAuth.js', () => {
  describe('{ NTLMAuth }', () => {
    it('should be a Record', () => {
      const instance = new NTLMAuth({})

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
          const instance = new NTLMAuth(data)

          expect(instance.get(key)).toEqual(value)
        })
      }
    })
  })
})
