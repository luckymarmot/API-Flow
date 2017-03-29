import { registerImporter } from '../../../mocks/PawShims'

import BaseImporter from '../../../serializers/paw/Serializer'

import PostmanV1Importer from './v1/Importer'
import PostmanV2Importer from './v2/Importer'

@registerImporter // eslint-disable-line
export default class PostmanImporter extends BaseImporter {
  static identifier = 'com.luckymarmot.PawExtensions.PostmanImporter';
  static title = 'Postman Importer';

  constructor() {
    super()
    this.ENVIRONMENT_DOMAIN_NAME = 'Postman'
    this.versions = {
      v1: new PostmanV1Importer(),
      v2: new PostmanV2Importer()
    }
  }

  canImport(context, items) {
    const versions = Object.keys(this.versions)
    const _score = versions.reduce((score, version) => {
      const versionScore = this.versions[version].canImport(context, items)
      const newScore = Math.max(score, versionScore)
      return newScore
    }, 0)
    return _score
  }

    /*
      @params:
        - context
        - items
        - options
    */
  createRequestContexts(context, items) {
    const best = {
      score: -1,
      version: null
    }

    const versions = Object.keys(this.versions)
    versions.forEach(version => {
      const score = this.versions[version].canImport(context, items)
      if (score >= best.score) {
        best.score = score
        best.version = version
      }
    })

    const importer = this.versions[best.version]
    return importer.createRequestContexts(context, items)
  }
}
