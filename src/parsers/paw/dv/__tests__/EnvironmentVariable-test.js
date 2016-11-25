import {
    UnitTest,
    registerTest,
    targets,
    against
} from '../../../../utils/TestUtils'

import EnvironmentVariable from '../EnvironmentVariable'
import JSONSchemaReference from '../../../../models/references/JSONSchema'

import {
    Mock,
    ClassMock,
    PawContextMock,
    DynamicString,
    DynamicValue
} from '../../../../mocks/PawMocks'

@registerTest
@against(EnvironmentVariable)
export class TestEnvironmentVariable extends UnitTest {

    @targets('convert')
    testConvertCallsGetVariableFromContext() {
        const { ev, ctx } = this.__init()

        const dv = new DynamicValue(
            'com.luckymarmot.EnvironmentVariable',
            12
        )

        ev.spyOn('_getVariableFromContext', () => null)

        const expected = null
        const result = ev.convert(dv, ctx)

        this.assertEqual(expected, result)
        this.assertEqual(ev.spy._getVariableFromContext.count, 1)
    }

    @targets('convert')
    testConvertCallsGetURI() {
        const { ev, ctx } = this.__init()

        const dv = new DynamicValue(
            'com.luckymarmot.EnvironmentVariable',
            12
        )

        ev.spyOn('_getVariableFromContext', () => 12)
        ev.spyOn('_getUri', () => 42)
        ev.spyOn('_getSchema', () => 90)
        ev.spyOn('_createJSONSchemaReference', () => 33)

        const expected = 33
        const result = ev.convert(dv, ctx)

        this.assertEqual(expected, result)
        this.assertEqual(ev.spy._getUri.count, 1)
        this.assertEqual(
            ev.spy._getUri.calls[0],
            [ 12 ]
        )
    }

    @targets('convert')
    testConvertCallsGetSchema() {
        const { ev, ctx } = this.__init()

        const dv = new DynamicValue(
            'com.luckymarmot.EnvironmentVariable',
            12
        )

        ev.spyOn('_getVariableFromContext', () => 12)
        ev.spyOn('_getUri', () => 42)
        ev.spyOn('_getSchema', () => 90)
        ev.spyOn('_createJSONSchemaReference', () => 33)

        const expected = 33
        const result = ev.convert(dv, ctx)

        this.assertEqual(expected, result)
        this.assertEqual(ev.spy._getSchema.count, 1)
        this.assertEqual(
            ev.spy._getSchema.calls[0],
            [ 12 ]
        )
    }

    @targets('convert')
    testConvertCallsGetURI() {
        const { ev, ctx } = this.__init()

        const dv = new DynamicValue(
            'com.luckymarmot.EnvironmentVariable',
            12
        )

        ev.spyOn('_getVariableFromContext', () => 12)
        ev.spyOn('_getUri', () => 42)
        ev.spyOn('_getSchema', () => 90)
        ev.spyOn('_createJSONSchemaReference', () => 33)

        const expected = 33
        const result = ev.convert(dv, ctx)

        this.assertEqual(expected, result)
        this.assertEqual(ev.spy._createJSONSchemaReference.count, 1)
        this.assertEqual(
            ev.spy._createJSONSchemaReference.calls[0],
            [ 42, 90 ]
        )
    }

    @targets('_getVariableFromContext')
    testGetVariableFromContextCallsContextGetEnvironmentVariableById() {
        const { ev, ctx } = this.__init()

        ctx.$$_spyOn('getEnvironmentVariableById', () => 1242)

        const dv = new DynamicValue(
            'com.luckymarmot.EnvironmentVariable',
            {
                environmentVariable: 1234
            }
        )

        const expected = 1242
        const result = ev._getVariableFromContext(dv, ctx)

        this.assertEqual(expected, result)
        this.assertEqual(ctx.$$_spy.getEnvironmentVariableById.count, 1)
        this.assertEqual(
            ctx.$$_spy.getEnvironmentVariableById.calls[0],
            [ 1234 ]
        )
    }

    @targets('_getSchema')
    testGetSchemaCallsVariableGetCurrentValue() {
        const { ev } = this.__init()

        const variable = new Mock({
            getCurrentValue: () => null
        })

        const expected = null
        const result = ev._getSchema(variable)

        this.assertEqual(expected, result)
        this.assertEqual(variable.$$_spy.getCurrentValue.count, 1)
    }

    @targets('_getSchema')
    testGetSchemaWithJSFDynamicString() {
        const { ev } = this.__init()

        const schema = {
            type: 'number',
            minimum: 12,
            maximum: 42
        }

        const ds = new DynamicString()
        ds.length = 1
        ds.$$_spyOn('getComponentAtIndex', () => {
            return {
                type: 'com.luckymarmot.PawExtensions' +
                    '.JSONSchemaFakerDynamicValue',
                schema: JSON.stringify(schema)
            }
        })

        const variable = new Mock({
            getCurrentValue: () => ds
        })

        const expected = schema
        const result = ev._getSchema(variable)

        this.assertEqual(expected, result)
    }

    @targets('_getSchema')
    testGetSchemaWithOtherDynamicString() {
        const { ev } = this.__init()

        const schema = {
            type: 'string',
            default: '1242'
        }

        const ds = new DynamicString()
        ds.length = 1
        ds.$$_spyOn('getComponentAtIndex', () => {
            return {
                type: 'com.luckymarmot.PawExtensions' +
                    '.someOtherExtension'
            }
        })

        ds.$$_spyOn('getEvaluatedString', () => {
            return '1242'
        })

        const variable = new Mock({
            getCurrentValue: () => ds
        })

        const expected = schema
        const result = ev._getSchema(variable)

        this.assertEqual(expected, result)
    }

    @targets('_getSchema')
    testGetSchemaWitNotADynamicString() {
        const { ev } = this.__init()

        const variable = new Mock({
            getCurrentValue: () => {
                return {
                    length: 2
                }
            }
        })

        const expected = null
        const result = ev._getSchema(variable)

        this.assertEqual(expected, result)
    }

    @targets('_getUri')
    testGetURICallsConvertNameToFragment() {
        const { ev } = this.__init()

        const expectedName = 'testName'
        const uri = 'http://localhost/test'

        const variable = {
            name: expectedName
        }

        ev.spyOn('_convertNameToFragment', (name) => {
            this.assertEqual(name, expectedName)
            return uri
        })

        const expected = uri
        const result = ev._getUri(variable)

        this.assertEqual(ev.spy._convertNameToFragment.count, 1)
        this.assertEqual(result, expected)
    }

    @targets('_convertNameToFragment')
    testConvertNameToFragmentWithNameStartingWithHash() {
        const { ev } = this.__init()
        const name = '#test'

        const expected = name
        const result = ev._convertNameToFragment(name)

        this.assertEqual(result, expected)
    }

    @targets('_convertNameToFragment')
    testConvertNameToFragmentCallsEscapeURIFragmentWithNonHashName() {
        const { ev } = this.__init()
        const name = 'test'
        const returnedFragment = 'test'

        ev.spyOn('_escapeURIFragment', () => returnedFragment)

        const expected = '#/definitions/' + returnedFragment
        const result = ev._convertNameToFragment(name)

        this.assertEqual(result, expected)
    }

    @targets('_escapeURIFragment')
    testEscapeURIFragment() {
        const { ev } = this.__init()

        const fragment = '/some/complex~fragment~'

        const expected = '~1some~1complex~0fragment~0'

        const result = ev._escapeURIFragment(fragment)

        this.assertEqual(expected, result)
    }

    @targets('_createJSONSchemaReference')
    testCreateJSONSchemaReference() {
        const { ev } = this.__init()

        const uri = '#/definitions/User'
        const schema = {
            type: 'string',
            pattern: '^.{4-16}$'
        }

        const expected = new JSONSchemaReference({
            uri,
            relative: uri,
            value: schema,
            resolved: true
        })

        const result = ev._createJSONSchemaReference(uri, schema)

        this.assertEqual(result, expected)
    }


    __init() {
        const ev = new ClassMock(new EnvironmentVariable(), '')
        const ctx = new PawContextMock()
        return { ev, ctx }
    }
}
