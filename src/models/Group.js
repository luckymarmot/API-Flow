import Immutable from 'immutable'
import Request from './Request'

export default class Group extends Immutable.Record({
    id: null,
    name: null,
    children: Immutable.OrderedMap()
}) {
    getRequests() {
        let children = this.get('children')

        let reqs = new Immutable.List()

        children.forEach(child => {
            if (child instanceof Request) {
                reqs = reqs.push(child)
            }
            else {
                reqs = reqs.concat(child.getRequests())
            }
        })

        return reqs
    }

    mergeWithGroup(group) {
        let child = this.getIn([ 'children', group.get('name') ])
        if (child) {
            child = child.mergeDeep(group)
        }
        else {
            child = group
        }
        return this.setIn([ 'children', group.get('name') ], child)
    }
}
