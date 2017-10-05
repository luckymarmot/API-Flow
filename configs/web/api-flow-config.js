import Environment from '../../src/environments/web/Environment'

import SwaggerLoader from '../../src/loaders/swagger/Loader'
import RAMLLoader from '../../src/loaders/raml/Loader'
import PostmanV2Loader from '../../src/loaders/postman/v2.0/Loader'

import SwaggerV2Parser from '../../src/parsers/swagger/v2.0/Parser'
import RAMLV1Parser from '../../src/parsers/raml/v1.0/Parser'
import PostmanV2Parser from '../../src/loaders/postman/v2.0/Parser'

import SwaggerV2Serializer from '../../src/serializers/swagger/v2.0/Serializer'
import RAMLV1Serializer from '../../src/serializers/raml/v1.0/Serializer'
import PostmanV2Serializer from '../../src/serializers/postman/v2.0/Serializer'
import InternalSerializer from '../../src/serializers/internal/Serializer'

export const loaders = [
  SwaggerLoader,
  RAMLLoader,
  PostmanV2Loader
]

export const parsers = [
  SwaggerV2Parser,
  RAMLV1Parser,
  PostmanV2Parser
]

export const serializers = [
  SwaggerV2Serializer,
  RAMLV1Serializer,
  InternalSerializer,
  PostmanV2Serializer
]

export const environment = Environment
