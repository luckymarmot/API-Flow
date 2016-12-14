import BaseSerializer from '../BaseSerializer'

import { version } from '../../../package.json'

import JSONSchemaReference from '../../models/references/JSONSchema'
import ExoticReference from '../../models/references/Exotic'

import Auth from '../../models/Auth'

import Base64 from '../../utils/Base64'

export default class InsomniaSerializer extends BaseSerializer {
    constructor() {
        super()
        this.usedReferences = null
        this.idCounts = null
    }

    serialize(context) {
        this._reset()

        let structure = this._formatStructure(context)

        return JSON.stringify(structure, null, '\t')
    }

    validate(text) {
        try {
            let insomnia = JSON.parse(text)
            if (
                insomnia.__export_format !== 3 &&
                insomnia._type !== 'export' && !insomnia.resources
            ) {
                return 'generated file of poor quality'
            }
        }
        catch (e) {
            return e
        }
    }

    _reset() {
        this.usedReferences = []
        this.idCounts = {}
    }

    _formatStructure(context) {
        let requests = context.get('requests').valueSeq()
        let references = context.get('references')

        let resources = [
            ...this._formatReferences(references),
            ...this._formatRequests(requests)
        ]

        let content = {
            _type: 'export',
            __export_format: 3,
            __export_source: `API-Flow:${version}`,
            resources: resources
        }

        return content
    }

    _formatReferences() {
        // TODO: This
        return []
    }

    _formatRequests(context, parentId = '__WORKSPACE_ID__') {
        let requests = context.get('requests')

        if (!requests) {
            return []
        }

        let reqs = []
        requests.valueSeq().forEach(cRequest => {
            reqs.push(this._formatRequest(cRequest, parentId))
        })

        return reqs
    }

    _formatRequest(request, parentId) {
        let name = request.get('name')
        let description = request.get('description')

        let method = (request.get('method') || 'GET').toUpperCase()

        let url = request.get('url')
        let origin = url.origin()
        let path = this._formatSequenceParam(url.get('pathname'))

        let parameters = request.get('parameters')
        let queryParams = this._formatQueries(parameters)
        let auths = request.get('auths')
        let headers = this._formatHeaders(parameters, auths)
        let bodies = request.get('bodies')
        let body = this._formatBodyParameters(parameters, bodies)

        return {
            _id: this._nextId('request'),
            _type: 'request',
            parentId: parentId,
            parameters: queryParams,
            method: method,
            name: name || origin + path,
            description: description || '',
            url: origin + path,
            headers: headers,
            body: body
        }
    }

    _formatSequenceParam() {
        // TODO: This
        return ''
    }

    _formatHeaders(parameters, auths) {
        let headers = []
        parameters.get('headers').forEach(header => {
            headers.push(this._formatHeader(header))
        })

        let authHeader = this._formatAuthHeader(auths)
        if (authHeader) {
            headers.push(authHeader)
        }

        return headers
    }

    _formatHeader(header) {
        let generated = header.generate()
        return {
            name: header.get('key'),
            value: generated,
            disabled: false
        }
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

        return null
    }

    _formatBasicAuthHeader(auth) {
        let authBlock = `${auth.get('username')}:${auth.get('password')}`
        let encoded = Base64.encode(authBlock)
        return {
            name: 'Authorization',
            value: `Basic ${encoded}`,
            disabled: false
        }
    }

    _formatDigestAuthHeader() {
        return {
            name: 'Authorization',
            value: 'Digest',
            disabled: false
        }
    }

    _formatOAuth1AuthHeader(auth) {
        let oauth1Map = {
            consumer_key: auth.get('consumerKey') || '',
            oauth_signature_method: auth.get('algorithm') || '',
            oauth_version: '1.0'
        }

        let params = Object.keys(oauth1Map).map(key => {
            return `${key}="${oauth1Map[key]}"`
        }).join(', ')

        return {
            name: 'Authorization',
            value: `OAuth ${params}`,
            disabled: false
        }
    }

    _formatAWSSig4AuthHeader() {
        return {
            name: 'Authorization',
            value: 'AWS4-HMAC-SHA256',
            disabled: false
        }
    }

    _formatBodyParameters(parameters, bodies) {
        let params = parameters.get('body')

        if (bodies.size > 0) {
            let body = bodies.get(0)
            params = body.filter(parameters).get('body')
            let contentType = this._extractContentTypeFromBody(body)

            if (contentType === 'application/x-www-form-urlencoded') {
                return this._formatBodyFormUrlEncoded(params)
            }
            else if (contentType === 'multipart/form-data') {
                return this._formatBodyFormData(params)
            }
        }

        return this._formatBodyGeneric(params)
    }

    _formatBodyFormUrlEncoded(params) {
        return {
            mimeType: 'application/x-www-form-urlencoded',
            // TODO: Populate params
            params: [
                // TODO
                // {   name: '',
                //     value: '',
                //     disabled: false }
            ]
        }
    }

    _formatBodyFormData(params) {
        let body = {
            mimeType: 'multipart/form-data',
            params: [
                // TODO: Populate params
                // {   type: '', // file | text
                //     name: '',
                //     value: '',
                //     fileName: '',
                //     disabled: false }
            ]
        }

        return body
    }

    _formatBodyFile(params, mimeType) {
        return {
            mimeType: mimeType || '',
            // TODO: Populate "fileName" field
            fileName: ''
        }
    }

    _formatBodyGeneric(params, mimeType) {
        return {
            mimeType: mimeType || '',
            // TODO: Populate "text" field
            text: ''
        }
    }

    _formatQueries(parameters) {
        let queries = parameters.get('queries')
        return queries.map(p => this._formatQueryParam(p))
    }

    _formatQueryParam(param) {
        let pair = {
            name: param.get('key') || '',
            value: ''
        }

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
                pair.value = value
            }
            else {
                pair.value = param.generate()
            }
        }
        else if (pair.name) {
            pair.value = `{{ ${pair.name} }}`
        }

        return pair
    }

    _nextId(type) {
        if (!this.idCounts[type]) {
            this.idCounts[type] = 1
        }
        else {
            this.idCounts[type] += 1
        }

        let count = this.idCounts[type]
        switch (type) {
            case 'workspace':
                return `__WRK_${count}__`
            case 'environment':
                return `__ENV_${count}__`
            case 'cookie_jar':
                return `__JAR_${count}__`
            case 'request_group':
                return `__GRP_${count}__`
            case 'request':
                return `__REQ_${count}__`
            default:
                return `__???_${count}__`
        }
    }
}
