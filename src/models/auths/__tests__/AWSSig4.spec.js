/* eslint-disable max-nested-callbacks */
import { Record } from 'immutable'
import expect from 'expect'

import { AWSSig4Auth } from '../AWSSig4'

describe('models/auths/AWSSig4Auth.js', () => {
  describe('{ AWSSig4Auth }', () => {
    it('should be a Record', () => {
      const instance = new AWSSig4Auth({})

      expect(instance).toBeA(Record)
    })

    describe('#fields', () => {
      const fields = [
        'description',
        'authName',
        'key',
        'secret',
        'region',
        'service'
      ]

      for (const field of fields) {
        it('should have a `' + field + '` field', () => {
          const key = field
          const value = 'test'
          const data = {}

          data[key] = value
          const instance = new AWSSig4Auth(data)

          expect(instance.get(key)).toEqual(value)
        })
      }
    })
  })
})
