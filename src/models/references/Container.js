import Immutable from 'immutable'

import ReferenceCache from './Cache'

export default class ReferenceContainer extends Immutable.Record({
    cache: new Immutable.OrderedMap()
}) {
    create(references) {
        let cache = this.get('cache')
        cache = references.reduce((container, reference) => {
            let uri = reference.get('uri')

            if (container.get(uri)) {
                return container
            }

            let cached = new ReferenceCache({
                cached: reference
            })

            return container.set(uri, cached)
        }, cache)

        return this.set('cache', cache)
    }

    update(reference) {
        let uri = reference.get('uri')
        let cache = new ReferenceCache({
            cached: reference
        })

        return this.setIn([ 'cache', uri ], cache)
    }

    resolve(uri, depth = 0) {
        console.log('in container.resolve')
        let cache = this.getIn([ 'cache', uri ])
        if (!cache) {
            return null
        }
        console.log('got a valid cache', cache)
        return cache.resolve(this, depth).getReference(depth)
    }

    getUnresolvedReferences() {
        let unresolved = new Immutable.List()
        this.get('cache').forEach((cache, uri) => {
            if (!cache.isBaseResolved()) {
                unresolved = unresolved.push(uri)
            }
        })
        return unresolved
    }
}
