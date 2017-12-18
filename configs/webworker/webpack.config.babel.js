const path = require('path')

const config = {
  target: 'webworker',
  entry: path.resolve(__dirname, './api-flow.js'),
  output: {
    path: path.resolve(__dirname, '../../../dist/webworker/'),
    filename: 'api-flow.js',
    libraryTarget: 'umd'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
        include: [ path.resolve(__dirname, '../../src'), __dirname ]
      },
      { test: /\.json$/, use: 'json-loader', include: [ path.resolve(__dirname, '../../') ] }
    ],
    noParse: /node_modules\/json-schema\/lib\/validate\.js/
  },
  resolve: {
    alias: {
      'api-flow-config$': path.resolve(__dirname, './api-flow-config.js'),
      'raml-1-parser': path.resolve(__dirname, '../shared/raml-1-parser.js')
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
