import { NetworkHTTPRequest } from '../../mocks/PawShims'

let cache = {}

const methods = {}

methods.setCache = ($cache) => {
  if ($cache) {
    Object.assign(cache, $cache)
  }
  else {
    cache = {}
  }
}

methods.fsResolve = (uri) => {
  const cleanUri = uri.split('#')[0]

  if (cache[cleanUri]) {
    return Promise.resolve(cache[cleanUri])
  }

  const msg = 'Sandbox error: include ' +
    cleanUri +
    'in your import by dragging it along with the main file.'

  return Promise.reject(new Error(msg))
}

methods.httpResolve = (uri) => {
  const cleanUri = uri.split('#')[0]

  if (cache[cleanUri]) {
    return Promise.resolve(cache[cleanUri])
  }

  return new Promise((resolve, reject) => {
    const request = new NetworkHTTPRequest()
    request.requestUrl = uri
    request.requestMethod = 'GET'
    request.requestTimeout = 20 * 1000
    const status = request.send()

    if (status && request.responseStatusCode < 300) {
      resolve(request.responseBody)
    }
    else {
      const msg = 'Failed to fetch ' +
        uri + '. Got code: ' +
        request.responseStatusCode
      reject(new Error(msg))
    }
  })
}

const PawEnvironment = {
  setCache: methods.setCache,
  cache,
  fsResolver: { resolve: methods.fsResolve },
  httpResolver: { resolve: methods.httpResolve }
}

export const __internals__ = methods
export default PawEnvironment
