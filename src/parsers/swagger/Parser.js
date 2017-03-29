import SwaggerParserV2 from './v2.0/Parser'

export default class SwaggerParser {
  static detect() {
    const scorev2 = SwaggerParserV2.detect(...arguments)

    return scorev2
  }

  static getAPIName() {
    const namev2 = SwaggerParserV2.getAPIName(...arguments)

    return namev2
  }

  constructor(_version) {
    const version = _version || 'v2.0'
    const versionMap = {
      'v2.0': SwaggerParserV2
    }

    if (versionMap[version]) {
      this._parser = new versionMap[version]()
    }
  }

  detect() {
    return SwaggerParser.detect()
  }

  parse(item) {
    return this._parser.parse(item)
  }
}
