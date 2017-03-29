import PostmanParserV1 from './v1/Parser'
import PostmanParserV2 from './v2/Parser'

export default class PostmanParser {
  static detect() {
    const scorev1 = PostmanParserV1.detect(...arguments)
    const scorev2 = PostmanParserV2.detect(...arguments)

    return scorev1.concat(scorev2)
  }

  static getAPIName() {
    const namev1 = PostmanParserV1.getAPIName(...arguments)
    const namev2 = PostmanParserV2.getAPIName(...arguments)

    if (namev1) {
      if (namev2) {
        return namev2.length > namev1.length ? namev2 : namev1
      }
      return namev1
    }

    return namev2 || null
  }

  constructor(_version) {
    const version = _version || 'v1'

    const versionMap = {
      '1': PostmanParserV1,
      '2': PostmanParserV2
    }

    const stripped = this._stripVersion(version)

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
