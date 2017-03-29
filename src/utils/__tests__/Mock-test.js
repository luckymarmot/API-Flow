import { UnitTest, registerTest } from '../TestUtils'

import {
	Mock
} from '../Mock'

@registerTest
export class TestPawMocks extends UnitTest {

  testSimpleMock() {
    const mock = new Mock()

    this.assertEqual(
            Object.keys(mock),
            [ '$$_spy', '$$_spyOn', '$$_getSpy' ]
        )
    this.assertEqual(mock.$$_spy, {})
  }

  testSimpleObjectMock() {
    const mock = new Mock({
      a: 12
    })

    this.assertEqual(
            Object.keys(mock),
            [ '$$_spy', 'a', '$$_spyOn', '$$_getSpy' ]
        )
    this.assertEqual(mock.$$_spy, {})
  }

  testSimpleObjectWithFuncMock() {
    const obj = {
      a: (arg) => {
        return arg * arg
      }
    }

    const mock = new Mock(obj)

    this.assertEqual(
            Object.keys(mock),
            [ '$$_spy', 'a', '$$_spyOn', '$$_getSpy' ]
        )
    this.assertEqual(Object.keys(mock.$$_spy), [ 'a' ])
  }

  testSimpleObjectWithFuncAndVarsMock() {
    const obj = {
      a: (arg) => {
        return arg * arg
      },
      b: true
    }

    const mock = new Mock(obj)

    this.assertEqual(
            Object.keys(mock),
            [ '$$_spy', 'a', 'b', '$$_spyOn', '$$_getSpy' ]
        )
    this.assertEqual(Object.keys(mock.$$_spy), [ 'a' ])
  }

  testSpyOn() {
    const obj = {
      a: (arg) => {
        return arg * arg
      }
    }

    const mock = new Mock(obj)

    mock.$$_spyOn(
            'a',
            (arg) => {
              return arg * 2
            }
        )

    this.assertEqual(
            Object.keys(mock),
            [ '$$_spy', 'a', '$$_spyOn', '$$_getSpy' ]
        )

    const expected = 6
    mock.a(10)
    const result = mock.a(3)
    this.assertEqual(mock.$$_spy.a.count, 2)
    this.assertEqual(mock.$$_spy.a.calls, [ [ 10 ], [ 3 ] ])
    this.assertEqual(result, expected)
  }

  testGetSpy() {
    const obj = {
      a: (arg) => {
        return arg * arg
      }
    }

    const mock = new Mock(obj)

    mock.$$_spyOn(
            'a',
            (arg) => {
              return arg * 2
            }
        )

    this.assertEqual(
            Object.keys(mock),
            [ '$$_spy', 'a', '$$_spyOn', '$$_getSpy' ]
        )

    mock.a(10)
    mock.a(3)

    this.assertEqual(mock.$$_getSpy('a').count, 2)
    this.assertEqual(mock.$$_getSpy('a').calls, [ [ 10 ], [ 3 ] ])
  }

  testMultipleSpies() {
    const obj = {
      a: (arg) => {
        return arg * arg
      },
      b: (key, value) => {
        const result = {}
        result[value] = key
        return result
      }
    }

    const mock = new Mock(obj)

    mock
            .$$_spyOn(
                'a',
                (arg) => {
                  return arg * 2
                }
            )
            .$$_spyOn(
                'b',
                (k, v) => {
                  return k + ',' + v
                }
            )

    mock.a(10)
    mock.b(3, 10)

    this.assertEqual(mock.$$_getSpy('a').count, 1)
    this.assertEqual(mock.$$_getSpy('a').calls, [ [ 10 ] ])

    this.assertEqual(mock.$$_getSpy('b').count, 1)
    this.assertEqual(mock.$$_getSpy('b').calls, [ [ 3, 10 ] ])
  }

  testPrefix() {
    const obj = {
      a: (arg) => {
        return arg * arg
      },
      b: true
    }

    let mock = new Mock(obj, '__')

    this.assertEqual(
            Object.keys(mock),
            [ '__spy', 'a', 'b', '__spyOn', '__getSpy' ]
        )
    this.assertEqual(Object.keys(mock.__spy), [ 'a' ])

        // no prefix
    mock = new Mock(obj, '')

    this.assertEqual(
            Object.keys(mock),
            [ 'spy', 'a', 'b', 'spyOn', 'getSpy' ]
        )
    this.assertEqual(Object.keys(mock.spy), [ 'a' ])
  }
}
