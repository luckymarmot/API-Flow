import Immutable from 'immutable'

export default class Environment extends Immutable.Record({
    type: null,
    cache: Immutable.OrderedMap()
}) {
    /*
        @params:
            - reference
    */
    getResolver() {
        let msg = 'Environment is an abstract class - ' +
            'getURLResolver must be implemented by class that extends it'
        throw new Error(msg)
    }

    addURLResolver() {
        let msg = 'Environment is an abstract class - ' +
            'getURLResolver must be implemented by class that extends it'
        throw new Error(msg)
    }

    addURLResolver() {
        let msg = 'Environment is an abstract class - ' +
            'getURLResolver must be implemented by class that extends it'
        throw new Error(msg)
    }
}
