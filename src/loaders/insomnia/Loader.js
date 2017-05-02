import { parse, resolve } from 'url'
import { List } from 'immutable'

import URL from '../../models/URL'
import { convertEntryListInMap } from '../../utils/fp-utils'

const methods = {}
const TYPE_REQUEST = 'request';

const __meta__ = {
  extensions: ['json', 'insomnia'],
  parsable: true,
  format: 'insomnia'
}

/**
 * @class InsomniaLoader
 * @description The loader associated with the Insomnia format.
 * It holds all the necessary methods used to load a file in Insomnia format.
 */
export class InsomniaLoader {
  static extensions = __meta__.extensions
  static parsable = __meta__.parsable
  static format = __meta__.format

  /**
   * Resolves a URI and fixes it if necessary.
   * @param {Object} options - an object holding the named parameters used for the resolution of
   * the URI.
   * @param {Object} options.options - an object holding all the settings necessary for
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
  const parsed = methods.maybeParseJSON(content)

  let score = 0

  if (parsed) {
    score += parsed._type ? 1 : 0
    score += parsed.__export_format ? 1 : 0
    score += parsed.__export_source ? 1 : 0
    score += parsed.resources ? 1 : 0
    score /= 4
  }

  return score > 0.9
}

/**
 * Converts a string to JSON object or null if cannot be parsed
 * @param {string} content - the string to parse
 * @returns {Object|null} the converted object, or null if str was not a JSON string
 */
methods.maybeParseJSON = (content) => {
  try {
    return JSON.parse(content)
  }
  catch (jsonParseError) {
    return null
  }
}


methods.resolve = (options, uri, { $ref = '' } = {}) => {
  const uriToLoad = resolve(uri, $ref)
  if (parse(uriToLoad).protocol === 'file:') {
    return options.fsResolver.resolve(uriToLoad.split('#')[0])
  }

  return options.httpResolver.resolve(uriToLoad.split('#')[0])
}

methods.fixPrimary = (options, { content }) => {
  let data = null
  try {
    data = JSON.parse(content)
  }
  catch (e) {
    return Promise.reject(new Error('could not parse Insomnia file (not JSON)'))
  }

  if (!data) {
    return Promise.reject(new Error('Attempting to parse the Insomnia file yielded `null`'))
  }

  return data
}

methods.handleRejection = (error) => {
  return Promise.reject(error)
}

methods.load = ({ options, uri }) => {
  const primaryPromise = methods.resolve(options, uri)

  return primaryPromise.then(
    (primary) => methods.fixPrimary(options, { content: primary }),
    methods.handleRejection
  )
}

export const __internals__ = methods
export default InsomniaLoader

