import { registerCodeGenerator } from '../../../mocks/PawShims'

import PawParser from '../../../parsers/paw/Parser'
import RAMLSerializer from '../../../serializers/raml/Serializer'

@registerCodeGenerator
export default class RAMLGenerator {
    static identifier =
        'com.luckymarmot.PawExtensions.RAMLGenerator'
    static title = 'RAML'
    static help =
        'https://github.com/luckymarmot/API-Flow'
    static languageHighlighter = 'yaml'
    static fileExtension = 'raml'

    constructor() {
        this.parser = new PawParser()
        this.serializer = new RAMLSerializer()
    }

    generate(context, reqs, opts) {
        try {
            let api = this.parser.generate(context, reqs, opts)
            let generated = this.serializer.serialize(api)

            return generated
        }
        catch (e) {
            /* eslint-disable no-console */
            console.error(
                this.constructor.title,
                'generation failed with error:',
                e,
                e.stack,
                JSON.stringify(e, null, '  ')
            )
            /* eslint-enable no-console */
            throw e
        }
    }
}
