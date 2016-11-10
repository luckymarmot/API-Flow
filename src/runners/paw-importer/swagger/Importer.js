import { registerImporter } from '../../../mocks/PawShims'

import BaseImporter from '../../../serializers/paw/Serializer'
import SwaggerParser from '../../../parsers/swagger/Parser'

@registerImporter // eslint-disable-line
export default class SwaggerImporter extends BaseImporter {
    static identifier = 'com.luckymarmot.PawExtensions.SwaggerImporter';
    static title = 'Swagger Importer';

    static fileExtensions = [];

    constructor() {
        super()
        this.parser = new SwaggerParser()
        this.ENVIRONMENT_DOMAIN_NAME = 'Swagger Environments'
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
