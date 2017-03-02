import Environment from '../../environments/node/Environment'

import SwaggerLoader from '../../loaders/swagger/Loader'
import RAMLLoader from '../../loaders/raml/Loader'

import SwaggerV2Parser from '../../parsers/swagger/v2.0/Parser'
import RAMLV1Parser from '../../parsers/raml/v1.0/Parser'

import SwaggerV2Serializer from '../../serializers/swagger/v2.0/Serializer'

export const loaders = [
  SwaggerLoader,
  RAMLLoader
]

export const parsers = [
  SwaggerV2Parser,
  RAMLV1Parser
]

export const serializers = [
  SwaggerV2Serializer
]

export const environment = Environment
