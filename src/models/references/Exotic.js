import Reference from './Reference'

import Model from '../ModelInfo'

export default class ExoticReference extends Reference {
    constructor(obj = {}) {
        obj._model = new Model({
            name: 'exotic.references.models',
            version: '0.1.0'
        })

        super(obj)
    }

    resolve() {
        return this
            .set('resolved', true)
    }

    evaluate() {
        return this
    }

    getDataUri() {
        return null
    }
}
