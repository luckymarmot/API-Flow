/* eslint-disable max-nested-callbacks */
import expect from 'expect'

import Model from '../ModelInfo'

describe('models/ModelInfo.js', () => {
  describe('{ Model }', () => {
    describe('#fields', () => {
      it('should have a `name` field', () => {
        const name = 'test'
        const data = { name }

        const instance = new Model(data)

        expect(instance.get('name')).toEqual(name)
      })

      it('should have a `version` field', () => {
        const version = 'test'
        const data = { version }

        const instance = new Model(data)

        expect(instance.get('version')).toEqual(version)
      })
    })
  })
})
