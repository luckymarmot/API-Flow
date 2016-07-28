import {
    UnitTest,
    registerTest
} from '../../../utils/TestUtils'

import ParserOptions from '../ParserOptions'

@registerTest
export class TestParserOptions extends UnitTest {

    testNormalizeWithNoOpts() {
        const expected = {
            name: 'swagger',
            instance: null
        }

        const result = ParserOptions.normalize()

        this.assertEqual(expected, result)
    }

    testNormalizeWithStringOpts() {
        const expected = {
            name: 'raml',
            instance: null
        }

        const result = ParserOptions.normalize('raml')

        this.assertEqual(expected, result)
    }

    testNormalizeWithStringOptsNormalizesString() {
        const expected = {
            name: 'raml',
            instance: null
        }

        const result = ParserOptions.normalize('RaMl')

        this.assertEqual(expected, result)
    }

    testNormalizeWithEmptyObjectOpts() {
        const expected = {
            name: 'swagger',
            instance: null
        }

        const result = ParserOptions.normalize({})

        this.assertEqual(expected, result)
    }

    testNormalizeWithInvalidKeysInObjectOpts() {
        const expected = {
            some: 'key',
            name: 'swagger',
            instance: null
        }

        const result = ParserOptions.normalize({
            some: 'key'
        })

        this.assertEqual(expected, result)
    }

    testConstructorWithInvalidKeysInObjectOpts() {
        const expected = new ParserOptions({
            name: 'swagger',
            instance: null
        })

        const result = new ParserOptions({
            some: 'key'
        })

        this.assertEqual(expected, result)
    }

    testNormalizeWithSimpleObjectOpts() {
        const expected = {
            name: 'raml',
            instance: null
        }

        const result = ParserOptions.normalize({
            name: 'raml'
        })

        this.assertEqual(expected, result)
    }

    testNormalizeDropsInstanceIfNameNotCustom() {
        const expected = {
            name: 'raml',
            instance: null
        }

        const result = ParserOptions.normalize({
            name: 'raml',
            instance: 'my super instance'
        })

        this.assertEqual(expected, result)
    }

    testNormalizeKeepsInstanceIfNameIsCustom() {
        const expected = {
            name: 'custom',
            instance: 'my super instance'
        }

        const result = ParserOptions.normalize({
            name: 'custom',
            instance: 'my super instance'
        })

        this.assertEqual(expected, result)
    }
}
