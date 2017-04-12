/**
 * This is a template to help speed up the writing of an environment.
 *
 * An Environment acts as a sort of wrapper around I/O calls for Loaders, normalizing the Interface
 * used to interact with the world. Environments can therefore be used to describe a web or
 * web-worker environment, or a node environment or Paw. Each of these environments have different
 * interfaces when dealing with I/O calls. For instance, web environments cannnot access local
 * files, and uses XMLHttpRequest to resolve remote files. Node, on the other hand, can access local
 * files. Finally, paw is sandboxed, cannot access local files unless granted authorization by the
 * user and can only access remote files under certain conditions, with a different API from both
 * node and the web.
 *
 * Additionally, an Environment can store files for resolution. This can be useful when these files
 * are not readily available or should be accessible at a different uri than the one they currently
 * are (e.g. during development of an API). Paw makes use of this functionality to avoid asking the
 * user permission for each file, if they were dragged along with the primary file of the format to
 * parse.
 *
 * If you intend to run API-Flow in an environment that is not one of the already available
 * environments, and that has different apis for file resolution than these environments, this is
 * the file you should inspire yourself from.
 */

/**
 * A cache that holds resolved uris. This is useful to reduce the I/O footprint, as well as
 * for saving prefetched files at arbitrary uris.
 */
let cache = {}

const methods = {}

/**
 * updates the cache with new (uri -> content) relationships. If an object is provided, this will
 * merge the old cache with the new one. If no object is provided, it will clear the cache
 * @param {Object?} $cache - a Map of uri to content to merge with the current cache
 * @returns {Object} the updated cache
 */
methods.setCache = ($cache) => {
  if ($cache) {
    return Object.assign(cache, $cache)
  }
  else {
    cache = {}
    return cache
  }
}

/**
 * tries to resolve a local file, first against the cache, then by using methods available in this
 * environment.
 * @param {string} uri - the uri to resolve to a local file
 * @returns {Promise} a promise resolving to the content of the file on success
 */
methods.fsResolve = (uri) => {
  const cleanUri = uri.split('#')[0]

  if (cache[cleanUri]) {
    return Promise.resolve(cache[cleanUri])
  }

  return Promise.reject(new Error('this environment cannot access local files'))
}

/**
 * tries to resolve a remote file, first against the cache, then by using methods available in this
 * environment.
 * @param {string} uri - the uri to resolve to a remote file
 * @returns {Promise} a promise resolving to the content of the file on success
 */
methods.httpResolve = (uri) => {
  const cleanUri = uri.split('#')[0]

  if (cache[cleanUri]) {
    return Promise.resolve(cache[cleanUri])
  }

  return Promise.reject(new Error('this environment cannot access remote files'))
}

/**
 * @exports TemplateEnvironment - the core object of this module: the Environment
 * @property {Function} setCache - updates the cache of the environment
 * @property {Object} cache - the cache of the environment
 * @property {Object} fsResolver - the local file resolver
 * @property {Function} fsResolver.resolve - the resolution method of the local file resolver
 * @property {Object} httpResolver - the remote file resolver
 * @property {Function} httpResolver.resolve - the resolution method of the remote file resolver
 */
const TemplateEnvironment = {
  setCache: methods.setCache,
  cache,
  fsResolver: { resolve: methods.fsResolve },
  httpResolver: { resolve: methods.httpResolve }
}

/**
 * @exports __internals__ - this object should hold all the methods used in this file. It used to
 * easily mock and spy on internal methods in a testing environment.
 */
export const __internals__ = methods

export default TemplateEnvironment
