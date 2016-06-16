import Immutable from 'immutable'

import { registerCodeGenerator } from '../../mocks/PawShims'

import DynamicValueManager from './dv/DVManager'

import Context, {
    Parameter,
    ParameterContainer
} from '../../models/Core'

import URL from '../../models/URL'
import Request from '../../models/Request'
import Constraint from '../../models/Constraint'
import Group from '../../models/Group'
import Auth from '../../models/Auth'
import Reference from '../../models/references/Reference'
import ReferenceContainer from '../../models/references/Container'

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

    constructor() {
        this.references = new Immutable.List()
    }

    generate(ctx, reqs, opts) {
        let group = this._parseGroup(ctx, reqs, opts)
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
        if (!reqs) {
            return null
        }

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

            if (id === 'null') {
                id = keys[1]
            }

            let group = groupMap[id]
            delete groupMap[id]

            let _group = ctx.getRequestGroupById(id)

            let gid = (_group.parent || {}).id || null
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

        let [ headers, auths ] = this._formatHeaders(
            req.getHeaders(true), contentType, new Immutable.List()
        )

        let queries = this._formatQueries(
            req.getUrlParams(true)
        )

        let auth = this._formatAuth(req)
        if (auth) {
            auths = auths.push(auth)
        }

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
            auths: auths
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

    _formatReferenceParam(_key, ref) {
        let key = _key
        if (!key) {
            key = this._unescapeURIFragment(
                ref.get('uri').split('/').slice(-1)[0]
            )
        }

        let param = new Parameter({
            key: key,
            name: key,
            value: ref,
            type: 'reference'
        })

        return param
    }

    _unescapeURIFragment(uriFragment) {
        return uriFragment.replace(/~1/g, '/').replace(/~0/g, '~')
    }

    _formatHeaderParam(key, ds, _auths) {
        let param = null
        let auths = _auths

        let manager = new DynamicValueManager()

        if (ds.length > 1) {
            let value = new Immutable.List()
            for (let component of ds.components) {
                let [ _param, auth ] = this
                    ._formatHeaderComponent(null, component, manager)

                if (_param) {
                    value = value.push(_param)
                }

                if (auth) {
                    auths = auths.push(auth)
                }
            }

            param = new Parameter({
                key: key,
                name: key,
                type: 'string',
                format: 'sequence',
                value: value
            })
        }
        else {
            let [ _param, auth ] = this
                ._formatHeaderComponent(
                    key, ds.getComponentAtIndex(0) || '', manager
                )

            if (_param) {
                param = _param
            }

            if (auth) {
                auths = auths.push(auth)
            }
        }

        return [ param, auths ]
    }

    _formatHeaderComponent(key, component, manager) {
        let param = null
        let auth = null

        let val = manager.convert(component)

        if (typeof component === 'string') {
            param = this._formatParam(key, component)
        }
        else if (
            val instanceof Auth.Digest ||
            val instanceof Auth.AWSSig4 ||
            val instanceof Auth.Hawk
        ) {
            auth = val
        }
        else if (val instanceof Reference) {
            param = this._formatReferenceParam(key, val)
            this.references = this.references.push(val)
        }
        else {
            param = this._formatParam(key, component.getEvaluatedString())
        }

        return [ param, auth ]
    }

    _formatHeaders(headers, contentType, _auths) {
        let auths = _auths
        let keys = Object.keys(headers)

        let params = []
        for (let key of keys) {
            let header = this._formatHeaderParam(
                key, headers[key], auths
            )

            let param = header[0]
            if (param) {
                params.push(param)
            }

            auths = header[1]
        }

        if (!headers['Content-Type'] && contentType) {
            let param = this._formatParam('Content-Type', contentType)
            params.push(param)
        }

        return [ new Immutable.List(params), auths ]
    }

    _formatQueryParam(key, ds) {
        let param = null
        let manager = new DynamicValueManager()

        if (ds.length > 1) {
            let value = new Immutable.List()
            for (let component of ds.components) {
                let _param = this._formatQueryComponent(
                    null, component, manager
                )
                value = value.push(_param)
            }

            param = new Parameter({
                key: key,
                name: key,
                type: 'string',
                format: 'sequence',
                value: value
            })
        }
        else {
            let _param = this._formatQueryComponent(
                key, ds.getComponentAtIndex(1) || '', manager
            )
            param = _param
        }

        return param
    }

    _formatQueryComponent(key, component, manager) {
        let param = null

        let val = manager.convert(component)

        if (typeof component === 'string') {
            param = this._formatParam(key, component)
        }
        else if (val instanceof Reference) {
            param = this._formatReferenceParam(key, val)
            this.references = this.references.push(val)
        }
        else {
            param = this._formatParam(key, component.getEvaluatedString())
        }

        return param
    }

    _formatQueries(queries) {
        let keys = Object.keys(queries)

        let params = []
        for (let key of keys) {
            let query = this._formatQueryParam(key, queries[key])
            params.push(query)
        }

        return new Immutable.List(params)
    }

    _formatPlainBody(content) {
        let param = this._formatParam('body', content.getEvaluatedString())
        return [ param, 'text/plain' ]
    }

    _formatBody(req) {
        let params = []
        let contentType

        let body = req.getBody(true)
        let urlEncoded = req.getUrlEncodedBody(true)
        let formData = req.getMultipartBody(true)

        if (body.length === 1) {
            if (
                urlEncoded !== null
            ) {
                contentType = 'application/x-www-form-urlencoded'
                let keys = Object.keys(urlEncoded)
                for (let key of keys) {
                    let param = this._formatQueryParam(key, urlEncoded[key])
                    params.push(param)
                }
            }
            else if (
                formData !== null
            ) {
                contentType = 'multipart/form-data'

                let keys = Object.keys(formData)
                for (let key of keys) {
                    let param = this._formatQueryParam(key, formData[key])
                    params.push(param)
                }
            }
        }

        if (params.length === 0) {
            let [ param, cType ] = this._formatPlainBody(body)
            params.push(param)
            contentType = cType
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
        let references = this.references
        let container = new ReferenceContainer()

        container = container.create(references)

        return new Immutable.OrderedMap({
            paw: container
        })
    }

    _parseInfo() {
        return new Info()
    }
}
