/* eslint-disable max-nested-callbacks */
import { Record, OrderedMap, List } from 'immutable'
import expect, { spyOn, restoreSpies } from 'expect'

import { Group, __internals__ } from '../Group'

describe('models/Group.js', () => {
  afterEach(() => restoreSpies())
  describe('{ Group }', () => {
    it('should be a Group', () => {
      const instance = new Group({})

      expect(instance).toBeA(Record)
    })

    describe('#fields', () => {
      const fields = [
        'id',
        'name',
        'description',
        'children'
      ]

      for (const field of fields) {
        it('should have a `' + field + '` field', () => {
          const key = field
          const value = 'test'
          const data = {}

          data[key] = value
          const instance = new Group(data)

          expect(instance.get(key)).toEqual(value)
        })
      }
    })

    describe('-methods', () => {
      describe('@getRequestIds', () => {
        it('should call __internals__.getRequestIds', () => {
          const expected = 123141
          spyOn(__internals__, 'getRequestIds').andReturn(expected)

          const group = new Group()
          const actual = group.getRequestIds()

          expect(actual).toEqual(expected)
          expect(__internals__.getRequestIds).toHaveBeenCalled()
        })

        it('should call __internals__.getRequestIds with correct arguments', () => {
          const expected = 123141
          spyOn(__internals__, 'getRequestIds').andReturn(expected)

          const group = new Group()
          const actual = group.getRequestIds()

          expect(actual).toEqual(expected)
          expect(__internals__.getRequestIds).toHaveBeenCalled(group)
        })
      })

      describe('@getRequests', () => {
        it('should call __internals__.getRequests', () => {
          const expected = 123141
          spyOn(__internals__, 'getRequests').andReturn(expected)

          const group = new Group()
          const actual = group.getRequests()

          expect(actual).toEqual(expected)
          expect(__internals__.getRequests).toHaveBeenCalled()
        })

        it('should call __internals__.getRequests with correct arguments', () => {
          const expected = 123141
          spyOn(__internals__, 'getRequests').andReturn(expected)

          const group = new Group()
          const requestMap = new OrderedMap({
            a: 123,
            b: 321
          })
          const actual = group.getRequests(requestMap)

          expect(actual).toEqual(expected)
          expect(__internals__.getRequests).toHaveBeenCalledWith(group, requestMap)
        })
      })
    })
  })

  describe('@isId', () => {
    it('should return true if id is string', () => {
      const id = 'test'
      const expected = true
      const actual = __internals__.isId(id)

      expect(actual).toEqual(expected)
    })

    it('should return true if id is number', () => {
      const id = 124124
      const expected = true
      const actual = __internals__.isId(id)

      expect(actual).toEqual(expected)
    })

    it('should return false if id is Group', () => {
      const id = new Group()
      const expected = false
      const actual = __internals__.isId(id)

      expect(actual).toEqual(expected)
    })
  })

  describe('@isGroup', () => {
    it('should return false if id is string', () => {
      const id = 'test'
      const expected = false
      const actual = __internals__.isGroup(id)

      expect(actual).toEqual(expected)
    })

    it('should return false if id is number', () => {
      const id = 124124
      const expected = false
      const actual = __internals__.isGroup(id)

      expect(actual).toEqual(expected)
    })

    it('should return true if id is Group', () => {
      const id = new Group()
      const expected = true
      const actual = __internals__.isGroup(id)

      expect(actual).toEqual(expected)
    })
  })

  describe('@flattenReducer', () => {
    it('should concatenate the content of the second list to the content of the first', () => {
      const flat = List([ 1, 2, 3 ])
      const list = List([ 4, 5, 6 ])

      const expected = List([ 1, 2, 3, 4, 5, 6 ])
      const actual = __internals__.flattenReducer(flat, list)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getRequestIds', () => {
    it('should return empty List if no group', () => {
      const group = null

      const expected = List()
      const actual = __internals__.getRequestIds(group)

      expect(actual).toEqual(expected)
    })

    it('should return empty List if no children in group', () => {
      const group = new Group()

      const expected = List()
      const actual = __internals__.getRequestIds(group)

      expect(actual).toEqual(expected)
    })

    it('should call isId with each child of group', () => {
      spyOn(__internals__, 'isId').andReturn(false)
      const group = new Group({
        children: OrderedMap({
          a: 123,
          b: 321
        })
      })

      __internals__.getRequestIds(group)

      expect(__internals__.isId.calls.length).toEqual(2)
      expect(__internals__.isId.calls[0].arguments.slice(0, 1)).toEqual([ 123 ])
      expect(__internals__.isId.calls[1].arguments.slice(0, 1)).toEqual([ 321 ])
    })

    it('should call isGroup with each child of group', () => {
      spyOn(__internals__, 'isGroup').andReturn(false)
      const group = new Group({
        children: OrderedMap({
          a: 123,
          b: 321
        })
      })

      __internals__.getRequestIds(group)

      expect(__internals__.isGroup.calls.length).toEqual(2)
      expect(__internals__.isGroup.calls[0].arguments.slice(0, 1)).toEqual([ 123 ])
      expect(__internals__.isGroup.calls[1].arguments.slice(0, 1)).toEqual([ 321 ])
    })

    it('should call itself on each sub group', () => {
      spyOn(__internals__, 'getRequestIds').andCallThrough()
      const subA = new Group({
        name: 'subA'
      })
      const subB = new Group({
        name: 'subB'
      })
      const subC = new Group({
        name: 'subC'
      })

      const group = new Group({
        children: OrderedMap({
          a: subA,
          b: subB,
          c: subC
        })
      })

      __internals__.getRequestIds(group)

      expect(__internals__.getRequestIds.calls.length).toEqual(4)
      expect(__internals__.getRequestIds.calls[1].arguments.slice(0, 1))
        .toEqual([ subA ])
      expect(__internals__.getRequestIds.calls[2].arguments.slice(0, 1))
        .toEqual([ subB ])
      expect(__internals__.getRequestIds.calls[3].arguments.slice(0, 1))
        .toEqual([ subC ])
    })

    it('should call flattenReducer with each requestIds List from the sub groups', () => {
      spyOn(__internals__, 'flattenReducer').andReturn(List([ 789, 987 ]))

      const subA = new Group({
        name: 'subA',
        children: OrderedMap({ a1: 123, a2: 321 })
      })
      const subB = new Group({
        name: 'subB',
        children: OrderedMap({ b1: 234, b2: 432 })
      })
      const subC = new Group({
        name: 'subC',
        children: OrderedMap({ c1: 345, c2: 543 })
      })

      const group = new Group({
        children: OrderedMap({
          a: subA,
          b: subB,
          c: subC
        })
      })

      __internals__.getRequestIds(group)

      expect(__internals__.flattenReducer.calls.length).toEqual(3)
      expect(__internals__.flattenReducer.calls[0].arguments.slice(0, 2))
        .toEqual([ List(), List([ 123, 321 ]) ])
      expect(__internals__.flattenReducer.calls[1].arguments.slice(0, 2))
        .toEqual([ List([ 789, 987 ]), List([ 234, 432 ]) ])
      expect(__internals__.flattenReducer.calls[2].arguments.slice(0, 2))
        .toEqual([ List([ 789, 987 ]), List([ 345, 543 ]) ])
    })

    it('should work', () => {
      const subSubA = new Group({
        name: 'subSubA',
        children: OrderedMap({ aa1: 456, aa2: 654 })
      })

      const subA = new Group({
        name: 'subA',
        children: OrderedMap({ a1: 123, a2: 321, a3: subSubA })
      })
      const subB = new Group({
        name: 'subB',
        children: OrderedMap({ b1: 234, b2: 432 })
      })
      const subC = new Group({
        name: 'subC',
        children: OrderedMap({ c1: 345, c2: 543 })
      })

      const group = new Group({
        children: OrderedMap({
          a: subA,
          b: subB,
          c: subC,
          d: 567,
          e: 765
        })
      })

      const expected = List([ 456, 654, 123, 321, 234, 432, 345, 543, 567, 765 ])
      const actual = __internals__.getRequestIds(group)

      expect(actual).toEqual(expected)
    })
  })

  describe('@isRequest', () => {
    it('should return true if Request not null', () => {
      const request = { a: 123 }
      const expected = true
      const actual = __internals__.isRequest(request)

      expect(actual).toEqual(expected)
    })

    it('should return false if Request is null', () => {
      const request = null
      const expected = false
      const actual = __internals__.isRequest(request)

      expect(actual).toEqual(expected)
    })
  })

  describe('@getRequests', () => {
    it('should return empty List if no Request Map', () => {
      const group = new Group({
        children: OrderedMap({
          a: 123,
          b: 321
        })
      })

      const requestMap = null

      const expected = List()
      const actual = __internals__.getRequests(group, requestMap)

      expect(actual).toEqual(expected)
    })

    it('should return empty List if no Group', () => {
      const group = null

      const requestMap = OrderedMap({
        '123': 'req1',
        '321': 'req2'
      })

      const expected = List()
      const actual = __internals__.getRequests(group, requestMap)

      expect(actual).toEqual(expected)
    })

    it('should call getRequestIds', () => {
      spyOn(__internals__, 'getRequestIds').andReturn(List([ 123, 321 ]))

      const group = new Group({
        children: OrderedMap({
          a: 123,
          b: 321
        })
      })

      const requestMap = OrderedMap({
        '123': 'req1',
        '321': 'req2'
      })

      __internals__.getRequests(group, requestMap)

      expect(__internals__.getRequestIds).toHaveBeenCalledWith(group)
    })

    it('should drop non-matching requests ids', () => {
      const group = new Group({
        children: OrderedMap({
          a: 789,
          b: 678,
          c: 987
        })
      })

      const requestMap = OrderedMap({
        '123': 'req1',
        '321': 'req2'
      })

      const expected = List()
      const actual = __internals__.getRequests(group, requestMap)

      expect(actual).toEqual(expected)
    })

    it('should work', () => {
      const group = new Group({
        children: OrderedMap({
          a: 123,
          b: 321,
          c: 987
        })
      })

      const requestMap = OrderedMap({
        '123': 'req1',
        '321': 'req2'
      })

      const expected = List([ 'req1', 'req2' ])
      const actual = __internals__.getRequests(group, requestMap)

      expect(actual).toEqual(expected)
    })
  })
})
