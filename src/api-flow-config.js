import Environment from './environments/node/Environment'

import SwaggerLoader from './loaders/swagger/Loader'
import RAMLLoader from './loaders/raml/Loader'
import InternalLoader from './loaders/internal/Loader'

import SwaggerV2Parser from './parsers/swagger/v2.0/Parser'
import RAMLV1Parser from './parsers/raml/v1.0/Parser'
import InternalParser from './parsers/internal/Parser'

import SwaggerV2Serializer from './serializers/swagger/v2.0/Serializer'
import RAMLV1Serializer from './serializers/raml/v1.0/Serializer'
import InternalSerializer from './serializers/internal/Serializer'

export const loaders = [
  SwaggerLoader,
  RAMLLoader,
  InternalLoader
]

export const parsers = [
  SwaggerV2Parser,
  RAMLV1Parser,
  InternalParser
]

export const serializers = [
  SwaggerV2Serializer,
  RAMLV1Serializer,
  InternalSerializer
]

export const environment = Environment
