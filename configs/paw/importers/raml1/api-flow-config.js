import Environment from '../../../../src/environments/paw/Environment'

import RAMLLoader from '../../../../src/loaders/raml/Loader'

import RAMLV1Parser from '../../../../src/parsers/raml/v1.0/Parser'

import PawSerializer from '../../../../src/serializers/paw/Serializer'

export const loaders = [
  RAMLLoader
]

export const parsers = [
  RAMLV1Parser
]

export const serializers = [
  PawSerializer
]

export const source = {
  identifier: 'com.luckymarmot.PawExtensions.RAML1Importer',
  title: 'RAML1Importer',
  humanTitle: 'RAML 1.0 Importer',
  format: RAMLV1Parser.__meta__.format,
  version: RAMLV1Parser.__meta__.version
}

export const environment = Environment
