/* eslint-disable max-nested-callbacks */
import { Record } from 'immutable'
import expect from 'expect'

import { OAuth2Auth } from '../OAuth2'

describe('models/auths/OAuth2Auth.js', () => {
  describe('{ OAuth2Auth }', () => {
    it('should be a Record', () => {
      const instance = new OAuth2Auth({})

      expect(instance).toBeA(Record)
    })

    describe('#fields', () => {
      const fields = [
        'description',
        'authName',
        'flow',
        'authorizationUrl',
        'tokenUrl',
        'scopes'
      ]

      for (const field of fields) {
        it('should have a `' + field + '` field', () => {
          const key = field
          const value = 'test'
          const data = {}

          data[key] = value
          const instance = new OAuth2Auth(data)

          expect(instance.get(key)).toEqual(value)
        })
      }
    })
  })
})
