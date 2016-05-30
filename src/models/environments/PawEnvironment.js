import Environment from './Environment'

export class FileResolver {
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
