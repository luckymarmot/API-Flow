import fs from 'fs'
import Immutable from 'immutable'

import {
    UnitTest,
    registerTest,
    against,
    targets
} from '../../../../utils/TestUtils'
import { ClassMock } from '../../../../mocks/PawMocks'

import PostmanParser from '../Parser'

import Constraint from '../../../../models/Constraint'
import URL from '../../../../models/URL'
import Auth from '../../../../models/Auth'
import ReferenceContainer from '../../../../models/references/Container'
import
    LateResolutionReference
from '../../../../models/references/LateResolution'
import Group from '../../../../models/Group'

import Context, {
    Parameter,
    ParameterContainer
} from '../../../../models/Core'
import Request from '../../../../models/Request'

@registerTest
@against(PostmanParser)
export class TestPostmanParser extends UnitTest {
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
                uri: '#/x-postman/{{variableKey}}',
                relative: '#/x-postman/{{variableKey}}',
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
            uri: '#/x-postman/{{simple}}',
            relative: '#/x-postman/{{simple}}',
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
            uri: '#/x-postman/notso{{simple}}',
            relative: '#/x-postman/notso{{simple}}',
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
            uri: '#/x-postman/{{not}}so{{simple}}?',
            relative: '#/x-postman/{{not}}so{{simple}}?',
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
            uri: '#/x-postman/{{not}}so{{{{simple}}}}?',
            relative: '#/x-postman/{{not}}so{{{{simple}}}}?',
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

        /* eslint-disable quotes */
        let params = `username="user", password='pass', this='garbage'`
        /* eslint-enable quotes */

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

        parser.spyOn('_extractParamsFromUrl', () => {
            return [ 42, 36, 65 ]
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

        parser.spyOn('_extractParamsFromUrl', () => {
            return [ 42, 36, 65 ]
        })

        parser.spyOn('_extractBodyParams', () => {
            return [ 36, 12 ]
        })

        const req = {
            url: 'some.url'
        }

        parser._extractParameters(req)

        this.assertEqual(parser.spy._extractParamsFromUrl.count, 1)
    }

    @targets('_extractParameters')
    testExtractParametersCallsExtractBodyParams() {
        const parser = new ClassMock(new PostmanParser(), '')

        parser.spyOn('_extractHeaders', () => {
            return [ 12, 90 ]
        })

        parser.spyOn('_extractParamsFromUrl', () => {
            return [ 42, 36, 65 ]
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

        parser.spyOn('_extractParamsFromUrl', () => {
            return [ 42, 72, 65 ]
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
                body: 36,
                path: 72
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

    @targets('_extractParamsFromUrl')
    testExtractQueryFromUrlWithSimpleUrlCallsExtractParam() {
        const parser = new ClassMock(new PostmanParser(), '')

        parser.spyOn('_extractParam', () => {
            return new Parameter()
        })

        const url = 'http://simple.url.com/path/to/req'

        parser._extractParamsFromUrl(url)

        this.assertEqual(parser.spy._extractParam.count, 3)
    }

    @targets('_extractParamsFromUrl')
    testExtractQueryFromUrlWithSimpleUrl() {
        const parser = new ClassMock(new PostmanParser(), '')

        parser.spyOn('_referenceEnvironmentVariable', (val) => {
            return val
        })

        const url = 'http://simple.url.com/path/to/req'

        const expected = [
            new URL({
                // inherited from new URL('url')
                hostname: new Parameter({
                    key: 'hostname',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([ 'simple.url.com' ])
                    ])
                }),
                // updated by extractQueryFromUrl
                protocol: new Parameter({
                    key: 'protocol',
                    name: 'protocol',
                    value: 'http',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([ 'http' ])
                    ])
                }),
                host: new Parameter({
                    key: 'host',
                    name: 'host',
                    value: 'simple.url.com',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([ 'simple.url.com' ])
                    ])
                }),
                pathname: new Parameter({
                    key: 'pathname',
                    name: 'pathname',
                    value: '/path/to/req',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([ '/path/to/req' ])
                    ])
                })
            }),
            new Immutable.List(),
            new Immutable.List()
        ]

        const result = parser._extractParamsFromUrl(url)

        this.assertJSONEqual(expected, result)
    }

    @targets('_extractParamsFromUrl')
    testExtractQueryFromUrlWithRichUrl() {
        const parser = new ClassMock(new PostmanParser(), '')

        const url = 'http://{{sub}}.url.{{extension}}/users/{{userID}}'

        const expected = [
            new URL({
                // inherited from new URL('url')
                hostname: new Parameter({
                    key: 'hostname',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([ '{{sub}}.url.{{extension}}' ])
                    ])
                }),
                // updated by extractQueryFromUrl
                protocol: new Parameter({
                    key: 'protocol',
                    name: 'protocol',
                    value: 'http',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([ 'http' ])
                    ])
                }),
                host: new Parameter({
                    key: 'host',
                    name: 'host',
                    value: new LateResolutionReference({
                        uri: '#/x-postman/{{sub}}.url.{{extension}}',
                        relative: '#/x-postman/{{sub}}.url.{{extension}}',
                        resolved: true
                    }),
                    type: 'reference'
                }),
                pathname: new Parameter({
                    key: 'pathname',
                    name: 'pathname',
                    value: new LateResolutionReference({
                        uri: '#/x-postman/~1users~1{{userID}}',
                        relative: '#/x-postman/~1users~1{{userID}}',
                        resolved: true
                    }),
                    type: 'reference'
                })
            }),
            new Immutable.List([
                new Parameter({
                    key: 'userID',
                    name: 'userID',
                    value: new LateResolutionReference({
                        uri: '#/x-postman/{{userID}}',
                        relative: '#/x-postman/{{userID}}',
                        resolved: true
                    }),
                    type: 'reference'
                })
            ]),
            new Immutable.List()
        ]

        parser.references = new Immutable.List()
        const result = parser._extractParamsFromUrl(url)

        this.assertJSONEqual(expected, result)
    }

    @targets('_extractParamsFromUrl')
    testExtractQueryFromUrlWithSimpleUrlAndQueryCallsExtractQueryComponent() {
        const parser = new ClassMock(new PostmanParser(), '')

        parser.spyOn('_extractQueryFromComponent', () => {
            return new Parameter()
        })

        const url =
            'http://simple.url.com/path/to/req' +
            '?userId=2&songId={{songId}}'

        parser.references = new Immutable.List()
        parser._extractParamsFromUrl(url)

        this.assertEqual(parser.spy._extractQueryFromComponent.count, 2)
    }

    @targets('_extractParamsFromUrl')
    testExtractQueryFromUrlWithSimpleUrlAndQuery() {
        const parser = new ClassMock(new PostmanParser(), '')

        const url =
            'http://simple.url.com/path/to/req' +
            '?userId=2&songId={{songId}}'

        const expected = [
            new URL({
                // inherited from new URL('url')
                hostname: new Parameter({
                    key: 'hostname',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([ 'simple.url.com' ])
                    ])
                }),
                search: new Parameter({
                    key: 'search',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([ '?userId=2&songId={{songId}}' ])
                    ])
                }),
                // updated by extractQueryFromUrl
                protocol: new Parameter({
                    key: 'protocol',
                    name: 'protocol',
                    value: 'http',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([ 'http' ])
                    ])
                }),
                host: new Parameter({
                    key: 'host',
                    name: 'host',
                    value: 'simple.url.com',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([ 'simple.url.com' ])
                    ])
                }),
                pathname: new Parameter({
                    key: 'pathname',
                    name: 'pathname',
                    value: '/path/to/req',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([ '/path/to/req' ])
                    ])
                })
            }),
            new Immutable.List(),
            new Immutable.List([
                new Parameter({
                    key: 'userId',
                    name: 'userId',
                    value: '2',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([ '2' ])
                    ])
                }),
                new Parameter({
                    key: 'songId',
                    name: 'songId',
                    value: new LateResolutionReference({
                        uri: '#/x-postman/{{songId}}',
                        relative: '#/x-postman/{{songId}}',
                        resolved: true
                    }),
                    type: 'reference'
                })
            ])
        ]

        parser.references = new Immutable.List()
        const result = parser._extractParamsFromUrl(url)

        this.assertJSONEqual(expected, result)
    }

    @targets('_extractParamsFromUrl')
    testExtractQueryFromUrlWithSimpleUrlAndPathParams() {
        const parser = new ClassMock(new PostmanParser(), '')

        const url =
            'http://simple.url.com/path/to/{{req}}'

        const expected = [
            new URL({
                // inherited from new URL('url')
                hostname: new Parameter({
                    key: 'hostname',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([ 'simple.url.com' ])
                    ])
                }),
                // updated by extractQueryFromUrl
                protocol: new Parameter({
                    key: 'protocol',
                    name: 'protocol',
                    value: 'http',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([ 'http' ])
                    ])
                }),
                host: new Parameter({
                    key: 'host',
                    name: 'host',
                    value: 'simple.url.com',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([ 'simple.url.com' ])
                    ])
                }),
                pathname: new Parameter({
                    key: 'pathname',
                    name: 'pathname',
                    value: new LateResolutionReference({
                        uri: '#/x-postman/~1path~1to~1{{req}}',
                        relative: '#/x-postman/~1path~1to~1{{req}}',
                        resolved: true
                    }),
                    type: 'reference'
                })
            }),
            new Immutable.List([
                new Parameter({
                    key: 'req',
                    name: 'req',
                    value: new LateResolutionReference({
                        uri: '#/x-postman/{{req}}',
                        relative: '#/x-postman/{{req}}',
                        resolved: true
                    }),
                    type: 'reference'
                })
            ]),
            new Immutable.List()
        ]

        parser.references = new Immutable.List()
        const result = parser._extractParamsFromUrl(url)

        this.assertJSONEqual(expected, result)
    }

    @targets('_escapeURIFragment')
    testEscapeURIFragment() {
        const parser = new ClassMock(new PostmanParser(), '')

        const fragment = '/some/complex~fragment~'

        const expected = '~1some~1complex~0fragment~0'

        const result = parser._escapeURIFragment(fragment)

        this.assertEqual(expected, result)
    }

    @targets('_unescapeURIFragment')
    testUnescapeURIFragment() {
        const parser = new ClassMock(new PostmanParser(), '')

        const fragment = '~1some~1complex~0fragment~0'

        const expected = '/some/complex~fragment~'

        const result = parser._unescapeURIFragment(fragment)

        this.assertEqual(expected, result)
    }

    @targets('_extractQueryFromComponent')
    testExtractQueryFromComponentCallsExtractParam() {
        const parser = new ClassMock(new PostmanParser(), '')

        parser._extractQueryFromComponent('key=value')

        this.assertEqual(parser.spy._extractParam.count, 1)
    }

    @targets('_extractQueryFromComponent')
    testExtractQueryFromComponentDecodesURIComponent() {
        const parser = new ClassMock(new PostmanParser(), '')

        parser._extractQueryFromComponent('key%20with%20spaces=spaced%20value')

        this.assertEqual(parser.spy._extractParam.count, 1)
        this.assertEqual(
            parser.spy._extractParam.calls[0],
            [ 'key with spaces', 'spaced value' ]
        )
    }

    @targets('_extractQueryFromComponent')
    testExtractQueryFromComponentPassesNullIFNoValueSet() {
        const parser = new ClassMock(new PostmanParser(), '')

        parser._extractQueryFromComponent('key%20with%20spaces')

        this.assertEqual(parser.spy._extractParam.count, 1)
        this.assertEqual(
            parser.spy._extractParam.calls[0],
            [ 'key with spaces', null ]
        )
    }

    @targets('_extractQueryFromComponent')
    testExtractQueryFromComponentPassesEmptyStringIFEqualSignIsSet() {
        const parser = new ClassMock(new PostmanParser(), '')

        parser._extractQueryFromComponent('key%20with%20spaces=')

        this.assertEqual(parser.spy._extractParam.count, 1)
        this.assertEqual(
            parser.spy._extractParam.calls[0],
            [ 'key with spaces', '' ]
        )
    }

    @targets('_extractParam')
    testExtractParamWithSimpleParamCallsReferenceEnvironmentVariable() {
        const parser = new ClassMock(new PostmanParser(), '')

        parser._extractParam('key', 'value')

        this.assertEqual(parser.spy._referenceEnvironmentVariable.count, 2)
        this.assertEqual(
            parser.spy._referenceEnvironmentVariable.calls,
            [ [ 'key' ], [ 'value' ] ]
        )
    }

    @targets('_extractParam')
    testExtractParamWithSimpleParamReturnsExpectedParam() {
        const parser = new ClassMock(new PostmanParser(), '')

        const expected = new Parameter({
            key: 'key',
            name: 'key',
            value: 'value',
            type: 'string',
            internals: new Immutable.List([
                new Constraint.Enum([ 'value' ])
            ])
        })

        const result = parser._extractParam('key', 'value')

        this.assertJSONEqual(expected, result)
    }

    @targets('_extractParam')
    testExtractParamWithReferenceParamReturnsExpectedParam() {
        const parser = new ClassMock(new PostmanParser(), '')

        const expected = new Parameter({
            key: 'key',
            name: 'key',
            value: new LateResolutionReference({
                uri: '#/x-postman/{{userId}}',
                relative: '#/x-postman/{{userId}}',
                resolved: true
            }),
            type: 'reference'
        })

        parser.references = new Immutable.List()
        const result = parser._extractParam('key', '{{userId}}')

        this.assertJSONEqual(expected, result)
    }

    @targets('_extractBodyParams')
    testExtractBodyParamsWithRawDataMode() {
        const parser = new ClassMock(new PostmanParser(), '')

        parser.spyOn('_extractParam', () => {
            return new Parameter()
        })

        const req = {
            dataMode: 'raw',
            data: 'some content'
        }

        const headers = new Immutable.List()

        const expected = [
            new Immutable.List([ new Parameter() ]),
            new Immutable.List()
        ]

        const result = parser._extractBodyParams(req, headers)

        this.assertEqual(expected, result)
    }

    @targets('_extractBodyParams')
    testExtractBodyParamsWithUrlencodedDataMode() {
        const parser = new ClassMock(new PostmanParser(), '')

        parser.spyOn('_extractParam', () => {
            return new Parameter()
        })

        const req = {
            dataMode: 'urlencoded',
            data: [
                {
                    key: 'code',
                    value: 'xWnkliVQJURqB2x1'
                },
                {
                    key: 'grant_type',
                    value: 'authorization_code'
                }
            ]
        }

        const headers = new Immutable.List()

        const expected = [
            new Immutable.List([
                new Parameter({
                    externals: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'application/x-www-form-urlencoded'
                                ])
                            ])
                        })
                    ])
                }),
                new Parameter({
                    externals: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'application/x-www-form-urlencoded'
                                ])
                            ])
                        })
                    ])
                })
            ]),
            new Immutable.List([
                new Parameter()
            ])
        ]

        const result = parser._extractBodyParams(req, headers)

        this.assertJSONEqual(expected, result)
    }

    @targets('_extractBodyParams')
    testExtractBodyParamsWithUrlEncodedDataModeCallsExtractContentType() {
        const parser = new ClassMock(new PostmanParser(), '')

        parser.spyOn('_extractParam', () => {
            return new Parameter()
        })

        const req = {
            dataMode: 'urlencoded',
            data: [
                {
                    key: 'code',
                    value: 'xWnkliVQJURqB2x1'
                },
                {
                    key: 'grant_type',
                    value: 'authorization_code'
                }
            ]
        }

        const headers = new Immutable.List()

        parser._extractBodyParams(req, headers)

        this.assertEqual(parser.spy._extractContentType.count, 1)
    }

    @targets('_extractBodyParams')
    testExtractBodyParamsWithUrlEncodedDataModeAddsHeaderIfNoContentTypeOnly() {
        const parser = new ClassMock(new PostmanParser(), '')

        parser.spyOn('_extractParam', () => {
            return new Parameter()
        })

        parser.spyOn('_extractContentType', () => {
            return 'application/json'
        })

        const req = {
            dataMode: 'urlencoded',
            data: [
                {
                    key: 'code',
                    value: 'xWnkliVQJURqB2x1'
                },
                {
                    key: 'grant_type',
                    value: 'authorization_code'
                }
            ]
        }

        const headers = new Immutable.List()

        const expected = [
            new Immutable.List([
                new Parameter({
                    externals: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'application/json'
                                ])
                            ])
                        })
                    ])
                }),
                new Parameter({
                    externals: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'application/json'
                                ])
                            ])
                        })
                    ])
                })
            ]),
            new Immutable.List([])
        ]

        const result = parser._extractBodyParams(req, headers)

        this.assertJSONEqual(expected, result)
    }

    @targets('_extractBodyParams')
    testExtractBodyParamsWithParamsDataMode() {
        const parser = new ClassMock(new PostmanParser(), '')

        parser.spyOn('_extractParam', () => {
            return new Parameter()
        })

        const req = {
            dataMode: 'params',
            data: [
                {
                    key: 'code',
                    value: 'xWnkliVQJURqB2x1'
                },
                {
                    key: 'grant_type',
                    value: 'authorization_code'
                }
            ]
        }

        const headers = new Immutable.List()

        const expected = [
            new Immutable.List([
                new Parameter({
                    externals: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'multipart/form-data'
                                ])
                            ])
                        })
                    ])
                }),
                new Parameter({
                    externals: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'multipart/form-data'
                                ])
                            ])
                        })
                    ])
                })
            ]),
            new Immutable.List([
                new Parameter()
            ])
        ]

        const result = parser._extractBodyParams(req, headers)

        this.assertJSONEqual(expected, result)
    }

    @targets('_extractBodyParams')
    testExtractBodyParamsWithParamsDataModeCallsExtractContentType() {
        const parser = new ClassMock(new PostmanParser(), '')

        parser.spyOn('_extractParam', () => {
            return new Parameter()
        })

        const req = {
            dataMode: 'params',
            data: [
                {
                    key: 'code',
                    value: 'xWnkliVQJURqB2x1'
                },
                {
                    key: 'grant_type',
                    value: 'authorization_code'
                }
            ]
        }

        const headers = new Immutable.List()

        parser._extractBodyParams(req, headers)

        this.assertEqual(parser.spy._extractContentType.count, 1)
    }

    @targets('_extractBodyParams')
    testExtractBodyParamsWithUrlEncodedDataModeAddsHeaderIfNoContentTypeOnly() {
        const parser = new ClassMock(new PostmanParser(), '')

        parser.spyOn('_extractParam', () => {
            return new Parameter()
        })

        parser.spyOn('_extractContentType', () => {
            return 'application/json'
        })

        const req = {
            dataMode: 'urlencoded',
            data: [
                {
                    key: 'code',
                    value: 'xWnkliVQJURqB2x1'
                },
                {
                    key: 'grant_type',
                    value: 'authorization_code'
                }
            ]
        }

        const headers = new Immutable.List()

        const expected = [
            new Immutable.List([
                new Parameter({
                    externals: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'application/json'
                                ])
                            ])
                        })
                    ])
                }),
                new Parameter({
                    externals: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'application/json'
                                ])
                            ])
                        })
                    ])
                })
            ]),
            new Immutable.List([])
        ]

        const result = parser._extractBodyParams(req, headers)

        this.assertJSONEqual(expected, result)
    }

    @targets('_extractContentType')
    testExtractContentTypeWithNoContentType() {
        const parser = new ClassMock(new PostmanParser(), '')

        const headers = new Immutable.List([
            new Parameter({
                key: 'api-key',
                value: 12
            })
        ])

        const expected = null

        const result = parser._extractContentType(headers)

        this.assertEqual(expected, result)
    }

    @targets('_extractContentType')
    testExtractContentTypeWithContentType() {
        const parser = new ClassMock(new PostmanParser(), '')

        const headers = new Immutable.List([
            new Parameter({
                key: 'api-key',
                value: 12
            }),
            new Parameter({
                key: 'Content-Type',
                value: 'application/json',
                type: 'string'
            })
        ])

        const expected = 'application/json'

        const result = parser._extractContentType(headers)

        this.assertEqual(expected, result)
    }

    @targets('_putRequestsInGroup')
    testPutRequestsInGroupPutsAllIdsInGroup() {
        const parser = new ClassMock(new PostmanParser(), '')

        const group = new Group({
            name: 'hello'
        })

        const ids = [ 0, 1 ]

        const requests = {
            0: new Request({
                id: 0,
                method: 'get'
            }),
            1: new Request({
                id: 1,
                method: 'post'
            })
        }

        const expected = new Group({
            name: 'hello',
            children: new Immutable.OrderedMap({
                0: new Request({
                    id: 0,
                    method: 'get'
                }),
                1: new Request({
                    id: 1,
                    method: 'post'
                })
            })
        })

        const result = parser._putRequestsInGroup(group, ids, requests)

        this.assertJSONEqual(expected, result)
    }

    @targets('_putRequestsInGroup')
    testPutRequestsInGroupPutsOnlyIdsInGroup() {
        const parser = new ClassMock(new PostmanParser(), '')

        const group = new Group({
            name: 'hello'
        })

        const ids = [ 0 ]

        const requests = {
            0: new Request({
                id: 0,
                method: 'get'
            }),
            1: new Request({
                id: 1,
                method: 'post'
            })
        }

        const expected = new Group({
            name: 'hello',
            children: new Immutable.OrderedMap({
                0: new Request({
                    id: 0,
                    method: 'get'
                })
            })
        })

        const result = parser._putRequestsInGroup(group, ids, requests)

        this.assertJSONEqual(expected, result)
    }

    @targets('_putRequestsInGroup')
    testPutRequestsInGroupIgnoresMissingIds() {
        const parser = new ClassMock(new PostmanParser(), '')

        const group = new Group({
            name: 'hello'
        })

        const ids = [ 0, 2 ]

        const requests = {
            0: new Request({
                id: 0,
                method: 'get'
            }),
            1: new Request({
                id: 1,
                method: 'post'
            })
        }

        const expected = new Group({
            name: 'hello',
            children: new Immutable.OrderedMap({
                0: new Request({
                    id: 0,
                    method: 'get'
                })
            })
        })

        const result = parser._putRequestsInGroup(group, ids, requests)

        this.assertJSONEqual(expected, result)
    }

    @targets('_createGroupFromCollection')
    testCreateGroupFromCollectionWithoutFoldersOrOrder() {
        const parser = new ClassMock(new PostmanParser(), '')

        const collection = {
            id: 0,
            name: 'collection name'
        }

        const requests = {
            0: new Request({
                id: 0,
                method: 'get'
            }),
            1: new Request({
                id: 1,
                method: 'post'
            })
        }

        const expected = new Group({
            id: 0,
            name: 'collection name',
            children: new Immutable.OrderedMap({
                0: new Request({
                    id: 0,
                    method: 'get'
                }),
                1: new Request({
                    id: 1,
                    method: 'post'
                })
            })
        })

        const result = parser._createGroupFromCollection(collection, requests)

        this.assertJSONEqual(expected, result)
    }

    @targets('_createGroupFromCollection')
    testCreateGroupFromCollectionWithOrder() {
        const parser = new ClassMock(new PostmanParser(), '')

        const collection = {
            id: 0,
            name: 'collection name',
            order: [ 1, 0 ]
        }

        const requests = {
            0: new Request({
                id: 0,
                method: 'get'
            }),
            1: new Request({
                id: 1,
                method: 'post'
            })
        }

        const expected = new Group({
            id: 0,
            name: 'collection name',
            children: new Immutable.OrderedMap({
                1: new Request({
                    id: 1,
                    method: 'post'
                }),
                0: new Request({
                    id: 0,
                    method: 'get'
                })
            })
        })

        const result = parser._createGroupFromCollection(collection, requests)

        this.assertJSONEqual(expected, result)
    }

    @targets('_createGroupFromCollection')
    testCreateGroupFromCollectionWithFolders() {
        const parser = new ClassMock(new PostmanParser(), '')

        const collection = {
            id: 0,
            name: 'collection name',
            folders: [
                {
                    id: 12,
                    name: 'folder #12',
                    order: [ 0 ]
                },
                {
                    id: 42,
                    name: 'folder #42',
                    order: [ 1 ]
                }
            ]
        }

        const requests = {
            0: new Request({
                id: 0,
                method: 'get'
            }),
            1: new Request({
                id: 1,
                method: 'post'
            })
        }

        const expected = new Group({
            id: 0,
            name: 'collection name',
            children: new Immutable.OrderedMap({
                12: new Group({
                    id: 12,
                    name: 'folder #12',
                    children: new Immutable.OrderedMap({
                        0: new Request({
                            id: 0,
                            method: 'get'
                        })
                    })
                }),
                42: new Group({
                    id: 42,
                    name: 'folder #42',
                    children: new Immutable.OrderedMap({
                        1: new Request({
                            id: 1,
                            method: 'post'
                        })
                    })
                })
            })
        })

        const result = parser._createGroupFromCollection(collection, requests)

        this.assertJSONEqual(expected, result)
    }

    @targets('_replacePathVariables')
    testReplacePathVariables() {
        const parser = new ClassMock(new PostmanParser())

        let path = '/teams/:teamId/users/:userId/songs/:songId/create'
        let vars = {
            userId: 123,
            songId: 42
        }

        let expected = '/teams/:teamId/users/123/songs/42/create'

        let result = parser._replacePathVariables(path, vars)

        this.assertEqual(expected, result)
    }

    @targets('detect')
    testDetectWithPostmanDumpFile() {
        const parser = new ClassMock(new PostmanParser())

        let input = JSON.stringify({
            collections: [],
            environments: [],
            id: '1234567890',
            name: 'some export name'
        })

        let expected = 1
        let result = parser.detect(input)

        this.assertEqual(expected, result)
    }

    @targets('detect')
    testDetectWithPostmanCollectionV1File() {
        const parser = new ClassMock(new PostmanParser())

        let input = JSON.stringify({
            id: '1234567890',
            name: 'some export name',
            timestamp: Date.now(),
            requests: []
        })

        let expected = 1
        let result = parser.detect(input)

        this.assertEqual(expected, result)
    }

    @targets('detect')
    testDetectWithPostmanEnvironmentFile() {
        const parser = new ClassMock(new PostmanParser())

        let input = JSON.stringify({
            id: '1234567890',
            name: 'some export name',
            timestamp: Date.now(),
            values: []
        })

        let expected = 1
        let result = parser.detect(input)

        this.assertEqual(expected, result)
    }

    @targets('detect')
    testDetectWithNonJSONFile() {
        const parser = new ClassMock(new PostmanParser())

        let input = 'toto:123'

        let expected = 0
        let result = parser.detect(input)

        this.assertEqual(expected, result)
    }

    @targets('detect')
    testDetectWithPostmanCollectionV2File() {
        const parser = new ClassMock(new PostmanParser())

        let input = JSON.stringify({
            info: 'some info object',
            item: 'some item to export'
        })

        let expected = 0
        let result = parser.detect(input)

        this.assertEqual(expected, result)
    }

    __loadPostmanFile(fileName, extension = 'json') {
        const path = __dirname + '/samples/' + fileName + '.' + extension
        const item = {
            file: {
                name: fileName + '.' + extension,
                path: __dirname + '/samples/'
            },
            content: fs.readFileSync(path).toString()
        }
        return item
    }
}
