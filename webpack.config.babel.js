import path from 'path'

const name = 'api-flow'

const production = process.env.NODE_ENV === 'production' // eslint-disable-line

const target = process.env.TARGET_ENV

const config = {
  target: target,
  entry: [
    './src/runners/flow-' + target + '.js'
  ],
  output: {
    path: path.join(__dirname,
            './dist/' + target + '/'
        ),
    pathInfo: true,
    publicPath: '/build/' + target + '/',
    filename: name + '.js',
    libraryTarget: 'umd'
  },
  module: {
    loaders: [
      {
        loader: 'babel-loader',
        include: [
          path.resolve(__dirname, 'src')
        ],
        test: /\.jsx?$/
      },
      {
        loader: 'json-loader',
        include: [
          __dirname
        ],
        test: /\.json$/
      }
    ],
    noParse: /node_modules\/json-schema\/lib\/validate\.js/
  },
  node: {
    fs: target === 'node' ? false : 'empty',
    request: target === 'node' ? false : 'empty',
    net: target === 'node' ? false : 'empty',
    tls: target === 'node' ? false : 'empty'
  }
}
module.exports = config
