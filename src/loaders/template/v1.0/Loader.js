/**
 * This is a template to help speed up the writing of a loader.
 *
 * A Loader acts as a sort of helper that digests a file and its possible dependencies into a nicely
 * formatted object that can be easily parsed. It is in charge of resolving dependencies and
 * integrating them correctly in the item that is returned. In its most simple form, a Loader can be
 * a simple `JSON.parse` on a file with no dependencies.
 *
 * For example, the swagger format allows paths to be defined in multiple files, with the main file
 * holding references to these externally defined files. In addition, it allows one to implicitly
 * define a host, port and basePath based on the origin of the main file. The Swagger Loader will
 * therefore try to resolve every reference to external paths it encounters, as well as making
 * the host, port and basePath explicit in the main file, if they are not present. This reduces
 * greatly the complexity of the checks that need to be done in the parser.
 *
 * Another example would be the Postman collection v2 format, where the schema is very very
 * permissive in terms of what is considered valid (e.g. a request can be a string representing a
 * URL or it can be an object with a `url` field that can be a string or an object that optionally
 * contains `protocol`, `domain`, `port`, `path` and `query` objects or strings). Additionally,
 * the actual implementation, while valid from a strict json schema point of view, is semantically
 * in contradiction with the format on certain points, with, for instance, a `host` field instead
 * of the `domain` field specified in the spec. All this makes it quite complex to manipulate
 * postman collections. The Postman Collection v2 Loader helps resolve this issue, by normalizing
 * the format (e.g. every string is transformed into its more descriptive object representation).
 *
 * If there are aspects of your format that can be polymorphic, or if your format can be decomposed
 * between multiple files, it is recommended that you normalize it in the Loader for your format.
 *
 * Additionally, you can also define Loaders for non-core files (e.g. files that cannot be parsed
 * alone, but are referenced in core format files)
 */
import { resolve, parse } from 'url'

const methods = {}

/**
 * Meta information about the Loader.
 * @property {Array<string>} extensions - **beta** the file extensions that this loader can be
 * responsible for. This is mostly used for loaders for non-parsable objects.
 * @property {boolean} parsable - whether the Loader returns a parsable item.
 * @property {string} format - the format this Loader is responsible for.
 */
const __meta__ = {
  extensions: [ 'json', 'yml', 'har', 'whatever' ],
  parsable: true,
  format: 'template'
}

/**
 * @class TemplateLoader
 * @description An example loader to help speed up the support of a new format.
 * It holds all the necessary methods used to load and fix a file written in a given format
 */
export class TemplateLoader {
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

/**
 * Tests whether the content of a file is parsable by this loader and associated parser. This is
 * used to tell which loader/parser combo should be used.
 * @param {string?} content - the content of the file to test
 * @returns {boolean} whether it is parsable or not
 */
methods.isParsable = (content) => {
  // FIXME use your own parsability strategy
  if (!content) {
    return false
  }
  return false
}

/**
 * Resolves a $ref uri to a local or remote file. if no $ref is provided, the root uri is used
 * instead.
 * @param {Object} options - an object holding all the settings necessary for resolving, loading,
 * parsing and serializing a uri and its dependencies. It notably holds an `fsResolver` and an
 * `httpResolver` which are used to resolve local and remote files in a given environment.
 * @param {Object} options.fsResolver - a local file resolver. It can fail to resolve if the file
 * does not exist, or if the environment does not allow for local file resolution (web).
 * @param {Object} options.httpResolver - a remote file resolver. It can fail to resolve if the
 * file does not exist or if the environment does not allow for remote file resolution (because of
 * cross-origin for instance)
 * @param {string} uri - the base uri from which to resolve references. If no reference is provided,
 * it itself is resolved.
 * @param {Object} schema - a schema holding a reference to resolve
 * @param {string} schema.$ref - the reference to resolve. It is can depend on the uri of the file
 * in which it was found (hence the existence of the `uri` field)
 * @returns {Promise} the resolved content of the file located at $ref or uri.
 *
 * IMPORTANT: Do NOT implement your own resolution strategies here. Do not use fetch, or
 * XMLHTTPRequest, or http.get here. Loaders must be environment-agnostic, otherwise your code will
 * NOT be portable to multiple environments such node, web, webworker, or paw. If the environment
 * you wish to use this loader in is not already present, you can create it base on the template
 * provided in `src/environments/template/`.
 */
methods.resolve = (options, uri, { $ref = '' } = {}) => {
  const uriToLoad = resolve(uri, $ref)
  const protocol = parse(uriToLoad).protocol
  if (protocol === 'file:' || protocol === 'file' || !protocol) {
    return options.fsResolver.resolve(uriToLoad.split('#')[0])
  }

  return options.httpResolver.resolve(uriToLoad.split('#')[0])
}

/**
 * Modifies a primary file to be more easily manipulable (by resolving external dependencies,
 * simplifying the format, normalizing it, removing external context, etc.). This is the entry point
 * for most of the normalization code that can be needed.
 * @param {Object} options - an object holding all the settings necessary for resolving, loading,
 * parsing and serializing a uri and its dependencies. This MUST be passed as a field in the
 * resolved object.
 * @param {Object} resolved - an object describing a resolved uri. it notably contains the content
 * of the resolved file.
 * @param {string} resolved.content - the content a resolved uri.
 * @returns {Promise} a promise containing the normalized/fixed primary item of the format.
 *
 * IMPORTANT: The resolution format is standardized and MUST be of the form { options, item },
 * where the `options` field is the options initially passed to the loader, and the `item` field
 * contains the normalized item (parsed, without dependencies, etc.).
 */
methods.fixPrimary = (options, resolved) => {
  if (!resolved.content || resolved.content) {
    return Promise.reject(new Error('this method needs to be implemented'))
  }
  return Promise.resolve({ options, item: resolved.content })
}

/**
 * Handles the case of a failed resolution. Different loaders and parsers can be more or less
 * tolerant to failures, and can implement different strategies as to what to do in the event of a
 * failure.
 * @param {Error} error - the error that caused the resolution failure
 * @returns {Promise} a promise that represents the failure strategy of the Loader.
 */
methods.handleRejection = (error) => {
  return Promise.reject(error)
}

/**
 * Resolves a URI and fixes it if necessary.
 * @param {Object} namedParams - an object holding the named parameters used for the resolution of
 * the URI.
 * @param {Object} namedParams.options - an object holding all the settings necessary for resolving,
 * loading, parsing and serializing a uri and its dependencies.
 * @param {string} uri - the URI to resolve to a file that will be used as the primary file for this
 * loader
 * @returns {Promise} a Promise containing the `options` and normalized `item` in an object. See
 * `methods.fixPrimary` for more information.
 */
methods.load = ({ options, uri }) => {
  const primaryPromise = methods.resolve(options, uri)

  return primaryPromise.then(
    (primary) => methods.fixPrimary(options, { content: primary }),
    methods.handleRejection
  )
}

/**
 * @exports __internals__ - this object should hold all the methods used in this file. It used to
 * easily mock and spy on internal methods in a testing environment.
 */
export const __internals__ = methods

/**
 * @exports TemplateLoader - the core object of this module: the Loader
 */
export default TemplateLoader
