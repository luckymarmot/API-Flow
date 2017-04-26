import { resolve, parse } from 'url'
import yaml from 'js-yaml'

const methods = {}

const __meta__ = {
  extensions: [ 'json', 'yml', 'yaml', 'swagger' ],
  parsable: true,
  format: 'swagger'
}

/**
 * @class SwaggerLoader
 * @description The loader associated with the Swagger v2.0 format.
 * It holds all the necessary methods used to load a file in Swagger v2.0 format.
 */
export class SwaggerLoader {
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
  const parsed = methods.parseJSONorYAML(content)

  let score = 0

  if (parsed) {
    score += parsed.swagger ? 1 / 4 : 0
    score += parsed.swagger === '2.0' ? 1 / 4 : 0
    score += parsed.info ? 1 / 4 : 0
    score += parsed.paths ? 1 / 4 : 0
    score = score > 1 ? 1 : score
  }

  return score > 0.9
}

/**
 * converts a string written in JSON or YAML format into an object
 * @param {string} str: the string to parse
 * @returns {Object?} the converted object, or null if str was not a JSON or YAML string
 */
methods.parseJSONorYAML = (str) => {
  let parsed = null
  try {
    parsed = JSON.parse(str)
  }
  catch (jsonParseError) {
    try {
      parsed = yaml.safeLoad(str)
    }
    catch (yamlParseError) {
      return null
    }
  }
  return parsed
}

methods.compareUris = (first, second, base) => {
  const $first = base ? resolve(base, first) : first
  const $second = base ? resolve(base, second) : second

  return $first.split('#')[0] === $second.split('#')[0]
}

methods.traverseObject = (hash, toTraverse) => {
  const path = hash.split('/').slice(1)
  let traversed = toTraverse
  while (path.length > 0) {
    traversed = traversed[path.shift()]
    if (!traversed) {
      return {}
    }
  }

  return traversed
}

methods.traverse = (content, { $ref = '#/' } = {}) => {
  const toTraverse = methods.parseJSONorYAML(content)

  if (!toTraverse) {
    return {}
  }

  const hash = $ref.split('#')[1]

  if (!hash) {
    return toTraverse
  }

  return methods.traverseObject(hash, toTraverse)
}

methods.resolve = (options, uri, { $ref = '' } = {}) => {
  const uriToLoad = resolve(uri, $ref)
  if (parse(uriToLoad).protocol === 'file:') {
    return options.fsResolver.resolve(uriToLoad.split('#')[0])
  }

  return options.httpResolver.resolve(uriToLoad.split('#')[0])
}

methods.objectMap = (obj, func) => {
  const mapped = Object.keys(obj).map(key => ({ key: key, value: func(obj[key], key, obj) }))
  return mapped
}

methods.fixRemotePaths = (options, uri, swagger) => {
  const pathPromises = Object.keys(swagger.paths).map(path => {
    const pathObj = swagger.paths[path]
    if (!pathObj.$ref || pathObj.$ref[0] === '#') {
      return Promise.resolve({ key: path, value: pathObj })
    }

    const updated = methods
      .resolve(options, uri, path)
      .then(item => methods.traverse(item.content, path))
      .then(value => ({ key: path, value: value }))
    return updated
  })

  return Promise.all(pathPromises).then(pathArray => {
    const paths = pathArray.reduce((acc, { key, value }) => {
      acc[key] = value
      return acc
    }, {})

    swagger.paths = paths
    return swagger
  })
}

methods.fixImplicitHost = (uri) => {
  if (!uri) {
    return 'localhost'
  }

  const host = parse(uri).host
  if (!host) {
    return 'localhost'
  }

  return host
}

methods.fixImplicitUriReferences = (options, uri, swagger) => {
  if (!swagger.host) {
    swagger.host = methods.fixImplicitHost(uri)
  }

  if (!swagger.schemes || !swagger.schemes.length) {
    const scheme = uri ? (parse(uri).protocol || '').split(':')[0] : 'http'
    swagger.schemes = [ scheme ]
  }

  return { options, item: swagger }
}

methods.fixPrimary = (options, { uri, content }) => {
  const swagger = methods.parseJSONorYAML(content)

  if (!swagger) {
    return Promise.reject(new Error('could not parse swagger file (not a JSON or YAML)'))
  }

  return methods.fixRemotePaths(options, uri, swagger)
    .then(updatedSwagger => methods.fixImplicitUriReferences(options, uri, updatedSwagger))
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
export default SwaggerLoader
