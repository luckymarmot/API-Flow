import
    BaseImporter
from '../../../../serializers/paw/Serializer'

import Context from '../../../../models/Core'
import Group from '../../../../models/Group'

import PostmanParser from '../../../../parsers/postman/v2/Parser'

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
        for (let item of items) {
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
        const parser = new PostmanParser()
        let currentReqContext = new Context({
            group: new Group({
                name: 'Postman'
            })
        })

        for (let item of items) {
            let reqContext = parser.parse(item)

            let references = currentReqContext.get('references')
            references = references.mergeDeep(reqContext.get('references'))

            currentReqContext = currentReqContext.set('references', references)

            if (reqContext.getIn([ 'group', 'children' ]).size > 0) {
                let groupName = reqContext.getIn([ 'group', 'name' ])
                let fileName = ((item || {}).file || {}).name
                let url = (item || {}).url

                let name = groupName || fileName || url || null

                currentReqContext = currentReqContext.setIn(
                    [ 'group', 'children', name ],
                    reqContext.get('group')
                )
            }
        }

        let current = {
            context: currentReqContext,
            items: items
        }

        return [ current ]
    }
}
