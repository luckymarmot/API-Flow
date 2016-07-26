import path from 'path'

const name = 'RAMLImporter'

const production = process.env.NODE_ENV === 'production' // eslint-disable-line

const config = {
    target: 'web',
    entry: [
        path.join(
            __dirname,
            './Importer.js'
        )
    ],
    output: {
        path: path.join(
            __dirname,
            './build/com.luckymarmot.PawExtensions.RAMLImporter'
        ),
        pathInfo: true,
        publicPath: '/build/',
        filename: name + '.js'
    },
    module: {
        loaders: [
            {
                loader: 'babel-loader',
                include: [
                    path.resolve(
                        __dirname,
                        '../../../../',
                        'src'
                    )
                ],
                test: /\.jsx?$/
            },
            {
                loader: 'json-loader',
                include: [
                    path.resolve(
                        __dirname,
                        '../../../../',
                        'node_modules/swagger-schema-official'
                    )
                ],
                test: /\.json$/
            }
        ]
    },
    node: {
        fs: 'empty'
    }
}
module.exports = config
