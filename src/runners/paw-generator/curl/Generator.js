import { registerCodeGenerator } from '../../../mocks/PawShims'

import PawParser from '../../../parsers/paw/Parser'
import CurlSerializer from '../../../serializers/cURL/Serializer'

@registerCodeGenerator
export default class CURLGenerator {
    static identifier =
        'com.luckymarmot.PawExtensions.CurlMarkdownGenerator'
    static title = 'Markdown + Curl'
    static help =
        'https://github.com/luckymarmot/API-Flow'
    static languageHighlighter = 'md'
    static fileExtension = 'md'

    constructor() {
        this.parser = new PawParser()
        this.serializer = new CurlSerializer()
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
