import Immutable from 'immutable'

export default class ReferenceCache extends Immutable.Record({
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
        else {
            // In this context, cache is clearer than _this
            /* eslint-disable consistent-this */
            cache = this
            /* eslint-enable consistent-this */
        }

        let closest = cache.get('resolved').keySeq().reduce((_closest, key) => {
            if (key < depth && _closest < key) {
                return key
            }
            return _closest
        }, -1)

        if (typeof closest === 'undefined') {
            closest = -1
        }

        console.log('closest', closest)
        let resolved = cache
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
