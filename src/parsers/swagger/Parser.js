import SwaggerParserV2 from './v2.0/Parser'

export default class SwaggerParser {
    static detect() {
        let scorev2 = SwaggerParserV2.detect(...arguments)

        return scorev2
    }
    constructor(version = 'v2.0') {
        let versionMap = {
            'v2.0': SwaggerParserV2
        }

        if (versionMap[version]) {
            return new versionMap[version]()
        }
    }

    detect() {
        return SwaggerParser.detect()
    }
}
