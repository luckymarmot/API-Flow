import { registerImporter } from '../../../mocks/PawShims'

import SwaggerParser from '../../../parsers/Swagger/v2.0/Parser'
import PawSerializer from '../../../serializers/paw/Serializer'

import { currify } from '../../../utils/fp-utils'

const methods = {}

@registerImporter // eslint-disable-line
export default class SwaggerImporter extends PawSerializer {
  static identifier = 'com.luckymarmot.PawExtensions.SwaggerImporter';
  static title = 'Swagger Importer';

  static fileExtensions = [];

  canImport(context, items) {
    return methods.canImport(context, items)
  }

  import(context, items, options) {
    return methods.import(this, context, items, options)
  }
}

methods.canImportItem = (item) => {
  return SwaggerParser.isParsable(item)
}

methods.canImport = (context, items) => {
  let sum = 0
  for (const item of items) {
    sum += methods.canImportItem(item)
  }
  const score = items.length > 0 ? sum / items.length : 0
  return score
}

methods.import = (importer, context, items, options) => {
  const serializerOptions = { context, items, options }
  const parser = new SwaggerParser()
  const serializer = new PawSerializer()

  const resolve = parser.resolve
  const parse = parser.parse
  const serialize = currify(serializer.serialize, serializerOptions)

  items
    .filter(parser.isParsable)
    .reduce(resolve, [])
    .map(parse)
    .map(serialize)

  // const statusMessage = methods.formatStatusMessage(parser, serializer)
}
