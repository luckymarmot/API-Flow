import Immutable from 'immutable'
import BaseSerializer from '../BaseSerializer'

export default class SwaggerSerializer extends BaseSerializer {
    serialize(context) {
        let info = this._formatInfo(context)

        let requests = context.getRequests()
        let [ host, schemes ] = this._formatHost(requests)

        let swagger = {
            swagger: '2.0',
            info: info,
            host: host
        }

        if (schemes !== []) {
            swagger.schemes = schemes
        }


        return JSON.stringify(swagger, null, '  ')
    }

    _formatInfo(context) {
        let info = context.get('info')

        if (!info) {
            return {
                title: 'API-Flow Swagger Conversion',
                version: '0.0.0'
            }
        }

        let _info = {}

        let infoMap = {
            title: 'title',
            description: 'description',
            tos: 'termsOfService',
            contact: 'contact',
            license: 'license',
            version: 'version'
        }

        for (let key of Object.keys(infoMap)) {
            let value = info.get(key)
            if (value) {
                _info[infoMap[key]] = value
            }
        }

        if (!_info.title) {
            _info.title = 'API-Flow Swagger Conversion'
        }

        if (!_info.version) {
            _info.version = '0.0.0'
        }

        if (_info.contact) {
            _info.contact = _info.contact.toJS()
        }

        if (_info.license) {
            _info.license = _info.license.toJS()
            if (!_info.license.name) {
                _info.license = 'Missing License'
            }
        }

        return _info
    }

    _formatHost(requests) {
        if (requests.size === 0) {
            return 'localhost'
        }

        let url = requests[0].get('url')
        let schemes = [ 'http', 'https', 'ws', 'wss' ]
        let usedSchemes = []
        for (let scheme of schemes) {
            let used = requests.reduce((bool, req) => {
                let value = req
                    .getIn([ 'url', 'schemes' ])
                    .indexOf(scheme) >= 0
                return bool && value
            }, true)

            if (used) {
                usedSchemes.push(scheme)
            }
        }

        return [ url.get('host') || 'localhost' ]
    }

    _formatPaths(context, requests, schemes) {
        let securityDefs = {}
        let request = {}
        requests.forEach(req => {
            let [ _defs, _req ] = this.
                _formatRequest(context, req, schemes)
            Object.assign(securityDefs, _defs)
            Object.assign(request, _req)
        })
    }

    _formatRequest(context, request, schemes) {
        let req = {}
        let [ security, content ] = ::this.
            _formatContent(context, request, schemes)

        req[request.get('method')] = content
        return [ security, req ]
    }

    _formatContent(context, request, schemes) {
        let _content = {}

        if (request.get('description')) {
            _content.description = request.get('description')
        }

        if (request.get('tags').size > 0) {
            _content.tags = request.get('tags').toJS()
        }

        if (request.get('id')) {
            _content.operationId = request.get('id')
        }

        let _schemes = request.getIn([ 'url', 'schemes' ])

        if (!Immutable.is(
            Immutable.fromJS(schemes),
            Immutable.fromJS(_schemes)
        )) {
            _content.schemes = _schemes
        }

        _content.consumes = this._formatConsumes(context, request)
        _content.produces = ::this._formatProduces(context, request)

        _content.parameters = ::this._formatParameters(context, request)
        let [ definitions, security ] = ::this._formatSecurity(context, request)

        _content.security = security

        return [ definitions, _content ]
    }

    _formatConsumes(context, request) {
        let bodies = request.get('bodies')
        let consumeMap = {}
        bodies.forEach(body => {
            let constraints = body.get('constraints')
            if (constraints && constraints.size > 0) {
                constraints.forEach(constraint => {
                    if (
                        constraint.get('key') === 'Content-Type' &&
                        consumeMap[constraint.get('value')]
                    ) {
                        consumeMap[constraint.get('value')] = true
                    }
                })
            }
        })

        return Object.keys(consumeMap)
    }

    _formatProduces(context, request) {
        let responses = request.get('responses')
        let produceMap = {}
        responses.forEach(response => {
            this._formatConsumes(context, response).reduce((map, produce) => {
                map[produce] = true
                return map
            }, produceMap)
        })

        return Object.keys(produceMap)
    }

    _formatParameters(context, request) {
        let container = request.get('container')

        let headers = container.get('headers')
        let queries = container.get('queries')
        let body = container.get('body')

        return headers.map(param => {
            return this._formatParam('headers', param)
        }).concat(
        queries.map(param => {
            return this._formatParam('query', param)
        })
        ).concat(
        body.map(param => {
            return this._formatParam('body', param)
        })
        )
    }

    _formatParam(source, _param) {
        let description = _param.get('description')
        let example = _param.get('example')
        let format = _param.get('format')

        let param = {
            in: source,
            name: _param.get('key')
        }

        if (source === 'path') {
            param.required = true
        }

        if (source === 'body' && _param.get('type') === 'schema') {
            param.schema = _param.get('value').toJS()
        }

        const stdTypes = {
            string: 'string',
            number: 'number',
            integer: 'integer',
            boolean: 'boolean',
            array: 'array'
        }

        if (stdTypes[_param.get('type')]) {
            if (_param.get('value')) {
                param.default = _param.get('value')
            }
        }

        _param.get('internals').forEach(constraint => {
            Object.assign(param, constraint.toJS())
        })

        param['x-use-with'] = []

        _param.get('externals').forEach(external => {
            let constraint = {
                name: external.get('key')
            }
            let schema = external.getJSONSchema()
            Object.assign(constraint, schema)
            param['x-use-with'].push(constraint)
        })

        if (description) {
            param.description = description
        }

        if (example) {
            param['x-example'] = example
        }

        const formatMap = {
            int32: true,
            int64: true,
            float: true,
            double: true,
            byte: true,
            binary: true,
            date: true,
            'date-time': true,
            password: true
        }

        if (format) {
            if (formatMap[format]) {
                param.format = format
            }
            else {
                param['x-format'] = format
            }
        }
        return param
    }

    _formatSecurity(context, request) {
        const securityMap = {
            BasicAuth: ::this._formatBasicAuth,
            ApiKeyAuth: ::this._formatApiKeyAuth,
            OAuth2Auth: ::this._formatOAuth2Auth
        }

        let _definitions = {}
        let _security = []

        request.get('auth').forEach(auth => {
            let rule = securityMap[auth.constructor.name]
            if (rule) {
                let [ definition, security ] = rule(context, auth)
                _security.push(security)
                Object.assign(_definitions, definition)
            }
        })

        return [ _definitions, _security ]
    }

    _formatBasicAuth(context, auth) {
        let definition = {
            basic_auth: {
                type: 'basic',
                'x-username': auth.get('username'),
                'x-password': auth.get('password')
            }
        }

        return [ definition, 'basic_auth' ]
    }

    _formatApiKeyAuth(context, auth) {
        let definition = {
            api_key_auth: {
                type: 'apiKey',
                name: auth.get('name'),
                in: auth.get('in')
            }
        }

        return [ definition, 'api_key_auth' ]
    }

    _formatOAuth2Auth(context, auth) {
        let scopes = auth.get('scopes')

        if (scopes) {
            scopes = scopes.toJS()
        }

        let definition = {
            oauth_2_auth: {
                type: 'oauth2',
                authorizationUrl: auth.get('authorizationUrl'),
                tokenUrl: auth.get('tokenUrl'),
                scopes: scopes
            }
        }

        return [ definition, 'oauth_2_auth' ]
    }
}
