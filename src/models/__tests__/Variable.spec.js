/* eslint-disable max-nested-callbacks */
import expect from 'expect'

import Variable from '../Variable'

describe('models/Variable.js', () => {
  describe('{ Variable }', () => {
    describe('#fields', () => {
      const fields = [
        'name',
        'values',
        'defaultEnvironment'
      ]

      for (const field of fields) {
        it('should have a `' + field + '` field', () => {
          const key = field
          const value = 'test'
          const data = {}

          data[key] = value
          const instance = new Variable(data)

          expect(instance.get(key)).toEqual(value)
        })
      }
    })
  })
})
