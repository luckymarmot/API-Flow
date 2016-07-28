import BaseSerializer from '../BaseSerializer'

import Group from '../../models/Group'
import JSONSchemaReference from '../../models/references/JSONSchema'

export default class PostmanSerializer extends BaseSerializer {
    serialize(context) {
        let structure = this._formatStructure(context)

        return JSON.stringify(structure, null, '\t')
    }

    validate(text) {
        try {
            let postman = JSON.parse(text)
            if (
                postman.collections.length === 0 &&
                postman.environments.length === 0
            ) {
                return 'generated file of poor quality'
            }
        }
        catch (e) {
            return e
        }
    }

    _formatStructure(context) {
        let structure = {
            version: 1,
            collections: [
                this._formatCollection(context)
            ],
            environments: []
        }

        return structure
    }

    _formatCollection(context) {
        let uuid = this._uuid()
        let name = this._formatCollectionName(context)

        let requests = this._formatRequests(context, uuid)
        let order = this._formatOrder(requests)

        let collection = {
            id: uuid,
            name: name,
            requests: requests,
            order: order
        }

        return collection
    }

    _uuid() {
        let d = new Date().getTime()
        let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
            .replace(/[xy]/g, c => {
                let r = (d + Math.random() * 16) % 16 | 0
                d = Math.floor(d / 16)
                return (c === 'x' ? r : r & 0x3 | 0x8).toString(16)
            })
        return uuid
    }

    _formatCollectionName(context) {
        let group = context.get('group')
        if (group === null) {
            return 'API-Flow imports'
        }
        else {
            let name = group.get('name')
            let children = group.get('children')

            if (name === null) {
                children.forEach(child => {
                    if (child instanceof Group) {
                        if (child.get('name') !== null) {
                            name = child.get('name')
                        }
                    }
                })
            }

            if (name === null) {
                return 'API-Flow imports'
            }

            return name
        }
    }

    _formatRequests(context, collectionId) {
        let reqs = []
        let requests = context.getRequests()

        requests.forEach(request => {
            let formatted = this._formatRequest(request, collectionId)
            reqs.push(formatted)
        })

        return reqs
    }

    _formatRequest(request, collectionId) {
        let name = request.get('name')
        let description = request.get('description')
        let method = request.get('method').toUpperCase()

        let url = request.get('url')
        let origin = url.origin()
        let path = this._formatSequenceParam(url.get('pathname'))

        let parameters = request.get('parameters')
        let queries = this._formatQueries(parameters)
        let headers = this._formatHeaders(parameters)
        let bodies = request.get('bodies')
        let [ dataMode, data ] = this._formatBody(parameters, bodies)

        let req = {
            id: this._uuid(),
            url: origin + path + queries,
            method: method,
            collectionId: collectionId,
            name: name || origin + path,
            description: description || '',
            headers: headers,
            dataMode: dataMode,
            data: data
        }

        return req
    }

    _formatSequenceParam(_param) {
        if (_param.get('format') !== 'sequence') {
            return _param.generate()
        }

        let schema = _param.getJSONSchema()

        if (!schema['x-sequence']) {
            return _param.generate()
        }

        for (let sub of schema['x-sequence']) {
            if (sub['x-title']) {
                sub.enum = [ '{{' + sub['x-title'] + '}}' ]
            }
        }

        let generated = _param.generate(false, schema)
        return generated
    }

    _formatQueries(parameters) {
        let queries = parameters.get('queries')

        let formatted = '?'

        queries.forEach(query => {
            formatted +=
                query.get('key') +
                '={{' + query.get('key') + '}}' +
                '&'
        })

        return formatted.slice(0, -1)
    }

    _formatHeaders(parameters) {
        let headers = parameters.get('headers')

        let formatted = ''
        headers.forEach(header => {
            let generated = header.generate()
            formatted = header.get('key') + ': ' + generated + '\n'
        })

        return formatted
    }

    _formatBody(parameters, bodies) {
        let params = parameters.get('body')

        let dataMode = 'params'

        if (bodies.size > 0) {
            let body = bodies.get(0)
            params = body.filter(parameters).get('body')
            let contentType = this._extractContentTypeFromBody(body)

            if (contentType === 'application/x-www-form-urlencoded') {
                dataMode = 'urlencoded'
            }
            else if (contentType === 'multipart/form-data') {
                dataMode = 'params'
            }
            else {
                dataMode = 'raw'
            }
        }

        let data
        if (dataMode === 'raw') {
            data = ''
            params.forEach(_body => {
                if (_body.get('value') instanceof JSONSchemaReference) {
                    data += JSON.stringify(
                        _body.getJSONSchema(false),
                        null,
                        '  '
                    )
                }
                else {
                    data += _body.generate()
                }
            })
        }
        else {
            data = []
            params.forEach(body => {
                data.push({
                    key: body.get('key'),
                    value: '{{' + body.get('key') + '}}',
                    type: body.get('type'),
                    enabled: true
                })
            })
        }

        return [ dataMode, data ]
    }

    _extractContentTypeFromBody(body) {
        let constraints = body.get('constraints')
        let contentType = null
        constraints.forEach(param => {
            if (param.get('key') === 'Content-Type') {
                contentType = param.get('value')
            }
        })

        return contentType
    }

    _formatOrder(requests) {
        let order = requests.map(req => {
            return req.id
        })

        return order
    }
}
