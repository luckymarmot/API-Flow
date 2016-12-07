import Environment from './Environment'
import Model from '../ModelInfo'
import { NetworkHTTPRequest } from '../../mocks/PawShims'

export class FileResolver {
    static _model = new Model({
        name: 'file-resolver.paw.environments.models',
        version: '0.1.0'
    })
    constructor(item) {
        this.item = item
    }

    resolve(uri) {
        return new Promise((resolve, reject) => {
            return reject(new Error('resolver not implemented for ' + uri))
        })
    }
}

export class URLResolver {
    static _model = new Model({
        name: 'url-resolver.paw.environments.models',
        version: '0.1.0'
    })
    constructor(item) {
        this.item = item
    }

    resolve(uri) {
        return new Promise((resolve, reject) => {
            if (uri === '') {
                return resolve(this.item.content)
            }
            else {
                let url = new URL(uri, this.item.get('url')).href()
                let request = new NetworkHTTPRequest()
                request.requestUrl = url
                request.requestMethod = 'GET'
                request.requestTimeout = 20 * 1000
                const status = request.send()

                if (status && request.responseStatusCode < 300) {
                    resolve(request.responseBody)
                }
                else {
                    const msg = 'Failed to fetch ' +
                        uri + '. Got code: ' +
                        request.responseStatusCode
                    reject(new Error(msg))
                }
            }
        })
    }
}


export default class PawEnvironment extends Environment {
    constructor(context) {
        super({
            _model: new Model({
                name: 'paw.environments.models',
                version: '0.1.0'
            }),
            type: 'paw'
        })
        this.context = context
        return this
    }

    getResolver(item) {
        return this.getIn([ 'cache', item.getPath() ]) || null
    }

    addResolver(item, type) {
        if (this.getIn([ 'cache', item.getPath() ])) {
            return this
        }

        let resolver
        if (type === 'url') {
            resolver = new URLResolver(item)
        }
        else {
            resolver = new FileResolver(item)
        }
        return this.setIn([ 'cache', item.getPath() ], resolver)
    }
}
