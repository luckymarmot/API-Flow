import Immutable from 'immutable'
import RAML from 'raml-parser'

import Context, {
    Body,
    Request,
    Response,
    Parameter,
    ParameterContainer
} from '../../models/Core'

import {
    Group,
    URL
} from '../../models/Utils'

import ReferenceContainer from '../../models/references/Container'
import Reference from '../../models/references/Reference'
import ExoticReference from '../../models/references/Exotic'

import Constraint from '../../models/Constraint'
import Auth from '../../models/Auth'

import ShimmingFileReader from './FileReader'

export default class RAMLParser {
    constructor(items) {
        this.reader = new ShimmingFileReader(items)
        this.context = new Context()
    }

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

    _createContext(_raml) {
        let context = new Context()

        let references = ::this._findReferences(_raml)
        let raml = ::this._replaceReferences(_raml)

        let group = this._createGroupTree(
            raml,
            raml,
            raml.title || null
        )

        if (group) {
            context = context.set('group', group)
        }

        if (references) {
            let container = new ReferenceContainer()
            container = container.create(references)
            context = context.set('references', container)
        }
        return context
    }

    _findReferences(obj) {
        let refs = new Immutable.List()

        if (typeof obj === 'string' && obj.startsWith('::fileRef::')) {
            let uri = obj.slice(11)
            return refs.push(
                new ExoticReference({
                    uri: uri
                })
            )
        }

        if (typeof obj !== 'object') {
            return refs
        }

        if (Array.isArray(obj)) {
            for (let i = 0; i < obj.length; i += 1) {
                let content = obj[i]
                refs = refs.concat(::this._findReferences(content))
            }
        }
        else {
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    refs = refs.concat(::this._findReferences(obj[key]))
                }
            }
        }
        return refs
    }

    _replaceReferences(obj) {
        if (typeof obj === 'string' && obj.startsWith('::fileRef::')) {
            let uri = obj.slice(11)
            return new ExoticReference({
                uri: uri
            })
        }

        if (typeof obj !== 'object') {
            return obj
        }

        if (Array.isArray(obj)) {
            for (let i = 0; i < obj.length; i += 1) {
                let content = obj[i]
                obj[i] = ::this._replaceReferences(content)
            }
        }
        else {
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    obj[key] = ::this._replaceReferences(obj[key])
                }
            }
        }

        return obj
    }

    _createGroupTree(baseTree, tree, baseName, url = '') {
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

    _createRequest(raml, req, url, method) {
        let _url = this._extractURL(raml, req, url)
        let container = new ParameterContainer()

        container = this._extractHeaders(raml, req, container)
        container = this._extractQueries(raml, req, container)

        let bodies
        [ container, bodies ] = this._extractBodies(raml, req, container)

        let auths = this._extractAuth(raml, req)
        let responses = this._extractResponses(raml, req)

        let request = new Request({
            url: _url,
            method: method,
            name: _url.getUrl(),
            description: req.description || null,
            parameters: container,
            bodies: bodies,
            auths: auths,
            responses: responses
        })
        return request
    }

    _extractURL(raml, req, path) {
        let baseUri = raml.baseUri
        let match = (baseUri || '').match(/(.*):\/\/(.*)/)
        let domain
        let schemes = []
        if (!match) {
            domain = baseUri
        }
        else {
            schemes = [ match[1].toLowerCase() ]
            domain = match[2]
        }

        if (req.protocols && req.protocols !== []) {
            schemes = req.protocols.map(protocol => {
                return protocol.toLowerCase()
            })
        }
        let _url = new URL({
            schemes: schemes,
            host: domain,
            path: path
        })
        return _url
    }

    _extractParam(name, param, externals) {
        if (typeof param === 'undefined') {
            return null
        }

        let type = param.type
        let value

        let _name = null
        if (typeof name !== 'undefined') {
            _name = name
        }

        let description = param.description || null

        if (param.schema) {
            if (param.schema instanceof Reference) {
                type = 'reference'
            }
            else {
                // FIXME: we are not propagating the fact that it's a schema
                type = 'string'
            }

            return new Parameter({
                key: _name,
                name: param.displayName || null,
                value: param.schema,
                type: type,
                description: description,
                example: param.example || null,
                externals: externals || new Immutable.List()
            })
        }

        if (param && typeof param[Symbol.iterator] === 'function') {
            value = new Immutable.List()
            type = 'multi'
            for (let subparam of param) {
                value = value.push(this._extractParam(name, subparam))
            }
        }
        else if (typeof param.default !== 'undefined') {
            value = param.default
        }
        else {
            value = null
        }

        let internalsMap = {
            maximum: Constraint.Maximum,
            minimum: Constraint.Minimum,
            maxLength: Constraint.MaximumLength,
            minLength: Constraint.MinimumLength,
            pattern: Constraint.Pattern,
            enum: Constraint.Enum
        }

        let internals = new Immutable.List()
        for (let key of Object.keys(param)) {
            if (internalsMap[key]) {
                let constraint = new internalsMap[key](param[key])
                internals = internals.push(constraint)
            }
        }

        return new Parameter({
            key: _name,
            name: param.displayName || null,
            value: value,
            type: type,
            description: description,
            example: param.example || null,
            internals: internals,
            externals: externals || new Immutable.List()
        })
    }

    _extractHeaders(raml, req, container) {
        let headers = container.get('headers')

        for (let header in req.headers || {}) {
            if (req.headers.hasOwnProperty(header)) {
                let param = req.headers[header]
                headers = headers.push(this._extractParam(header, param))
            }
        }

        return container.set('headers', headers)
    }

    _extractQueries(raml, req, container) {
        let queries = container.get('queries')
        for (let paramName in req.queryParameters || {}) {
            if (req.queryParameters.hasOwnProperty(paramName)) {
                let param = req.queryParameters[paramName]
                queries = queries.push(this._extractParam(paramName, param))
            }
        }

        return container.set('queries', queries)
    }

    _extractBodies(raml, req, container, bodies) {
        let _body = req.body || {}
        let _bodies = bodies
        let _container = container

        let bodyParams = container.get('body')

        if (_body.schema) {
            bodyParams = bodyParams.push(this._extractParam('body', _body))
            _bodies = _bodies.push(new Body())
            _container = _container.set('body', bodyParams)
            return [ _container, _bodies ]
        }

        const bodyTypeMap = {
            'application/x-www-form-urlencoded': 'urlEncoded',
            'multipart/form-data': 'formData'
        }

        for (let contentType of Object.keys(_body)) {
            let externals = new Immutable.List([
                new Parameter({
                    key: 'Content-Type',
                    internals: new Immutable.List([
                        new Constraint.Enum([ contentType ])
                    ])
                })
            ])

            let bodyType = bodyTypeMap[contentType] || null

            let body = new Body({
                type: bodyType,
                constraints: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        value: contentType
                    })
                ])
            })

            _bodies = _bodies.push(body)

            let formParameters = (_body[contentType] || {}).formParameters
            if (bodyType && formParameters) {
                for (let param of Object.keys(formParameters)) {
                    bodyParams = bodyParams.push(
                        this._extractParam(
                            param,
                            formParameters[param],
                            externals
                        )
                    )
                }
            }

            if (!bodyType && (_body[contentType] || {}).schema) {
                bodyParams = bodyParams.push(
                    this._extractParam('body', _body[contentType], externals)
                )
            }
        }

        _container = _container.set('body', bodyParams)

        return [ _container, _bodies ]
    }

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
                    security.settings.scopes || []
                )
        })

        return auth
    }

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

    _extractBasicAuth() {
        let auth = new Auth.Basic()
        return auth
    }

    _extractDigestAuth() {
        let auth = new Auth.Digest()
        return auth
    }

    _extractResponses(raml, req) {
        let responses = new Immutable.List()

        for (let code of Object.keys(req.responses)) {
            let response = req.responses[code]
            let description = response.description || null

            let [ _container, _bodies ] = this._extractBodies(
                raml, response, new ParameterContainer(), new Immutable.List()
            )

            let _response = new Response({
                code: code,
                description: description,
                parameters: _container,
                bodies: _bodies
            })

            responses = responses.push(_response)
        }

        return responses
    }
}
