import Immutable from 'immutable'

export class ReferenceCache extends Immutable.Record({
    cached: null,
    resolved: new Immutable.OrderedMap(),
    final: null
}) {
    isBaseResolved() {
        return this.getIn([ 'cached', 'resolved' ])
    }

    resolve(references, depth = 0) {
        if (!this.isBaseResolved()) {
            return this
        }

        let final = this.get('final')
        if (final !== null && depth > final) {
            return this
        }

        if (this.hasIn([ 'resolved', depth ])) {
            return this
        }
        let cache
        if (!this.hasIn([ 'resolved', -1 ])) {
            cache = this.setIn([ 'resolved', -1 ], this.get('cached'))
        }

        let closest = this.get('resolved').keys().reduce((_closest, key) => {
            if (key < depth && _closest < key) {
                return key
            }
            return _closest
        }, -1)

        let resolved = this
            .getIn([ 'resolved', closest ])
            .evaluate(references, depth - (closest + 1))

        cache = cache.setIn([ 'resolved', depth ], resolved)
        return cache
    }

    getReference(depth = 0) {
        if (!this.isBaseResolved()) {
            return this.get('cached')
        }
        let final = this.get('final')
        if (final !== 0 && depth > final) {
            return this.getIn([ 'resolved', final ])
        }
        return this.getIn([ 'resolved', depth ])
    }
}

export default class ReferenceContainer extends Immutable.Record({
    cache: new Immutable.OrderedMap()
}) {
    create(references) {
        let cache = this.get('cache')
        cache = references.reduce((container, reference) => {
            let uri = reference.get('uri')

            if (container.get('uri')) {
                return container
            }

            let cached = new ReferenceCache({
                value: reference
            })

            return container.set(uri, cached)
        }, cache)

        return this.set('cache', cache)
    }

    update(reference) {
        let uri = reference.get('uri')
        let cache = new ReferenceCache({
            value: reference
        })

        return this.setIn([ 'cache', uri ], cache)
    }

    resolve(uri, depth = 0) {
        let cache = this.getIn([ 'cache', uri ])
        if (!cache) {
            return null
        }
        return cache.resolve(this, depth).getReference(depth)
    }

    findUnresolvedReferences() {
        let unresolved = new Immutable.List()
        this.get('cache').forEach((cache, uri) => {
            if (!cache.isBaseResolved()) {
                unresolved = unresolved.push(uri)
            }
        })
        return unresolved
    }
}
