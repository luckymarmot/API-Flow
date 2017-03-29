import Environment from '../../../../environments/paw/Environment'

import RAMLLoader from '../../../../loaders/raml/Loader'

import RAMLV1Parser from '../../../../parsers/raml/v1.0/Parser'

import PawSerializer from '../../../../serializers/paw/Serializer'

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
  format: RAMLV1Parser.__meta__.format,
  version: RAMLV1Parser.__meta__.version
}

export const environment = Environment
