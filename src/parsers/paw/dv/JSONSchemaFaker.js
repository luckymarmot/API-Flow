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

        let ref = new JSONSchemaReference({
            value: schema,
            resolved: true
        })

        let dependencies = ref._findRefs(schema)

        return ref.set('dependencies', dependencies)
    }
}
