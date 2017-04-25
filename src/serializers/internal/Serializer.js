const __meta__ = {
  format: 'internal',
  version: 'v1.0'
}

const methods = {}

/**
 * A Serializer to dump Api Records as JSON objects
 */
export class InternalSerializer {
  static __meta__ = __meta__

  /**
   * dumps an Api Record
   * @param {Api} api: the api to convert
   * @returns {string} the corresponding dump object, as a string
   */
  static serialize(api) {
    return methods.serialize(api)
  }

  /**
   * returns a quality score for a content string wrt. to the intermediate model format.
   * @param {String} content: the content of the file to analyze
   * @returns {number} the quality of the content
   */
  static validate(content) {
    return methods.validate(content)
  }
}

methods.serialize = ({ api }) => {
  return JSON.stringify(api.toJS(), null, 2)
}

methods.validate = () => {}

export const __internals__ = methods
export default InternalSerializer
