/* eslint-disable max-nested-callbacks */
import expect, { spyOn, restoreSpies } from 'expect'

import { Mock } from '../PawMocks'

describe('mocks/PawMocks.js', () => {
  afterEach(() => restoreSpies())
  describe('{ Mock }', () => {
    describe('~constructor', () => {
      it('should only wrap functions field in object', () => {
        const obj = { a: 123, b: 234, c: 345 }
        const mock = new Mock(obj)

        expect(mock.$$_spy).toEqual({})
        expect(mock.$$_spyOn).toBeA(Function)
        expect(mock.$$_getSpy).toBeA(Function)
        delete mock.$$_spy
        delete mock.$$_spyOn
        delete mock.$$_getSpy
        expect(JSON.parse(JSON.stringify(mock))).toEqual(obj)
      })

      it('should only use provided prefix', () => {
        const obj = { a: 123, b: 234, c: 345 }
        const mock = new Mock(obj, '__')

        expect(mock.__spy).toExist()
        expect(mock.__spyOn).toExist()
        expect(mock.__getSpy).toExist()
      })

      it('should wrap function fields with spy', () => {
        const obj = { wrapped: () => 123 }
        const mock = new Mock(obj, '')

        expect(mock.spy.wrapped).toEqual({ count: 0, calls: [], func: obj.wrapped })
      })

      it('should replace wrapped function fields with spy function with spyOn', () => {
        const obj = { wrapped: () => 123 }
        const mock = new Mock(obj, '')

        expect(mock.spy.wrapped).toEqual({ count: 0, calls: [], func: obj.wrapped })
        const replaceFunc = () => 234
        mock.spyOn('wrapped', replaceFunc)
        expect(mock.spy.wrapped).toEqual({ count: 0, calls: [], func: replaceFunc })
      })

      it('should replace update spy on call', () => {
        const obj = { wrapped: () => 123 }
        const mock = new Mock(obj, '')

        expect(mock.spy.wrapped).toEqual({ count: 0, calls: [], func: obj.wrapped })
        const replaceFunc = () => 234
        mock.spyOn('wrapped', replaceFunc)
        expect(mock.spy.wrapped).toEqual({ count: 0, calls: [], func: replaceFunc })
        mock.wrapped('abc', 'def')
        expect(mock.spy.wrapped).toEqual({
          count: 1,
          calls: [ [ 'abc', 'def' ] ],
          func: replaceFunc
        })
      })
    })
  })
})
