import Immutable from 'immutable'

export default class ParserOptions extends Immutable.Record({
    name: 'swagger',
    version: null,
    instance: null,
    isDefault: true
}) {
    constructor(opts) {
        let normalized = ParserOptions.normalize(opts)
        super(normalized)
    }

    static normalize(_parser) {
        let parser = _parser

        if (typeof parser === 'string') {
            parser = {
                name: parser.toLowerCase()
            }
            parser.isDefault = false
        }
        else if (!parser || typeof parser !== 'object') {
            parser = {
                name: 'swagger'
            }
        }
        else if (!parser.name || typeof parser.name !== 'string') {
            parser.name = 'swagger'

            if (typeof parser.version !== 'string') {
                parser.version = null
            }
        }
        else if (typeof parser.set === 'function') {
            parser = parser.set('isDefault', false)
        }
        else {
            parser.isDefault = false
        }

        if (parser.name !== 'custom') {
            if (typeof parser.set === 'function') {
                parser = parser.set('instance', null)
            }
            else {
                parser.instance = null
            }
        }

        return parser
    }
}
