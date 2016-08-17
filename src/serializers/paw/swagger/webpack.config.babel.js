import path from 'path'
import Importer from './Importer'

if (!Importer.identifier) {
    let msg = 'Importer requires an identifier like: ' +
        'com.luckymarmot.PawExtensions.MySuperImporter'
    throw new Error(msg)
}

const name = Importer.identifier.split('.').slice(-1)
const folder = __dirname.match(/([^/]+)$/)[1]

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
            '../../../../',
            './dist/paw/importers/' + folder + '/' +
            Importer.identifier
        ),
        pathInfo: true,
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
    }
}
module.exports = config
