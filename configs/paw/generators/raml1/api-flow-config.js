import Environment from '../../../../src/environments/paw/Environment'

import PawLoader from '../../../../src/loaders/paw/Loader'

import PawParser from '../../../../src/parsers/paw/Parser'

import RAMLV1Serializer from '../../../../src/serializers/raml/v1.0/Serializer'

export const loaders = [
  PawLoader
]

export const parsers = [
  PawParser
]

export const serializers = [
  RAMLV1Serializer
]

export const target = {
  identifier: 'com.luckymarmot.PawExtensions.RAML1Generator',
  title: 'RAML1Generator',
  humanTitle: 'RAML 1.0',
  format: RAMLV1Serializer.__meta__.format,
  version: RAMLV1Serializer.__meta__.version
}

export const environment = Environment
