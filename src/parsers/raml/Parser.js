import RAMLParserV0_8 from './v0.8/Parser'

export default class RAMLParser {
    static detect() {
        let scorev0_8 = RAMLParserV0_8.detect(...arguments)

        return scorev0_8
    }

    static getAPIName() {
        let namev0_8 = RAMLParserV0_8.getAPIName(...arguments)

        return namev0_8
    }

    constructor(version = 'v0.8') {
        let versionMap = {
            'v0.8': RAMLParserV0_8
        }

        if (versionMap[version]) {
            return new versionMap[version]()
        }
    }

    detect() {
        return RAMLParser.detect(...arguments)
    }
}
