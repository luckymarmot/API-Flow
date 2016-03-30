import { UnitTest, registerTest } from '../../../utils/TestUtils'
import Immutable from 'immutable'
import fs from 'fs'

import SwaggerParser from '../Parser'
import {
    Request,
    Group,
    KeyValue
} from '../../../immutables/RequestContext'

import SwaggerFixtures from './fixtures/Parser-fixtures'

@registerTest
class TestSwaggerParser extends UnitTest {

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

        parser._applyFuncOverPathArchitecture(collection, () => { count += 1 })
        this.assertTrue(expected === count)
    }

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

    testSetDescriptionWithADescriptionContent() {
        const parser = new SwaggerParser()
        const request = new Request()
        const content = {
            description: 'dummy description'
        }

        const result = parser._setDescription(request, content)

        this.assertEqual(result.get('description'), content.description)
    }

    testSetDescriptionWithNoDescriptionContent() {
        const parser = new SwaggerParser()
        const request = new Request()
        const content = {
            notDescription: 'dummy description'
        }

        const result = parser._setDescription(request, content)

        this.assertEqual(result.get('description'), null)
    }

    testConvertKeyValueListToSet() {
        const parser = new SwaggerParser()
        const kvList = [
            new KeyValue({
                key: 'test',
                value: 42
            }),
            new KeyValue({
                key: 'other',
                value: 'text'
            }),
            new KeyValue({
                key: 'final',
                value: true
            })
        ]

        const expected = {
            test: 42,
            other: 'text',
            final: true
        }

        const result = parser._convertKeyValueListToSet(kvList)
        this.assertEqual(expected, result)
    }

    testConvertKeyValueListToSetWithDuplicateKeys() {
        const parser = new SwaggerParser()
        const kvList = [
            new KeyValue({
                key: 'test',
                value: 42
            }),
            new KeyValue({
                key: 'other',
                value: 'text'
            }),
            new KeyValue({
                key: 'final',
                value: true
            }),
            new KeyValue({
                key: 'final',
                value: false
            })
        ]

        const expected = {
            test: 42,
            other: 'text',
            final: false
        }

        const result = parser._convertKeyValueListToSet(kvList)
        this.assertEqual(expected, result)
    }

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

    testExtractParams() {
        this.__loadTestSuite('ExtractParams', '_extractParams')
    }

    testExtractResponses() {
        this.__loadTestSuite('ExtractResponses', '_extractResponses')
    }

    testGenerateURL() {
        this.__loadTestSuite('GenerateURL', '_generateURL')
    }

    testSetBasicInfo() {
        this.__loadTestSuite('SetBasicInfo', '_setBasicInfo')
    }

    testSetBody() {
        this.__loadTestSuite('SetBody', '_setBody')
    }

    testSetAuth() {
        this.__loadTestSuite('SetAuth', '_setAuth')
    }

    testCreateRequest() {
        this.__loadTestSuite('CreateRequest', '_createRequest')
    }
    //
    // helpers
    //

    __warnProgress(string, isTestCase = false) {
        const offset = isTestCase ? '    ' : '      '
        const warn =
            offset + '\x1b[33m\u25CB\x1b[0m \x1b[90m' +
            string + '\x1b[0m'
        // eslint-disable-next-line
        console.log(warn)
    }

    __loadTestSuite(testSuitName, functionName) {
        const parser = new SwaggerParser()
        const cases = SwaggerFixtures['get' + testSuitName + 'Cases']()
        this.__warnProgress(testSuitName, true)
        for (let usecase of cases) {
            this.__warnProgress(usecase.name)
            let output = parser[functionName].apply(parser, usecase.inputs)
            this.assertEqual(output, usecase.output, 'in ' + usecase.name)
        }
    }

    __loadSwaggerFile(fileName, extension = 'json') {
        const path = __dirname + '/collections/' + fileName + '.' + extension
        return fs.readFileSync(path).toString()
    }
}
