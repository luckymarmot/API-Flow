import AWSSig4 from './AWSSig4'
import DigestAuth from './DigestAuth'
import EnvironmentVariable from './EnvironmentVariable'
import Hawk from './Hawk'
import JSONSchemaFaker from './JSONSchemaFaker'

export default class DynamicValueManager {
    convert(dvOrString) {
        let dv

        if (typeof dvOrString === 'string') {
            return dvOrString
        }
        else {
            dv = dvOrString
        }

        let identifier = dv.identifier

        let identifierMap = {
            'com.luckymarmot.PawExtensions.JSONSchemaFakerDynamicValue':
                this._convertJSF,
            'com.luckymarmot.EnvironmentVariableDynamicValue':
                this._convertEnvironmentVariable,
            'uk.co.jalada.PawExtensions.HawkDynamicValue':
                this._convertHawk,
            'com.shigeoka.PawExtensions.AWSSignature4DynamicValue':
                this._convertAWSSig4,
            'com.luckymarmot.PawExtensions.DigestAuthDynamicValue':
                this._convertDigestAuth
        }

        if (identifierMap[identifier]) {
            return identifierMap[identifier](dv)
        }

        return dv.getEvaluatedString()
    }

    _convertJSF(dv) {
        let jsf = new JSONSchemaFaker(dv)
        return jsf.dv
    }

    _convertDigestAuth(dv) {
        let digest = new DigestAuth(dv)
        return digest.dv
    }

    _convertEnvironmentVariable(dv) {
        let ev = new EnvironmentVariable(dv)
        return ev.dv
    }

    _convertHawk(dv) {
        let hawk = new Hawk(dv)
        return hawk.dv
    }

    _convertAWSSig4(dv) {
        let aws = new AWSSig4(dv)
        return aws.dv
    }
}
