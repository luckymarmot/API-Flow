import { parsers } from 'api-flow-config'

const methods = {}

methods.getParsersByFormat = (format) => {
  return parsers.filter(parser => parser.format === format)
}

methods.getParserByFormatAndVersion = ({ format, version }) => {
  const match = parsers.filter(parser => {
    return parser.__meta__.format === format && parser.__meta__.version === version
  })[0] || null
  return match
}

methods.getParsers = () => {
  return parsers
}


export const getParsersByFormat = methods.getParsersByFormat
export const getParserByFormatAndVersion = methods.getParserByFormatAndVersion
export const getParsers = methods.getParsers

export default methods
