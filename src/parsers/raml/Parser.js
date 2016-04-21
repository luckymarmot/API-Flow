import Immutable from 'immutable'
import RAML from 'raml-parser'

import RequestContext, {
    Group,
    Request,
    KeyValue,
    Schema,
    Response
} from '../../models/RequestContext'

import Auth from '../../models/Auth'

import ShimmingFileReader from './FileReader'

export default class RAMLParser {
    constructor(items) {
        this.reader = new ShimmingFileReader(items)
        this.context = new RequestContext()
    }

    // @tested
    parse(string, location) {
        return RAML.load(string, location, {
            reader: this.reader
        }).then(raml => {
            if (raml) {
                let context = this._createContext(raml)
                return context
            }
            return
        }, error => {
            throw new Error(error)
        })
    }

    // @tested
    _createContext(raml) {
        let context = new RequestContext()

        let group = this._createGroupTree(
            raml,
            raml,
            raml.title || null,
            raml.baseUri
        )

        if (group) {
            context = context.set('group', group)
        }
        return context
    }

    // @tested
    _createGroupTree(baseTree, tree, baseName, url) {
        let _url = url
        // ignore the first group name
        _url += tree.relativeUri || ''

        let group
        if (tree.resources || tree.methods) {
            group = new Group({
                name: tree.displayName || tree.relativeUri || baseName
            })
        }

        for (let path of tree.resources || []) {
            let child = this._createGroupTree(baseTree, path, '', _url)
            if (child) {
                group = group.setIn(
                    [ 'children', path.relativeUri ],
                    child
                )
            }
        }

        (tree.methods || []).forEach(
            data => {
                group = group.setIn(
                    [ 'children', data.method ],
                    this._createRequest(baseTree, data, _url, data.method)
                )
            }
        )

        if (group && group.get('children').size > 0) {
            return group
        }

        return null
    }

    // @tested
    _createRequest(raml, req, url, method) {
        let headers = this._extractHeaders(raml, req)
        let queries = this._extractQueries(raml, req)
        let auth = this._extractAuth(raml, req)
        let [ bodyType, body ] = this._extractBody(raml, req)
        let responses = this._extractResponses(raml, req)

        let request = new Request({
            url: url,
            method: method,
            name: url,
            description: req.description || null,
            headers: headers,
            queries: queries,
            bodyType: bodyType,
            body: body,
            auth: auth,
            responses: responses
        })
        return request
    }

    // @tested
    _extractHeaders(raml, req) {
        let headers = {}

        for (let header in req.headers || {}) {
            if (req.headers.hasOwnProperty(header)) {
                let description = req.headers[header].displayName || ''
                if (description && req.headers[header].description) {
                    description += ' -- '
                }
                description += req.headers[header].description || ''

                let value
                if (typeof req.headers[header].default === 'undefined') {
                    value = null
                }
                else {
                    value = req.headers[header].default
                }

                headers[header] = new KeyValue({
                    key: header,
                    value: value,
                    valueType: req.headers[header].type,
                    description: description

                })
            }
        }

        headers = new Immutable.OrderedMap(headers)
        return headers
    }

    // @tested
    _extractQueries(raml, req) {
        let queries = []
        for (let param in req.queryParameters || {}) {
            if (req.queryParameters.hasOwnProperty(param)) {
                let description = req.queryParameters[param].displayName || ''
                if (description && req.queryParameters[param].description) {
                    description += ' -- '
                }
                description += req.queryParameters[param].description || ''

                let value
                if (typeof req.queryParameters[param].default === 'undefined') {
                    value = null
                }
                else {
                    value = req.queryParameters[param].default
                }

                queries.push(new KeyValue({
                    key: param,
                    value: value,
                    valueType: req.queryParameters[param].type,
                    description: description
                }))
            }
        }

        queries = new Immutable.List(queries)
        return queries
    }

    // @tested
    _extractAuth(raml, req) {
        let auths = new Immutable.List()
        if (!req.securedBy) {
            return auths
        }

        for (let secured of req.securedBy) {
            if (secured === null) {
                auths = auths.push(null)
            }
            let securedName
            let params
            if (typeof secured === 'string' || secured === null) {
                securedName = secured
                params = {}
            }
            else {
                securedName = Object.keys(secured)[0]
                params = secured[securedName]
            }

            for (let scheme of raml.securitySchemes || []) {
                if (Object.keys(scheme)[0] === securedName) {
                    let security = scheme[Object.keys(scheme)[0]]

                    let securityMap = {
                        'OAuth 2.0': this._extractOAuth2Auth,
                        'OAuth 1.0': this._extractOAuth1Auth,
                        'Basic Authentication': this._extractBasicAuth,
                        'Digest Authentication': this._extractDigestAuth
                    }

                    let rule = securityMap[security.type]
                    if (rule) {
                        auths = auths.push(rule(raml, security, params))
                    }
                }
            }
        }
        return auths
    }

    // @tested 50%
    _extractOAuth2Auth(raml, security, params) {
        let flowMap = {
            code: 'accessCode',
            token: 'implicit',
            owner: 'application',
            credentials: 'password'
        }
        let _params = params || {}
        let auth = new Auth.OAuth2({
            flow:
                flowMap[(_params.authorizationGrants || [])[0]] ||
                flowMap[security.settings.authorizationGrants[0]] ||
                null,
            authorizationUrl:
                _params.authorizationUri ||
                security.settings.authorizationUri ||
                null,
            tokenUrl:
                _params.accessTokenUri ||
                security.settings.accessTokenUri ||
                null,
            scopes:
                new Immutable.List(
                    _params.scopes ||
                    security.settings.scopes || null
                )
        })

        return auth
    }

    // @tested 40%
    _extractOAuth1Auth(raml, security, params) {
        let _params = params || {}
        let auth = new Auth.OAuth1({
            authorizationUri:
                _params.authorizationUri ||
                security.settings.authorizationUri ||
                null,
            tokenCredentialsUri:
                _params.tokenCredentialsUri ||
                security.settings.tokenCredentialsUri ||
                null,
            requestTokenUri:
                _params.requestTokenUri ||
                security.settings.requestTokenUri ||
                null
        })

        return auth
    }

    // @tested
    _extractBasicAuth() {
        let auth = new Auth.Basic()
        return auth
    }

    // @tested
    _extractDigestAuth() {
        let auth = new Auth.Digest()
        return auth
    }

    // @tested 70%
    _extractBody(raml, req) {
        let bodyType = null
        let body = null

        if (!req.body) {
            return [ bodyType, body ]
        }

        let _body = req.body

        let schema = _body.schema ||
            (_body['application/json'] || {}).schema ||
            (_body['application/xml'] || {}).schema ||
            null
        if (schema) {
            bodyType = 'schema'
            body = new Schema({
                raw: schema
            })
            return [ bodyType, body ]
        }

        const bodyTypeMap = {
            'application/x-www-form-urlencoded': 'urlEncoded',
            'multipart/form-data': 'formData'
        }

        let relevantBodyKeys = Object.keys(_body).filter(k => {
            return Object.keys(bodyTypeMap).indexOf(k) >= 0
        })

        let format = relevantBodyKeys[0]

        if (format) {
            bodyType = bodyTypeMap[format]
            let params = _body[format].formParameters
            body = new Immutable.List()
            if (params) {
                for (let param in params) {
                    if (params.hasOwnProperty(param)) {
                        // TODO
                        body = body.push(new KeyValue({
                            key: param,
                            value: params[param].default || null,
                            valueType: params[param].type || null,
                            description: params[param].description || null
                        }))
                    }
                }
            }
        }

        return [ bodyType, body ]
    }

    // @tested 70%
    _extractResponses(raml, req) {
        let responses = new Immutable.List()

        for (let code in req.responses) {
            if (req.responses.hasOwnProperty(code)) {
                let response = req.responses[code]
                let schema = response.schema || null
                if (!schema && response.body) {
                    schema = (response.body['application/json'] || {}).schema ||
                    (response.body['application/xml'] || {}).schema ||
                    null
                }
                if (schema) {
                    schema = new Schema({
                        raw: schema
                    })
                }
                let headers = {}

                for (let header in response.headers || {}) {
                    if (response.headers.hasOwnProperty(header)) {
                        headers[header] = new KeyValue({
                            key: header,
                            value: response.headers[header].default || null,
                            valueType: response.headers[header].type || null,
                            description:
                                response.headers[header].description || null
                        })
                    }
                }
                responses = responses.push(
                    new Response({
                        code: code,
                        description: req.responses[code].description || null,
                        schema: schema,
                        headers: new Immutable.OrderedMap(headers)
                    })
                )
            }
        }

        return responses
    }
}
