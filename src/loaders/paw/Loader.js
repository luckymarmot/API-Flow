const methods = {}

const __meta__ = {
  extensions: [],
  parsable: true,
  format: 'paw'
}

/**
 * @class PawLoader
 * @description a dummy associated with paw.
 * This is a hack around the options passed to the Parser, as Paw directly exposes a context object
 * as well as a list of items to export
 */
export class PawLoader {
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

methods.isParsable = () => false
methods.load = ({ options }) => ({ options })
