import raml from 'raml-1-parser'
import { parse } from 'url'

const methods = {}

const __meta__ = {
  extensions: [ 'yml', 'yaml', 'raml' ],
  parsable: true,
  format: 'raml'
}

export class RAMLLoader {
  static extensions = __meta__.extensions
  static parsable = __meta__.parsable
  static format = __meta__.format

  static load({ options, uri }) {
    return methods.load({ options, uri })
  }

  static isParsable({ content }) {
    return methods.isParsable(content)
  }
}

methods.isParsable = (content) => {
  const firstLine = content.split('\n', 1)[0]
  const match = firstLine.match(/^#%RAML 1\.0$/)
  if (match) {
    return true
  }

  return false
}

methods.createRAMLResolvers = (options) => {
  const httpResolver = {
    getResourceAsync: options.httpResolver.resolve
  }

  const fsResolver = {
    contentAsync: options.fsResolver.resolve
  }

  return { fsResolver, httpResolver }
}

methods.load = ({ options, uri }) => {
  const { fsResolver, httpResolver } = methods.createRAMLResolvers(options)

  if (parse(uri).protocol === 'file:') {
    return raml.loadApi(
      parse(uri).pathname,
      {
        fsResolver,
        httpResolver
      }
    ).then(ramlApi => {
      return { options, item: ramlApi.expand() }
    })
  }
  return raml.loadApi(uri, { fsResolver, httpResolver }).then(ramlApi => {
    return { options, item: ramlApi }
  })
}

export const __internals__ = methods
export default RAMLLoader
