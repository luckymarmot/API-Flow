import {
    UnitTest,
    registerTest,
    targets,
    against
} from '../../utils/TestUtils'

import BaseSerializer from '../BaseSerializer'

import {
    ClassMock
} from '../../mocks/PawMocks'

@registerTest
@against(BaseSerializer)
export class TestBaseSerializer extends UnitTest {

    @targets('write')
    testWrite() {
        const _this = this
        const expected = '12 - 42'

        let called = false

        const stream = {
            write: function(data) {
                _this.assertEqual(expected, data)
            },
            end: function() {
                called = true
            }
        }
        const parser = this.__init(stream)
        parser.stream = stream

        parser.spyOn('serialize', () => {
            return expected
        })

        parser.write()

        this.assertEqual(parser.spy.serialize.count, 1)
        this.assertEqual(called, true)
    }

    @targets('serialize')
    testSerializeThrows() {
        const parser = this.__init()

        try {
            parser.serialize()
            this.assertTrue(false)
        }
        catch (e) {
            this.assertTrue(true)
        }
    }

    //
    // helpers
    //

    __init(stream, prefix = '') {
        let parser = new BaseSerializer(stream)
        let mockedParser = new ClassMock(parser, prefix)

        return mockedParser
    }
}
