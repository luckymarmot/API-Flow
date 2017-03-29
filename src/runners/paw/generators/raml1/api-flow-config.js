import Environment from '../../../../environments/paw/Environment'

import PawLoader from '../../../../loaders/paw/Loader'

import PawParser from '../../../../parsers/paw/Parser'

import RAMLV1Serializer from '../../../../serializers/raml/v1.0/Serializer'

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
  humanTitle: 'RAML v1.0',
  format: RAMLV1Serializer.__meta__.format,
  version: RAMLV1Serializer.__meta__.version
}

export const environment = Environment
