import Immutable from 'immutable'
import yaml from 'js-yaml'

import BaseSerializer from '../BaseSerializer'
import Auth from '../../models/Auth'
import URL from '../../models/URL'

import JSONSchemaReference from '../../models/references/JSONSchema'

export default class RAMLSerializer extends BaseSerializer {
    constructor() {
        super()
        this.references = null
    }

    serialize(context) {
        this.references = context.get('references')

        let content = '#%RAML 0.8\n'
        let structure = this._formatStructure(context)

        content += yaml.dump(structure)

        return content
    }

    validate(text) {
        let lines = text.split('\n')
        if (!(lines[0].indexOf('#%RAML 0.8') === 0)) {
            return 'Not a RAML file'
        }

        if (lines.length < 10) {
            return 'generated file of poor quality'
        }

        return null
    }

    _formatStructure(context) {
        let structure = {}
        let basicInfo = this._formatBasicInfo(context)

        const requests = context.get('requests').valueSeq()
        let urlInfo = {}
        let securitySchemes = {}
        let paths = {}
        let schemas = this._formatSchemas(context.get('references'))

        if (requests.size) {
            urlInfo = ::this._formatURLInfo(requests)
            securitySchemes = ::this._formatSecuritySchemes(requests)
            paths = ::this._formatPaths(requests)
        }

        Object.assign(
            structure,
            basicInfo,
            urlInfo,
            securitySchemes,
            paths,
            schemas
        )

        if (Object.keys(structure).length === 0) {
            return null
        }

        return structure
    }

    _formatBasicInfo(context) {
        let info = context.get('info')
        let infos = {}

        if (info.get('title')) {
            infos.title = info.get('title')
        }

        let documentation = []

        if (info.get('description')) {
            documentation.push({
                title: 'Description',
                content: info.get('description')
            })
        }

        if (info.get('tos')) {
            documentation.push({
                title: 'Terms of Service',
                content: info.get('tos')
            })
        }

        if (info.get('contact')) {
            documentation.push({
                title: 'Contact',
                content: this._formatContact(info.get('contact'))
            })
        }

        if (info.get('license')) {
            documentation.push({
                title: 'License',
                content: this._formatLicense(info.get('license'))
            })
        }

        if (documentation.length > 0) {
            infos.documentation = documentation
        }

        if (info.get('version') !== null) {
            infos.version = info.get('version')
        }

        return infos
    }

    _formatContact(contact) {
        let formatted = ''

        if (contact.get('name')) {
            formatted += 'name: ' + contact.get('name') + '\n'
        }

        if (contact.get('url')) {
            formatted += 'url: ' + contact.get('url') + '\n'
        }

        if (contact.get('email')) {
            formatted += 'email: ' + contact.get('email') + '\n'
        }

        return formatted
    }

    _formatLicense(license) {
        let formatted = ''

        if (license.get('name')) {
            formatted += 'name: ' + license.get('name') + '\n'
        }

        if (license.get('url')) {
            formatted += 'url: ' + license.get('url') + '\n'
        }

        return formatted
    }

    _formatURLInfo(requests) {
        let urlInfo = {}

        let protocolSet = {}
        let origin = null
        let base = {}
        let version

        let mergedURL = new URL()
        requests.forEach(request => {
            let url = request.get('url')
            protocolSet = this._updateProtocols(protocolSet, url)
            mergedURL = mergedURL.merge(url)
        })

        let protocols = Object.keys(protocolSet)

        if (requests.size > 0) {
            let url = requests.get(0).get('url')
            let host = this._generateSequenceParam(url, 'host')
            let protocol = (protocols[0] || 'http').toLowerCase()
            origin = protocol + '://' + host
            let [ _base, _version ] = this._formatURIParameters(
                    url.get('host'),
                    'baseUriParameters'
                )

            base = _base || {}
            version = _version
        }

        if (protocols.length > 0) {
            urlInfo.protocols = protocols.map(string => {
                return string.toUpperCase()
            })
        }

        if (origin) {
            urlInfo.baseUri = origin
        }

        if (version) {
            urlInfo.version = version
        }

        Object.assign(urlInfo, base)

        return urlInfo
    }

    _updateProtocols(protocols, url) {
        if (Object.keys(protocols).length === 2) {
            // all possible protocols are used
            return protocols
        }

        const validProtocols = {
            http: true,
            https: true
        }

        let protoParam = url.get('protocol')
        let result = protocols || {}

        if (protoParam) {
            let schema = protoParam.getJSONSchema()
            let _protocols = schema.enum
            for (let protocol of _protocols) {
                if (validProtocols[protocol]) {
                    result[protocol] = true
                }
            }
        }

        return result
    }

    _generateSequenceParam(url, key) {
        let param = url.get(key)

        if (param.get('format') !== 'sequence') {
            return param.generate()
        }

        let schema = param.getJSONSchema()

        if (!schema['x-sequence']) {
            return param.generate()
        }

        for (let sub of schema['x-sequence']) {
            if (sub['x-title']) {
                sub.enum = [ '{' + sub['x-title'] + '}' ]
            }
        }

        let generated = param.generate(false, schema)
        return generated
    }

    _formatURIParameters(param, target) {
        let result = {}
        let version = null
        if (param.get('format') !== 'sequence') {
            return [ result, version ]
        }

        let schema = param.getJSONSchema()

        if (!schema['x-sequence']) {
            return [ result, version ]
        }

        result[target] = {}
        let index = 0
        for (let sub of schema['x-sequence']) {
            if (sub['x-title']) {
                if (sub['x-title'] === 'version') {
                    version = param.generate(false, sub)
                }
                else {
                    let named = this._convertJSONSchemaToNamedParameter(sub)

                    if (param.getIn([ 'value', index, 'description' ])) {
                        named[sub['x-title']].description = param.getIn([
                            'value', index, 'description'
                        ])
                    }
                    Object.assign(result[target], named)
                }
            }
            index += 1
        }

        return [ result, version ]
    }

    _convertJSONSchemaToNamedParameter(schema) {
        let named = {}

        let validFields = {
            'x-title': 'displayName',
            type: 'type',
            enum: 'enum',
            pattern: 'pattern',
            minimumLength: 'minLength',
            maximumLength: 'maxLength',
            minimum: 'minimum',
            maximum: 'maximum',
            default: 'default'
        }

        let keys = Object.keys(schema)
        for (let key of keys) {
            if (
                validFields[key] &&
                schema[key] !== null &&
                typeof schema[key] !== 'undefined'
            ) {
                named[validFields[key]] = schema[key]
            }
        }

        let param = {}

        if (named.type === 'array') {
            delete named.type
            if (schema.items) {
                named.description =
                    'Type: array.\n' +
                    'Warning: server implementation may not support repeated ' +
                    'parameters. This parameter should respect the following ' +
                    'schema: \n' +
                    '```\n' +
                    JSON.stringify(schema, null, '  ') +
                    '\n```'
            }
        }

        if (schema['x-title'] === 'schema' && named.default) {
            param.schema = named.default
        }
        else if (schema.$ref) {
            param.schema = schema.$ref
        }
        else {
            param[schema['x-title'] || null] = named
        }
        return param
    }

    _convertParameterToNamedParameter(param, removeRequired = false) {
        let schema = param.getJSONSchema(false, false)
        let named = this._convertJSONSchemaToNamedParameter(schema)

        if (named.schema) {
            return named
        }

        if (named && Object.keys(named).length > 0) {
            let name = Object.keys(named)[0]
            let content = named[name]

            if (typeof content === 'object') {
                let externalValidFields = {
                    example: 'example',
                    description: 'description'
                }

                if (!removeRequired) {
                    externalValidFields.required = 'required'
                }

                let keys = Object.keys(externalValidFields)
                for (let key of keys) {
                    if (
                        typeof param.get(key) !== 'undefined' &&
                        param.get(key) !== null
                    ) {
                        content[externalValidFields[key]] = param.get(key)
                    }
                }
            }

            named[name] = content
        }

        let key = param.get('key')
        if (!key) {
            let content = named[key]
            if (typeof content === 'undefined') {
                content = null
            }
            return content
        }

        return named
    }

    _formatSecuritySchemes(requests) {
        let securityMap = {}
        let authMap = new Immutable.OrderedMap()

        authMap = authMap
            .set(Auth.OAuth2, this._formatOAuth2)
            .set(Auth.OAuth1, this._formatOAuth1)
            .set(Auth.Digest, this._formatDigest)
            .set(Auth.Basic, this._formatBasic)

        requests.forEach(request => {
            let auths = request.get('auths')
            auths.forEach(auth => {
                if (auth === null) {
                    return
                }

                let rule = authMap.get(auth.constructor)
                if (rule) {
                    Object.assign(securityMap, rule(auth))
                }
            })
        })

        let security = Object.keys(securityMap).map(key => {
            let s = {}
            s[key] = securityMap[key]
            return s
        })

        if (security.length > 0) {
            return {
                securitySchemes: security
            }
        }

        return {}
    }

    _formatOAuth2(auth) {
        let flowMap = {
            accessCode: 'code',
            implicit: 'token',
            application: 'owner',
            password: 'credentials'
        }

        let formatted = {
            type: 'OAuth 2.0'
        }

        let authorizationUri = auth.get('authorizationUrl')
        let accessTokenUri = auth.get('tokenUrl')
        let authorizationGrants = flowMap[auth.get('flow')]

        let settings = {
            authorizationUri: authorizationUri || '',
            accessTokenUri: accessTokenUri || '',
            authorizationGrants: [ authorizationGrants ]
        }

        if (auth.get('description')) {
            formatted.description = auth.get('description')
        }

        formatted.settings = settings

        let name = auth.get('authName') || 'oauth_2_0'

        let result = {}
        result[name] = formatted

        return result
    }

    _formatOAuth1(auth) {
        let formatted = {
            type: 'OAuth 1.0'
        }

        let keys = auth.keys()

        let settings = {}
        for (let key of keys) {
            if (auth.get(key) && key !== '_model') {
                settings[key] = auth.get(key)
            }
        }

        if (Object.keys(settings).length > 0) {
            formatted.settings = settings
        }

        if (auth.get('description')) {
            formatted.description = auth.get('description')
        }

        let name = auth.get('name') || 'oauth_1_0'

        let result = {}
        result[name] = formatted

        return result
    }

    _formatDigest(auth) {
        let formatted = {
            type: 'Digest Authentication'
        }

        if (auth.get('description')) {
            formatted.description = auth.get('description')
        }

        let name = auth.get('name') || 'digest'

        let result = {}
        result[name] = formatted

        return result
    }

    _formatBasic(auth) {
        let formatted = {
            type: 'Basic Authentication'
        }

        if (auth.get('description')) {
            formatted.description = auth.get('description')
        }

        let name = auth.get('name') || 'basic'

        let result = {}
        result[name] = formatted

        return result
    }

    _formatPaths(requests) {
        let paths = new Immutable.Map()
        requests.forEach(request => {
            let url = request.get('url')
            let _path = this._generateSequenceParam(url, 'pathname')

            let fragments = _path.split('/').slice(1).map(fragment => {
                return '/' + fragment
            })
            let content = Immutable.fromJS(this._formatRequest(request))

            let skeleton = {}
            fragments.reduce((obj, fragment) => {
                obj[fragment] = obj[fragment] || {}
                let params = this._formatURIParametersForFragment(fragment, url)
                Object.assign(obj[fragment], params)
                return obj[fragment]
            }, skeleton)

            let path = (new Immutable.Map()).setIn(fragments, content)
            paths = paths
                .mergeDeep(path)
                .mergeDeep(Immutable.fromJS(skeleton))
        })

        return paths.toJS()
    }

    _formatURIParametersForFragment(fragment, url) {
        let param = url.get('pathname')
        let match = fragment.match(/{.*?}/g)
        if (!match ||
            param.get('format') !== 'sequence' ||
            param.get('type') !== 'string' ||
            !param.get('value')
        ) {
            return {}
        }

        let [ path ] = this._formatURIParameters(
            url.get('pathname'),
            'uriParameters'
        )

        let content = {}

        match.forEach(block => {
            let name = block.slice(1, -1)
            let value = path.uriParameters[name]
            if (value) {
                content[name] = value
            }
        })

        return {
            uriParameters: content
        }
    }

    _formatRequest(request) {
        let method = request.get('method')

        if (method === null) {
            return {}
        }

        let result = {}
        let formatted = {}

        if (request.get('description')) {
            formatted.description = request.get('description')
        }

        let bodies = request.get('bodies')
        let container = request.get('parameters')
        let params = this._formatParameters(container)
        let body = this._formatBody(container, bodies)
        let responses = ::this._formatResponses(request.get('responses'))
        let auths = this._formatAuths(request.get('auths'))

        let url = request.get('url')
        let [ base ] = this._formatURIParameters(
            url.get('host'),
            'baseUriParameters'
        )

        Object.assign(formatted, params, body, base, responses, auths)

        result[method] = formatted

        return result
    }

    _formatParameters(container) {
        let headers = container.get('headers')
        let queries = container.get('queries')

        let result = {}
        if (headers.size > 0) {
            result.headers = this._formatHeaders(headers)
        }

        if (queries.size > 0) {
            result.queryParameters = this._formatQueries(queries)
        }

        return result
    }

    _formatHeaders(headers) {
        let result = {}

        headers.forEach(param => {
            let named = this._convertParameterToNamedParameter(param)
            Object.assign(result, named)
        })

        return result
    }

    _formatQueries(queries) {
        let result = {}

        queries.forEach(param => {
            let named = this._convertParameterToNamedParameter(param)
            let name = Object.keys(named)[0]
            let _param = result[name]
            if (_param) {
                if (
                    _param.enum &&
                    _param.enum.length === 1 &&
                    _param.enum[0] === _param.default
                ) {
                    delete _param.enum
                }
                _param.repeat = true
            }
            else {
                Object.assign(result, named)
            }
        })

        return result
    }

    _formatBody(container, bodies) {
        let result = {}
        let _body = {}
        bodies.forEach(body => {
            let filtered = body.filter(container)

            let constraint = this._getContentTypeConstraint(body)
            if (!constraint) {
                return
            }

            if (
                constraint === 'application/x-www-form-urlencoded' ||
                constraint === 'multipart/form-data'
            ) {
                _body[constraint] = {
                    formParameters: {}
                }
                let params = filtered.get('body')
                params.forEach(param => {
                    let named = this._convertParameterToNamedParameter(param)
                    let name = Object.keys(named)[0]
                    let _param = _body[constraint].formParameters[name]
                    if (_param) {
                        if (
                            _param.enum &&
                            _param.enum.length === 1 &&
                            _param.enum[0] === _param.default
                        ) {
                            delete _param.enum
                        }
                        _param.repeat = true
                    }
                    else {
                        Object.assign(_body[constraint].formParameters, named)
                    }
                })
            }
            else {
                _body[constraint] = {}
                let params = filtered.get('body')
                params.forEach(param => {
                    let named = this._formatBodyParam(param)

                    if (named.schema) {
                        Object.assign(_body[constraint], named)
                    }
                })
            }
        })

        if (Object.keys(_body).length > 0) {
            result.body = _body
        }
        return result
    }

    _formatBodyParam(param) {
        if (param.get('type') === 'reference') {
            let ref = param.get('value')
            if (this._isInlineRef(ref)) {
                return {
                    schema: JSON.stringify(ref.get('value'), null, '  ')
                }
            }
            else {
                let uri = ref.get('relative') || ref.get('uri')
                return {
                    schema: uri
                }
            }
        }

        let named = this._convertParameterToNamedParameter(
            param, true
        )
        return named
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

    _getContentTypeConstraint(body) {
        let constraints = body.get('constraints')
        let contentTypeConstraint = null
        constraints.forEach(_constraint => {
            if (_constraint.get('key') === 'Content-Type') {
                contentTypeConstraint = _constraint.get('value')
            }
        })

        return contentTypeConstraint
    }

    _formatSchemas(references) {
        let schemas = {}
        references.forEach(container => {
            container.get('cache').forEach((cache) => {
                let ref = cache.getReference()
                if (ref instanceof JSONSchemaReference) {
                    let value = ref.get('value')
                    if (!value) {
                        value = '!include ' + ref.get('relative')
                    }
                    else {
                        value = JSON.stringify(ref.toJSONSchema(), null, '  ')
                    }
                    let uri = ref.get('relative')
                    if (uri) {
                        schemas[uri] = value
                    }
                }
                else {
                    let uri = ref.get('relative')
                    let value = ref.get('value')
                    if (typeof value !== 'string') {
                        value = JSON.stringify(value, null, '  ')
                    }
                    schemas[uri] = JSON.stringify({
                        type: 'string',
                        default: value
                    }, null, '  ')
                }
            })
        })

        if (Object.keys(schemas).length === 0) {
            return {}
        }

        return {
            schemas: [ schemas ]
        }
    }

    _formatResponses(_responses) {
        let responses = {}
        _responses.forEach(response => {
            let code = response.get('code')
            let bodies = response.get('bodies')
            let container = response.get('parameters')

            let removeRequired = true
            let formatted = this._formatBody(container, bodies, removeRequired)
            let content
            if (formatted.body) {
                content = formatted
            }
            else {
                content = {}
            }

            if (response.get('description')) {
                content.description = response.get('description')
            }

            let match = (code + '').match(/^([0-9]{3})/)
            if (match) {
                responses[match[1]] = content
            }
        })

        if (Object.keys(responses).length > 0) {
            return {
                responses: responses
            }
        }

        return {}
    }

    _formatAuths(auths) {
        if (auths.size === 0) {
            return {}
        }

        let securedBy = []
        auths.forEach(auth => {
            if (auth === null) {
                securedBy.push(null)
            }
            else if (auth instanceof Auth.Basic) {
                securedBy.push('basic')
            }
            else if (auth instanceof Auth.Digest) {
                securedBy.push('digest')
            }
            else if (auth instanceof Auth.OAuth1) {
                securedBy.push('oauth_1_0')
            }
            else if (auth instanceof Auth.OAuth2) {
                let scopes = auth.get('scopes')
                let content
                if (scopes && scopes.size > 0) {
                    content = {}
                    content.oauth_2_0 = {
                        scopes: (scopes || []).map(scope => {
                            return scope.get('value')
                        })
                    }
                }
                else {
                    content = 'oauth_2_0'
                }
                securedBy.push(content)
            }
        })

        return {
            securedBy: securedBy
        }
    }
}
