import BaseImporter from '../base-importer/BaseImporter'

import RequestContext, {
    Group
} from '../../immutables/RequestContext'

import PostmanParser from '../../importers/postman/Parser'

@registerImporter // eslint-disable-line
export default class PostmanImporter extends BaseImporter {
    static identifier = 'com.luckymarmot.PawExtensions.PostmanImporter';
    static title = 'Postman Importer';

    static fileExtensions = [];
    static inputs = [];

    constructor() {
        super()
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
        let postman
        try {
            postman = JSON.parse(item.content)
        }
        catch (jsonParseError) {
            return 0
        }
        if (postman) {
            let score = 0
            score += postman.collections ? 1 / 2 : 0
            score += postman.environments ? 1 / 2 : 0
            score += postman.id && postman.name && postman.timestamp ? 1 / 2 : 0
            score += postman.requests ? 1 / 2 : 0
            score += postman.values ? 1 / 2 : 0
            score = score < 1 ? score : 1
            return score
        }
        return 0
    }

    /*
      @params:
        - context
        - items
        - options
    */
    createRequestContexts(context, items) {
        const parser = new PostmanParser()
        let currentReqContext = new RequestContext({
            group: new Group({
                name: 'Postman'
            })
        })

        for (let item of items) {
            let reqContext = parser.parse(item.content)

            currentReqContext = currentReqContext
                .mergeEnvironments(reqContext.get('environments'))

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
            items: [ items ]
        }

        return [ current ]
    }
}
