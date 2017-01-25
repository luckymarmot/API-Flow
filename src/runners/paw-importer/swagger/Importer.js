import { registerImporter } from '../../../mocks/PawShims'

import PawSerializer from '../../../serializers/paw/Serializer'
import SwaggerParser from '../../../parsers/swagger/Parser'

// import { currify } from '../../../utils/fp-utils'

@registerImporter // eslint-disable-line
export default class SwaggerImporter extends PawSerializer {
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
    for (const item of items) {
      sum += ::this._canImportItem(context, item)
    }
    const score = items.length > 0 ? sum / items.length : 0
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

    const reqContexts = []
    for (const item of items) {
      const reqContext = parser.parse(item)
      reqContexts.push({
        context: reqContext,
        items: [ item ]
      })
    }

    return reqContexts
  }

  import(context, items, options) {
    const parser = new SwaggerParser()
    const serializer = new PawSerializer()

    const serialize = (api) => serializer.serialize(api, { context, items, options })

    try {
      const serialized = items.map(parser.parse).map(serialize)
      if (serialized) {
        return true
      }
      return false
    }
    catch (e) {
      return false
    }
  }
}
