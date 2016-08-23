import Immutable from 'immutable'

import DynamicValueConverter from './DynamicValueConverter'
import Auth from '../../../models/Auth'

export default class OAuth2 extends DynamicValueConverter {
    convert(dv) {
        let grantType = this._extractValueFromDV(dv.grantType) || 0
        let authorizationURL = this
            ._extractValueFromDV(dv.authorizationURL || '') || null
        let accessTokenURL = this
            ._extractValueFromDV(dv.accessTokenURL || '') || null
        let scope = this._extractValueFromDV(dv.scope) || null

        let grantMap = {
            0: 'accessCode',
            1: 'implicit',
            2: 'application',
            3: 'password'
        }

        let scopes = []
        if (scope) {
            scopes = scope.split(/[;,\s]/).filter(d => {
                return d !== ''
            }).map(d => {
                return d.trim()
            })
        }

        return new Auth.OAuth2({
            flow: grantMap[grantType] || null,
            authorizationUrl: authorizationURL,
            tokenUrl: accessTokenURL,
            scopes: new Immutable.List(scopes)
        })
    }
}
