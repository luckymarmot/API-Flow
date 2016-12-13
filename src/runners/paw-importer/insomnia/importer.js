import { registerImporter } from '../../../mocks/PawShims'

import BaseImporter from '../../../serializers/paw/Serializer'

import InsomniaParser from '../../../parsers/Insomnia/Parser'

@registerImporter // eslint-disable-line
export default class InsomniaImporter extends BaseImporter {
    static identifier = 'com.luckymarmot.PawExtensions.InsomniaImporter';
    static title = 'Insomnia Importer';

    constructor() {
        super()
        this.ENVIRONMENT_DOMAIN_NAME = 'Insomnia'
        this.parser = InsomniaParser()
    }

    canImport(context, items) {
        let sum = 0
        for (let item of items) {
            sum += ::this._canImportItem(context, item)
        }
        let score = items.length > 0 ? sum / items.length : 0
        return score
    }

    _canImportItem(context, item) {
        return this.parser.detect(item.content)[0].score
    }

    /*
     @params:
     - context
     - items
     - options
     */
    createRequestContexts(context, items) {
        const parser = this.parser

        let reqContexts = []
        for (let item of items) {
            let reqContext = parser.parse(item)
            reqContexts.push({
                context: reqContext,
                items: [ item ]
            })
        }

        return reqContexts
    }
}
