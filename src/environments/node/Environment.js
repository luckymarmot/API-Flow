import fs from 'fs'
import { parse } from 'url'
import request from 'request'

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
  return new Promise((resolve, reject) => {
    if (cache[cleanUri]) {
      return resolve(cache[cleanUri])
    }
    else {
      const path = parse(uri).pathname
      fs.readFile(path, function(err, data) {
        if (err) {
          return reject(new Error(err))
        }
        else {
          const content = data.toString()
          cache[cleanUri] = content
          return resolve(content)
        }
      })
    }
  })
}

methods.httpResolve = (uri) => {
  const cleanUri = uri.split('#')[0]
  return new Promise((resolve, reject) => {
    if (cache[cleanUri]) {
      return resolve(cache[cleanUri])
    }
    else {
      request.get(uri, (error, response, body) => {
        if (error) {
          return reject(new Error(error))
        }
        else {
          cache[cleanUri] = body
          return resolve(body)
        }
      })
    }
  })
}

const NodeEnvironment = {
  setCache: methods.setCache,
  cache,
  fsResolver: { resolve: methods.fsResolve },
  httpResolver: { resolve: methods.httpResolve }
}

export const __internals__ = methods
export default NodeEnvironment
