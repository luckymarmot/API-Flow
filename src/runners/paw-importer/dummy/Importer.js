import { registerImporter } from '../../../mocks/PawShims'

import DummyParser from '../../../parsers/dummy/Parser'
import PawSerializer from '../../../serializers/paw/Serializer'

import { currify } from '../../../utils/fp-utils'

const methods = {}

@registerImporter // eslint-disable-line
export default class DummyImporter extends PawSerializer {
  static identifier = 'com.luckymarmot.PawExtensions.DummyImporter';
  static title = 'Dummy Importer';

  static fileExtensions = [];

  canImport(context, items) {
    return methods.canImport(context, items)
  }

  import(context, items, options) {
    return methods.import(this, context, items, options)
  }
}

methods.canImportItem = (item) => {
  return DummyParser.isParsable(item)
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
  const parser = new DummyParser()
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
