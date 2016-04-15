import Immutable from 'immutable'
import RequestContext, {
    FileReference,
    Request,
    KeyValue,
    SchemaReference,
    Environment,
    EnvironmentReference
} from '../../../immutables/RequestContext'

import {
    BasicAuth,
    DigestAuth,
    OAuth1Auth,
    OAuth2Auth,
    HawkAuth,
    AWSSig4Auth,
    ApiKeyAuth
} from '../../../immutables/Auth'

import { UnitTest, registerTest } from '../../../utils/TestUtils'
import BaseImporterFixtures from './fixtures/BaseImporter-fixtures'
import {
    DynamicString,
    DynamicValue,
    PawContextMock,
    PawRequestMock,
    ClassMock,
    Mock
} from '../../../Mocks/PawMocks'

import BaseImporter from '../BaseImporter'

@registerTest
export class TestBaseImporter extends UnitTest {
    // TODO
    testResolveFileReferenceReturnsValue() {
        const importer = new BaseImporter()

        const input = 'Some Text'

        let result = importer._resolveFileReference(input)
        this.assertEqual(result, input)
    }

    testResolveFileReferenceReturnsDynamicString() {
        const importer = new BaseImporter()

        const input = new FileReference()

        let result = importer._resolveFileReference(input)
        this.assertTrue(result instanceof DynamicString)
        this.assertTrue(result.components.length === 1)
        this.assertTrue(result.components[0] instanceof DynamicValue)
        this.assertEqual(
            result.components[0].type,
            'com.luckymarmot.FileContentDynamicValue'
        )
    }

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

    testNoDefaultToDynamicString() {
        const importer = new BaseImporter()
        const expected = null

        let result = importer._toDynamicString(null)
        this.assertEqual(result, expected)
    }

    testDefaultToEmptyToDynamicString() {
        const importer = new BaseImporter()
        const input = new FileReference({
            filepath: 'somepath'
        })
        const expected = importer._resolveFileReference(
            new FileReference({
                filepath: 'somepath'
            })
        )

        let result = importer._toDynamicString(input, true, true)
        this.assertTrue(result instanceof DynamicString)
        this.assertEqual(result.components.length, 1)
        this.assertEqual(
            result.components[0].filepath,
            expected.components[0].filepath
        )
        this.assertEqual(
            result.components[0].type,
            expected.components[0].type
        )
    }

    testEnvironmentReferenceToDynamicString() {
        const importer = new BaseImporter()
        const mockedImporter = new ClassMock(importer, '')

        const input = new EnvironmentReference({
            id: 123,
            referenceName: new Immutable.List([ 'value' ])
        })

        mockedImporter.spyOn('_resolveFileReference', () => {
            return 'not important for this test'
        })

        mockedImporter.spyOn('_castReferenceToDynamicString', () => {
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
            [ input, true, true ]
        )

        this.assertEqual(
            mockedImporter.spy._resolveFileReference.count, 1
        )
        this.assertEqual(
            mockedImporter.spy._castReferenceToDynamicString.count, 1
        )
        this.assertEqual(
            mockedImporter.spy._castReferenceToDynamicString.calls,
            [ [ input ] ]
        )

        this.assertTrue(result instanceof DynamicString)
        this.assertEqual(result.components.length, 1)
        this.assertEqual(result.components[0], 'value')
    }

    testResolveFileRefsToDynamicString() {
        const importer = new BaseImporter()
        const mockedImporter = new ClassMock(importer, '')

        const input = new FileReference({
            filepath: 'somepath'
        })

        const output = new DynamicString(
            new DynamicValue(
                'com.luckymarmot.FileContentDynamicValue', {}
            )
        )

        mockedImporter.spyOn('_resolveFileReference', () => {
            return output
        })

        mockedImporter.spyOn('_castReferenceToDynamicString', () => {
            // this should not be called for this test
            this.assertTrue(false)
        })

        mockedImporter.spyOn('_escapeSequenceDynamicValue', () => {
            // this should not be called for this test
            this.assertTrue(false)
        })

        let result = importer._toDynamicString.apply(
            mockedImporter,
            [ input, true, true ]
        )

        this.assertEqual(
            mockedImporter.spy._resolveFileReference.count, 1
        )
        this.assertEqual(
            mockedImporter.spy._resolveFileReference.calls,
            [ [ input ] ]
        )

        this.assertTrue(result instanceof DynamicString)
        this.assertEqual(result.components.length, 1)
        this.assertEqual(result, output)
    }

    testExtractReferenceComponentWithString() {
        const importer = new BaseImporter()
        const input = 'testString'

        const result = importer._extractReferenceComponent(input)
        this.assertEqual(input, result)
    }

    testExtractReferenceComponentWithSimpleReference() {
        const importer = new BaseImporter()
        const mockedImporter = new ClassMock(importer, '')

        mockedImporter.spyOn('_getEnvironmentVariable', () => {
            return {
                id: 42
            }
        })

        const input = new EnvironmentReference({
            referenceName: new Immutable.List([ 'value' ])
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
            [ [ 'value' ] ]
        )
        this.assertEqual(expected.type, result.type)
        this.assertEqual(
            expected.environmentVariable,
            result.environmentVariable
        )
    }

    testExtractReferenceComponentWithComplexReference() {
        const importer = new BaseImporter()
        const mockedImporter = new ClassMock(importer, '')

        mockedImporter.spyOn('_getEnvironmentVariable', () => {
            this.assertTrue(false)
        })

        const input = new EnvironmentReference({
            referenceName: new Immutable.List([
                'value',
                new EnvironmentReference()
            ])
        })

        const expected = null

        const result = importer._extractReferenceComponent.apply(
            mockedImporter,
            [ input ]
        )

        this.assertEqual(expected, result)
    }

    testCastReferenceToDynamicStringWithSimpleReference() {
        const importer = new BaseImporter()
        const mockedImporter = new ClassMock(importer, '')

        mockedImporter.spyOn('_extractReferenceComponent', () => {
            return 'mock'
        })

        const input = new EnvironmentReference({
            referenceName: new Immutable.List([
                'value'
            ])
        })

        const expected = new DynamicString('mock')

        const result = importer._castReferenceToDynamicString.apply(
            mockedImporter,
            [ input ]
        )

        this.assertEqual(expected.components, result.components)
    }

    testCastReferenceToDynamicStringWithRichReference() {
        const importer = new BaseImporter()
        const mockedImporter = new ClassMock(importer, '')

        let counter = 0
        mockedImporter.spyOn('_extractReferenceComponent', () => {
            counter += 1
            return 'mock' + counter
        })

        const input = new EnvironmentReference({
            referenceName: new Immutable.List([
                new EnvironmentReference({
                    referenceName: new Immutable.List([
                        'uuid'
                    ])
                }),
                '-',
                new EnvironmentReference({
                    referenceName: new Immutable.List([
                        'tid'
                    ])
                })
            ])
        })

        const expected = new DynamicString('mock1', 'mock2', 'mock3')

        const result = importer._castReferenceToDynamicString.apply(
            mockedImporter,
            [ input ]
        )

        this.assertEqual(mockedImporter.spy._extractReferenceComponent.count, 3)
        this.assertEqual(expected.components, result.components)
    }

    testCastReferenceToDynamicStringWithTooComplexReference() {
        const importer = new BaseImporter()
        const mockedImporter = new ClassMock(importer, '')

        let counter = 0
        mockedImporter.spyOn('_extractReferenceComponent', () => {
            if (counter) {
                return null
            }
            counter += 1
            return 'mock' + counter
        })

        const input = new EnvironmentReference({
            referenceName: new Immutable.List([
                new EnvironmentReference({
                    referenceName: new Immutable.List([
                        'uuid'
                    ])
                }),
                '-',
                new EnvironmentReference({
                    referenceName: new Immutable.List([
                        'tid'
                    ])
                })
            ])
        })

        const expected = new DynamicString('mock1')

        const result = importer._castReferenceToDynamicString.apply(
            mockedImporter,
            [ input ]
        )

        this.assertEqual(mockedImporter.spy._extractReferenceComponent.count, 3)
        this.assertEqual(expected.components, result.components)
    }

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

    testImportEnvironments() {
        const importer = new BaseImporter()
        const mockedImporter = new ClassMock(importer, '')
        const contextMock = new PawContextMock(null, '')

        const domain = new Mock({
            createEnvironment: () => {}
        }, '')

        const environment = new Mock({
            setVariablesValues: () => {}
        }, '')

        mockedImporter.ENVIRONMENT_DOMAIN_NAME = 'Mocked Environment Domain'
        mockedImporter.context = contextMock

        mockedImporter.spyOn('_getEnvironmentDomain', () => {
            return domain
        })

        domain.spyOn('createEnvironment', () => {
            return environment
        })

        importer._importEnvironments.apply(
            mockedImporter,
            [ [
                new Environment({
                    variables: new Immutable.OrderedMap({
                        var: new KeyValue({ key: 'var', value: 'test' }),
                        rate: new KeyValue({ key: 'rate', value: '123' })
                    })
                })
            ] ]
        )

        this.assertEqual(
            mockedImporter.spy._getEnvironmentDomain.count, 1
        )
        this.assertEqual(
            domain.spy.createEnvironment.count, 1
        )
        this.assertEqual(
            environment.spy.setVariablesValues.count, 1
        )
        this.assertEqual(
            environment.spy.setVariablesValues.calls[0],
            [ {
                var: 'test',
                rate: '123'
            } ]
        )
    }

    testImportEnvironmentsWithMultipleEnvironments() {
        const importer = new BaseImporter()
        const mockedImporter = new ClassMock(importer, '')
        const contextMock = new PawContextMock(null, '')

        const domain = new Mock({
            createEnvironment: () => {}
        }, '')

        const environment = new Mock({
            setVariablesValues: () => {}
        }, '')

        mockedImporter.ENVIRONMENT_DOMAIN_NAME = 'Mocked Environment Domain'
        mockedImporter.context = contextMock

        mockedImporter.spyOn('_getEnvironmentDomain', () => {
            return domain
        })

        domain.spyOn('createEnvironment', () => {
            return environment
        })

        importer._importEnvironments.apply(
            mockedImporter,
            [ [
                new Environment({
                    variables: new Immutable.OrderedMap({
                        var: new KeyValue({ key: 'var', value: 'test' }),
                        rate: new KeyValue({ key: 'rate', value: '123' })
                    })
                }),
                new Environment({
                    variables: new Immutable.OrderedMap({
                        var: new KeyValue({ key: 'var2', value: 'test2' }),
                        rate: new KeyValue({ key: 'rate2', value: '1232' })
                    })
                })
            ] ]
        )

        this.assertEqual(
            mockedImporter.spy._getEnvironmentDomain.count, 1
        )
        this.assertEqual(
            domain.spy.createEnvironment.count, 2
        )
        this.assertEqual(
            environment.spy.setVariablesValues.count, 2
        )
    }

    testSimpleCreatePawRequest() {
        const importer = new BaseImporter()

        const contextMock = new PawContextMock(null, '')
        const input = new Request({
            url: 'http://fakeurl.com'
        })

        importer.context = contextMock
        importer._createPawRequest(input)

        this.assertTrue(contextMock.spy.createRequest.count === 1)
        this.assertEqual(
            contextMock.spy.createRequest.calls[0].slice(0, 2),
            [ null, null ]
        )
        this.assertEqual(
            contextMock.spy.createRequest.calls[0][2].components[0],
            'http://fakeurl.com'
        )
    }

    testCreatePawRequestWithRequestData() {
        const importer = new BaseImporter()

        const contextMock = new PawContextMock(null, '')
        const input = new Request({
            name: 'testReq',
            method: 'GET',
            url: 'http://fakeurl.com'
        })

        importer.context = contextMock
        importer._createPawRequest(input)

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
            [ request ]
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
            [ null, null, new Immutable.List() ]
        )

        this.assertEqual(
            contextMock.spy.createRequest.calls[0],
            [ null, null, 'dummyValue' ]
        )
    }

    testSimpleSetHeaders() {
        const importer = new BaseImporter()

        const requestMock = new PawRequestMock(null, '')
        const headers = (new Request()).get('headers')

        importer._setHeaders(requestMock, headers)

        this.assertTrue(requestMock.spy.setHeader.count === 0)
    }

    testSetHeadersWithHeaders() {
        const importer = new BaseImporter()

        const requestMock = new PawRequestMock(null, '')
        let req = new Request()
        req = req
            .setIn([ 'headers', 'key' ], 'value')
            .setIn([ 'headers', 'sec' ], 'ond')

        const headers = req.get('headers')

        importer._setHeaders(requestMock, headers)

        this.assertTrue(requestMock.spy.setHeader.count === 2)
        this.assertTrue(requestMock.spy.setHeader.calls[0].length === 2)

        this.__compareSimpleDynamicStrings(
            requestMock.spy.setHeader.calls[0][0],
            new DynamicString('key')
        )
        this.__compareSimpleDynamicStrings(
            requestMock.spy.setHeader.calls[0][1],
            new DynamicString('value')
        )
        this.__compareSimpleDynamicStrings(
            requestMock.spy.setHeader.calls[1][0],
            new DynamicString('sec')
        )
        this.__compareSimpleDynamicStrings(
            requestMock.spy.setHeader.calls[1][1],
            new DynamicString('ond')
        )
    }

    testSetBasicAuth() {
        const importer = new BaseImporter()

        const auth = new BasicAuth({
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

    testSetBasicAuthWithInitializedValues() {
        const importer = new BaseImporter()

        const auth = new BasicAuth({
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

    testSetDigestAuth() {
        const importer = new BaseImporter()

        const auth = new DigestAuth({
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

    testSetDigestAuthWithInitializedValues() {
        const importer = new BaseImporter()

        const auth = new DigestAuth({
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

    testSetOAuth1Auth() {
        const importer = new BaseImporter()

        const auth = new OAuth1Auth()

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

    testSetOAuth1AuthWithInitialValues() {
        const importer = new BaseImporter()

        const auth = new OAuth1Auth({
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

    testSetOAuth2Auth() {
        const importer = new BaseImporter()

        const auth = new OAuth2Auth()

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

    testSetOAuth2AuthWithInitialValues() {
        const importer = new BaseImporter()

        const auth = new OAuth2Auth({
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

    testSetAWSSig4Auth() {
        const importer = new BaseImporter()

        const auth = new AWSSig4Auth()

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

    testSetAWSSig4AuthWithInitialValues() {
        const importer = new BaseImporter()

        const auth = new AWSSig4Auth({
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

    testSetHawkAuth() {
        const importer = new BaseImporter()

        const auth = new HawkAuth()

        let dv = importer._setHawkAuth(auth)

        this.assertEqual(
            dv.type,
            'uk.co.jalada.PawExtensions.HawkDynamicValue'
        )

        this.assertEqual(dv.key.components, [ '' ])
        this.assertEqual(dv.id.components, [ '' ])
        this.assertEqual(dv.algorithm.components, [ '' ])
    }

    testSetHawkAuthWithInitialValues() {
        const importer = new BaseImporter()

        const auth = new HawkAuth({
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

    testSetAuthwithBasicAuth() {
        const importer = new BaseImporter()
        const mockedImporter = new ClassMock(importer, '')
        const requestMock = new PawRequestMock(null, '')
        const auths = new Immutable.List([
            new BasicAuth()
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

    testSetAuthwithDigestAuth() {
        const importer = new BaseImporter()
        const mockedImporter = new ClassMock(importer, '')
        const requestMock = new PawRequestMock(null, '')
        const auths = new Immutable.List([
            new DigestAuth()
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

    testSetAuthwithOAuth1Auth() {
        const importer = new BaseImporter()
        const mockedImporter = new ClassMock(importer, '')
        const requestMock = new PawRequestMock(null, '')
        const auths = new Immutable.List([
            new OAuth1Auth()
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

    testSetAuthwithOAuth2Auth() {
        const importer = new BaseImporter()
        const mockedImporter = new ClassMock(importer, '')
        const requestMock = new PawRequestMock(null, '')
        const auths = new Immutable.List([
            new OAuth2Auth()
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

    testSetAuthwithAWSSig4Auth() {
        const importer = new BaseImporter()
        const mockedImporter = new ClassMock(importer, '')
        const requestMock = new PawRequestMock(null, '')
        const auths = new Immutable.List([
            new AWSSig4Auth()
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

    testSetAuthwithHawkAuth() {
        const importer = new BaseImporter()
        const mockedImporter = new ClassMock(importer, '')
        const requestMock = new PawRequestMock(null, '')
        const auths = new Immutable.List([
            new HawkAuth()
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

    testSetAuthwithApiKeyAuth() {
        const importer = new BaseImporter()
        const mockedImporter = new ClassMock(importer, '')
        const requestMock = new PawRequestMock(null, '')
        const auths = new Immutable.List([
            new ApiKeyAuth({
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

    testSetAuthwithMultipleAuth() {
        const importer = new BaseImporter()
        const mockedImporter = new ClassMock(importer, '')
        const requestMock = new PawRequestMock(null, '')
        const auths = new Immutable.List([
            new BasicAuth({
                username: 'admin',
                password: 'admin'
            }),
            new ApiKeyAuth({
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

    testSetFormDataBodyWithSimpleBody() {
        const importer = new BaseImporter()

        const requestMock = new PawRequestMock(null, '')
        const body = new Immutable.List([
            new KeyValue({
                key: 'key',
                value: 'value'
            })
        ])

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
            [ new DynamicString('key'), new DynamicString('value'), true ]
        ]

        this.assertEqual(kv.length, ekv.length)
        this.__compareSimpleDynamicStrings(kv[0][0], ekv[0][0])
        this.__compareSimpleDynamicStrings(kv[0][1], ekv[0][1])
    }

    testSetFormDataBodyWithRichBody() {
        const importer = new BaseImporter()

        const requestMock = new PawRequestMock(null, '')
        const body = new Immutable.List([
            new KeyValue({
                key: 'key',
                value: 'value'
            }),
            new KeyValue({
                key: 'sec',
                value: 'ond'
            })
        ])

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
            [ new DynamicString('key'), new DynamicString('value'), true ],
            [ new DynamicString('sec'), new DynamicString('ond'), true ]
        ]

        this.assertEqual(kv.length, ekv.length)
        this.__compareSimpleDynamicStrings(kv[0][0], ekv[0][0])
        this.__compareSimpleDynamicStrings(kv[0][1], ekv[0][1])
        this.__compareSimpleDynamicStrings(kv[1][0], ekv[1][0])
        this.__compareSimpleDynamicStrings(kv[1][1], ekv[1][1])
    }

    testSetPlainBody() {
        const importer = new BaseImporter()

        const mockedImporter = new ClassMock(importer, '')
        const requestMock = new PawRequestMock()
        const body = 'simple body'

        importer._setPlainBody.apply(
            mockedImporter,
            [ requestMock, body ]
        )

        this.assertEqual(requestMock.body, body)
    }

    testSetJSONBody() {
        const importer = new BaseImporter()
        const body = {
            test: true
        }

        const requestMock = new PawRequestMock()

        importer._setJSONBody(requestMock, body)
        this.assertEqual(requestMock.jsonBody, body)
    }

    testSetSchemaBody() {
        const importer = new BaseImporter()
        const schemaRef = new SchemaReference()
        const mockedSchemaRef = new ClassMock(schemaRef, '')
        const requestMock = new PawRequestMock()

        mockedSchemaRef.spyOn('resolve', () => {
            return {
                toJS: () => { return 12 }
            }
        })
        const result = importer._setSchemaBody(requestMock, mockedSchemaRef, {
            schema: true
        })

        this.assertEqual(mockedSchemaRef.spy.resolve.count, 1)
        this.assertEqual(
            mockedSchemaRef.spy.resolve.calls,
            [ [ 1, { schema: true } ] ]
        )

        this.assertEqual(result.description, '### Schema ###\n\n12')
    }

    testSetUrlEncodedBody() {
        const importer = new BaseImporter()

        const mockedImporter = new ClassMock(importer, '')
        const requestMock = new PawRequestMock()
        const body = new Immutable.List([
            new KeyValue({
                key: 'test',
                value: 'value'
            }),
            new KeyValue({
                key: 'sec',
                value: 'ond'
            })
        ])

        mockedImporter.spyOn('_toDynamicString', (arg) => {
            return arg
        })
        const result = importer._setUrlEncodedBody.apply(
            mockedImporter,
            [ requestMock, body ]
        )

        this.assertEqual(mockedImporter.spy._toDynamicString.count, 4)
        this.assertEqual(
            mockedImporter.spy._toDynamicString.calls,
            [
                [ 'test', true, true ],
                [ 'value', true, true ],
                [ 'sec', true, true ],
                [ 'ond', true, true ]
            ]
        )

        this.assertEqual(
            result.body.components[0].keyValues,
            [ [ 'test', 'value', true ], [ 'sec', 'ond', true ] ]
        )
    }

    testSetBodyWithformDataBodyType() {
        const importer = new BaseImporter()

        const mockedImporter = new ClassMock(importer, '')
        const requestMock = new PawRequestMock()
        const body = 'dummy body'

        mockedImporter.spyOn('_setFormDataBody', () => {
            return 12
        })
        importer._setBody.apply(
            mockedImporter,
            [ requestMock, 'formData', body ]
        )

        this.assertEqual(mockedImporter.spy._setFormDataBody.count, 1)
        this.assertEqual(mockedImporter.spy._setFormDataBody.calls,
            [ [ requestMock, 'dummy body' ] ]
        )
    }

    testSetBodyWithurlEncodedBodyType() {
        const importer = new BaseImporter()

        const mockedImporter = new ClassMock(importer, '')
        const requestMock = new PawRequestMock()
        const body = 'dummy body'

        mockedImporter.spyOn('_setUrlEncodedBody', () => {
            return 12
        })
        importer._setBody.apply(
            mockedImporter,
            [ requestMock, 'urlEncoded', body ]
        )

        this.assertEqual(mockedImporter.spy._setUrlEncodedBody.count, 1)
        this.assertEqual(mockedImporter.spy._setUrlEncodedBody.calls,
            [ [ requestMock, 'dummy body' ] ]
        )
    }

    testSetBodyWithJSONBodyType() {
        const importer = new BaseImporter()

        const mockedImporter = new ClassMock(importer, '')
        const requestMock = new PawRequestMock()
        const body = 'dummy body'

        mockedImporter.spyOn('_setJSONBody', () => {
            return 12
        })
        importer._setBody.apply(
            mockedImporter,
            [ requestMock, 'json', body ]
        )

        this.assertEqual(mockedImporter.spy._setJSONBody.count, 1)
        this.assertEqual(mockedImporter.spy._setJSONBody.calls,
            [ [ requestMock, 'dummy body' ] ]
        )
    }

    testSetBodyWithPlainBodyType() {
        const importer = new BaseImporter()

        const mockedImporter = new ClassMock(importer, '')
        const requestMock = new PawRequestMock()
        const body = 'dummy body'

        mockedImporter.spyOn('_setPlainBody', () => {
            return 12
        })
        importer._setBody.apply(
            mockedImporter,
            [ requestMock, 'plain', body ]
        )

        this.assertEqual(mockedImporter.spy._setPlainBody.count, 1)
        this.assertEqual(mockedImporter.spy._setPlainBody.calls,
            [ [ requestMock, 'dummy body' ] ]
        )
    }

    testSetBodyWithFileBodyType() {
        const importer = new BaseImporter()

        const mockedImporter = new ClassMock(importer, '')
        const requestMock = new PawRequestMock()
        const body = 'dummy body'

        mockedImporter.spyOn('_setPlainBody', () => {
            return 12
        })
        importer._setBody.apply(
            mockedImporter,
            [ requestMock, 'file', body ]
        )

        this.assertEqual(mockedImporter.spy._setPlainBody.count, 1)
        this.assertEqual(mockedImporter.spy._setPlainBody.calls,
            [ [ requestMock, 'dummy body' ] ]
        )
    }

    testSetBodyWithSchemaBodyType() {
        const importer = new BaseImporter()

        const mockedImporter = new ClassMock(importer, '')
        const requestMock = new PawRequestMock()
        const body = 'dummy body'

        mockedImporter.spyOn('_setSchemaBody', () => {
            return 12
        })
        importer._setBody.apply(
            mockedImporter,
            [ requestMock, 'schema', body, { schema: true } ]
        )

        this.assertEqual(mockedImporter.spy._setSchemaBody.count, 1)
        this.assertEqual(mockedImporter.spy._setSchemaBody.calls,
            [ [ requestMock, 'dummy body', { schema: true } ] ]
        )
    }

    testExtractQueryParamsFromAuthWithNoAuth() {
        const importer = new BaseImporter()
        const auths = new Immutable.List()

        let result = importer._extractQueryParamsFromAuth(auths)

        this.assertEqual(result, [])
    }

    testExtractQueryParamsFromAuthWithIrrelevantAuth() {
        const importer = new BaseImporter()
        const auths = new Immutable.List([
            new BasicAuth()
        ])

        let result = importer._extractQueryParamsFromAuth(auths)

        this.assertEqual(result, [])
    }

    testExtractQueryParamsFromAuthWithRelevantAuthTypeButNotInQuery() {
        const importer = new BaseImporter()
        const auths = new Immutable.List([
            new ApiKeyAuth({
                in: 'header',
                name: 'api-key',
                key: 'not a real key'
            })
        ])

        let result = importer._extractQueryParamsFromAuth(auths)

        this.assertEqual(result, [])
    }

    testExtractQueryParamsFromAuthWithRelevantAuthTypeAndInQuery() {
        const importer = new BaseImporter()
        const auths = new Immutable.List([
            new ApiKeyAuth({
                in: 'query',
                name: 'api-key',
                key: 'not a real key'
            })
        ])

        let result = importer._extractQueryParamsFromAuth(auths)

        this.assertEqual(result, [
            new KeyValue({
                key: 'api-key',
                value: 'not a real key'
            })
        ])
    }

    testGenerateUrlWithSimpleUrl() {
        const importer = new BaseImporter()
        const mockedImporter = new ClassMock(importer, '')

        mockedImporter.spyOn('_toDynamicString', (string) => {
            return string
        })

        mockedImporter.spyOn('_extractQueryParamsFromAuth', () => {
            return []
        })

        const url = 'fakeurl.com/fake/path'

        const result = importer._generateUrl.apply(
            mockedImporter,
            [ url ]
        )

        this.assertEqual(url, result)
    }

    testGenerateUrlWithSimpleQueryParams() {
        const importer = new BaseImporter()
        const mockedImporter = new ClassMock(importer, '')

        mockedImporter.spyOn('_toDynamicString', (string) => {
            const dyn = new DynamicString(string)
            dyn.$$_spyOn('appendString', (str) => {
                dyn.components.push(str)
            })
            return dyn
        })

        mockedImporter.spyOn('_extractQueryParamsFromAuth', () => {
            return []
        })

        const url = 'fakeurl.com/fake/path'
        const queries = new Immutable.List([
            new KeyValue({
                key: 'test',
                value: 'new'
            })
        ])

        const result = importer._generateUrl.apply(
            mockedImporter,
            [ url, queries ]
        )

        const expected = new DynamicString(url, '?', 'test', '=', 'new')

        this.assertEqual(expected.components, result.components)
    }

    testGenerateUrlWithQueriesAndAuthParams() {
        const importer = new BaseImporter()
        const mockedImporter = new ClassMock(importer, '')

        mockedImporter.spyOn('_toDynamicString', (string) => {
            const dyn = new DynamicString(string)
            dyn.$$_spyOn('appendString', (str) => {
                dyn.components.push(str)
            })
            return dyn
        })

        mockedImporter.spyOn('_extractQueryParamsFromAuth', () => {
            return [
                new KeyValue({
                    key: 'api-key',
                    value: '123123123'
                })
            ]
        })

        const url = 'fakeurl.com/fake/path'
        const queries = new Immutable.List([
            new KeyValue({
                key: 'test',
                value: 'new'
            })
        ])
        const auths = new Immutable.List([
            new ApiKeyAuth({
                in: 'query',
                name: 'api-key',
                key: '123123123'
            })
        ])

        const result = importer._generateUrl.apply(
            mockedImporter,
            [ url, queries, auths ]
        )

        const expected = new DynamicString(
            url, '?', 'test', '=', 'new', '&', 'api-key', '=', '123123123'
        )

        this.assertEqual(expected.components, result.components)
    }

    testImportPawRequest() {
        const importer = new BaseImporter()

        const mockedImporter = new ClassMock(importer, '')
        const contextMock = new PawContextMock()
        const request = new Request({
            url: 'dummyURL',
            method: 'POST',
            headers: new Immutable.OrderedMap({
                fake: 'header'
            }),
            auth: new Immutable.List([
                new BasicAuth({
                    username: 'marmot'
                })
            ]),
            bodyType: 'plain',
            body: 'dummy body'
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
            this.assertEqual(headers, new Immutable.OrderedMap({
                fake: 'header'
            }))
            return {
                headers: {
                    fake: 'header'
                }
            }
        })

        mockedImporter.spyOn('_setAuth', (req, auth) => {
            this.assertEqual(
                auth, new Immutable.List([
                    new BasicAuth({
                        username: 'marmot'
                    })
                ])
            )
            return {}
        })

        mockedImporter.spyOn('_setBody', (req, bodyType, body, schema) => {
            this.assertEqual(
                bodyType, 'plain'
            )
            this.assertEqual(
                body, 'dummy body'
            )
            this.assertEqual(
                schema, { schema: true }
            )
            return {}
        })

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

    testApplyFuncOverGroupTree() {
        this.__loadTestSuite(
            'ApplyFuncOverGroupTree',
            '_applyFuncOverGroupTree'
        )
    }

    testImport() {
        const importer = new BaseImporter()

        const mockedImporter = new ClassMock(importer, '')
        const contextMock = new PawContextMock()
        const reqContext = new RequestContext()

        mockedImporter.spyOn('createRequestContexts', () => {
            return [
                {
                    context: reqContext,
                    items: []
                }
            ]
        })

        mockedImporter.spyOn('_importPawRequests', () => {})

        importer.import.apply(
            mockedImporter,
            [ contextMock, [ null ], null ]
        )

        this.assertEqual(mockedImporter.spy.createRequestContexts.count, 1)
        this.assertEqual(mockedImporter.spy.createRequestContexts.calls,
            [ [ contextMock, [ null ], null ] ]
        )

        this.assertEqual(mockedImporter.spy._importPawRequests.count, 1)
        /* eslint-disable no-undefined */
        this.assertEqual(mockedImporter.spy._importPawRequests.calls,
            [ [ reqContext, undefined, null ] ]
        )
        /* eslint-enable no-undefined */
    }

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
