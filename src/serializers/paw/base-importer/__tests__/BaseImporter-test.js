import Immutable from 'immutable'

import Context, {
    Body,
    Parameter,
    ParameterContainer
} from '../../../../models/Core'

import ReferenceContainer from '../../../../models/references/Container'
import JSONSchemaReference from '../../../../models/references/JSONSchema'
import ExoticReference from '../../../../models/references/Exotic'

import Request from '../../../../models/Request'
import Constraint from '../../../../models/Constraint'
import URL from '../../../../models/URL'
import Auth from '../../../../models/Auth'

import PawEnvironment from '../../../../models/environments/PawEnvironment'
import ContextResolver from '../../../../resolvers/ContextResolver'

import {
    UnitTest,
    registerTest,
    targets, against
} from '../../../../utils/TestUtils'

import BaseImporterFixtures from './fixtures/BaseImporter-fixtures'

import {
    DynamicString,
    DynamicValue,
    PawContextMock,
    PawRequestMock,
    ClassMock,
    Mock
} from '../../../../mocks/PawMocks'

import BaseImporter from '../BaseImporter'

@registerTest
@against(BaseImporter, [
    // This function is abstract
    'createRequestContexts',
    // I'm lazy
    'importString',
    'createRequestContextFromString',
    '_importPawRequest'
])
export class TestBaseImporter extends UnitTest {

    @targets('_convertCharToHex')
    testConvertCharToHex() {
        const importer = new BaseImporter()

        const tests = [
            [ 'a', '61' ],
            [ 'b', '62' ],
            [ 'c', '63' ],
            [ '\b', '08' ]
        ]

        tests.forEach((d) => {
            let result = importer._convertCharToHex(d[0])
            this.assertEqual(result, d[1])
        })
    }

    @targets('_escapeCharSequence')
    testEscapeCharSequence() {
        const importer = new BaseImporter()

        const tests = [
            [
                'abc\bhello\nworld',
                '\\x61\\x62\\x63\\x08\\x68\\x65\\x6c\\x6c\\x6f' +
                '\\n\\x77\\x6f\\x72\\x6c\\x64'
            ],
            [
                '\n\r\t',
                '\\n\\r\\t'
            ]
        ]

        tests.forEach((d) => {
            let result = importer._escapeCharSequence(d[0])
            this.assertEqual(result, d[1])
        })
    }

    @targets('_escapeSequenceDynamicValue')
    testEscapeSequenceDynamicValue() {
        const importer = new BaseImporter()

        const input = 'Some Text'
        const expected = '\\x53\\x6f\\x6d\\x65\\x20\\x54\\x65\\x78\\x74'

        let result = importer._escapeSequenceDynamicValue(input)
        this.assertTrue(result instanceof DynamicValue)
        this.assertEqual(
            result.type,
            'com.luckymarmot.EscapeSequenceDynamicValue'
        )
        this.assertEqual(result.escapeSequence, expected)
    }

    @targets('_toDynamicString')
    testSimpleToDynamicString() {
        const importer = new BaseImporter()
        const input = 'Some\nText'
        const expected = [
            'Some',
            new DynamicValue(
                'com.luckymarmot.EscapeSequenceDynamicValue',
                { escapeSequence: '\\n' }
            ),
            'Text'
        ]

        let result = importer._toDynamicString(input)
        this.assertTrue(result instanceof DynamicString)
        this.assertTrue(result.components.length === 3)
        this.assertEqual(result.components[0], expected[0])
        this.assertEqual(
            result.components[1].escapeSequence,
            expected[1].escapeSequence
        )
        this.assertEqual(result.components[2], expected[2])
    }

    @targets('_toDynamicString')
    testNoDefaultToDynamicString() {
        const importer = new BaseImporter()
        const expected = null

        let result = importer._toDynamicString(null)
        this.assertEqual(result, expected)
    }

    @targets('_toDynamicString')
    testToDynamicStringWithReference() {
        const importer = new ClassMock(new BaseImporter(), '')
        const input = new JSONSchemaReference({
            uri: '#/definitions/User',
            relative: '#/definitions/Relative',
            value: { type: 'string' },
            resolved: true
        })

        const expected = new DynamicString(
            new DynamicValue(
                'com.luckymarmot.EnvironmentVariableDynamicValue',
                {
                    environmentVariable: 12
                }
            )
        )

        importer.spyOn('_castReferenceToDynamicString', () => {
            return expected
        })

        let result = importer._toDynamicString(input, true)
        this.assertTrue(result instanceof DynamicString)
        this.assertEqual(result.components.length, 1)
        this.assertEqual(
            result.components[0].environmentVariable,
            expected.components[0].environmentVariable
        )
        this.assertEqual(
            result.components[0].type,
            expected.components[0].type
        )
    }

    @targets('_toDynamicString')
    testToDynamicStringWithParameter() {
        const importer = new BaseImporter()
        const mockedImporter = new ClassMock(importer, '')

        const input = new Parameter({
            key: 'ignored',
            type: 'integer',
            internals: new Immutable.List([
                new Constraint.Enum([ 1, 2, 3, 4 ])
            ])
        })

        mockedImporter.spyOn('_castParameterToDynamicString', () => {
            return {
                components: [ 'value' ]
            }
        })

        mockedImporter.spyOn('_escapeSequenceDynamicValue', () => {
            // this should not be called for this test
            this.assertTrue(false)
        })

        let result = importer._toDynamicString.apply(
            mockedImporter,
            [ input, true ]
        )

        this.assertEqual(
            mockedImporter.spy._castParameterToDynamicString.count, 1
        )
        this.assertEqual(
            mockedImporter.spy._castParameterToDynamicString.calls,
            [ [ input ] ]
        )

        this.assertTrue(result instanceof DynamicString)
        this.assertEqual(result.components.length, 1)
        this.assertEqual(result.components[0], 'value')
    }

    @targets('_extractReferenceComponent')
    testExtractReferenceComponentWithString() {
        const importer = new BaseImporter()
        const input = 'testString'

        const result = importer._extractReferenceComponent(input)
        this.assertEqual(input, result)
    }

    @targets('_extractReferenceComponent')
    testExtractReferenceComponentWithSimpleReference() {
        const importer = new BaseImporter()
        const mockedImporter = new ClassMock(importer, '')

        mockedImporter.spyOn('_getEnvironmentVariable', () => {
            return {
                id: 42
            }
        })

        const input = new JSONSchemaReference({
            uri: 'swagger.json#/definitions/User',
            relative: '#/definitions/User'
        })

        const expected = new DynamicValue(
            'com.luckymarmot.EnvironmentVariableDynamicValue',
            {
                environmentVariable: 42
            }
        )

        const result = importer._extractReferenceComponent.apply(
            mockedImporter,
            [ input ]
        )

        this.assertEqual(mockedImporter.spy._getEnvironmentVariable.count, 1)
        this.assertEqual(
            mockedImporter.spy._getEnvironmentVariable.calls,
            [ [ '#/definitions/User' ] ]
        )
        this.assertEqual(expected.type, result.type)
        this.assertEqual(
            expected.environmentVariable,
            result.environmentVariable
        )
    }

    @targets('_getEnvironmentDomain')
    testGetEnvironmentDomainNoDomainFound() {
        const importer = new BaseImporter()
        const mockedImporter = new ClassMock(importer, '')
        const contextMock = new PawContextMock(null, '')

        contextMock.spyOn('getEnvironmentDomainByName', () => {})
        contextMock.spyOn('createEnvironmentDomain', () => {
            return 12
        })
        mockedImporter.context = contextMock
        mockedImporter.ENVIRONMENT_DOMAIN_NAME = 'Mocked Environment'

        const result = importer._getEnvironmentDomain.apply(
            mockedImporter,
            []
        )

        this.assertEqual(result, 12)
        this.assertEqual(
            contextMock.spy.getEnvironmentDomainByName.count, 1
        )
        this.assertEqual(
            contextMock.spy.createEnvironmentDomain.count, 1
        )

        this.assertEqual(
            contextMock.spy.getEnvironmentDomainByName.calls[0],
            [ mockedImporter.ENVIRONMENT_DOMAIN_NAME ]
        )
        this.assertEqual(
            contextMock.spy.createEnvironmentDomain.calls[0],
            [ mockedImporter.ENVIRONMENT_DOMAIN_NAME ]
        )
    }

    @targets('_getEnvironmentDomain')
    testGetEnvironmentDomainWithDomainFound() {
        const importer = new BaseImporter()
        const mockedImporter = new ClassMock(importer, '')
        const contextMock = new PawContextMock(null, '')

        contextMock.spyOn('getEnvironmentDomainByName', () => {
            return 12
        })
        contextMock.spyOn('createEnvironmentDomain', () => {
            this.assertTrue(false)
            return 42
        })
        mockedImporter.context = contextMock
        mockedImporter.ENVIRONMENT_DOMAIN_NAME = 'Mocked Environment'

        const result = importer._getEnvironmentDomain.apply(
            mockedImporter,
            []
        )

        this.assertEqual(result, 12)
        this.assertEqual(
            contextMock.spy.getEnvironmentDomainByName.count, 1
        )
        this.assertEqual(
            contextMock.spy.createEnvironmentDomain.count, 0
        )

        this.assertEqual(
            contextMock.spy.getEnvironmentDomainByName.calls[0],
            [ mockedImporter.ENVIRONMENT_DOMAIN_NAME ]
        )
    }

    @targets('_getEnvironment')
    testGetEnvironmentWithNoEnvironmentFound() {
        const importer = new BaseImporter()
        const mockedImporter = new ClassMock(importer, '')
        const domain = new Mock({
            getEnvironmentByName: () => {},
            createEnvironment: () => {}
        }, '')

        domain.spyOn('getEnvironmentByName', () => {
            return
        })

        domain.spyOn('createEnvironment', () => {
            return 12
        })

        const result = importer._getEnvironment.apply(
            mockedImporter,
            [ domain, 'Mock Environment' ]
        )

        this.assertEqual(result, 12)
        this.assertEqual(
            domain.spy.getEnvironmentByName.count, 1
        )
        this.assertEqual(
            domain.spy.createEnvironment.count, 1
        )

        this.assertEqual(
            domain.spy.getEnvironmentByName.calls[0],
            [ 'Mock Environment' ]
        )
        this.assertEqual(
            domain.spy.createEnvironment.calls[0],
            [ 'Mock Environment' ]
        )
    }

    @targets('_getEnvironment')
    testGetEnvironmentWithEnvironmentFound() {
        const importer = new BaseImporter()
        const mockedImporter = new ClassMock(importer, '')
        const domain = new Mock({
            getEnvironmentByName: () => {},
            createEnvironment: () => {}
        }, '')

        domain.spyOn('getEnvironmentByName', () => {
            return 12
        })

        domain.spyOn('createEnvironment', () => {
            this.assertTrue(false)
            return 42
        })

        const result = importer._getEnvironment.apply(
            mockedImporter,
            [ domain, 'Mock Environment' ]
        )

        this.assertEqual(result, 12)
        this.assertEqual(
            domain.spy.getEnvironmentByName.count, 1
        )
        this.assertEqual(
            domain.spy.createEnvironment.count, 0
        )

        this.assertEqual(
            domain.spy.getEnvironmentByName.calls[0],
            [ 'Mock Environment' ]
        )
    }

    @targets('_getEnvironmentVariable')
    testGetEnvironmentVariableNoVariableFound() {
        const importer = new BaseImporter()
        const mockedImporter = new ClassMock(importer, '')

        const domain = new Mock({
            getVariableByName: () => {}
        }, '')
        const environment = new Mock({
            setVariablesValues: () => {}
        }, '')

        mockedImporter.spyOn('_getEnvironmentDomain', () => {
            return domain
        })

        let counter = -2
        const returns = [ 'var' ]
        domain.spyOn('getVariableByName', () => {
            counter += 1
            return returns[counter]
        })

        mockedImporter.spyOn('_getEnvironment', () => {
            return environment
        })

        const result = importer._getEnvironmentVariable.apply(
            mockedImporter,
            [ 'varName' ]
        )

        this.assertEqual(result, 'var')
        this.assertEqual(
            mockedImporter.spy._getEnvironmentDomain.count, 1
        )
        this.assertEqual(
            mockedImporter.spy._getEnvironment.count, 1
        )
        this.assertEqual(
            domain.spy.getVariableByName.count, 2
        )
        this.assertEqual(
            environment.spy.setVariablesValues.count, 1
        )
    }

    @targets('_getEnvironmentVariable')
    testGetEnvironmentVariableWithVariableFound() {
        const importer = new BaseImporter()
        const mockedImporter = new ClassMock(importer, '')

        const domain = new Mock({
            getVariableByName: () => {}
        }, '')
        const environment = new Mock({
            setVariablesValues: () => {}
        }, '')

        mockedImporter.spyOn('_getEnvironmentDomain', () => {
            return domain
        })

        let counter = -1
        const returns = [ 'var' ]
        domain.spyOn('getVariableByName', () => {
            counter += 1
            return returns[counter]
        })

        mockedImporter.spyOn('_getEnvironment', () => {
            return environment
        })

        const result = importer._getEnvironmentVariable.apply(
            mockedImporter,
            [ 'varName' ]
        )

        this.assertEqual(result, 'var')
        this.assertEqual(
            mockedImporter.spy._getEnvironmentDomain.count, 1
        )
        this.assertEqual(
            mockedImporter.spy._getEnvironment.count, 0
        )
        this.assertEqual(
            domain.spy.getVariableByName.count, 1
        )
        this.assertEqual(
            environment.spy.setVariablesValues.count, 0
        )
    }

    @targets('_createPawRequest')
    testSimpleCreatePawRequest() {
        const importer = new ClassMock(new BaseImporter(), '')

        const contextMock = new PawContextMock(null, '')
        const input = new Request({
            url: new URL({
                protocol: new Parameter({
                    key: 'protocol',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            'http'
                        ])
                    ])
                }),
                host: new Parameter({
                    key: 'host',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            'fakeurl.com'
                        ])
                    ])
                })
            })
        })

        importer.spyOn('_generateUrl', () => {
            return new DynamicString('http://fakeurl.com')
        })

        importer.context = contextMock
        importer._createPawRequest(input, input.get('parameters'))

        this.assertTrue(contextMock.spy.createRequest.count === 1)
        this.assertEqual(
            contextMock.spy.createRequest.calls[0].slice(0, 2),
            [ null, null ]
        )
        this.assertJSONEqual(
            contextMock.spy.createRequest.calls[0][2].components[0],
            'http://fakeurl.com'
        )
    }

    @targets('_createPawRequest')
    testCreatePawRequestWithRequestData() {
        const importer = new ClassMock(new BaseImporter(), '')

        const contextMock = new PawContextMock(null, '')
        const input = new Request({
            name: 'testReq',
            method: 'GET',
            url: new URL({
                protocol: new Parameter({
                    key: 'protocol',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            'http'
                        ])
                    ])
                }),
                host: new Parameter({
                    key: 'host',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            'fakeurl.com'
                        ])
                    ])
                })
            })
        })

        importer.spyOn('_generateUrl', () => {
            return new DynamicString('http://fakeurl.com')
        })

        importer.context = contextMock
        importer._createPawRequest(input, input.get('parameters'))

        this.assertTrue(contextMock.spy.createRequest.count === 1)
        this.assertEqual(
            contextMock.spy.createRequest.calls[0].slice(0, 2),
            [ 'testReq', 'GET' ]
        )
        this.assertEqual(
            contextMock.spy.createRequest.calls[0][2].components[0],
            'http://fakeurl.com'
        )
    }

    @targets('_createPawRequest')
    testCreatePawRequest() {
        const importer = new BaseImporter()
        const mockedImporter = new ClassMock(importer, '')
        const contextMock = new PawContextMock(null, '')

        mockedImporter.spyOn('_generateUrl', () => {
            return 'dummyValue'
        })
        contextMock.spyOn('createRequest', () => {
            return 12
        })
        mockedImporter.context = contextMock

        const request = new Request()

        const result = importer._createPawRequest.apply(
            mockedImporter,
            [ request, request.get('parameters') ]
        )

        this.assertEqual(result, 12)
        this.assertEqual(
            mockedImporter.spy._generateUrl.count, 1
        )
        this.assertEqual(
            contextMock.spy.createRequest.count, 1
        )

        this.assertEqual(
            mockedImporter.spy._generateUrl.calls[0],
            [ new URL(), new Immutable.List(), new Immutable.List() ]
        )

        this.assertEqual(
            contextMock.spy.createRequest.calls[0],
            [ null, null, 'dummyValue' ]
        )
    }

    @targets('_setHeaders')
    testSimpleSetHeaders() {
        const importer = new BaseImporter()

        const requestMock = new PawRequestMock(null, '')
        const container = new ParameterContainer()

        importer._setHeaders(requestMock, container)

        this.assertTrue(requestMock.spy.setHeader.count === 0)
    }

    @targets('_setHeaders')
    testSetHeadersWithHeaders() {
        const importer = new ClassMock(new BaseImporter(), '')

        const requestMock = new PawRequestMock(null, '')
        let container = new ParameterContainer()
        let headers = new Immutable.List([
            new Parameter({
                key: 'key',
                value: 'value'
            }),
            new Parameter({
                key: 'sec',
                value: 'ond'
            })
        ])

        container = container
            .set('headers', headers)

        let count = 0
        importer.spyOn('_toDynamicString', () => {
            count += 1
            return new DynamicString(count + '')
        })

        importer._setHeaders(requestMock, container)

        this.assertTrue(requestMock.spy.setHeader.count === 2)
        this.assertTrue(requestMock.spy.setHeader.calls[0].length === 2)

        this.__compareSimpleDynamicStrings(
            requestMock.spy.setHeader.calls[0][0],
            new DynamicString('1')
        )
        this.assertJSONEqual(
            requestMock.spy.setHeader.calls[0][1],
            new DynamicString('2')
        )
        this.__compareSimpleDynamicStrings(
            requestMock.spy.setHeader.calls[1][0],
            new DynamicString('3')
        )
        this.__compareSimpleDynamicStrings(
            requestMock.spy.setHeader.calls[1][1],
            new DynamicString('4')
        )
    }

    @targets('_setBasicAuth')
    testSetBasicAuth() {
        const importer = new BaseImporter()

        const auth = new Auth.Basic({
            username: '',
            password: ''
        })

        let dv = importer._setBasicAuth(auth)

        this.assertEqual(
            dv.type,
            'com.luckymarmot.BasicAuthDynamicValue'
        )

        this.assertEqual(dv.username.components, [ '' ])
        this.assertEqual(dv.password.components, [ '' ])
    }

    @targets('_setBasicAuth')
    testSetBasicAuthWithInitializedValues() {
        const importer = new BaseImporter()

        const auth = new Auth.Basic({
            username: 'luckymarmot',
            password: 'stub'
        })

        let dv = importer._setBasicAuth(auth)

        this.assertEqual(
            dv.type,
            'com.luckymarmot.BasicAuthDynamicValue'
        )

        this.assertEqual(dv.username.components, [ 'luckymarmot' ])
        this.assertEqual(dv.password.components, [ 'stub' ])
    }

    @targets('_setDigestAuth')
    testSetDigestAuth() {
        const importer = new BaseImporter()

        const auth = new Auth.Digest({
            username: '',
            password: ''
        })

        let dv = importer._setDigestAuth(auth)

        this.assertEqual(
            dv.type,
            'com.luckymarmot.PawExtensions.DigestAuthDynamicValue'
        )

        this.assertEqual(dv.username.components, [ '' ])
        this.assertEqual(dv.password.components, [ '' ])
    }

    @targets('_setDigestAuth')
    testSetDigestAuthWithInitializedValues() {
        const importer = new BaseImporter()

        const auth = new Auth.Digest({
            username: 'luckymarmot',
            password: 'stub'
        })

        let dv = importer._setDigestAuth(auth)

        this.assertEqual(
            dv.type,
            'com.luckymarmot.PawExtensions.DigestAuthDynamicValue'
        )

        this.assertEqual(dv.username.components, [ 'luckymarmot' ])
        this.assertEqual(dv.password.components, [ 'stub' ])
    }

    @targets('_setOAuth1Auth')
    testSetOAuth1Auth() {
        const importer = new BaseImporter()

        const auth = new Auth.OAuth1()

        let dv = importer._setOAuth1Auth(auth)

        this.assertEqual(
            dv.type,
            'com.luckymarmot.OAuth1HeaderDynamicValue'
        )

        this.assertEqual(dv.callback.components, [ '' ])
        this.assertEqual(dv.consumerKey.components, [ '' ])
        this.assertEqual(dv.consumerSecret.components, [ '' ])
        this.assertEqual(dv.tokenSecret.components, [ '' ])
        this.assertEqual(dv.algorithm, '')
        this.assertEqual(dv.nonce.components, [ '' ])
        this.assertEqual(dv.timestamp.components, [ '' ])
        this.assertEqual(dv.token.components, [ '' ])
    }

    @targets('_setOAuth1Auth')
    testSetOAuth1AuthWithInitialValues() {
        const importer = new BaseImporter()

        const auth = new Auth.OAuth1({
            callback: 'fakeurl.com/oauth1',
            consumerKey: 'aeda',
            consumerSecret: 'fedae',
            tokenSecret: '123123',
            algorithm: 'SHA-256',
            nonce: '20192835',
            timestamp: '1509850198250',
            token: 'token'
        })

        let dv = importer._setOAuth1Auth(auth)

        this.assertEqual(
            dv.type,
            'com.luckymarmot.OAuth1HeaderDynamicValue'
        )

        this.assertEqual(dv.callback.components, [ 'fakeurl.com/oauth1' ])
        this.assertEqual(dv.consumerKey.components, [ 'aeda' ])
        this.assertEqual(dv.consumerSecret.components, [ 'fedae' ])
        this.assertEqual(dv.tokenSecret.components, [ '123123' ])
        this.assertEqual(dv.algorithm, 'SHA-256')
        this.assertEqual(dv.nonce.components, [ '20192835' ])
        this.assertEqual(dv.timestamp.components, [ '1509850198250' ])
        this.assertEqual(dv.token.components, [ 'token' ])
    }

    @targets('_setOAuth2Auth')
    testSetOAuth2Auth() {
        const importer = new BaseImporter()

        const auth = new Auth.OAuth2()

        let dv = importer._setOAuth2Auth(auth)

        this.assertEqual(
            dv.type,
            'com.luckymarmot.OAuth2DynamicValue'
        )

        this.assertEqual(dv.grantType, 0)
        this.assertEqual(dv.authorizationUrl.components, [ '' ])
        this.assertEqual(dv.accessTokenUrl.components, [ '' ])
        this.assertEqual(dv.scope, '')
    }

    @targets('_setOAuth2Auth')
    testSetOAuth2AuthWithInitialValues() {
        const importer = new BaseImporter()

        const auth = new Auth.OAuth2({
            flow: 'implicit',
            authorizationUrl: 'fakeurl.com/oauth2',
            tokenUrl: 'fakeurl.com/oauth2/access-token',
            scopes: [ 'user:write', 'user:read' ]
        })

        let dv = importer._setOAuth2Auth(auth)

        this.assertEqual(
            dv.type,
            'com.luckymarmot.OAuth2DynamicValue'
        )

        this.assertEqual(dv.grantType, 1)
        this.assertEqual(
            dv.authorizationUrl.components,
            [ 'fakeurl.com/oauth2' ]
        )
        this.assertEqual(
            dv.accessTokenUrl.components,
            [ 'fakeurl.com/oauth2/access-token' ]
        )
        this.assertEqual(dv.scope, 'user:write user:read')
    }

    @targets('_setAWSSig4Auth')
    testSetAWSSig4Auth() {
        const importer = new BaseImporter()

        const auth = new Auth.AWSSig4()

        let dv = importer._setAWSSig4Auth(auth)

        this.assertEqual(
            dv.type,
            'com.shigeoka.PawExtensions.AWSSignature4DynamicValue'
        )

        this.assertEqual(dv.key.components, [ '' ])
        this.assertEqual(dv.secret.components, [ '' ])
        this.assertEqual(dv.region.components, [ '' ])
        this.assertEqual(dv.service.components, [ '' ])
    }

    @targets('_setAWSSig4Auth')
    testSetAWSSig4AuthWithInitialValues() {
        const importer = new BaseImporter()

        const auth = new Auth.AWSSig4({
            key: 'secretKey',
            secret: 'secretSecret',
            region: 'us-east-1',
            service: 'execute-api'
        })

        let dv = importer._setAWSSig4Auth(auth)

        this.assertEqual(
            dv.type,
            'com.shigeoka.PawExtensions.AWSSignature4DynamicValue'
        )

        this.assertEqual(dv.key.components, [ 'secretKey' ])
        this.assertEqual(dv.secret.components, [ 'secretSecret' ])
        this.assertEqual(dv.region.components, [ 'us-east-1' ])
        this.assertEqual(dv.service.components, [ 'execute-api' ])
    }

    @targets('_setHawkAuth')
    testSetHawkAuth() {
        const importer = new BaseImporter()

        const auth = new Auth.Hawk()

        let dv = importer._setHawkAuth(auth)

        this.assertEqual(
            dv.type,
            'uk.co.jalada.PawExtensions.HawkDynamicValue'
        )

        this.assertEqual(dv.key.components, [ '' ])
        this.assertEqual(dv.id.components, [ '' ])
        this.assertEqual(dv.algorithm.components, [ '' ])
    }

    @targets('_setHawkAuth')
    testSetHawkAuthWithInitialValues() {
        const importer = new BaseImporter()

        const auth = new Auth.Hawk({
            key: 'secretKey',
            id: 'secretId',
            algorithm: 'MD5'
        })

        let dv = importer._setHawkAuth(auth)

        this.assertEqual(
            dv.type,
            'uk.co.jalada.PawExtensions.HawkDynamicValue'
        )

        this.assertEqual(dv.key.components, [ 'secretKey' ])
        this.assertEqual(dv.id.components, [ 'secretId' ])
        this.assertEqual(dv.algorithm.components, [ 'MD5' ])
    }

    @targets('_setAuth')
    testSetAuthwithBasicAuth() {
        const importer = new BaseImporter()
        const mockedImporter = new ClassMock(importer, '')
        const requestMock = new PawRequestMock(null, '')
        const auths = new Immutable.List([
            new Auth.Basic()
        ])

        mockedImporter.spyOn('_setBasicAuth', () => {
            return 'basicAuth'
        })

        importer._setAuth.apply(
            mockedImporter,
            [ requestMock, auths ]
        )

        this.assertTrue(requestMock.spy.setHeader.count === 1)
        this.assertEqual(
            requestMock.spy.setHeader.calls[0][1].components,
            [ 'basicAuth' ]
        )
    }

    @targets('_setAuth')
    testSetAuthwithDigestAuth() {
        const importer = new BaseImporter()
        const mockedImporter = new ClassMock(importer, '')
        const requestMock = new PawRequestMock(null, '')
        const auths = new Immutable.List([
            new Auth.Digest()
        ])

        mockedImporter.spyOn('_setDigestAuth', () => {
            return 'digestAuth'
        })

        importer._setAuth.apply(
            mockedImporter,
            [ requestMock, auths ]
        )

        this.assertTrue(requestMock.spy.setHeader.count === 1)
        this.assertEqual(
            requestMock.spy.setHeader.calls[0][1].components,
            [ 'digestAuth' ]
        )
    }

    @targets('_setAuth')
    testSetAuthwithOAuth1Auth() {
        const importer = new BaseImporter()
        const mockedImporter = new ClassMock(importer, '')
        const requestMock = new PawRequestMock(null, '')
        const auths = new Immutable.List([
            new Auth.OAuth1()
        ])

        mockedImporter.spyOn('_setOAuth1Auth', () => {
            return 'oauth1Auth'
        })

        importer._setAuth.apply(
            mockedImporter,
            [ requestMock, auths ]
        )

        this.assertTrue(requestMock.spy.setHeader.count === 1)
        this.assertEqual(
            requestMock.spy.setHeader.calls[0][1].components,
            [ 'oauth1Auth' ]
        )
    }

    @targets('_setAuth')
    testSetAuthwithOAuth2Auth() {
        const importer = new BaseImporter()
        const mockedImporter = new ClassMock(importer, '')
        const requestMock = new PawRequestMock(null, '')
        const auths = new Immutable.List([
            new Auth.OAuth2()
        ])

        mockedImporter.spyOn('_setOAuth2Auth', () => {
            return 'oauth2Auth'
        })

        importer._setAuth.apply(
            mockedImporter,
            [ requestMock, auths ]
        )

        this.assertTrue(requestMock.spy.setHeader.count === 1)
        this.assertEqual(
            requestMock.spy.setHeader.calls[0][1].components,
            [ 'oauth2Auth' ]
        )
    }

    @targets('_setAuth')
    testSetAuthwithAWSSig4Auth() {
        const importer = new BaseImporter()
        const mockedImporter = new ClassMock(importer, '')
        const requestMock = new PawRequestMock(null, '')
        const auths = new Immutable.List([
            new Auth.AWSSig4()
        ])

        mockedImporter.spyOn('_setAWSSig4Auth', () => {
            return 'awssig4Auth'
        })

        importer._setAuth.apply(
            mockedImporter,
            [ requestMock, auths ]
        )

        this.assertTrue(requestMock.spy.setHeader.count === 1)
        this.assertEqual(
            requestMock.spy.setHeader.calls[0][1].components,
            [ 'awssig4Auth' ]
        )
    }

    @targets('_setAuth')
    testSetAuthwithHawkAuth() {
        const importer = new BaseImporter()
        const mockedImporter = new ClassMock(importer, '')
        const requestMock = new PawRequestMock(null, '')
        const auths = new Immutable.List([
            new Auth.Hawk()
        ])

        mockedImporter.spyOn('_setHawkAuth', () => {
            return 'hawkAuth'
        })

        importer._setAuth.apply(
            mockedImporter,
            [ requestMock, auths ]
        )

        this.assertTrue(requestMock.spy.setHeader.count === 1)
        this.assertEqual(
            requestMock.spy.setHeader.calls[0][1].components,
            [ 'hawkAuth' ]
        )
    }

    @targets('_setAuth')
    testSetAuthwithApiKeyAuth() {
        const importer = new BaseImporter()
        const mockedImporter = new ClassMock(importer, '')
        const requestMock = new PawRequestMock(null, '')
        const auths = new Immutable.List([
            new Auth.ApiKey({
                in: 'header',
                name: 'api_key',
                key: '123123123'
            })
        ])

        mockedImporter.spyOn('_toDynamicString', (string) => {
            return string
        })

        importer._setAuth.apply(
            mockedImporter,
            [ requestMock, auths ]
        )

        this.assertTrue(requestMock.spy.setHeader.count === 1)
        this.assertEqual(
            requestMock.spy.setHeader.calls[0],
            [ 'api_key', '123123123' ]
        )
    }

    @targets('_setAuth')
    testSetAuthwithUnknownAuth() {
        class UnknownAuth {

        }

        const importer = new BaseImporter()
        const mockedImporter = new ClassMock(importer, '')
        const requestMock = new PawRequestMock(null, '')
        const auths = new Immutable.List([
            new UnknownAuth()
        ])

        importer._setAuth.apply(
            mockedImporter,
            [ requestMock, auths ]
        )

        this.assertTrue(requestMock.spy.setHeader.count === 0)
    }

    @targets('_setAuth')
    testSetAuthwithMultipleAuth() {
        const importer = new BaseImporter()
        const mockedImporter = new ClassMock(importer, '')
        const requestMock = new PawRequestMock(null, '')
        const auths = new Immutable.List([
            new Auth.Basic({
                username: 'admin',
                password: 'admin'
            }),
            new Auth.ApiKey({
                in: 'header',
                name: 'api_key',
                key: '123123123'
            })
        ])

        mockedImporter.spyOn('_setBasicAuth', () => {
            return 'basicAuth'
        })

        mockedImporter.spyOn('_toDynamicString', (string) => {
            return string
        })

        importer._setAuth.apply(
            mockedImporter,
            [ requestMock, auths ]
        )

        this.assertTrue(requestMock.spy.setHeader.count === 2)
        this.assertEqual(
            requestMock.spy.setHeader.calls[0][1].components,
            [ 'basicAuth' ]
        )
        this.assertEqual(
            requestMock.spy.setHeader.calls[1],
            [ 'api_key', '123123123' ]
        )
    }

    @targets('_setFormDataBody')
    testSetFormDataBodyWithSimpleBody() {
        const importer = new ClassMock(new BaseImporter(), '')

        const requestMock = new PawRequestMock(null, '')
        const body = new Immutable.List([
            new Parameter({
                key: 'key',
                value: 'value'
            })
        ])

        let count = 0
        importer.spyOn('_toDynamicString', () => {
            count += 1
            return new DynamicString(count + '')
        })

        importer._setFormDataBody(requestMock, body)
        this.__compareDynamicValuesInDynamicStrings(
            requestMock.body,
            new DynamicString(
                new DynamicValue(
                    'com.luckymarmot.BodyMultipartFormDataDynamicValue',
                    { keyValues: null }
                )
            ),
            [ 'type' ]
        )

        const kv = requestMock.body.components[0].keyValues
        const ekv = [
            [ new DynamicString('1'), new DynamicString('2'), true ]
        ]

        this.assertEqual(kv.length, ekv.length)
        this.__compareSimpleDynamicStrings(kv[0][0], ekv[0][0])
        this.__compareSimpleDynamicStrings(kv[0][1], ekv[0][1])
    }

    @targets('_setFormDataBody')
    testSetFormDataBodyWithRichBody() {
        const importer = new ClassMock(new BaseImporter(), '')

        const requestMock = new PawRequestMock(null, '')
        const body = new Immutable.List([
            new Parameter({
                key: 'key',
                value: 'value'
            }),
            new Parameter({
                key: 'sec',
                value: 'ond'
            })
        ])

        let count = 0
        importer.spyOn('_toDynamicString', () => {
            count += 1
            return new DynamicString(count + '')
        })

        importer._setFormDataBody(requestMock, body)
        this.__compareDynamicValuesInDynamicStrings(
            requestMock.body,
            new DynamicString(
                new DynamicValue(
                    'com.luckymarmot.BodyMultipartFormDataDynamicValue',
                    { keyValues: null }
                )
            ),
            [ 'type' ]
        )

        const kv = requestMock.body.components[0].keyValues
        const ekv = [
            [ new DynamicString('1'), new DynamicString('2'), true ],
            [ new DynamicString('3'), new DynamicString('4'), true ]
        ]

        this.assertEqual(kv.length, ekv.length)
        this.__compareSimpleDynamicStrings(kv[0][0], ekv[0][0])
        this.__compareSimpleDynamicStrings(kv[0][1], ekv[0][1])
        this.__compareSimpleDynamicStrings(kv[1][0], ekv[1][0])
        this.__compareSimpleDynamicStrings(kv[1][1], ekv[1][1])
    }

    @targets('_setPlainBody')
    testSetPlainBody() {
        const importer = new ClassMock(new BaseImporter(), '')

        const mockedImporter = new ClassMock(importer, '')
        const requestMock = new PawRequestMock()
        const body = new Immutable.List([
            new Parameter({
                value: 'simple body'
            })
        ])

        let count = 0
        importer.spyOn('_toDynamicString', () => {
            count += 1
            return new DynamicString(count + '')
        })

        importer._setPlainBody.apply(
            mockedImporter,
            [ requestMock, body ]
        )

        this.assertJSONEqual(requestMock.body, new DynamicString('1'))
    }

    @targets('_setJSONBody')
    testSetJSONBody() {
        const importer = new ClassMock(new BaseImporter(), '')
        const body = new Immutable.List([
            new Parameter({
                value: {
                    test: true
                }
            })
        ])

        const requestMock = new PawRequestMock()

        let count = 0
        importer.spyOn('_toDynamicString', () => {
            count += 1
            return new DynamicString('{ "count": ' + count + '}')
        })

        importer._setJSONBody(requestMock, body)
        this.assertJSONEqual(requestMock.jsonBody, {
            count: 1
        })
    }

    @targets('_setUrlEncodedBody')
    testSetUrlEncodedBody() {
        const importer = new ClassMock(new BaseImporter(), '')

        const requestMock = new PawRequestMock()
        const body = new Immutable.List([
            new Parameter({
                key: 'test',
                value: 'value'
            }),
            new Parameter({
                key: 'sec',
                value: 'ond'
            })
        ])

        let count = 0
        importer.spyOn('_toDynamicString', () => {
            count += 1
            return new DynamicString(count + '')
        })
        const result = importer._setUrlEncodedBody(requestMock, body)

        this.assertEqual(importer.spy._toDynamicString.count, 4)
        this.assertJSONEqual(
            importer.spy._toDynamicString.calls,
            [
                [ 'test', true ],
                [ new Parameter({
                    key: 'test',
                    value: 'value'
                }), true ],
                [ 'sec', true ],
                [ new Parameter({
                    key: 'sec',
                    value: 'ond'
                }), true ]
            ]
        )

        this.assertJSONEqual(
            result.body.components[0].keyValues,
            [
                [ new DynamicString('1'), new DynamicString('2'), true ],
                [ new DynamicString('3'), new DynamicString('4'), true ]
            ]
        )
    }

    @targets('_setBody')
    testSetBodyWithformDataBodyType() {
        const importer = new BaseImporter()

        const mockedImporter = new ClassMock(importer, '')
        const requestMock = new PawRequestMock()
        const body = new ParameterContainer()

        mockedImporter.spyOn('_setFormDataBody', () => {
            return 12
        })
        importer._setBody.apply(
            mockedImporter,
            [ requestMock, 'multipart/form-data', body ]
        )

        this.assertEqual(mockedImporter.spy._setFormDataBody.count, 1)
        this.assertEqual(mockedImporter.spy._setFormDataBody.calls,
            [ [ requestMock, new Immutable.List() ] ]
        )
    }

    @targets('_setBody')
    testSetBodyWithurlEncodedBodyType() {
        const importer = new BaseImporter()

        const mockedImporter = new ClassMock(importer, '')
        const requestMock = new PawRequestMock()
        const body = new ParameterContainer()

        mockedImporter.spyOn('_setUrlEncodedBody', () => {
            return 12
        })
        importer._setBody.apply(
            mockedImporter,
            [ requestMock, 'application/x-www-form-urlencoded', body ]
        )

        this.assertEqual(mockedImporter.spy._setUrlEncodedBody.count, 1)
        this.assertEqual(mockedImporter.spy._setUrlEncodedBody.calls,
            [ [ requestMock, new Immutable.List() ] ]
        )
    }

    @targets('_setBody')
    testSetBodyWithJSONBodyType() {
        const importer = new BaseImporter()

        const mockedImporter = new ClassMock(importer, '')
        const requestMock = new PawRequestMock()
        const body = new ParameterContainer()

        mockedImporter.spyOn('_setJSONBody', () => {
            return 12
        })
        importer._setBody.apply(
            mockedImporter,
            [ requestMock, 'application/json', body ]
        )

        this.assertEqual(mockedImporter.spy._setJSONBody.count, 1)
        this.assertEqual(mockedImporter.spy._setJSONBody.calls,
            [ [ requestMock, new Immutable.List() ] ]
        )
    }

    @targets('_setBody')
    testSetBodyWithPlainBodyType() {
        const importer = new BaseImporter()

        const mockedImporter = new ClassMock(importer, '')
        const requestMock = new PawRequestMock()
        const body = new ParameterContainer()

        mockedImporter.spyOn('_setPlainBody', () => {
            return 12
        })
        importer._setBody.apply(
            mockedImporter,
            [ requestMock, 'plain', body ]
        )

        this.assertEqual(mockedImporter.spy._setPlainBody.count, 1)
        this.assertEqual(mockedImporter.spy._setPlainBody.calls,
            [ [ requestMock, new Immutable.List() ] ]
        )
    }

    @targets('_setBody')
    testSetBodyWithFileBodyType() {
        const importer = new BaseImporter()

        const mockedImporter = new ClassMock(importer, '')
        const requestMock = new PawRequestMock()
        const body = new ParameterContainer()

        mockedImporter.spyOn('_setPlainBody', () => {
            return 12
        })
        importer._setBody.apply(
            mockedImporter,
            [ requestMock, 'file', body ]
        )

        this.assertEqual(mockedImporter.spy._setPlainBody.count, 1)
        this.assertEqual(mockedImporter.spy._setPlainBody.calls,
            [ [ requestMock, new Immutable.List() ] ]
        )
    }

    @targets('_extractQueryParamsFromAuth')
    testExtractQueryParamsFromAuthWithNoAuth() {
        const importer = new BaseImporter()
        const auths = new Immutable.List()

        let result = importer._extractQueryParamsFromAuth(auths)

        this.assertEqual(result, [])
    }

    @targets('_extractQueryParamsFromAuth')
    testExtractQueryParamsFromAuthWithIrrelevantAuth() {
        const importer = new BaseImporter()
        const auths = new Immutable.List([
            new Auth.Basic()
        ])

        let result = importer._extractQueryParamsFromAuth(auths)

        this.assertEqual(result, [])
    }

    @targets('_extractQueryParamsFromAuth')
    testExtractQueryParamsFromAuthWithRelevantAuthTypeButNotInQuery() {
        const importer = new BaseImporter()
        const auths = new Immutable.List([
            new Auth.ApiKey({
                in: 'header',
                name: 'api-key',
                key: 'not a real key'
            })
        ])

        let result = importer._extractQueryParamsFromAuth(auths)

        this.assertEqual(result, [])
    }

    @targets('_extractQueryParamsFromAuth')
    testExtractQueryParamsFromAuthWithRelevantAuthTypeAndInQuery() {
        const importer = new BaseImporter()
        const auths = new Immutable.List([
            new Auth.ApiKey({
                in: 'query',
                name: 'api-key',
                key: 'not a real key'
            })
        ])

        let result = importer._extractQueryParamsFromAuth(auths)

        this.assertEqual(result, [
            new Parameter({
                key: 'api-key',
                value: 'not a real key'
            })
        ])
    }

    @targets('_generateUrl')
    testGenerateUrlWithSimpleUrl() {
        const importer = new ClassMock(new BaseImporter(), '')

        importer.spyOn('_toDynamicString', (string) => {
            if (string instanceof Parameter) {
                let dynStr = new DynamicString(string.generate())
                dynStr.$$_spyOn('appendString', (str) => {
                    dynStr.components.push(str)
                })
                dynStr.length = dynStr.components.length
                return dynStr
            }
            let dynStr = new DynamicString(string)
            dynStr.$$_spyOn('appendString', (str) => {
                dynStr.components.push(str)
            })
            dynStr.length = dynStr.components.length
            return dynStr
        })

        importer.spyOn('_extractQueryParamsFromAuth', () => {
            return []
        })

        const url = new URL({
            protocol: new Parameter({
                key: 'protocol',
                type: 'string',
                internals: new Immutable.List([
                    new Constraint.Enum([ 'http' ])
                ])
            }),
            host: new Parameter({
                key: 'host',
                type: 'string',
                internals: new Immutable.List([
                    new Constraint.Enum([
                        'fakeurl.com'
                    ])
                ])
            }),
            pathname: new Parameter({
                key: 'pathname',
                type: 'string',
                internals: new Immutable.List([
                    new Constraint.Enum([
                        '/fake/path'
                    ])
                ])
            })
        })

        const result = importer._generateUrl(url)

        this.assertJSONEqual(
            [ 'http', ':', '//', 'fakeurl.com', '/fake/path' ],
            result.components
        )
    }

    @targets('_generateUrl')
    testGenerateUrlWithSimpleQueryParams() {
        const importer = new ClassMock(new BaseImporter(), '')

        importer.spyOn('_toDynamicString', (string) => {
            let dyn
            if (string instanceof Parameter) {
                dyn = new DynamicString(string.generate())
            }
            else {
                dyn = new DynamicString(string)
            }

            dyn.$$_spyOn('appendString', (str) => {
                dyn.components.push(str)
            })

            dyn.length = dyn.components.length

            return dyn
        })

        importer.spyOn('_extractQueryParamsFromAuth', () => {
            return []
        })

        const url = new URL({
            protocol: new Parameter({
                key: 'protocol',
                type: 'string',
                internals: new Immutable.List([
                    new Constraint.Enum([
                        'http'
                    ])
                ])
            }),
            host: new Parameter({
                key: 'host',
                type: 'string',
                internals: new Immutable.List([
                    new Constraint.Enum([
                        'fakeurl.com'
                    ])
                ])
            }),
            pathname: new Parameter({
                key: 'pathname',
                type: 'string',
                internals: new Immutable.List([
                    new Constraint.Enum([
                        '/fake/path'
                    ])
                ])
            })
        })
        const queries = new Immutable.List([
            new Parameter({
                key: 'test',
                type: 'string',
                value: 'new',
                internals: new Immutable.List([
                    new Constraint.Enum([ 'new' ])
                ])
            })
        ])

        const result = importer._generateUrl(url, queries)

        const expected = new DynamicString(
            'http', ':', '//', 'fakeurl.com', '/fake/path',
            // '?', <- we don't have enough control to mock appendString of
            // any DynamicString, only the ones we provide can be mocked
            'test', '=', 'new'
        )

        this.assertJSONEqual(expected.components, result.components)
    }

    @targets('_generateUrl')
    testGenerateUrlWithQueriesAndAuthParams() {
        const importer = new ClassMock(new BaseImporter(), '')

        importer.spyOn('_toDynamicString', (string) => {
            let dyn
            if (string instanceof Parameter) {
                dyn = new DynamicString(string.generate())
            }
            else {
                dyn = new DynamicString(string)
            }

            dyn.$$_spyOn('appendString', (str) => {
                dyn.components.push(str)
            })

            dyn.length = dyn.components.length

            return dyn
        })

        importer.spyOn('_extractQueryParamsFromAuth', () => {
            return [
                new Parameter({
                    key: 'api-key',
                    type: 'string',
                    value: '123123123',
                    internals: new Immutable.List([
                        new Constraint.Enum([ '123123123' ])
                    ])
                })
            ]
        })

        const url = new URL({
            protocol: new Parameter({
                key: 'protocol',
                type: 'string',
                internals: new Immutable.List([
                    new Constraint.Enum([
                        'http'
                    ])
                ])
            }),
            host: new Parameter({
                key: 'host',
                type: 'string',
                internals: new Immutable.List([
                    new Constraint.Enum([
                        'fakeurl.com'
                    ])
                ])
            }),
            pathname: new Parameter({
                key: 'pathname',
                type: 'string',
                internals: new Immutable.List([
                    new Constraint.Enum([
                        '/fake/path'
                    ])
                ])
            })
        })
        const queries = new Immutable.List([
            new Parameter({
                key: 'test',
                type: 'string',
                value: 'new',
                internals: new Immutable.List([
                    new Constraint.Enum([ 'new' ])
                ])
            })
        ])
        const auths = new Immutable.List([
            new Auth.ApiKey({
                in: 'query',
                name: 'api-key',
                key: '123123123'
            })
        ])

        const result = importer._generateUrl(url, queries, auths)

        const expected = new DynamicString(
            'http', ':', '//', 'fakeurl.com', '/fake/path',
            // '?', <- we don't have enough control to mock appendString of
            // any DynamicString, only the ones we provide can be mocked
            'test', '=', 'new', '&', 'api-key', '=', '123123123'
        )

        this.assertEqual(expected.components, result.components)
    }

    @targets('_importPawRequests')
    testImportPawRequest() {
        const importer = new BaseImporter()

        const mockedImporter = new ClassMock(importer, '')
        const contextMock = new PawContextMock()

        const container = new ParameterContainer({
            headers: new Immutable.List([
                new Parameter({
                    key: 'fake',
                    value: 'header'
                })
            ])
        })

        const request = new Request({
            url: 'dummyURL',
            method: 'POST',
            parameters: container,
            auths: new Immutable.List([
                new Auth.Basic({
                    username: 'marmot'
                })
            ])
        })

        mockedImporter.context = contextMock
        mockedImporter.spyOn('_createPawRequest', (req) => {
            this.assertEqual(
                req.get('url'), 'dummyURL',
                req.get('method'), 'POST'
            )
            return {
                url: 'http://test.luckymarmot.com',
                method: 'GET'
            }
        })

        mockedImporter.spyOn('_setHeaders', (req, headers) => {
            this.assertEqual(headers, container)
            return {
                headers: {
                    fake: 'header'
                }
            }
        })

        mockedImporter.spyOn('_setAuth', (req, auth) => {
            this.assertEqual(
                auth, new Immutable.List([
                    new Auth.Basic({
                        username: 'marmot'
                    })
                ])
            )
            return {}
        })

        mockedImporter.spyOn('_setBody',
            (req, bodyType, _container, schema) => {
                this.assertEqual(
                    typeof bodyType, 'undefined'
                )
                this.assertEqual(
                    _container, container
                )
                this.assertEqual(
                    schema, { schema: true }
                )
                return {}
            }
        )

        importer._importPawRequest.apply(
            mockedImporter,
            [
                null,
                { appendChild: () => {} },
                request,
                { schema: true }
            ]
        )

        this.assertEqual(mockedImporter.spy._createPawRequest.count, 1)
        this.assertEqual(mockedImporter.spy._setHeaders.count, 1)
        this.assertEqual(mockedImporter.spy._setAuth.count, 1)
        this.assertEqual(mockedImporter.spy._setBody.count, 1)
    }

    @targets('_applyFuncOverGroupTree')
    testApplyFuncOverGroupTree() {
        this.__loadTestSuite(
            'ApplyFuncOverGroupTree',
            '_applyFuncOverGroupTree'
        )
    }

    @targets('import')
    testImportWithSimpleUseCase(done) {
        const importer = new ClassMock(new BaseImporter(), '')
        const contextMock = new PawContextMock()
        const reqContext = new Context()

        importer.spyOn('createRequestContexts', () => {
            return [
                {
                    context: reqContext,
                    items: []
                }
            ]
        })

        importer.spyOn('_importContext', () => {})

        let final = importer.import(contextMock, [ null ], null)

        final.then((status) => {
            this.assertEqual(importer.spy.createRequestContexts.count, 1)
            this.assertEqual(importer.spy.createRequestContexts.calls,
                [ [ contextMock, [ null ], null ] ]
            )

            this.assertEqual(importer.spy._importContext.count, 1)

            this.assertTrue(status)
            done()
        }, error => {
            throw error
        }).catch(err => {
            done(new Error(err))
        })
        /* eslint-enable no-undefined */
    }

    @targets('import')
    testImportWithRejectedContext(done) {
        const importer = new ClassMock(new BaseImporter(), '')
        const contextMock = new PawContextMock()

        importer.spyOn('createRequestContexts', () => {
            return new Promise((_, reject) => {
                return reject(new Error('dummy error'))
            })
        })

        let final = importer.import(contextMock, [ null ], null)

        final.then((status) => {
            this.assertFalse(status)
            done()
        }).catch(err => {
            done(err)
        })
    }

    @targets('import')
    testImportWithFailedContext(done) {
        const importer = new ClassMock(new BaseImporter(), '')
        const contextMock = new PawContextMock()

        importer.spyOn('createRequestContexts', () => {
            return new Promise(() => {
                throw new Error('dummy error')
            })
        })

        let final = importer.import(contextMock, [ null ], null)

        final.then((status) => {
            this.assertFalse(status)
            done()
        }).catch(err => {
            done(err)
        })
    }

    @targets('import')
    testImportWithRejectedImport(done) {
        const importer = new ClassMock(new BaseImporter(), '')
        const contextMock = new PawContextMock()
        const reqContext = new Context()

        importer.spyOn('createRequestContexts', () => {
            return [
                {
                    context: reqContext,
                    items: []
                }
            ]
        })

        importer.spyOn('_importContext', () => {
            return new Promise((_, reject) => {
                return reject(new Error('dummy error'))
            })
        })

        let final = importer.import(contextMock, [ null ], null)

        final.then((status) => {
            this.assertFalse(status)
            done()
        }).catch(err => {
            done(err)
        })
    }

    @targets('import')
    testImportWithFailedImport(done) {
        const importer = new ClassMock(new BaseImporter(), '')
        const contextMock = new PawContextMock()
        const reqContext = new Context()

        importer.spyOn('createRequestContexts', () => {
            return [
                {
                    context: reqContext,
                    items: []
                }
            ]
        })

        importer.spyOn('_importContext', () => {
            return new Promise(() => {
                throw new Error('dummy error')
            })
        })

        let final = importer.import(contextMock, [ null ], null)

        final.then((status) => {
            this.assertFalse(status)
            done()
        }).catch(err => {
            done(err)
        })
    }

    @targets('_importContext')
    testImportContextShouldThrowWithInvalidRequestContext() {
        const importer = new ClassMock(new BaseImporter(), '')
        const reqContext = null

        let failed = false
        try {
            importer._importContext(null, reqContext)
        }
        catch (e) {
            failed = true
        }

        this.assertTrue(failed)
    }

    @targets('_importContext')
    testImportContextCallsContextResolver(done) {
        const importer = new ClassMock(new BaseImporter(), '')
        const reqContext = new Context()
        const paw = new PawEnvironment()
        const resolver = new ClassMock(new ContextResolver(paw), '')

        importer.spyOn('_importPawRequests', () => {})

        let promise = importer._importContext(resolver, reqContext)

        promise.then(() => {
            this.assertEqual(resolver.spy.resolveAll.count, 1)
            done()
        }, (err) => {
            throw err
        }).catch(err => {
            return done(err)
        })
    }

    @targets('_importContext')
    testImportContextCallsImportPawRequests(done) {
        const importer = new ClassMock(new BaseImporter(), '')
        const reqContext = new Context()
        const paw = new PawEnvironment()
        const resolver = new ContextResolver(paw)

        importer.spyOn('_importPawRequests', () => {})

        let promise = importer._importContext(resolver, reqContext)

        promise.then(() => {
            this.assertEqual(importer.spy._importPawRequests.count, 1)
            done()
        }, (err) => {
            throw err
        }).catch(err => {
            return done(err)
        })
    }

    @targets('_importReferences')
    testImportReferences() {
        const importer = new ClassMock(new BaseImporter(), '')
        const env = new Mock({
            setVariablesValues: () => {}
        }, '')

        let container = new ReferenceContainer()
        container = container.create(new Immutable.List([
            new JSONSchemaReference({
                uri: '#/references/Friend',
                relative: '#/references/Friend',
                value: {
                    $ref: new JSONSchemaReference({
                        uri: '#/references/User'
                    })
                },
                resolved: true,
                dependencies: new Immutable.List([
                    new JSONSchemaReference({
                        uri: '#/references/User',
                        relative: '#/references/User'
                    })
                ])
            }),
            new JSONSchemaReference({
                uri: '#/references/User',
                relative: '#/references/User',
                value: {
                    $ref: new JSONSchemaReference({
                        uri: '#/references/Friend'
                    })
                },
                resolved: true,
                dependencies: new Immutable.List([
                    new JSONSchemaReference({
                        uri: '#/references/Friend',
                        relative: '#/references/Friend'
                    })
                ])
            })
        ]))

        const references = new Immutable.OrderedMap({
            schemas: container
        })

        importer.spyOn('_getEnvironmentDomain', () => {
            return 12
        })

        importer.spyOn('_getEnvironment', () => {
            return env
        })

        importer.spyOn('_setReference', () => {
            return 42
        })

        importer._importReferences(references)

        this.assertEqual(importer.spy._getEnvironmentDomain.count, 1)
        this.assertEqual(importer.spy._getEnvironment.count, 1)
        this.assertEqual(importer.spy._setReference.count, 2)
        this.assertEqual(env.spy.setVariablesValues.count, 1)

        this.assertEqual(importer.spy._getEnvironment.calls[0][1], 'schemas')
        this.assertJSONEqual(env.spy.setVariablesValues.calls[0][0], {
            '#/references/Friend': new DynamicString(42),
            '#/references/User': new DynamicString(42)
        })
    }

    @targets('_setReference')
    testSetReferenceWithJSONSchemaRef() {
        const importer = new ClassMock(new BaseImporter(), '')

        let schemaref = new JSONSchemaReference({
            uri: '#/references/Friend',
            relative: '#/references/Friend',
            value: {
                $ref: new JSONSchemaReference({
                    uri: '#/references/User'
                })
            },
            resolved: true,
            dependencies: new Immutable.List([
                new JSONSchemaReference({
                    uri: '#/references/User',
                    relative: '#/references/User'
                })
            ])
        })

        importer.spyOn('_setJSONSchemaReference', () => {
            return 12
        })

        let expected = 12
        let result = importer._setReference(schemaref)
        this.assertEqual(expected, result)
        this.assertEqual(importer.spy._setJSONSchemaReference.count, 1)
    }

    @targets('_setReference')
    testSetReferenceWithExoticRef() {
        const importer = new ClassMock(new BaseImporter(), '')

        let exoticref = new ExoticReference({
            uri: '#/references/User',
            relative: '#/references/User',
            value: null,
            resolved: true,
            dependencies: new Immutable.List([])
        })

        importer.spyOn('_setExoticReference', () => {
            return 12
        })

        let expected = 12
        let result = importer._setReference(exoticref)
        this.assertEqual(expected, result)
        this.assertEqual(importer.spy._setExoticReference.count, 1)
    }

    @targets('_setReference')
    testSetReferenceWithSimpleRef() {
        const importer = new ClassMock(new BaseImporter(), '')

        let simpleref = new ExoticReference({
            uri: '#/references/User',
            relative: '#/references/User',
            value: 42,
            resolved: true,
            dependencies: new Immutable.List([])
        })

        importer.spyOn('_setSimpleReference', () => {
            return 12
        })

        let expected = 12
        let result = importer._setReference(simpleref)
        this.assertEqual(expected, result)
        this.assertEqual(importer.spy._setSimpleReference.count, 1)
    }

    @targets('_setJSONSchemaReference')
    testSetJSONSchemaReference() {
        const importer = new ClassMock(new BaseImporter(), '')

        let schemaref = new JSONSchemaReference({
            uri: '#/references/Friend',
            relative: '#/references/Friend',
            value: {
                $ref: new JSONSchemaReference({
                    uri: '#/references/User'
                })
            },
            resolved: true,
            dependencies: new Immutable.List([
                new JSONSchemaReference({
                    uri: '#/references/User',
                    relative: '#/references/User'
                })
            ])
        })

        let expected = new DynamicValue(
            'com.luckymarmot.PawExtensions.JSONSchemaFakerDynamicValue',
            {
                schema: {
                    $ref: '#/references/User'
                }
            }
        )
        let result = importer._setJSONSchemaReference(schemaref)
        this.assertEqual(expected.type, result.type)
        this.assertJSONEqual(expected.schema, result.schema)
    }

    @targets('_setExoticReference')
    testSetExoticReference() {
        const importer = new ClassMock(new BaseImporter(), '')

        let exoticref = new ExoticReference({
            uri: 'swagger.json',
            relative: 'swagger.json',
            value: null,
            resolved: true,
            dependencies: new Immutable.List([])
        })

        let expected = new DynamicValue(
            'com.luckymarmot.FileContentDynamicValue', {
                filePath: 'swagger.json'
            }
        )

        let result = importer._setExoticReference(exoticref)
        this.assertEqual(expected.type, result.type)
        this.assertEqual(expected.filePath, result.filePath)
    }

    @targets('_setSimpleReference')
    testSetSimpleReference() {
        const importer = new ClassMock(new BaseImporter(), '')

        let simpleref = new ExoticReference({
            uri: '#/references/User',
            relative: '#/references/User',
            value: 42,
            resolved: true,
            dependencies: new Immutable.List([])
        })

        let expected = 42

        let result = importer._setSimpleReference(simpleref)
        this.assertEqual(expected, result)
    }

    @targets('_castParameterToDynamicString')
    testCastParameterToDynamicStringWithSimpleParam() {
        const importer = new ClassMock(new BaseImporter(), '')

        let param = new Parameter({
            key: 'ignored',
            type: 'string',
            value: 'new',
            internals: new Immutable.List([
                new Constraint.Enum([ 'new', 'old' ])
            ])
        })

        const expected = new DynamicString(new DynamicValue(
            'com.luckymarmot.PawExtensions' +
            '.JSONSchemaFakerDynamicValue',
            {
                schema: {
                    type: 'string',
                    enum: [ 'new', 'old' ],
                    'x-title': 'ignored',
                    default: 'new'
                }
            }
        ))

        const result = importer._castParameterToDynamicString(param)

        this.assertJSONEqual(expected, result)
    }

    @targets('_castParameterToDynamicString')
    testCastParameterToDynamicStringWithSequenceParam() {
        const importer = new ClassMock(new BaseImporter(), '')

        let param = new Parameter({
            key: 'host',
            type: 'string',
            value: new Immutable.List([
                new Parameter({
                    key: 'version',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([ 'v0.8', 'v1' ])
                    ])
                }),
                new Parameter({
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([ '.luckymarmot.' ])
                    ])
                }),
                new Parameter({
                    key: 'extension',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            'com', 'co.uk', 'io'
                        ])
                    ])
                })
            ]),
            format: 'sequence'
        })

        const expected = new DynamicString(
            new DynamicValue(
                'com.luckymarmot.PawExtensions' +
                '.JSONSchemaFakerDynamicValue',
                {
                    schema: {
                        type: 'string',
                        enum: [ 'v0.8', 'v1' ],
                        'x-title': 'version'
                    }
                }
            ),
            '.luckymarmot.',
            new DynamicValue(
                'com.luckymarmot.PawExtensions' +
                '.JSONSchemaFakerDynamicValue',
                {
                    schema: {
                        type: 'string',
                        enum: [ 'com', 'co.uk', 'io' ],
                        'x-title': 'extension'
                    }
                }
            ),
        )

        const result = importer._castParameterToDynamicString(param)

        this.assertJSONEqual(expected, result)
    }

    @targets('_extractContentTypeFromBody')
    testExtractContentTypeFromBody() {
        const importer = new ClassMock(new BaseImporter(), '')

        const body = new Body({
            constraints: new Immutable.List([
                new Parameter({
                    key: 'Content-Type',
                    type: 'string',
                    value: 'application/json'
                })
            ])
        })

        const expected = 'application/json'

        const result = importer._extractContentTypeFromBody(body)

        this.assertEqual(expected, result)
    }

    @targets('_castReferenceToDynamicString')
    testCastReferenceToDynamicString() {
        const importer = new ClassMock(new BaseImporter(), '')

        importer.spyOn('_extractReferenceComponent', () => {
            return '12'
        })

        const ref = new ExoticReference({
            uri: 'swagger.json',
            relative: 'swagger.json'
        })

        const expected = new DynamicString('12')

        const result = importer._castReferenceToDynamicString(ref)

        this.assertJSONEqual(expected, result)
    }

    @targets('serialize')
    _testSerialize() {}
    //
    // helpers
    //

    __warnProgress(string, isTestCase = false) {
        let offset = isTestCase ? '    ' : '      '
        let warn =
            offset + '\x1b[33m\u25CB\x1b[0m \x1b[90m' +
            string + '\x1b[0m'
        /* eslint-disable no-console */
        console.log(warn)
        /* eslint-enable no-console */
    }

    __loadTestSuite(testSuitName, functionName) {
        const importer = new BaseImporter()
        let cases = BaseImporterFixtures['get' + testSuitName + 'Cases']()
        this.__warnProgress(testSuitName, true)
        for (let usecase of cases) {
            this.__warnProgress(usecase.name)
            let output = importer[functionName].apply(importer, usecase.inputs)
            this.assertEqual(output, usecase.output, 'in ' + usecase.name)
        }
    }

    __compareSimpleDynamicStrings(dyn1, dyn2) {
        this.assertEqual(dyn1.components, dyn2.components)
    }

    __compareDynamicValuesInDynamicStrings(dyn1, dyn2, keys) {
        this.assertEqual(dyn1.components.length, dyn2.components.length)
        dyn1.components.forEach((d, i) => {
            for (let key of keys) {
                this.assertEqual(d[key], dyn2.components[i][key])
            }
        })
    }
}
