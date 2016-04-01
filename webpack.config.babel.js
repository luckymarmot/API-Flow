import webpack from 'webpack'
import path from 'path'

const name = 'api-flow'

const production = process.env.NODE_ENV === 'production'

const config = {
    target: 'node-webkit',
    entry: [
        './src/index.js'
    ],
    output: {
        path: path.join(__dirname, './lib/'),
        pathInfo: true,
        publicPath: '/lib/',
        filename: name + '.js'
    },
    plugins: [
        new webpack.optimize.AggressiveMergingPlugin(),
        new webpack.optimize.UglifyJsPlugin({
            minimize: true,
            mangle: {
                except: [ 'require', 'export', '$super' ]
            },
            compress: {
                warnings: false,
                sequences: true,
                dead_code: true,
                conditionals: true,
                booleans: true,
                unused: true,
                if_return: true,
                join_vars: true,
                drop_console: true
            }
        })
    ],
    module: {
        loaders: [
            {
                loader: 'babel-loader',
                include: [
                    path.resolve(__dirname, 'src')
                ],
                test: /\.jsx?$/
            }
        ]
    }
}
module.exports = config
