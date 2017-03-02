const webpack = require('webpack')

const path = require('path')

const config = {
  target: 'node',
  entry: path.resolve(__dirname, './api-flow.js'),
  output: {
    path: path.resolve(__dirname, '../../../dist/node/'),
    filename: 'api-flow.js',
    library: 'api-flow',
    libraryTarget: 'umd'
  },
  module: {
    rules: [
      { test: /\.js$/, use: 'babel-loader', include: [ path.resolve(__dirname, '../../../src') ] },
      { test: /\.json$/, use: 'json-loader', include: [ path.resolve(__dirname, '../../../') ] }
    ],
    noParse: /node_modules\/json-schema\/lib\/validate\.js/
  },
  resolve: {
    alias: {
      'api-flow-config$': path.resolve(__dirname, './api-flow-config.js')
    }
  },
  node: {
    fs: false,
    request: false,
    net: false,
    tls: false
  }
}
module.exports = config
