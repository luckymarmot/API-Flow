import Immutable from 'immutable'

import {
    UnitTest,
    registerTest,
    targets,
    against
} from '../../../utils/TestUtils'

import CurlSerializer from '../Serializer'

import Context
/* , {
    Body,
    Response,
    Parameter,
    ParameterContainer
} */
from '../../../models/Core'

import {
    Info, Contact, License
} from '../../../models/Utils'

import Group from '../../../models/Group'
// import Constraint from '../../../models/Constraint'
// import Auth from '../../../models/Auth'
// import URL from '../../../models/URL'
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
    testFormatRequestCallsFormatDescription() {
        const s = this.__init()

        s.spyOn('_formatDescription', () => {
            return 'some description'
        })

        const input = new Request()

        s._formatRequest(input)

        this.assertEqual(s.spy._formatDescription.count, 1)
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
