import DynamicValueConverter from './DynamicValueConverter'

import JSONSchemaReference from '../../../models/references/JSONSchema'
import ExoticReference from '../../../models/references/Exotic'

export default class EnvironmentVariable extends DynamicValueConverter {
    convert(dv, ctx) {
        let id = dv.environmentVariable
        let variable = ctx.getEnvironmentVariableById(id)

        if (typeof variable === 'undefined' || variable === null) {
            return null
        }

        let name = variable.name
        let value = null
        let currentValue = variable.getCurrentValue(true)

        if (currentValue && currentValue.length === 1) {
            let component = currentValue.getComponentAtIndex(0)

            let jsfId =
                'com.luckymarmot.PawExtensions' +
                '.JSONSchemaFakerDynamicValue'
            if (component.type === jsfId) {
                return this._jsfConvert(name, component)
            }
        }

        if (
            !currentValue ||
            typeof currentValue.getEvaluatedString !== 'function'
        ) {
            value = null
        }
        else {
            value = currentValue.getEvaluatedString()
        }

        let uri = this._convertNameToFragment(name)
        return new ExoticReference({
            uri: uri,
            relative: uri,
            value: value,
            resolved: true
        })
    }

    _convertNameToFragment(name) {
        if (name.startsWith('#')) {
            return name
        }

        return '#/definitions/' + this._escapeURIFragment(name)
    }

    _escapeURIFragment(uriFragment) {
        return uriFragment.replace(/~/g, '~0').replace(/\//g, '~1')
    }

    _jsfConvert(name, component) {
        let uri = this._convertNameToFragment(name)
        let schema = JSON.parse(component.schema)
        let ref = new JSONSchemaReference({
            uri: uri,
            relative: uri,
            value: schema,
            resolved: true
        })

        let dependencies = ref._findRefs(component.schema)

        return ref.set('dependencies', dependencies)
    }
}
