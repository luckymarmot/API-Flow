import PostmanParserV1 from './v1/Parser'
import PostmanParserV2 from './v2/Parser'

export default class PostmanParser {
    static detect() {
        let scorev1 = PostmanParserV1.detect(...arguments)
        let scorev2 = PostmanParserV2.detect(...arguments)

        return scorev1.concat(scorev2)
    }

    static getAPIName() {
        let namev1 = PostmanParserV1.getAPIName(...arguments)
        let namev2 = PostmanParserV2.getAPIName(...arguments)

        if (namev1) {
            if (namev2) {
                return namev2.length > namev1.length ? namev2 : namev1
            }
            return namev1
        }

        return namev2 || null
    }

    constructor(_version) {
        let version = _version || 'v1'

        let versionMap = {
            1: PostmanParserV1,
            2: PostmanParserV2
        }

        let stripped = this._stripVersion(version)

        this._parser = new versionMap[stripped]()
    }

    detect() {
        return PostmanParser.detect(...arguments)
    }

    getAPIName() {
        return PostmanParser.getAPIName(...arguments)
    }

    parse(item) {
        return this._parser.parse(item)
    }

    _stripVersion(version) {
        return version.replace('v', '').split('.')[0]
    }
}
