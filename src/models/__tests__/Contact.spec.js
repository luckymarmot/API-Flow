/* eslint-disable max-nested-callbacks */
import { Record } from 'immutable'
import expect from 'expect'

import { Contact } from '../Contact'

describe('models/Contact.js', () => {
  describe('{ Contact }', () => {
    it('should be a Record', () => {
      const instance = new Contact({})

      expect(instance).toBeA(Record)
    })

    describe('#fields', () => {
      const fields = [
        'name',
        'url',
        'email'
      ]

      for (const field of fields) {
        it('should have a `' + field + '` field', () => {
          const key = field
          const value = 'test'
          const data = {}

          data[key] = value
          const instance = new Contact(data)

          expect(instance.get(key)).toEqual(value)
        })
      }
    })
  })
})
