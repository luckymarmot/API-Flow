import Environment from '../../../../environments/paw/Environment'

import PawLoader from '../../../../loaders/paw/Loader'

import PawParser from '../../../../parsers/paw/Parser'

import SwaggerV2Serializer from '../../../../serializers/swagger/v2.0/Serializer'

export const loaders = [
  PawLoader
]

export const parsers = [
  PawParser
]

export const serializers = [
  SwaggerV2Serializer
]

export const target = {
  identifier: 'com.luckymarmot.PawExtensions.SwaggerGenerator',
  title: 'SwaggerGenerator',
  humanTitle: 'Swagger v2.0',
  format: SwaggerV2Serializer.__meta__.format,
  version: SwaggerV2Serializer.__meta__.version
}

export const environment = Environment
