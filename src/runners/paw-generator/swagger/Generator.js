import { registerCodeGenerator } from '../../../mocks/PawShims'

import PawParser from '../../../parsers/paw/Parser'
import SwaggerSerializer from '../../../serializers/swagger/Serializer'

@registerCodeGenerator
export default class SwaggerGenerator {
    static identifier =
        'com.luckymarmot.PawExtensions.SwaggerGenerator'
    static title = 'Swagger'
    static help =
        'https://github.com/luckymarmot/API-Flow'
    static languageHighlighter = 'json'
    static fileExtension = 'json'

    constructor() {
        this.parser = new PawParser()
        this.serializer = new SwaggerSerializer()
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
