import { registerImporter } from '../../../mocks/PawShims'
import path from 'path'

import { source } from 'api-flow-config'
import ApiFlow from '../../../api-flow'

import { convertEntryListInMap } from '../../../utils/fp-utils'

const methods = {}

@registerImporter // eslint-disable-line
class SwaggerImporter {
  static identifier = source.identifier
  static title = source.title

  static fileExtensions = [];

  canImport(context, items) {
    return methods.canImport(context, items)
  }

  import(context, items, options) {
    return methods.import(context, items, options)
  }
}

methods.getUriFromItem = (item) => {
  if (item.url) {
    return item.url
  }

  const uri = 'file://' + path.join(item.file.path, item.file.name)
  return uri
}

methods.getCacheFromItems = (items) => {
  return items.map(item => {
    const uri = methods.getUriFromItem(item)
    return { key: uri, value: item.content }
  }).reduce(convertEntryListInMap, {})
}

methods.canImport = (context, items) => {
  const fixedItems = items.map(item => {
    item.uri = methods.getUriFromItem(item)
    return item
  })

  const primaryUri = ApiFlow.findPrimaryUri({ items: fixedItems })
  return primaryUri ? 1 : 0
}

methods.import = (context, items) => {
  const options = { context, source, target: { format: 'paw', version: 'v3.0' } }
  const itemMap = methods.getCacheFromItems(items)
  ApiFlow.setCache(itemMap)

  const fixedItems = items.map(item => {
    item.uri = methods.getUriFromItem(item)
    return item
  })

  const uri = ApiFlow.findPrimaryUri({ items: fixedItems })
  return ApiFlow.transform({ options, uri })
  // const statusMessage = methods.formatStatusMessage(parser, serializer)
}

export default SwaggerImporter
