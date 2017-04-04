import Environment from '../../src/environments/web/Environment'

import SwaggerLoader from '../../src/loaders/swagger/Loader'
import RAMLLoader from '../../src/loaders/raml/Loader'

import SwaggerV2Parser from '../../src/parsers/swagger/v2.0/Parser'
import RAMLV1Parser from '../../src/parsers/raml/v1.0/Parser'

import SwaggerV2Serializer from '../../src/serializers/swagger/v2.0/Serializer'
import RAMLV1Serializer from '../../src/serializers/raml/v1.0/Serializer'
import InternalSerializer from '../../src/serializers/internal/Serializer'

export const loaders = [
  SwaggerLoader,
  RAMLLoader
]

export const parsers = [
  SwaggerV2Parser,
  RAMLV1Parser
]

export const serializers = [
  SwaggerV2Serializer,
  RAMLV1Serializer,
  InternalSerializer
]

export const environment = Environment
