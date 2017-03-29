import Environment from '../../../../environments/paw/Environment'

import PawLoader from '../../../../loaders/paw/Loader'

import PawParser from '../../../../parsers/paw/Parser'

import PostmanV2Serializer from '../../../../serializers/postman/v2.0/Serializer'

export const loaders = [
  PawLoader
]

export const parsers = [
  PawParser
]

export const serializers = [
  PostmanV2Serializer
]

export const target = {
  identifier: 'com.luckymarmot.PawExtensions.PostmanCollectionGenerator',
  title: 'PostmanCollectionGenerator',
  humanTitle: 'Postman Collection v2.0',
  format: PostmanV2Serializer.__meta__.format,
  version: PostmanV2Serializer.__meta__.version
}

export const environment = Environment
