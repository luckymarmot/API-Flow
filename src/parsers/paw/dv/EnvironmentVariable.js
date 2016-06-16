import DynamicValueConverter from './DynamicValueConverter'

import JSONSchemaReference from '../../../models/references/JSONSchema'
import ExoticReference from '../../../models/references/Exotic'

export default class EnvironmentVariable extends DynamicValueConverter {
    convert(dv, ctx) {
        let id = dv.environmentVariable
        let variable = ctx.getEnvironmentVariableById(id)
        let name = variable.name
        let currentValue = variable.getCurrentValue()

        if (currentValue.components.length === 1) {
            let component = currentValue.components[0]

            let jsfId =
                'com.luckymarmot.PawExtensions' +
                '.JSONSchemaFakerDynamicValue'
            if (component.identifier === jsfId) {
                return this._jsfConvert(name, component)
            }
        }

        let uri = this._convertNameToFragment(name)
        return new ExoticReference({
            uri: uri,
            relative: uri,
            value: currentValue.getEvaluatedString(),
            resolved: true
        })
    }

    _convertNameToFragment(name) {
        if (name.startsWith('#')) {
            return name
        }

        return '#/paw/' + this._escapeURIFragment(name)
    }

    _escapeURIFragment(uriFragment) {
        return uriFragment.replace(/~/g, '~0').replace(/\//g, '~1')
    }

    _jsfConvert(name, component) {
        let uri = this._convertNameToFragment(name)
        let ref = new JSONSchemaReference({
            uri: uri,
            relative: uri,
            value: component.schema,
            resolved: true
        })

        let dependencies = ref._findRefs(component.schema)

        return ref.set('dependencies', dependencies)
    }
}
