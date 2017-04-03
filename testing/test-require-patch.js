import path from 'path'

const configPath = path.join(__dirname, '../src/api-flow-config.js')

const Module = require('module')
const realResolve = Module._resolveFilename
Module._resolveFilename = (request, parent) => {
  if (request === 'api-flow-config') {
    return configPath
  }
  const resolved = realResolve(request, parent)
  return resolved
}
