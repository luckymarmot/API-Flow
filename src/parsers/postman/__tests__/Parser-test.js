import fs from 'fs'
import Immutable from 'immutable'

import { UnitTest, registerTest } from '../../../utils/TestUtils'
import { ClassMock } from '../../../utils/Mock'

import PostmanParser from '../Parser'
import RequestContext, {
    KeyValue,
    Environment,
    EnvironmentReference
} from '../../../models/RequestContext'

@registerTest
export class TestPostmanParser extends UnitTest {
    // TODO write tests
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

    testCreateContextCallsImportEnvironment() {
        const parser = new PostmanParser()
        const mp = new ClassMock(parser, '')

        const envs = [ { env1: true }, { env2: true } ]
        const colls = []

        mp.spyOn('_importEnvironment', () => {
            return true
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

    testCreateContextReturnsRequestContext() {
        const parser = new PostmanParser()
        const mp = new ClassMock(parser, '')

        const envs = [ { env1: true } ]
        const colls = [ { get: () => { return '12' } } ]

        mp.spyOn('_importEnvironment', () => {
            return true
        })

        mp.spyOn('_importCollection', (obj) => {
            return obj
        })

        const result = parser._createContext.apply(
            mp,
            [ envs, colls ]
        )

        this.assertTrue(result instanceof RequestContext)
        this.assertEqual(
            result.get('environments'), new Immutable.List([ true ])
        )
        this.assertEqual(
            result.getIn([ 'group', 'children', '12' ]), colls[0]
        )
    }

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

        const expected = new Environment({
            id: 'envId',
            name: 'envName'
        })

        this.assertEqual(result, expected)
    }

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

        const expected = new Environment({
            id: 'envId',
            name: 'envName',
            variables: new Immutable.OrderedMap({
                variableKey: new KeyValue({
                    key: 'variableKey',
                    value: 'variableValue'
                })
            })
        })

        this.assertEqual(result, expected)
    }

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

    testReferenceEnvironmentVariableWithUndefined() {
        const parser = new PostmanParser()
        const mp = new ClassMock(parser, '')

        const result = parser._referenceEnvironmentVariable.apply(
            mp,
            []
        )

        this.assertEqual(null, result)
    }

    testReferenceEnvironmentVariableWithSimpleReference() {
        const parser = new PostmanParser()
        const mp = new ClassMock(parser, '')
        const input = '{{simple}}'

        const result = parser._referenceEnvironmentVariable.apply(
            mp,
            [ input ]
        )

        const expected = new EnvironmentReference({
            referenceName: new Immutable.List([
                new EnvironmentReference({
                    referenceName: new Immutable.List([
                        'simple'
                    ])
                })
            ])
        })

        this.assertEqual(expected, result)
    }

    testReferenceEnvironmentVariableWithRichReference() {
        const parser = new PostmanParser()
        const mp = new ClassMock(parser, '')
        const input = 'notso{{simple}}'

        const result = parser._referenceEnvironmentVariable.apply(
            mp,
            [ input ]
        )

        const expected = new EnvironmentReference({
            referenceName: new Immutable.List([
                'notso',
                new EnvironmentReference({
                    referenceName: new Immutable.List([
                        'simple'
                    ])
                })
            ])
        })

        this.assertEqual(expected, result)
    }


    testReferenceEnvironmentVariableWithMultipleReferences() {
        const parser = new PostmanParser()
        const mp = new ClassMock(parser, '')
        const input = '{{not}}so{{simple}}?'

        const result = parser._referenceEnvironmentVariable.apply(
            mp,
            [ input ]
        )

        const expected = new EnvironmentReference({
            referenceName: new Immutable.List([
                new EnvironmentReference({
                    referenceName: new Immutable.List([
                        'not'
                    ])
                }),
                'so',
                new EnvironmentReference({
                    referenceName: new Immutable.List([
                        'simple'
                    ])
                }),
                '?'
            ])
        })

        this.assertEqual(expected, result)
    }

    testExtractBasicAuth() {
        const parser = new PostmanParser()
        const mp = new ClassMock(parser, '')
        const input = '{{not}}so{{{{simple}}}}?'

        const result = parser._referenceEnvironmentVariable.apply(
            mp,
            [ input ]
        )

        const expected = new EnvironmentReference({
            referenceName: new Immutable.List([
                new EnvironmentReference({
                    referenceName: new Immutable.List([
                        'not'
                    ])
                }),
                'so',
                new EnvironmentReference({
                    referenceName: new Immutable.List([
                        new EnvironmentReference({
                            referenceName: new Immutable.List([
                                'simple'
                            ])
                        })
                    ])
                }),
                '?'
            ])
        })

        this.assertEqual(expected, result)
    }

    __loadPostmanFile(fileName, extension = 'json') {
        const path = __dirname + '/samples/' + fileName + '.' + extension
        return fs.readFileSync(path).toString()
    }
}
