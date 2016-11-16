import BaseSerializer from '../BaseSerializer'

import Group from '../../models/Group'
import JSONSchemaReference from '../../models/references/JSONSchema'

import Auth from '../../models/Auth'

import Base64 from '../../utils/Base64'

export default class PostmanSerializer extends BaseSerializer {
    constructor() {
        super()
        this.references = null
        this.usedReferences = []
    }

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
        this.references = context.get('references')

        let structure = {
            version: 1,
            collections: [
                this._formatCollection(context)
            ]
        }

        structure.environments = [ this._formatEnvironments() ]

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
        let headers = this._formatHeaders(parameters, request.get('auths'))
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
        return _param.generate()
    }

    _formatQueries(parameters) {
        let queries = parameters.get('queries')

        if (queries.size > 0) {
            return '?' + queries.map(this._formatQueryParam).join('&')
        }

        return ''
    }

    _formatQueryParam(param) {
        let key = param.get('key')
        let pair = null

        let validTypes = {
            string: true,
            number: true,
            integer: true,
            boolean: true
        }

        let type = param.get('type')
        let format = param.get('format')
        if (validTypes[type] && !(type === 'string' && format === 'sequence')) {
            let value = param.get('value')
            if (typeof value !== 'undefined' && value !== null) {
                pair = value
            }
            else {
                pair = param.generate()
            }
        }
        else {
            pair = '{{' + key + '}}'
        }

        return key + '=' + pair
    }

    _formatHeaders(parameters, auths) {
        let headers = parameters.get('headers')

        let toJoin = headers.map(header => {
            let generated = header.generate()
            return header.get('key') + ': ' + generated
        })

        toJoin = toJoin.concat(this._formatAuthHeader(auths))
        const formatted = toJoin.join('\n')

        return formatted
    }

    _formatAuthHeader(auths) {
        if (auths.size > 0) {
            let auth = auths.get(0)

            if (auth instanceof Auth.Basic) {
                return this._formatBasicAuthHeader(auth)
            }
            else if (auth instanceof Auth.Digest) {
                return this._formatDigestAuthHeader(auth)
            }
            else if (auth instanceof Auth.OAuth1) {
                return this._formatOAuth1AuthHeader(auth)
            }
            else if (auth instanceof Auth.AWSSig4) {
                return this._formatAWSSig4AuthHeader(auth)
            }
        }

        return []
    }

    _formatBasicAuthHeader(auth) {
        let authBlock = auth.get('username') + ':' + auth.get('password')
        let encoded = Base64.encode(authBlock)
        return [ 'Authorization: Basic ' + encoded ]
    }

    _formatDigestAuthHeader() {
        return [ 'Authorization: Digest' ]
    }

    _formatOAuth1AuthHeader(auth) {
        let oauth1Map = {
            consumer_key: auth.get('consumerKey') || '',
            oauth_signature_method: auth.get('algorithm') || '',
            oauth_version: '1.0'
        }

        let params = Object.keys(oauth1Map).map(key => {
            return key + '="' + oauth1Map[key] + '"'
        }).join(', ')

        return [ 'Authorization: OAuth ' + params ]
    }

    _formatAWSSig4AuthHeader() {
        return [ 'Authorization: AWS4-HMAC-SHA256' ]
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
                    let ref = _body.get('value')
                    if (this._isInlineRef(ref)) {
                        let schema = _body.getJSONSchema(false)
                        if (schema.type === 'string' && schema.default) {
                            data += _body.generate()
                        }
                        else {
                            data += JSON.stringify(
                                _body.getJSONSchema(false),
                                null,
                                '  '
                            )
                        }
                    }
                    else {
                        let rawName = ref.get('relative') ||
                            ref.get('uri') ||
                            _body.get('key') ||
                            'body'
                        let name = rawName.split('/').slice(-1)[0]
                        data += '{{' + name + '}}'
                        this.usedReferences.push(ref)
                    }
                }
                else {
                    data += _body.generate()
                }
            })
        }
        else {
            data = []
            params.forEach(body => {
                data.push(this._formatBodyParam(body))
            })
        }

        return [ dataMode, data ]
    }

    _isInlineRef(reference) {
        let uri = reference.get('uri')
        if (uri) {
            return this.references.valueSeq().filter(container => {
                return !!container.getIn([ 'cache', uri ])
            }).count() === 0
        }
        return true
    }

    _formatBodyParam(param) {
        let key = param.get('key')
        let pair = null

        let validTypes = {
            string: true,
            number: true,
            integer: true,
            boolean: true
        }

        let type = param.get('type')
        let format = param.get('format')
        if (validTypes[type] && !(type === 'string' && format === 'sequence')) {
            let value = param.get('value')
            if (typeof value !== 'undefined' && value !== null) {
                pair = value
            }
            else {
                pair = param.generate()
            }
        }
        else if (type === 'reference') {
            let ref = param.get('value')

            if (this._isInlineRef(ref)) {
                pair = param.generate()
            }
            else {
                let rawName = ref.get('relative') || ref.get('uri') || key
                pair = '{{' + rawName.split('/').slice(-1)[0] + '}}'
            }
        }
        else {
            pair = '{{' + key + '}}'
        }

        return {
            key: param.get('key'),
            value: pair,
            type: 'text',
            enabled: true
        }
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

    _formatEnvironments() {
        let environmentId = this._uuid()

        let values = this.usedReferences.map(ref => {
            let rawName = ref.get('relative') || ref.get('uri')
            let name = rawName.split('/').slice(-1)[0]

            let value = ref.get('value')
            if (typeof value !== 'string') {
                value = JSON.stringify(value)
            }

            let envVariable = {
                key: name,
                value: value,
                type: 'text',
                enabled: true
            }
            return envVariable
        })

        return {
            id: environmentId,
            name: 'API-Flow Imports',
            values: values,
            timestamp: Date.now()
        }
    }
}
