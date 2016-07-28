import DynamicValueConverter from './DynamicValueConverter'

import Auth from '../../../models/Auth'

export default class DigestAuth extends DynamicValueConverter {
    convert(dv) {
        let username = this._extractValueFromDV(dv.username) || null
        let password = this._extractValueFromDV(dv.password) || null

        return new Auth.Digest({
            username: username,
            password: password
        })
    }
}
