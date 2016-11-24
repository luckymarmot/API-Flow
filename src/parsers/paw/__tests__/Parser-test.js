import Immutable from 'immutable'

import {
    UnitTest,
    registerTest,
    targets,
    against
} from '../../../utils/TestUtils'

import PawParser from '../Parser'

import Context, {
    Body,
    Parameter
} from '../../../models/Core'

import Group from '../../../models/Group'
import Constraint from '../../../models/Constraint'
import Auth from '../../../models/Auth'
import Request from '../../../models/Request'
import URL from '../../../models/URL'

import { Info } from '../../../models/Utils'

import JSONSchemaReference from '../../../models/references/JSONSchema'
import ExoticReference from '../../../models/references/Exotic'
import ReferenceContainer from '../../../models/references/Container'

import DynamicValueManager from '../dv/DVManager'

import {
    ClassMock,
    PawContextMock,
    DynamicString,
    DynamicValue,
    PawRequestMock
} from '../../../mocks/PawMocks'

@registerTest
@against(PawParser)
export class TestPawParser extends UnitTest {

    @targets('generate')
    testGenerateCallsParseGroup() {
        const paw = this.__init()

        paw.spyOn('_parseGroup', () => {
            return { group: null, requests: null }
        })

        paw.spyOn('_parseDomains', () => {
            return null
        })

        paw.spyOn('_parseInfo', () => {
            return null
        })

        paw.generate()

        this.assertEqual(paw.spy._parseGroup.count, 1)
    }

    @targets('generate')
    testGenerateCallsParseDomains() {
        const paw = this.__init()

        paw.spyOn('_parseGroup', () => {
            return { group: null, requests: null }
        })

        paw.spyOn('_parseDomains', () => {
            return null
        })

        paw.spyOn('_parseInfo', () => {
            return null
        })

        paw.generate()

        this.assertEqual(paw.spy._parseDomains.count, 1)
    }

    @targets('generate')
    testGenerateCallsParseInfo() {
        const paw = this.__init()

        paw.spyOn('_parseGroup', () => {
            return { group: null, requests: null }
        })

        paw.spyOn('_parseDomains', () => {
            return null
        })

        paw.spyOn('_parseInfo', () => {
            return null
        })

        paw.generate()

        this.assertEqual(paw.spy._parseInfo.count, 1)
    }

    @targets('generate')
    testGenerateReturnsAContextObject() {
        const paw = this.__init()

        paw.spyOn('_parseGroup', () => {
            return { group: 12, requests: { a: 90 } }
        })

        paw.spyOn('_parseDomains', () => {
            return 42
        })

        paw.spyOn('_parseInfo', () => {
            return 90
        })

        const expected = new Context({
            requests: new Immutable.OrderedMap({ a: 90 }),
            group: 12,
            references: 42,
            info: 90
        })

        const result = paw.generate()

        this.assertEqual(expected, result)
    }

    @targets('_parseGroup')
    testParseGroupReturnsNullIfNoRequests() {
        const [ paw, ctx ] = this.__init(2)

        const expected = { group: null, requests: {} }
        const result = paw._parseGroup(ctx, [])

        this.assertEqual(expected, result)
    }

    @targets('_parseGroup')
    testParseGroupCallsParseRequestForEachRequest() {
        const [ paw, ctx ] = this.__init(2)

        paw.spyOn('_parseRequest', () => {
            return {}
        })

        paw._parseGroup(ctx, [ 1, 2, 3 ])

        this.assertEqual(paw.spy._parseRequest.count, 3)
    }

    @targets('_parseGroup')
    testParseGroupCallsRequestGroupByIdForEachGroup() {
        const [ paw, ctx ] = this.__init(2)

        paw.spyOn('_parseRequest', () => {
            return 12
        })

        ctx.spyOn('getRequestGroupById', (id) => {
            return {
                id: id,
                parent: null
            }
        })

        const input = [
            {
                id: '1234',
                parent: {
                    id: '42',
                    name: 'group#1'
                }
            },
            {
                id: '2345',
                parent: {
                    id: '42',
                    name: 'group#1'
                }
            },
            {
                id: '3456',
                parent: {
                    id: '90',
                    name: 'group#2'
                }
            },
            {
                id: '4567',
                parent: null
            }
        ]

        const expected = {
            group: new Group({
                children: new Immutable.OrderedMap({
                    4567: '4567',
                    42: new Group({
                        id: '42',
                        name: 'group#1',
                        children: new Immutable.OrderedMap({
                            1234: '1234',
                            2345: '2345'
                        })
                    }),
                    90: new Group({
                        id: '90',
                        name: 'group#2',
                        children: new Immutable.OrderedMap({
                            3456: '3456'
                        })
                    })
                })
            }),
            requests: {
                1234: 12,
                2345: 12,
                3456: 12,
                4567: 12
            }
        }

        const result = paw._parseGroup(ctx, input)

        this.assertJSONEqual(expected, result)
    }

    @targets('_parseGroup')
    testParseGroupSupportsNestedGroups() {
        const [ paw, ctx ] = this.__init(2)

        paw.spyOn('_parseRequest', () => {
            return 12
        })

        ctx.spyOn('getRequestGroupById', (id) => {
            if (id === '42') {
                return {
                    id: id,
                    parent: {
                        id: '90',
                        name: 'group#2'
                    }
                }
            }
            return {
                id: id,
                parent: null
            }
        })

        const input = [
            {
                id: '1234',
                parent: {
                    id: '42',
                    name: 'group#1'
                }
            },
            {
                id: '2345',
                parent: {
                    id: '42',
                    name: 'group#1'
                }
            },
            {
                id: '3456',
                parent: {
                    id: '90',
                    name: 'group#2'
                }
            },
            {
                id: '4567',
                parent: null
            }
        ]

        const expected = {
            group: new Group({
                children: new Immutable.OrderedMap({
                    4567: '4567',
                    90: new Group({
                        id: '90',
                        name: 'group#2',
                        children: new Immutable.OrderedMap({
                            3456: '3456',
                            42: new Group({
                                id: '42',
                                name: 'group#1',
                                children: new Immutable.OrderedMap({
                                    1234: '1234',
                                    2345: '2345'
                                })
                            })
                        })
                    })
                })
            }),
            requests: {
                1234: 12,
                2345: 12,
                3456: 12,
                4567: 12
            }
        }

        const result = paw._parseGroup(ctx, input)

        this.assertJSONEqual(expected, result)
    }

    @targets('_parseRequest')
    testParseRequestCallsFormatBody() {
        const [ paw, ctx, req ] = this.__init(3)

        paw.spyOn('_formatBody', () => {
            return [ new Immutable.List() ]
        })

        paw.spyOn('_formatHeaders', () => {
            return [ new Immutable.List(), new Immutable.List() ]
        })

        paw.spyOn('_formatQueries', () => {
            return new Immutable.List()
        })

        paw.spyOn('_formatAuth', () => {
            return null
        })

        paw._parseRequest(ctx, req)

        this.assertEqual(paw.spy._formatBody.count, 1)
    }

    @targets('_parseRequest')
    testParseRequestCallsFormatHeaders() {
        const [ paw, ctx, req ] = this.__init(3)

        paw.spyOn('_formatBody', () => {
            return [ new Immutable.List() ]
        })

        paw.spyOn('_formatHeaders', () => {
            return [ new Immutable.List(), new Immutable.List() ]
        })

        paw.spyOn('_formatQueries', () => {
            return new Immutable.List()
        })

        paw.spyOn('_formatAuth', () => {
            return null
        })

        paw._parseRequest(ctx, req)

        this.assertEqual(paw.spy._formatHeaders.count, 1)
    }

    @targets('_parseRequest')
    testParseRequestCallsFormatQueries() {
        const [ paw, ctx, req ] = this.__init(3)

        paw.spyOn('_formatBody', () => {
            return [ new Immutable.List() ]
        })

        paw.spyOn('_formatHeaders', () => {
            return [ new Immutable.List(), new Immutable.List() ]
        })

        paw.spyOn('_formatQueries', () => {
            return new Immutable.List()
        })

        paw.spyOn('_formatAuth', () => {
            return null
        })

        paw._parseRequest(ctx, req)

        this.assertEqual(paw.spy._formatQueries.count, 1)
    }

    @targets('_parseRequest')
    testParseRequestCallsFormatAuth() {
        const [ paw, ctx, req ] = this.__init(3)

        paw.spyOn('_formatBody', () => {
            return [ new Immutable.List() ]
        })

        paw.spyOn('_formatHeaders', () => {
            return [ new Immutable.List(), new Immutable.List() ]
        })

        paw.spyOn('_formatQueries', () => {
            return new Immutable.List()
        })

        paw.spyOn('_formatAuth', () => {
            return null
        })

        paw._parseRequest(ctx, req)

        this.assertEqual(paw.spy._formatAuth.count, 1)
    }

    @targets('_parseRequest')
    testParseRequestReturnsRequestObject() {
        const [ paw, ctx, req ] = this.__init(3)

        paw.spyOn('_formatBody', () => {
            return [ new Immutable.List() ]
        })

        paw.spyOn('_formatBodies', () => {
            return 42
        })

        paw.spyOn('_formatHeaders', () => {
            return [ new Immutable.List(), new Immutable.List() ]
        })

        paw.spyOn('_formatQueries', () => {
            return new Immutable.List()
        })

        paw.spyOn('_formatAuth', () => {
            return null
        })

        const expected = new Request({
            url: new URL({
                protocol: 'http',
                host: 'localhost',
                pathname: '/'
            }),
            method: 'get',
            bodies: 42
        })

        const result = paw._parseRequest(ctx, req)

        this.assertJSONEqual(expected, result)
    }

    @targets('_formatParam')
    testFormatParam() {
        const paw = this.__init()

        const key = 'Content-Type'
        const value = 'application/json'

        const expected = new Parameter({
            key: key,
            name: key,
            value: value,
            type: 'string',
            internals: new Immutable.List([
                new Constraint.Enum([ value ])
            ]),
            externals: 42
        })

        const result = paw._formatParam(key, value, 42)

        this.assertJSONEqual(expected, result)
    }

    @targets('_formatReferenceParam')
    testFormatReferenceParamWithKey() {
        const paw = this.__init()

        const key = 'Content-Type'
        const value = new JSONSchemaReference({
            uri: '#/postman/Content-Type',
            relative: '#/postman/Content-Type',
            value: {
                type: 'string',
                enum: [
                    'application/xml',
                    'application/json'
                ]
            },
            resolved: true
        })

        const expected = new Parameter({
            key: key,
            name: key,
            value: value,
            type: 'reference',
            externals: 42
        })

        const result = paw._formatReferenceParam(key, value, 42)

        this.assertJSONEqual(expected, result)
    }

    @targets('_formatReferenceParam')
    testFormatReferenceParamWithNoKeyCallsUnescapeURIFragment() {
        const paw = this.__init()

        paw.spyOn('_unescapeURIFragment', (frag) => {
            return frag
        })

        const value = new JSONSchemaReference({
            uri: '#/postman/Content-Type',
            relative: '#/postman/Content-Type',
            value: {
                type: 'string',
                enum: [
                    'application/xml',
                    'application/json'
                ]
            },
            resolved: true
        })

        paw._formatReferenceParam(null, value)

        this.assertEqual(paw.spy._unescapeURIFragment.count, 1)
    }

    @targets('_formatReferenceParam')
    testFormatReferenceParamWithNoKeyReturnsExpectedParameter() {
        const paw = this.__init()

        paw.spyOn('_unescapeURIFragment', (frag) => {
            return frag
        })

        const value = new JSONSchemaReference({
            uri: '#/postman/Content-Type',
            relative: '#/postman/Content-Type',
            value: {
                type: 'string',
                enum: [
                    'application/xml',
                    'application/json'
                ]
            },
            resolved: true
        })

        const expected = new Parameter({
            key: 'Content-Type',
            name: 'Content-Type',
            value: value,
            type: 'reference',
            externals: 42
        })

        const result = paw._formatReferenceParam(null, value, 42)

        this.assertJSONEqual(expected, result)
    }

    @targets('_unescapeURIFragment')
    testUnescapeURIFragmentReplacesAllOccurences() {
        const paw = this.__init()

        const fragment = '~1some~1complex~0fragment~0with~0~1multiple~1~0parts'

        const expected = '/some/complex~fragment~with~/multiple/~parts'

        const result = paw._unescapeURIFragment(fragment)

        this.assertEqual(expected, result)
    }

    @targets('_unescapeURIFragment')
    testUnescapeURIFragmentSupportsBadlyEscapedFragments() {
        const paw = this.__init()

        const fragment = 'this~1fragment/was~poorly~0escaped'

        const expected = 'this/fragment/was~poorly~escaped'

        const result = paw._unescapeURIFragment(fragment)

        this.assertEqual(expected, result)
    }

    @targets('_formatHeaderParam')
    testFormatHeaderParamCallsFormatHeaderComponentForEachComponent() {
        const paw = this.__init()
        const ds = new DynamicString('a simple', 'dynamic', 'string')
        ds.length = 3

        paw.spyOn('_formatHeaderComponent', () => {
            return [ null, null ]
        })

        paw._formatHeaderParam(null, ds, new Immutable.List())

        this.assertEqual(paw.spy._formatHeaderComponent.count, 3)
    }

    @targets('_formatHeaderParam')
    testFormatHeaderParamCallsFormatHeaderComponentWithKeyIfOnlyOneComponent() {
        const paw = this.__init()
        paw.dvManager = new DynamicValueManager()
        const ds = new DynamicString('a simple dynamic string')
        ds.length = 1

        paw.spyOn('_formatHeaderComponent', () => {
            return [ null, null ]
        })

        const key = 'Content-Type'

        paw._formatHeaderParam(key, ds, new Immutable.List(), 42, null)

        this.assertEqual(paw.spy._formatHeaderComponent.count, 1)
        this.assertJSONEqual(
            paw.spy._formatHeaderComponent.calls[0],
            [ key, '', paw.dvManager, 42, null ]
        )
    }

    @targets('_formatHeaderParam')
    testFormatHeaderParamReturnsSequenceParamIfMultipleComponents() {
        const paw = this.__init()
        const ds = new DynamicString('application/', 'json')
        ds.length = 2

        paw.spyOn('_formatHeaderComponent', () => {
            return [ 12, null ]
        })

        const key = 'Content-Type'
        const auths = new Immutable.List()

        const expected = [
            new Parameter({
                key: key,
                name: key,
                type: 'string',
                format: 'sequence',
                value: new Immutable.List([
                    12, 12
                ]),
                externals: 42
            }),
            auths
        ]

        const result = paw._formatHeaderParam(key, ds, auths, 42)

        this.assertJSONEqual(expected, result)
    }

    @targets('_formatHeaderParam')
    testFormatHeaderParamReturnsStandardParamIfSingleComponent() {
        const paw = this.__init()
        const ds = new DynamicString('application/json')
        ds.length = 1

        paw.spyOn('_formatHeaderComponent', () => {
            return [ 12, null ]
        })

        const key = 'Content-Type'
        const auths = new Immutable.List()

        const expected = [
            12,
            auths
        ]

        const result = paw._formatHeaderParam(key, ds, auths)

        this.assertJSONEqual(expected, result)
    }

    @targets('_formatHeaderComponent')
    testFormatHeaderComponentWithStringComponentCallsFormatParam() {
        const paw = this.__init()
        const dvm = new ClassMock(new DynamicValueManager(), '')

        paw.spyOn('_formatParam', () => {
            return 12
        })

        dvm.spyOn('convert', () => {
            return null
        })

        const key = 'Content-Type'
        const component = 'application/json'

        const expected = [
            12,
            null
        ]

        const result = paw._formatHeaderComponent(key, component, dvm)

        this.assertJSONEqual(expected, result)
        this.assertEqual(dvm.spy.convert.count, 1)
    }

    @targets('_formatHeaderComponent')
    testFormatHeaderComponentWithStringComponentReturnsExpectedParam() {
        const paw = this.__init()
        const dvm = new ClassMock(new DynamicValueManager(), '')

        dvm.spyOn('convert', () => {
            return null
        })

        const key = 'Content-Type'
        const component = 'application/json'

        const expected = [
            new Parameter({
                key: key,
                name: key,
                type: 'string',
                value: component,
                internals: new Immutable.List([
                    new Constraint.Enum([ component ])
                ]),
                externals: 42
            }),
            null
        ]

        const result = paw._formatHeaderComponent(key, component, dvm, 42)

        this.assertJSONEqual(expected, result)
        this.assertEqual(dvm.spy.convert.count, 1)
    }

    @targets('_formatHeaderComponent')
    testFormatHeaderComponentWithDigestAuthDVreturnsExpectedAuth() {
        const paw = this.__init()
        const dvm = new ClassMock(new DynamicValueManager(), '')

        paw.spyOn('_formatParam', () => {
            return 12
        })

        const auth = new Auth.Digest({
            username: 'user',
            password: 'pass'
        })

        dvm.spyOn('convert', () => {
            return auth
        })

        const key = 'Content-Type'
        const component = {}

        const expected = [
            null,
            auth
        ]

        const result = paw._formatHeaderComponent(key, component, dvm)

        this.assertJSONEqual(expected, result)
    }

    @targets('_formatHeaderComponent')
    testFormatHeaderComponentWithAWSSig4AuthDVreturnsExpectedAuth() {
        const paw = this.__init()
        const dvm = new ClassMock(new DynamicValueManager(), '')

        paw.spyOn('_formatParam', () => {
            return 12
        })

        const auth = new Auth.AWSSig4({
            key: 'somekey',
            secret: 'mysupersecret',
            region: 'us-east1',
            service: 'myservice'
        })

        dvm.spyOn('convert', () => {
            return auth
        })

        const key = 'Content-Type'
        const component = {}

        const expected = [
            null,
            auth
        ]

        const result = paw._formatHeaderComponent(key, component, dvm)

        this.assertJSONEqual(expected, result)
    }

    @targets('_formatHeaderComponent')
    testFormatHeaderComponentWithHawkAuthDVreturnsExpectedAuth() {
        const paw = this.__init()
        const dvm = new ClassMock(new DynamicValueManager(), '')

        paw.spyOn('_formatParam', () => {
            return 12
        })

        const auth = new Auth.Hawk({
            id: 'myhawkid',
            key: 'somekey',
            algorithm: 'SuperSecureMD5'
        })

        dvm.spyOn('convert', () => {
            return auth
        })

        const key = 'Content-Type'
        const component = {}

        const expected = [
            null,
            auth
        ]

        const result = paw._formatHeaderComponent(key, component, dvm)

        this.assertJSONEqual(expected, result)
    }

    @targets('_formatHeaderComponent')
    testFormatHeaderComponentWithReferenceCallsFormatReferenceParam() {
        const paw = this.__init()
        paw.references = new Immutable.List()
        const dvm = new ClassMock(new DynamicValueManager(), '')

        paw.spyOn('_formatParamWithConstraints', () => {
            return 12
        })

        const ref = new JSONSchemaReference({
            uri: '#/some/uri',
            relative: '#/some/uri',
            value: {
                type: 'string',
                enum: [ 'test' ]
            },
            resolved: true
        })

        dvm.spyOn('convert', () => {
            return ref
        })

        const key = 'Content-Type'
        const component = {}

        const expected = [
            12,
            null
        ]

        const result = paw._formatHeaderComponent(key, component, dvm)

        this.assertJSONEqual(expected, result)
        this.assertEqual(paw.spy._formatParamWithConstraints.count, 1)
    }

    @targets('_formatHeaderComponent')
    testFormatHeaderComponentWithUnknownDVReturnsExpectedParam() {
        const paw = this.__init()
        const dvm = new ClassMock(new DynamicValueManager(), '')

        paw.spyOn('_formatParam', () => {
            return 12
        })

        dvm.spyOn('convert', () => {
            return null
        })

        const key = 'Content-Type'
        const component = {
            getEvaluatedString: () => {
                return 'some evaluated dv'
            }
        }

        const expected = [
            12,
            null
        ]

        const result = paw._formatHeaderComponent(key, component, dvm, 42)

        this.assertJSONEqual(expected, result)
        this.assertEqual(paw.spy._formatParam.count, 1)
        this.assertEqual(
            paw.spy._formatParam.calls[0],
            [ key, 'some evaluated dv', 42 ]
        )
    }

    @targets('_formatHeaders')
    testFormatHeadersWithContentTypeHeader() {
        const paw = this.__init()

        const headers = {
            Accept: new DynamicString('some encoding'),
            'Content-Type': new DynamicString('application/json')
        }

        const auths = new Immutable.List()

        paw.spyOn('_formatHeaderParam', () => {
            return [ 12, auths ]
        })

        const expected = [
            new Immutable.List([ 12, 12 ]),
            auths
        ]

        const result = paw._formatHeaders(headers, null, auths)

        this.assertJSONEqual(expected, result)
        this.assertEqual(paw.spy._formatHeaderParam.count, 2)
    }

    @targets('_formatHeaders')
    testFormatHeadersWithNoContentTypeHeader() {
        const paw = this.__init()

        const headers = {
            Accept: new DynamicString('some encoding'),
            'Not-Content-Type': new DynamicString('application/json')
        }

        const contentType = 'application/xml'

        const auths = new Immutable.List()

        paw.spyOn('_formatHeaderParam', (_, __, _auths) => {
            return [ 12, _auths.push(90) ]
        })

        paw.spyOn('_formatParam', () => {
            return 42
        })

        const expected = [
            new Immutable.List([ 12, 12, 42 ]),
            new Immutable.List([ 90, 90 ])
        ]

        const result = paw._formatHeaders(headers, contentType, auths)

        this.assertJSONEqual(expected, result)
        this.assertEqual(paw.spy._formatHeaderParam.count, 2)
    }

    @targets('_formatQueryParam')
    testFormatQueryParamCallsFormatQueryComponentOnlyOnceForSingleComponent() {
        const paw = this.__init()
        const ds = new DynamicString('a;slkfjwjefowij@wefjwpoij,mdw;eo')
        ds.length = 1

        paw.spyOn('_formatQueryComponent', () => {
            return 12
        })

        const key = 'api_key'

        paw._formatQueryParam(key, ds)

        this.assertEqual(paw.spy._formatQueryComponent.count, 1)
    }

    @targets('_formatQueryParam')
    testFormatQueryParamCallsFormatQueryComponentForEachComponent() {
        const paw = this.__init()
        const ds = new DynamicString('a;slkfjwjefowij', 'wefjwpoij,mdw;eo')
        ds.length = 2

        paw.spyOn('_formatQueryComponent', () => {
            return 12
        })

        const key = 'api_key'

        paw._formatQueryParam(key, ds)

        this.assertEqual(paw.spy._formatQueryComponent.count, 2)
    }

    @targets('_formatQueryParam')
    testFormatQueryParamReturnsSequenceParamIfMultipleComponents() {
        const paw = this.__init()
        const ds = new DynamicString('a;slkfjwjefowij', 'wefjwpoij,mdw;eo')
        ds.length = 2

        paw.spyOn('_formatQueryComponent', () => {
            return 12
        })

        const key = 'api_key'

        const expected = new Parameter({
            key: key,
            name: key,
            type: 'string',
            format: 'sequence',
            value: new Immutable.List([
                12, 12
            ]),
            externals: 42
        })

        const result = paw._formatQueryParam(key, ds, 42)

        this.assertJSONEqual(expected, result)
    }

    @targets('_formatQueryParam')
    testFormatQueryParamReturnsSimpleParamIfOnlyOneComponent() {
        const paw = this.__init()
        const ds = new DynamicString('a;slkfjwjefowij@wefjwpoij,mdw;eo')
        ds.length = 1

        paw.spyOn('_formatQueryComponent', () => {
            return 12
        })

        const key = 'api_key'

        const expected = 12

        const result = paw._formatQueryParam(key, ds)

        this.assertJSONEqual(expected, result)
    }

    @targets('_formatQueryComponent')
    testFormatQueryComponentWithStringComponentCallsFormatParam() {
        const paw = this.__init()
        const dvm = new ClassMock(new DynamicValueManager(), '')

        paw.spyOn('_formatParam', () => {
            return 12
        })

        dvm.spyOn('convert', () => {
            return null
        })

        const key = 'Content-Type'
        const component = 'application/json'

        const expected = 12

        const result = paw._formatQueryComponent(key, component, dvm)

        this.assertJSONEqual(expected, result)
        this.assertEqual(dvm.spy.convert.count, 1)
    }

    @targets('_formatQueryComponent')
    testFormatQueryComponentWithStringComponentReturnsExpectedParam() {
        const paw = this.__init()
        const dvm = new ClassMock(new DynamicValueManager(), '')

        dvm.spyOn('convert', () => {
            return null
        })

        const key = 'Content-Type'
        const component = 'application/json'

        const expected = new Parameter({
            key: key,
            name: key,
            type: 'string',
            value: component,
            internals: new Immutable.List([
                new Constraint.Enum([ component ])
            ]),
            externals: 42
        })

        const result = paw._formatQueryComponent(key, component, dvm, 42)

        this.assertJSONEqual(expected, result)
        this.assertEqual(dvm.spy.convert.count, 1)
    }

    @targets('_formatQueryComponent')
    testFormatQueryComponentWithReferenceCallsFormatReferenceParam() {
        const paw = this.__init()
        paw.references = new Immutable.List()
        const dvm = new ClassMock(new DynamicValueManager(), '')

        paw.spyOn('_formatParamWithConstraints', () => {
            return 12
        })

        const ref = new JSONSchemaReference({
            uri: '#/some/uri',
            relative: '#/some/uri',
            value: {
                type: 'string',
                enum: [ 'test' ]
            },
            resolved: true
        })

        dvm.spyOn('convert', () => {
            return ref
        })

        const key = 'Content-Type'
        const component = {}

        const expected = 12

        const result = paw._formatQueryComponent(key, component, dvm)

        this.assertJSONEqual(expected, result)
        this.assertEqual(paw.spy._formatParamWithConstraints.count, 1)
    }

    @targets('_formatQueryComponent')
    testFormatQueryComponentWithUnknownDVReturnsExpectedParam() {
        const paw = this.__init()
        const dvm = new ClassMock(new DynamicValueManager(), '')

        paw.spyOn('_formatParam', () => {
            return 12
        })

        dvm.spyOn('convert', () => {
            return null
        })

        const key = 'Content-Type'
        const component = {
            getEvaluatedString: () => {
                return 'some evaluated dv'
            }
        }

        const expected = 12

        const result = paw._formatQueryComponent(key, component, dvm, 42)

        this.assertJSONEqual(expected, result)
        this.assertEqual(paw.spy._formatParam.count, 1)
        this.assertEqual(
            paw.spy._formatParam.calls[0],
            [ key, 'some evaluated dv', 42 ]
        )
    }

    @targets('_formatQueries')
    testFormatQueriesCallsFormatQueryParamForEachQuery() {
        const paw = this.__init()
        const queries = {
            api_key: new DynamicString('1204580192847569182741509781'),
            location: new DynamicString('London'),
            limit: new DynamicString('190284')
        }

        paw.spyOn('_formatQueryParam', () => {
            return 12
        })

        const expected = [ 12, 12, 12 ]

        const result = paw._formatQueries(queries)

        this.assertEqual(expected, result)
        this.assertEqual(paw.spy._formatQueryParam.count, 3)
    }

    @targets('_formatPlainBody')
    testFormatPlainBodyCallsFormatReferenceParam() {
        const paw = this.__init()

        paw.dvManager = {
            convert: () => new ExoticReference()
        }

        const content = {
            getEvaluatedString: () => {
                return 'test content'
            },
            getComponentAtIndex: () => {
                return 'test content'
            },
            length: 1
        }

        paw.spyOn('_formatReferenceParam', () => {
            return 12
        })

        paw._formatPlainBody(content)

        this.assertEqual(paw.spy._formatReferenceParam.count, 1)
    }

    @targets('_formatPlainBody')
    testFormatPlainBodyCallsFormatParamWithCorrectArguments() {
        const paw = this.__init()

        paw.dvManager = {
            convert: () => new ExoticReference()
        }

        const content = {
            getEvaluatedString: () => {
                return 'test content'
            },
            getComponentAtIndex: () => {
                return 'test content'
            },
            length: 1
        }

        paw.spyOn('_formatReferenceParam', () => {
            return 12
        })

        paw._formatPlainBody(content, 42)

        this.assertEqual(paw.spy._formatReferenceParam.count, 1)
        this.assertJSONEqual(
            paw.spy._formatReferenceParam.calls[0],
            [ null, new ExoticReference(), 42 ]
        )
    }

    @targets('_formatPlainBody')
    testFormatPlainBodyReturnsExpectedParam() {
        const paw = this.__init()
        paw.dvManager = new DynamicValueManager()

        const content = {
            getEvaluatedString: () => {
                return 'test content'
            },
            getComponentAtIndex: () => {
                return 'test content'
            },
            length: 1
        }

        paw.spyOn('_formatParam', () => {
            return 12
        })

        const expected = new Parameter({
            name: 'body',
            value: new JSONSchemaReference({
                value: {
                    type: 'string',
                    default: 'test content'
                },
                resolved: true
            }),
            type: 'reference'
        })

        const result = paw._formatPlainBody(content, new Immutable.List())

        this.assertJSONEqual(expected, result)
    }

    @targets('_formatBody')
    testFormatBodyCallsAllGetBodyMethodsFromRequest() {
        const [ paw, ctx, req ] = this.__init(3)

        if (!ctx) {
            return
        }

        req.spyOn('getBody', () => {
            return {}
        })

        req.spyOn('getUrlEncodedBody', () => {
            return {}
        })

        req.spyOn('getMultipartBody', () => {
            return {}
        })

        paw.spyOn('_formatPlainBody', () => {
            return [ 12, 42 ]
        })

        paw._formatBody(req)

        this.assertEqual(req.spy.getBody.count, 1)
        this.assertEqual(req.spy.getUrlEncodedBody.count, 1)
        this.assertEqual(req.spy.getMultipartBody.count, 1)
    }

    @targets('_formatBody')
    testFormatBodyUsesDynamicStringsFromEachGetBodyMethod() {
        const [ paw, ctx, req ] = this.__init(3)

        if (!ctx) {
            return
        }

        req.spyOn('getBody', () => {
            return {}
        })

        req.spyOn('getUrlEncodedBody', () => {
            return {}
        })

        req.spyOn('getMultipartBody', () => {
            return {}
        })

        paw.spyOn('_formatPlainBody', () => {
            return [ 12, 42 ]
        })

        paw._formatBody(req)

        this.assertEqual(req.spy.getBody.count, 1)
        this.assertEqual(req.spy.getUrlEncodedBody.count, 1)
        this.assertEqual(req.spy.getMultipartBody.count, 1)

        this.assertEqual(req.spy.getBody.calls[0], [ true ])
        this.assertEqual(req.spy.getUrlEncodedBody.calls[0], [ true ])
        this.assertEqual(req.spy.getMultipartBody.calls[0], [ true ])
    }

    @targets('_formatBody')
    testFormatBodyCallsFormatPlainBodyIfBodyDoesNotHaveOnlyOneComponent() {
        const [ paw, ctx, req ] = this.__init(3)

        if (!ctx) {
            return
        }

        req.spyOn('getBody', () => {
            return {}
        })

        req.spyOn('getUrlEncodedBody', () => {
            return {}
        })

        req.spyOn('getMultipartBody', () => {
            return {}
        })

        paw.spyOn('_formatPlainBody', () => {
            return [ 12, 42 ]
        })

        paw._formatBody(req)

        this.assertEqual(paw.spy._formatPlainBody.count, 1)
    }

    @targets('_formatBody')
    testFormatBodyCallsFormatPlainBodyWithItselfIfItNotOneComponent() {
        const [ paw, ctx, req ] = this.__init(3)

        if (!ctx) {
            return
        }

        req.spyOn('getBody', () => {
            return 12
        })

        req.spyOn('getUrlEncodedBody', () => {
            return {}
        })

        req.spyOn('getMultipartBody', () => {
            return {}
        })

        paw.spyOn('_formatPlainBody', () => {
            return [ 12, 42 ]
        })

        paw._formatBody(req)

        this.assertEqual(paw.spy._formatPlainBody.count, 1)
        this.assertJSONEqual(
            paw.spy._formatPlainBody.calls[0],
            [
                12,
                new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'text/plain'
                            ])
                        ])
                    })
                ])
            ]
        )
    }

    testFormatBodyReturnsExpectedParamIfItDoesNotHaveOnlyOneComponent() {
        const [ paw, ctx, req ] = this.__init(3)

        if (!ctx) {
            return
        }

        req.spyOn('getBody', () => {
            return 12
        })

        req.spyOn('getUrlEncodedBody', () => {
            return {}
        })

        req.spyOn('getMultipartBody', () => {
            return {}
        })

        paw.spyOn('_formatPlainBody', () => {
            return 12
        })

        const expected = [
            new Immutable.List([ 12 ]),
            'text/plain',
            new Immutable.List([
                new Parameter({
                    key: 'Content-Type',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            'text/plain'
                        ])
                    ])
                })
            ])
        ]

        const result = paw._formatBody(req)

        this.assertJSONEqual(expected, result)
    }

    @targets('_formatBody')
    testFormatBodyCallsFormatQueryParamForEachParamInUrlEncodedBody() {
        const [ paw, ctx, req ] = this.__init(3)

        if (!ctx) {
            return
        }

        const ds = new DynamicString({ a: 'more complex ds' })
        ds.length = 1

        req.spyOn('getBody', () => {
            return ds
        })

        req.spyOn('getUrlEncodedBody', () => {
            return {
                api_key: new DynamicString('1204580192847569182741509781'),
                location: new DynamicString('London'),
                limit: new DynamicString('190284')
            }
        })

        req.spyOn('getMultipartBody', () => {
            return {}
        })

        paw.spyOn('_formatQueryParam', () => {
            return 12
        })

        paw._formatBody(req)

        this.assertEqual(paw.spy._formatQueryParam.count, 3)
    }

    @targets('_formatBody')
    testFormatBodyReturnsExpectedParamWithUrlEncodedBody() {
        const [ paw, ctx, req ] = this.__init(3)

        if (!ctx) {
            return
        }

        const ds = new DynamicString({ a: 'more complex ds' })
        ds.length = 1

        req.spyOn('getBody', () => {
            return ds
        })

        req.spyOn('getUrlEncodedBody', () => {
            return {
                api_key: new DynamicString('1204580192847569182741509781'),
                location: new DynamicString('London'),
                limit: new DynamicString('190284')
            }
        })

        req.spyOn('getMultipartBody', () => {
            return null
        })

        paw.spyOn('_formatQueryParam', () => {
            return 12
        })

        const expected = [
            new Immutable.List([ 12, 12, 12 ]),
            'application/x-www-form-urlencoded',
            new Immutable.List([
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
        ]

        const result = paw._formatBody(req)

        this.assertJSONEqual(expected, result)
    }

    @targets('_formatBody')
    testFormatBodyCallsFormatQueryParamForEachParamInMultipartBody() {
        const [ paw, ctx, req ] = this.__init(3)

        if (!ctx) {
            return
        }

        const ds = new DynamicString({ a: 'more complex ds' })
        ds.length = 1

        req.spyOn('getBody', () => {
            return ds
        })

        req.spyOn('getMultipartBody', () => {
            return {
                api_key: new DynamicString('1204580192847569182741509781'),
                location: new DynamicString('London'),
                limit: new DynamicString('190284')
            }
        })

        req.spyOn('getUrlEncodedBody', () => {
            return null
        })

        paw.spyOn('_formatQueryParam', () => {
            return 12
        })

        paw._formatBody(req)

        this.assertEqual(paw.spy._formatQueryParam.count, 3)
    }

    @targets('_formatBody')
    testFormatBodyReturnsExpectedParamWithMultipartBody() {
        const [ paw, ctx, req ] = this.__init(3)

        if (!ctx) {
            return
        }

        const ds = new DynamicString({ a: 'more complex ds' })
        ds.length = 1

        req.spyOn('getBody', () => {
            return ds
        })

        req.spyOn('getMultipartBody', () => {
            return {
                api_key: new DynamicString('1204580192847569182741509781'),
                location: new DynamicString('London'),
                limit: new DynamicString('190284')
            }
        })

        req.spyOn('getUrlEncodedBody', () => {
            return null
        })

        paw.spyOn('_formatQueryParam', () => {
            return 12
        })

        const expected = [
            new Immutable.List([ 12, 12, 12 ]),
            'multipart/form-data',
            new Immutable.List([
                new Parameter({
                    key: 'Content-Type',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([ 'multipart/form-data' ])
                    ])
                })
            ])
        ]

        const result = paw._formatBody(req)

        this.assertJSONEqual(expected, result)
    }

    @targets('_formatBody')
    testFormatBodyCallsFormatPlainBodyWithUnknownBodyType() {
        const [ paw, ctx, req ] = this.__init(3)

        if (!ctx) {
            return
        }

        const ds = new DynamicString({ a: 'more complex ds' })
        ds.length = 1

        req.spyOn('getBody', () => {
            return ds
        })

        req.spyOn('getMultipartBody', () => {
            return null
        })

        req.spyOn('getUrlEncodedBody', () => {
            return null
        })

        paw.spyOn('_formatPlainBody', () => {
            return [ 12, 42 ]
        })

        paw._formatBody(req)

        this.assertEqual(paw.spy._formatPlainBody.count, 1)
    }

    @targets('_formatBody')
    testFormatBodyReturnsExpectedParamWithUnknownBodyType() {
        const [ paw, ctx, req ] = this.__init(3)

        if (!ctx) {
            return
        }

        const ds = new DynamicString({ a: 'more complex ds' })
        ds.length = 1

        req.spyOn('getBody', () => {
            return ds
        })

        req.spyOn('getMultipartBody', () => {
            return null
        })

        req.spyOn('getUrlEncodedBody', () => {
            return null
        })

        paw.spyOn('_formatPlainBody', () => {
            return 14
        })

        const expected = [
            new Immutable.List([ 14 ]),
            'text/plain',
            new Immutable.List([
                new Parameter({
                    key: 'Content-Type',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([ 'text/plain' ])
                    ])
                })
            ])
        ]

        const result = paw._formatBody(req)

        this.assertJSONEqual(expected, result)
    }

    @targets('_formatAuth')
    testFormatAuthCallsAllAuthMethodsFromRequest() {
        const paw = this.__init()
        const req = new PawRequestMock({}, '')

        req.spyOn('getHttpBasicAuth', () => {
            return null
        })

        req.spyOn('getOAuth1', () => {
            return null
        })

        req.spyOn('getOAuth2', () => {
            return null
        })

        paw._formatAuth(req)

        this.assertEqual(req.spy.getOAuth1.count, 1)
        this.assertEqual(req.spy.getOAuth2.count, 1)
    }

    @targets('_formatAuth')
    testFormatAuthReturnsEmptyListIfNoMatch() {
        const paw = this.__init()
        const req = new PawRequestMock({}, '')

        req.spyOn('getHttpBasicAuth', () => {
            return null
        })

        req.spyOn('getOAuth1', () => {
            return null
        })

        req.spyOn('getOAuth2', () => {
            return null
        })

        const expected = new Immutable.List()

        const result = paw._formatAuth(req)

        this.assertEqual(expected, result)
    }

    @targets('_formatAuth')
    testFormatAuthReturnsOAuth1IfAppropriate() {
        const paw = this.__init()
        const req = new PawRequestMock({}, '')

        req.spyOn('getHttpBasicAuth', () => {
            return null
        })

        req.spyOn('getOAuth1', () => {
            return {
                callback: 'asda',
                consumerKey: 'woeghw',
                consumerSecret: 'woergjhw',
                tokenSecret: 'oeurthfb',
                algorithm: 'eoriy',
                nonce: 'woruetyw',
                additionalParameters: 'snbcwe',
                timestamp: '129048726',
                token: 'w[p49673]'
            }
        })

        req.spyOn('getOAuth2', () => {
            return null
        })

        const expected = new Immutable.List([
            new Auth.OAuth1({
                callback: 'asda',
                consumerKey: 'woeghw',
                consumerSecret: 'woergjhw',
                tokenSecret: 'oeurthfb',
                algorithm: 'eoriy',
                nonce: 'woruetyw',
                additionalParameters: 'snbcwe',
                timestamp: '129048726',
                token: 'w[p49673]'
            })
        ])

        const result = paw._formatAuth(req)

        this.assertEqual(expected, result)
    }

    @targets('_formatAuth')
    testFormatAuthReturnsOAuth2IfAppropriate() {
        const paw = this.__init()
        const req = new PawRequestMock({}, '')

        req.spyOn('getHttpBasicAuth', () => {
            return null
        })

        req.spyOn('getOAuth1', () => {
            return null
        })

        req.spyOn('getOAuth2', () => {
            return {
                grantType: 1,
                authorizationUrl: 'w;oeifhwe',
                tokenUrl: 'h2oiufh23',
                scope: 'read:any write:self'
            }
        })

        const expected = new Immutable.List([
            new Auth.OAuth2({
                flow: 'implicit',
                authorizationUrl: 'w;oeifhwe',
                tokenUrl: 'h2oiufh23',
                scopes: [ 'read:any', 'write:self' ]
            })
        ])

        const result = paw._formatAuth(req)

        this.assertJSONEqual(expected, result)
    }

    @targets('_parseDomains')
    testParseDomainWithEmptyReferenceList() {
        const paw = this.__init()
        paw.references = new Immutable.List()

        const expected = new Immutable.OrderedMap({
            paw: new ReferenceContainer()
        })

        const result = paw._parseDomains()

        this.assertEqual(expected, result)
    }

    @targets('_parseDomains')
    testParseDomainsWithSimpleReferenceList() {
        const paw = this.__init()
        paw.references = new Immutable.List([
            new JSONSchemaReference({
                uri: '#/paw/param',
                relative: '#/paw/param',
                value: {
                    type: 'string',
                    enum: [ 'hello', 'world' ]
                },
                resolved: true
            }),
            new JSONSchemaReference({
                uri: '#/paw/other',
                relative: '#/paw/other',
                value: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 5
                },
                resolved: true
            })
        ])

        const expected = new Immutable.OrderedMap({
            paw: (new ReferenceContainer()).create(paw.references)
        })

        const result = paw._parseDomains()

        this.assertEqual(expected, result)
    }

    @targets('_parseDomains')
    _testParseDomainsWithComplexReferenceList() {
        const paw = this.__init()
        paw.references = new Immutable.List([
            new JSONSchemaReference({
                uri: '#/paw/param',
                relative: '#/paw/param',
                value: {
                    type: 'object',
                    properties: {
                        item: {
                            $ref: '#/paw/missing'
                        },
                        other: {
                            $ref: '#/paw/other'
                        }
                    }
                },
                resolved: true
            }),
            new JSONSchemaReference({
                uri: '#/paw/other',
                relative: '#/paw/other',
                value: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 5
                },
                resolved: true
            })
        ])

        // TODO set expected to correct value
        const expected = null

        const result = paw._parseDomains()

        this.assertEqual(expected, result)
    }

    @targets('_parseInfo')
    testParseInfo() {
        const paw = this.__init()

        const expected = new Info()

        const result = paw._parseInfo()

        this.assertEqual(expected, result)
    }

    @targets('_formatBodies')
    testFormatBodies() {
        // TODO implement test
        const paw = this.__init()

        const contentType = 42

        const expected = new Immutable.List([
            new Body({
                constraints: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        type: 'string',
                        value: contentType
                    })
                ])
            })
        ])
        const result = paw._formatBodies(contentType)

        this.assertJSONEqual(expected, result)
    }

    @targets('_formatURL')
    testFormatURLWithNullDs() {
        /* eslint-disable no-unused-vars */
        const [ paw, ctx, req ] = this.__init(3)
        /* eslint-enable no-unused-vars */

        req.spyOn('getUrlBase', () => {
            return null
        })

        const expected = [
            {
                protocol: 'http',
                host: 'localhost',
                pathname: '/'
            },
            new Immutable.List()
        ]
        const result = paw._formatURL(req, 42)

        this.assertEqual(expected, result)
    }

    @targets('_formatURL')
    testFormatURLWithSimpleString() {
        /* eslint-disable no-unused-vars */
        const [ paw, ctx, req ] = this.__init(3)
        /* eslint-enable no-unused-vars */

        let url = new DynamicString('https://fakeurl.com/path')

        url.length = 1
        url.$$_spyOn('getEvaluatedString', () => {
            return 'https://fakeurl.com/path'
        })

        url.$$_spyOn('getComponentAtIndex', () => {
            return 'https://fakeurl.com/path'
        })

        req.spyOn('getUrlBase', () => {
            return url
        })

        const expected = [
            {
                protocol: new Parameter({
                    type: 'string',
                    value: 'https',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            'https'
                        ])
                    ])
                }),
                host: new Parameter({
                    type: 'string',
                    value: 'fakeurl.com',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            'fakeurl.com'
                        ])
                    ])
                }),
                pathname: new Parameter({
                    type: 'string',
                    value: '/path',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            '/path'
                        ])
                    ])
                })
            },
            new Immutable.List()
        ]

        const result = paw._formatURL(req, 42)

        this.assertJSONEqual(expected, result)
    }

    @targets('_formatURL')
    testFormatURLWithSplitString() {
        /* eslint-disable no-unused-vars */
        const [ paw, ctx, req ] = this.__init(3)
        /* eslint-enable no-unused-vars */

        let content = [ 'https://fakeurl', '.com/path' ]
        let url = new DynamicString(...content)

        url.length = 2
        url.$$_spyOn('getEvaluatedString', () => {
            return 'https://fakeurl.com/path'
        })

        url.$$_spyOn('getComponentAtIndex', () => {
            return content.shift()
        })

        req.spyOn('getUrlBase', () => {
            return url
        })

        const expected = [
            {
                protocol: new Parameter({
                    type: 'string',
                    value: 'https',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            'https'
                        ])
                    ])
                }),
                host: new Parameter({
                    type: 'string',
                    value: 'fakeurl.com',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            'fakeurl.com'
                        ])
                    ])
                }),
                pathname: new Parameter({
                    type: 'string',
                    value: '/path',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            '/path'
                        ])
                    ])
                })
            },
            new Immutable.List()
        ]

        const result = paw._formatURL(req, 42)

        this.assertJSONEqual(expected, result)
    }

    @targets('_formatURL')
    testFormatURLWithNamedJSF() {
        /* eslint-disable no-unused-vars */
        const [ paw, ctx, req ] = this.__init(3)
        /* eslint-enable no-unused-vars */

        let jsf = new JSONSchemaReference({
            value: {
                type: 'string',
                enum: [ 'co.uk', 'fr', 'de' ],
                'x-title': 'tld'
            },
            resolved: true
        })

        paw.dvManager = new ClassMock(new DynamicValueManager(), '')
        paw.dvManager.spyOn('convert', () => {
            return jsf
        })

        let jsfdv = new DynamicValue(
            'com.luckymarmot.PawExtensions.JSONSchemaFakerDynamicValue',
            {
                schema: {
                    type: 'string',
                    enum: [ 'com', 'io', 'jp' ],
                    'x-title': 'tld'
                }
            }
        )
        let content = [ 'https://fakeurl.', jsfdv, '/path' ]
        let url = new DynamicString(...content)

        url.length = 3
        url.$$_spyOn('getEvaluatedString', () => {
            return 'https://fakeurl.com/path'
        })


        url.$$_spyOn('getComponentAtIndex', () => {
            return content.shift()
        })

        req.spyOn('getUrlBase', () => {
            return url
        })

        const expected = [
            {
                protocol: new Parameter({
                    type: 'string',
                    value: 'https',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            'https'
                        ])
                    ])
                }),
                host: new Parameter({
                    key: 'host',
                    name: 'host',
                    type: 'string',
                    format: 'sequence',
                    value: new Immutable.List([
                        new Parameter({
                            type: 'string',
                            value: 'fakeurl.',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'fakeurl.'
                                ])
                            ])
                        }),
                        new Parameter({
                            key: 'tld',
                            name: 'tld',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'co.uk', 'fr', 'de'
                                ])
                            ]),
                            externals: 42
                        })
                    ])
                }),
                pathname: new Parameter({
                    type: 'string',
                    value: '/path',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            '/path'
                        ])
                    ])
                })
            },
            new Immutable.List()
        ]

        const result = paw._formatURL(req, 42)

        this.assertJSONEqual(expected, result)
    }

    @targets('_formatURL')
    testFormatURLWithUnnamedJSF() {
        /* eslint-disable no-unused-vars */
        const [ paw, ctx, req ] = this.__init(3)
        /* eslint-enable no-unused-vars */

        let jsf = new JSONSchemaReference({
            value: {
                type: 'string',
                enum: [ 'co.uk', 'fr', 'de' ]
            },
            resolved: true
        })

        paw.dvManager = new ClassMock(new DynamicValueManager(), '')
        paw.dvManager.spyOn('convert', () => {
            return jsf
        })

        let jsfdv = new DynamicValue(
            'com.luckymarmot.PawExtensions.JSONSchemaFakerDynamicValue',
            {
                schema: {
                    type: 'string',
                    enum: [ 'com', 'io', 'jp' ],
                    'x-title': 'tld'
                }
            }
        )
        let content = [ 'https://fakeurl.', jsfdv, '/path' ]
        let url = new DynamicString(...content)

        url.length = 3
        url.$$_spyOn('getEvaluatedString', () => {
            return 'https://fakeurl.com/path'
        })

        url.$$_spyOn('getComponentAtIndex', () => {
            return content.shift()
        })

        req.spyOn('getUrlBase', () => {
            return url
        })

        const expected = [
            {
                protocol: new Parameter({
                    type: 'string',
                    value: 'https',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            'https'
                        ])
                    ])
                }),
                host: new Parameter({
                    key: 'host',
                    name: 'host',
                    type: 'string',
                    format: 'sequence',
                    value: new Immutable.List([
                        new Parameter({
                            type: 'string',
                            value: 'fakeurl.',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'fakeurl.'
                                ])
                            ])
                        }),
                        new Parameter({
                            key: 'Object',
                            name: 'Object',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'co.uk', 'fr', 'de'
                                ])
                            ]),
                            externals: 42
                        })
                    ])
                }),
                pathname: new Parameter({
                    type: 'string',
                    value: '/path',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            '/path'
                        ])
                    ])
                })
            },
            new Immutable.List()
        ]

        const result = paw._formatURL(req, 42)

        this.assertJSONEqual(expected, result)
    }

    @targets('_formatURL')
    testFormatURLWithExoticDV() {
        /* eslint-disable no-unused-vars */
        const [ paw, ctx, req ] = this.__init(3)
        /* eslint-enable no-unused-vars */

        paw.dvManager = new ClassMock(new DynamicValueManager(), '')
        paw.dvManager.spyOn('convert', () => {
            return 'evaluated string of dv - not used'
        })

        let dv = new DynamicValue('some.unknown.dv', {}, '')

        dv.spyOn('getEvaluatedString', () => {
            return 'com'
        })

        let content = [ 'https://fakeurl.', dv, '/path' ]
        let url = new DynamicString(...content)

        url.length = 3
        url.$$_spyOn('getEvaluatedString', () => {
            return 'https://fakeurl.com/path'
        })

        url.$$_spyOn('getComponentAtIndex', () => {
            return content.shift()
        })

        req.spyOn('getUrlBase', () => {
            return url
        })

        const expected = [
            {
                protocol: new Parameter({
                    type: 'string',
                    value: 'https',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            'https'
                        ])
                    ])
                }),
                host: new Parameter({
                    key: 'host',
                    name: 'host',
                    type: 'string',
                    format: 'sequence',
                    value: new Immutable.List([
                        new Parameter({
                            type: 'string',
                            value: 'fakeurl.',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'fakeurl.'
                                ])
                            ])
                        }),
                        new Parameter({
                            key: 'dv',
                            name: 'dv',
                            type: 'string',
                            value: 'com',
                            externals: 42
                        })
                    ])
                }),
                pathname: new Parameter({
                    type: 'string',
                    value: '/path',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            '/path'
                        ])
                    ])
                })
            },
            new Immutable.List()
        ]

        const result = paw._formatURL(req, 42)

        this.assertJSONEqual(expected, result)
    }

    @targets('_formatURL')
    testFormatURLWithMultipleDVs() {
        /* eslint-disable no-unused-vars */
        const [ paw, ctx, req ] = this.__init(3)
        /* eslint-enable no-unused-vars */

        paw.dvManager = new ClassMock(new DynamicValueManager(), '')
        paw.dvManager.spyOn('convert', () => {
            return 'evaluated string of dv - not used'
        })

        let protocol = new DynamicValue('some.generator.protocol', {}, '')

        protocol.spyOn('getEvaluatedString', () => {
            return 'https'
        })

        let sub = new DynamicValue('some.generator.sub', {}, '')

        sub.spyOn('getEvaluatedString', () => {
            return 'live'
        })

        let tld = new DynamicValue('some.generator.tld', {}, '')

        tld.spyOn('getEvaluatedString', () => {
            return 'com'
        })

        let path = new DynamicValue('some.generator.userId', {}, '')

        path.spyOn('getEvaluatedString', () => {
            return '12309841'
        })

        let content = [ protocol, '://', sub, '.fakeurl.', tld, '/path/', path ]
        let url = new DynamicString(...content)

        url.length = 7
        url.$$_spyOn('getEvaluatedString', () => {
            return 'https://fakeurl.com/path'
        })

        url.$$_spyOn('getComponentAtIndex', () => {
            return content.shift()
        })

        req.spyOn('getUrlBase', () => {
            return url
        })

        const expected = [
            {
                protocol: new Parameter({
                    key: 'protocol',
                    name: 'protocol',
                    type: 'string',
                    value: 'https',
                    externals: 42
                }),
                host: new Parameter({
                    key: 'host',
                    name: 'host',
                    type: 'string',
                    format: 'sequence',
                    value: new Immutable.List([
                        new Parameter({
                            key: 'sub',
                            name: 'sub',
                            type: 'string',
                            value: 'live',
                            externals: 42
                        }),
                        new Parameter({
                            type: 'string',
                            value: '.fakeurl.',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    '.fakeurl.'
                                ])
                            ])
                        }),
                        new Parameter({
                            key: 'tld',
                            name: 'tld',
                            type: 'string',
                            value: 'com',
                            externals: 42
                        })
                    ])
                }),
                pathname: new Parameter({
                    key: 'pathname',
                    name: 'pathname',
                    type: 'string',
                    format: 'sequence',
                    value: new Immutable.List([
                        new Parameter({
                            type: 'string',
                            value: '/path/',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    '/path/'
                                ])
                            ])
                        }),
                        new Parameter({
                            key: 'userId',
                            name: 'userId',
                            type: 'string',
                            value: '12309841',
                            externals: 42
                        })
                    ])
                })
            },
            new Immutable.List([
                new Parameter({
                    key: 'userId',
                    name: 'userId',
                    type: 'string',
                    value: '12309841',
                    externals: 42
                })
            ])
        ]

        const result = paw._formatURL(req, 42)

        this.assertJSONEqual(expected, result)
    }

    @targets('_formatParamWithConstraints')
    testFormatParamWithConstraints() {
        // TODO implement test
        const paw = this.__init()

        const key = 'userId'
        const name = 'User Id'
        const schema = {
            type: 'integer',
            minimum: 0,
            maximum: 100,
            exclusiveMaximum: true,
            multipleOf: 5,
            enum: [ 12, 15, 20, 25, 89, 1385 ]
        }
        const externals = 42

        const expected = new Parameter({
            key: key,
            name: name,
            type: 'integer',
            internals: new Immutable.List([
                new Constraint.Minimum(0),
                new Constraint.Maximum(100),
                new Constraint.ExclusiveMaximum(100),
                new Constraint.MultipleOf(5),
                new Constraint.Enum([ 12, 15, 20, 25, 89, 1385 ])
            ]),
            externals: externals
        })

        const result = paw._formatParamWithConstraints(
            key, schema, name, externals
        )

        this.assertJSONEqual(expected, result)
    }

    @targets('_formatURIComponent')
    testFormatURIComponentWithSimpleString() {
        const paw = this.__init()

        const source = 'host'
        const content = 'fakeurl.com'
        const parameters = {}

        const expected = new Parameter({
            type: 'string',
            value: 'fakeurl.com',
            internals: new Immutable.List([
                new Constraint.Enum([
                    'fakeurl.com'
                ])
            ])
        })

        const result = paw._formatURIComponent(source, content, parameters)

        this.assertJSONEqual(expected, result)
    }

    @targets('_formatURIComponent')
    testFormatURIComponentWithParameter() {
        const paw = this.__init()

        const source = 'host'
        const content = 'fakeurl.{tld}'
        const parameters = {
            tld: new Parameter({
                key: 'tld',
                name: 'tld',
                type: 'string'
            })
        }

        const expected = new Parameter({
            key: source,
            name: source,
            type: 'string',
            format: 'sequence',
            value: new Immutable.List([
                new Parameter({
                    type: 'string',
                    value: 'fakeurl.',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            'fakeurl.'
                        ])
                    ])
                }),
                new Parameter({
                    key: 'tld',
                    name: 'tld',
                    type: 'string'
                })
            ])
        })

        const result = paw._formatURIComponent(source, content, parameters)

        this.assertJSONEqual(expected, result)
    }

    @targets('_formatURIComponent')
    testFormatURIComponentWithMissingParameter() {
        const paw = this.__init()

        const source = 'host'
        const content = 'fakeurl.{tld}'
        const parameters = {}

        const expected = new Parameter({
            key: source,
            name: source,
            type: 'string',
            format: 'sequence',
            value: new Immutable.List([
                new Parameter({
                    type: 'string',
                    value: 'fakeurl.',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            'fakeurl.'
                        ])
                    ])
                }),
                new Parameter({
                    key: 'tld',
                    name: 'tld',
                    type: 'string',
                    value: 'tld',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            'tld'
                        ])
                    ])
                })
            ])
        })

        const result = paw._formatURIComponent(source, content, parameters)

        this.assertJSONEqual(expected, result)
    }

    @targets('_formatURIComponent')
    testFormatURIComponentWithSingleParameter() {
        const paw = this.__init()

        const source = 'host'
        const content = '{host}'
        const parameters = {
            host: new Parameter({
                type: 'string',
                value: 'fakeurl.com',
                internals: new Immutable.List([
                    new Constraint.Enum([
                        'fakeurl.com'
                    ])
                ])
            })
        }

        const expected = parameters.host

        const result = paw._formatURIComponent(source, content, parameters)

        this.assertJSONEqual(expected, result)
    }

    @targets('_formatAuthFromHeader')
    testFormatAuthFromHeaderWithInvalidStringComponent() {
        const paw = this.__init()

        const component = 'useless'

        const expected = null
        const result = paw._formatAuthFromHeader(component)

        this.assertEqual(expected, result)
    }

    @targets('_formatAuthFromHeader')
    testFormatAuthFromHeaderWithDynamicStringComponentCallsEvalString() {
        const paw = this.__init()

        const component = new DynamicString('useless')
        component.$$_spyOn('getEvaluatedString', () => {
            return 'useless'
        })

        const expected = null
        const result = paw._formatAuthFromHeader(component)

        this.assertEqual(expected, result)
        this.assertEqual(component.$$_spy.getEvaluatedString.count, 1)
    }

    @targets('_formatAuthFromHeader')
    testFormatAuthFromHeaderCallsFormatBasicAuthIfSchemeMatches() {
        const paw = this.__init()

        paw.spyOn('_formatBasicAuth', () => {
            return null
        })

        const params = 'am9uOnBhc3M='
        const component = 'Basic ' + params

        const expected = null
        const result = paw._formatAuthFromHeader(component)

        this.assertEqual(expected, result)
        this.assertEqual(paw.spy._formatBasicAuth.count, 1)
        this.assertEqual(paw.spy._formatBasicAuth.calls[0], [ params ])
    }

    @targets('_formatBasicAuth')
    testFormatBasicAuthParsesValidBase64() {
        const paw = this.__init()

        const params = 'am9uOnBhc3M='

        const expected = new Auth.Basic({
            username: 'jon',
            password: 'pass'
        })
        const result = paw._formatBasicAuth(params)

        this.assertEqual(expected, result)
    }

    @targets('_formatBasicAuth')
    testFormatBasicAuthDoesNotCrashWithInvalidBase64() {
        const paw = this.__init()

        const params = 'invalid base64'

        const expected = new Auth.Basic()
        const result = paw._formatBasicAuth(params)

        this.assertEqual(expected, result)
    }

    __init(size) {
        const paw = new ClassMock(new PawParser(), '')
        paw.references = new Immutable.List()
        const ctx = new PawContextMock({}, '')
        const req = new PawRequestMock({}, '')

        const args = [ paw, ctx, req ]

        if (!size) {
            return paw
        }

        return args.slice(0, size + 1)
    }
}
