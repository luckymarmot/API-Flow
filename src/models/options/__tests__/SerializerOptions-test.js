import Immutable from 'immutable'

import {
    UnitTest,
    registerTest,
    targets,
    against
} from '../../../utils/TestUtils'

import SerializerOptions from '../SerializerOptions'

@registerTest
export class TestSerializerOptions extends UnitTest {

    testNormalizeWithNoOpts() {
        const expected = {
            name: 'raml',
            instance: null
        }

        const result = SerializerOptions.normalize()

        this.assertEqual(expected, result)
    }

    testNormalizeWithStringOpts() {
        const expected = {
            name: 'swagger',
            instance: null
        }

        const result = SerializerOptions.normalize('swagger')

        this.assertEqual(expected, result)
    }

    testNormalizeWithStringOptsNormalizesString() {
        const expected = {
            name: 'swagger',
            instance: null
        }

        const result = SerializerOptions.normalize('SwAGger')

        this.assertEqual(expected, result)
    }

    testNormalizeWithEmptyObjectOpts() {
        const expected = {
            name: 'raml',
            instance: null
        }

        const result = SerializerOptions.normalize({})

        this.assertEqual(expected, result)
    }

    testNormalizeWithInvalidKeysInObjectOpts() {
        const expected = {
            some: 'key',
            name: 'raml',
            instance: null
        }

        const result = SerializerOptions.normalize({
            some: 'key'
        })

        this.assertEqual(expected, result)
    }

    testConstructorWithInvalidKeysInObjectOpts() {
        const expected = new SerializerOptions({
            name: 'raml',
            instance: null
        })

        const result =  new SerializerOptions({
            some: 'key'
        })

        this.assertEqual(expected, result)
    }

    testNormalizeWithSimpleObjectOpts() {
        const expected = {
            name: 'swagger',
            instance: null
        }

        const result = SerializerOptions.normalize({
            name: 'swagger'
        })

        this.assertEqual(expected, result)
    }

    testNormalizeDropsInstanceIfNameNotCustom() {
        const expected = {
            name: 'swagger',
            instance: null
        }

        const result = SerializerOptions.normalize({
            name: 'swagger',
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
