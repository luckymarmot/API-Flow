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
            return '## Some data'
        })

        const expected = '## Some data'
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
    testFormatGroupWithRequestCallsFormatRequestForEachRequest() {
        const s = this.__init()

        s.spyOn('_formatRequest', () => {
            return ''
        })

        const input = new Group({
            children: new Immutable.OrderedMap({
                12: new Group({
                    children: new Immutable.OrderedMap({
                        90: new Request(),
                        42: new Request()
                    })
                }),
                36: new Group({
                    children: new Immutable.OrderedMap({
                        72: new Request(),
                        92: new Request()
                    })
                })
            })
        })

        s._formatGroup(input)

        this.assertEqual(s.spy._formatRequest.count, 4)
    }

    @targets('_formatGroup')
    testFormatGroupReturnsExpectedContent() {
        const s = this.__init()

        let count = 0
        s.spyOn('_formatRequest', () => {
            count += 1
            return '### Request content #' + count
        })

        const input = new Group({
            children: new Immutable.OrderedMap({
                12: new Group({
                    children: new Immutable.OrderedMap({
                        90: new Request(),
                        42: new Request()
                    })
                }),
                36: new Group({
                    children: new Immutable.OrderedMap({
                        72: new Request(),
                        92: new Request()
                    })
                })
            })
        })

        const expected =
            '## Requests\n\n' +
            '### Request content #1\n\n' +
            '### Request content #2\n\n' +
            '### Request content #3\n\n' +
            '### Request content #4'
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
    testFormatRequestCallsFormatParameterDescription() {
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

        s.spyOn('_formatParameterDescriptions', () => {
            return 'some parameters'
        })

        s.spyOn('_formatAuthDescription', () => {
            return 'some auths'
        })

        s.spyOn('_formatResponses', () => {
            return 'some responses'
        })

        const input = new Request()

        s._formatRequest(input)

        this.assertEqual(s.spy._formatParameterDescriptions.count, 1)
    }

    @targets('_formatRequest')
    testFormatRequestCallsFormatAuthDescription() {
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

        s.spyOn('_formatParameterDescriptions', () => {
            return 'some parameters'
        })

        s.spyOn('_formatAuthDescription', () => {
            return 'some auths'
        })

        s.spyOn('_formatResponses', () => {
            return 'some responses'
        })

        const input = new Request()

        s._formatRequest(input)

        this.assertEqual(s.spy._formatAuthDescription.count, 1)
    }

    @targets('_formatRequest')
    testFormatRequestCallsFormatResponses() {
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

        s.spyOn('_formatParameterDescriptions', () => {
            return 'some parameters'
        })

        s.spyOn('_formatAuthDescription', () => {
            return 'some auths'
        })

        s.spyOn('_formatResponses', () => {
            return 'some responses'
        })

        const input = new Request()

        s._formatRequest(input)

        this.assertEqual(s.spy._formatResponses.count, 1)
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

        s.spyOn('_formatParameterDescriptions', () => {
            return 'some parameters'
        })

        s.spyOn('_formatAuthDescription', () => {
            return 'some auths'
        })

        s.spyOn('_formatResponses', () => {
            return 'some responses'
        })

        const input = new Request()

        const expected =
            'some name\n\n' +
            'some description\n\n' +
            'some curl command\n\n' +
            'some parameters\n\n' +
            'some auths\n\n' +
            'some responses'
        const result = s._formatRequest(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatName')
    testFormatNameCallsFormatURLBlock() {
        const s = this.__init()

        s.spyOn('_formatURLBlock', () => {
            return ''
        })

        const input = new Request()

        s._formatName(input)

        this.assertEqual(s.spy._formatURLBlock.count, 1)
    }

    @targets('_formatName')
    testFormatNameReturnsExpectedContentFromEmptyRequest() {
        const s = this.__init()

        s.spyOn('_formatURLBlock', () => {
            return ''
        })

        const input  = new Request()

        const expected = '### **GET** - ?'
        const result = s._formatName(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatName')
    testFormatNameWithURL() {
        const s = this.__init()

        const input  = new Request({
            url: new URL('http://echo.luckymarmot.com/headers')
        })

        const expected = '### **GET** - /headers'
        const result = s._formatName(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatName')
    testFormatNameWithURLAndMethod() {
        const s = this.__init()

        const input  = new Request({
            method: 'post',
            url: new URL('http://echo.luckymarmot.com/headers')
        })

        const expected = '### **POST** - /headers'
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

        const expected = '#### Description\na simple description'
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
            '#### CURL\n\n' +
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

        const expected = '""'
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

        this.assertEqual('"' + expected + '"', result)
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

        const expected = '-H "Content-Type: $Content-Type" \\'
        const result = s._formatHeader(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatHeader')
    testFormatHeaderWithWeirdParam() {
        const s = this.__init()

        const input = new Parameter({
            type: 'string'
        })

        const expected = '-H ": $unnamed" \\'
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

        const expected = '-H "Content-Type: application/$ctype" \\'
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

        const expected = '--data-raw "userId"="$userId" \\'
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

        const expected = '-F "$unnamed" \\'
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

        const expected = '-F "user-group"="102591-$groupId" \\'
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

    @targets('_formatURLBlock')
    testFormatURLBlockWithEmptyURL() {
        const s = this.__init()

        const input = new URL()
        const name = 'pathname'

        const expected = ''
        const result = s._formatURLBlock(input, name)

        this.assertEqual(expected, result)
    }

    @targets('_formatURLBlock')
    testFormatURLBlockWithSimpleURLDoesNotCallFormatParam() {
        const s = this.__init()

        const input = new URL('http://echo.luckymarmot.com/headers')
        const name = 'pathname'

        const expected = '/headers'
        const result = s._formatURLBlock(input, name)

        this.assertEqual(expected, result)
        this.assertEqual(s.spy._formatParam.count, 0)
    }

    @targets('_formatURLBlock')
    testFormatURLBlockWithSequenceParamInURLCallsFormatParam() {
        const s = this.__init()

        s.spyOn('_formatParam', () => {
            return [ null, 'formatted param' ]
        })

        const input = new URL({
            pathname: new Parameter({
                key: 'pathname',
                type: 'string',
                format: 'sequence',
                value: new Immutable.List([
                    new Parameter({
                        type: 'string',
                        value: '/users/',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                '/users/'
                            ])
                        ])
                    }),
                    new Parameter({
                        key: 'userId',
                        name: 'userId',
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Pattern('/[0-9a-f]{16}/')
                        ])
                    })
                ])
            })
        })
        const name = 'pathname'

        const expected = 'formatted param'
        const result = s._formatURLBlock(input, name)

        this.assertEqual(expected, result)
        this.assertEqual(s.spy._formatParam.count, 1)
    }

    @targets('_formatQueries')
    testFormatQueriesWithNoQueryParam() {
        const s = this.__init()

        s.spyOn('_formatParam', () => {
            return [ 'key', 'value' ]
        })

        const input = new Request({
            parameters: new ParameterContainer()
        })

        const expected = ''
        const result = s._formatQueries(input)

        this.assertEqual(expected, result)
        this.assertEqual(s.spy._formatParam.count, 0)
    }

    @targets('_formatQueries')
    testFormatQueriesCallsFormatParamForEachQueryParam() {
        const s = this.__init()

        s.spyOn('_formatParam', () => {
            return [ 'key', 'value' ]
        })

        const input = new Request({
            parameters: new ParameterContainer({
                queries: new Immutable.List([
                    new Parameter(),
                    new Parameter(),
                    new Parameter()
                ])
            })
        })

        s._formatQueries(input)

        this.assertEqual(s.spy._formatParam.count, 3)
    }

    @targets('_formatQueries')
    testFormatQueriesReturnsExpectedContentForEachQueryParam() {
        const s = this.__init()

        const values = [
            [ null, 'value' ],
            [ null, '$value' ],
            [ 'key', 'value' ],
            [ 'key', '$value' ],
            [ 'spa ced', 'val ue' ],
            [ 'spa ced', '$val ue' ]
        ]

        s.spyOn('_formatParam', () => {
            return values.shift()
        })

        const input = new Request({
            parameters: new ParameterContainer({
                queries: new Immutable.List([
                    new Parameter(),
                    new Parameter(),
                    new Parameter(),
                    new Parameter(),
                    new Parameter(),
                    new Parameter()
                ])
            })
        })

        const expected =
            '?value&$value&key=value&key=$value&spa%20ced=val%20ue' +
            '&spa%20ced=$val%20ue'
        const result = s._formatQueries(input)

        this.assertEqual(expected, result)
        this.assertEqual(s.spy._formatParam.count, 6)
    }

    @targets('_formatQueries')
    testFormatQueriesSplitsOverMultipleLinesIfTooLong() {
        const s = this.__init()

        const values = [
            [ 'first', '$superLongNamedValueThatIsAboutFiftyCharactersLong' ],
            [ 'sec', '$fitsOn1stLine' ],
            [ 'third', '$movedToSecondLine' ],
            [ 'fourth', '$secondLineToo' ],
            [ 'fifth', '$finalValueOfTheSecondLine' ],
            [ 'sixth', '$isOnThirdLine' ]
        ]

        s.spyOn('_formatParam', () => {
            return values.shift()
        })

        const input = new Request({
            parameters: new ParameterContainer({
                queries: new Immutable.List([
                    new Parameter(),
                    new Parameter(),
                    new Parameter(),
                    new Parameter(),
                    new Parameter(),
                    new Parameter()
                ])
            })
        })

        const expected =
            '?first=$superLongNamedValueThatIsAboutFiftyCharactersLong' +
            '&sec=$fitsOn1stLine\\\n' +
            '&third=$movedToSecondLine' +
            '&fourth=$secondLineToo' +
            '&fifth=$finalValueOfTheSecondLine\\\n' +
            '&sixth=$isOnThirdLine'
        const result = s._formatQueries(input)

        this.assertEqual(expected, result)
        this.assertEqual(s.spy._formatParam.count, 6)
    }

    @targets('_formatParam')
    testFormatParamReturnsExpectedContentWithNullParam() {
        const s = this.__init()

        const param = null

        const expected = [ null, '$unnamed' ]
        const result = s._formatParam(param)

        this.assertEqual(expected, result)
    }

    @targets('_formatParam')
    testFormatParamCallsFormatReferenceParamIfTypeIsReference() {
        const s = this.__init()

        s.spyOn('_formatReferenceParam', () => {
            return [ null, 'reference' ]
        })

        s.spyOn('_formatArrayParam', () => {
            return [ null, 'array' ]
        })

        s.spyOn('_formatMultiParam', () => {
            return [ null, 'multi' ]
        })

        s.spyOn('_formatSequenceParam', () => {
            return [ null, 'sequence' ]
        })

        s.spyOn('_formatSimpleParam', () => {
            return [ null, 'simple' ]
        })

        const param = new Parameter({
            type: 'reference'
        })

        const expected = [ null, 'reference' ]
        const result = s._formatParam(param)

        this.assertEqual(expected, result)
        this.assertEqual(s.spy._formatReferenceParam.count, 1)
    }

    @targets('_formatParam')
    testFormatParamCallsFormatArrayParamIfTypeIsArray() {
        const s = this.__init()

        s.spyOn('_formatReferenceParam', () => {
            return [ null, 'reference' ]
        })

        s.spyOn('_formatArrayParam', () => {
            return [ null, 'array' ]
        })

        s.spyOn('_formatMultiParam', () => {
            return [ null, 'multi' ]
        })

        s.spyOn('_formatSequenceParam', () => {
            return [ null, 'sequence' ]
        })

        s.spyOn('_formatSimpleParam', () => {
            return [ null, 'simple' ]
        })

        const param = new Parameter({
            type: 'array'
        })

        const expected = [ null, 'array' ]
        const result = s._formatParam(param)

        this.assertEqual(expected, result)
        this.assertEqual(s.spy._formatArrayParam.count, 1)
    }

    @targets('_formatParam')
    testFormatParamCallsFormatMultiParamIfTypeIsMulti() {
        const s = this.__init()

        s.spyOn('_formatReferenceParam', () => {
            return [ null, 'reference' ]
        })

        s.spyOn('_formatArrayParam', () => {
            return [ null, 'array' ]
        })

        s.spyOn('_formatMultiParam', () => {
            return [ null, 'multi' ]
        })

        s.spyOn('_formatSequenceParam', () => {
            return [ null, 'sequence' ]
        })

        s.spyOn('_formatSimpleParam', () => {
            return [ null, 'simple' ]
        })

        const param = new Parameter({
            type: 'multi'
        })

        const expected = [ null, 'multi' ]
        const result = s._formatParam(param)

        this.assertEqual(expected, result)
        this.assertEqual(s.spy._formatMultiParam.count, 1)
    }

    @targets('_formatParam')
    testFormatParamCallsFormatSequenceParamIfFormatIsSequence() {
        const s = this.__init()

        s.spyOn('_formatReferenceParam', () => {
            return [ null, 'reference' ]
        })

        s.spyOn('_formatArrayParam', () => {
            return [ null, 'array' ]
        })

        s.spyOn('_formatMultiParam', () => {
            return [ null, 'multi' ]
        })

        s.spyOn('_formatSequenceParam', () => {
            return [ null, 'sequence' ]
        })

        s.spyOn('_formatSimpleParam', () => {
            return [ null, 'simple' ]
        })

        const param = new Parameter({
            type: 'string',
            format: 'sequence'
        })

        const expected = [ null, 'sequence' ]
        const result = s._formatParam(param)

        this.assertEqual(expected, result)
        this.assertEqual(s.spy._formatSequenceParam.count, 1)
    }

    @targets('_formatParam')
    testFormatParamCallsFormatSimpleParamIfTypeIsSimple() {
        const s = this.__init()

        s.spyOn('_formatReferenceParam', () => {
            return [ null, 'reference' ]
        })

        s.spyOn('_formatArrayParam', () => {
            return [ null, 'array' ]
        })

        s.spyOn('_formatMultiParam', () => {
            return [ null, 'multi' ]
        })

        s.spyOn('_formatSequenceParam', () => {
            return [ null, 'sequence' ]
        })

        s.spyOn('_formatSimpleParam', () => {
            return [ null, 'simple' ]
        })

        const param = new Parameter({
            type: 'string'
        })

        const expected = [ null, 'simple' ]
        const result = s._formatParam(param)

        this.assertEqual(expected, result)
        this.assertEqual(s.spy._formatSimpleParam.count, 1)
    }

    @targets('_formatReferenceParam')
    testFormatReferenceParamWithNullParameter() {
        const s = this.__init()

        const input = null

        const expected = [ null, '$unnamed' ]
        const result = s._formatReferenceParam(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatReferenceParam')
    testFormatReferenceParamWithEmptyParameter() {
        const s = this.__init()

        const input = new Parameter()

        const expected = [ null, '$unnamed' ]
        const result = s._formatReferenceParam(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatReferenceParam')
    testFormatReferenceParamWithUnnamedParameter() {
        const s = this.__init()

        const input = new Parameter({
            type: 'reference',
            value: 'some reference'
        })

        const expected = [ null, '$unnamed' ]
        const result = s._formatReferenceParam(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatReferenceParam')
    testFormatReferenceParamWithNamedParameterButNoKey() {
        const s = this.__init()

        const input = new Parameter({
            name: 'named'
        })

        const expected = [ null, '$named' ]
        const result = s._formatReferenceParam(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatReferenceParam')
    testFormatReferenceParamWithSimpleParameter() {
        const s = this.__init()

        const input = new Parameter({
            key: 'key',
            name: 'named'
        })

        const expected = [ 'key', '$key' ]
        const result = s._formatReferenceParam(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatArrayParam')
    testFormatArrayParamWithNullParameter() {
        const s = this.__init()

        const input = null

        const expected = [ null, '$unnamed' ]
        const result = s._formatArrayParam(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatArrayParam')
    testFormatArrayParamWithEmptyParameter() {
        const s = this.__init()

        const input = new Parameter()

        const expected = [ null, '$unnamed' ]
        const result = s._formatArrayParam(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatArrayParam')
    testFormatArrayParamWithUnnamedParameter() {
        const s = this.__init()

        const input = new Parameter({
            value: new Parameter(),
            type: 'array'
        })

        const expected = [ null, '$unnamed' ]
        const result = s._formatArrayParam(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatArrayParam')
    testFormatArrayParamWithSimpleParameter() {
        const s = this.__init()

        const input = new Parameter({
            key: 'key',
            name: 'named',
            value: new Parameter(),
            type: 'array'
        })

        const expected = [ 'key', '$key' ]
        const result = s._formatArrayParam(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatMultiParam')
    testFormatMultiParamWithNullParameter() {
        const s = this.__init()

        const input = null

        const expected = [ null, '(  )' ]
        const result = s._formatMultiParam(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatMultiParam')
    testFormatMultiParamWithEmptyParameter() {
        const s = this.__init()

        const input = new Parameter()

        const expected = [ null, '(  )' ]
        const result = s._formatMultiParam(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatMultiParam')
    testFormatMultiParamWithSimpleParameterCallsFormatParamForEachSubParam() {
        const s = this.__init()

        s.spyOn('_formatParam', () => {
            return [ 'k', 'v' ]
        })

        const input = new Parameter({
            key: 'body',
            name: 'named',
            value: new Immutable.List([
                new Parameter(),
                new Parameter()
            ])
        })

        const expected = [ 'body', '( k=v OR k=v )' ]
        const result = s._formatMultiParam(input)

        this.assertEqual(expected, result)
        this.assertEqual(s.spy._formatParam.count, 2)
    }

    @targets('_formatMultiParam')
    testFormatMultiParamDropsBodyKeys() {
        const s = this.__init()

        s.spyOn('_formatParam', () => {
            return [ 'k', 'v' ]
        })

        const input = new Parameter({
            key: 'body',
            name: 'named',
            value: new Immutable.List([
                new Parameter(),
                new Parameter()
            ])
        })

        const expected = [ null, '( k=v OR k=v )' ]
        const result = s._formatMultiParam(input, '=', true)

        this.assertEqual(expected, result)
    }

    @targets('_formatSequenceParam')
    testFormatSequenceParamWithNullParameter() {
        const s = this.__init()

        s.spyOn('_formatParam', () => {
            return [ 'k', 'v' ]
        })

        const input = null

        const expected = [ null, '$unnamed' ]
        const result = s._formatSequenceParam(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatSequenceParam')
    testFormatSequenceParamWithEmptyParameter() {
        const s = this.__init()

        s.spyOn('_formatParam', () => {
            return [ 'k', 'v' ]
        })

        const input = new Parameter()

        const expected = [ null, '$unnamed' ]
        const result = s._formatSequenceParam(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatSequenceParam')
    testFormatSequenceParamWithSimpleParameterCallsFormatParameterForEachSub() {
        const s = this.__init()

        s.spyOn('_formatParam', () => {
            return [ 'k', 'v' ]
        })

        const input = new Parameter({
            key: 'key',
            name: 'named',
            type: 'string',
            format: 'sequence',
            value: new Immutable.List([
                new Parameter(),
                new Parameter(),
                new Parameter()
            ])
        })

        const expected = [ 'key', 'vvv' ]
        const result = s._formatSequenceParam(input)

        this.assertEqual(expected, result)
        this.assertEqual(s.spy._formatParam.count, 3)
    }

    @targets('_formatSimpleParam')
    testFormatSimpleParamWithNullParameter() {
        const s = this.__init()

        const input = null

        const expected = [ null, '$unnamed' ]
        const result = s._formatSimpleParam(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatSimpleParam')
    testFormatSimpleParamWithEmptyParameter() {
        const s = this.__init()

        const input = new Parameter()

        const expected = [ null, '$unnamed' ]
        const result = s._formatSimpleParam(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatSimpleParam')
    testFormatSimpleParamWithNamedOnlyParameter() {
        const s = this.__init()

        const input = new Parameter({
            key: 'key'
        })

        const expected = [ 'key', '$key' ]
        const result = s._formatSimpleParam(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatSimpleParam')
    testFormatSimpleParamWithSimpleValueParameter() {
        const s = this.__init()

        const input = new Parameter({
            key: 'key',
            value: 'aSimpleValue'
        })

        const expected = [ 'key', 'aSimpleValue' ]
        const result = s._formatSimpleParam(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatSimpleParam')
    testFormatSimpleParamWithComplexValueParameter() {
        const s = this.__init()

        const input = new Parameter({
            key: 'key',
            value: {
                complex:'value'
            }
        })

        const expected = [ 'key', '{"complex":"value"}' ]
        const result = s._formatSimpleParam(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatParameterDescriptions')
    testFormatParameterDescriptionsWithEmptyParameterContainer() {
        const s = this.__init()

        const input = new Request()

        const expected = ''
        const result = s._formatParameterDescriptions(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatParameterDescriptions')
    testFormatParameterDescriptionsCallsFormatParamDescriptionForEachParam() {
        const s = this.__init()

        s.spyOn('_formatParamDescription', () => {
            return '#### param description'
        })

        const input = new Request({
            parameters: new ParameterContainer({
                headers: new Immutable.List([
                    new Parameter(),
                    new Parameter(),
                    new Parameter()
                ]),
                queries: new Immutable.List([
                    new Parameter(),
                    new Parameter(),
                    new Parameter()
                ]),
                body: new Immutable.List([
                    new Parameter()
                ]),
                path: new Immutable.List([
                    new Parameter(),
                    new Parameter()
                ])
            })
        })

        s._formatParameterDescriptions(input)

        this.assertEqual(s.spy._formatParamDescription.count, 9)
    }

    @targets('_formatParameterDescriptions')
    testFormatParameterDescriptionsReturnsExpectedContent() {
        const s = this.__init()

        s.spyOn('_formatParamDescription', () => {
            return '##### param description'
        })

        const input = new Request({
            parameters: new ParameterContainer({
                headers: new Immutable.List([
                    new Parameter(),
                    new Parameter(),
                    new Parameter()
                ]),
                queries: new Immutable.List([
                    new Parameter(),
                    new Parameter(),
                    new Parameter()
                ]),
                body: new Immutable.List([
                    new Parameter()
                ]),
                path: new Immutable.List([
                    new Parameter(),
                    new Parameter()
                ])
            })
        })

        const expected =
            '#### Path Parameters\n\n' +
            '##### param description\n' +
            '##### param description\n\n' +
            '#### Query Parameters\n\n' +
            '##### param description\n' +
            '##### param description\n' +
            '##### param description\n\n' +
            '#### Header Parameters\n\n' +
            '##### param description\n' +
            '##### param description\n' +
            '##### param description\n\n' +
            '#### Body Parameters\n\n' +
            '##### param description'
        const result = s._formatParameterDescriptions(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatParamDescription')
    testFormatParamDescription() {
        const s = this.__init()

        const input = new Parameter({
            key: 'key',
            type: 'integer'
        })

        const expected = '- **key** should respect the following schema:\n\n' +
            '```\n' +
            JSON.stringify({ type: 'integer' }, null, '  ') + '\n' +
            '```'
        const result = s._formatParamDescription(input)

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
