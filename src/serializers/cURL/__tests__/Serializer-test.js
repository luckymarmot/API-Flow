import Immutable from 'immutable'

import {
    UnitTest,
    registerTest,
    targets,
    against
} from '../../../utils/TestUtils'

import CurlSerializer from '../Serializer'

import Context, {
//    Body,
//    Response,
    Parameter,
    ParameterContainer
} from '../../../models/Core'

import {
    Info, Contact, License
} from '../../../models/Utils'

import Group from '../../../models/Group'
import Constraint from '../../../models/Constraint'
import Auth from '../../../models/Auth'
import URL from '../../../models/URL'
import Request from '../../../models/Request'

import {
    ClassMock
} from '../../../mocks/PawMocks'

@registerTest
@against(CurlSerializer)
export class TestCurlSerializer extends UnitTest {

    @targets('serialize')
    testSerializeCallsFormatContent() {
        const s = this.__init()

        s.spyOn('_formatContent', ()=> {
            return ''
        })

        s.serialize(new Context())

        this.assertEqual(s.spy._formatContent.count, 1)
    }

    @targets('serialize')
    testSerializeReturnsExpectedContent() {
        const s = this.__init()

        s.spyOn('_formatContent', ()=> {
            return 'test'
        })

        const expected = 'test'
        const result = s.serialize(new Context())

        this.assertEqual(expected, result)
    }

    @targets('_formatContent')
    testFormatContentCallsFormatInfo() {
        const s = this.__init()

        s.spyOn('_formatInfo', () => {
            return [ '', '' ]
        })

        s.spyOn('_formatGroup', () => {
            return ''
        })

        s._formatContent(new Context())

        this.assertEqual(s.spy._formatInfo.count, 1)
    }

    @targets('_formatContent')
    testFormatContentCallsFormatGroup() {
        const s = this.__init()

        s.spyOn('_formatInfo', () => {
            return [ '', '' ]
        })

        s.spyOn('_formatGroup', () => {
            return ''
        })

        s._formatContent(new Context())

        this.assertEqual(s.spy._formatGroup.count, 1)
    }

    @targets('_formatContent')
    testFormatContentHasExpectedStructureWithNoInfo() {
        const s = this.__init()

        s.spyOn('_formatInfo', () => {
            return [ '', '' ]
        })

        s.spyOn('_formatGroup', () => {
            return '## group content'
        })

        const expected = '## group content'
        const result = s._formatContent(new Context())

        this.assertEqual(expected, result)
    }

    @targets('_formatContent')
    testFormatContentHasExpectedStructureWithNoEndInfo() {
        const s = this.__init()

        s.spyOn('_formatInfo', () => {
            return [ '# API', '' ]
        })

        s.spyOn('_formatGroup', () => {
            return '## group content'
        })

        const expected = '# API\n\n## group content'
        const result = s._formatContent(new Context())

        this.assertEqual(expected, result)
    }

    @targets('_formatContent')
    testFormatContentHasExpectedStructureWithNoStartInfo() {
        const s = this.__init()

        s.spyOn('_formatInfo', () => {
            return [ '', '## Terms of Service' ]
        })

        s.spyOn('_formatGroup', () => {
            return '## group content'
        })

        const expected = '## group content\n\n## Terms of Service'
        const result = s._formatContent(new Context())

        this.assertEqual(expected, result)
    }

    @targets('_formatContent')
    testFormatContentHasExpectedStructureWithNoStartInfo() {
        const s = this.__init()

        s.spyOn('_formatInfo', () => {
            return [ '# API', '## Terms of Service' ]
        })

        s.spyOn('_formatGroup', () => {
            return ''
        })

        const expected = '# API\n\n## Terms of Service'
        const result = s._formatContent(new Context())

        this.assertEqual(expected, result)
    }

    @targets('_formatInfo')
    testFormatInfoWithNoInfo() {
        const s = this.__init()

        const input = new Context({
            info: new Info()
        })

        const expected = [ '# API', '' ]
        const result = s._formatInfo(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatInfo')
    testFormatInfoWithSimpleInfo() {
        const s = this.__init()

        const input = new Context({
            info: new Info({
                title: 'Some API Title',
                description: 'some API description'
            })
        })

        const expected = [
            '# Some API Title\n\n' +
            '## Description\nsome API description',
            ''
        ]
        const result = s._formatInfo(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatInfo')
    testFormatInfoWithContactInfoCallsFormatContact() {
        const s = this.__init()

        s.spyOn('_formatContact', () => {
            return '## Contact\n- **Name:** john doe'
        })

        const input = new Context({
            info: new Info({
                title: 'Some API Title',
                description: 'some API description',
                contact: new Contact()
            })
        })

        const expected = [
            '# Some API Title\n\n' +
            '## Description\nsome API description',
            '## Contact\n- **Name:** john doe'
        ]
        const result = s._formatInfo(input)

        this.assertEqual(s.spy._formatContact.count, 1)
        this.assertEqual(expected, result)
    }

    @targets('_formatInfo')
    testFormatInfoWithLicenseInfoCallsFormatLicense() {
        const s = this.__init()

        s.spyOn('_formatLicense', () => {
            return '## License\n- **Name:** MIT'
        })

        const input = new Context({
            info: new Info({
                title: 'Some API Title',
                description: 'some API description',
                license: new License()
            })
        })

        const expected = [
            '# Some API Title\n\n' +
            '## Description\nsome API description',
            '## License\n- **Name:** MIT'
        ]
        const result = s._formatInfo(input)

        this.assertEqual(s.spy._formatLicense.count, 1)
        this.assertEqual(expected, result)
    }

    @targets('_formatContact')
    testFormatContactWithNoContent() {
        const s = this.__init()
        const input = new Contact()

        const expected = ''
        const result = s._formatContact(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatContact')
    testFormatContactWithAllContent() {
        const s = this.__init()
        const input = new Contact({
            name: 'some name',
            url: 'some url',
            email: 'some email'
        })

        const expected =
            '## Contact\n' +
            '- **Name:** some name\n' +
            '- **URL:** some url\n' +
            '- **Email:** some email'

        const result = s._formatContact(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatLicense')
    testFormatLicenseWithNoContent() {
        const s = this.__init()
        const input = new License()

        const expected = ''
        const result = s._formatLicense(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatLicense')
    testFormatLicenseWithAllContent() {
        const s = this.__init()
        const input = new License({
            name: 'some name',
            url: 'some url'
        })

        const expected =
            '## License\n' +
            '- **Name:** some name\n' +
            '- **URL:** some url'

        const result = s._formatLicense(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatGroup')
    testFormatGroupWithNullGroup() {
        const s = this.__init()

        const input = null

        const expected = ''
        const result = s._formatGroup(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatGroup')
    testFormatGroupWithRequestCallsFormatRequest() {
        const s = this.__init()

        s.spyOn('_formatRequest', () => {
            return 'some formatted request'
        })

        const input = new Request()

        const expected = 'some formatted request'
        const result = s._formatGroup(input)

        this.assertEqual(s.spy._formatRequest.count, 1)
        this.assertEqual(expected, result)
    }

    @targets('_formatGroup')
    testFormatGroupWithEmptyGroup() {
        const s = this.__init()

        const input = new Group({
            name: 'Group #1'
        })

        const expected = '### Group #1'
        const result = s._formatGroup(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatGroup')
    testFormatGroupWithNestedGroups() {
        const s = this.__init()

        const input = new Group({
            name: 'Group #1',
            children: new Immutable.OrderedMap({
                12: new Group({
                    name: 'Nested Group #1'
                }),
                14: new Group({
                    name: 'Nested Group #2'
                })
            })
        })

        const expected =
            '### Group #1\n\n' +
            '### Group #1 -> Nested Group #1\n\n' +
            '### Group #1 -> Nested Group #2'
        const result = s._formatGroup(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatGroup')
    testFormatGroupWithSuperNestedGroups() {
        const s = this.__init()

        const input = new Group({
            name: 'Group #1',
            children: new Immutable.OrderedMap({
                12: new Group({
                    name: 'Nested Group #1',
                    children: new Immutable.OrderedMap({
                        36: new Group({
                            name: 'Super Nested #1',
                            children: new Immutable.OrderedMap({
                                90: new Group({
                                    name: 'Super Nested #2'
                                })
                            })
                        })
                    })
                }),
                14: new Group({
                    name: 'Nested Group #2'
                })
            })
        })

        const expected =
            '### Group #1\n\n' +
            '### Group #1 -> Nested Group #1\n\n' +
            '### Group #1 -> Nested Group #1 -> Super Nested #1\n\n' +
            '### Group #1 -> Nested Group #1 -> ' +
                'Super Nested #1 -> Super Nested #2\n\n' +
            '### Group #1 -> Nested Group #2'
        const result = s._formatGroup(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatGroup')
    testFormatGroupWithURLNamedGroups() {
        const s = this.__init()

        const input = new Group({
            name: '/{version}',
            children: new Immutable.OrderedMap({
                12: new Group({
                    name: '/songs',
                    children: new Immutable.OrderedMap({
                        36: new Group({
                            name: '/{songId}',
                            children: new Immutable.OrderedMap({
                                90: new Group({
                                    name: '/update'
                                })
                            })
                        })
                    })
                }),
                14: new Group({
                    name: 'Nested Group #2'
                })
            })
        })

        const expected =
            '### /{version}\n\n' +
            '### /{version} -> /songs\n\n' +
            '### /{version} -> /songs -> /{songId}\n\n' +
            '### /{version} -> /songs -> /{songId} -> /update\n\n' +
            '### /{version} -> Nested Group #2'
        const result = s._formatGroup(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatRequest')
    testFormatRequestCallsFormatName() {
        const s = this.__init()

        s.spyOn('_formatName', () => {
            return 'some name'
        })

        s.spyOn('_formatDescription', () => {
            return 'some description'
        })

        s.spyOn('_formatCurlCommand', () => {
            return 'some curl command'
        })

        const input = new Request()

        s._formatRequest(input)

        this.assertEqual(s.spy._formatName.count, 1)
    }

    @targets('_formatRequest')
    testFormatRequestCallsFormatDescription() {
        const s = this.__init()

        s.spyOn('_formatName', () => {
            return 'some name'
        })

        s.spyOn('_formatDescription', () => {
            return 'some description'
        })

        s.spyOn('_formatCurlCommand', () => {
            return 'some curl command'
        })

        const input = new Request()

        s._formatRequest(input)

        this.assertEqual(s.spy._formatDescription.count, 1)
    }

    @targets('_formatRequest')
    testFormatRequestCallsFormatCurlCommand() {
        const s = this.__init()

        s.spyOn('_formatName', () => {
            return 'some name'
        })


        s.spyOn('_formatDescription', () => {
            return 'some description'
        })

        s.spyOn('_formatCurlCommand', () => {
            return 'some curl command'
        })

        const input = new Request()

        s._formatRequest(input)

        this.assertEqual(s.spy._formatCurlCommand.count, 1)
    }

    @targets('_formatRequest')
    testFormatRequestReturnsExpectedContent() {
        const s = this.__init()

        s.spyOn('_formatName', () => {
            return 'some name'
        })

        s.spyOn('_formatDescription', () => {
            return 'some description'
        })

        s.spyOn('_formatCurlCommand', () => {
            return 'some curl command'
        })

        const input = new Request()

        const expected = 'some name\n\nsome description\n\nsome curl command'
        const result = s._formatRequest(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatName')
    testFormatNameWithEmptyRequest() {
        const s = this.__init()

        const input  = new Request()

        const expected = '#### Unnamed Request'
        const result = s._formatName(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatName')
    testFormatNameWithNamedRequest() {
        const s = this.__init()

        const input  = new Request({
            name: 'Simple Named Request',
            url: new URL('http://echo.luckymarmot.com/headers')
        })

        const expected = '#### Simple Named Request'
        const result = s._formatName(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatName')
    testFormatNameWithUnnamedRequestWithURL() {
        const s = this.__init()

        const input  = new Request({
            url: new URL('http://echo.luckymarmot.com/headers')
        })

        const expected = '#### http://echo.luckymarmot.com/headers'
        const result = s._formatName(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatDescription')
    testFormatDescriptionWithNoDescription() {
        const s = this.__init()

        const input = new Request()

        const expected = ''
        const result = s._formatDescription(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatDescription')
    testFormatDescriptionWithDescription() {
        const s = this.__init()

        const input = new Request({
            description: 'a simple description'
        })

        const expected = '##### Description\na simple description'
        const result = s._formatDescription(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatCurlCommand')
    testFormatCurlCommandCallsFormatURL() {
        const s = this.__init()

        s.spyOn('_formatURL', () => {
            return 'a simple url'
        })

        s.spyOn('_formatHeaders', () => {
            return 'some headers'
        })

        s.spyOn('_formatBody', () => {
            return 'some body'
        })

        s.spyOn('_formatAuths', () => {
            return 'some auths'
        })

        const input = new Request()

        s._formatCurlCommand(input)

        this.assertEqual(s.spy._formatURL.count, 1)
    }

    @targets('_formatCurlCommand')
    testFormatCurlCommandCallsFormatHeaders() {
        const s = this.__init()

        s.spyOn('_formatURL', () => {
            return 'a simple url'
        })

        s.spyOn('_formatHeaders', () => {
            return 'some headers'
        })

        s.spyOn('_formatBody', () => {
            return 'some body'
        })

        s.spyOn('_formatAuths', () => {
            return 'some auths'
        })

        const input = new Request()

        s._formatCurlCommand(input)

        this.assertEqual(s.spy._formatHeaders.count, 1)
    }

    @targets('_formatCurlCommand')
    testFormatCurlCommandCallsFormatBody() {
        const s = this.__init()

        s.spyOn('_formatURL', () => {
            return 'a simple url'
        })

        s.spyOn('_formatHeaders', () => {
            return 'some headers'
        })

        s.spyOn('_formatBody', () => {
            return 'some body'
        })

        s.spyOn('_formatAuths', () => {
            return 'some auths'
        })

        const input = new Request()

        s._formatCurlCommand(input)

        this.assertEqual(s.spy._formatBody.count, 1)
    }

    @targets('_formatCurlCommand')
    testFormatCurlCommandCallsFormatAuths() {
        const s = this.__init()

        s.spyOn('_formatURL', () => {
            return 'a simple url'
        })

        s.spyOn('_formatHeaders', () => {
            return 'some headers'
        })

        s.spyOn('_formatBody', () => {
            return 'some body'
        })

        s.spyOn('_formatAuths', () => {
            return 'some auths'
        })

        const input = new Request()

        s._formatCurlCommand(input)

        this.assertEqual(s.spy._formatAuths.count, 1)
    }

    @targets('_formatCurlCommand')
    testFormatCurlCommandReturnsExpectedCommand() {
        const s = this.__init()

        s.spyOn('_formatURL', () => {
            return 'http://httpbin.org/post'
        })

        s.spyOn('_formatHeaders', () => {
            return '-H "Content-Type: application/x-www-form-urlencoded" \\'
        })

        s.spyOn('_formatBody', () => {
            return '--data-raw "user=john" \\'
        })

        s.spyOn('_formatAuths', () => {
            return '-u "john:pass" \\'
        })

        const input = new Request({
            method: 'post'
        })

        const expected =
            '```sh\n' +
            'curl -X POST http://httpbin.org/post \\\n' +
            '-H "Content-Type: application/x-www-form-urlencoded" \\\n' +
            '--data-raw "user=john" \\\n' +
            '-u "john:pass"\n' +
            '```'

        const result = s._formatCurlCommand(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatURL')
    testFormatURLWithEmptyRequest() {
        const s = this.__init()

        const input = new Request()

        const expected = ''
        const result = s._formatURL(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatURL')
    testFormatURLWithURL() {
        const s = this.__init()

        const expected = 'http://echo.luckymarmot.com/some/path'

        const input = new Request({
            url: new URL(expected)
        })

        const result = s._formatURL(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatHeaders')
    testFormatHeadersWithEmptyContainer() {
        const s = this.__init()

        const input = new ParameterContainer()

        const expected = ''
        const result = s._formatHeaders(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatHeaders')
    testFormatHeadersCallsFormatHeaderForEachHeader() {
        const s = this.__init()

        s.spyOn('_formatHeader', () => {
            return ''
        })

        const input = new ParameterContainer({
            headers: new Immutable.List([
                new Parameter(),
                new Parameter()
            ])
        })

        s._formatHeaders(input, '')

        this.assertEqual(s.spy._formatHeader.count, 2)
    }

    @targets('_formatHeaders')
    testFormatHeadersAppliesOffsetForEachHeader() {
        const s = this.__init()

        s.spyOn('_formatHeader', () => {
            return 'offset header'
        })

        const input = new ParameterContainer({
            headers: new Immutable.List([
                new Parameter(),
                new Parameter()
            ])
        })

        const expected =
            '  offset header\n' +
            '  offset header'

        const result = s._formatHeaders(input, '  ')

        this.assertEqual(expected, result)
    }

    @targets('_formatHeader')
    testFormatHeaderWithSimpleParam() {
        const s = this.__init()

        const input = new Parameter({
            key: 'Content-Type',
            type: 'string',
            value: 'application/json'
        })

        const expected = '-H "Content-Type: application/json" \\'
        const result = s._formatHeader(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatHeader')
    testFormatHeaderWithNoValueParam() {
        const s = this.__init()

        const input = new Parameter({
            key: 'Content-Type',
            type: 'string'
        })

        const expected = '-H "Content-Type: {{Content-Type}}" \\'
        const result = s._formatHeader(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatHeader')
    testFormatHeaderWithWeirdParam() {
        const s = this.__init()

        const input = new Parameter({
            type: 'string'
        })

        const expected = '-H ": {{unnamed}}" \\'
        const result = s._formatHeader(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatHeader')
    testFormatHeaderWithSequenceParam() {
        const s = this.__init()

        const input = new Parameter({
            key: 'Content-Type',
            type: 'string',
            format: 'sequence',
            value: new Immutable.List([
                new Parameter({
                    type: 'string',
                    value: 'application/',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            'application/'
                        ])
                    ])
                }),
                new Parameter({
                    key: 'ctype',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            'json'
                        ])
                    ])
                })
            ])
        })

        const expected = '-H "Content-Type: application/{{ctype}}" \\'
        const result = s._formatHeader(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatBody')
    testFormatBodyWithEmptyContainer() {
        const s = this.__init()

        const input = new ParameterContainer()

        const expected = ''
        const result = s._formatBody(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatBody')
    testFormatBodyWithCallsFormatBodyParamForEachParam() {
        const s = this.__init()

        s.spyOn('_formatBodyParam', () => {
            return 'some param'
        })

        const input = new ParameterContainer({
            body: new Immutable.List([
                new Parameter(),
                new Parameter()
            ])
        })

        s._formatBody(input)

        this.assertEqual(s.spy._formatBodyParam.count, 2)
    }

    @targets('_formatBodyParam')
    testFormatBodyParamWithSimpleParam() {
        const s = this.__init()

        const input = new Parameter({
            key: 'userId',
            type: 'string',
            value: '102951209'
        })

        const option = '--data-raw'

        const expected = '--data-raw "userId"="102951209" \\'
        const result = s._formatBodyParam(option, input)

        this.assertEqual(expected, result)
    }

    @targets('_formatBodyParam')
    testFormatBodyParamWithNoValueParam() {
        const s = this.__init()

        const input = new Parameter({
            key: 'userId',
            type: 'string'
        })

        const option = '--data-raw'

        const expected = '--data-raw "userId"="{{userId}}" \\'
        const result = s._formatBodyParam(option, input)

        this.assertEqual(expected, result)
    }

    @targets('_formatBodyParam')
    testFormatBodyParamWithWeirdParam() {
        const s = this.__init()

        const input = new Parameter({
            type: 'string'
        })

        const option = '-F'

        const expected = '-F "{{unnamed}}" \\'
        const result = s._formatBodyParam(option, input)

        this.assertEqual(expected, result)
    }

    @targets('_formatBodyParam')
    testFormatBodyParamWithSequenceParam() {
        const s = this.__init()

        const input = new Parameter({
            key: 'user-group',
            type: 'string',
            format: 'sequence',
            value: new Immutable.List([
                new Parameter({
                    key: 'userId',
                    type: 'string',
                    value: '102591',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            '102591'
                        ])
                    ])
                }),
                new Parameter({
                    type: 'string',
                    value: '-',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            '-'
                        ])
                    ])
                }),
                new Parameter({
                    key: 'groupId',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            '12341'
                        ])
                    ])
                })
            ])
        })

        const option = '-F'

        const expected = '-F "user-group"="102591-{{groupId}}" \\'
        const result = s._formatBodyParam(option, input)

        this.assertEqual(expected, result)
    }

    @targets('_formatAuths')
    testFormatAuthsWithNoAuths() {
        const s = this.__init()

        const input = new Request()

        const expected = ''
        const result = s._formatAuths(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatAuths')
    testFormatAuthsWithNullAuth() {
        const s = this.__init()

        const input = new Request({
            auths: new Immutable.List([ null ])
        })

        const expected = ''
        const result = s._formatAuths(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatAuths')
    testFormatAuthsWithBasicAuth() {
        const s = this.__init()

        const input = new Request({
            auths: new Immutable.List([
                new Auth.Basic({
                    username: 'john',
                    password: 'pass'
                })
            ])
        })

        const expected = '-u "john":"pass" \\'
        const result = s._formatAuths(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatAuths')
    testFormatAuthsWithDigestAuth() {
        const s = this.__init()

        const input = new Request({
            auths: new Immutable.List([
                new Auth.Digest({
                    username: 'john',
                    password: 'pass'
                })
            ])
        })

        const expected = '--digest -u "john":"pass" \\'
        const result = s._formatAuths(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatAuths')
    testFormatAuthsWithNTLMAuth() {
        const s = this.__init()

        const input = new Request({
            auths: new Immutable.List([
                new Auth.NTLM({
                    username: 'john',
                    password: 'pass'
                })
            ])
        })

        const expected = '--ntlm -u "john":"pass" \\'
        const result = s._formatAuths(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatAuths')
    testFormatAuthsWithNegotiateAuth() {
        const s = this.__init()

        const input = new Request({
            auths: new Immutable.List([
                new Auth.Negotiate({
                    username: 'john',
                    password: 'pass'
                })
            ])
        })

        const expected = '--negotiate -u "john":"pass" \\'
        const result = s._formatAuths(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatAuths')
    testFormatAuthsWithApiKeyAuth() {
        const s = this.__init()

        const input = new Request({
            auths: new Immutable.List([
                new Auth.ApiKey({
                    in: 'header',
                    name: 'Api-Key',
                    key: '10259713958721398'
                })
            ])
        })

        const expected = '-H "Api-Key: 10259713958721398" \\'
        const result = s._formatAuths(input)

        this.assertEqual(expected, result)
    }

    @targets('_escape')
    testEscape() {
        const s = this.__init()

        const input =
            'a very \\complex $string with "all kinds of" ' +
            'escapable characters'

        const expected =
            'a very \\complex \$string with \"all kinds of\" ' +
            'escapable characters'

        const result = s._escape(input)

        this.assertEqual(expected, result)
    }

    //
    // helpers
    //

    __init(prefix = '') {
        let serializer = new CurlSerializer()
        let mockedSerializer = new ClassMock(serializer, prefix)

        return mockedSerializer
    }
}
