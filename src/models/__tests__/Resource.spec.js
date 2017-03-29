/* eslint-disable max-nested-callbacks */
import expect from 'expect'

import Resource from '../Resource'

describe('models/Resource.js', () => {
  describe('{ Resource }', () => {
    describe('#fields', () => {
      const fields = [
        'name',
        'uuid',
        'endpoints',
        'path',
        'methods',
        'description',
        'interfaces'
      ]

      for (const field of fields) {
        it('should have a `' + field + '` field', () => {
          const key = field
          const value = 'test'
          const data = {}

          data[key] = value
          const instance = new Resource(data)

          expect(instance.get(key)).toEqual(value)
        })
      }
    })
  })
})
