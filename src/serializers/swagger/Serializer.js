import Immutable from 'immutable'
import BaseSerializer from '../BaseSerializer'
import {
    Parameter
} from '../../models/Core'

import Reference from '../../models/references/Reference'

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
            let contact = this._formatContactInfo(_info.contact)
            if (Object.keys(contact).length > 0) {
                _info.contact = contact
            }
        }

        if (_info.license) {
            let license = this._formatLicenseInfo(_info.license)
            if (Object.keys(license).length > 0) {
                _info.license = license
            }
        }

        return _info
    }

    _formatContactInfo(contact) {
        let formatted = {}

        if (!contact) {
            return formatted
        }

        for (let key of contact.keys()) {
            if (contact.get(key)) {
                formatted[key] = contact.get(key)
            }
        }

        return formatted
    }

    _formatLicenseInfo(license) {
        let formatted = {}

        if (!license) {
            return formatted
        }

        for (let key of license.keys()) {
            if (license.get(key)) {
                formatted[key] = license.get(key)
            }
        }

        if (formatted.url && !formatted.name) {
            formatted.name = 'Missing License Scheme'
        }

        return formatted
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

        let generated = url.get('host').generate()
        return [ generated || 'localhost', usedSchemes ]
    }

    _formatPaths(context, requests, schemes) {
        let securityDefs = new Immutable.Map()
        let paths = {}
        requests.forEach(req => {
            let [ _defs, path, _req ] = this.
                _formatRequest(context, req, schemes)
            let request = paths[path] || {}
            securityDefs = securityDefs.mergeDeep(_defs)
            Object.assign(request, _req)
            paths[path] = request
        })
        return [ paths, securityDefs.toJS() ]
    }

    _formatRequest(context, request, schemes) {
        let req = {}
        let _path = request.getIn([ 'url', 'pathname' ])

        let path = this._formatSequenceParam(_path)

        let [ security, content ] = ::this.
            _formatContent(context, request, schemes)

        req[request.get('method').toLowerCase()] = content
        return [ security, path, req ]
    }

    _formatSequenceParam(_param) {
        if (_param.get('format') !== 'sequence') {
            let schema = _param.getJSONSchema(false, true)
            if (!schema.enum && typeof schema.default !== 'undefined') {
                schema.enum = [ schema.default ]
            }
            let generated = _param.generate(false, schema)
            return generated
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
        let responses = ::this._formatResponses(context, request)

        if (Object.keys(responses).length === 0) {
            _content.responses = {
                default: {
                    description: 'stub description for swagger compliance'
                }
            }
        }
        else {
            _content.responses = responses
        }

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
        let content = {
            description: response.get('description') || 'stub description'
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
                delete _param.required
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
                let _param = this._formatParam('body', param, false)
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

                if (typeof _param.$ref === 'object') {
                    _param = _param.$ref || {}
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

        let params = headers.map(param => {
            return this._formatParam('header', param)
        }).concat(
        queries.map(param => {
            return this._formatParam('query', param)
        })
        ).concat(
        body.map(param => {
            let formatted
            let domain = this._getContentTypeDomain(param)

            if (
                domain.indexOf('application/x-www-form-urlencoded') >= 0 ||
                domain.indexOf('multipart/form-data') >= 0
            ) {
                formatted = this._formatParam('body', param, true)
            }
            else {
                formatted = this._formatParam('body', param, false)
            }

            if (typeof formatted.$ref === 'undefined') {
                formatted.in = 'formData'
            }
            else {
                if (typeof formatted.$ref === 'object') {
                    formatted.schema = formatted.$ref || {}
                }
                else {
                    formatted.schema = {
                        $ref: formatted.$ref
                    }
                }
                delete formatted.$ref
                delete formatted.type
            }


            return formatted
        })
        ).concat(
        path.map(param => {
            return this._formatParam('path', param)
        })
        )

        return this._dropDuplicateParameters(params)
    }

    _getContentTypeDomain(param) {
        let externals = param.get('externals')
        let domain = []
        externals.forEach(external => {
            if (external.get('key') === 'Content-Type') {
                domain = external.getIn([ 'internals', 0, 'value' ])
            }
        })

        return domain
    }

    _dropDuplicateParameters(params) {
        let paramMap = {}
        return params.filter(param => {
            if (!paramMap[param.in + '-' + param.name]) {
                paramMap[param.in + '-' + param.name] = true
                return true
            }
            return false
        })
    }

    _formatParam(source, _param, replaceRefs = true) {
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

        Object.assign(param, _param.getJSONSchema(false, replaceRefs))

        if (_param.get('externals').size > 0) {
            param['x-use-with'] = []

            _param.get('externals').forEach(external => {
                let constraint = {
                    name: external.get('key')
                }
                let schema = external.getJSONSchema(false, false)
                Object.assign(constraint, schema)
                param['x-use-with'].push(constraint)
            })
        }

        if (description) {
            param.description = description
        }

        if (example) {
            if (example instanceof Reference) {
                let pseudo = new Parameter({
                    type: 'reference',
                    value: example
                })
                param['x-example'] = this._formatParam(null, pseudo)
                delete param['x-example'].required
            }
            else {
                param['x-example'] = example
            }
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

        let _definitions = new Immutable.Map()
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
                    _definitions = _definitions.mergeDeep(definition)
                }
            }
        })

        return [ _definitions.toJS(), _security ]
    }

    _formatBasicAuth(context, auth) {
        let definition = {
            basic_auth: {
                type: 'basic',
                'x-username': auth.get('username'),
                'x-password': auth.get('password')
            }
        }

        return [ definition, { basic_auth: [] } ]
    }

    _formatApiKeyAuth(context, auth) {
        let definition = {
            api_key_auth: {
                type: 'apiKey',
                name: auth.get('name'),
                in: auth.get('in')
            }
        }

        return [ definition, { api_key_auth: [] } ]
    }

    _formatOAuth2Auth(context, auth) {
        let scopes = auth.get('scopes')

        let _definition = {
            type: 'oauth2'
        }

        if (auth.get('authorizationUrl')) {
            _definition.authorizationUrl = auth.get('authorizationUrl')
        }

        if (auth.get('tokenUrl')) {
            _definition.tokenUrl = auth.get('tokenUrl')
        }

        if (auth.get('flow')) {
            _definition.flow = auth.get('flow')
        }

        let definition = {
            oauth_2_auth: _definition
        }

        let scopeDescriptions = {}
        let security
        if (scopes) {
            scopes = scopes.toJS()
            security = {
                oauth_2_auth: scopes
            }

            scopes.forEach(scope => {
                scopeDescriptions[scope] = ''
            })

            definition.oauth_2_auth.scopes = scopeDescriptions
        }
        else {
            security = 'oauth_2_auth'
        }

        return [ definition, security ]
    }

    _unescapeURIFragment(uriFragment) {
        return uriFragment.replace(/~1/g, '/').replace(/~0/g, '~')
    }

    _formatDefinitions(context) {
        let schemas = {}
        let references = context.get('references')
        references.forEach(container => {
            container.get('cache').forEach((cache, key) => {
                if (key && key.startsWith('#/')) {
                    let pathFragments = key
                        .split('/')
                        .slice(1)
                        .map(fragment => {
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
                    let ref = container.resolve(key).get('value')

                    if (typeof ref === 'undefined' || ref === null) {
                        subTree = ''
                    }
                    else if (typeof ref === 'string') {
                        subTree = ref
                    }
                    else {
                        // object assignement
                        ref = this._replaceRefs(ref)
                        if (typeof ref === 'string') {
                            subTree = ref
                        }
                        else {
                            Object.assign(subTree, ref)
                        }
                    }
                }
            })
        })

        return schemas
    }

    _replaceRefs(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return obj
        }

        if (obj instanceof Reference) {
            return obj.get('relative') || obj.get('uri')
        }

        if (Array.isArray(obj)) {
            for (let i = 0; i < obj.length; i += 1) {
                let content = obj[i]
                obj[i] = this._replaceRefs(content)
            }
        }
        else {
            for (let key of Object.keys(obj)) {
                let replaced = this._replaceRefs(obj[key])
                obj[key] = replaced
            }
        }

        return obj
    }
}
