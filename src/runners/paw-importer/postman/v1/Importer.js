import
    BaseImporter
from '../../../../serializers/paw/Serializer'

import Context from '../../../../models/Core'
import Group from '../../../../models/Group'

import PostmanParser from '../../../../parsers/postman/v1/Parser'

export default class PostmanImporter extends BaseImporter {
  static fileExtensions = [];
  static inputs = [];

  constructor() {
    super()
    this.parser = new PostmanParser()
    this.ENVIRONMENT_DOMAIN_NAME = 'Postman Environments'
  }

  canImport(context, items) {
    let sum = 0
    for (const item of items) {
      sum += ::this._canImportItem(context, item)
    }
    return items.length > 0 ? sum / items.length : 0
  }

  _canImportItem(context, item) {
    return this.parser.detect(item.content)[0].score
  }

    /*
      @params:
        - context
        - items
        - options
    */
  createRequestContexts(context, items) {
    const parser = this.parser
    let currentReqContext = new Context({
      group: new Group({
        name: 'Postman'
      })
    })

    for (const item of items) {
      let reqContext = null
      try {
        reqContext = parser.parse(item)
      }
      catch (e) {
                /* eslint-disable no-console */
        console.error('@parser error', e, JSON.stringify(e), e.stack)
                /* eslint-enable no-console */
        throw e
      }
      let references = currentReqContext.get('references')
      references = references.mergeDeep(reqContext.get('references'))
      currentReqContext = currentReqContext.set('references', references)
      if (reqContext.getIn([ 'group', 'children' ]).size > 0) {
        const groupName = reqContext.getIn([ 'group', 'name' ])
        const fileName = ((item || {}).file || {}).name
        const url = (item || {}).url

        const name = groupName || fileName || url || null

        currentReqContext = currentReqContext.setIn(
                    [ 'group', 'children', name ],
                    reqContext.get('group')
                )
      }
    }

    const current = {
      context: currentReqContext,
      items: items
    }

    return [ current ]
  }
}
