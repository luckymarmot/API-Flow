import Immutable from 'immutable'
import BaseSerializer from '../BaseSerializer'

export default class SwaggerSerializer extends BaseSerializer {
    serialize(context) {
        let info = this._formatInfo(context)

        let requests = context.getRequests()
        let [ host, schemes ] = this._formatHost(requests)
        let [ paths, securityDefs ] = this._formatPaths(
            context, requests, schemes
        )
        let definitions = this._formatDefinitions(context)

        let swagger = {
            swagger: '2.0',
            info: info,
            host: host,
            paths: paths
        }

        Object.assign(swagger, definitions)

        if (schemes !== []) {
            swagger.schemes = schemes
        }

        if (securityDefs) {
            swagger.securityDefinitions = securityDefs
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
        if (!requests || requests.size === 0) {
            return [ 'localhost', [] ]
        }

        let url = requests.getIn([ 0, 'url' ])
        let schemes = [ 'http', 'https', 'ws', 'wss' ]
        let usedSchemes = []
        for (let scheme of schemes) {
            let used = requests.reduce((bool, req) => {
                let value = req
                    .get('url')
                    ._getParamValue('protocol')
                    .indexOf(scheme) >= 0
                return bool && value
            }, true)

            if (used) {
                usedSchemes.push(scheme)
            }
        }

        return [ url.get('host').generate() || 'localhost', usedSchemes ]
    }

    _formatPaths(context, requests, schemes) {
        let securityDefs = {}
        let paths = {}
        requests.forEach(req => {
            let [ _defs, path, _req ] = this.
                _formatRequest(context, req, schemes)
            let request = paths[path] || {}
            Object.assign(securityDefs, _defs)
            Object.assign(request, _req)
            paths[path] = request
        })
        return [ paths, securityDefs ]
    }

    _formatRequest(context, request, schemes) {
        let req = {}
        let _path = request.getIn([ 'url', 'pathname' ])

        let path = this._formatSequenceParam(_path)

        let [ security, content ] = ::this.
            _formatContent(context, request, schemes)

        req[request.get('method')] = content
        return [ security, path, req ]
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
                sub.enum = [ '{' + sub['x-title'] + '}' ]
            }
        }

        let generated = _param.generate(false, schema)
        return generated
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

        let _schemes = request.get('url')._getParamValue('protocol')

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
        _content.responses = ::this._formatResponses(context, request)
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
                        constraint.get('value')
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

    _formatResponses(context, request) {
        let responses = request.get('responses')
        let _responseMap = {}
        responses.forEach(response => {
            Object.assign(
                _responseMap,
                this._formatResponse(context, response)
            )
        })

        return _responseMap
    }

    _formatResponse(context, response) {
        let _responseMap = {}
        let content = {}
        if (response.get('description')) {
            content.description = response.get('description')
        }

        let container = response.get('parameters')
        let headers = container.get('headers')
        let body = container.get('body')

        if (headers.size > 0) {
            content.headers = {}
            headers.forEach(param => {
                let _param = this._formatParam(null, param)
                let name = _param.name
                delete _param.name
                let final = {}
                final[name] = _param

                if (!content.headers) {
                    content.headers = {}
                }
                Object.assign(content.headers, final)
            })
        }

        if (body.size > 0) {
            body.forEach(param => {
                let _param = this._formatParam('body', param)
                if (_param.type !== 'array') {
                    delete _param.type
                }
                delete _param.in
                delete _param.name
                delete _param.required
                delete _param.description

                if (!content.schema) {
                    content.schema = {}
                }

                content['x-use-with'] = _param['x-use-with']

                delete _param['x-use-with']
                Object.assign(content.schema, _param)
            })
        }

        _responseMap[response.get('code')] = content

        return _responseMap
    }

    _formatParameters(context, request) {
        let container = request.get('parameters')

        let headers = container.get('headers')
        let queries = container.get('queries')
        let body = container.get('body')
        let path = container.get('path')

        return headers.map(param => {
            return this._formatParam('header', param)
        }).concat(
        queries.map(param => {
            return this._formatParam('query', param)
        })
        ).concat(
        body.map(param => {
            return this._formatParam('body', param)
        })
        ).concat(
        path.map(param => {
            return this._formatParam('path', param)
        })
        )
    }

    _formatParam(source, _param) {
        let description = _param.get('description')
        let example = _param.get('example')
        let format = _param.get('format')

        let param = {
            name: _param.get('key'),
            required: _param.get('required')
        }

        if (source) {
            param.in = source
        }

        if (source === 'path') {
            param.required = true
        }

        const stdTypes = {
            string: 'string',
            number: 'number',
            integer: 'integer',
            boolean: 'boolean'
        }

        if (stdTypes[_param.get('type')]) {
            if (_param.get('value')) {
                param.default = _param.get('value')
            }
        }

        Object.assign(param, _param.getJSONSchema(false))

        if (_param.get('externals').size > 0) {
            param['x-use-with'] = []

            _param.get('externals').forEach(external => {
                let constraint = {
                    name: external.get('key')
                }
                let schema = external.getJSONSchema()
                Object.assign(constraint, schema)
                param['x-use-with'].push(constraint)
            })
        }

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

        request.get('auths').forEach(auth => {
            if (!auth) {
                _security.push(null)
            }
            else {
                let rule = securityMap[auth.constructor.name]
                if (rule) {
                    let [ definition, security ] = rule(context, auth)
                    _security.push(security)
                    Object.assign(_definitions, definition)
                }
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
                flow: auth.get('flow'),
                scopes: scopes
            }
        }

        return [ definition, 'oauth_2_auth' ]
    }

    _unescapeURIFragment(uriFragment) {
        return uriFragment.replace('~1', '/').replace('~0', '~')
    }

    _formatDefinitions(context) {
        let schemas = {}
        let references = context.get('references')
        references.get('cache').forEach((cache, key) => {
            if (key.startsWith('#/')) {
                let pathFragments = key.split('/').slice(1).map(fragment => {
                    return this._unescapeURIFragment(fragment)
                })
                // pointer assignement
                // we're moving the subTree pointer to modify schemas
                let subTree = schemas
                for (let fragment of pathFragments) {
                    subTree[fragment] =
                        typeof subTree[fragment] === 'undefined' ?
                        {} :
                        subTree[fragment]
                    subTree = subTree[fragment]
                }
                let ref = references.resolve(key).get('value')

                // object assignement
                Object.assign(subTree, ref)
            }
        })

        return schemas
    }
}
