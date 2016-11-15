import Immutable from 'immutable'

import Model from '../ModelInfo'

import ParserOptions from './ParserOptions'
import ResolverOptions from './ResolverOptions'
import SerializerOptions from './SerializerOptions'

export default class Options extends Immutable.Record({
    _model: new Model({
        name: 'options.options.models',
        version: '0.1.0'
    }),
    parser: new ParserOptions(),
    resolver: new ResolverOptions(),
    serializer: new SerializerOptions()
}) {
    constructor(opts) {
        let normalized = Options.normalize(opts)
        super(normalized)
    }

    static normalize(_opts) {
        let opts = _opts
        if (!opts || typeof opts !== 'object') {
            opts = {}
        }
        return {
            parser: new ParserOptions(opts.parser),
            resolver: new ResolverOptions(opts.resolver),
            serializer: new SerializerOptions(opts.serializer)
        }
    }
}
