import { describe, it, before, after, beforeEach, afterEach } from 'mocha'
import { assert } from 'chai'
import Immutable from 'immutable'


class UnitTest {
    /**
     *  Override setUpClass
     *  @return {NULL} NULL
     */
    setUpClass() {}

    /**
     *  Override tearDownClass
     *  @return {NULL} NULL
     */
    tearDownClass() {}

    /**
     *  Override setUp
     *  @return {NULL} NULL
     */
    setUp() {}


    /**
     *  tearDown
     * @return {NULL} NULL
     */
    tearDown() {}


    _getTests() {
        const prototype = Object.getPrototypeOf(this)
        let tests = {}

        for (let fname of Object.getOwnPropertyNames(prototype)) {
            if (fname.startsWith('test')) {
                const newFnName = this._parseFnName(fname)

                tests[newFnName] = ::Object.getPrototypeOf(this)[fname]
            }
        }

        return tests
    }

    _parseFnName(name) {
        return name.replace(/^test/, '')
    }

    assert(value) {
        assert(value)
    }

    assertTrue(value) {
        assert.isTrue(value)
    }

    assertFalse(value) {
        assert.isFalse(value)
    }

    assertEqual(a, b, message) {
        let A = Immutable.fromJS(a)
        let B = Immutable.fromJS(b)
        let comparison = Immutable.is(A, B)
        let warn = (message ? message + '\n' : '') + `\n${A} \n!== \n${B}`
        assert.isTrue(
            comparison, warn
        )
    }

    assertNotEqual(a, b) {
        assert.isFalse(Immutable.is(Immutable.fromJS(a), Immutable.fromJS(b)),
        `${a} === ${b}`)
    }

    assertEqualElements(a, b) {
        assert.isTrue(Immutable.is(
            Immutable.Set(Immutable.fromJS(a)),
                Immutable.Set(Immutable.fromJS(b))),
                    `${a} !== ${b}`)
    }

    assertNotNull(value) {
        this.assertTrue(value !== null)
    }

    assertNull(value) {
        this.assertTrue(value === null)
    }

    assertIsInstanceOf(value, cls) {
        assert.isTrue(value instanceof cls, `${value} !instanceof ${cls}`)
    }
}

function registerTest(Class) {
    const test = new Class()
    const tests = test._getTests()
    describe(Class.name.replace(/Test$/, ''), () => {
        before(test.setUpClass.bind(test))
        after(test.tearDownClass.bind(test))
        beforeEach(test.setUp.bind(test))
        afterEach(test.tearDown.bind(test))

        for (let fname of Object.keys(tests)) {
            it(fname, tests[fname].bind(test))
        }
    })
}


class MockedFunction {
    constructor() {
        this.calls = []
        this.returnValue = null
    }

    setReturnValue(value) {
        this.returnValue = value
    }

    func() {
        this.calls.push(arguments)
        return this.returnValue
    }

    getCallBack = ()=> {
        return ::this.func
    };
}

function mockFunction(target, key, descriptor) {
    const fn = descriptor.value
    descriptor.value = function() {
        const mockedFunction = new MockedFunction()
        return fn.apply(this,
          Immutable.List(arguments).push(mockedFunction).toJS())
    }
    return descriptor
}

export { UnitTest, registerTest, mockFunction }
