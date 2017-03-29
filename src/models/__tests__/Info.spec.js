/* eslint-disable max-nested-callbacks */
import { Record } from 'immutable'
import expect from 'expect'

import { Info } from '../Info'

describe('models/Info.js', () => {
  describe('{ Info }', () => {
    it('should be a Record', () => {
      const instance = new Info({})

      expect(instance).toBeA(Record)
    })

    describe('#fields', () => {
      const fields = [
        'title',
        'description',
        'tos',
        'contact',
        'license',
        'version'
      ]

      for (const field of fields) {
        it('should have a `' + field + '` field', () => {
          const key = field
          const value = 'test'
          const data = {}

          data[key] = value
          const instance = new Info(data)

          expect(instance.get(key)).toEqual(value)
        })
      }
    })
  })
})
