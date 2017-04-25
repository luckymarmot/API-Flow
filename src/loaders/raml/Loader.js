import raml from 'raml-1-parser'
import { parse } from 'url'

const methods = {}

const __meta__ = {
  extensions: [ 'yml', 'yaml', 'raml' ],
  parsable: true,
  format: 'raml'
}

/**
 * @class RAMLLoader
 * @description The loader associated with the RAML v1.0 format.
 * It holds all the necessary methods used to load a file in RAML v1.0 format.
 */
export class RAMLLoader {
  static extensions = __meta__.extensions
  static parsable = __meta__.parsable
  static format = __meta__.format

  /**
   * Resolves a URI and fixes it if necessary.
   * @param {Object} namedParams - an object holding the named parameters used for the resolution of
   * the URI.
   * @param {Object} namedParams.options - an object holding all the settings necessary for
   * resolving, loading, parsing and serializing a uri and its dependencies.
   * @param {string} uri - the URI to resolve to a file that will be used as the primary file for
   * this loader
   * @returns {Promise} a Promise containing the `options` and normalized `item` in an object. See
   * `methods.fixPrimary` for more information.
   * @static
   */
  static load({ options, uri }) {
    return methods.load({ options, uri })
  }

  /**
   * Tests whether the content of a file is parsable by this loader and associated parser. This is
   * used to tell which loader/parser combo should be used.
   * @param {string?} content - the content of the file to test
   * @returns {boolean} whether it is parsable or not
   * @static
   */
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
