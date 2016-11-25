import AWSSig4 from './AWSSig4'
import DigestAuth from './DigestAuth'
import EnvironmentVariable from './EnvironmentVariable'
import Hawk from './Hawk'
import JSONSchemaFaker from './JSONSchemaFaker'
import OAuth2 from './OAuth2'

export default class DynamicValueManager {
    constructor(ctx) {
        this.ctx = ctx
    }

    convert(dvOrString) {
        let dv

        if (typeof dvOrString === 'string') {
            return dvOrString
        }
        else {
            dv = dvOrString
        }

        let identifier = dv.type

        let identifierMap = {
            'com.luckymarmot.PawExtensions.JSONSchemaFakerDynamicValue':
                ::this._convertJSF,
            'com.luckymarmot.EnvironmentVariableDynamicValue':
                ::this._convertEnvironmentVariable,
            'uk.co.jalada.PawExtensions.HawkDynamicValue':
                ::this._convertHawk,
            'com.shigeoka.PawExtensions.AWSSignature4DynamicValue':
                ::this._convertAWSSig4,
            'com.luckymarmot.PawExtensions.DigestAuthDynamicValue':
                ::this._convertDigestAuth,
            'com.luckymarmot.OAuth2DynamicValue':
                ::this._convertOAuth2
        }

        if (identifierMap[identifier]) {
            return identifierMap[identifier](dv, this.ctx)
        }

        return dv.getEvaluatedString()
    }

    _convertJSF(dv) {
        let jsf = new JSONSchemaFaker()
        return jsf.convert(dv)
    }

    _convertDigestAuth(dv) {
        let digest = new DigestAuth()
        return digest.convert(dv)
    }

    _convertEnvironmentVariable(dv, ctx) {
        let ev = new EnvironmentVariable()
        return ev.convert(dv, ctx)
    }

    _convertHawk(dv) {
        let hawk = new Hawk()
        return hawk.convert(dv)
    }

    _convertAWSSig4(dv) {
        let aws = new AWSSig4()
        return aws.convert(dv)
    }

    _convertOAuth2(dv) {
        let oauth2 = new OAuth2()
        return oauth2.convert(dv)
    }
}
