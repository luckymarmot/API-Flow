import Immutable from 'immutable'

import {
    UnitTest,
    registerTest,
    targets,
    against
} from '../../../utils/TestUtils'

import PawParser from '../Parser'

import Context, {
    Parameter
} from '../../../models/Core'

import Group from '../../../models/Group'
import Constraint from '../../../models/Constraint'
import Auth from '../../../models/Auth'
import Request from '../../../models/Request'
import URL from '../../../models/URL'

import { Info } from '../../../models/Utils'

import JSONSchemaReference from '../../../models/references/JSONSchema'
import ReferenceContainer from '../../../models/references/Container'

import DynamicValueManager from '../dv/DVManager'

import {
    ClassMock,
    PawContextMock,
    DynamicString,
    PawRequestMock
} from '../../../mocks/PawMocks'

@registerTest
@against(PawParser)
export class TestPawParser extends UnitTest {

    @targets('generate')
    testGenerateCallsParseGroup() {
        const paw = this.__init()

        paw.spyOn('_parseGroup', () => {
            return null
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
            return null
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
            return null
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
            return 12
        })

        paw.spyOn('_parseDomains', () => {
            return 42
        })

        paw.spyOn('_parseInfo', () => {
            return 90
        })

        const expected = new Context({
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

        const expected = null
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

        const expected = new Group({
            children: new Immutable.OrderedMap({
                4567: 12,
                42: new Group({
                    id: '42',
                    name: 'group#1',
                    children: new Immutable.OrderedMap({
                        1234: 12,
                        2345: 12
                    })
                }),
                90: new Group({
                    id: '90',
                    name: 'group#2',
                    children: new Immutable.OrderedMap({
                        3456: 12
                    })
                })
            })
        })

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

        const expected = new Group({
            children: new Immutable.OrderedMap({
                4567: 12,
                90: new Group({
                    id: '90',
                    name: 'group#2',
                    children: new Immutable.OrderedMap({
                        3456: 12,
                        42: new Group({
                            id: '42',
                            name: 'group#1',
                            children: new Immutable.OrderedMap({
                                1234: 12,
                                2345: 12
                            })
                        })
                    })
                })
            })
        })

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
            url: new URL('localhost'),
            method: 'get'
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
            ])
        })

        const result = paw._formatParam(key, value)

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
            type: 'reference'
        })

        const result = paw._formatReferenceParam(key, value)

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
            type: 'reference'
        })

        const result = paw._formatReferenceParam(null, value)

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
        const ds = new DynamicString('a simple dynamic string')
        ds.length = 1

        paw.spyOn('_formatHeaderComponent', () => {
            return [ null, null ]
        })

        const key = 'Content-Type'

        paw._formatHeaderParam(key, ds, new Immutable.List())

        this.assertEqual(paw.spy._formatHeaderComponent.count, 1)
        this.assertJSONEqual(
            paw.spy._formatHeaderComponent.calls[0],
            [ key, '', new DynamicValueManager() ]
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
                ])
            }),
            auths
        ]

        const result = paw._formatHeaderParam(key, ds, auths)

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
                ])
            }),
            null
        ]

        const result = paw._formatHeaderComponent(key, component, dvm)

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

        paw.spyOn('_formatReferenceParam', () => {
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
        this.assertEqual(paw.spy._formatReferenceParam.count, 1)
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

        const result = paw._formatHeaderComponent(key, component, dvm)

        this.assertJSONEqual(expected, result)
        this.assertEqual(paw.spy._formatParam.count, 1)
        this.assertEqual(
            paw.spy._formatParam.calls[0],
            [ key, 'some evaluated dv' ]
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
            ])
        })

        const result = paw._formatQueryParam(key, ds)

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
            ])
        })

        const result = paw._formatQueryComponent(key, component, dvm)

        this.assertJSONEqual(expected, result)
        this.assertEqual(dvm.spy.convert.count, 1)
    }

    @targets('_formatQueryComponent')
    testFormatQueryComponentWithReferenceCallsFormatReferenceParam() {
        const paw = this.__init()
        paw.references = new Immutable.List()
        const dvm = new ClassMock(new DynamicValueManager(), '')

        paw.spyOn('_formatReferenceParam', () => {
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
        this.assertEqual(paw.spy._formatReferenceParam.count, 1)
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

        const result = paw._formatQueryComponent(key, component, dvm)

        this.assertJSONEqual(expected, result)
        this.assertEqual(paw.spy._formatParam.count, 1)
        this.assertEqual(
            paw.spy._formatParam.calls[0],
            [ key, 'some evaluated dv' ]
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
    testFormatPlainBodyCallsFormatParam() {
        const paw = this.__init()
        const content = {
            getEvaluatedString: () => {
                return 'test content'
            }
        }

        paw.spyOn('_formatParam', () => {
            return 12
        })

        paw._formatPlainBody(content)

        this.assertEqual(paw.spy._formatParam.count, 1)
    }

    @targets('_formatPlainBody')
    testFormatPlainBodyCallsFormatParamWithCorrectArguments() {
        const paw = this.__init()
        const content = {
            getEvaluatedString: () => {
                return 'test content'
            }
        }

        paw.spyOn('_formatParam', () => {
            return 12
        })

        paw._formatPlainBody(content)

        this.assertEqual(paw.spy._formatParam.count, 1)
        this.assertEqual(
            paw.spy._formatParam.calls[0],
            [ 'body', 'test content' ]
        )
    }

    @targets('_formatPlainBody')
    testFormatPlainBodyReturnsExpectedParam() {
        const paw = this.__init()
        const content = {
            getEvaluatedString: () => {
                return 'test content'
            }
        }

        paw.spyOn('_formatParam', () => {
            return 12
        })

        const expected = [
            12,
            'text/plain'
        ]

        const result = paw._formatPlainBody(content)

        this.assertEqual(expected, result)
    }

    @targets('_formatPlainBody')
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
        this.assertEqual(
            paw.spy._formatPlainBody.calls[0],
            [ 12 ]
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
            return [ 12, 42 ]
        })

        const expected = [
            new Immutable.List([ 12 ]), 42
        ]

        const result = paw._formatBody(req)

        this.assertEqual(expected, result)
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
            'application/x-www-form-urlencoded'
        ]

        const result = paw._formatBody(req)

        this.assertEqual(expected, result)
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
            'multipart/form-data'
        ]

        const result = paw._formatBody(req)

        this.assertEqual(expected, result)
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
            return [ 12, 42 ]
        })

        const expected = [
            new Immutable.List([ 12 ]),
            42
        ]

        const result = paw._formatBody(req)

        this.assertEqual(expected, result)
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

        this.assertEqual(req.spy.getHttpBasicAuth.count, 1)
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
    testFormatAuthReturnsBasicAuthIfAppropriate() {
        const paw = this.__init()
        const req = new PawRequestMock({}, '')

        req.spyOn('getHttpBasicAuth', () => {
            return {
                username: 'username',
                password: 'password'
            }
        })

        req.spyOn('getOAuth1', () => {
            return null
        })

        req.spyOn('getOAuth2', () => {
            return null
        })

        const expected = new Immutable.List([
            new Auth.Basic({
                username: 'username',
                password: 'password'
            })
        ])

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

    __init(size) {
        const paw = new ClassMock(new PawParser(), '')
        const ctx = new PawContextMock({}, '')
        const req = new PawRequestMock({}, '')

        const args = [ paw, ctx, req ]

        if (!size) {
            return paw
        }

        return args.slice(0, size + 1)
    }
}
