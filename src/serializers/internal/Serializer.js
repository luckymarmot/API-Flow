const __meta__ = {
  format: 'internal',
  version: 'v1.0'
}

const methods = {}

export class InternalSerializer {
  static __meta__ = __meta__

  static serialize(api) {
    return methods.serialize(api)
  }

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
