import DynamicValueConverter from './DynamicValueConverter'

import JSONSchemaReference from '../../../models/references/JSONSchema'

export default class JSONSchemaFaker extends DynamicValueConverter {
    convert(dv) {
        let schema

        try {
            schema = JSON.parse(dv.schema || '{}')
        }
        catch (e) {
            schema = {}
        }

        if (!schema.type) {
            let keys = Object.keys(schema).filter(key => {
                return [
                    'x-title', 'title', 'description', 'x-description'
                ].indexOf(key) < 0
            })

            if (keys.length === 0) {
                schema.default = [ '' ]
            }

            schema.type = 'string'
        }

        let ref = new JSONSchemaReference({
            value: schema,
            resolved: true
        })

        let dependencies = ref._findRefs(schema)

        return ref.set('dependencies', dependencies)
    }
}
