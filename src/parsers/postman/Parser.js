import PostmanParserV1 from './v1/Parser'
import PostmanParserV2 from './v2/Parser'

export default class PostmanParser {
    constructor(version = 'v1') {
        let versionMap = {
            1: PostmanParserV1,
            2: PostmanParserV2
        }

        let stripped = this._stripVersion(version)

        if (versionMap[stripped]) {
            return new versionMap[stripped]()
        }
    }

    _stripVersion(version) {
        return version.replace('v', '').split('.')[0]
    }
}
