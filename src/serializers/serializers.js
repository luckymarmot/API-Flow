import { serializers } from 'api-flow-config'

const methods = {}

methods.extractVersion = (version) => {
  const vStripped = version[0] === 'v' ? version.slice(1) : version
  const [ major, minor, patch ] = vStripped.split('.')

  const strippedPatch = (patch || '0').split('-')[0]

  return {
    major: parseInt(major || '0', 10),
    minor: parseInt(minor || '0', 10),
    patch: parseInt(strippedPatch || '0', 10)
  }
}

methods.getNewestSerializerByFormat = (format) => {
  const newest = serializers
    .filter(serializer => serializer.format === format)
    .reduce((best, serializer) => {
      const bestVersion = methods.extractVersion(best.version)
      const formatVersion = methods.extractVersion(serializer.version)

      if (bestVersion.major < formatVersion.major) {
        return serializer
      }

      if (bestVersion.major > formatVersion.major) {
        return best
      }

      if (bestVersion.minor < formatVersion.minor) {
        return serializer
      }

      if (bestVersion.minor > formatVersion.minor) {
        return best
      }

      if (bestVersion.patch < formatVersion.patch) {
        return serializer
      }

      if (bestVersion.patch > formatVersion.patch) {
        return best
      }
    }, { version: 'v0.0.0' })[0]

  if (newest.serialize) {
    return newest
  }

  return null
}

methods.getSerializerByFormatAndVersion = ({ format, version }) => {
  return serializers.filter(serializer => {
    return serializer.__meta__.format === format && serializer.__meta__.version === version
  })[0] || null
}

export default methods
