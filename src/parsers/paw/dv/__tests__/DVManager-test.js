import Immutable from 'immutable'

import {
    UnitTest,
    registerTest,
    targets,
    against
} from '../../../../utils/TestUtils'

import DVManager from '../DVManager'
import JSONSchemaReference from '../../../../models/references/JSONSchema'
import {
    DigestAuth, HawkAuth, AWSSig4Auth, OAuth2Auth
} from '../../../../models/Auth'

import {
    ClassMock,
    PawContextMock,
    DynamicValue
} from '../../../../mocks/PawMocks'

@registerTest
@against(DVManager)
export class TestDVManager extends UnitTest {

    @targets('convert')
    testConvertCallsCorrectConverter() {
        const { dvm, ctx } = this.__init()

        const jsfdv = new DynamicValue(
            'com.luckymarmot.PawExtensions.JSONSchemaFakerDynamicValue',
            12
        )

        const evdv = new DynamicValue(
            'com.luckymarmot.EnvironmentVariableDynamicValue',
            12
        )

        const hkdv = new DynamicValue(
            'uk.co.jalada.PawExtensions.HawkDynamicValue',
            12
        )

        const awsdv = new DynamicValue(
            'com.shigeoka.PawExtensions.AWSSignature4DynamicValue',
            12
        )

        const dgdv = new DynamicValue(
            'com.luckymarmot.PawExtensions.DigestAuthDynamicValue',
            12
        )

        const o2dv = new DynamicValue(
            'com.luckymarmot.OAuth2DynamicValue',
            12
        )

        dvm.spyOn('_convertJSF', () => null)
        dvm.spyOn('_convertEnvironmentVariable', () => null)
        dvm.spyOn('_convertHawk', () => null)
        dvm.spyOn('_convertAWSSig4', () => null)
        dvm.spyOn('_convertDigestAuth', () => null)
        dvm.spyOn('_convertOAuth2', () => null)

        const expected = null

        let result = dvm.convert(jsfdv, ctx)
        this.assertEqual(expected, result)
        this.assertEqual(dvm.spy._convertJSF.count, 1)

        result = dvm.convert(evdv, ctx)
        this.assertEqual(expected, result)
        this.assertEqual(dvm.spy._convertEnvironmentVariable.count, 1)

        result = dvm.convert(hkdv, ctx)
        this.assertEqual(expected, result)
        this.assertEqual(dvm.spy._convertHawk.count, 1)

        result = dvm.convert(awsdv, ctx)
        this.assertEqual(expected, result)
        this.assertEqual(dvm.spy._convertAWSSig4.count, 1)

        result = dvm.convert(dgdv, ctx)
        this.assertEqual(expected, result)
        this.assertEqual(dvm.spy._convertDigestAuth.count, 1)

        result = dvm.convert(o2dv, ctx)
        this.assertEqual(expected, result)
        this.assertEqual(dvm.spy._convertOAuth2.count, 1)
    }

    @targets('_convertJSF')
    testConvertJSF() {
        const { dvm } = this.__init()

        const dv = new DynamicValue(
            'com.luckymarmot.PawExtensions.JSONSchemaFakerDynamicValue',
            {
                schema: '{ "type": "string" }'
            }
        )

        const expected = new JSONSchemaReference({
            uri: null,
            relative: null,
            value: {
                type: 'string'
            },
            resolved: true
        })

        const result = dvm._convertJSF(dv)

        this.assertJSONEqual(result, expected)
    }

    @targets('_convertEnvironmentVariable')
    testConvertEnvironmentVariable() {
        const { dvm, ctx } = this.__init()

        const dv = new DynamicValue(
            'com.luckymarmot.EnvironmentVariableDynamicValue',
            {
                name: '#test'
            }
        )

        const expected = null
        const result = dvm._convertEnvironmentVariable(dv, ctx)

        this.assertJSONEqual(result, expected)
    }

    @targets('_convertDigestAuth')
    testConvertDigestAuth() {
        const { dvm } = this.__init()

        const dv = new DynamicValue(
            'DigestAuthDynamicValue',
            {
                username: 'user',
                password: 'pass'
            }
        )

        const expected = new DigestAuth({
            username: 'user',
            password: 'pass'
        })

        const result = dvm._convertDigestAuth(dv)

        this.assertJSONEqual(result, expected)
    }

    @targets('_convertHawk')
    testConvertHawk() {
        const { dvm } = this.__init()

        const dv = new DynamicValue(
            'HawkDynamicValue',
            {
                id: 'id',
                key: 'key',
                algorithm: 'md5'
            }
        )

        const expected = new HawkAuth({
            id: 'id',
            key: 'key',
            algorithm: 'md5'
        })

        const result = dvm._convertHawk(dv)

        this.assertJSONEqual(result, expected)
    }

    @targets('_convertAWSSig4')
    testConvertAWSSig4() {
        const { dvm } = this.__init()

        const dv = new DynamicValue(
            'AWSSig4Auth',
            {
                key: 'key',
                secret: 'secret',
                region: 'region',
                service: 'service'
            }
        )

        const expected = new AWSSig4Auth({
            key: 'key',
            secret: 'secret',
            region: 'region',
            service: 'service'
        })

        const result = dvm._convertAWSSig4(dv)

        this.assertJSONEqual(result, expected)
    }

    @targets('_convertOAuth2')
    testConvertOAuth2() {
        const { dvm } = this.__init()

        const dv = new DynamicValue(
            'OAuth2DynamicValue',
            {}
        )

        const expected = new OAuth2Auth({
            flow: 'accessCode',
            authorizationUrl: null,
            tokenUrl: null,
            scopes: new Immutable.List([])
        })

        const result = dvm._convertOAuth2(dv)

        this.assertJSONEqual(result, expected)
    }

    __init() {
        const dvm = new ClassMock(new DVManager(), '')
        const ctx = new PawContextMock()
        return { dvm, ctx }
    }
}
