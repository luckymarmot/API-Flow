import DynamicValueConverter from './DynamicValueConverter'

import Auth from '../../../models/Auth'

export default class Hawk extends DynamicValueConverter {
    convert(dv) {
        let id = this._extractValueFromDV(dv.id) || null
        let key = this._extractValueFromDV(dv.key) || null
        let algorithm = this._extractValueFromDV(dv.algorithm) || null

        return new Auth.Hawk({
            id: id,
            key: key,
            algorithm: algorithm
        })
    }
}
