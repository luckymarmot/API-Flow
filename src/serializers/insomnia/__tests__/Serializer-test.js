import Immutable from 'immutable'

import { version } from '../../../../package.json'

import {
    UnitTest,
    registerTest,
    against,
    targets
} from '../../../utils/TestUtils'

import { ClassMock } from '../../../mocks/PawMocks'

import {
    Info, Contact, License
} from '../../../models/Utils'

import Auth from '../../../models/Auth'
import Constraint from '../../../models/Constraint'
import URL from '../../../models/URL'
import Request from '../../../models/Request'
import Context, {
    Body,
    Response,
    Parameter,
    ParameterContainer
} from '../../../models/Core'
import InsomniaSerializer from '../Serializer'

import ReferenceContainer from '../../../models/references/Container'
import ExoticReference from '../../../models/references/Exotic'
import JSONSchemaReference from '../../../models/references/JSONSchema'

@registerTest
@against(InsomniaSerializer)
export class TestInsomniaSerializer extends UnitTest {

    @targets('serialize')
    testSerializeWithEmptyContext() {
        let s = this.__init()

        let input = new Context()

        let result = s.serialize(input)

        let expected = JSON.stringify({
            _type: 'export',
            __export_format: 3,
            __export_source: `API-Flow:${version}`,
            resources: []
        }, null, '\t')

        this.assertEqual(expected, result)
    }

    @targets('_formatQueryParam')
    testFormatQueryParamWithSimpleContent() {
        let s = this.__init()

        let param = new Parameter()

        let expected = { name: '', value: '' }

        let result = s._formatQueryParam(param)

        this.assertEqual(expected, result)
    }

    @targets('_formatStructure')
    testFormatStructureChildCalls() {
        let s = this.__init()

        s.spyOn('_formatRequests', () => [])
        s.spyOn('_formatReferences', () => [])

        s._formatStructure(new Context())

        this.assertEqual(s.spy._formatRequests.count, 1)
        this.assertEqual(s.spy._formatReferences.count, 1)
    }

    @targets('_formatReferences')
    testFormatReferences() {
        // TODO
    }

    @targets('_formatRequests')
    testFormatRequestsChildCalls() {
        let s = this.__init()

        let context = new Context({
            requests: Immutable.List.of(new Request())
        })

        s.spyOn('_formatRequest', () => [])

        s._formatRequests(context)

        this.assertEqual(s.spy._formatRequest.count, 1)
    }

    @targets('_formatRequest')
    testFormatRequestSimple() {
        let s = this.__init()

        let request = new Request()

        let expected = {
            _id: '__REQ_1__',
            _type: 'request',
            parentId: '__PARENT_ID__',
            name: '',
            description: '',
            headers: [],
            parameters: [],
            url: '',
            method: 'GET',
            body: { mimeType: '', text: '' }
        }

        let result = s._formatRequest(request, '__PARENT_ID__')

        this.assertEqual(expected, result)
    }

    @targets('_formatBodyFormData')
    testFormatBodyFormData() {
        let s = this.__init()

        let fileValue = new ExoticReference({
            uri: '/path/to/file',
            relative: '/path/to/file'
        })

        let body = Immutable.List.of(
            new Parameter({
                key: 'file',
                value: fileValue,
                type: 'reference'
            }),
            new Parameter({
                key: 'foo',
                value: 'bar',
                type: 'string'
            })
        )

        let expected = {
            mimeType: 'multipart/form-data',
            params: [
                {
                    name: 'file',
                    fileName: '/path/to/file',
                    type: 'file'
                },
                {
                    name: 'foo',
                    value: 'bar'
                }
            ]
        }

        let result = s._formatBodyFormData(body)

        this.assertEqual(expected, result)
    }

    @targets('_formatSequenceParam')
    testFormatSequenceParam() {
        // TODO
    }

    @targets('_formatHeaders')
    testFormatHeadersWithBasicAuth() {
        let s = this.__init()

        s.spyOn('_formatHeader', () => null)
        s.spyOn('_formatAuthHeader', () => null)

        let parameters = new ParameterContainer({
            headers: Immutable.List.of(
                new Parameter(),
                new Parameter(),
                new Parameter(),
                new Parameter(),
                new Parameter()
            )
        })

        let auths = Immutable.List.of(new Auth.Basic())

        s._formatHeaders(parameters, auths)

        this.assertEqual(s.spy._formatHeader.count, 5)
        this.assertEqual(s.spy._formatAuthHeader.count, 1)
    }

    @targets('_formatAuthHeader')
    testFormatAuthHeader() {
        let s = this.__init()

        s.spyOn('_formatBasicAuthHeader', () => null)
        s.spyOn('_formatDigestAuthHeader', () => null)

        s._formatAuthHeader(Immutable.List.of(new Auth.Basic()))
        this.assertEqual(s.spy._formatBasicAuthHeader, 1)
        s._formatAuthHeader(Immutable.List.of(new Auth.AWSSig4()))
        this.assertEqual(s.spy._formatAWSSig4AuthHeader, 1)
        s._formatAuthHeader(Immutable.List.of(new Auth.Digest()))
        this.assertEqual(s.spy._formatDigestAuthHeader, 1)
        s._formatAuthHeader(Immutable.List.of(new Auth.OAuth1()))
        this.assertEqual(s.spy._formatOAuth1AuthHeader, 1)
    }

    @targets('_formatBasicAuthHeader')
    testFormatBasicAuthHeader() {
        let s = this.__init()

        let auth = new Auth.Basic({
            username: 'User',
            password: 'Pass'
        })

        let expected = {
            name: 'Authorization',
            value: 'Basic VXNlcjpQYXNz',
            disabled: false
        }

        let result = s._formatBasicAuthHeader(auth)

        this.assertEqual(expected, result)
    }

    @targets('_formatDigestAuthHeader')
    testFormatDigestAuthHeader() {
        // TODO
    }

    @targets('_formatOAuth1AuthHeader')
    testFormatOAuth1AuthHeader() {
        // TODO
    }

    @targets('_formatAWSSig4AuthHeader')
    testFormatAWSSig4AuthHeader() {
        // TODO
    }

    @targets('_formatBody')
    testFormatBody() {
        // TODO
    }

    @targets('_formatBodyParam')
    testFormatBodyParam() {
        // TODO
    }

    @targets('_formatQueries')
    testFormatQueries() {
        let s = this.__init()

        let queries = Immutable.List.of(new Parameter(), new Parameter())

        let params = new ParameterContainer({ queries: queries })

        s.spyOn('_formatQueryParam', () => null)

        s._formatQueries(params)

        this.assertEqual(s.spy._formatQueryParam.count, 2)
    }

    @targets('_formatQueryParam')
    testFormatQueryParamWithBasicContent() {
        const s = this.__init()
        const param = new Parameter({
            key: 'hello',
            type: 'string',
            value: 'world'
        })

        const expected = { name: 'hello', value: 'world' }

        const result = s._formatQueryParam(param)

        this.assertEqual(expected, result)
    }

    @targets('_nextId')
    testNextId() {
        // TODO
    }

    @targets('_reset')
    testReset() {
        // TODO
    }

    @targets('validate')
    testValidate() {
        // TODO
    }

    __init() {
        let serializer = new InsomniaSerializer()
        let mocked = new ClassMock(serializer, '')

        mocked._reset()

        return mocked
    }
}
