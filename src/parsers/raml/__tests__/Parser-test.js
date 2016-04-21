import fs from 'fs'
import Immutable from 'immutable'

import { UnitTest, registerTest } from '../../../utils/TestUtils'
import {
    ClassMock
} from '../../../mocks/PawMocks'

import Auth from '../../../models/Auth'

import RequestContext, {
    Request,
    Response,
    KeyValue,
    Schema
} from '../../../models/RequestContext'

import RAMLParser from '../Parser'
import ShimmingFileReader from '../FileReader'

@registerTest
export class TestRAMLParser extends UnitTest {
    testConstructor() {
        let items = [ 1, 2, 3, 'test' ]

        let parser = new RAMLParser(items)

        this.assertTrue(parser.reader instanceof ShimmingFileReader)
        this.assertEqual(parser.reader.items, items)
    }

    testParseWithCustomReader(done) {
        const items = [
            {
                content: 'Lorem Ipsum dolor sic amet',
                file: {
                    path: '/some/path',
                    name: 'simpleFile'
                }
            }
        ]

        const raml =
        '#%RAML 0.8\n' +
        'title: GitHub API\n' +
        'version: v3\n' +
        'baseUri: https://api.github.com\n'

        let parser = new RAMLParser(items)
        let mockedParser = new ClassMock(parser, '')

        let expected = {
            title: 'GitHub API',
            version: 'v3',
            baseUri: 'https://api.github.com',
            protocols: [ 'HTTPS' ]
        }

        mockedParser.spyOn('_createContext', _raml => {
            this.assertEqual(_raml, expected)
            return 12
        })

        let promise = parser.parse.apply(
            mockedParser,
            [ raml, '/some/path/someRAMLFile.yml' ]
        )

        promise.then(
            data => {
                this.assertEqual(data, 12)
                done()
            },
            error => {
                throw new Error(error)
            }
        ).catch(error => {
            done(new Error(error))
        })
    }

    testParseWithCustomReaderAndFileReference(done) {
        const items = [
            {
                content: 'Lorem Ipsum dolor sic amet',
                file: {
                    path: '/some/path',
                    name: 'simpleFile'
                }
            }
        ]

        const raml =
        '#%RAML 0.8\n' +
        'title: GitHub API\n' +
        'version: v3\n' +
        'baseUri: https://api.github.com\n' +
        'schemas:\n' +
        '  - song: !include ./simpleFile'

        let parser = new RAMLParser(items)
        let mockedParser = new ClassMock(parser, '')

        let expected = {
            title: 'GitHub API',
            version: 'v3',
            baseUri: 'https://api.github.com',
            protocols: [ 'HTTPS' ],
            schemas: [
                {
                    song: 'Lorem Ipsum dolor sic amet'
                }
            ]
        }

        mockedParser.reader = new ShimmingFileReader(items)

        mockedParser.spyOn('_createContext', _raml => {
            this.assertEqual(_raml, expected)
            return 12
        })

        let promise = parser.parse.apply(
            mockedParser,
            [ raml, '/some/path/someRAMLFile.yml' ]
        )

        promise.then(
            data => {
                this.assertEqual(data, 12)
                done()
            },
            error => {
                throw new Error(error)
            }
        ).catch(error => {
            done(new Error(error))
        })
    }

    testParseWithCustomReaderAndMissingFileReference(done) {
        const items = [
            {
                content: 'Lorem Ipsum dolor sic amet',
                file: {
                    path: '/some/path',
                    name: 'simpleFile'
                }
            }
        ]

        const raml =
        '#%RAML 0.8\n' +
        'title: GitHub API\n' +
        'version: v3\n' +
        'baseUri: https://api.github.com\n' +
        'schemas:\n' +
        '  - song: !include ./missingFile'

        let parser = new RAMLParser(items)
        let mockedParser = new ClassMock(parser, '')

        let expected = {
            title: 'GitHub API',
            version: 'v3',
            baseUri: 'https://api.github.com',
            protocols: [ 'HTTPS' ],
            schemas: [
                {
                    song: '::fileRef::/some/path/missingFile'
                }
            ]
        }

        mockedParser.reader = new ShimmingFileReader(items)

        mockedParser.spyOn('_createContext', _raml => {
            this.assertEqual(_raml, expected)
            return 12
        })

        let promise = parser.parse.apply(
            mockedParser,
            [ raml, '/some/path/someRAMLFile.yml' ]
        )

        promise.then(
            data => {
                this.assertEqual(data, 12)
                done()
            },
            error => {
                throw new Error(error)
            }
        ).catch((error) => {
            done(new Error(error))
        })
    }

    testParseCallsCreateContext(done) {
        const items = [
            {
                content: 'Lorem Ipsum dolor sic amet',
                file: {
                    path: '/some/path',
                    name: 'simpleFile'
                }
            }
        ]

        const raml =
        '#%RAML 0.8\n' +
        'title: GitHub API\n' +
        'version: v3\n' +
        'baseUri: https://api.github.com\n'

        let parser = new RAMLParser(items)
        let mockedParser = new ClassMock(parser, '')

        let expected = {
            title: 'GitHub API',
            version: 'v3',
            baseUri: 'https://api.github.com',
            protocols: [ 'HTTPS' ]
        }

        mockedParser.spyOn('_createContext', () => {
            return 12
        })

        let promise = parser.parse.apply(
            mockedParser,
            [ raml, '/some/path/someRAMLFile.yml' ]
        )

        promise.then(
            data => {
                this.assertEqual(data, 12)
                this.assertEqual(mockedParser.spy._createContext.count, 1)
                this.assertEqual(
                    mockedParser.spy._createContext.calls[0],
                    [ expected ]
                )
                done()
            },
            error => {
                throw new Error(error)
            }
        ).catch((error) => {
            done(new Error(error))
        })
    }

    testParseWithBadRAMLThrows(done) {
        const items = [
            {
                content: 'Lorem Ipsum dolor sic amet',
                file: {
                    path: '/some/path',
                    name: 'simpleFile'
                }
            }
        ]

        const raml =
        '#%NOT RAML 3.14\n' +
        'title: GitHub API\n' +
        'version: v3\n' +
        'baseUri: https://api.github.com\n'

        let parser = new RAMLParser(items)
        let mockedParser = new ClassMock(parser, '')

        mockedParser.spyOn('_createContext', () => {
            return 12
        })

        let promise = parser.parse.apply(
            mockedParser,
            [ raml, '/some/path/someRAMLFile.yml' ]
        )

        promise.then(() => {
            this.assertTrue(false)
            done()
        }, () => {
            this.assertEqual(mockedParser.spy._createContext.count, 0)
            done()
        }).catch((error) => {
            done(new Error(error))
        })
    }

    testCreateContextCallsCreateGroupTree() {
        const raml = {
            title: 'GitHub API',
            version: 'v3',
            baseUri: 'https://api.github.com',
            protocols: [ 'HTTPS' ]
        }

        let parser = new RAMLParser()
        let mockedParser = new ClassMock(parser, '')

        mockedParser.spyOn('_createGroupTree', () => {
            return 12
        })

        parser._createContext.apply(
            mockedParser,
            [ raml ]
        )

        this.assertEqual(mockedParser.spy._createGroupTree.count, 1)
        this.assertEqual(
            mockedParser.spy._createGroupTree.calls[0],
            [ raml, raml, raml.title, raml.baseUri ]
        )
    }

    testCreateContextCallsReturnsRequestContextObject() {
        const raml = {
            title: 'GitHub API',
            version: 'v3',
            baseUri: 'https://api.github.com',
            protocols: [ 'HTTPS' ]
        }

        let parser = new RAMLParser()
        let mockedParser = new ClassMock(parser, '')

        mockedParser.spyOn('_createGroupTree', () => {
            return 12
        })

        const expected = new RequestContext({
            group: 12
        })

        let result = parser._createContext.apply(
            mockedParser,
            [ raml ]
        )

        this.assertEqual(result, expected)
    }

    testCreateGroupTreeWithNoResourcesNorMethods() {
        const raml = {
            title: 'GitHub API',
            version: 'v3',
            baseUri: 'https://api.github.com',
            protocols: [ 'HTTPS' ]
        }

        let parser = new RAMLParser()
        let mockedParser = new ClassMock(parser, '')

        mockedParser.spyOn('_createRequest', () => {
            return 12
        })

        let result = parser._createGroupTree.apply(
            mockedParser,
            [ raml, raml, raml.title, raml.baseUri ]
        )

        this.assertNull(result)
    }

    testCreateGroupTreeWithResources() {
        let raml = this.__loadRAMLObject('jukebox-api')

        let parser = new RAMLParser()
        let mockedParser = new ClassMock(parser, '')

        mockedParser.spyOn('_createRequest', () => {
            return 12
        })

        mockedParser._createGroupTree(raml, raml, raml.title, raml.baseUri)

        this.assertEqual(
            mockedParser.spy._createGroupTree.count, 10
        )

        this.assertEqual(
            mockedParser.spy._createRequest.count, 13
        )
    }

    testCreateGroupTreeCallsCreateRequestsWithCorrectURLs() {
        let raml = this.__loadRAMLObject('jukebox-api')

        let parser = new RAMLParser()
        let mockedParser = new ClassMock(parser, '')

        mockedParser.spyOn('_createRequest', () => {
            return 12
        })

        mockedParser._createGroupTree(raml, raml, raml.title, raml.baseUri)

        this.assertEqual(
            mockedParser.spy._createRequest.count, 13
        )

        function compareURLCalls(call, _url) {
            if (call.length < 4 || !_url) {
                return false
            }

            return call[2] === _url
        }

        let index = 0
        const urls = [
            'http://jukebox.api.com/songs/{songId}/file-content',
            'http://jukebox.api.com/songs/{songId}/file-content',
            'http://jukebox.api.com/songs/{songId}',
            'http://jukebox.api.com/songs',
            'http://jukebox.api.com/songs',
            'http://jukebox.api.com/artists/{artistId}/albums',
            'http://jukebox.api.com/artists/{artistId}',
            'http://jukebox.api.com/artists',
            'http://jukebox.api.com/artists',
            'http://jukebox.api.com/albums/{albumId}/songs',
            'http://jukebox.api.com/albums/{albumId}',
            'http://jukebox.api.com/albums',
            'http://jukebox.api.com/albums'
        ]
        for (let call of mockedParser.spy._createRequest.calls) {
            this.assertTrue(compareURLCalls(call, urls[index]))
            index += 1
        }
    }

    testCreateGroupTreeCallsCreateRequestsWithCorrectMethods() {
        let raml = this.__loadRAMLObject('jukebox-api')

        let parser = new RAMLParser()
        let mockedParser = new ClassMock(parser, '')

        mockedParser.spyOn('_createRequest', () => {
            return 12
        })

        mockedParser._createGroupTree(raml, raml, raml.title, raml.baseUri)

        this.assertEqual(
            mockedParser.spy._createRequest.count, 13
        )

        function compareMethodCalls(call, _method) {
            if (call.length < 4 || !_method) {
                return false
            }

            return call[3] === _method
        }

        let index = 0
        const methods = [
            'get',
            'post',
            'get',
            'get',
            'post',
            'get',
            'get',
            'get',
            'post',
            'get',
            'get',
            'get',
            'post'
        ]
        for (let call of mockedParser.spy._createRequest.calls) {
            this.assertTrue(compareMethodCalls(call, methods[index]))
            index += 1
        }
    }

    testCreateGroupTreeCallsCreateRequestsWithBaseRAMLObject() {
        let raml = this.__loadRAMLObject('jukebox-api')

        let parser = new RAMLParser()
        let mockedParser = new ClassMock(parser, '')

        mockedParser.spyOn('_createRequest', () => {
            return 12
        })

        mockedParser._createGroupTree(raml, raml, raml.title, raml.baseUri)

        this.assertEqual(
            mockedParser.spy._createRequest.count, 13
        )

        function compareBaseRAMLCalls(call) {
            if (call.length < 4) {
                return false
            }

            return call[0] === raml
        }

        for (let call of mockedParser.spy._createRequest.calls) {
            this.assertTrue(compareBaseRAMLCalls(call))
        }
    }

    testCreateRequestCallsAllSubExtractors() {
        const [ parser, raml ] = this.__init('jukebox-api')

        const req = raml.resources[0].methods[0]
        const url = 'http://jukebox.api.com/songs'
        const method = 'get'

        parser.spyOn('_extractHeaders', () => {
            return new Immutable.OrderedMap()
        })

        parser.spyOn('_extractQueries', () => {
            return null
        })

        parser.spyOn('_extractAuth', () => {
            return new Immutable.List()
        })

        parser.spyOn('_extractBody', () => {
            return [ null, null ]
        })

        parser.spyOn('_extractResponses', () => {
            return new Immutable.List()
        })

        parser._createRequest(raml, req, url, method)

        this.assertEqual(parser.spy._extractHeaders.count, 1)
        this.assertEqual(parser.spy._extractQueries.count, 1)
        this.assertEqual(parser.spy._extractAuth.count, 1)
        this.assertEqual(parser.spy._extractBody.count, 1)
        this.assertEqual(parser.spy._extractResponses.count, 1)
    }

    testCreateRequestReturnsARequest() {
        const [ parser, raml ] = this.__init('jukebox-api')

        const req = raml.resources[0].methods[0]
        const url = 'http://jukebox.api.com/songs'
        const method = 'get'

        parser.spyOn('_extractHeaders', () => {
            return new Immutable.OrderedMap()
        })

        parser.spyOn('_extractQueries', () => {
            return null
        })

        parser.spyOn('_extractAuth', () => {
            return new Immutable.List()
        })

        parser.spyOn('_extractBody', () => {
            return [ null, null ]
        })

        parser.spyOn('_extractResponses', () => {
            return new Immutable.List()
        })

        let request = parser._createRequest(raml, req, url, method)
        this.assertTrue(request instanceof Request)
    }

    testCreateRequestCombinesDataFromSubExtractors() {
        const [ parser, raml ] = this.__init('jukebox-api')

        const req = raml.resources[0].methods[0]
        const url = 'http://jukebox.api.com/songs'
        const method = 'get'

        parser.spyOn('_extractHeaders', () => {
            return new Immutable.OrderedMap({
                'Content-Type': 'application/json'
            })
        })

        parser.spyOn('_extractQueries', () => {
            return 12
        })

        parser.spyOn('_extractAuth', () => {
            return new Immutable.List([ 1, 2, 3 ])
        })

        parser.spyOn('_extractBody', () => {
            return [ 'plain', 'Lorem Ipsum' ]
        })

        parser.spyOn('_extractResponses', () => {
            return new Immutable.List([ true, false ])
        })

        let request = parser._createRequest(raml, req, url, method)
        let expected = new Request({
            headers: new Immutable.OrderedMap({
                'Content-Type': 'application/json'
            }),
            url: url,
            method: method,
            name: url,
            description: req.description,
            queries: 12,
            bodyType: 'plain',
            body: 'Lorem Ipsum',
            auth: new Immutable.List([ 1, 2, 3 ]),
            responses: new Immutable.List([ true, false ])
        })

        this.assertEqual(expected, request)
    }

    testExtractHeaders() {
        const [ parser, raml ] = this.__init('jukebox-api')
        const req = {
            headers: {
                'Content-MD5': {
                    description: 'The SHA1 hash of the file.',
                    type: 'string',
                    displayName: 'Content-MD5'
                },
                'Content-Type': {
                    type: 'string',
                    displayName: 'Content-Type',
                    default: 'application/json'
                }
            }
        }

        const expected = new Immutable.OrderedMap({
            'Content-MD5': new KeyValue({
                key: 'Content-MD5',
                value: null,
                valueType: 'string',
                description: 'Content-MD5 -- The SHA1 hash of the file.'
            }),
            'Content-Type': new KeyValue({
                key: 'Content-Type',
                value: 'application/json',
                valueType: 'string',
                description: 'Content-Type'
            })
        })

        const result = parser._extractHeaders(raml, req)

        this.assertEqual(expected, result)
    }

    testExtractQueries() {
        const [ parser, raml ] = this.__init('jukebox-api')

        const req = {
            queryParameters: {
                fields: {
                    description: 'Attribute(s) to include in the response',
                    type: 'string',
                    displayName: 'fields'
                },
                limit: {
                    description: 'The number of items to return',
                    type: 'integer',
                    default: 100,
                    maximum: 1000,
                    displayName: 'limit'
                },
                offset: {
                    description: 'The item at which to begin the response',
                    type: 'integer',
                    default: 0,
                    displayName: 'offset'
                }
            }
        }

        const expected = new Immutable.List([
            new KeyValue({
                key: 'fields',
                value: null,
                valueType: 'string',
                description: 'fields -- Attribute(s) to include in the response'
            }),
            new KeyValue({
                key: 'limit',
                value: 100,
                valueType: 'integer',
                description: 'limit -- The number of items to return'
            }),
            new KeyValue({
                key: 'offset',
                value: 0,
                valueType: 'integer',
                description: 'offset -- The item at which to begin the response'
            })
        ])

        const result = parser._extractQueries(raml, req)

        this.assertEqual(expected, result)
    }

    testExtractAuth() {
        const [ parser, raml ] = this.__init('large-raml')

        const req = {
            securedBy: [
                {
                    oauth_2_0: {
                        scopes: [
                            'ADMINISTRATOR'
                        ]
                    }
                }
            ]
        }

        parser.spyOn('_extractOAuth2Auth', () => {
            return 12
        })

        const scheme = {
            description: 'The Box API uses OAuth 2 for authentication. ' +
                'An authorization header containing\na valid access_token ' +
                'must be included in every request.\n',
            type: 'OAuth 2.0',
            describedBy: {
                headers: {
                    Authorization: {
                        description: 'Used to send a valid OAuth 2 access ' +
                            'token. Do not use together with\nthe ' +
                            '\"access_token\" query string parameter.\n',
                        type: 'string'
                    }
                },
                queryParameters: {
                    access_token: {
                        description: 'Used to send a valid OAuth 2 access ' +
                            'token. Do not use together with\nthe ' +
                            '\"Authorization\" header\n',
                        type: 'string'
                    }
                }
            },
            settings: {
                authorizationUri: 'https://www.box.com/api/oauth2/authorize',
                accessTokenUri: 'https://www.box.com/api/oauth2/token',
                authorizationGrants: [
                    'code',
                    'token'
                ]
            }
        }
        const expected = new Immutable.List([ 12 ])
        const result = parser._extractAuth(raml, req)

        this.assertEqual(expected, result)
        this.assertEqual(parser.spy._extractOAuth2Auth.count, 1)
        this.assertEqual(
            parser.spy._extractOAuth2Auth.calls[0],
            [
                raml,
                scheme,
                {
                    scopes: [
                        'ADMINISTRATOR'
                    ]
                }
            ]
        )
    }

    testExtractAuthWithAllAuthsPossible() {
        const [ parser, raml ] = this.__init('resource-example')

        const req = {
            securedBy: [
                null,
                {
                    oauth_2_0: {
                        scopes: [
                            'ADMINISTRATOR'
                        ]
                    }
                },
                'oauth_1_0',
                'basic',
                'digest'
            ]
        }

        parser.spyOn('_extractOAuth2Auth', () => {
            return 12
        })

        parser.spyOn('_extractOAuth1Auth', () => {
            return 42
        })

        parser.spyOn('_extractBasicAuth', () => {
            return 90
        })

        parser.spyOn('_extractDigestAuth', () => {
            return 45
        })

        const result = parser._extractAuth(raml, req)

        this.assertEqual(
            [
                parser.spy._extractOAuth2Auth.count,
                parser.spy._extractOAuth1Auth.count,
                parser.spy._extractBasicAuth.count,
                parser.spy._extractDigestAuth.count
            ],
            [ 1, 1, 1, 1 ]
        )

        this.assertEqual(
            result,
            new Immutable.List([ null, 12, 42, 90, 45 ])
        )
    }

    testExtractAuthWithMissingSchemes() {
        const [ parser, raml ] = this.__init('large-raml')

        const req = {
            securedBy: [
                null,
                {
                    oauth_2_0: {
                        scopes: [
                            'ADMINISTRATOR'
                        ]
                    }
                },
                'oauth_1_0',
                'basic',
                'digest'
            ]
        }

        parser.spyOn('_extractOAuth2Auth', () => {
            return 12
        })

        parser.spyOn('_extractOAuth1Auth', () => {
            return 42
        })

        parser.spyOn('_extractBasicAuth', () => {
            return 90
        })

        parser.spyOn('_extractDigestAuth', () => {
            return 45
        })

        const result = parser._extractAuth(raml, req)

        this.assertEqual(
            [
                parser.spy._extractOAuth2Auth.count,
                parser.spy._extractOAuth1Auth.count,
                parser.spy._extractBasicAuth.count,
                parser.spy._extractDigestAuth.count
            ],
            [ 1, 0, 0, 0 ]
        )

        this.assertEqual(
            result,
            new Immutable.List([ null, 12 ])
        )
    }

    testExtractOAuth2Auth() {
        const [ parser, raml ] = this.__init('large-raml')

        const scheme = {
            description: 'The Box API uses OAuth 2 for authentication. ' +
                'An authorization header containing\na valid access_token ' +
                'must be included in every request.\n',
            type: 'OAuth 2.0',
            describedBy: {
                headers: {
                    Authorization: {
                        description: 'Used to send a valid OAuth 2 access ' +
                            'token. Do not use together with\nthe ' +
                            '\"access_token\" query string parameter.\n',
                        type: 'string'
                    }
                },
                queryParameters: {
                    access_token: {
                        description: 'Used to send a valid OAuth 2 access ' +
                            'token. Do not use together with\nthe ' +
                            '\"Authorization\" header\n',
                        type: 'string'
                    }
                }
            },
            settings: {
                authorizationUri: 'https://www.box.com/api/oauth2/authorize',
                accessTokenUri: 'https://www.box.com/api/oauth2/token',
                authorizationGrants: [
                    'code',
                    'token'
                ]
            }
        }

        const params = {
            scopes: [
                'ADMINISTRATOR'
            ]
        }

        const expected = new Auth.OAuth2({
            flow: 'accessCode',
            authorizationUrl: 'https://www.box.com/api/oauth2/authorize',
            tokenUrl: 'https://www.box.com/api/oauth2/token',
            scopes: new Immutable.List(params.scopes)
        })

        const result = parser._extractOAuth2Auth(raml, scheme, params)

        this.assertEqual(expected, result)
    }

    testExtractOAuth1Auth() {
        const [ parser, raml ] = this.__init('large-raml')

        const scheme = {
            type: 'OAuth 1.0',
            settings: {
                authorizationUri: 'https://www.box.com/api/oauth1/authorize',
                requestTokenUri: 'https://www.box.com/api/oauth1/request',
                tokenCredentialsUri: 'https://www.box.com/api/oauth1/token'
            }
        }

        const expected = new Auth.OAuth1({
            authorizationUri: 'https://www.box.com/api/oauth1/authorize',
            requestTokenUri: 'https://www.box.com/api/oauth1/request',
            tokenCredentialsUri: 'https://www.box.com/api/oauth1/token'
        })

        const result = parser._extractOAuth1Auth(raml, scheme)

        this.assertEqual(expected, result)
    }

    testExtractBasicAuth() {
        const [ parser, raml ] = this.__init('large-raml')

        const expected = new Auth.Basic()
        const result = parser._extractBasicAuth(raml)

        this.assertEqual(expected, result)
    }

    testExtractDigestAuth() {
        const [ parser, raml ] = this.__init('large-raml')

        const expected = new Auth.Digest()
        const result = parser._extractDigestAuth(raml)

        this.assertEqual(expected, result)
    }

    testExtractBodyWithSchema() {
        const [ parser, raml ] = this.__init('large-raml')

        const req = {
            body: {
                'application/json': {
                    schema: '{\n\t\"$schema\": ' +
                    '\"http://json-schema.org/draft-03/schema\",' +
                    '\n\t\"type\": \"object\" ,\n\t\"properties\": ' +
                    '{\n\t\t\"name\": {\n\t\t\t\"description\": ' +
                    '\"The new name for this item.\",\n\t\t\t\"type\": ' +
                    '\"string\"\n\t\t},\n\t\t\"parent\": ' +
                    '{\n\t\t\t\"description\": \"The new parent folder ' +
                    'for this item.\",\n\t\t\t\"type\": ' +
                    '\"object\"\n\t\t},\n\t\t\"id\": ' +
                    '{\n\t\t\t\"description\": \"The id of the new parent ' +
                    'folder.\",\n\t\t\t\"type\": \"string\"\n\t\t}\n\t}\n}\n'
                }
            }
        }

        const expected = [
            'schema',
            new Schema({
                raw: req.body['application/json'].schema
            })
        ]

        const result = parser._extractBody(raml, req)

        this.assertEqual(expected, result)
    }

    testExtractBodyWithMultipart() {
        const [ parser, raml ] = this.__init('jukebox-api')

        const req = {
            body: {
                'binary/octet-stream': null,
                'multipart/form-data': {
                    formParameters: {
                        file: {
                            description: 'The file to be uploaded',
                            required: true,
                            type: 'file',
                            displayName: 'file'
                        }
                    }
                }
            }
        }

        const expected = [
            'formData',
            new Immutable.List([
                new KeyValue({
                    key: 'file',
                    value: null,
                    valueType: 'file',
                    description: 'The file to be uploaded'
                })
            ])
        ]

        const result = parser._extractBody(raml, req)

        this.assertEqual(expected, result)
    }

    testExtractBodyWithWeirdKey() {
        const [ parser, raml ] = this.__init('jukebox-api')

        const req = {
            body: {
                'someweird/key': {
                    formParameters: {
                        file: {
                            description: 'The file to be uploaded',
                            required: true,
                            type: 'file',
                            displayName: 'file'
                        }
                    }
                }
            }
        }

        const expected = [ null, null ]
        const result = parser._extractBody(raml, req)

        this.assertEqual(expected, result)
    }

    testExtractResponses() {
        const [ parser, raml ] = this.__init('jukebox-api')

        const req = {
            responses: {
                200: {
                    body: {
                        'application/json': {
                            example:
                                '::fileRef::../samples/' +
                                'jukebox-include-artist-retrieve.sample\n'
                        }
                    }
                },
                404: {
                    body: {
                        'application/json': {
                            example: '{\"message\": \"artist not found\" }\n'
                        }
                    }
                }
            }
        }

        const expected = new Immutable.List([
            new Response({
                code: '200'
            }),
            new Response({
                code: '404'
            })
        ])
        const result = parser._extractResponses(raml, req)

        this.assertEqual(expected, result)
    }

    testExtractResponses() {
        const [ parser, raml ] = this.__init('jukebox-api')

        /* eslint-disable max-len */
        const req = {
            responses: {
                200: {
                    description:
                        'The request has succeeded. The information ' +
                        'returned with the response\nis dependent on the ' +
                        'method used in the request.\n',
                    body: {
                        'application/json': {
                            schema: '{\n\t\"$schema\": \"http://json-schema.org/draft-03/schema\",\n\t\"type\": \"object\" ,\n\t\"properties\": {\n\t\t\"type\": {\n\t\t\t\"type\": \"string\"\n\t\t},\n\t\t\"id\": {\n\t\t\t\"type\": \"string\"\n\t\t},\n\t\t\"item\": {\n\t\t\t\"properties\": {\n\t\t\t\t\"type\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t},\n\t\t\t\t\"id\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t},\n\t\t\t\t\"sequence_id\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t},\n\t\t\t\t\"etag\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t},\n\t\t\t\t\"sha1\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t},\n\t\t\t\t\"name\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t}\n\t\t\t},\n\t\t\t\"type\": \"object\"\n\t\t},\n\t\t\"assigned_to\": {\n\t\t\t\"properties\": {\n\t\t\t\t\"type\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t},\n\t\t\t\t\"id\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t},\n\t\t\t\t\"name\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t},\n\t\t\t\t\"login\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t}\n\t\t\t},\n\t\t\t\"type\": \"object\"\n\t\t},\n\t\t\"message\": {\n\t\t\t\"type\": \"string\"\n\t\t},\n\t\t\"completed_at\": {\n\t\t\t\"type\": \"timestamp\"\n\t\t},\n\t\t\"assigned_at\": {\n\t\t\t\"type\": \"timestamp\"\n\t\t},\n\t\t\"reminded_at\": {\n\t\t\t\"type\": \"string\"\n\t\t},\n\t\t\"resolution_state\": {\n\t\t\t\"type\": \"string\"\n\t\t},\n\t\t\"assigned_by\": {\n\t\t\t\"properties\": {\n\t\t\t\t\"type\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t},\n\t\t\t\t\"id\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t},\n\t\t\t\t\"name\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t},\n\t\t\t\t\"login\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t}\n\t\t\t},\n\t\t\t\"type\": \"object\"\n\t\t}\n\t}\n}\n'
                        }
                    }
                },
                400: {
                    description: 'Bad Request.'
                },
                401: {
                    description: 'Unauthorized.'
                },
                404: {
                    description: 'Not Found.'
                },
                429: {
                    description: 'Too Many Requests.'
                },
                500: {
                    description: 'Internal Server Error.'
                },
                507: {
                    description: 'Insufficient Storage.'
                }
            }
        }
        /* eslint-enable max-len */

        const expected = new Immutable.List([
            new Response({
                code: '200',
                description:
                    'The request has succeeded. The information ' +
                    'returned with the response\nis dependent on the ' +
                    'method used in the request.\n',
                schema: new Schema({
                    /* eslint-disable max-len */
                    raw: '{\n\t\"$schema\": \"http://json-schema.org/draft-03/schema\",\n\t\"type\": \"object\" ,\n\t\"properties\": {\n\t\t\"type\": {\n\t\t\t\"type\": \"string\"\n\t\t},\n\t\t\"id\": {\n\t\t\t\"type\": \"string\"\n\t\t},\n\t\t\"item\": {\n\t\t\t\"properties\": {\n\t\t\t\t\"type\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t},\n\t\t\t\t\"id\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t},\n\t\t\t\t\"sequence_id\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t},\n\t\t\t\t\"etag\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t},\n\t\t\t\t\"sha1\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t},\n\t\t\t\t\"name\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t}\n\t\t\t},\n\t\t\t\"type\": \"object\"\n\t\t},\n\t\t\"assigned_to\": {\n\t\t\t\"properties\": {\n\t\t\t\t\"type\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t},\n\t\t\t\t\"id\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t},\n\t\t\t\t\"name\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t},\n\t\t\t\t\"login\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t}\n\t\t\t},\n\t\t\t\"type\": \"object\"\n\t\t},\n\t\t\"message\": {\n\t\t\t\"type\": \"string\"\n\t\t},\n\t\t\"completed_at\": {\n\t\t\t\"type\": \"timestamp\"\n\t\t},\n\t\t\"assigned_at\": {\n\t\t\t\"type\": \"timestamp\"\n\t\t},\n\t\t\"reminded_at\": {\n\t\t\t\"type\": \"string\"\n\t\t},\n\t\t\"resolution_state\": {\n\t\t\t\"type\": \"string\"\n\t\t},\n\t\t\"assigned_by\": {\n\t\t\t\"properties\": {\n\t\t\t\t\"type\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t},\n\t\t\t\t\"id\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t},\n\t\t\t\t\"name\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t},\n\t\t\t\t\"login\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t}\n\t\t\t},\n\t\t\t\"type\": \"object\"\n\t\t}\n\t}\n}\n'
                    /* eslint-enable max-len */
                })
            }),
            new Response({
                code: '400',
                description: 'Bad Request.'
            }),
            new Response({
                code: '401',
                description: 'Unauthorized.'
            }),
            new Response({
                code: '404',
                description: 'Not Found.'
            }),
            new Response({
                code: '429',
                description: 'Too Many Requests.'
            }),
            new Response({
                code: '500',
                description: 'Internal Server Error.'
            }),
            new Response({
                code: '507',
                description: 'Insufficient Storage.'
            })
        ])
        const result = parser._extractResponses(raml, req)

        this.assertEqual(expected, result)
    }

    __init(file) {
        let raml = this.__loadRAMLObject(file)
        let parser = new RAMLParser()
        let mockedParser = new ClassMock(parser, '')

        return [ mockedParser, raml ]
    }

    __loadRAMLObject(name) {
        const dir = __dirname + '/generated/'
        let filename = name
        if (!name.endsWith('.json')) {
            filename = name.replace(/\.[^.]*$/, '') + '.json'
        }
        return JSON.parse(fs.readFileSync(dir + filename).toString())
    }
}
