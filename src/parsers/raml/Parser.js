import RAMLParserV0_8 from './v0.8/Parser'
import RAMLParserV1_0 from './v1.0/Parser'

export default class RAMLParser {
    static detect() {
        const scorev0_8 = RAMLParserV0_8.detect(...arguments)
        const scorev1_0 = RAMLParserV1_0.detect(...arguments)

        return scorev0_8.concat(scorev1_0)
    }

    static getAPIName() {
        let namev0_8 = RAMLParserV0_8.getAPIName(...arguments)
        let namev1_0 = RAMLParserV1_0.getAPIName(...arguments)

        if (namev0_8) {
            if (namev1_0) {
                return namev1_0.length > namev0_8.length ? namev1_0 : namev0_8
            }
            return namev0_8
        }

        return namev1_0 || null
    }

    constructor(version = 'v0.8') {
        let versionMap = {
            'v0.8': RAMLParserV0_8,
            'v1.0': RAMLParserV1_0
        }

        if (versionMap[version]) {
            return new versionMap[version]()
        }
    }

    detect() {
        return RAMLParser.detect(...arguments)
    }

    getAPIName() {
        return RAMLParser.getAPIName(...arguments)
    }
}
