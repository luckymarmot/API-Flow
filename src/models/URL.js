import { parse, format, resolve } from 'url'
import { Record, List } from 'immutable'

import Model from './ModelInfo'

import URLComponent from './URLComponent'
/**
 * Metadata about the URL Record.
 * Used for internal serialization and deserialization
 */
const modelInstance = {
  name: 'url.models',
  version: '0.1.0'
}
const model = new Model(modelInstance)

/**
 * Default Spec for the URL Record.
 * Most fields are direct matches for parse(url), except for protocol, hostname, pathname, and
 * secure.
 * - `protocol` expects a List of protocols applicable to the url
 * - `hostname` and `pathname` are URLComponents, as they are the two core fields of the urlObject.
 * - `secure` is a boolean to tell whether the url supports a secure protocol. This is a helper to
 * make generation more uniform and favor secure protocols over unsecure ones.
 * Other fields may evolve into URLComponents in future versions, when the need for higher
 * descriptivity arises.
 */
const URLSpec = {
  _model: model,
  uuid: null,
  protocol: List(),
  slashes: true,
  auth: null,
  host: null,
  port: null,
  hostname: null,
  href: null,
  path: null,
  pathname: null,
  query: null,
  search: null,
  hash: null,
  secure: false,
  variableDelimiters: List(),
  description: null
}

/**
 * Holds all the internal methods used in tandem with a URL
 */
const methods = {}

/**
 * The URL Record
 */
export class URL extends Record(URLSpec) {
  constructor(props) {
    if (!props) {
      super()
      return this
    }

    const { url, uuid, secure, variableDelimiters, description } = props
    let urlComponents = url
    if (typeof url === 'string') {
      const urlObject = parse(url)
      urlComponents = methods.convertURLObjectToURLComponents(urlObject, variableDelimiters)
    }

    if (url && typeof url === 'object' && !(url.host instanceof URLComponent)) {
      urlComponents = methods.convertURLObjectToURLComponents(url, variableDelimiters)
    }

    super({ ...urlComponents, secure, uuid, variableDelimiters, description })
    return this
  }

  generate(delimiters = List(), useDefault = true) {
    return methods.generate(this, delimiters, useDefault)
  }

  resolve(url, delimiters = List(), useDefault = true) {
    return methods.resolve(this, url, delimiters, useDefault)
  }

  toURLObject(delimiters, useDefault) {
    return methods.convertURLComponentsToURLObject(this, delimiters, useDefault)
  }
}

/**
 * converts all urlObject fields into their corresponding type used in the URL Record
 * @param {Object} _urlObject: the urlObject to convert
 * @param {List<string>} variableDelimiters: the variable delimiters (needed to detect variables in
 * the fields)
 * @returns {Object} an object containing the matching URL Record fields
 */
methods.convertURLObjectToURLComponents = (_urlObject, variableDelimiters = List()) => {
  const urlObject = methods.fixUrlObject(_urlObject)

  const components = {
    protocol: List([ urlObject.protocol ]),
    slashes: urlObject.slashes,
    auth: urlObject.auth,
    host: urlObject.host,
    hostname: urlObject.hostname ? new URLComponent({
      componentName: 'hostname',
      string: urlObject.hostname,
      variableDelimiters
    }) : null,
    port: urlObject.port ? new URLComponent({
      componentName: 'port',
      string: urlObject.port,
      variableDelimiters
    }) : null,
    path: urlObject.path,
    pathname: urlObject.pathname ? new URLComponent({
      componentName: 'pathname',
      string: urlObject.pathname,
      variableDelimiters
    }) : null,
    search: urlObject.search,
    query: urlObject.query,
    hash: urlObject.hash,
    href: urlObject.href,
    secure: urlObject.secure || false
  }

  return components
}

/**
 * converts a URL Record into a urlObject
 * @param {URL} url: the URL Record to convert
 * @param {List<string>} delimiters: the variable delimiters (needed to format variables in the
 * fields)
 * @param {boolean} useDefault: whether to use the default values or not
 * @returns {Object} the corresponding urlObject
 */
methods.convertURLComponentsToURLObject = (url, delimiters = List(), useDefault = true) => {
  const protocol = url.get('secure') ?
    url.get('protocol').filter(proto => proto.match(/[^w]s:?$/)).get(0) :
    url.getIn([ 'protocol', 0 ])

  const slashes = url.get('slashes')
  const hostname = url.get('hostname') ?
    url.get('hostname').generate(delimiters, useDefault) : null
  const port = url.get('port') ?
    url.get('port').generate(delimiters, useDefault) : null
  const pathname = url.get('pathname') ?
    url.get('pathname').generate(delimiters, useDefault) : null

  const urlObject = {
    protocol, slashes, hostname, port, pathname
  }

  return urlObject
}

/**
 * generates an href from a URL
 * @param {URL} url: the URL Record to generate the href from
 * @param {List<string>} delimiters: the variable delimiters (needed to format variables in the
 * fields)
 * @param {boolean} useDefault: whether to use the default values or not
 * @returns {string} the url.href
 */
methods.generate = (url, delimiters = List(), useDefault = true) => {
  const urlObject = methods.convertURLComponentsToURLObject(url, delimiters, useDefault)
  return format(urlObject)
}

/**
 * generates a URL from a URL and a url string
 * @param {URL} from: the URL Record to that serves as a base reference
 * @param {string} to: the url to reach
 * @param {List<string>} delimiters: the variable delimiters (needed to format variables in the
 * fields)
 * @param {boolean} useDefault: whether to use the default values or not
 * @returns {URL} the resolved URL
 */
methods.resolve = (from, to, delimiters, useDefault = true) => {
  const fromString = methods.generate(from, delimiters, useDefault)
  let resolved = resolve(fromString, to)

  // massive hack
  // FIXME
  resolved = resolved.replace('///', '//')

  return new URL({
    url: resolved,
    variableDelimiters: delimiters
  })
}

/**
 * urldecodes every field of a UrlObject
 * @param {UrlObject} urlObject: the urlObject to decode
 * @returns {UrlObject} the decoded urlObject
 */
methods.decodeUrlObject = (urlObject) => {
  const keys = Object.keys(urlObject)

  for (const key of keys) {
    if (typeof urlObject[key] === 'string') {
      urlObject[key] = decodeURIComponent(urlObject[key])
    }
  }

  return urlObject
}

/**
 * separates the host string into hostname and port
 * @param {string} host: the host string
 * @returns {Object} the hostname and port if they exist
 */
methods.splitHostInHostnameAndPort = (host) => {
  const [ hostname, port ] = host.split(':')
  return { hostname: hostname || null, port: port || null }
}

/**
 * extracts the host from a pathname. Used when URL.parse failed to parse
 * the URL correctly (often due to the presence of brackets in the hostname)
 * @param {string} _pathname: the pathname to decompose
 * @returns {Object} the host and pathname, if they exist
 */
methods.splitPathnameInHostAndPathname = (_pathname) => {
  const m = _pathname.match(/([^/]*)(\/.*)/)

  if (m) {
    const host = m[1] || null
    const pathname = m[2] || null
    return { host, pathname }
  }

  return { host: _pathname || null, pathname: null }
}

/**
 * creates a path from a pathname and a search field
 * @param {string} pathname: the pathname field of a UrlObject
 * @param {string} search: the search field of a UrlObject
 * @returns {string} the url.path
 */
methods.createPathFromPathNameAndSearch = (pathname, search) => {
  return (pathname || '') + (search || '') || null
}

/**
 * generates an href from a base URL, a host and a path. This is used to update
 * the href field of a UrlObject, when the URL.parse failed.
 * @param {URL} base: the base URL Record to generate the href from
 * @param {?string} host: the host to use in place of the base URL's host
 * @param {?string} pathname: the pathname to use in place of the base URL's pathname
 * @returns {string} the url.href
 */
methods.createHrefFromBaseAndHostAndPathName = (base, host, pathname) => {
  return format({
    protocol: base.protocol || null,
    slashes: base.slashes,
    auth: base.auth || null,
    host: host || null,
    pathname: pathname || null,
    search: base.search || null,
    hash: base.hash || null
  })
}

/**
 * tries to fix a UrlObject that has no host by searching the pathname for a host
 * and updating the related fields
 * @param {UrlObject} urlObject: the UrlObject to fix
 * @returns {UrlObject} the fixed urlObject
 */
methods.fixUrlObject = (urlObject) => {
  const decoded = methods.decodeUrlObject(urlObject)
  if (decoded.host || !decoded.pathname) {
    return decoded
  }

  const { host, pathname } = methods.splitPathnameInHostAndPathname(decoded.pathname)
  const { hostname, port } = methods.splitHostInHostnameAndPort(host)
  const path = methods.createPathFromPathNameAndSearch(pathname, decoded.search)
  const href = methods.createHrefFromBaseAndHostAndPathName(decoded, host, pathname)

  return { ...urlObject, host, pathname, hostname, port, path, href }
}

export const __internals__ = methods
export default URL
