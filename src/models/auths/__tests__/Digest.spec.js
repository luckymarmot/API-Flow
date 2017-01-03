/* eslint-disable max-nested-callbacks */
import { Record } from 'immutable'
import expect from 'expect'

import { DigestAuth } from '../Digest'

describe('models/auths/DigestAuth.js', () => {
  describe('{ DigestAuth }', () => {
    it('should be a Record', () => {
      const instance = new DigestAuth({})

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
          const instance = new DigestAuth(data)

          expect(instance.get(key)).toEqual(value)
        })
      }
    })
  })
})
