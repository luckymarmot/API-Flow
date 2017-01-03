/* eslint-disable max-nested-callbacks */
import { Record } from 'immutable'
import expect from 'expect'

import { Request } from '../Request'

describe('models/Request.js', () => {
  describe('{ Request }', () => {
    it('should be a Record', () => {
      const instance = new Request({})

      expect(instance).toBeA(Record)
    })

    describe('#fields', () => {
      const fields = [
        'id',
        'name',
        'description',
        'urls',
        'method',
        'parameters',
        'contexts',
        'auths',
        'responses',
        'timeout',
        'tags'
      ]

      for (const field of fields) {
        it('should have a `' + field + '` field', () => {
          const key = field
          const value = 'test'
          const data = {}

          data[key] = value
          const instance = new Request(data)

          expect(instance.get(key)).toEqual(value)
        })
      }
    })
  })
})
