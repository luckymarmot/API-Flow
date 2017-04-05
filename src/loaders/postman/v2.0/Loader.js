import { resolve, parse } from 'url'
import { List } from 'immutable'

import URL from '../../../models/URL'
import { convertEntryListInMap } from '../../../utils/fp-utils'

const methods = {}

const __meta__ = {
  extensions: [ 'json' ],
  parsable: true,
  format: 'postman-collection'
}

export class PostmanCollectionV2Loader {
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
  let parsed = null
  try {
    parsed = JSON.parse(content)
  }
  catch (e) {
    return false
  }

  if (!parsed) {
    return false
  }

  let score = 0
  score += parsed.info ? 1 / 5 : 0
  score += (parsed.info || {}).schema ? 1 / 5 : 0
  score += (parsed.info || {}).schema === 'https://schema.getpostman.com/json/collection/v2.0.0/' ?
    1 / 5 : 0
  score += Array.isArray(parsed.item) ? 1 / 2 : 0
  score = score > 1 ? 1 : score

  return score > 0.85
}

methods.resolve = (options, uri, { $ref = '' } = {}) => {
  const uriToLoad = resolve(uri, $ref)
  const protocol = parse(uriToLoad).protocol
  if (protocol === 'file:' || protocol === 'file') {
    return options.fsResolver.resolve(uriToLoad.split('#')[0])
  }

  return options.httpResolver.resolve(uriToLoad.split('#')[0])
}

methods.normalizeRequestItem = (item) => {
  if (item.request && typeof item.request === 'string') {
    const url = item.request
    item.request = {
      url,
      method: 'GET'
    }
  }

  return item
}

methods.normalizeAuthItem = (auth, item) => {
  if (auth) {
    if (!item.request) {
      item.auth = auth
    }
    else if (!item.request.auth) {
      item.request.auth = auth
    }
  }

  return item
}

methods.extractPostmanURLDomainFromURL = (url) => {
  const hostname = url.get('hostname')
  if (!hostname) {
    return null
  }

  return { key: 'domain', value: hostname.generate(List([ '{{', '}}' ])) }
}

methods.extractPostmanURLPortFromURL = (url) => {
  const port = url.get('port')
  if (!port) {
    return null
  }

  return { key: 'port', value: port.generate(List([ '{{', '}}' ])) }
}

methods.extractPostmanURLPathFromURL = (url) => {
  const path = url.get('pathname')
  if (!path) {
    return null
  }

  return { key: 'path', value: path.generate(List([ '{{', '}}' ])) }
}

methods.extractPostmanURLQueryFromURL = (urlString) => {
  const queryString = urlString.split('?')[1]

  if (!queryString) {
    return null
  }

  const queryArray = queryString.split('#')[0]
    .split('&')
    .map(queryParam => {
      const [ key, value ] = queryParam.split('=')
      return { key, value }
    })

  return { key: 'query', value: queryArray }
}

methods.extractPostmanURLProtocolFromURL = (url) => {
  const protocol = url.getIn([ 'protocol', 0 ]) || 'http'

  if (protocol[protocol.length - 1] !== ':') {
    return { key: 'protocol', value: protocol }
  }

  return { key: 'protocol', value: protocol.slice(0, -1) }
}

methods.createPostmanURLObjectFromURLString = (urlString) => {
  const url = new URL({
    url: urlString,
    variableDelimiters: List([ '{{', '}}', ':' ])
  })

  const kvs = [
    methods.extractPostmanURLProtocolFromURL(url),
    methods.extractPostmanURLDomainFromURL(url),
    methods.extractPostmanURLPortFromURL(url),
    methods.extractPostmanURLPathFromURL(url),
    methods.extractPostmanURLQueryFromURL(urlString)
  ].filter(v => !!v)

  return kvs.reduce(convertEntryListInMap, {})
}

methods.extractProtocolStringFromPostmanURLObject = (urlObject) => {
  return (urlObject.protocol || 'http') + '://'
}

methods.extractDomainStringFromPostmanURLObject = (urlObject) => {
  const domain = urlObject.domain || urlObject.host
  console.log('domain ??', domain)
  if (typeof domain === 'string') {
    return domain || 'localhost'
  }

  if (!Array.isArray(domain)) {
    return 'localhost'
  }

  return domain.join('.') || 'localhost'
}

methods.extractPortStringFromPostmanURLObject = (urlObject) => {
  if (!urlObject.port) {
    return ''
  }

  return ':' + urlObject.port
}

methods.extractPathStringFromPostmanURLObject = (urlObject) => {
  if (typeof urlObject.path === 'string') {
    return urlObject.path || '/'
  }

  if (!Array.isArray(urlObject.path)) {
    return '/'
  }

  return '/' + urlObject.path.map(pathPart => {
    if (typeof pathPart === 'string') {
      return pathPart || ''
    }

    return pathPart.value || ''
  }).join('/')
}

methods.extractQueryStringFromPostmanURLObject = (urlObject) => {
  if (
    !urlObject.query ||
    !Array.isArray(urlObject.query) ||
    !urlObject.query.length
  ) {
    return ''
  }

  const queryParams = urlObject.query.map(queryParam => {
    return (queryParam.key || '') + '=' + (queryParam.value || '')
  })

  return '?' + queryParams.join('&')
}

methods.createPostmanURLStringFromURLObject = (urlObject) => {
  if (!urlObject) {
    return 'http://localhost/'
  }

  console.log('hey there', urlObject)

  const url = [
    methods.extractProtocolStringFromPostmanURLObject(urlObject),
    methods.extractDomainStringFromPostmanURLObject(urlObject),
    methods.extractPortStringFromPostmanURLObject(urlObject),
    methods.extractPathStringFromPostmanURLObject(urlObject),
    methods.extractQueryStringFromPostmanURLObject(urlObject)
  ].join('')

  return url
}

methods.normalizeRequestURL = (item) => {
  if (!item.request) {
    return item
  }

  if (typeof item.request.url === 'string') {
    item.request.urlString = item.request.url
    item.request.url = methods.createPostmanURLObjectFromURLString(item.request.urlString)
  }
  else {
    if (item.request.url && !item.request.url.domain && item.request.url.host) {
      item.request.url.domain = item.request.url.host
    }
    item.request.urlString = methods.createPostmanURLStringFromURLObject(item.request.url)
  }

  return item
}

methods.normalizeChild = (auth, item) => {
  let $item = item
  $item = methods.normalizeRequestItem($item)
  $item = methods.normalizeAuthItem(auth, $item)
  $item = methods.normalizeRequestURL($item)

  return $item
}

methods.normalizeItems = (itemGroup) => {
  if (itemGroup.request) {
    return itemGroup
  }

  if (!itemGroup.item || !Array.isArray(itemGroup.item)) {
    return itemGroup
  }

  itemGroup.item = itemGroup.item
    .map(item => methods.normalizeChild(itemGroup.auth, item))
    .map(methods.normalizeItems)

  return itemGroup
}

methods.fixPrimary = (options, { content }) => {
  let collection = null
  try {
    collection = JSON.parse(content)
  }
  catch (e) {
    return Promise.reject(new Error('could not parse postman file (not a JSON)'))
  }

  if (!collection) {
    return Promise.reject(new Error('Attempting to parse the Postman file yielded `null`'))
  }

  try {
    const normalized = methods.normalizeItems(collection)
    return Promise.resolve({ options, item: normalized })
  }
  catch (e) {
    return Promise.reject(e)
  }
}

methods.handleRejection = (error) => {
  return Promise.reject(error)
}

methods.load = ({ options, uri }) => {
  const primaryPromise = methods.resolve(options, uri)

  return primaryPromise
    .then(
      (primary) => {
        return methods.fixPrimary(options, { content: primary })
      },
      methods.handleRejection
    )
}

export const __internals__ = methods
export default PostmanCollectionV2Loader
