import { resolve, parse } from 'url'

const methods = {}

const __meta__ = {
  extensions: [ 'json' ],
  parsable: true,
  format: 'internal'
}

export class InternalLoader {
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
  const parsed = methods.parseJSON(content)
  return !!parsed && parsed._model
}

/**
 * converts a string written in JSON or YAML format into an object
 * @param {string} str: the string to parse
 * @returns {Object?} the converted object, or null if str was not a JSON or YAML string
 */
methods.parseJSON = (str) => {
  let parsed = null
  try {
    parsed = JSON.parse(str)
  }
  catch (jsonParseError) {
    return null
  }
  return parsed
}

methods.resolve = (options, uri, { $ref = '' } = {}) => {
  const uriToLoad = resolve(uri, $ref)
  if (parse(uriToLoad).protocol === 'file:') {
    return options.fsResolver.resolve(uriToLoad.split('#')[0])
  }

  return options.httpResolver.resolve(uriToLoad.split('#')[0])
}


methods.fixPrimary = (options, { content }) => {
  const internal = methods.parseJSON(content)

  if (!internal) {
    return Promise.reject(new Error('could not parse internal file (not a JSON)'))
  }

  return { options, item: internal }
}

methods.handleRejection = (error) => {
  return Promise.reject(error)
}

methods.load = ({ options, uri }) => {
  const primaryPromise = methods.resolve(options, uri)

  return primaryPromise
    .then(
      (primary) => {
        return methods.fixPrimary(options, { uri, content: primary })
      },
      methods.handleRejection
    )
}

export const __internals__ = methods
export default InternalLoader
