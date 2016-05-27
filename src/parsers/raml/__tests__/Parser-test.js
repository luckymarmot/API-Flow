import fs from 'fs'
import Immutable from 'immutable'

import {
    UnitTest,
    registerTest,
    against,
    targets
} from '../../../utils/TestUtils'

import {
    ClassMock
} from '../../../mocks/PawMocks'

import Constraint from '../../../models/Constraint'
import Auth from '../../../models/Auth'

import Context, {
    Body,
    Response,
    Parameter,
    ParameterContainer
} from '../../../models/Core'

import Request from '../../../models/Request'
import URL from '../../../models/URL'
import Item from '../../../models/Item'
import { Info } from '../../../models/Utils'

import ExoticReference from '../../../models/references/Exotic'
import JSONSchemaReference from '../../../models/references/JSONSchema'

import RAMLParser from '../Parser'
import ShimmingFileReader from '../FileReader'

@registerTest
@against(RAMLParser)
export class TestRAMLParser extends UnitTest {
    testConstructor() {
        let items = [ 1, 2, 3, 'test' ]

        let parser = new RAMLParser(items)

        this.assertTrue(parser.reader instanceof ShimmingFileReader)
        this.assertEqual(parser.reader.items, items)
    }

    @targets('parse')
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

        const item = {
            content: raml,
            file: {
                path: '/some/path',
                name: 'someRAMLFile.yml'
            }
        }

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
            [ item ]
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

    @targets('parse')
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

        const item = {
            content: raml,
            file: {
                path: '/some/path',
                name: 'someRAMLFile.yml'
            }
        }

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
            [ item ]
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

    @targets('parse')
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

        const item = {
            content: raml,
            file: {
                path: '/some/path',
                name: 'someRAMLFile.yml'
            }
        }

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
            [ item ]
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

    @targets('parse')
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

        const item = {
            content: raml,
            file: {
                path: '/some/path',
                name: 'someRAMLFile.yml'
            }
        }

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
            [ item ]
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

    @targets('parse')
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

        const item = {
            content: raml,
            file: {
                path: '/some/path',
                name: 'someRAMLFile.yml'
            }
        }

        let parser = new RAMLParser(items)
        let mockedParser = new ClassMock(parser, '')

        mockedParser.spyOn('_createContext', () => {
            return 12
        })

        let promise = parser.parse.apply(
            mockedParser,
            [ item ]
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

    @targets('_createContext')
    testCreateContextCallsCreateGroupTree() {
        const raml = {
            title: 'GitHub API',
            version: 'v3',
            baseUri: 'https://api.github.com',
            protocols: [ 'HTTPS' ]
        }

        let parser = new RAMLParser()
        let mockedParser = new ClassMock(parser, '')

        mockedParser.spyOn('_findReferences', () => {
            return new Immutable.List()
        })

        mockedParser.spyOn('_replaceReferences', _raml => {
            return _raml
        })

        mockedParser.spyOn('_createGroupTree', () => {
            return 12
        })

        mockedParser._createContext(raml)

        this.assertEqual(mockedParser.spy._createGroupTree.count, 1)
        this.assertEqual(
            mockedParser.spy._createGroupTree.calls[0],
            [ raml, raml, raml.title ]
        )
    }

    @targets('_createContext')
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

        mockedParser.spyOn('_extractInfos', () => {
            return 90
        })

        const expected = new Context({
            group: 12,
            info: 90
        })

        let result = parser._createContext.apply(
            mockedParser,
            [ raml ]
        )

        this.assertEqual(result, expected)
    }

    @targets('_createGroupTree')
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
            [ raml, raml, raml.title ]
        )

        this.assertNull(result)
    }

    @targets('_createGroupTree')
    testCreateGroupTreeWithResources() {
        let raml = this.__loadRAMLObject('jukebox-api')

        let parser = new RAMLParser()
        let mockedParser = new ClassMock(parser, '')

        mockedParser.spyOn('_createRequest', () => {
            return 12
        })

        mockedParser._createGroupTree(raml, raml, raml.title)

        this.assertEqual(
            mockedParser.spy._createGroupTree.count, 10
        )

        this.assertEqual(
            mockedParser.spy._createRequest.count, 13
        )
    }

    @targets('_createGroupTree')
    testCreateGroupTreeCallsCreateRequestsWithCorrectURLs() {
        let raml = this.__loadRAMLObject('jukebox-api')

        let parser = new RAMLParser()
        let mockedParser = new ClassMock(parser, '')

        mockedParser.spyOn('_createRequest', () => {
            return 12
        })

        mockedParser._createGroupTree(raml, raml, raml.title)

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
            '/songs/{songId}/file-content',
            '/songs/{songId}/file-content',
            '/songs/{songId}',
            '/songs',
            '/songs',
            '/artists/{artistId}/albums',
            '/artists/{artistId}',
            '/artists',
            '/artists',
            '/albums/{albumId}/songs',
            '/albums/{albumId}',
            '/albums',
            '/albums'
        ]
        for (let call of mockedParser.spy._createRequest.calls) {
            this.assertTrue(compareURLCalls(call, urls[index]))
            index += 1
        }
    }

    @targets('_createGroupTree')
    testCreateGroupTreeCallsCreateRequestsWithCorrectMethods() {
        let raml = this.__loadRAMLObject('jukebox-api')

        let parser = new RAMLParser()
        let mockedParser = new ClassMock(parser, '')

        mockedParser.spyOn('_createRequest', () => {
            return 12
        })

        mockedParser._createGroupTree(raml, raml, raml.title)

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

    @targets('_createGroupTree')
    testCreateGroupTreeCallsCreateRequestsWithBaseRAMLObject() {
        let raml = this.__loadRAMLObject('jukebox-api')

        let parser = new RAMLParser()
        let mockedParser = new ClassMock(parser, '')

        mockedParser.spyOn('_createRequest', () => {
            return 12
        })

        mockedParser._createGroupTree(raml, raml, raml.title)

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

    @targets('_createRequest')
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

        parser.spyOn('_extractBodies', () => {
            return [ null, null ]
        })

        parser.spyOn('_extractResponses', () => {
            return new Immutable.List()
        })

        parser._createRequest(raml, req, url, method)

        this.assertEqual(parser.spy._extractHeaders.count, 1)
        this.assertEqual(parser.spy._extractQueries.count, 1)
        this.assertEqual(parser.spy._extractAuth.count, 1)
        this.assertEqual(parser.spy._extractBodies.count, 1)
        this.assertEqual(parser.spy._extractResponses.count, 1)
    }

    @targets('_createRequest')
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

        parser.spyOn('_extractBodies', () => {
            return [ null, null ]
        })

        parser.spyOn('_extractResponses', () => {
            return new Immutable.List()
        })

        let request = parser._createRequest(raml, req, url, method)
        this.assertTrue(request instanceof Request)
    }

    @targets('_createRequest')
    testCreateRequestCombinesDataFromSubExtractors() {
        const [ parser, raml ] = this.__init('jukebox-api')

        const req = raml.resources[0].methods[0]
        const url = '/songs'
        const method = 'get'

        parser.spyOn('_extractHeaders', () => {
            return new Immutable.OrderedMap({
                'Content-Type': 'application/json'
            })
        })

        parser.spyOn('_extractQueries', () => {
            return new ParameterContainer({
                queries: 12
            })
        })

        parser.spyOn('_extractAuth', () => {
            return new Immutable.List([ 1, 2, 3 ])
        })

        parser.spyOn('_extractBodies', (_, __, container) => {
            return [ container, 'Lorem Ipsum' ]
        })

        parser.spyOn('_extractResponses', () => {
            return new Immutable.List([ true, false ])
        })

        const expectedURL = new URL({
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
                format: 'sequence',
                value: new Immutable.List([
                    new Parameter({
                        key: 'subDomain',
                        type: 'string',
                        required: true,
                        internals: new Immutable.List([
                            new Constraint.Enum([ 'jukebox', 'live' ])
                        ]),
                        name: 'subDomain',
                        description: 'the sub-domain to hit'
                    }),
                    new Parameter({
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([ '.api.' ])
                        ])
                    }),
                    new Parameter({
                        key: 'extension',
                        type: 'string',
                        required: true,
                        name: 'extension',
                        description: 'the domain extension',
                        internals: new Immutable.List([
                            new Constraint.Enum([ 'com', 'io', 'jp' ])
                        ])
                    })
                ])
            }),
            pathname: new Parameter({
                key: 'pathname',
                type: 'string',
                internals: new Immutable.List([
                    new Constraint.Enum([ '/songs' ])
                ])
            })
        })

        let expected = new Request({
            headers: new Immutable.OrderedMap({
                'Content-Type': 'application/json'
            }),
            url: expectedURL,
            method: method,
            name: 'http://jukebox.api.com' + url,
            description: req.description,
            parameters: new ParameterContainer({
                queries: 12
            }),
            bodies: 'Lorem Ipsum',
            auths: new Immutable.List([ 1, 2, 3 ]),
            responses: new Immutable.List([ true, false ])
        })

        const expectedGeneratedURLs = [
            'http://jukebox.api.com/songs',
            'http://jukebox.api.io/songs',
            'http://jukebox.api.jp/songs',
            'http://live.api.com/songs',
            'http://live.api.io/songs',
            'http://live.api.jp/songs'
        ]

        let request = parser._createRequest(raml, req, url, method)

        this.assertNotEqual(
            expectedGeneratedURLs.indexOf(request.get('name')), -1,
            request.get('name')
        )

        expected = expected.set('name', request.get('name'))

        this.assertJSONEqual(expected, request)
    }

    @targets('_extractParam')
    testExtractParamSimpleParam() {
        const [ parser ] = this.__init('jukebox-api')

        const expected = null

        const result = parser._extractParam()

        this.assertEqual(expected, result)
    }

    @targets('_extractParam')
    testExtractParamSimpleParamNoExternals() {
        const [ parser ] = this.__init('jukebox-api')

        const input = {
            description: 'Skip over a number of elements',
            type: 'integer',
            required: false,
            example: 20,
            default: 0,
            displayName: 'Offset'
        }
        const expected = new Parameter({
            key: 'offset',
            description: 'Skip over a number of elements',
            type: 'integer',
            example: 20,
            value: 0,
            name: 'Offset'
        })

        const result = parser._extractParam('offset', input)

        this.assertEqual(expected, result)
    }

    @targets('_extractParam')
    testExtractParamParamWithInternalsNoExternals() {
        const [ parser ] = this.__init('jukebox-api')

        const input = {
            description: 'Skip over a number of elements',
            type: 'integer',
            example: 20,
            default: 0,
            maximum: 50,
            minimum: 0,
            displayName: 'Offset'
        }
        const expected = new Parameter({
            key: 'offset',
            description: 'Skip over a number of elements',
            type: 'integer',
            example: 20,
            value: 0,
            name: 'Offset',
            internals: new Immutable.List([
                new Constraint.Maximum(50),
                new Constraint.Minimum(0)
            ])
        })

        const result = parser._extractParam('offset', input)

        this.assertEqual(
            JSON.stringify(expected),
            JSON.stringify(result)
        )
    }

    @targets('_extractParam')
    testExtractParamParamWithStringInternalsNoExternals() {
        const [ parser ] = this.__init('jukebox-api')

        const input = {
            description: 'A nice file path',
            type: 'string',
            example: '~/path/to/file.ext',
            displayName: 'File path',
            enum: [
                '~/some/path/to/dest.ext',
                '~/some/other/path/to/dest.ext'
            ],
            pattern: '/~\/([^/]\/)*([^.]*)\.(.+)/',
            minLength: 12,
            maxLength: 42
        }
        const expected = new Parameter({
            key: 'path',
            description: 'A nice file path',
            type: 'string',
            example: '~/path/to/file.ext',
            name: 'File path',
            internals: new Immutable.List([
                new Constraint.Enum([
                    '~/some/path/to/dest.ext',
                    '~/some/other/path/to/dest.ext'
                ]),
                new Constraint.Pattern('/~\/([^/]\/)*([^.]*)\.(.+)/'),
                new Constraint.MinimumLength(12),
                new Constraint.MaximumLength(42)
            ])
        })

        const result = parser._extractParam('path', input)

        this.assertEqual(
            JSON.stringify(expected),
            JSON.stringify(result)
        )
    }

    @targets('_extractParam')
    testExtractParamSimpleParamWithExternals() {
        const [ parser ] = this.__init('jukebox-api')

        const input = {
            description: 'Skip over a number of elements',
            type: 'integer',
            required: false,
            example: 20,
            default: 0,
            displayName: 'Offset'
        }

        const externals = new Immutable.List([
            new Parameter({
                key: 'Content-Type',
                internals: new Immutable.List([
                    new Constraint.Enum([
                        'application/json'
                    ])
                ])
            })
        ])

        const expected = new Parameter({
            key: 'offset',
            description: 'Skip over a number of elements',
            type: 'integer',
            example: 20,
            value: 0,
            name: 'Offset',
            externals: externals
        })

        const result = parser._extractParam('offset', input, externals)

        this.assertEqual(expected, result)
    }

    @targets('_extractHeaders')
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
        const container = new ParameterContainer()

        const expected = new ParameterContainer({
            headers: new Immutable.List([
                new Parameter({
                    key: 'Content-MD5',
                    type: 'string',
                    name: 'Content-MD5',
                    description: 'The SHA1 hash of the file.'
                }),
                new Parameter({
                    key: 'Content-Type',
                    value: 'application/json',
                    type: 'string',
                    name: 'Content-Type'
                })
            ])
        })

        const result = parser._extractHeaders(raml, req, container)

        this.assertEqual(expected, result)
    }

    @targets('_extractHeaders')
    testExtractHeadersCallsExtractParam() {
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

        const container = new ParameterContainer()

        parser.spyOn('_extractParam', () => {
            return 12
        })

        parser._extractHeaders(raml, req, container)

        this.assertEqual(parser.spy._extractParam.count, 2)
        this.assertEqual(
            parser.spy._extractParam.calls[0],
            [
                'Content-MD5',
                {
                    description: 'The SHA1 hash of the file.',
                    type: 'string',
                    displayName: 'Content-MD5'
                }
            ]
        )

        this.assertEqual(
            parser.spy._extractParam.calls[1],
            [
                'Content-Type',
                {
                    type: 'string',
                    displayName: 'Content-Type',
                    default: 'application/json'
                }
            ]
        )
    }

    @targets('_extractQueries')
    testExtractQueriesCallsExtractParam() {
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

        const container = new ParameterContainer()

        parser.spyOn('_extractParam', () => {
            return 12
        })

        const result = parser._extractQueries(raml, req, container)

        this.assertEqual(parser.spy._extractParam.count, 3)
        this.assertEqual(
            parser.spy._extractParam.calls[0],
            [
                'fields',
                {
                    description: 'Attribute(s) to include in the response',
                    type: 'string',
                    displayName: 'fields'
                }
            ]
        )

        this.assertEqual(
            parser.spy._extractParam.calls[1],
            [
                'limit',
                {
                    description: 'The number of items to return',
                    type: 'integer',
                    default: 100,
                    maximum: 1000,
                    displayName: 'limit'
                }
            ]
        )

        this.assertEqual(
            parser.spy._extractParam.calls[2],
            [
                'offset',
                {
                    description: 'The item at which to begin the response',
                    type: 'integer',
                    default: 0,
                    displayName: 'offset'
                }
            ]
        )

        this.assertEqual(
            new ParameterContainer({
                queries: new Immutable.List([ 12, 12, 12 ])
            }),
            result
        )
    }

    @targets('_extractAuth')
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

    @targets('_extractAuth')
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

    @targets('_extractAuth')
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

    @targets('_extractOAuth2Auth')
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

    @targets('_extractOAuth1Auth')
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

    @targets('_extractBasicAuth')
    testExtractBasicAuth() {
        const [ parser, raml ] = this.__init('large-raml')

        const expected = new Auth.Basic()
        const result = parser._extractBasicAuth(raml)

        this.assertEqual(expected, result)
    }

    @targets('_extractDigestAuth')
    testExtractDigestAuth() {
        const [ parser, raml ] = this.__init('large-raml')

        const expected = new Auth.Digest()
        const result = parser._extractDigestAuth(raml)

        this.assertEqual(expected, result)
    }

    @targets('_extractBodies')
    testExtractBodiesWithSchema() {
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

        const container = new ParameterContainer()
        const bodies = new Immutable.List()

        const expectedContainer = new ParameterContainer({
            headers: new Immutable.List([
                new Parameter({
                    key: 'Content-Type',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            'application/json'
                        ])
                    ]),
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
            body: new Immutable.List([
                new Parameter({
                    key: 'schema',
                    value: req.body['application/json'].schema,
                    type: 'string',
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
            ])
        })

        const expectedBodies = new Immutable.List([
            new Body({
                constraints: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        type: 'string',
                        value: 'application/json'
                    })
                ])
            })
        ])

        const [ resContainer, resBodies ] = parser._extractBodies(
            raml, req, container, bodies
        )

        this.assertJSONEqual(expectedContainer, resContainer)
        this.assertJSONEqual(expectedBodies, resBodies)
    }

    @targets('_extractBodies')
    testExtractBodiesWithMultipart() {
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

        const container = new ParameterContainer()
        const bodies = new Immutable.List()

        const expectedContainer = new ParameterContainer({
            headers: new Immutable.List([
                new Parameter({
                    key: 'Content-Type',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            'binary/octet-stream'
                        ])
                    ]),
                    externals: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'binary/octet-stream'
                                ])
                            ])
                        })
                    ])
                }),
                new Parameter({
                    key: 'Content-Type',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            'multipart/form-data'
                        ])
                    ]),
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
            body: new Immutable.List([
                new Parameter({
                    key: 'file',
                    description: 'The file to be uploaded',
                    type: 'file',
                    name: 'file',
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
            ])
        })

        const expectedBodies = new Immutable.List([
            new Body({
                constraints: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        type: 'string',
                        value: 'binary/octet-stream'
                    })
                ])
            }),
            new Body({
                type: 'formData',
                constraints: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        type: 'string',
                        value: 'multipart/form-data'
                    })
                ])
            })
        ])

        const [ resContainer, resBodies ] = parser._extractBodies(
            raml, req, container, bodies
        )

        this.assertJSONEqual(expectedContainer, resContainer)
        this.assertJSONEqual(expectedBodies, resBodies)
    }

    @targets('_extractBodies')
    testExtractBodiesWithWeirdKey() {
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
                },
                'multipart/form-data': {
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

        const container = new ParameterContainer()
        const bodies = new Immutable.List()

        const expectedContainer = new ParameterContainer({
            headers: new Immutable.List([
                new Parameter({
                    key: 'Content-Type',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            'someweird/key'
                        ])
                    ]),
                    externals: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'someweird/key'
                                ])
                            ])
                        })
                    ])
                }),
                new Parameter({
                    key: 'Content-Type',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            'multipart/form-data'
                        ])
                    ]),
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
            ])
        })
        const expectedBodies = new Immutable.List([
            new Body({
                constraints: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        type: 'string',
                        value: 'someweird/key'
                    })
                ])
            }),
            new Body({
                type: 'formData',
                constraints: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        type: 'string',
                        value: 'multipart/form-data'
                    })
                ])
            })
        ])

        const [ resContainer, resBodies ] = parser._extractBodies(
            raml, req, container, bodies
        )

        this.assertJSONEqual(expectedContainer, resContainer)
        this.assertJSONEqual(expectedBodies, resBodies)
    }

    @targets('_extractResponses')
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
                code: '200',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'application/json' ])
                            ]),
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
                    body: new Immutable.List([
                        new Parameter({
                            key: 'body',
                            example: '::fileRef::../samples/' +
                                'jukebox-include-artist-retrieve.sample\n',
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
                    ])
                }),
                bodies: new Immutable.List([
                    new Body({
                        constraints: new Immutable.List([
                            new Parameter({
                                key: 'Content-Type',
                                type: 'string',
                                value: 'application/json'
                            })
                        ])
                    })
                ])
            }),
            new Response({
                code: '404',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'application/json' ])
                            ]),
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
                    body: new Immutable.List([
                        new Parameter({
                            key: 'body',
                            example: '{\"message\": \"artist not found\" }\n',
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
                    ])
                }),
                bodies: new Immutable.List([
                    new Body({
                        constraints: new Immutable.List([
                            new Parameter({
                                key: 'Content-Type',
                                type: 'string',
                                value: 'application/json'
                            })
                        ])
                    })
                ])
            })
        ])
        const result = parser._extractResponses(raml, req)

        this.assertEqual(
            JSON.stringify(expected, null, '  '),
            JSON.stringify(result, null, '  ')
        )
    }

    @targets('_extractResponses')
    testExtractResponsesWithComplexResponses() {
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
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'application/json'
                                ])
                            ]),
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
                    body: new Immutable.List([
                        new Parameter({
                            key: 'schema',
                            /* eslint-disable max-len */
                            value: '{\n\t\"$schema\": \"http://json-schema.org/draft-03/schema\",\n\t\"type\": \"object\" ,\n\t\"properties\": {\n\t\t\"type\": {\n\t\t\t\"type\": \"string\"\n\t\t},\n\t\t\"id\": {\n\t\t\t\"type\": \"string\"\n\t\t},\n\t\t\"item\": {\n\t\t\t\"properties\": {\n\t\t\t\t\"type\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t},\n\t\t\t\t\"id\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t},\n\t\t\t\t\"sequence_id\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t},\n\t\t\t\t\"etag\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t},\n\t\t\t\t\"sha1\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t},\n\t\t\t\t\"name\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t}\n\t\t\t},\n\t\t\t\"type\": \"object\"\n\t\t},\n\t\t\"assigned_to\": {\n\t\t\t\"properties\": {\n\t\t\t\t\"type\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t},\n\t\t\t\t\"id\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t},\n\t\t\t\t\"name\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t},\n\t\t\t\t\"login\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t}\n\t\t\t},\n\t\t\t\"type\": \"object\"\n\t\t},\n\t\t\"message\": {\n\t\t\t\"type\": \"string\"\n\t\t},\n\t\t\"completed_at\": {\n\t\t\t\"type\": \"timestamp\"\n\t\t},\n\t\t\"assigned_at\": {\n\t\t\t\"type\": \"timestamp\"\n\t\t},\n\t\t\"reminded_at\": {\n\t\t\t\"type\": \"string\"\n\t\t},\n\t\t\"resolution_state\": {\n\t\t\t\"type\": \"string\"\n\t\t},\n\t\t\"assigned_by\": {\n\t\t\t\"properties\": {\n\t\t\t\t\"type\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t},\n\t\t\t\t\"id\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t},\n\t\t\t\t\"name\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t},\n\t\t\t\t\"login\": {\n\t\t\t\t\t\"type\": \"string\"\n\t\t\t\t}\n\t\t\t},\n\t\t\t\"type\": \"object\"\n\t\t}\n\t}\n}\n',
                            /* eslint-enable max-len */
                            type: 'string',
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
                    ])
                }),
                bodies: new Immutable.List([
                    new Body({
                        constraints: new Immutable.List([
                            new Parameter({
                                key: 'Content-Type',
                                type: 'string',
                                value: 'application/json'
                            })
                        ])
                    })
                ])
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

        this.assertJSONEqual(expected, result)
    }

    @targets('_extractURL')
    testExtractURL() {
        const [ parser, raml ] = this.__init('jukebox-api')
        const req = raml.resources[0].methods[0]
        const path = '/songs'

        const expected = new URL({
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
                format: 'sequence',
                value: new Immutable.List([
                    new Parameter({
                        key: 'subDomain',
                        type: 'string',
                        required: true,
                        internals: new Immutable.List([
                            new Constraint.Enum([ 'jukebox', 'live' ])
                        ]),
                        name: 'subDomain',
                        description: 'the sub-domain to hit'
                    }),
                    new Parameter({
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([ '.api.' ])
                        ])
                    }),
                    new Parameter({
                        key: 'extension',
                        type: 'string',
                        required: true,
                        name: 'extension',
                        description: 'the domain extension',
                        internals: new Immutable.List([
                            new Constraint.Enum([ 'com', 'io', 'jp' ])
                        ])
                    })
                ])
            }),
            pathname: new Parameter({
                key: 'pathname',
                type: 'string',
                internals: new Immutable.List([
                    new Constraint.Enum([ '/songs' ])
                ])
            })
        })

        const result = parser._extractURL(raml, req, path)

        this.assertJSONEqual(expected, result)
    }

    @targets('_extractSequenceParam')
    testExtractSequenceParam() {
        let parser = new ClassMock(new RAMLParser(), '')

        const raml = {
            version: 'v1'
        }

        const _sequence = '{version}.api.{extension}'
        const _key = 'host'
        const parameters = {
            extension: {
                description: 'the domain extension',
                enum: [ 'com', 'io', 'jp' ]
            }
        }

        let result = parser
            ._extractSequenceParam(raml, _sequence, _key, parameters)

        const expected = new Parameter({
            key: _key,
            type: 'string',
            format: 'sequence',
            value: new Immutable.List([
                new Parameter({
                    key: 'version',
                    type: 'string',
                    required: true,
                    internals: new Immutable.List([
                        new Constraint.Enum([ 'v1' ])
                    ])
                }),
                new Parameter({
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([ '.api.' ])
                    ])
                }),
                new Parameter({
                    key: 'extension',
                    required: true,
                    description: 'the domain extension',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            'com', 'io', 'jp'
                        ])
                    ])
                })
            ])
        })

        this.assertJSONEqual(expected, result)
    }

    @targets('_extractPaths')
    testExtractPathsWithSimpleSequence() {
        let parser = new ClassMock(new RAMLParser(), '')

        const url = new URL({
            pathname: new Parameter({
                key: 'pathname',
                type: 'string',
                format: 'sequence',
                value: new Immutable.List([
                    new Parameter({
                        key: 'userId',
                        type: 'string',
                        description: 'a user id'
                    })
                ])
            })
        })
        const container = new ParameterContainer()

        const expected = new ParameterContainer({
            path: new Immutable.List([
                new Parameter({
                    key: 'userId',
                    type: 'string',
                    description: 'a user id'
                })
            ])
        })

        const result = parser._extractPaths(url, container)

        this.assertJSONEqual(expected, result)
    }

    @targets('_extractPaths')
    testExtractPathsWithComplexSequence() {
        let parser = new ClassMock(new RAMLParser(), '')

        const url = new URL({
            pathname: new Parameter({
                key: 'pathname',
                type: 'string',
                format: 'sequence',
                value: new Immutable.List([
                    new Parameter({
                        type: 'string',
                        description: 'a user id',
                        internals: new Immutable.List([
                            new Constraint.Enum([ '/' ])
                        ])
                    }),
                    new Parameter({
                        key: 'userId',
                        type: 'string',
                        description: 'a user id'
                    }),
                    new Parameter({
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([ '/songs/' ])
                        ])
                    }),
                    new Parameter({
                        key: 'songId',
                        type: 'string',
                        description: 'a song id'
                    })
                ])
            })
        })
        const container = new ParameterContainer()

        const expected = new ParameterContainer({
            path: new Immutable.List([
                new Parameter({
                    key: 'userId',
                    type: 'string',
                    description: 'a user id'
                }),
                new Parameter({
                    key: 'songId',
                    type: 'string',
                    description: 'a song id'
                })
            ])
        })

        const result = parser._extractPaths(url, container)

        this.assertJSONEqual(expected, result)
    }

    @targets('_findReferences')
    testFindReferences() {
        let parser = new RAMLParser()
        let mockedParser = new ClassMock(parser, '')

        let raml = {
            user: {
                field: '::fileRef::somefile.json'
            }
        }

        mockedParser.item = new Item({
            file: {
                path: '/some/path',
                name: 'someRAMLfile.raml'
            }
        })

        let expected = new Immutable.List([
            new ExoticReference({
                uri: '/some/path/somefile.json',
                relative: 'somefile.json'
            })
        ])

        let result = mockedParser._findReferences(raml)

        this.assertEqual(expected, result)
    }

    @targets('_replaceReferences')
    testReplaceReferences() {
        let parser = new RAMLParser()
        let mockedParser = new ClassMock(parser, '')

        mockedParser.item = new Item({
            file: {
                path: '/some/path',
                name: 'someRAMLfile.raml'
            }
        })

        let raml = {
            user: {
                field: '::fileRef::somefile.json'
            }
        }

        let expected = {
            user: {
                field: new ExoticReference({
                    uri: '/some/path/somefile.json',
                    relative: 'somefile.json'
                })
            }
        }

        let result = mockedParser._replaceReferences(raml)

        this.assertEqual(expected, result)
    }

    @targets('_extractInfos')
    testExtractInfos() {
        let parser = new ClassMock(new RAMLParser(), '')

        const raml = {
            title: 'Test Title',
            version: 'v3',
            documentation: [
                {
                    title: 'Block #1',
                    content: 'content of Block #1'
                },
                {
                    title: 'Block #2',
                    content: 'content of Block #2'
                }
            ]
        }

        const expected = new Info({
            title: 'Test Title',
            version: 'v3',
            description: 'Block #1:\n' +
                'content of Block #1\n\n' +
                'Block #2:\n' +
                'content of Block #2\n\n'
        })

        const result = parser._extractInfos(raml)

        this.assertEqual(expected, result)
    }

    @targets('_createJSONSchemaReference')
    testCreateJSONSchemaReferenceWithFileReference() {
        let parser = new ClassMock(new RAMLParser(), '')

        let rel = '::fileRef::somefile.json'
        let item = new Item({
            file: {
                path: '/some/path',
                name: 'base.raml'
            }
        })

        let expected = new JSONSchemaReference({
            uri: '/some/path/somefile.json',
            relative: 'somefile.json'
        })

        let result = parser._createJSONSchemaReference(rel, item)

        this.assertEqual(expected, result)
    }

    @targets('_createJSONSchemaReference')
    testCreateJSONSchemaReferenceWithInnerReference() {
        let parser = new ClassMock(new RAMLParser(), '')

        let rel = 'someSchema'
        let item = new Item({
            file: {
                path: '/some/path',
                name: 'base.raml'
            }
        })

        let expected = new JSONSchemaReference({
            uri: '/some/path/base.raml#/someSchema',
            relative: '#/someSchema'
        })

        let result = parser._createJSONSchemaReference(rel, item)

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
