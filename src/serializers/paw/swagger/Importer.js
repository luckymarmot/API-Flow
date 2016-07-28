import yaml from 'js-yaml'

import BaseImporter from '../base-importer/BaseImporter'
import SwaggerParser from '../../../parsers/swagger/Parser'

@registerImporter // eslint-disable-line
export default class SwaggerImporter extends BaseImporter {
    static identifier = 'com.luckymarmot.PawExtensions.SwaggerImporter';
    static title = 'Swagger Importer';

    static fileExtensions = [];
    static inputs = [];

    constructor() {
        super()
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
        let swag
        try {
            swag = JSON.parse(item.content)
        }
        catch (jsonParseError) {
            try {
                swag = yaml.safeLoad(item.content)
            }
            catch (yamlParseError) {
                return 0
            }
        }
        if (swag) {
            // converting objects to bool to number, fun stuff
            let score = 0
            score += swag.swagger ? 1 / 3 : 0
            score += swag.swagger === '2.0' ? 1 / 3 : 0
            score += swag.info ? 1 / 3 : 0
            return score
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
        const parser = new SwaggerParser()

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
