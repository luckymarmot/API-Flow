import {
    UnitTest,
    registerTest
} from '../../../utils/TestUtils'

import SerializerOptions from '../SerializerOptions'

@registerTest
export class TestSerializerOptions extends UnitTest {

    testNormalizeWithNoOpts() {
        const expected = {
            name: 'swagger',
            instance: null
        }

        const result = SerializerOptions.normalize()

        this.assertEqual(expected, result)
    }

    testNormalizeWithStringOpts() {
        const expected = {
            name: 'raml',
            instance: null
        }

        const result = SerializerOptions.normalize('raml')

        this.assertEqual(expected, result)
    }

    testNormalizeWithStringOptsNormalizesString() {
        const expected = {
            name: 'raml',
            instance: null
        }

        const result = SerializerOptions.normalize('RAML')

        this.assertEqual(expected, result)
    }

    testNormalizeWithEmptyObjectOpts() {
        const expected = {
            name: 'swagger',
            instance: null
        }

        const result = SerializerOptions.normalize({})

        this.assertEqual(expected, result)
    }

    testNormalizeWithInvalidKeysInObjectOpts() {
        const expected = {
            some: 'key',
            name: 'swagger',
            instance: null
        }

        const result = SerializerOptions.normalize({
            some: 'key'
        })

        this.assertEqual(expected, result)
    }

    testConstructorWithInvalidKeysInObjectOpts() {
        const expected = new SerializerOptions({
            name: 'swagger',
            instance: null
        })

        const result = new SerializerOptions({
            some: 'key'
        })

        this.assertEqual(expected, result)
    }

    testNormalizeWithSimpleObjectOpts() {
        const expected = {
            name: 'raml',
            instance: null
        }

        const result = SerializerOptions.normalize({
            name: 'raml'
        })

        this.assertEqual(expected, result)
    }

    testNormalizeDropsInstanceIfNameNotCustom() {
        const expected = {
            name: 'raml',
            instance: null
        }

        const result = SerializerOptions.normalize({
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

        const result = SerializerOptions.normalize({
            name: 'custom',
            instance: 'my super instance'
        })

        this.assertEqual(expected, result)
    }
}
