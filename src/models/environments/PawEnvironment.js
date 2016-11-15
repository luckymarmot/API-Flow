import Environment from './Environment'
import Model from '../ModelInfo'

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
            return reject(new Error('resolver not implemented for ' + uri))
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
