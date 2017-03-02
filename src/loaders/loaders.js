import { loaders } from 'api-flow-config'

const methods = {}

methods.extractExtension = (uri) => {
  if (uri) {
    const extension = uri.split('.').slice(-1)[0]
    if (!extension || extension === uri) {
      return null
    }

    return extension
  }

  return null
}

methods.getLoaderByExtension = (item, onlyParsableLoaders = false) => {
  const extension = methods.extractExtension(item)

  if (!extension) {
    return null
  }

  const usableLoaders = loaders.filter(loader => loader.extensions.indexOf(extension) !== -1)

  if (onlyParsableLoaders) {
    return usableLoaders.filter(loader => loader.parsable === true)[0] || null
  }

  return usableLoaders[0] || null
}

methods.getLoaderByFormat = (format) => {
  return loaders.filter(loader => loader.format === format)[0] || null
}

export const getLoaderByExtension = methods.getLoaderByExtension
export const getLoaderByFormat = methods.getLoaderByFormat

export default methods
