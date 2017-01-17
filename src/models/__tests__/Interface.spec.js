/* eslint-disable max-nested-callbacks */
import expect from 'expect'

import Interface from '../Interface'

describe('models/Interface.js', () => {
  describe('{ Interface }', () => {
    describe('#fields', () => {
      const fields = [
        'name',
        'required',
        'description'
      ]

      for (const field of fields) {
        it('should have a `' + field + '` field', () => {
          const key = field
          const value = 'test'
          const data = {}

          data[key] = value
          const instance = new Interface(data)

          expect(instance.get(key)).toEqual(value)
        })
      }
    })
  })
})
