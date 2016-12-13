import {
    UnitTest,
    registerTest,
    targets,
    against
} from '../../../../utils/TestUtils'
import Immutable from 'immutable'
import fs from 'fs'

import SwaggerParser from '../Parser'

import {
    Body,
    Parameter
} from '../../../../models/Core'

import {
    Info, Contact, License
} from '../../../../models/Utils'

import Group from '../../../../models/Group'
import Constraint from '../../../../models/Constraint'
import Auth, { OAuth2Scope } from '../../../../models/Auth'
import Request from '../../../../models/Request'
import URL from '../../../../models/URL'
import Item from '../../../../models/Item'

import JSONSchemaReference from '../../../../models/references/JSONSchema'

import {
    ClassMock
} from '../../../../mocks/PawMocks'

import SwaggerFixtures from './fixtures/Parser-fixtures'

@registerTest
@against(SwaggerParser)
export class TestSwaggerParser extends UnitTest {

    @targets('_formatSequenceParam')
    testFormatSequenceParamWithSimpleParam() {
        const parser = this.__init()

        const simple = new Parameter({
            key: 'host',
            type: 'string',
            internals: new Immutable.List([
                new Constraint.Enum([
                    'test.com'
                ])
            ])
        })

        const expected = 'test.com'
        const result = parser._formatSequenceParam(simple)

        this.assertEqual(expected, result)
    }

    @targets('_formatSequenceParam')
    testFormatSequenceParamWithSequenceParam() {
        const parser = this.__init()

        const seq = new Parameter({
            key: 'pathname',
            type: 'string',
            format: 'sequence',
            value: new Immutable.List([
                new Parameter({
                    key: 'version',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            'v1.2', 'v2.0'
                        ])
                    ])
                }),
                new Parameter({
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            '/path/to/req'
                        ])
                    ])
                })
            ])
        })

        const expected = '{version}/path/to/req'
        const result = parser._formatSequenceParam(seq)

        this.assertEqual(expected, result)
    }

    @targets('_createTagGroupTree')
    testCreateTagGroupTreeWithUndefinedGroupStillReturnsAGroup() {
        const parser = this.__init()

        const group = { not: 'a Group' }
        const tagLists = []

        const expected = new Group({
            name: 'root'
        })

        const result = parser._createTagGroupTree(group, tagLists)

        this.assertEqual(expected, result)
    }

    @targets('_createTagGroupTree')
    testCreateTagGroupTreeWithSimpleTagList() {
        const parser = this.__init()

        const group = { not: 'a Group' }
        const tagLists = [
            { uuid: '1', tags: new Immutable.List([ 'pets' ]) }
        ]

        const expected = new Group({
            name: 'root',
            children: new Immutable.OrderedMap({
                pets: new Group({
                    name: 'pets',
                    children: new Immutable.OrderedMap({
                        1: '1'
                    })
                })
            })
        })

        const result = parser._createTagGroupTree(group, tagLists)

        this.assertEqual(expected, result)
    }

    @targets('_createTagGroupTree')
    testCreateTagGroupTreeWithRichTagListUsesFirstTag() {
        const parser = this.__init()

        const group = { not: 'a Group' }
        const tagLists = [
            { uuid: '1', tags: new Immutable.List([ 'pets', 'store' ]) }
        ]

        const expected = new Group({
            name: 'root',
            children: new Immutable.OrderedMap({
                pets: new Group({
                    name: 'pets',
                    children: new Immutable.OrderedMap({
                        1: '1'
                    })
                })
            })
        })

        const result = parser._createTagGroupTree(group, tagLists)

        this.assertEqual(expected, result)
    }

    @targets('_createTagGroupTree')
    testCreateTagGroupTreeWithNoTagList() {
        const parser = this.__init()

        const group = { not: 'a Group' }
        const tagLists = [
            { uuid: '1', tags: new Immutable.List() }
        ]

        const expected = new Group({
            name: 'root',
            children: new Immutable.OrderedMap({
                Uncategorized: new Group({
                    name: 'Uncategorized',
                    children: new Immutable.OrderedMap({
                        1: '1'
                    })
                })
            })
        })

        const result = parser._createTagGroupTree(group, tagLists)

        this.assertEqual(expected, result)
    }

    @targets('_createTagGroupTree')
    testCreateTagGroupTreeWithMultipleTagLists() {
        const parser = this.__init()

        const group = { not: 'a Group' }
        const tagLists = [
            { uuid: '1', tags: new Immutable.List([ 'pets', 'store' ]) },
            { uuid: '2', tags: new Immutable.List([ 'store' ]) },
            { uuid: '3', tags: new Immutable.List([ 'pets' ]) },
            { uuid: '4', tags: new Immutable.List() },
            { uuid: '5', tags: new Immutable.List() }
        ]

        const expected = new Group({
            name: 'root',
            children: new Immutable.OrderedMap({
                pets: new Group({
                    name: 'pets',
                    children: new Immutable.OrderedMap({
                        1: '1',
                        3: '3'
                    })
                }),
                store: new Group({
                    name: 'store',
                    children: new Immutable.OrderedMap({
                        2: '2'
                    })
                }),
                Uncategorized: new Group({
                    name: 'Uncategorized',
                    children: new Immutable.OrderedMap({
                        4: '4',
                        5: '5'
                    })
                })
            })
        })

        const result = parser._createTagGroupTree(group, tagLists)

        this.assertEqual(expected, result)
    }

    @targets('_createPathGroupTree')
    testCreatePathGroupTreeWithUndefinedGroupStillReturnsAGroup() {
        const parser = this.__init()

        const group = { not: 'a Group' }
        const paths = []

        const expected = new Group({
            name: 'root'
        })

        const result = parser._createPathGroupTree(group, paths)

        this.assertEqual(expected, result)
    }

    @targets('_createPathGroupTree')
    testCreatePathGroupTreeWithSimplePathList() {
        const parser = this.__init()

        const group = { not: 'a Group' }
        const paths = [
            { uuid: '1', path: '/test', method: 'get' }
        ]

        const expected = new Group({
            name: 'root',
            children: new Immutable.OrderedMap({
                '/test': new Group({
                    name: '/test',
                    children: new Immutable.OrderedMap({
                        get: '1'
                    })
                })
            })
        })

        const result = parser._createPathGroupTree(group, paths)

        this.assertEqual(expected, result)
    }

    @targets('_createPathGroupTree')
    testCreatePathGroupTreeWithSharedPathList() {
        const parser = this.__init()

        const group = { not: 'a Group' }
        const paths = [
            { uuid: '1', path: '/test', method: 'get' },
            { uuid: '2', path: '/test', method: 'post' }
        ]

        const expected = new Group({
            name: 'root',
            children: new Immutable.OrderedMap({
                '/test': new Group({
                    name: '/test',
                    children: new Immutable.OrderedMap({
                        get: '1',
                        post: '2'
                    })
                })
            })
        })

        const result = parser._createPathGroupTree(group, paths)

        this.assertEqual(expected, result)
    }

    @targets('_createPathGroupTree')
    testCreatePathGroupTreeWithLongPathList() {
        const parser = this.__init()

        const group = { not: 'a Group' }
        const paths = [
            { uuid: '1', path: '/test/deep', method: 'get' }
        ]

        const expected = new Group({
            name: 'root',
            children: new Immutable.OrderedMap({
                '/test': new Group({
                    name: '/test',
                    children: new Immutable.OrderedMap({
                        '/deep': new Group({
                            name: '/deep',
                            children: new Immutable.OrderedMap({
                                get: '1'
                            })
                        })
                    })
                })
            })
        })

        const result = parser._createPathGroupTree(group, paths)

        this.assertEqual(expected, result)
    }

    @targets('_createPathGroupTree')
    testCreatePathGroupTreeWithComplexPathList() {
        const parser = this.__init()

        const group = { not: 'a Group' }
        const paths = [
            { uuid: '1', path: '/test/deep', method: 'get' },
            { uuid: '2', path: '/test/deep', method: 'post' },
            { uuid: '3', path: '/test/get', method: 'put' },
            { uuid: '4', path: '/test', method: 'get' }
        ]

        const expected = new Group({
            name: 'root',
            children: new Immutable.OrderedMap({
                '/test': new Group({
                    name: '/test',
                    children: new Immutable.OrderedMap({
                        '/deep': new Group({
                            name: '/deep',
                            children: new Immutable.OrderedMap({
                                get: '1',
                                post: '2'
                            })
                        }),
                        '/get': new Group({
                            name: '/get',
                            children: new Immutable.OrderedMap({
                                put: '3'
                            })
                        }),
                        get: '4'
                    })
                })
            })
        })

        const result = parser._createPathGroupTree(group, paths)

        this.assertEqual(expected, result)
    }

    @targets('_createGroupTree')
    testCreateGroupTreeCallsCreateTagGroupTreeIfTags() {
        const parser = new ClassMock(new SwaggerParser(), '')

        parser.spyOn('_createTagGroupTree', () => 12)

        const group = new Group({
            name: 'root'
        })

        const requestMap = {
            1: new Request({
                tags: new Immutable.List([ 'pets' ])
            }),
            2: new Request({
                tags: new Immutable.List([ 'store' ])
            })
        }

        const expected = 12
        const result = parser._createGroupTree(group, requestMap)

        this.assertEqual(parser.spy._createTagGroupTree.count, 1)
        this.assertEqual(result, expected)
    }

    @targets('_createGroupTree')
    testCreateGroupTreeCallsFormatSequenceParamForEachURLIfNotEnoughTags() {
        const parser = new ClassMock(new SwaggerParser(), '')

        parser.spyOn('_formatSequenceParam', () => 42)
        parser.spyOn('_createPathGroupTree', () => 12)
        parser.spyOn('_createTagGroupTree', () => 90)

        const group = new Group({
            name: 'root'
        })

        const requestMap = {
            1: new Request({
                tags: new Immutable.List([ 'pets' ])
            }),
            2: new Request(),
            3: new Request()
        }

        const expected = 12
        const result = parser._createGroupTree(group, requestMap)

        this.assertEqual(parser.spy._formatSequenceParam.count, 3)
        this.assertEqual(result, expected)
    }

    @targets('_createGroupTree')
    testCreateGroupTreeCallsCreatePathGroupTreeIfNotEnoughTags() {
        const parser = new ClassMock(new SwaggerParser(), '')

        parser.spyOn('_formatSequenceParam', () => 42)
        parser.spyOn('_createPathGroupTree', () => 12)
        parser.spyOn('_createTagGroupTree', () => 90)

        const group = new Group({
            name: 'root'
        })

        const requestMap = {
            1: new Request({
                tags: new Immutable.List([ 'pets' ])
            }),
            2: new Request(),
            3: new Request()
        }

        const expected = 12
        const result = parser._createGroupTree(group, requestMap)

        this.assertEqual(parser.spy._createTagGroupTree.count, 0)
        this.assertEqual(parser.spy._createPathGroupTree.count, 1)
        this.assertEqual(result, expected)
    }

    @targets('_createGroupTree')
    testSimpleGroupTree() {
        const parser = new SwaggerParser()

        const request = new Request({
            method: 'get',
            url: new URL({
                pathname: '/test'
            })
        })

        const requestMap = {
            123: request
        }

        const inputGroup = new Group({
            name: 'testRoot'
        })

        const expected = new Group({
            name: 'testRoot',
            children: new Immutable.OrderedMap({
                '/test': new Group({
                    name: '/test',
                    children: new Immutable.OrderedMap({
                        get: '123'
                    })
                })
            })
        })

        const result = parser._createGroupTree(inputGroup, requestMap)
        this.assertEqual(result, expected)
    }

    @targets('_createGroupTree')
    testMultipleMethodsGroupTree() {
        const parser = new SwaggerParser()

        const getReq = new Request({
            method: 'get',
            url: new URL({
                pathname: '/test'
            })
        })

        const postReq = new Request({
            method: 'post',
            url: new URL({
                pathname: '/test'
            })
        })

        const requestMap = {
            123: getReq,
            321: postReq
        }

        const inputGroup = new Group({
            name: 'testRoot'
        })

        const expected = new Group({
            name: 'testRoot',
            children: new Immutable.OrderedMap({
                '/test': new Group({
                    name: '/test',
                    children: new Immutable.OrderedMap({
                        get: '123',
                        post: '321'
                    })
                })
            })
        })

        const result = parser._createGroupTree(inputGroup, requestMap)
        this.assertEqual(result, expected)
    }

    @targets('_createGroupTree')
    testMultiplePathsGroupTree() {
        const parser = new SwaggerParser()

        const getReq = new Request({
            method: 'get',
            url: new URL({
                pathname: '/test'
            })
        })

        const postReq = new Request({
            method: 'post',
            url: new URL({
                pathname: '/another'
            })
        })

        const requestMap = {
            123: getReq,
            321: postReq
        }

        const inputGroup = new Group({
            name: 'testRoot'
        })

        const expected = new Group({
            name: 'testRoot',
            children: new Immutable.OrderedMap({
                '/test': new Group({
                    name: '/test',
                    children: new Immutable.OrderedMap({
                        get: '123'
                    })
                }),
                '/another': new Group({
                    name: '/another',
                    children: new Immutable.OrderedMap({
                        post: '321'
                    })
                })
            })
        })

        const result = parser._createGroupTree(inputGroup, requestMap)
        this.assertEqual(result, expected)
    }

    @targets('_createGroupTree')
    testLongPathGroupTree() {
        const parser = new SwaggerParser()

        const request = new Request({
            method: 'get',
            url: new URL({
                pathname: '/path/to/test'
            })
        })

        const requestMap = {
            123: request
        }

        const inputGroup = new Group({
            name: 'testRoot'
        })

        const expected = new Group({
            name: 'testRoot',
            children: new Immutable.OrderedMap({
                '/path': new Group({
                    name: '/path',
                    children: new Immutable.OrderedMap({
                        '/to': new Group({
                            name: '/to',
                            children: new Immutable.OrderedMap({
                                '/test': new Group({
                                    name: '/test',
                                    children: new Immutable.OrderedMap({
                                        get: '123'
                                    })
                                })
                            })
                        })
                    })
                })
            })
        })

        const result = parser._createGroupTree(inputGroup, requestMap)
        this.assertEqual(result, expected)
    }

    @targets('_createGroupTree')
    testRequestAndGroupOnSameDepthGroupTree() {
        const parser = new SwaggerParser()

        const getReq = new Request({
            method: 'get',
            url: new URL({
                pathname: '/test'
            })
        })

        const postReq = new Request({
            method: 'post',
            url: new URL({
                pathname: '/test/nested'
            })
        })

        const requestMap = {
            123: getReq,
            321: postReq
        }

        const inputGroup = new Group({
            name: 'testRoot'
        })

        const expected = new Group({
            name: 'testRoot',
            children: new Immutable.OrderedMap({
                '/test': new Group({
                    name: '/test',
                    children: new Immutable.OrderedMap({
                        get: '123',
                        '/nested': new Group({
                            name: '/nested',
                            children: new Immutable.OrderedMap({
                                post: '321'
                            })
                        })
                    })
                })
            })
        })

        const result = parser._createGroupTree(inputGroup, requestMap)
        this.assertEqual(result, expected)
    }

    @targets('_createGroupTree')
    testPathCanContainMethodKeywords() {
        const parser = new SwaggerParser()

        const request = new Request({
            method: 'get',
            url: new URL({
                pathname: '/get/test'
            })
        })

        const requestMap = {
            123: request
        }

        const inputGroup = new Group({
            name: 'testRoot'
        })

        const expected = new Group({
            name: 'testRoot',
            children: new Immutable.OrderedMap({
                '/get': new Group({
                    name: '/get',
                    children: new Immutable.OrderedMap({
                        '/test': new Group({
                            name: '/test',
                            children: new Immutable.OrderedMap({
                                get: '123'
                            })
                        })
                    })
                })
            })
        })

        const result = parser._createGroupTree(inputGroup, requestMap)
        this.assertEqual(result, expected)
    }

    @targets('_createGroupTree')
    testMethodKeywordsDoNotCauseConflict() {
        const parser = new SwaggerParser()


        const getReq = new Request({
            method: 'get',
            url: new URL({
                pathname: '/test'
            })
        })

        const postReq = new Request({
            method: 'post',
            url: new URL({
                pathname: '/test/get'
            })
        })

        const requestMap = {
            123: getReq,
            321: postReq
        }

        const inputGroup = new Group({
            name: 'testRoot'
        })

        const expected = new Group({
            name: 'testRoot',
            children: new Immutable.OrderedMap({
                '/test': new Group({
                    name: '/test',
                    children: new Immutable.OrderedMap({
                        get: '123',
                        '/get': new Group({
                            name: '/get',
                            children: new Immutable.OrderedMap({
                                post: '321'
                            })
                        })
                    })
                })
            })
        })

        const result = parser._createGroupTree(inputGroup, requestMap)
        this.assertEqual(result, expected)
    }

    @targets('_loadSwaggerCollection')
    testLoadSwaggerCollectionWithValidFiles() {
        const parser = new SwaggerParser()
        const filenames = SwaggerFixtures.getValidFilenames()
        try {
            for (let filename of filenames) {
                let content = this.__loadSwaggerFile(
                    filename.name,
                    filename.extension
                )
                parser._loadSwaggerCollection(content)
            }
        }
        catch (e) {
            this.assertTrue(false)
        }

        this.assertTrue(true)
    }

    @targets('_loadSwaggerCollection')
    testLoadSwaggerCollectionWithInvalidFiles() {
        const parser = new SwaggerParser()
        const filenames = SwaggerFixtures.getMalformedFilenames()

        for (let filename of filenames) {
            try {
                let content = this.__loadSwaggerFile(
                    filename.name,
                    filename.extension
                )
                parser._loadSwaggerCollection(content)
                this.assertTrue(false)
            }
            catch (e) {
                this.assertTrue(true)
            }
        }
    }

    @targets('_validateSwaggerCollection')
    testValidateSwaggerCollectionWithValidCollections() {
        const parser = new SwaggerParser()
        const filenames = SwaggerFixtures.getValidFilenames()
        for (let filename of filenames) {
            let content = this.__loadSwaggerFile(
                filename.name,
                filename.extension
            )
            let swaggerCollection = parser._loadSwaggerCollection(content)
            let valid = parser._validateSwaggerCollection(swaggerCollection)
            this.assertTrue(valid)
        }
    }

    @targets('_validateSwaggerCollection')
    testValidateSwaggerCollectionWithInvalidCollections() {
        const parser = new SwaggerParser()
        const filenames = SwaggerFixtures.getNonCompliantFilenames()
        for (let filename of filenames) {
            let content = this.__loadSwaggerFile(
                filename.name,
                filename.extension
            )
            let swaggerCollection = parser._loadSwaggerCollection(content)
            let valid = parser._validateSwaggerCollection(swaggerCollection)
            this.assertFalse(valid)
        }
    }

    @targets('parse')
    testParseShouldThrowOnInvalidSwaggerCollection() {
        const parser = new SwaggerParser()
        const content = this.__loadSwaggerFile('bad-schema')

        try {
            parser.parse(content)
            // should never be reached
            this.assertTrue(false)
        }
        catch (e) {
            this.assertTrue(true)
        }
    }

    @targets('_extractRequests')
    test_extractRequestsCallsCreateRequestForEachPathMethodPair() {
        const parser = new ClassMock(new SwaggerParser(), '')

        parser.spyOn('_createRequest', () => true)

        const collection = {
            paths: {
                '/test': {
                    get: {
                        dummy: 'content'
                    },
                    post: {
                        another: 'dummy content'
                    }
                },
                '/test/nested': {
                    get: {
                        useless: 'content'
                    }
                }
            }
        }

        const expected = 3

        parser._extractRequests(collection)
        this.assertEqual(parser.spy._createRequest.count, expected)
    }

    @targets('_extractRequests')
    testExtractRequestsCallsCreateRequestWithCorrectArgs() {
        const parser = new ClassMock(new SwaggerParser(), '')

        parser.spyOn('_createRequest', (coll, path, method, content) => {
            this.assertEqual(coll.paths[path][method], content)
        })

        const collection = {
            paths: {
                '/test': {
                    get: {
                        dummy: 'content'
                    },
                    post: {
                        another: 'dummy content'
                    }
                },
                '/test/nested': {
                    get: {
                        useless: 'content'
                    }
                }
            }
        }

        parser._extractRequests(collection)
    }

    @targets('_extractRequests')
    testExtractRequestsStoresRequestInMapUsingUUID() {
        const parser = new ClassMock(new SwaggerParser(), '')

        let count = 0
        parser.spyOn('_uuid', () => {
            count += 1
            return count
        })

        parser.spyOn('_createRequest', () => 12 * count)

        const collection = {
            paths: {
                '/test': {
                    get: {
                        value: 12
                    },
                    post: {
                        value: 21
                    }
                },
                '/test/nested': {
                    get: {
                        value: 45
                    }
                }
            }
        }

        const expected = {
            1: 0,
            2: 12,
            3: 24
        }

        const result = parser._extractRequests(collection)

        this.assertEqual(expected, result)
    }

    @targets('_extractRequests')
    testExtractRequestsDealsWithParametersMethod() {
        const parser = new ClassMock(new SwaggerParser(), '')

        parser.spyOn('_getParameters', () => {
            return [
                {
                    name: 'test',
                    in: 'query'
                }
            ]
        })

        parser.spyOn('_createRequest', (coll, path, method, content) => {
            let _result = {
                value: content.value * 2
            }

            if (content.parameters) {
                _result.parameters = content.parameters
            }

            return _result
        })

        let count = 0
        parser.spyOn('_uuid', () => {
            count += 1
            return count
        })

        const collection = {
            paths: {
                '/test': {
                    get: {
                        value: 12
                    },
                    post: {
                        value: 21
                    },
                    parameters: [
                        {
                            $ref: '#/parameters/ApiKey'
                        }
                    ]
                },
                '/test/nested': {
                    get: {
                        value: 45
                    }
                }
            }
        }

        const expected = {
            1: {
                value: 24,
                parameters: [
                    {
                        name: 'test',
                        in: 'query'
                    }
                ]
            },
            2: {
                value: 42,
                parameters: [
                    {
                        name: 'test',
                        in: 'query'
                    }
                ]
            },
            3: {
                value: 90
            }
        }

        const result = parser._extractRequests(collection)

        this.assertEqual(expected, result)
        this.assertEqual(parser.spy._getParameters.count, 1)
    }

    @targets('_extractRequests')
    testExtractRequestsUpdatesMethodParams() {
        const parser = new ClassMock(new SwaggerParser(), '')

        parser.spyOn('_createRequest', (coll, path, method, content) => {
            let _result = {
                value: content.value * 2
            }

            if (content.parameters) {
                _result.parameters = content.parameters
            }

            return _result
        })

        let count = 0
        parser.spyOn('_uuid', () => {
            count += 1
            return count
        })

        const collection = {
            paths: {
                '/test': {
                    get: {
                        value: 12
                    },
                    post: {
                        value: 21
                    }
                },
                '/test/nested': {
                    parameters: [
                        {
                            name: 'alt',
                            in: 'query'
                        }
                    ],
                    get: {
                        value: 45
                    }
                }
            }
        }

        const expected = {
            1: {
                value: 24
            },
            2: {
                value: 42
            },
            3: {
                value: 90,
                parameters: [
                    {
                        name: 'alt',
                        in: 'query'
                    }
                ]
            }
        }

        const result = parser._extractRequests(collection)

        this.assertEqual(expected, result)
    }

    @targets('_extractRequests')
    testExtractParamsUpdatesMethodParamsWithOverride() {
        const parser = new ClassMock(new SwaggerParser(), '')

        parser.spyOn('_createRequest', (coll, path, method, content) => {
            let _result = {
                value: content.value * 2
            }

            if (content.parameters) {
                _result.parameters = content.parameters
            }

            return _result
        })

        let count = 0
        parser.spyOn('_uuid', () => {
            count += 1
            return count
        })

        const collection = {
            paths: {
                '/test': {
                    get: {
                        value: 12
                    },
                    post: {
                        value: 21
                    }
                },
                '/test/nested': {
                    parameters: [
                        {
                            name: 'alt',
                            in: 'query'
                        }, {
                            name: 'fields',
                            in: 'body',
                            example: 'ignored'
                        }
                    ],
                    get: {
                        value: 45,
                        parameters: [
                            {
                                name: 'fields',
                                in: 'path'
                            }
                        ]
                    }
                }
            }
        }

        const expected = {
            1: {
                value: 24
            },
            2: {
                value: 42
            },
            3: {
                value: 90,
                parameters: [
                    {
                        name: 'alt',
                        in: 'query'
                    }, {
                        name: 'fields',
                        in: 'path'
                    }
                ]
            }
        }

        const result = parser._extractRequests(collection)

        this.assertEqual(expected, result)
    }

    @targets('_uuid')
    testUUIDisv4() {
        const parser = new SwaggerParser()

        /* eslint-disable max-len */
        const expectedPattern = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
        /* eslint-enable max-len */

        const result = parser._uuid()
        this.assertTrue(!!result.match(expectedPattern))
    }

    @targets('_setTagsAndId')
    testSetTagsAndIdyWithTagsAndId() {
        const parser = new SwaggerParser()
        const request = new Request()
        const content = {
            tags: [ 'dummy', 'tag', 'list' ],
            operationId: 'ae256'
        }

        const result = parser._setTagsAndId(request, content)

        this.assertEqual(result.get('tags'), content.tags)
        this.assertEqual(result.get('id'), content.operationId)
    }

    @targets('_setTagsAndId')
    testSetTagsAndIdyWithNoTagsOrId() {
        const parser = new SwaggerParser()
        const request = new Request()
        const content = {
        }

        const result = parser._setTagsAndId(request, content)

        this.assertEqual(result.get('tags'), [])
        this.assertEqual(result.get('id'), null)
    }

    @targets('_setSummary')
    testSetSummaryWithASummaryContent() {
        const parser = new SwaggerParser()
        const request = new Request()
        const path = '/test/path'
        const content = {
            summary: 'dummy summary'
        }

        const result = parser._setSummary(request, path, content)

        this.assertEqual(result.get('name'), content.summary)
    }

    @targets('_setSummary')
    testSetSummaryWithNoSummaryContent() {
        const parser = new SwaggerParser()
        const request = new Request()
        const path = '/test/path'
        const content = {
            notSummary: 'dummy summary'
        }

        const result = parser._setSummary(request, path, content)

        this.assertEqual(result.get('name'), path)
    }

    @targets('_setDescription')
    testSetDescriptionWithADescriptionContent() {
        const parser = new SwaggerParser()
        const request = new Request()
        const content = {
            description: 'dummy description'
        }

        const result = parser._setDescription(request, content)

        this.assertEqual(result.get('description'), content.description)
    }

    @targets('_setDescription')
    testSetDescriptionWithNoDescriptionContent() {
        const parser = new SwaggerParser()
        const request = new Request()
        const content = {
            notDescription: 'dummy description'
        }

        const result = parser._setDescription(request, content)

        this.assertEqual(result.get('description'), null)
    }

    @targets('_extractParams')
    testExtractParamsThrowsOnBadlyFormedParameter() {
        const parser = new SwaggerParser()
        const cases = SwaggerFixtures.getThrowingParametersCases()
        this.__warnProgress('ExtractParamsThrowsOnBadlyFormedParameter', true)
        for (let usecase of cases) {
            this.__warnProgress(usecase.name)
            try {
                parser._extractParams.apply(parser, usecase.inputs)
                this.assertTrue(false)
            }
            catch (e) {
                this.assertTrue(true)
            }
        }
    }

    @targets('_extractParams')
    testExtractParamsCallsGetParameters() {
        const parser = this.__init()

        const collection = {
            value: 12
        }

        const parameters = [ 1, 2, 3, 4 ]

        const content = {
            value: 42,
            parameters: parameters
        }

        parser.spyOn('_getParameters', (_collection, _parameters) => {
            this.assertEqual(collection, _collection)
            this.assertEqual(parameters, _parameters)
            return []
        })

        parser._extractParams(collection, content)

        this.assertEqual(parser.spy._getParameters.count, 1)
    }

    @targets('_extractParams')
    testExtractParamsCallsExtractContentTypes() {
        const parser = this.__init()

        const collection = {
            value: 12
        }
        const content = {
            value: 42
        }

        parser.spyOn('_extractContentTypes', (_collection, _content) => {
            this.assertEqual(collection, _collection)
            this.assertEqual(content, _content)
            return []
        })

        parser._extractParams(collection, content)

        this.assertEqual(parser.spy._extractContentTypes.count, 1)
    }

    @targets('_extractParams')
    testExtractParamsCallsExtractExternals() {
        const parser = this.__init()

        const collection = {
            value: 12
        }
        const content = {
            value: 42
        }

        parser.spyOn('_extractExternals', (_collection, _content) => {
            this.assertEqual(collection, _collection)
            this.assertEqual(content, _content)
            return new Immutable.List()
        })

        parser._extractParams(collection, content)

        this.assertEqual(parser.spy._extractExternals.count, 1)
    }

    @targets('_extractParams')
    testExtractParams() {
        this.__loadTestSuite('ExtractParams', '_extractParams')
    }

    @targets('_extractResponses')
    testExtractResponses() {
        this.__loadTestSuite('ExtractResponses', '_extractResponses')
    }

    @targets('_setBasicInfo')
    testSetBasicInfo() {
        this.__loadTestSuite('SetBasicInfo', '_setBasicInfo')
    }

    @targets('_setAuth')
    testSetAuth() {
        this.__loadTestSuite('SetAuth', '_setAuth')
    }

    @targets('_createRequest')
    testCreateRequest() {
        this.__loadTestSuite('CreateRequest', '_createRequest')
    }

    @targets('_extractContextInfo')
    testExtractContextInfo() {
        const parser = this.__init()

        const info = {
            description: 'This is a sample server Petstore server',
            version: '1.0.0',
            title: 'Swagger Petstore',
            termsOfService: 'http://helloreverb.com/terms/',
            contact: {
                name: 'apiteam@wordnik.com'
            },
            license: {
                name: 'Apache 2.0',
                url: 'http://www.apache.org/licenses/LICENSE-2.0.html'
            }
        }

        const expected = new Info({
            title: 'Swagger Petstore',
            version: '1.0.0',
            description: 'This is a sample server Petstore server',
            tos: 'http://helloreverb.com/terms/',
            contact: new Contact({
                name: 'apiteam@wordnik.com'
            }),
            license: new License({
                name: 'Apache 2.0',
                url: 'http://www.apache.org/licenses/LICENSE-2.0.html'
            })
        })

        const result = parser._extractContextInfo(info)

        this.assertEqual(expected, result)
    }

    @targets('_setBasicAuth')
    testSetBasicAuth() {
        const parser = this.__init()

        const expected = new Auth.Basic()

        const result = parser._setBasicAuth()

        this.assertEqual(expected, result)
    }

    @targets('_setApiKeyAuth')
    testSetApiKeyAuth() {
        const parser = this.__init()

        const input = Immutable.fromJS({
            in: 'header',
            name: 'api-key'
        })

        const expected = new Auth.ApiKey({
            authName: 'api_key',
            in: 'header',
            name: 'api-key'
        })

        const result = parser._setApiKeyAuth('api_key', input)

        this.assertEqual(expected, result)
    }

    @targets('_setOAuth2Scopes')
    testSetOAuth2Scopes() {
        const parser = this.__init()

        const scopes = [ 'read:any', 'write:own' ]

        const expected = new Immutable.List([
            new OAuth2Scope({
                value: 'read:any'
            }),
            new OAuth2Scope({
                value: 'write:own'
            })
        ])

        const result = parser._setOAuth2Scopes(scopes)

        this.assertEqual(result, expected)
    }

    @targets('_setOAuth2Auth')
    testSetOAuth2AuthWithSimpleDefinition() {
        const parser = this.__init()

        const input = Immutable.fromJS({
            flow: 'implicit',
            authorizationUrl: 'fakeurl.com/auth',
            tokenUrl: 'fakeurl.com/token',
            scopes: [ 'read:any', 'write:own' ]
        })

        const expected = new Auth.OAuth2({
            authName: 'petstore_auth',
            flow: 'implicit',
            authorizationUrl: 'fakeurl.com/auth',
            tokenUrl: 'fakeurl.com/token',
            scopes: new Immutable.List([ 'read:any', 'write:own' ])
        })

        const result = parser._setOAuth2Auth('petstore_auth', input)

        this.assertEqual(expected, result)
    }

    @targets('_updateParametersInMethod')
    testUpdateParametersInMethodWithOnlyBaseParams() {
        const parser = this.__init()
        const base = [
            {
                name: 'param#1',
                value: 'content'
            },
            {
                name: 'param#2',
                value: 'Ipsum'
            }
        ]

        const result = parser._updateParametersInMethod({}, base)

        this.assertEqual(base, result)
    }

    @targets('_updateParametersInMethod')
    testUpdateParametersInMethodWithOnlyContentParams() {
        const parser = this.__init()
        const content = {
            parameters: [
                {
                    name: 'param#1',
                    value: 'content'
                },
                {
                    name: 'param#2',
                    value: 'Ipsum'
                }
            ]
        }

        const result = parser._updateParametersInMethod(content, null)

        this.assertEqual(content.parameters, result)
    }

    @targets('_updateParametersInMethod')
    testUpdateParametersInMethodWithAllParams() {
        const parser = this.__init()
        const base = [
            {
                name: 'param#1',
                value: 'overriden'
            },
            {
                name: 'param#2',
                value: 'super'
            }
        ]
        const content = {
            parameters: [
                {
                    name: 'param#1',
                    value: 'content'
                },
                {
                    name: 'param#3',
                    value: 'Ipsum'
                }
            ]
        }

        const expected = [
            {
                name: 'param#1',
                value: 'content'
            },
            {
                name: 'param#2',
                value: 'super'
            },
            {
                name: 'param#3',
                value: 'Ipsum'
            }
        ]

        const result = parser._updateParametersInMethod(content, base)

        this.assertEqual(expected, result)
    }

    @targets('_getParameters')
    testGetParameters() {
        const parser = this.__init()

        const collection = {
            parameters: {
                skipParam: {
                    name: 'skip',
                    in: 'query',
                    description: 'number of items to skip',
                    required: true,
                    type: 'integer',
                    format: 'int32'
                },
                limitParam: {
                    name: 'limit',
                    in: 'query',
                    description: 'max records to return',
                    required: true,
                    type: 'integer',
                    format: 'int32'
                }
            }
        }

        const params = [
            {
                $ref: '#/parameters/limitParam'
            },
            {
                name: 'skip',
                in: 'query',
                description: 'number of items to skip',
                required: true,
                type: 'integer',
                format: 'int32',
                minimum: 0,
                maximum: 100
            }
        ]

        const expected = [
            {
                name: 'limit',
                in: 'query',
                description: 'max records to return',
                required: true,
                type: 'integer',
                format: 'int32'
            },
            {
                name: 'skip',
                in: 'query',
                description: 'number of items to skip',
                required: true,
                type: 'integer',
                format: 'int32',
                minimum: 0,
                maximum: 100
            }
        ]

        const result = parser._getParameters(collection, params)

        this.assertEqual(expected, result)
    }

    @targets('_extractUrlInfo')
    testExtractUrlInfoNoContentSchemes() {
        const parser = this.__init()

        const collection = {
            schemes: [ 'http', 'https' ],
            host: 'echo.luckymarmot.com',
            basePath: '/tests'
        }
        const path = '/path/to/request'
        const content = {}

        const expected = new URL({
            protocol: new Parameter({
                key: 'protocol',
                type: 'string',
                internals: new Immutable.List([
                    new Constraint.Enum([
                        'http', 'https'
                    ])
                ])
            }),
            host: new Parameter({
                key: 'host',
                type: 'string',
                internals: new Immutable.List([
                    new Constraint.Enum([
                        'echo.luckymarmot.com'
                    ])
                ])
            }),
            pathname: new Parameter({
                key: 'pathname',
                type: 'string',
                internals: new Immutable.List([
                    new Constraint.Enum([
                        '/tests/path/to/request'
                    ])
                ])
            })
        })

        const result = parser._extractUrlInfo(collection, path, content)

        this.assertJSONEqual(expected, result)
    }

    @targets('_extractUrlInfo')
    testExtractUrlInfoWithContentSchemes() {
        const parser = this.__init()

        const collection = {
            schemes: [ 'http', 'https' ],
            host: 'echo.luckymarmot.com',
            basePath: '/tests'
        }
        const path = '/path/to/request'
        const content = {
            schemes: [ 'https' ]
        }

        const expected = new URL({
            protocol: new Parameter({
                key: 'protocol',
                type: 'string',
                internals: new Immutable.List([
                    new Constraint.Enum([
                        'https'
                    ])
                ])
            }),
            host: new Parameter({
                key: 'host',
                type: 'string',
                internals: new Immutable.List([
                    new Constraint.Enum([
                        'echo.luckymarmot.com'
                    ])
                ])
            }),
            pathname: new Parameter({
                key: 'pathname',
                type: 'string',
                internals: new Immutable.List([
                    new Constraint.Enum([
                        '/tests/path/to/request'
                    ])
                ])
            })
        })

        const result = parser._extractUrlInfo(collection, path, content)

        this.assertJSONEqual(expected, result)
    }

    @targets('_extractUrlInfo')
    testExtractUrlInfoWithParameters() {
        const parser = this.__init()

        const collection = {
            schemes: [ 'http', 'https' ],
            host: 'echo.luckymarmot.com',
            basePath: '/tests'
        }
        const path = '/{userId}/songs/{songId}'
        const content = {
            schemes: [ 'https' ],
            parameters: [
                {
                    in: 'path',
                    type: 'integer',
                    minimum: 0,
                    maximum: 1000,
                    name: 'userId'
                }
            ]
        }

        const expected = new URL({
            protocol: new Parameter({
                key: 'protocol',
                type: 'string',
                internals: new Immutable.List([
                    new Constraint.Enum([
                        'https'
                    ])
                ])
            }),
            host: new Parameter({
                key: 'host',
                type: 'string',
                internals: new Immutable.List([
                    new Constraint.Enum([
                        'echo.luckymarmot.com'
                    ])
                ])
            }),
            pathname: new Parameter({
                key: 'pathname',
                type: 'string',
                format: 'sequence',
                value: new Immutable.List([
                    new Parameter({
                        type: 'string',
                        value: '/tests/',
                        internals: new Immutable.List([
                            new Constraint.Enum([ '/tests/' ])
                        ])
                    }),
                    new Parameter({
                        key: 'userId',
                        name: 'userId',
                        type: 'integer',
                        required: true,
                        internals: new Immutable.List([
                            new Constraint.Minimum(0),
                            new Constraint.Maximum(1000)
                        ])
                    }),
                    new Parameter({
                        type: 'string',
                        value: '/songs/',
                        internals: new Immutable.List([
                            new Constraint.Enum([ '/songs/' ])
                        ])
                    }),
                    new Parameter({
                        key: 'songId',
                        type: 'string',
                        required: true,
                        value: '{songId}',
                        internals: new Immutable.List([
                            new Constraint.Enum([ '{songId}' ])
                        ])
                    })
                ])
            })
        })

        const result = parser._extractUrlInfo(collection, path, content)

        this.assertJSONEqual(expected, result)
    }

    @targets('_extractResponseBodies')
    testExtractResponseBodiesOnlyCollection() {
        const parser = this.__init()

        const collection = {
            produces: [
                'app/json',
                'app/xml'
            ]
        }
        const content = {}

        const expected = new Immutable.List([
            new Body({
                constraints: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        type: 'string',
                        value: 'app/json'
                    })
                ])
            }),
            new Body({
                constraints: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        type: 'string',
                        value: 'app/xml'
                    })
                ])
            })
        ])

        const result = parser._extractResponseBodies(collection, content)

        this.assertEqual(
            JSON.stringify(expected, null, '  '),
            JSON.stringify(result, null, '  ')
        )
    }

    @targets('_extractResponseBodies')
    testExtractResponseBodiesOnlyContent() {
        const parser = this.__init()

        const collection = {}
        const content = {
            produces: [
                'app/json',
                'app/xml'
            ]
        }

        const expected = new Immutable.List([
            new Body({
                constraints: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        type: 'string',
                        value: 'app/json'
                    })
                ])
            }),
            new Body({
                constraints: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        type: 'string',
                        value: 'app/xml'
                    })
                ])
            })
        ])

        const result = parser._extractResponseBodies(collection, content)

        this.assertEqual(
            JSON.stringify(expected, null, '  '),
            JSON.stringify(result, null, '  ')
        )
    }

    @targets('_extractResponseBodies')
    testExtractResponseBodiesWithCollectionAndContent() {
        const parser = this.__init()

        const collection = {
            produces: [
                'app/overriden'
            ]
        }
        const content = {
            produces: [
                'app/json',
                'app/xml'
            ]
        }

        const expected = new Immutable.List([
            new Body({
                constraints: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        type: 'string',
                        value: 'app/json'
                    })
                ])
            }),
            new Body({
                constraints: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        type: 'string',
                        value: 'app/xml'
                    })
                ])
            })
        ])

        const result = parser._extractResponseBodies(collection, content)

        this.assertEqual(
            JSON.stringify(expected, null, '  '),
            JSON.stringify(result, null, '  ')
        )
    }

    @targets('_extractExternals')
    testExtractExternalsOnlyCollection() {
        const parser = this.__init()

        const collection = {
            consumes: [
                'app/json',
                'app/xml'
            ]
        }
        const content = {}

        const expected = new Immutable.List([
            new Parameter({
                key: 'Content-Type',
                type: 'string',
                internals: new Immutable.List([
                    new Constraint.Enum([
                        'app/json',
                        'app/xml'
                    ])
                ])
            })
        ])

        const result = parser._extractExternals(collection, content)

        this.assertEqual(
            JSON.stringify(expected, null, '  '),
            JSON.stringify(result, null, '  ')
        )
    }

    @targets('_extractExternals')
    testExtractExternalsForResponses() {
        const parser = this.__init()

        const collection = {
            produces: [
                'app/json',
                'app/xml'
            ]
        }
        const content = {}

        const expected = new Immutable.List([
            new Parameter({
                key: 'Content-Type',
                type: 'string',
                internals: new Immutable.List([
                    new Constraint.Enum([
                        'app/json',
                        'app/xml'
                    ])
                ])
            })
        ])

        const result = parser._extractExternals(collection, content, false)

        this.assertEqual(
            JSON.stringify(expected, null, '  '),
            JSON.stringify(result, null, '  ')
        )
    }

    @targets('_extractExternals')
    testExtractExternalsOnlyContent() {
        const parser = this.__init()

        const collection = {}
        const content = {
            consumes: [
                'app/json',
                'app/xml'
            ]
        }

        const expected = new Immutable.List([
            new Parameter({
                key: 'Content-Type',
                type: 'string',
                internals: new Immutable.List([
                    new Constraint.Enum([
                        'app/json',
                        'app/xml'
                    ])
                ])
            })
        ])

        const result = parser._extractExternals(collection, content)

        this.assertEqual(
            JSON.stringify(expected, null, '  '),
            JSON.stringify(result, null, '  ')
        )
    }

    @targets('_extractExternals')
    testExtractExternalsWithCollectionAndContent() {
        const parser = this.__init()

        const collection = {
            consumes: [
                'app/overriden'
            ]
        }
        const content = {
            consumes: [
                'app/json',
                'app/xml'
            ]
        }

        const expected = new Immutable.List([
            new Parameter({
                key: 'Content-Type',
                type: 'string',
                internals: new Immutable.List([
                    new Constraint.Enum([
                        'app/json',
                        'app/xml'
                    ])
                ])
            })
        ])

        const result = parser._extractExternals(collection, content)

        this.assertEqual(
            JSON.stringify(expected, null, '  '),
            JSON.stringify(result, null, '  ')
        )
    }

    @targets('_extractContentTypes')
    testExtractContentTypesNoContent() {
        const parser = this.__init()

        const collection = {
            consumes: [
                'app/json',
                'app/xml'
            ]
        }
        const content = {}

        const expected = [
            'app/json',
            'app/xml'
        ]

        const result = parser._extractContentTypes(collection, content)

        this.assertEqual(expected, result)
    }

    @targets('_extractContentTypes')
    testExtractContentTypesNoCollection() {
        const parser = this.__init()

        const content = {
            consumes: [
                'app/json',
                'app/xml'
            ]
        }
        const collection = {}

        const expected = [
            'app/json',
            'app/xml'
        ]

        const result = parser._extractContentTypes(collection, content)

        this.assertEqual(expected, result)
    }

    @targets('_extractContentTypes')
    testExtractContentTypesWithCollectionAndContent() {
        const parser = this.__init()

        const collection = {
            consumes: [
                'app/overriden'
            ]
        }
        const content = {
            consumes: [
                'app/json',
                'app/xml'
            ]
        }

        const expected = [
            'app/json',
            'app/xml'
        ]

        const result = parser._extractContentTypes(collection, content)

        this.assertEqual(expected, result)
    }

    @targets('_extractParam')
    testExtractParamSimpleParam() {
        const parser = this.__init()

        const param = {}
        const externals = new Immutable.List()

        const expected = new Parameter()

        const result = parser._extractParam(param, externals)

        this.assertEqual(expected, result)
    }

    @targets('_extractParam')
    testExtractParamNoConstraints() {
        const parser = this.__init()

        const param = {
            type: 'string',
            name: 'api_key',
            description: 'simple description',
            format: 'byte',
            default: 'ae256'
        }
        const externals = new Immutable.List()

        const expected = new Parameter({
            key: 'api_key',
            name: 'api_key',
            value: 'ae256',
            type: 'string',
            format: 'byte',
            description: 'simple description'
        })

        const result = parser._extractParam(param, externals)

        this.assertEqual(expected, result)
    }

    @targets('_extractParam')
    testExtractParamWithExternals() {
        const parser = this.__init()

        const param = {
            type: 'string',
            name: 'api_key',
            description: 'simple description',
            format: 'byte',
            default: 'ae256'
        }
        const externals = new Immutable.List([
            new Parameter({
                key: 'Content-Type',
                type: 'string',
                value: 'app/json'
            })
        ])

        const expected = new Parameter({
            key: 'api_key',
            name: 'api_key',
            value: 'ae256',
            type: 'string',
            format: 'byte',
            description: 'simple description',
            externals: externals
        })

        const result = parser._extractParam(param, externals)

        this.assertEqual(expected, result)
    }

    @targets('_extractParam')
    testExtractParamWithInternalConstraints() {
        const parser = this.__init()

        const param = {
            type: 'number',
            name: 'score',
            description: 'simple description',
            format: 'float',
            default: 0.1209402,
            minimum: 0,
            maximum: 1,
            exclusiveMinimum: true,
            exclusiveMaximum: true
        }
        const externals = new Immutable.List()

        const expected = new Parameter({
            key: 'score',
            name: 'score',
            value: 0.1209402,
            type: 'number',
            format: 'float',
            description: 'simple description',
            internals: new Immutable.List([
                new Constraint.Minimum(0),
                new Constraint.Maximum(1),
                new Constraint.ExclusiveMinimum(0),
                new Constraint.ExclusiveMaximum(1)
            ])
        })

        const result = parser._extractParam(param, externals)

        this.assertEqual(
            JSON.stringify(expected, null, '  '),
            JSON.stringify(result, null, '  ')
        )
    }

    @targets('_extractBodies')
    testExtractBodiesOnlyCollection() {
        const parser = this.__init()

        const collection = {
            consumes: [
                'app/json',
                'app/xml'
            ]
        }
        const content = {}

        const expected = new Immutable.List([
            new Body({
                constraints: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        type: 'string',
                        value: 'app/json'
                    })
                ])
            }),
            new Body({
                constraints: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        type: 'string',
                        value: 'app/xml'
                    })
                ])
            })
        ])

        const result = parser._extractBodies(collection, content)

        this.assertEqual(
            JSON.stringify(expected, null, '  '),
            JSON.stringify(result, null, '  ')
        )
    }

    @targets('_extractBodies')
    testExtractBodiesOnlyContent() {
        const parser = this.__init()

        const collection = {}
        const content = {
            consumes: [
                'app/json',
                'app/xml'
            ]
        }

        const expected = new Immutable.List([
            new Body({
                constraints: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        type: 'string',
                        value: 'app/json'
                    })
                ])
            }),
            new Body({
                constraints: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        type: 'string',
                        value: 'app/xml'
                    })
                ])
            })
        ])

        const result = parser._extractBodies(collection, content)

        this.assertEqual(
            JSON.stringify(expected, null, '  '),
            JSON.stringify(result, null, '  ')
        )
    }

    @targets('_extractBodies')
    testExtractResponseWithCollectionAndContent() {
        const parser = this.__init()

        const collection = {
            consumes: [
                'app/overriden'
            ]
        }
        const content = {
            consumes: [
                'app/json',
                'app/xml'
            ]
        }

        const expected = new Immutable.List([
            new Body({
                constraints: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        type: 'string',
                        value: 'app/json'
                    })
                ])
            }),
            new Body({
                constraints: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        type: 'string',
                        value: 'app/xml'
                    })
                ])
            })
        ])

        const result = parser._extractBodies(collection, content)

        this.assertEqual(
            JSON.stringify(expected, null, '  '),
            JSON.stringify(result, null, '  ')
        )
    }

    @targets('_extractBodies')
    testExtractResponseWithSpecialTypes() {
        const parser = this.__init()

        const collection = {
            consumes: [
                'app/overriden'
            ]
        }
        const content = {
            consumes: [
                'application/json+xml',
                'application/x-www-form-urlencoded',
                'multipart/form-data'
            ]
        }

        const expected = new Immutable.List([
            new Body({
                constraints: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        type: 'string',
                        value: 'application/json+xml'
                    })
                ])
            }),
            new Body({
                type: 'urlEncoded',
                constraints: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        type: 'string',
                        value: 'application/x-www-form-urlencoded'
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

        const result = parser._extractBodies(collection, content)

        this.assertEqual(
            JSON.stringify(expected, null, '  '),
            JSON.stringify(result, null, '  ')
        )
    }

    @targets('_unescapeURIFragment')
    testUnescapeURIFragment() {
        const parser = this.__init()
        const fragments = [
            '#/definitions/User',
            '#/definitions/User~01',
            '#/definitions/User~10',
            '#/definitions/User~0~1',
            '#/definitions/User~1~0'
        ]

        const expected = [
            '#/definitions/User',
            '#/definitions/User~1',
            '#/definitions/User/0',
            '#/definitions/User~/',
            '#/definitions/User/~'
        ]

        for (let i = 0; i < fragments.length; i += 1) {
            let result = parser._unescapeURIFragment(fragments[i])
            this.assertEqual(expected[i], result)
        }
    }

    @targets('_extractSubTree')
    testExtractSubTree() {
        const parser = this.__init()
        const refs = [
            '#/definitions/User',
            '#/definitions/User~01',
            '#/definitions/User/Friend'
        ]

        const collection = {
            definitions: {
                User: {
                    value: 12,
                    Friend: {
                        value: 42
                    }
                },
                'User~1': {
                    value: 90
                }
            }
        }

        const expected = [
            {
                value: 12,
                Friend: {
                    value: 42
                }
            },
            {
                value: 90
            },
            {
                value: 42
            }
        ]

        for (let i = 0; i < refs.length; i += 1) {
            let result = parser._extractSubTree(collection, refs[i])
            this.assertEqual(expected[i], result)
        }
    }

    @targets('_extractReferences')
    testExtractReferencesWithSimpleCases() {
        const parser = this.__init()
        const item = new Item({
            file: {
                name: 'uber.json',
                path: '/some/path/to/file/'
            }
        })

        const collection = {
            definitions: {
                User: {
                    value: 42
                },
                Product: {
                    value: 12
                },
                Superfluous: {
                    value: false
                }
            },
            paths: [
                {
                    $ref: '#/definitions/User'
                },
                {
                    $ref: '#/definitions/Product'
                },
                {
                    $ref: '#/definitions/Missing'
                },
                {
                    $ref: 'external.json#/definitions/Other'
                }
            ]
        }

        const expected = new Immutable.List([
            new JSONSchemaReference({
                uri: '#/definitions/User',
                relative: '#/definitions/User'
            }),
            new JSONSchemaReference({
                uri: '#/definitions/Product',
                relative: '#/definitions/Product'
            }),
            new JSONSchemaReference({
                uri: '#/definitions/Missing',
                relative: '#/definitions/Missing'
            }),
            new JSONSchemaReference({
                uri: 'external.json#/definitions/Other',
                relative: 'external.json#/definitions/Other'
            })
        ])

        let result = parser._extractReferences(item, collection)

        this.assertEqual(expected, result)
    }

    @targets('_extractReferences')
    testExtractReferencesWithComplexCases() {
        const parser = this.__init()
        const item = new Item({
            file: {
                name: 'uber.json',
                path: '/some/path/to/file/'
            }
        })

        const collection = {
            definitions: {
                User: {
                    type: 'object',
                    properties: {
                        userId: {
                            type: 'integer'
                        },
                        owns: {
                            type: 'array',
                            items: {
                                $ref: '#/definitions/Product'
                            }
                        }
                    }
                },
                Product: {
                    type: 'object',
                    properties: {
                        productId: {
                            type: 'integer'
                        },
                        owner: {
                            $ref: '#/definitions/User'
                        },
                        price: {
                            type: 'number',
                            minimum: 0
                        }
                    }
                },
                Superfluous: {
                    value: false
                }
            },
            paths: {
                '/users/{userId}/update': {
                    post: {
                        parameters: [
                            {
                                name: 'body',
                                in: 'body',
                                schema: {
                                    $ref: '#/definitions/User'
                                }
                            }
                        ]
                    }
                },
                '/users/{userId}/items/{productId}/create': {
                    put: {
                        parameters: [
                            {
                                name: 'body',
                                in: 'body',
                                schema: {
                                    $ref: '#/definitions/Product'
                                }
                            }
                        ]
                    }
                },
                '/users/{userId}/history': {
                    get: {
                        description: 'Missing definition',
                        responses: {
                            200: {
                                $ref: '#/definitions/History'
                            }
                        }
                    },
                    post: {
                        parameters: [
                            {
                                name: 'body',
                                description: 'External definition',
                                in: 'body',
                                schema: {
                                    $ref: 'external.json#/definitions/Other'
                                }
                            }
                        ]
                    }
                }
            }
        }

        const expected = new Immutable.List([
            // Product and User definitions are found 2 times, and are
            // therefore included twice
            new JSONSchemaReference({
                uri: '#/definitions/Product',
                relative: '#/definitions/Product'
            }),
            new JSONSchemaReference({
                uri: '#/definitions/User',
                relative: '#/definitions/User'
            }),
            new JSONSchemaReference({
                uri: '#/definitions/User',
                relative: '#/definitions/User'
            }),
            new JSONSchemaReference({
                uri: '#/definitions/Product',
                relative: '#/definitions/Product'
            }),
            new JSONSchemaReference({
                uri: '#/definitions/History',
                relative: '#/definitions/History'
            }),
            new JSONSchemaReference({
                uri: 'external.json#/definitions/Other',
                relative: 'external.json#/definitions/Other'
            })
        ])

        let result = parser._extractReferences(item, collection)

        this.assertEqual(expected, result)
    }

    @targets('_extractSequenceParam')
    testExtractSequenceParamWithSimpleSequence() {
        const parser = this.__init()
        const sequence = '/user'
        const key = 'pathname'

        const expected = new Parameter({
            key: key,
            type: 'string',
            internals: new Immutable.List([
                new Constraint.Enum([
                    '/user'
                ])
            ])
        })

        const result = parser._extractSequenceParam(sequence, key)

        this.assertJSONEqual(expected, result)
    }

    @targets('_extractSequenceParam')
    testExtractSequenceParamWithComplexSequence() {
        const parser = this.__init()
        const sequence = '/user/{userId}/songs/{songId}'
        const key = 'pathname'
        const parameters = [
            {
                name: 'songId',
                type: 'integer',
                minimum: 0,
                maximum: 1000
            }
        ]

        const expected = new Parameter({
            key: key,
            type: 'string',
            format: 'sequence',
            value: new Immutable.List([
                new Parameter({
                    type: 'string',
                    value: '/user/',
                    internals: new Immutable.List([
                        new Constraint.Enum([ '/user/' ])
                    ])
                }),
                new Parameter({
                    key: 'userId',
                    type: 'string',
                    required: true,
                    value: '{userId}',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            '{userId}'
                        ])
                    ])
                }),
                new Parameter({
                    type: 'string',
                    value: '/songs/',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            '/songs/'
                        ])
                    ])
                }),
                new Parameter({
                    key: 'songId',
                    name: 'songId',
                    type: 'integer',
                    required: true,
                    internals: new Immutable.List([
                        new Constraint.Minimum(0),
                        new Constraint.Maximum(1000)
                    ])
                })
            ])
        })

        const result = parser._extractSequenceParam(sequence, key, parameters)

        this.assertJSONEqual(expected, result)
    }

    @targets('detect')
    testDetectWithSwaggerFile() {
        const parser = this.__init()

        let input = JSON.stringify({
            swagger: '2.0',
            info: {},
            paths: {}
        })

        let expected = [ { format: 'swagger', version: 'v2.0', score: 1 } ]
        let result = parser.detect(input)

        this.assertEqual(expected, result)
    }

    @targets('detect')
    testDetectWithNotASwaggerFile() {
        const parser = this.__init()

        let input = 'Some Content: ....'

        let expected = [ { format: 'swagger', version: 'v2.0', score: 0 } ]
        let result = parser.detect(input)

        this.assertEqual(expected, result)
    }

    @targets('getAPIName')
    testgetAPINameWithSwaggerFile() {
        const parser = this.__init()

        let input = JSON.stringify({
            swagger: '2.0',
            info: {
                title: 'Some API Name'
            },
            paths: {}
        })

        let expected = 'Some API Name'
        let result = parser.getAPIName(input)

        this.assertEqual(expected, result)
    }

    @targets('getAPIName')
    testGetAPINameWithNotASwaggerFile() {
        const parser = this.__init()

        let input = 'Some Content: ....'

        let expected = null
        let result = parser.getAPIName(input)

        this.assertEqual(expected, result)
    }

    //
    // helpers
    //

    __init(prefix = '') {
        let parser = new SwaggerParser()
        let mockedParser = new ClassMock(parser, prefix)

        return mockedParser
    }

    __warnProgress(string, isTestCase = false) {
        const offset = isTestCase ? '    ' : '      '
        const warn =
            offset + '\x1b[33m\u25CB\x1b[0m \x1b[90m' +
            string + '\x1b[0m'
        /* eslint-disable no-console */
        console.log(warn)
        /* eslint-enable no-console */
    }

    __loadTestSuite(testSuitName, functionName) {
        const parser = new SwaggerParser()
        const cases = SwaggerFixtures['get' + testSuitName + 'Cases']()
        this.__warnProgress(testSuitName, true)
        for (let usecase of cases) {
            this.__warnProgress(usecase.name)
            let output = parser[functionName].apply(parser, usecase.inputs)
            this.assertEqual(
                JSON.stringify(output, null, '  '),
                JSON.stringify(usecase.output, null, '  '),
                'in ' + usecase.name
            )
        }
    }

    __loadSwaggerFile(fileName, extension = 'json') {
        const path = __dirname + '/collections/' + fileName + '.' + extension
        return fs.readFileSync(path).toString()
    }
}
