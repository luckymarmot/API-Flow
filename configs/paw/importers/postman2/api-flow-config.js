import Environment from '../../../../src/environments/paw/Environment'

import PostmanCollectionV2Loader from '../../../../src/loaders/postman/v2.0/Loader'

import PostmanCollectionV2Parser from '../../../../src/parsers/postman/v2.0/Parser'

import PawSerializer from '../../../../src/serializers/paw/Serializer'

export const loaders = [
  PostmanCollectionV2Loader
]

export const parsers = [
  PostmanCollectionV2Parser
]

export const serializers = [
  PawSerializer
]

export const source = {
  identifier: 'com.luckymarmot.PawExtensions.PostmanCollectionV2Importer',
  title: 'PostmanCollectionV2Importer',
  humanTitle: 'Postman Collection v2.0 Importer',
  format: PostmanCollectionV2Parser.__meta__.format,
  version: PostmanCollectionV2Parser.__meta__.version
}

export const environment = Environment
