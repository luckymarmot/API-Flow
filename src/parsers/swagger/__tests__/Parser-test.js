import {
    UnitTest,
    registerTest,
    targets,
    against
} from '../../../utils/TestUtils'
import Immutable from 'immutable'
import fs from 'fs'

import SwaggerParser from '../Parser'

import {
    Body,
    Parameter
} from '../../../models/Core'

import {
    Info, Contact, License
} from '../../../models/Utils'

import Group from '../../../models/Group'
import Constraint from '../../../models/Constraint'
import Auth from '../../../models/Auth'
import Request from '../../../models/Request'
import URL from '../../../models/URL'
import Item from '../../../models/Item'

import JSONSchemaReference from '../../../models/references/JSONSchema'

import {
    ClassMock
} from '../../../mocks/PawMocks'

import SwaggerFixtures from './fixtures/Parser-fixtures'

@registerTest
@against(SwaggerParser)
export class TestSwaggerParser extends UnitTest {

    @targets('_createGroupTree')
    testSimpleGroupTree() {
        const parser = new SwaggerParser()

        const request = new Request()
        const pathsLinkedReqs = {
            '/test': {
                get: request
            }
        }

        let inputGroup = new Group({
            name: 'testRoot'
        })

        let expected = new Group({
            name: 'testRoot'
        })
        let pathGroup = new Group({
            name: '/test'
        })
        pathGroup = pathGroup.setIn([ 'children', 'get' ], request)
        expected = expected.setIn([ 'children', '/test' ], pathGroup)

        const result = parser._createGroupTree(inputGroup, pathsLinkedReqs)
        this.assertEqual(result, expected)
    }

    @targets('_createGroupTree')
    testMultipleMethodsGroupTree() {
        const parser = new SwaggerParser()

        const getReq = new Request()
        const postReq = new Request()

        const pathsLinkedReqs = {
            '/test': {
                get: getReq,
                post: postReq
            }
        }

        let inputGroup = new Group({
            name: 'testRoot'
        })

        let expected = new Group({
            name: 'testRoot'
        })
        let pathGroup = new Group({
            name: '/test'
        })
        pathGroup = pathGroup
            .setIn([ 'children', 'get' ], getReq)
            .setIn([ 'children', 'post' ], postReq)
        expected = expected
            .setIn([ 'children', '/test' ], pathGroup)

        const result = parser._createGroupTree(inputGroup, pathsLinkedReqs)
        this.assertTrue(Immutable.is(result, expected))
    }

    @targets('_createGroupTree')
    testMultiplePathsGroupTree() {
        const parser = new SwaggerParser()

        const firstReq = new Request()
        const secndReq = new Request()

        const pathsLinkedReqs = {
            '/test': {
                get: firstReq
            },
            '/anotherTest': {
                post: secndReq
            }
        }

        let inputGroup = new Group({
            name: 'testRoot'
        })

        let expected = new Group({
            name: 'testRoot'
        })
        let pathGroup = new Group({
            name: '/test'
        })
        pathGroup = pathGroup.setIn([ 'children', 'get' ], firstReq)
        expected = expected.setIn([ 'children', '/test' ], pathGroup)
        pathGroup = new Group({
            name: '/anotherTest'
        })
        pathGroup = pathGroup.setIn([ 'children', 'post' ], secndReq)
        expected = expected.setIn([ 'children', '/anotherTest' ], pathGroup)

        const result = parser._createGroupTree(inputGroup, pathsLinkedReqs)
        this.assertTrue(Immutable.is(result, expected))
    }

    @targets('_createGroupTree')
    testLongPathGroupTree() {
        const parser = new SwaggerParser()

        const req = new Request()

        const pathsLinkedReqs = {
            '/path/to/test': {
                get: req
            }
        }

        let inputGroup = new Group({
            name: 'testRoot'
        })

        let expected = new Group({
            name: 'testRoot'
        })
        let pathGroup = new Group({
            name: '/test'
        })
        pathGroup = pathGroup
            .setIn([ 'children', 'get' ], req)
        let parentGroup = new Group({
            name: '/to'
        })
        pathGroup = parentGroup
            .setIn([ 'children', '/test' ], pathGroup)
        parentGroup = new Group({
            name: '/path'
        })
        parentGroup = parentGroup
            .setIn([ 'children', '/to' ], pathGroup)
        expected = expected.setIn([ 'children', '/path' ], parentGroup)

        const result = parser._createGroupTree(inputGroup, pathsLinkedReqs)
        this.assertTrue(Immutable.is(result, expected))
    }

    @targets('_createGroupTree')
    testRequestAndGroupOnSameDepthGroupTree() {
        const parser = new SwaggerParser()

        const firstReq = new Request()
        const secndReq = new Request()

        const pathsLinkedReqs = {
            '/test': {
                get: firstReq
            },
            '/test/nested': {
                post: secndReq
            }
        }

        let inputGroup = new Group({
            name: 'testRoot'
        })

        let expected = new Group({
            name: 'testRoot'
        })
        let pathGroup = new Group({
            name: '/test'
        })
        let subGroup = new Group({
            name: '/nested'
        })
        subGroup = subGroup
            .setIn([ 'children', 'post' ], secndReq)
        pathGroup = pathGroup
            .setIn([ 'children', 'get' ], firstReq)
            .setIn([ 'children', '/nested' ], subGroup)

        expected = expected.setIn([ 'children', '/test' ], pathGroup)

        const result = parser._createGroupTree(inputGroup, pathsLinkedReqs)

        this.assertTrue(Immutable.is(result, expected))
    }

    @targets('_createGroupTree')
    testPathCanContainMethodKeywords() {
        const parser = new SwaggerParser()

        const req = new Request()

        const pathsLinkedReqs = {
            '/get/post/test': {
                get: req
            }
        }

        let inputGroup = new Group({
            name: 'testRoot'
        })

        let expected = new Group({
            name: 'testRoot'
        })
        let pathGroup = new Group({
            name: '/test'
        })
        pathGroup = pathGroup
            .setIn([ 'children', 'get' ], req)
        let parentGroup = new Group({
            name: '/post'
        })
        pathGroup = parentGroup
            .setIn([ 'children', '/test' ], pathGroup)
        parentGroup = new Group({
            name: '/get'
        })
        parentGroup = parentGroup
            .setIn([ 'children', '/post' ], pathGroup)
        expected = expected.setIn([ 'children', '/get' ], parentGroup)

        const result = parser._createGroupTree(inputGroup, pathsLinkedReqs)
        this.assertTrue(Immutable.is(result, expected))
    }

    @targets('_createGroupTree')
    testMethodKeywordsDoNotCauseConflict() {
        const parser = new SwaggerParser()

        const firstReq = new Request()
        const secndReq = new Request()

        const pathsLinkedReqs = {
            '/test': {
                get: firstReq
            },
            '/test/get': {
                post: secndReq
            }
        }

        let inputGroup = new Group({
            name: 'testRoot'
        })

        let expected = new Group({
            name: 'testRoot'
        })
        let pathGroup = new Group({
            name: '/test'
        })
        let subGroup = new Group({
            name: '/get'
        })
        subGroup = subGroup
            .setIn([ 'children', 'post' ], secndReq)
        pathGroup = pathGroup
            .setIn([ 'children', 'get' ], firstReq)
            .setIn([ 'children', '/get' ], subGroup)

        expected = expected.setIn([ 'children', '/test' ], pathGroup)

        const result = parser._createGroupTree(inputGroup, pathsLinkedReqs)

        this.assertTrue(Immutable.is(result, expected))
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

    @targets('_applyFuncOverPathArchitecture')
    testApplyFuncOverPathArchitectureIsCalledForEachPathMethodPair() {
        const parser = new SwaggerParser()

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
        let count = 0

        parser._applyFuncOverPathArchitecture(
            collection,
            () => { count += 1 }
        )
        this.assertTrue(expected === count)
    }

    @targets('_applyFuncOverPathArchitecture')
    testApplyFuncOverPathArchitectureProvidesCorrectArgsToFunction() {
        const parser = new SwaggerParser()

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

        parser._applyFuncOverPathArchitecture(
            collection,
            (coll, path, method, content) => {
                this.assertEqual(coll.paths[path][method], content)
            }
        )
    }

    @targets('_applyFuncOverPathArchitecture')
    testApplyFuncOverPathArchitectureAppliesFuncToEachPath() {
        const parser = new SwaggerParser()

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
            '/test': {
                get: {
                    value: 24
                },
                post: {
                    value: 42
                }
            },
            '/test/nested': {
                get: {
                    value: 90
                }
            }
        }

        const result = parser._applyFuncOverPathArchitecture(
            collection,
            (coll, path, method, content) => {
                return {
                    value: content.value * 2
                }
            }
        )

        this.assertEqual(expected, result)
    }

    @targets('_applyFuncOverPathArchitecture')
    testApplyFuncOverPathArchitectureUpdatesMethodParams() {
        const parser = new SwaggerParser()

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
            '/test': {
                get: {
                    value: 24
                },
                post: {
                    value: 42
                }
            },
            '/test/nested': {
                get: {
                    value: 90,
                    parameters: [
                        {
                            name: 'alt',
                            in: 'query'
                        }
                    ]
                }
            }
        }

        const result = parser._applyFuncOverPathArchitecture(
            collection,
            (coll, path, method, content) => {
                let _result = {
                    value: content.value * 2
                }
                if (content.parameters) {
                    _result.parameters = content.parameters
                }
                return _result
            }
        )

        this.assertEqual(expected, result)
    }

    @targets('_applyFuncOverPathArchitecture')
    testApplyFuncOverPathArchitectureUpdatesMethodParamsWithOverride() {
        const parser = new SwaggerParser()

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
            '/test': {
                get: {
                    value: 24
                },
                post: {
                    value: 42
                }
            },
            '/test/nested': {
                get: {
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
        }

        const result = parser._applyFuncOverPathArchitecture(
            collection,
            (coll, path, method, content) => {
                let _result = {
                    value: content.value * 2
                }
                if (content.parameters) {
                    _result.parameters = content.parameters
                }
                return _result
            }
        )

        this.assertEqual(expected, result)
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
            in: 'header',
            name: 'api-key'
        })

        const result = parser._setApiKeyAuth(input)

        this.assertEqual(expected, result)
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
            flow: 'implicit',
            authorizationUrl: 'fakeurl.com/auth',
            tokenUrl: 'fakeurl.com/token',
            scopes: new Immutable.List([ 'read:any', 'write:own' ])
        })

        const result = parser._setOAuth2Auth(input)

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
        const content = { parameters:
            [
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
        const content = { parameters:
            [
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
    testExtractReferences() {
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
