import { registerImporter } from '../../../mocks/PawShims'

import BaseImporter from '../base-importer/BaseImporter'

import CurlParser from '../../../parsers/cURL/Parser'

@registerImporter // eslint-disable-line
export default class CurlImporter extends BaseImporter {
    static identifier = 'com.luckymarmot.PawExtensions.cURLImporter';
    static title = 'cURL Importer';

    static fileExtensions = [];

    constructor() {
        super()
        this.ENVIRONMENT_DOMAIN_NAME = 'CURL Environments'
        this.parser = new CurlParser()
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
        return this.parser.detect(item.content)
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
