import Immutable from 'immutable'

import Model from '../ModelInfo'

export default class SerializerOptions extends Immutable.Record({
    _model: new Model({
        name: 'serializer.options.models',
        version: '0.1.0'
    }),
    name: 'swagger',
    instance: null
}) {
    constructor(opts) {
        let normalized = SerializerOptions.normalize(opts)
        super(normalized)
    }

    static normalize(_serializer) {
        let serializer = _serializer

        let _set = (obj, k, v) => {
            obj[k] = v
            return obj
        }

        if (serializer && typeof serializer.set === 'function') {
            _set = (obj, k, v) => {
                return obj.set(k, v)
            }
        }

        if (typeof serializer === 'string') {
            serializer = {
                name: serializer.toLowerCase()
            }
        }
        else if (!serializer || typeof serializer !== 'object') {
            serializer = {
                name: 'swagger'
            }
        }
        else if (!serializer.name || typeof serializer.name !== 'string') {
            serializer = _set(serializer, 'name', 'swagger')
        }

        if (serializer.name !== 'custom') {
            serializer = _set(serializer, 'instance', null)
        }

        return serializer
    }
}
