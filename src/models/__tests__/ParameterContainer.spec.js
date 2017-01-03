/* eslint-disable max-nested-callbacks */
import { List, OrderedMap } from 'immutable'
import expect, { spyOn, restoreSpies } from 'expect'

import { ParameterContainer, __internals__ } from '../ParameterContainer'
import Parameter from '../Parameter'

describe('models/ParameterContainer.js', () => {
  afterEach(() => restoreSpies())
  describe('{ ParameterContainer }', () => {
    describe('#fields', () => {
      it('should have a `headers` field', () => {
        const headers = 'test'
        const data = { headers }

        const instance = new ParameterContainer(data)

        expect(instance.get('headers')).toEqual(headers)
      })

      it('should have a `queries` field', () => {
        const queries = 'test'
        const data = { queries }

        const instance = new ParameterContainer(data)

        expect(instance.get('queries')).toEqual(queries)
      })

      it('should have a `body` field', () => {
        const body = 'test'
        const data = { body }

        const instance = new ParameterContainer(data)

        expect(instance.get('body')).toEqual(body)
      })

      it('should have a `path` field', () => {
        const path = 'test'
        const data = { path }

        const instance = new ParameterContainer(data)

        expect(instance.get('path')).toEqual(path)
      })
    })

    describe('-methods', () => {
      describe('@getHeadersSet', () => {
        it('should call __internals__.getHeadersSet', () => {
          const expected = 123141
          spyOn(__internals__, 'getHeadersSet').andReturn(expected)

          const container = new ParameterContainer()
          const actual = container.getHeadersSet()

          expect(actual).toEqual(expected)
          expect(__internals__.getHeadersSet).toHaveBeenCalled()
        })

        it('should call __internals__.getHeadersSet with correct arguments', () => {
          const expected = 123141
          spyOn(__internals__, 'getHeadersSet').andReturn(expected)

          const container = new ParameterContainer()
          const actual = container.getHeadersSet()

          expect(actual).toEqual(expected)
          expect(__internals__.getHeadersSet).toHaveBeenCalled(container)
        })
      })

      describe('@filter', () => {
        it('should call __internals__.filter', () => {
          const expected = 123141
          spyOn(__internals__, 'filter').andReturn(expected)

          const container = new ParameterContainer()
          const actual = container.filter()

          expect(actual).toEqual(expected)
          expect(__internals__.filter).toHaveBeenCalled()
        })

        it('should call __internals__.filter with correct arguments', () => {
          const expected = 123141
          spyOn(__internals__, 'filter').andReturn(expected)

          const container = new ParameterContainer()
          const contextContraints = new List([ 1, 2, 3 ])
          const actual = container.filter(contextContraints)

          expect(actual).toEqual(expected)
          expect(__internals__.filter).toHaveBeenCalled(container, contextContraints)
        })
      })
    })
  })

  describe('@headerSetReducer', () => {
    it('should do nothing if no key field in Parameter', () => {
      const set = { a: 123, b: 321 }
      const param = new Parameter()

      const expected = set
      const actual = __internals__.headerSetReducer(set, param)

      expect(actual).toEqual(expected)
    })

    it('should add Param if key', () => {
      const set = {}
      const param = new Parameter({
        key: 'test'
      })

      const expected = { test: param }
      const actual = __internals__.headerSetReducer(set, param)

      expect(actual).toEqual(expected)
    })

    it('should not modifiy other keys in set', () => {
      const set = { a: 321, b: 123 }
      const param = new Parameter({
        key: 'test'
      })

      const expected = { a: 321, b: 123, test: param }
      const actual = __internals__.headerSetReducer(set, param)

      expect(actual).toEqual(expected)
    })

    it('should override key if already present', () => {
      const set = { a: 321, b: 123, test: 42 }
      const param = new Parameter({
        key: 'test'
      })

      const expected = { a: 321, b: 123, test: param }
      const actual = __internals__.headerSetReducer(set, param)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getHeadersSet', () => {
    it('should return empty Map if no headers', () => {
      const container = new ParameterContainer()

      const expected = new OrderedMap()
      const actual = __internals__.getHeadersSet(container)

      expect(actual).toEqual(expected)
    })

    it('should call headerSetReducer for each Param in headers list', () => {
      spyOn(__internals__, 'headerSetReducer').andReturn({})

      const container = new ParameterContainer({
        headers: List([ new Parameter(), new Parameter() ])
      })

      __internals__.getHeadersSet(container)

      expect(__internals__.headerSetReducer.calls.length).toEqual(2)
    })

    it('should work', () => {
      const param1 = new Parameter({
        key: 'param1'
      })
      const param2 = new Parameter({
        key: 'param2'
      })

      const container = new ParameterContainer({
        headers: List([ param1, param2 ])
      })

      const expected = new OrderedMap({ param1, param2 })
      const actual = __internals__.getHeadersSet(container)

      expect(actual).toEqual(expected)
    })
  })

  describe('@filterBlockReducer', () => {
    it('should call block.filter', () => {
      const block = List([ 1, 2, 3 ])

      spyOn(block, 'filter').andReturn('test')

      __internals__.filterBlockReducer(block, null)

      expect(block.filter).toHaveBeenCalled()
    })

    it('should call isValid on each Param in block', () => {
      const param1 = new Parameter()
      const param2 = new Parameter()
      const block = List([ param1, param2 ])

      spyOn(param1, 'isValid').andReturn(true)
      spyOn(param2, 'isValid').andReturn(true)

      __internals__.filterBlockReducer(block, null)

      expect(param1.isValid).toHaveBeenCalled()
      expect(param2.isValid).toHaveBeenCalled()
    })

    it('should work', () => {
      const param1 = new Parameter({
        key: 'Content-Type'
      })
      const param2 = new Parameter({
        key: 'Content-Type'
      })
      const block = List([ param1, param2 ])
      const param = new Parameter()

      const expected = block
      const actual = __internals__.filterBlockReducer(block, param)

      expect(actual).toEqual(expected)
    })
  })

  describe('@filterBlock', () => {
    it('should call contextContraints.reduce with filterBlockReducer', () => {
      const block = List([ 1, 2, 3 ])
      const contextContraints = List()

      spyOn(contextContraints, 'reduce').andReturn('test')

      __internals__.filterBlock(block, contextContraints)

      expect(contextContraints.reduce.calls[0].arguments.slice(0, 2))
        .toEqual([ __internals__.filterBlockReducer, block ])
    })
  })

  describe('@filter', () => {
    it('should do nothing if no contextContraints', () => {
      const container = new ParameterContainer({
        headers: List([ 1, 2, 3 ])
      })
      const contextContraints = null

      const expected = container
      const actual = __internals__.filter(container, contextContraints)

      expect(actual).toEqual(expected)
    })

    it('should call filterBlock for each block in the container', () => {
      spyOn(__internals__, 'filterBlock').andReturn('test')

      const container = new ParameterContainer({
        headers: List([ 1, 2, 3 ])
      })
      const contextContraints = new List([ 1 ])

      __internals__.filter(container, contextContraints)

      expect(__internals__.filterBlock.calls.length).toEqual(4)
    })

    it('should work', () => {
      spyOn(__internals__, 'filterBlock').andReturn('test')

      const container = new ParameterContainer({
        headers: List([ 1, 2, 3 ])
      })
      const contextContraints = new List([ 1 ])

      const expected = new ParameterContainer({
        headers: 'test',
        queries: 'test',
        body: 'test',
        path: 'test'
      })
      const actual = __internals__.filter(container, contextContraints)

      expect(actual).toEqual(expected)
    })
  })
})
