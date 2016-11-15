import Immutable from 'immutable'

import Model from '../ModelInfo'
import ReferenceCache from './Cache'

export default class ReferenceContainer extends Immutable.Record({
    _model: new Model({
        name: 'reference-container.references.models',
        version: '0.1.0'
    }),
    id: null,
    name: null,
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
        let cache = this.getIn([ 'cache', uri ])

        if (!cache) {
            return null
        }
        let resolved = cache.resolve(this, depth).getReference(depth)

        return resolved
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
