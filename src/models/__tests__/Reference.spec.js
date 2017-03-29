/* eslint-disable max-nested-callbacks */
import expect, { spyOn, restoreSpies } from 'expect'

import { Reference, __internals__ } from '../Reference'

describe('models/Reference.js', () => {
  afterEach(() => restoreSpies())
  describe('{ Reference }', () => {
    describe('#fields', () => {
      const fields = [
        'type',
        'uuid',
        'overlay'
      ]

      for (const field of fields) {
        it('should have a `' + field + '` field', () => {
          const key = field
          const value = 'test'
          const data = {}

          data[key] = value
          const instance = new Reference(data)

          expect(instance.get(key)).toEqual(value)
        })
      }
    })

    describe('-methods', () => {
      describe('@getLocation', () => {
        it('should call __internals__.getLocation', () => {
          const expected = 123141
          spyOn(__internals__, 'getLocation').andReturn(expected)

          const ref = new Reference()
          const actual = ref.getLocation()

          expect(actual).toEqual(expected)
          expect(__internals__.getLocation).toHaveBeenCalled()
        })

        it('should call __internals__.getLocation with the correct arguments', () => {
          const expected = 123141
          spyOn(__internals__, 'getLocation').andReturn(expected)

          const ref = new Reference()
          const actual = ref.getLocation()

          expect(actual).toEqual(expected)
          expect(__internals__.getLocation).toHaveBeenCalledWith(ref)
        })
      })
    })
  })

  describe('@getLocation', () => {
    it('should work', () => {
      const refs = [
        new Reference({ type: 'variable', uuid: 1234 }),
        new Reference({ type: 7538, uuid: 1234 }),
        new Reference({ type: 'whatever', uuid: '#/definitions/userId' }),
        new Reference({ type: 8749, uuid: 'someUuid' })
      ]

      const expecteds = [
        [ 'variable', 1234 ],
        [ 7538, 1234 ],
        [ 'whatever', '#/definitions/userId' ],
        [ 8749, 'someUuid' ]
      ]

      const actuals = refs.map(ref => ref.getLocation())

      actuals.map((actual, index) => {
        const expected = expecteds[index]
        expect(actual).toEqual(expected)
      })
    })
  })
})
