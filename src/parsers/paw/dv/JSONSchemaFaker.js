import DynamicValueConverter from './DynamicValueConverter'

import JSONSchemaReference from '../../../models/references/JSONSchema'

export default class JSONSchemaFaker extends DynamicValueConverter {
    convert(dv) {
        let schema = dv.schema
        let ref = new JSONSchemaReference({
            value: schema,
            resolved: true
        })

        let dependencies = ref._findRefs(schema)

        return ref.set('dependencies', dependencies)
    }
}
