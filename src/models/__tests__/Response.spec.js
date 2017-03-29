/* eslint-disable max-nested-callbacks */
import expect from 'expect'

import Response from '../Response'

describe('models/Response.js', () => {
  describe('{ Response }', () => {
    describe('#fields', () => {
      const fields = [
        'code',
        'description',
        'examples',
        'parameters',
        'contexts',
        'interfaces'
      ]

      for (const field of fields) {
        it('should have a `' + field + '` field', () => {
          const key = field
          const value = 'test'
          const data = {}

          data[key] = value
          const instance = new Response(data)

          expect(instance.get(key)).toEqual(value)
        })
      }
    })
  })
})
