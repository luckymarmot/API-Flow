import { registerCodeGenerator } from '../../../mocks/PawShims'

import PawParser from '../../../parsers/paw/Parser'
import InsomniaSerializer from '../../../serializers/insomnia/Serializer'

@registerCodeGenerator
export default class InsomniaGenerator {
    static identifier =
        'com.luckymarmot.PawExtensions.InsomniaGenerator'
    static title = 'Insomnia'
    static help =
        'https://github.com/luckymarmot/API-Flow'
    static languageHighlighter = 'json'
    static fileExtension = 'json'

    constructor() {
        this.parser = new PawParser()
        this.serializer = new InsomniaSerializer()
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
