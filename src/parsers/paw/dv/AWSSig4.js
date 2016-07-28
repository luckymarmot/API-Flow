import DynamicValueConverter from './DynamicValueConverter'

import Auth from '../../../models/Auth'

export default class AWSSig4 extends DynamicValueConverter {
    convert(dv) {
        let key = this._extractValueFromDV(dv.key) || null
        let secret = this._extractValueFromDV(dv.secret) || null
        let region = this._extractValueFromDV(dv.region) || null
        let service = this._extractValueFromDV(dv.service) || null

        return new Auth.AWSSig4({
            key: key,
            secret: secret,
            region: region,
            service: service
        })
    }
}
