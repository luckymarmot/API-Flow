import BaseImporter from '../base-importer/BaseImporter'

import CurlParser from '../../../parsers/cURL/Parser'

@registerImporter // eslint-disable-line
export default class CurlImporter extends BaseImporter {
    static identifier = 'com.luckymarmot.PawExtensions.cURLImporter';
    static title = 'cURL Importer';

    static fileExtensions = [];
    static inputs = [];

    constructor() {
        super()
    }

    canImport(context, items) {
        let sum = 0
        for (let item of items) {
            sum += ::this._canImportItem(context, item)
        }
        return items.length > 0 ? sum / items.length : 0
    }

    _canImportItem(context, item) {
        if (item.content.match(/curl\s/i)) {
            return 1
        }
        return 0
    }

    /*
      @params:
        - context
        - items
        - options
    */
    createRequestContexts(context, items) {
        const parser = new CurlParser()

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