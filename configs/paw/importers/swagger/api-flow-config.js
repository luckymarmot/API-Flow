import Environment from '../../../../src/environments/paw/Environment'

import SwaggerLoader from '../../../../src/loaders/swagger/Loader'

import SwaggerV2Parser from '../../../../src/parsers/swagger/v2.0/Parser'

import PawSerializer from '../../../../src/serializers/paw/Serializer'

export const loaders = [
  SwaggerLoader
]

export const parsers = [
  SwaggerV2Parser
]

export const serializers = [
  PawSerializer
]

export const source = {
  identifier: 'com.luckymarmot.PawExtensions.SwaggerImporter',
  title: 'SwaggerImporter',
  humanTitle: 'Swagger 2.0 Importer',
  format: SwaggerV2Parser.__meta__.format,
  version: SwaggerV2Parser.__meta__.version
}

export const environment = Environment
