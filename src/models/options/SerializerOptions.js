import Immutable from 'immutable'

export default class SerializerOptions extends Immutable.Record({
    name: 'raml',
    instance: null
}) {
    constructor(opts) {
        let normalized = SerializerOptions.normalize(opts)
        super(normalized)
    }

    static normalize(_serializer) {
        let serializer = _serializer
        if (typeof serializer === 'string') {
            serializer = {
                name: serializer.toLowerCase()
            }
        }
        else if (!serializer || typeof serializer !== 'object') {
            serializer = {
                name: 'raml'
            }
        }
        else if (!serializer.name || typeof serializer.name !== 'string') {
            serializer.name = 'raml'
        }

        if (serializer.name !== 'custom') {
            serializer.instance = null
        }

        return serializer
    }
}
