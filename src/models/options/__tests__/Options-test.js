import {
    UnitTest,
    registerTest
} from '../../../utils/TestUtils'

import Options from '../Options'
import ParserOptions from '../ParserOptions'
import ResolverOptions from '../ResolverOptions'
import SerializerOptions from '../SerializerOptions'

@registerTest
export class TestOptions extends UnitTest {

    testNormalizeWithNoOpts() {
        const expected = {
            parser: new ParserOptions(),
            resolver: new ResolverOptions(),
            serializer: new SerializerOptions()
        }

        const result = Options.normalize()

        this.assertEqual(expected, result)
    }

    testNormalizeWithNonObjectOpts() {
        const expected = {
            parser: new ParserOptions(),
            resolver: new ResolverOptions(),
            serializer: new SerializerOptions()
        }

        const result = Options.normalize(true)

        this.assertEqual(expected, result)
    }

    testNormalizeWithNoOnlyParserOpts() {
        const expected = {
            parser: new ParserOptions({
                name: 'raml'
            }),
            resolver: new ResolverOptions(),
            serializer: new SerializerOptions()
        }

        const result = Options.normalize({
            parser: {
                name: 'raml'
            }
        })

        this.assertEqual(expected, result)
    }

    testNormalizeWithNoOnlySerializerOpts() {
        const expected = {
            parser: new ParserOptions(),
            resolver: new ResolverOptions(),
            serializer: new SerializerOptions({
                name: 'swagger'
            })
        }

        const result = Options.normalize({
            serializer: {
                name: 'swagger'
            }
        })

        this.assertEqual(expected, result)
    }

    testNormalizeWithNoOnlyResolverOpts() {
        const expected = {
            parser: new ParserOptions(),
            resolver: new ResolverOptions('raw'),
            serializer: new SerializerOptions()
        }

        const result = Options.normalize({
            resolver: 'raw'
        })

        this.assertEqual(expected, result)
    }
}
