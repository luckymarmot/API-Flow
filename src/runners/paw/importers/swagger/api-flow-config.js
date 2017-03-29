import Environment from '../../../../environments/paw/Environment'

import SwaggerLoader from '../../../../loaders/swagger/Loader'

import SwaggerV2Parser from '../../../../parsers/swagger/v2.0/Parser'

import PawSerializer from '../../../../serializers/paw/Serializer'

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
  format: SwaggerV2Parser.__meta__.format,
  version: SwaggerV2Parser.__meta__.version
}

export const environment = Environment
