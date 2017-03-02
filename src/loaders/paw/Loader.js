const methods = {}

const __meta__ = {
  extensions: [],
  parsable: true,
  format: 'paw'
}

export class PawLoader {
  static extensions = __meta__.extensions
  static parsable = __meta__.parsable
  static format = __meta__.format

  static load({ options, uri }) {
    return methods.load({ options, uri })
  }

  static isParsable({ content }) {
    return methods.isParsable(content)
  }
}

methods.isParsable = () => false
methods.load = ({ options }) => ({ options })
