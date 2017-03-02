// TODO this is not what we want (this should happen in ./loaders/loaders, ./parsers/parsers, etc.)
import environment from './environments/environment'
import loaders from './loaders/loaders'
import parsers from './parsers/parsers'
import serializers from './serializers/serializers'
import { currify } from './utils/fp-utils'

const methods = {}

export class DefaultApiFlow {
  static detectFormat(content) {
    return methods.detect(content)
  }

  static detectName(content) {
    return methods.detectName(content)
  }

  static setCache(cache) {
    environment.setCache(cache)
  }

  static setup({ options } = {}) {
    return methods.setup({ options })
  }

  static findPrimaryUri({ options, items }) {
    return methods.findPrimaryUri({ options, items })
  }

  static load({ options, uri }) {
    return methods.load({ options, uri })
  }

  static parse({ options, item }) {
    return methods.parse({ options, item })
  }

  static serialize({ options, api }) {
    return methods.serialize({ options, api })
  }

  static transform({ options, uri }) {
    return methods.transform({ options, uri })
  }
}

// TODO implement this
methods.findPrimaryUri = ({ items }) => {
  if (items.length === 1) {
    return items[0].uri
  }

  const candidate = items
    .filter(item => loaders.filter(loader => loader.isParsable(item)).length > 0)[0]

  if (!candidate) {
    throw new Error('could not find a suitable candidate to act as a primary file for the parsing')
  }

  return candidate.uri
}

methods.setup = ({ options = {} } = {}) => {
  options.fsResolver = environment.fsResolver
  options.httpResolver = environment.httpResolver

  return options
}

/**
 * finds a loader for the source format, or infers one from the extension of the primary file
 * @param {Object} args: the named arguments of the methods
 * @param {Object} args.options: the settings to use to convert this ensemble of items
 * @param {Object} args.primary: the primary file of this conversion, it is used as a starting point
 * by the loader to extract all required dependencies, and fix files if needed
 * @returns {Loader?} the loader that is required to prepare the primary file and its associated
 * items, if one was found.
 */
methods.getLoader = ({ options = {}, uri }) => {
  const { format } = options.source || {}

  if (!format) {
    const loader = loaders.getLoaderByExtension(uri, true)
    return loader
  }

  const loader = loaders.getLoaderByFormat(format)
  return loader
}

/**
 * load a primary file and associated items in memory, with all the required dependencies that can
 * be resolved, and fixes the files to remove external information
 * @param {Object} args: the named arguments of the methods
 * @param {Object} args.options: the settings to use to convert this ensemble of items
 * @param {string} args.uri: the uri of the primary file
 * @param {Item?} args.primary: the primary file to load, if there is one.
 * @returns {Promise} a promise that resolves once everything needed has been loaded into memory.
 */
methods.load = ({ options, uri }) => {
  let $options = options
  if (!options || !options.fsResolver || !options.httpResolver) {
    $options = methods.setup({ options })
  }

  const loader = methods.getLoader({ options: $options, uri })

  if (!loader) {
    return Promise.reject(new Error('could not load file(s): missing source format'))
  }

  return loader.load({ options: $options, uri })
}

/**
 * iteratively (reduce) finds the best parser for a given item
 * @param {Item} item: the item to test the parser against
 * @param {{score: number, format: string, version: string}} best: the best parser found yet
 * @param {Parser} parser: the parser to test
 * @returns {{score: number, format: string, version: string}} best: the updated best parser
 */
methods.findBestParser = (item, best, parser) => {
  const { format, version, score } = parser.detect(item)

  if (best.score < score) {
    return { format, version, score }
  }

  return best
}

/**
 * groups item results by format and version, iff the associated score is above 0.9
 * @param {Object} acc: the accumulator that holds the items grouped by format and version
 * @param {{score: number, format: string, version: string}} toGroup: the best parser associated
 * with an item
 * @return {Object} acc: the updated accumulator
 */
methods.groupByFormatAndVersion = (acc, toGroup) => {
  const { version, format, score } = toGroup

  if (score < 0.9) {
    return acc
  }

  const key = format + '@' + version
  acc[key] = acc[key] || []
  acc[key].push(toGroup)
  return acc
}

/**
 * infers the version of the format that should be used for the items
 * @param {string} format: the format of the items
 * @param {Array<Item>} items: the items to use to find the version of the format
 * @returns {{format: string, version: string?}} the infered format and version
 */
methods.inferVersion = (format, item) => {
  const potentialParsers = parsers.getParsersByFormat(format)

  const findBestParser = currify(methods.findBestParser, item)
  const candidate = potentialParsers.reduce(findBestParser, { format, version: null, score: -1 })

  if (candidate.format && candidate.version) {
    return { format, version: candidate.version }
  }

  return { format, version: null }
}

/**
 * infers the format and version that should be used for the items
 * @param {Array<Item>} items: the items to use to find the version of the format
 * @returns {{format: string?, version: string?}} the infered format and version
 */
methods.inferBestFormatAndBestVersion = (item) => {
  const potentialParsers = parsers.getParsers()

  const findBestParser = currify(methods.findBestParser, item)
  const candidate = potentialParsers
    .reduce(findBestParser, { format: null, version: null, score: -1 })

  if (candidate.format && candidate.version) {
    return { format: candidate.format, version: candidate.version }
  }

  return { format: null, version: null }
}

/**
 * complements format and version with infered format and version from items
 * @param {Object} args: the named arguments of the method
 * @param {string?} args.format: the parse format of the loaded items, if it was provided,
 * @param {string?} args.version: the version of the format of the primary file, if it was provided.
 * @param {Array<Item>} args.items: the items to use to infer the missing format and/or the missing
 * version of the loader
 * @returns {{ format: string?, version: string? }} the resulting format and version
 */
methods.inferFormatAndVersion = ({ format, version, item }) => {
  if (format && version) {
    return { format, version }
  }

  if (format) {
    return methods.inferVersion(format, item)
  }

  return methods.inferBestFormatAndBestVersion(item)
}

/**
 * finds the parser corresponding to a set of items or infers it.
 * @param {Object} args: the named arguments of the method
 * @param {Object} args.options: the settings to use to parse the items
 * @param {Array<Item>} items: the loaded items.
 * @returns {Parser?} the corresponding parser
 */
methods.getParser = ({ options = {}, item }) => {
  let { format, version } = options.source || {}

  if (!format || !version) {
    const infered = methods.inferFormatAndVersion({ format, version, item })

    format = infered.version
    version = infered.version
  }

  if (!format || !version) {
    return null
  }

  const parser = parsers.getParserByFormatAndVersion({ format, version })
  return parser
}

/**
 * parses an array of loaded items into Apis
 * @param {Object} args: the named arguments of the method
 * @param {Object} args.options: the settings to use to parse the items
 * @param {Array<Item>} items: the loaded items to parse
 * @returns {Promise} a promise that resolves with an array of Apis and options if it successfully
 * parses the items
 */
methods.parse = ({ options, item }) => {
  const parser = methods.getParser({ options, item })

  if (!parser) {
    return Promise.reject(new Error('could not parse file(s): missing source format'))
  }

  return parser.parse({ options, item })
}

/**
 * finds the serializer to use for the Apis.
 * @param {Object} args: the named arguments of the method
 * @param {Object} args.options: the settings to use to serialize the Apis
 * @returns {Serializer?} the corresponding serializer
 */
methods.getSerializer = ({ options = {} }) => {
  const { format, version } = options.target || {}

  if (!format) {
    return null
  }

  if (!version) {
    return serializers.getNewestSerializerByFormat(format)
  }

  return serializers.getSerializerByFormatAndVersion({ format, version })
}

/**
 * parses an array of loaded Apis into their expected format
 * @param {Object} args: the named arguments of the method
 * @param {Object} args.options: the settings to use to serialize the items
 * @param {Array<Item>} items: the Apis to serialize
 * @returns {Promise} a promise that resolves with an array of Items if it successfully
 * serializes the items
 */
methods.serialize = ({ options, api }) => {
  const serializer = methods.getSerializer({ options })

  if (!serializer) {
    return Promise.reject(new Error('could not convert Api(s): missing target format'))
  }

  const serialized = serializer.serialize({ options, api })
  return serialized
}

methods.transform = ({ options, uri }) => {
  return methods.load({ options, uri })
    .then(methods.parse, methods.handleLoadError)
    .then(methods.serialize, methods.handleParseError)
    .catch(methods.handleSerializeError)
}

export const __internals__ = methods
export default DefaultApiFlow
