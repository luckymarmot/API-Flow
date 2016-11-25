import DynamicValueConverter from './DynamicValueConverter'

import JSONSchemaReference from '../../../models/references/JSONSchema'

export default class EnvironmentVariable extends DynamicValueConverter {
    convert(dv, ctx) {
        const variable = this._getVariableFromContext(dv, ctx)

        if (typeof variable === 'undefined' || variable === null) {
            return null
        }

        const uri = this._getUri(variable)
        const schema = this._getSchema(variable)
        const reference = this._createJSONSchemaReference(uri, schema)

        return reference
    }

    _getVariableFromContext(dv, ctx) {
        const id = dv.environmentVariable
        const variable = ctx.getEnvironmentVariableById(id)
        return variable
    }

    _getSchema(variable) {
        const jsfId =
                'com.luckymarmot.PawExtensions' +
                '.JSONSchemaFakerDynamicValue'

        const currentValue = variable.getCurrentValue(true)

        let component = {}
        if (
            currentValue &&
            currentValue.length === 1 &&
            typeof currentValue.getComponentAtIndex === 'function'
        ) {
            component = currentValue.getComponentAtIndex(0) || {}
        }

        let value = null
        if (
            currentValue &&
            currentValue.length === 1 &&
            component.type === jsfId
        ) {
            value = JSON.parse(component.schema)
        }
        else if (
            currentValue &&
            typeof currentValue.getEvaluatedString === 'function'
        ) {
            value = {
                type: 'string',
                default: currentValue.getEvaluatedString()
            }
        }

        return value
    }

    _getUri(variable) {
        const name = variable.name
        const uri = this._convertNameToFragment(name)

        return uri
    }

    _createJSONSchemaReference(uri, schema) {
        let ref = new JSONSchemaReference({
            uri: uri,
            relative: uri,
            value: schema,
            resolved: true
        })

        let dependencies = ref._findRefs(schema)

        return ref.set('dependencies', dependencies)
    }

    _convertNameToFragment(name) {
        if (name.indexOf('#') === 0) {
            return name
        }

        return '#/definitions/' + this._escapeURIFragment(name)
    }

    _escapeURIFragment(uriFragment) {
        return uriFragment.replace(/~/g, '~0').replace(/\//g, '~1')
    }
}
