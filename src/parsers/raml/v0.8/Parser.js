import Immutable from 'immutable'
import RAML from 'raml-parser'
import __path from 'path'

import Context, {
    Body,
    Response,
    Parameter,
    ParameterContainer
} from '../../../models/Core'

import { Info } from '../../../models/Utils'

import Item from '../../../models/Item'
import Group from '../../../models/Group'
import Request from '../../../models/Request'
import URL from '../../../models/URL'

import ReferenceContainer from '../../../models/references/Container'
import Reference from '../../../models/references/Reference'
import ExoticReference from '../../../models/references/Exotic'
import JSONSchemaReference from '../../../models/references/JSONSchema'

import Constraint from '../../../models/Constraint'
import Auth from '../../../models/Auth'

import ShimmingFileReader from '../FileReader'

export default class RAMLParser {
    static format = 'raml'
    static version = 'v0.8'

    static detect(content) {
        let detection = {
            format: RAMLParser.format,
            version: RAMLParser.version,
            score: 0
        }

        let firstLine = content.split('\n', 1)[0]
        let match = firstLine.match(/#%RAML (0\.8|1\.0)/)
        if (match) {
            detection.score = 1
            return [ detection ]
        }
        return [ detection ]
    }

    static getAPIName(content) {
        let match = content.match(/^title:\s(.*)$/m)
        if (match) {
            return match[1] || null
        }

        return null
    }

    constructor(items) {
        this.reader = new ShimmingFileReader(items)
        this.context = new Context()
        this.item = new Item()
    }

    detect() {
        return RAMLParser.detect(...arguments)
    }

    getAPIName() {
        return RAMLParser.getAPIName(...arguments)
    }

    parse(_item) {
        this.item = new Item(_item)
        this.reader.setBaseItem(this.item)
        let string = this.item.get('content')
        let location = this.item.getPath()

        return RAML.load(string, location, {
            reader: this.reader
        }).then(raml => {
            if (raml) {
                let context = this._createContext(raml)
                return context
            }
            return
        }, error => {
            let msg = 'failed to parse RAML file'
            if (error.message) {
                msg += ' with reason: ' + error.message
            }
            throw new Error(msg)
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
            if (container.get('cache').size > 0) {
                context = context.setIn([ 'references', raml.title ], container)
            }
        }

        let info = this._extractInfos(_raml)

        if (info) {
            context = context.set('info', info)
        }

        return context
    }

    _findReferences(obj) {
        let refs = new Immutable.List()

        if (typeof obj === 'string' && obj.indexOf('::fileRef::') === 0) {
            let rel = obj.slice(11)
            let uri = __path.resolve(__path.dirname(
                this.item.getPath()
            ), rel)
            return refs.push(
                new ExoticReference({
                    uri: uri,
                    relative: rel
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
                    if (key === 'schema' && typeof obj.schema === 'string') {
                        let ref = this._createJSONSchemaReference(
                            obj.schema, this.item
                        )
                        refs = refs.push(ref)
                    }
                    else {
                        refs = refs.concat(::this._findReferences(obj[key]))
                    }
                }
            }
        }
        return refs
    }

    _createJSONSchemaReference(_rel, item) {
        let rel = _rel
        if (rel.indexOf('::fileRef::') === 0) {
            rel = rel.slice(11)
            let uri = __path.resolve(__path.dirname(
                item.getPath()
            ), rel)

            return new JSONSchemaReference({
                uri: uri,
                relative: rel
            })
        }

        try {
            let schema = JSON.parse(rel)
            return new JSONSchemaReference({
                value: schema,
                resolved: true
            })
        }
        catch (e) {
            if (rel.match(/[<>]/)) {
                return new JSONSchemaReference({
                    value: {
                        description:
                            'This schema could not be reliably parsed.\n' +
                            'We have included it as a description to preserve' +
                            ' the information it represents.\n\n' + rel
                    },
                    resolved: true
                })
            }
            else if (!(rel.indexOf('#/') === 0)) {
                rel = '#/' + _rel
            }
        }


        let uri = item.getPath() + rel

        return new JSONSchemaReference({
            uri: uri,
            relative: rel
        })
    }

    _replaceReferences(obj) {
        if (typeof obj === 'string' && obj.indexOf('::fileRef::') === 0) {
            let rel = obj.slice(11)
            let uri = __path.resolve(__path.dirname(
                this.item.getPath()
            ), rel)
            return new ExoticReference({
                uri: uri,
                relative: rel
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
                    if (key === 'schema' && typeof obj.schema === 'string') {
                        obj.schema = this._createJSONSchemaReference(
                            obj.schema, this.item
                        )
                    }
                    else {
                        obj[key] = ::this._replaceReferences(obj[key])
                    }
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
        container = this._extractPaths(_url, container)

        let bodies
        [ container, bodies ] = this._extractBodies(
            raml, req, container, new Immutable.List()
        )

        let auths = this._extractAuth(raml, req)
        let responses = this._extractResponses(raml, req)

        let request = new Request({
            url: _url,
            method: method,
            name: _url.href(),
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
        let match = (baseUri || '').match(/(.*):\/\/([^/]*)\/?(.*)/)
        let schemes = []
        let domain
        let basePath

        if (!match) {
            domain = baseUri
        }
        else {
            schemes = [ match[1].toLowerCase() ]
            domain = match[2]
            if (match[3].endsWith('/')) {
                match[3] = match[3].slice(0, -1)
            }
            basePath = match[3] ? '/' + match[3] : ''
        }

        if (req.protocols && req.protocols !== []) {
            schemes = req.protocols.map(protocol => {
                return protocol.toLowerCase()
            })
        }

        let protocol = new Parameter({
            key: 'protocol',
            type: 'string',
            internals: new Immutable.List([
                new Constraint.Enum(schemes)
            ])
        })

        let parameters = Object.assign(
            {},
            raml.baseUriParameters || {},
            req.baseUriParameters || {}
        )
        let host = this._extractSequenceParam(
            raml, domain, 'host', parameters
        )

        parameters = Object.assign(
            {},
            raml.baseUriParameters || {},
            req.baseUriParameters || {},
            req.uriParameters || {}
        )
        let pathname = this._extractSequenceParam(
            raml, basePath + path, 'pathname', parameters
        )

        let _url = new URL({
            protocol: protocol,
            host: host,
            pathname: pathname
        })
        return _url
    }

    _extractSequenceParam(raml, _sequence, _key, parameters) {
        let simpleParam = new Parameter({
            key: _key,
            type: 'string',
            value: _sequence,
            internals: new Immutable.List([
                new Constraint.Enum([
                    _sequence
                ])
            ])
        })
        if (!parameters) {
            return simpleParam
        }
        else {
            let groups = _sequence.match(/([^{}]*)(\{[^{}]*\})([^{}]*)/g)
            if (!groups) {
                return simpleParam
            }

            let sequence = new Immutable.List()
            for (let group of groups) {
                let sub = group.match(/([^{}]*)(\{[^{}]*\})([^{}]*)/)
                if (sub[1]) {
                    sequence = sequence.push(new Parameter({
                        type: 'string',
                        value: sub[1],
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                sub[1]
                            ])
                        ])
                    }))
                }

                if (sub[2]) {
                    let key = sub[2].slice(1, -1)
                    let _param

                    if (key === 'version') {
                        _param = {
                            enum: [ raml.version ]
                        }
                    }
                    else if (parameters[key]) {
                        _param = parameters[key]
                    }
                    else {
                        _param = {
                            type: 'string'
                        }
                    }

                    if (!_param.type) {
                        _param.type = 'string'
                    }

                    let param = this._extractParam(
                        key, _param
                    )

                    if (param === null) {
                        param = new Parameter({
                            key: key,
                            type: 'string',
                            value: sub[2],
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    sub[2]
                                ])
                            ])
                        })
                    }

                    param = param.set('required', true)
                    sequence = sequence.push(param)
                }

                if (sub[3]) {
                    sequence = sequence.push(new Parameter({
                        type: 'string',
                        value: sub[3],
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                sub[3]
                            ])
                        ])
                    }))
                }
            }

            return new Parameter({
                key: _key,
                type: 'string',
                format: 'sequence',
                value: sequence
            })
        }
    }

    _extractParam(name, param, externals) {
        if (typeof param === 'undefined' || param === null) {
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
                _name = 'schema'
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
            type: type || null,
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

    _extractPaths(url, container) {
        if (url.getIn([ 'pathname', 'format' ]) !== 'sequence') {
            return container
        }

        let param = url.get('pathname')
        let paths = container.get('path')

        let sequence = param.get('value')
        sequence.forEach(_param => {
            if (_param.get('key')) {
                paths = paths.push(_param)
            }
        })

        return container.set('path', paths)
    }

    _extractBodies(raml, req, container, bodies) {
        let _body = req.body || {}
        let _bodies = bodies
        let _container = container
        let headers = container.get('headers')

        let bodyParams = container.get('body')

        if (_body.schema) {
            bodyParams = bodyParams.push(this._extractParam(null, _body))
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
                    type: 'string',
                    value: contentType,
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
                        type: 'string',
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

            if (!bodyType && !(_body[contentType] || {}).formParameters) {
                let param = this._extractParam(
                    null, _body[contentType], externals
                )

                if (param) {
                    bodyParams = bodyParams.push(param)
                }
            }

            headers = headers.push(new Parameter({
                key: 'Content-Type',
                type: 'string',
                value: contentType,
                internals: new Immutable.List([
                    new Constraint.Enum([
                        contentType
                    ])
                ]),
                externals: externals
            }))
        }

        _container = _container
            .set('body', bodyParams)
            .set('headers', headers)

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

        for (let code of Object.keys(req.responses || {})) {
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

    _extractInfos(raml) {
        let documentation = raml.documentation || []

        let description = documentation.reduce((desc, doc) => {
            let title = doc.title || ''
            if (title) {
                title = title + ':\n'
            }

            let content = doc.content || ''
            if (content) {
                content = content + '\n'
            }
            let str = title + content + '\n'
            return desc + str
        }, '')

        let info = new Info({
            title: raml.title || null,
            description: description || null,
            version: raml.version || null
        })
        return info
    }
}
