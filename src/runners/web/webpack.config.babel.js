const path = require('path')

const config = {
  target: 'web',
  entry: path.resolve(__dirname, './api-flow.js'),
  output: {
    path: path.resolve(__dirname, '../../../dist/web/'),
    filename: 'api-flow.js',
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
      'api-flow-config$': path.resolve(__dirname, './api-flow-config.js'),
      'raml-1-parser': path.resolve(__dirname, './raml-1-parser.js')
    }
  },
  node: {
    fs: 'empty',
    request: 'empty',
    net: 'empty',
    tls: 'empty'
  }
}
module.exports = config
