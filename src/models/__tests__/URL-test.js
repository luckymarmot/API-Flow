import Immutable from 'immutable'

import {
    UnitTest,
    registerTest,
    targets,
    against
} from '../../utils/TestUtils'

import { Parameter } from '../Core'
import Constraint from '../Constraint'

import URLFixtures from './fixtures/URL-fixtures.json'
import URL from '../URL'

@registerTest
@against(URL)
export class TestURL extends UnitTest {

    /*
        note: relative path [3] is not an expected behavior.
        It is here to document the behavior when relative paths
        are used together, which is extremely buggy.
        Use absolute paths instead
    */
    @targets('_constructorFromURL')
    testStringURLS() {
        const testGroups = URLFixtures.tests.group
        this.__warnProgress('StringURLS')
        for (let group of testGroups) {
            this.__warnProgress(group.name, 1)
            let tests = group.test
            for (let test of tests) {
                this.__warnProgress(test.name, 2)
                this.__validateURL(test)
            }
        }
    }

    @targets('_constructorFromObj')
    testConstructorFromURLsWithURLObject() {
        const pathname = new Parameter({
            key: 'pathname',
            value: '/path/to/doc.json',
            type: 'string',
            internals: new Immutable.List([
                new Constraint.Enum([
                    '/path/to/doc.json'
                ])
            ])
        })

        let url = new URL({
            pathname: pathname
        })

        this.assertEqual(url.get('pathname'), pathname)
    }

    @targets('_constructorFromObj')
    testConstructorFromURLsWithSimpleObject() {
        const expected = (new URL({}))
            .set('pathname', new Parameter({
                key: 'pathname',
                type: 'string',
                internals: new Immutable.List([
                    new Constraint.Enum([
                        '/path/to/doc.json'
                    ])
                ])
            }))
            .set('hash', new Parameter({
                key: 'hash',
                type: 'string',
                internals: new Immutable.List([
                    new Constraint.Enum([
                        '#/definitions/API',
                        '#/definitions/Server'
                    ])
                ])
            }))

        let url = new URL({
            pathname: '/path/to/doc.json',
            hash: [
                '#/definitions/API',
                '#/definitions/Server'
            ]
        })

        this.assertJSONEqual(expected, url)
    }

    @targets('_formatParam')
    testFormatParamWithNoParam() {
        let param
        const url = new URL()
        const result = url._formatParam('parameter', param)

        this.assertJSONEqual(result, new Parameter({
            key: 'parameter',
            value: null,
            type: 'string',
            internals: new Immutable.List([
                new Constraint.Enum([ '' ])
            ])
        }))
    }

    @targets('_formatParam')
    testFormatParamWithArray() {
        let param = [ 1, 2, 3 ]
        const url = new URL()
        const result = url._formatParam('parameter', param)

        this.assertJSONEqual(result, new Parameter({
            key: 'parameter',
            type: 'string',
            internals: new Immutable.List([
                new Constraint.Enum(param)
            ])
        }))
    }

    @targets('_formatParam')
    testFormatParamWithString() {
        let param = 'value'
        const url = new URL()
        const result = url._formatParam('parameter', param)

        this.assertJSONEqual(result, new Parameter({
            key: 'parameter',
            type: 'string',
            internals: new Immutable.List([
                new Constraint.Enum([ param ])
            ])
        }))
    }

    @targets('href')
    testHref() {
        let url = new URL({
            pathname: '/path/to/doc.json',
            hash: [
                '#/definitions/API',
                '#/definitions/Server'
            ]
        })

        let count = {
            path: 0,
            api: 0,
            server: 0
        }

        let iter = 100
        for (let i = 0; i < iter; i += 1) {
            let result = url.href()
            if (result.indexOf('#/definitions/API') >= 0) {
                count.api += 1
            }

            if (result.indexOf('#/definitions/Server') >= 0) {
                count.server += 1
            }

            if (result.indexOf('/path/to/doc.json') >= 0) {
                count.path += 1
            }
        }

        this.assertEqual(count.path, iter)
        this.assertEqual(count.path, count.api + count.server)
        this.assertNotEqual(
            count.api,
            0,
            'this may fail if you are really unlucky'
        )
        this.assertNotEqual(
            count.server,
            0,
            'this may fail if you are really unlucky'
        )
    }

    @targets('origin')
    testOrigin() {
        let url = new URL({
            host: 'www.example.com',
            protocol: [
                'http:',
                'https:'
            ]
        })

        let count = {
            host: 0,
            http: 0,
            https: 0
        }

        let iter = 100
        for (let i = 0; i < iter; i += 1) {
            let result = url.origin()
            if (result.indexOf('www.example.com') >= 0) {
                count.host += 1
            }

            if (result.indexOf('http:') >= 0) {
                count.http += 1
            }

            if (result.indexOf('https:') >= 0) {
                count.https += 1
            }
        }

        this.assertEqual(count.host, iter)
        this.assertEqual(count.host, count.http + count.https)
        this.assertNotEqual(
            count.http,
            0,
            'this may fail if you are really unlucky'
        )
        this.assertNotEqual(
            count.https,
            0,
            'this may fail if you are really unlucky'
        )
    }

    @targets('toJS')
    testToJS() {
        let url = new URL({
            host: 'www.example.com',
            protocol: [
                'http:',
                'https:'
            ]
        })

        let result = url.toJS()

        this.assertEqual(result.host, 'www.example.com')
        if (result.protocol.indexOf('s') >= 0) {
            this.assertEqual(result.protocol, 'https:')
        }
        else {
            this.assertEqual(result.protocol, 'http:')
        }
    }

    @targets('_getParamValue')
    testGetParamValue() {
        let url = new URL({
            host: 'www.example.com',
            protocol: [
                'http',
                'https'
            ]
        })

        let host = url._getParamValue('host')
        let protocol = url._getParamValue('protocol')

        this.assertEqual(host, [ 'www.example.com' ])
        this.assertEqual(protocol, [ 'http', 'https' ])
    }

    @targets('_mergeParams')
    testMergeParams() {
        let values = [
            '443',
            '443',
            '80',
            '43',
            '41',
            '443',
            '41',
            '443',
            '80',
            '443'
        ]

        let expected = [
            '41',
            '43',
            '80',
            '443'
        ]

        let result = (new URL())._mergeParams(values)

        this.assertEqual(expected, result)
    }

    @targets('merge')
    testMerge() {
        let url1 = new URL({
            host: 'www.example.com',
            protocol: [
                'http',
                'https'
            ]
        })

        let url2 = new URL({
            host: 'www.example.com',
            protocol: [
                'ws',
                'wss'
            ]
        })

        let expected = new URL({
            host: 'www.example.com',
            protocol: [
                'http',
                'https',
                'ws',
                'wss'
            ]
        })

        let result = url1.merge(url2)

        this.assertJSONEqual(expected, result)
    }

    @targets('generateParam')
    testGenerateParam() {
        let url = new URL({
            host: 'www.example.com',
            protocol: [
                'http',
                'https'
            ]
        })

        let size = 100

        let counts = {
            'www.example.com': 0,
            http: 0,
            https: 0
        }

        for (let i = 0; i < size; i += 1) {
            let resultHost = url.generateParam('host')
            let resultProtocol = url.generateParam('protocol')

            counts[resultHost] = (counts[resultHost] || 0) + 1
            counts[resultProtocol] = (counts[resultProtocol] || 0) + 1
        }

        this.assertEqual(counts['www.example.com'], size)
        this.assertEqual(counts.http + counts.https, size)

        let msg = 'this may fail if you are really unlucky'
        this.assertNotEqual(counts.http, 0, msg)
        this.assertNotEqual(counts.https, 0, msg)
    }

    __validateURL(test) {
        let url = new URL(test.url, test.base)
        for (let key of Object.keys(test.expect)) {
            if (key === 'href') {
                this.assertEqual(
                    url.href(),
                    test.expect[key],
                    test.name + ' : ' + key
                )
            }
            else {
                this.assertEqual(
                    url.generateParam(key),
                    test.expect[key],
                    test.name + ' : ' + key
                )
            }
        }
    }

    __warnProgress(string, depth = 0) {
        const offset = '  '.repeat(depth + 2)
        const warn =
            offset + '\x1b[33m\u25CB\x1b[0m \x1b[90m' +
            string + '\x1b[0m'
        /* eslint-disable no-console */
        console.log(warn)
        /* eslint-enable no-console */
    }
}
