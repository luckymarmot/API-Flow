import fs from 'fs'
import Immutable from 'immutable'

import {
    UnitTest,
    registerTest,
    against,
    targets
} from '../../../utils/TestUtils'
import { ClassMock } from '../../../mocks/PawMocks'

import PostmanParser from '../Parser'

import Auth from '../../../models/Auth'
import ReferenceContainer from '../../../models/references/Container'
import LateResolutionReference from '../../../models/references/LateResolution'

import Context, {
    Parameter,
    ParameterContainer
} from '../../../models/Core'
import Request from '../../../models/Request'

@registerTest
@against(PostmanParser)
export class TestPostmanParser extends UnitTest {
    // TODO write tests
    @targets('parse')
    testParseFailsOnInvalidJSON() {
        const parser = new PostmanParser()
        const mp = new ClassMock(parser, '')

        const input = '{ invalidJSON }'

        try {
            parser.parse.apply(
                mp,
                [ input ]
            )
            this.assertTrue(false)
        }
        catch (e) {
            this.assertTrue(true)
        }
    }

    @targets('parse')
    testParseFailsOnNonPostmanJSON() {
        const parser = new PostmanParser()
        const mp = new ClassMock(parser, '')

        const input = '{ validJSON: true, postmanObjects: false }'

        try {
            parser.parse.apply(
                mp,
                [ input ]
            )
            this.assertTrue(false)
        }
        catch (e) {
            this.assertTrue(true)
        }
    }

    @targets('parse')
    testParseCallsCreateContext() {
        const parser = new PostmanParser()
        const mp = new ClassMock(parser, '')

        const input = this.__loadPostmanFile('Backup', 'postman_dump')

        mp.spyOn('_createContext', (envs, colls) => {
            this.assertEqual(envs.length, 1)
            this.assertEqual(colls.length, 2)
            return 12
        })

        let result = parser.parse.apply(
            mp,
            [ input ]
        )

        this.assertEqual(result, 12)
    }

    @targets('_createContext')
    testCreateContextCallsImportEnvironment() {
        const parser = new PostmanParser()
        const mp = new ClassMock(parser, '')

        const envs = [ { env1: true }, { env2: true } ]
        const colls = []

        mp.spyOn('_importEnvironment', () => {
            return new ReferenceContainer({
                id: 12
            })
        })

        parser._createContext.apply(
            mp,
            [ envs, colls ]
        )

        this.assertEqual(
            mp.spy._importEnvironment.count, 2
        )

        this.assertEqual(
            mp.spy._importEnvironment.calls,
            [ [ { env1: true } ], [ { env2: true } ] ]
        )
    }

    @targets('_createContext')
    testCreateContextCallsImportCollection() {
        const parser = new PostmanParser()
        const mp = new ClassMock(parser, '')

        const envs = []
        const colls = [ { get: () => {} }, { get: () => {} } ]

        mp.spyOn('_importCollection', (obj) => {
            return obj
        })

        parser._createContext.apply(
            mp,
            [ envs, colls ]
        )

        this.assertEqual(
            mp.spy._importCollection.count, 2
        )

        this.assertEqual(
            mp.spy._importCollection.calls,
            [ [ colls[0] ], [ colls[1] ] ]
        )
    }

    @targets('_createContext')
    testCreateContextReturnsRequestContext() {
        const parser = new PostmanParser()
        const mp = new ClassMock(parser, '')

        const envs = [ { env1: true } ]
        const colls = [ { get: () => { return '12' } } ]

        mp.spyOn('_importEnvironment', () => {
            return new ReferenceContainer({
                id: '12'
            })
        })

        mp.spyOn('_importCollection', (obj) => {
            return obj
        })

        const result = parser._createContext.apply(
            mp,
            [ envs, colls ]
        )

        this.assertTrue(result instanceof Context)
        this.assertEqual(
            result.get('references'), new Immutable.OrderedMap({
                12: new ReferenceContainer({
                    id: '12'
                })
            })
        )
        this.assertEqual(
            result.getIn([ 'group', 'children', '12' ]), colls[0]
        )
    }

    @targets('_importEnvironment')
    testImportEnvironmentWithNoValues() {
        const parser = new PostmanParser()
        const mp = new ClassMock(parser, '')

        const env = {
            id: 'envId',
            name: 'envName'
        }

        const result = parser._importEnvironment.apply(
            mp,
            [ env ]
        )

        const expected = new ReferenceContainer({
            id: 'envId',
            name: 'envName'
        })

        this.assertEqual(result, expected)
    }

    @targets('_importEnvironment')
    testImportEnvironmentWithValues() {
        const parser = new PostmanParser()
        const mp = new ClassMock(parser, '')

        const env = {
            id: 'envId',
            name: 'envName',
            values: [
                {
                    key: 'variableKey',
                    value: 'variableValue'
                }
            ]
        }

        mp.spyOn('_referenceEnvironmentVariable', (val) => {
            return val
        })

        const result = parser._importEnvironment.apply(
            mp,
            [ env ]
        )

        let expected = new ReferenceContainer({
            id: 'envId',
            name: 'envName'
        })
        expected = expected.create(new Immutable.List([
            new LateResolutionReference({
                uri: '#/postman/{{variableKey}}',
                relative: '#/postman/{{variableKey}}',
                value: 'variableValue',
                resolved: true
            })
        ]))

        this.assertEqual(expected, result)
    }

    @targets('_importCollection')
    testImportCollectionThrowsIfNoRequestsInCollection() {
        const parser = new PostmanParser()
        const mp = new ClassMock(parser, '')

        const coll = {}

        try {
            parser._importCollection.apply(
                mp,
                [ coll ]
            )
            this.assertTrue(false)
        }
        catch (e) {
            this.assertTrue(true)
        }
    }

    @targets('_importCollection')
    testImportCollectionWithRequests() {
        const parser = new PostmanParser()
        const mp = new ClassMock(parser, '')

        const coll = {
            requests: [
                {}
            ]
        }

        mp.spyOn('_createRequest', () => {})
        mp.spyOn('_createGroupFromCollection', () => {
            return 12
        })

        const result = parser._importCollection.apply(
            mp,
            [ coll ]
        )

        this.assertEqual(result, 12)

        this.assertEqual(
            mp.spy._createRequest.count, 1
        )

        this.assertEqual(
            mp.spy._createRequest.calls[0],
            [ coll, coll.requests[0] ]
        )

        this.assertEqual(
            mp.spy._createGroupFromCollection.count, 1
        )
    }

    @targets('_referenceEnvironmentVariable')
    testReferenceEnvironmentVariableWithNoReference() {
        const parser = new PostmanParser()
        const mp = new ClassMock(parser, '')
        const input = 'dummy'

        const result = parser._referenceEnvironmentVariable.apply(
            mp,
            [ input ]
        )

        this.assertEqual(input, result)
    }

    @targets('_referenceEnvironmentVariable')
    testReferenceEnvironmentVariableWithNull() {
        const parser = new PostmanParser()
        const mp = new ClassMock(parser, '')
        const input = null

        const result = parser._referenceEnvironmentVariable.apply(
            mp,
            [ input ]
        )

        this.assertEqual(input, result)
    }

    @targets('_referenceEnvironmentVariable')
    testReferenceEnvironmentVariableWithUndefined() {
        const parser = new PostmanParser()
        const mp = new ClassMock(parser, '')

        const result = parser._referenceEnvironmentVariable.apply(
            mp,
            []
        )

        this.assertEqual(null, result)
    }

    @targets('_referenceEnvironmentVariable')
    testReferenceEnvironmentVariableWithSimpleReference() {
        const parser = new PostmanParser()
        const mp = new ClassMock(parser, '')
        const input = '{{simple}}'

        mp.references = new Immutable.List()

        const result = parser._referenceEnvironmentVariable.apply(
            mp,
            [ input ]
        )

        const expected = new LateResolutionReference({
            uri: '#/postman/{{simple}}',
            relative: '#/postman/{{simple}}',
            resolved: true
        })

        this.assertEqual(expected, result)
    }

    @targets('_referenceEnvironmentVariable')
    testReferenceEnvironmentVariableWithRichReference() {
        const parser = new PostmanParser()
        const mp = new ClassMock(parser, '')
        const input = 'notso{{simple}}'

        mp.references = new Immutable.List()

        const result = parser._referenceEnvironmentVariable.apply(
            mp,
            [ input ]
        )

        const expected = new LateResolutionReference({
            uri: '#/postman/notso{{simple}}',
            relative: '#/postman/notso{{simple}}',
            resolved: true
        })

        this.assertEqual(expected, result)
    }

    @targets('_referenceEnvironmentVariable')
    testReferenceEnvironmentVariableWithMultipleReferences() {
        const parser = new PostmanParser()
        const mp = new ClassMock(parser, '')
        const input = '{{not}}so{{simple}}?'

        mp.references = new Immutable.List()

        const result = parser._referenceEnvironmentVariable.apply(
            mp,
            [ input ]
        )

        const expected = new LateResolutionReference({
            uri: '#/postman/{{not}}so{{simple}}?',
            relative: '#/postman/{{not}}so{{simple}}?',
            resolved: true
        })

        this.assertEqual(expected, result)
    }

    @targets('_referenceEnvironmentVariable')
    testReferenceEnvironmentVariableWithNestedReferences() {
        const parser = new PostmanParser()
        const mp = new ClassMock(parser, '')
        const input = '{{not}}so{{{{simple}}}}?'

        mp.references = new Immutable.List()

        const result = parser._referenceEnvironmentVariable.apply(
            mp,
            [ input ]
        )

        const expected = new LateResolutionReference({
            uri: '#/postman/{{not}}so{{{{simple}}}}?',
            relative: '#/postman/{{not}}so{{{{simple}}}}?',
            resolved: true
        })

        this.assertEqual(expected, result)
    }

    @targets('_extractBasicAuth')
    testExtractBasicAuthWithHelpers() {
        const parser = new ClassMock(new PostmanParser(), '')

        parser.spyOn('_referenceEnvironmentVariable', (val) => {
            return val
        })

        let helpers = {
            username: 'username',
            password: 'password'
        }

        const expected = new Auth.Basic({
            username: 'username',
            password: 'password'
        })

        const result = parser._extractBasicAuth(null, helpers)

        this.assertEqual(expected, result)
    }

    @targets('_extractBasicAuth')
    testExtractBasicAuthWithNoHelpers() {
        const parser = new ClassMock(new PostmanParser(), '')

        parser.spyOn('_referenceEnvironmentVariable', (val) => {
            return val
        })

        let params = 'dXNlcjoicGFzcyI='

        const expected = new Auth.Basic({
            raw: 'dXNlcjoicGFzcyI='
        })

        const result = parser._extractBasicAuth(params)

        this.assertEqual(expected, result)
    }

    @targets('_extractDigestAuth')
    testExtractDigestAuthWithHelpers() {
        const parser = new ClassMock(new PostmanParser(), '')

        parser.spyOn('_referenceEnvironmentVariable', (val) => {
            return val
        })

        let helpers = {
            username: 'username',
            password: 'password'
        }

        const expected = new Auth.Digest({
            username: 'username',
            password: 'password'
        })

        const result = parser._extractDigestAuth(null, helpers)

        this.assertEqual(expected, result)
    }

    @targets('_extractDigestAuth')
    testExtractDigestAuthWithNoHelpers() {
        const parser = new ClassMock(new PostmanParser(), '')

        parser.spyOn('_referenceEnvironmentVariable', (val) => {
            return val
        })

        let params = `username="user", password='pass', this='garbage'`

        const expected = new Auth.Digest({
            username: 'user',
            password: 'pass'
        })

        const result = parser._extractDigestAuth(params)

        this.assertEqual(expected, result)
    }

    @targets('_extractAWSS4Auth')
    testExtractAWSS4AuthWithHelpers() {
        const parser = new ClassMock(new PostmanParser(), '')

        parser.spyOn('_referenceEnvironmentVariable', (val) => {
            return val
        })

        let helpers = {
            accessKey: 'key',
            secretKey: 'secret',
            region: 'region',
            service: 'service'
        }

        const expected = new Auth.AWSSig4({
            key: 'key',
            secret: 'secret',
            region: 'region',
            service: 'service'
        })

        const result = parser._extractAWSS4Auth(null, helpers)

        this.assertEqual(expected, result)
    }

    @targets('_extractAWSS4Auth')
    testExtractAWSS4AuthWithNoHelpers() {
        const parser = new ClassMock(new PostmanParser(), '')

        parser.spyOn('_referenceEnvironmentVariable', (val) => {
            return val
        })

        const expected = new Auth.AWSSig4()

        const result = parser._extractAWSS4Auth()

        this.assertEqual(expected, result)
    }

    @targets('_extractHawkAuth')
    testExtractHawkAuthWithHelpers() {
        const parser = new ClassMock(new PostmanParser(), '')

        parser.spyOn('_referenceEnvironmentVariable', (val) => {
            return val
        })

        let helpers = {
            algorithm: 'algorithm',
            hawk_key: 'key',
            hawk_id: 'id'

        }

        const expected = new Auth.Hawk({
            algorithm: 'algorithm',
            key: 'key',
            id: 'id'
        })

        const result = parser._extractHawkAuth(null, helpers)

        this.assertEqual(expected, result)
    }

    @targets('_extractHawkAuth')
    testExtractHawkAuthWithNoHelpers() {
        const parser = new ClassMock(new PostmanParser(), '')

        parser.spyOn('_referenceEnvironmentVariable', (val) => {
            return val
        })

        const expected = new Auth.Hawk()

        const result = parser._extractHawkAuth()

        this.assertEqual(expected, result)
    }

    @targets('_extractOAuth1')
    testExtractOAuth1WithNoHelpers() {
        const parser = new ClassMock(new PostmanParser(), '')

        parser.spyOn('_referenceEnvironmentVariable', (val) => {
            return val
        })

        const params =
            'oauth_consumer_key=";jkahfpi", ' +
            'oauth_signature_method="SHA1", ' +
            'oauth_timestamp="17987304390", ' +
            'oauth_nonce="1097908712", ' +
            'oauth_version="1", ' +
            'oauth_signature="pqwiofhqwpois"'

        const expected = new Auth.OAuth1({
            consumerKey: ';jkahfpi',
            algorithm: 'SHA1',
            timestamp: '17987304390',
            nonce: '1097908712',
            version: '1',
            signature: 'pqwiofhqwpois'
        })

        const result = parser._extractOAuth1(params)

        this.assertEqual(expected, result)
    }

    @targets('_extractAuth')
    testExtractAuthCallsBasicAuthBasedOnHelperType() {
        const parser = new ClassMock(new PostmanParser(), '')


        parser.spyOn('_extractBasicAuth', () => {
            return 12
        })

        const helperType = 'basicAuth'

        const expected = 12
        const result = parser._extractAuth('scheme content', helperType)

        this.assertEqual(expected, result)
    }

    @targets('_extractAuth')
    testExtractAuthCallsDigestAuthBasedOnHelperType() {
        const parser = new ClassMock(new PostmanParser(), '')


        parser.spyOn('_extractDigestAuth', () => {
            return 12
        })

        const helperType = 'digestAuth'

        const expected = 12
        const result = parser._extractAuth('scheme content', helperType)

        this.assertEqual(expected, result)
    }


    @targets('_extractAuth')
    testExtractAuthCallsAWSS4AuthBasedOnHelperType() {
        const parser = new ClassMock(new PostmanParser(), '')


        parser.spyOn('_extractAWSS4Auth', () => {
            return 12
        })

        const helperType = 'awsSigV4'

        const expected = 12
        const result = parser._extractAuth('scheme content', helperType)

        this.assertEqual(expected, result)
    }

    @targets('_extractAuth')
    testExtractAuthCallsHawkAuthBasedOnHelperType() {
        const parser = new ClassMock(new PostmanParser(), '')


        parser.spyOn('_extractHawkAuth', () => {
            return 12
        })

        const helperType = 'hawkAuth'

        const expected = 12
        const result = parser._extractAuth('scheme content', helperType)

        this.assertEqual(expected, result)
    }

    @targets('_extractAuth')
    testExtractAuthCallsBasicAuthBasedWithNoHelperType() {
        const parser = new ClassMock(new PostmanParser(), '')


        parser.spyOn('_extractBasicAuth', () => {
            return 12
        })

        const expected = 12
        const result = parser._extractAuth('Basic content')

        this.assertEqual(expected, result)
    }

    @targets('_extractAuth')
    testExtractAuthCallsDigestAuthBasedWithNoHelperType() {
        const parser = new ClassMock(new PostmanParser(), '')


        parser.spyOn('_extractDigestAuth', () => {
            return 12
        })

        const expected = 12
        const result = parser._extractAuth('Digest content')

        this.assertEqual(expected, result)
    }


    @targets('_extractAuth')
    testExtractAuthCallsAWSS4AuthBasedWithNoHelperType() {
        const parser = new ClassMock(new PostmanParser(), '')


        parser.spyOn('_extractAWSS4Auth', () => {
            return 12
        })

        const expected = 12
        const result = parser._extractAuth('AWS4-HMAC-SHA256 content')

        this.assertEqual(expected, result)
    }

    @targets('_extractAuth')
    testExtractAuthCallsHawkAuthBasedWithNoHelperType() {
        const parser = new ClassMock(new PostmanParser(), '')


        parser.spyOn('_extractHawkAuth', () => {
            return 12
        })

        const expected = 12
        const result = parser._extractAuth('Hawk content')

        this.assertEqual(expected, result)
    }

    @targets('_extractAuth')
    testExtractAuthCallsOAuth1BasedWithNoHelperType() {
        const parser = new ClassMock(new PostmanParser(), '')


        parser.spyOn('_extractOAuth1', () => {
            return 12
        })

        const expected = 12
        const result = parser._extractAuth('OAuth content')

        this.assertEqual(expected, result)
    }

    @targets('_createRequest')
    testCreateRequestCallsExtractParameters() {
        const parser = new ClassMock(new PostmanParser(), '')

        parser.spyOn('_extractParameters', () => {
            return [ 12, 42, 90 ]
        })

        const req = {
            id: 65,
            name: 1242,
            description: 'desc',
            method: 'get'
        }

        parser._createRequest(null, req)

        this.assertEqual(parser.spy._extractParameters.count, 1)
    }

    @targets('_createRequest')
    testCreateRequestReturnsARequest() {
        const parser = new ClassMock(new PostmanParser(), '')

        parser.spyOn('_extractParameters', () => {
            return [ 12, 42, 90 ]
        })

        const req = {
            id: 65,
            name: 1242,
            description: 'desc',
            method: 'get'
        }

        const expected = new Request({
            id: 65,
            name: 1242,
            description: 'desc',
            method: 'get',
            url: 42,
            parameters: 12,
            auths: 90
        })

        const result = parser._createRequest(null, req)

        this.assertEqual(expected, result)
    }

    @targets('_extractParameters')
    testExtractParametersCallsExtractHeaders() {
        const parser = new ClassMock(new PostmanParser(), '')

        parser.spyOn('_extractHeaders', () => {
            return [ 12, 90 ]
        })

        parser.spyOn('_extractQueriesFromUrl', () => {
            return [ 42, 65 ]
        })

        parser.spyOn('_extractBodyParams', () => {
            return [ 36, 12 ]
        })

        const req = {
            url: 'some.url'
        }

        parser._extractParameters(req)

        this.assertEqual(parser.spy._extractHeaders.count, 1)
    }

    @targets('_extractParameters')
    testExtractParametersCallsExtractQueriesFomUrl() {
        const parser = new ClassMock(new PostmanParser(), '')

        parser.spyOn('_extractHeaders', () => {
            return [ 12, 90 ]
        })

        parser.spyOn('_extractQueriesFromUrl', () => {
            return [ 42, 65 ]
        })

        parser.spyOn('_extractBodyParams', () => {
            return [ 36, 12 ]
        })

        const req = {
            url: 'some.url'
        }

        parser._extractParameters(req)

        this.assertEqual(parser.spy._extractQueriesFromUrl.count, 1)
    }

    @targets('_extractParameters')
    testExtractParametersCallsExtractBodyParams() {
        const parser = new ClassMock(new PostmanParser(), '')

        parser.spyOn('_extractHeaders', () => {
            return [ 12, 90 ]
        })

        parser.spyOn('_extractQueriesFromUrl', () => {
            return [ 42, 65 ]
        })

        parser.spyOn('_extractBodyParams', () => {
            return [ 36, 12 ]
        })

        const req = {
            url: 'some.url'
        }

        parser._extractParameters(req)

        this.assertEqual(parser.spy._extractBodyParams.count, 1)
    }

    @targets('_extractParameters')
    testExtractParametersReturnsAParameterContainer() {
        const parser = new ClassMock(new PostmanParser(), '')

        parser.spyOn('_extractHeaders', () => {
            return [ 125, 90 ]
        })

        parser.spyOn('_extractQueriesFromUrl', () => {
            return [ 42, 65 ]
        })

        parser.spyOn('_extractBodyParams', () => {
            return [ 36, 12 ]
        })

        const req = {
            url: 'some.url'
        }

        const expected = [
            new ParameterContainer({
                queries: 65,
                headers: 12,
                body: 36
            }),
            42,
            90
        ]

        const result = parser._extractParameters(req)

        this.assertEqual(expected, result)
    }

    @targets('_extractHeaders')
    testExtractHeadersCallsExtractParam() {
        const parser = new ClassMock(new PostmanParser(), '')

        parser.spyOn('_referenceEnvironmentVariable', (val) => {
            return val
        })

        parser.spyOn('_extractParam', (k, v) => {
            return new Parameter({
                key: k,
                value: v
            })
        })

        const req = {
            headers:
                'Content-Type: application/json\n' +
                'Special-Header: toto\n'
        }

        parser._extractHeaders(req)

        this.assertEqual(parser.spy._extractParam.count, 2)
    }

    @targets('_extractHeaders')
    testExtractHeadersCallsExtractAuthIfAuthorizationHeader() {
        const parser = new ClassMock(new PostmanParser(), '')

        parser.spyOn('_referenceEnvironmentVariable', (val) => {
            return val
        })

        parser.spyOn('_extractParam', (k, v) => {
            return new Parameter({
                key: k,
                value: v
            })
        })

        parser.spyOn('_extractAuth', () => {
            return null
        })

        const req = {
            headers:
                'Content-Type: application/json\n' +
                'Special-Header: toto\n' +
                'Authorization: Basic dXNlcjoicGFzcyI=\n'
        }

        parser._extractHeaders(req)

        this.assertEqual(parser.spy._extractAuth.count, 1)
    }

    @targets('_extractHeaders')
    testExtractHeadersCallsExtractParamOnlyForNonAuthParams() {
        const parser = new ClassMock(new PostmanParser(), '')

        parser.spyOn('_referenceEnvironmentVariable', (val) => {
            return val
        })

        parser.spyOn('_extractParam', (k, v) => {
            return new Parameter({
                key: k,
                value: v
            })
        })

        parser.spyOn('_extractAuth', () => {
            return null
        })

        const req = {
            headers:
                'Content-Type: application/json\n' +
                'Special-Header: toto\n' +
                'Authorization: Basic dXNlcjoicGFzcyI=\n'
        }

        parser._extractHeaders(req)

        this.assertEqual(parser.spy._extractParam.count, 2)
    }

    @targets('_extractHeaders')
    testExtractHeadersReturnsExpectedContent() {
        const parser = new ClassMock(new PostmanParser(), '')

        parser.spyOn('_referenceEnvironmentVariable', (val) => {
            return val
        })

        parser.spyOn('_extractParam', (k, v) => {
            return new Parameter({
                key: k,
                value: v
            })
        })

        const req = {
            headers:
                'Content-Type: application/json\n' +
                'Special-Header: toto\n'
        }

        const expected = [
            new Immutable.List([
                new Parameter({
                    key: 'Content-Type',
                    value: 'application/json'
                }),
                new Parameter({
                    key: 'Special-Header',
                    value: 'toto'
                })
            ]),
            new Immutable.List()
        ]

        const result = parser._extractHeaders(req)

        this.assertEqual(expected, result)
    }

    testExtractQueryFromUrlWithSimpleUrl() {
        const parser = new ClassMock(new PostmanParser(), '')

        parser.spyOn('_referenceEnvironmentVariable', (val) => {
            return val
        })

        const url = 'http://simple.url.com/path/to/req'

        const expected = [
            new URL()
        ]
    }

    __loadPostmanFile(fileName, extension = 'json') {
        const path = __dirname + '/samples/' + fileName + '.' + extension
        return fs.readFileSync(path).toString()
    }
}
