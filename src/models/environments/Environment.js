import Immutable from 'immutable'
import Model from '../ModelInfo'

export default class Environment extends Immutable.Record({
    _model: new Model({
        name: 'environment.environments.models',
        version: '0.1.0'
    }),
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
