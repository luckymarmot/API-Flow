/* eslint-disable max-nested-callbacks */
import { Record } from 'immutable'
import expect from 'expect'

import { OAuth1Auth } from '../OAuth1'

describe('models/auths/OAuth1Auth.js', () => {
  describe('{ OAuth1Auth }', () => {
    it('should be a Record', () => {
      const instance = new OAuth1Auth({})

      expect(instance).toBeA(Record)
    })

    describe('#fields', () => {
      const fields = [
        'description',
        'authName',
        'callback',
        'consumerSecret',
        'tokenSecret',
        'consumerKey',
        'algorithm',
        'nonce',
        'additionalParameters',
        'timestamp',
        'token',
        'version',
        'signature',
        'tokenCredentialsUri',
        'requestTokenUri',
        'authorizationUri'
      ]

      for (const field of fields) {
        it('should have a `' + field + '` field', () => {
          const key = field
          const value = 'test'
          const data = {}

          data[key] = value
          const instance = new OAuth1Auth(data)

          expect(instance.get(key)).toEqual(value)
        })
      }
    })
  })
})
