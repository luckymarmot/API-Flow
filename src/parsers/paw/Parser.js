import Immutable from 'immutable'

import registerCodeGenerator from '../../mocks/PawShims'

import Context, {
    Parameter,
    ParameterContainer
} from '../../models/Core'

import Constraint from '../../models/Constraint'
import Group from '../../models/Group'
import Auth from '../../models/Auth'

import {
    Info
} from '../../models/Utils'

@registerCodeGenerator
export default class PawParser {
    static identifier =
        'com.luckymarmot.PawExtensions.API-Flow'
    static title = 'Api-Flow'
    static help =
        'https://github.com/luckymarmot/API-Flow'
    static languageHighlighter = null
    static fileExtension = null

    generate(ctx, reqs, opts) {
        let group = this._parseGroups(ctx, reqs, opts)
        let references = this._parseDomains(ctx, reqs, opts)
        let info = this._parseInfo(ctx, reqs, opts)

        let context = new Context({
            group: group,
            references: references,
            info: info
        })

        return context
    }

    _parseGroup(ctx, reqs, opts) {
        let groupMap = {}
        reqs.forEach(req => {
            let request = this._parseRequest(ctx, req, opts)
            let gid = (req.parent || {}).id || null
            if (!groupMap[gid]) {
                let name = (req.parent || {}).name || null
                groupMap[gid] = new Group({
                    id: gid,
                    name: name
                })
            }

            groupMap[gid] = groupMap[gid]
                .setIn([ 'children', req.id ], request)
        })

        let keys = Object.keys(groupMap)
        while (keys.length > 1) {
            let id = keys[0]
            let group = groupMap[id]
            delete groupMap[id]

            let _group = ctx.getRequestGroupById(id)

            let gid = (_group.parent || {}).id
            if (!groupMap[gid]) {
                let name = (_group.parent || {}).name || null
                groupMap[gid] = new Group({
                    id: gid,
                    name: name
                })
            }

            groupMap[gid] = groupMap[gid]
                .setIn([ 'children', _group.id ], group)

            keys = Object.keys(groupMap)
        }

        let id = keys[0]

        return groupMap[id] || null
    }

    _parseRequest(ctx, req) {
        let id = req.id || null
        let name = req.name || null
        let url = req.getUrlBase(false) || 'localhost'
        let method = req.method || 'get'
        let description = req.description || null
        let [ body, contentType ] = this._formatBody(req)
        let headers = this._formatHeaders(req.headers, contentType)
        let queries = this._formatQueries(req.urlParams)
        let auth = this._formatAuth(req)

        let request = new Request({
            id: id,
            name: name,
            url: new URL(url),
            method: method,
            description: description,
            parameters: new ParameterContainer({
                headers: headers,
                queries: queries,
                body: body
            }),
            auths: new Immutable.List([
                auth
            ])
        })

        return request
    }

    _formatParam(key, value) {
        let param = new Parameter({
            key: key,
            name: key,
            value: value,
            type: 'string',
            internals: new Immutable.List([
                new Constraint.Enum([ value ])
            ])
        })

        return param
    }

    _formatHeaders(headers, contentType) {
        let keys = Object.keys(headers)

        let params = []
        for (let key of keys) {
            let param = this._formatParam(key, headers[key])
            params.push(param)
        }

        if (!headers['Content-Type']) {
            let param = this._formatParam('Content-Type', contentType)
            params.push(param)
        }

        return new Immutable.List(params)
    }

    _formatQueries(queries) {
        let keys = Object.keys(queries)

        let params = []
        for (let key of keys) {
            let param = this._formatParam(key, queries[key])
            params.push(param)
        }

        return new Immutable.List(params)
    }

    _formatBody(req) {
        let plain = req.body
        let jsonBody = req.jsonBody
        let urlEncoded = req.urlEncodedBody
        let formData = req.multipartBody

        let params = []
        let contentType
        if (plain) {
            contentType = 'text/plain'
            let param = this._formatParam('body', plain)
            params.push(param)
        }

        if (jsonBody) {
            contentType = 'application/json'
            let param = this._formatParam('body', JSON.stringify(jsonBody))
            params.push(param)
        }

        if (urlEncoded) {
            contentType = 'application/x-www-form-urlencoded'

            let keys = Object.keys(urlEncoded)
            for (let key of keys) {
                let param = this._formatParam(key, urlEncoded[key])
                params.push(param)
            }
        }

        if (formData) {
            contentType = 'multipart/form-data'

            let keys = Object.keys(formData)
            for (let key of keys) {
                let param = this._formatParam(key, formData[key])
                params.push(param)
            }
        }

        return [ new Immutable.List(params), contentType ]
    }

    _formatAuth(req) {
        let basic = req.getHttpBasicAuth(false)
        let oauth1 = req.getOAuth1(false)
        let oauth2 = req.getOAuth2(false)

        let auths = []
        if (basic) {
            let auth = new Auth.Basic({
                username: basic.username || null,
                password: basic.password || null
            })
            auths.push(auth)
        }

        if (oauth1) {
            let auth = new Auth.OAuth1({
                callback: oauth1.callback || null,
                consumerKey: oauth1.consumerKey || null,
                consumerSecret: oauth1.consumerSecret || null,
                tokenSecret: oauth1.tokenSecret || null,
                algorithm: oauth1.algorithm || null,
                nonce: oauth1.nonce || null,
                additionalParameters: oauth1.additionalParameters || null,
                timestamp: oauth1.timestamp || null,
                token: oauth1.token || null
            })
            auths.push(auth)
        }

        if (oauth2) {
            let grantMap = {
                0: 'accessCode',
                1: 'implicit',
                2: 'application',
                3: 'password'
            }
            let scopes = (oauth2.scope || '').split(' ')

            if (scopes.length === 1 && scopes[0] === '') {
                scopes = null
            }

            let auth = new Auth.OAuth2({
                flow: grantMap[oauth2.grantType] || null,
                authorizationUrl: oauth2.authorizationUrl || null,
                tokenUrl: oauth2.tokenUrl || null,
                scopes: scopes
            })
            auths.push(auth)
        }

        return new Immutable.List(auths)
    }

    _parseDomains() {
        return new Immutable.OrderedMap()
    }

    _parseInfo() {
        return new Info()
    }
}
