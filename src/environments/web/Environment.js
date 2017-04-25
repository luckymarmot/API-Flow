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

  return Promise.reject(new Error('web browsers cannot access local files'))
}

methods.httpResolve = (uri) => {
  const cleanUri = uri.split('#')[0]

  if (cache[cleanUri]) {
    return Promise.resolve(cache[cleanUri])
  }

  return new Promise((resolve, reject) => {
    const req = new XMLHttpRequest()

    req.addEventListener('error', (event) => {
      return reject(new Error(event))
    })

    req.addEventListener('abort', (event) => {
      return reject(new Error(event))
    })

    req.addEventListener('load', () => {
      return resolve(req.responseText)
    })


    req.open('GET', uri)
    req.send()
  })
}

const BrowserEnvironment = {
  setCache: methods.setCache,
  cache,
  fsResolver: { resolve: methods.fsResolve },
  httpResolver: { resolve: methods.httpResolve }
}

export const __internals__ = methods
export default BrowserEnvironment
