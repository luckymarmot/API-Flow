import Immutable from 'immutable'
import yaml from 'js-yaml'

import Request from '../../models/Request'
import BaseSerializer from '../BaseSerializer'
import Auth from '../../models/Auth'
import URL from '../../models/URL'

export default class RAMLSerializer extends BaseSerializer {
    serialize(context) {
        let content = '#%RAML 0.8\n'
        let structure = this._formatStructure(context)

        content += yaml.dump(structure)

        return content
    }

    _formatStructure(context) {
        let structure = {}
        let basicInfo = this._formatBasicInfo(context)

        let group = context.get('group')
        let urlInfo = {}
        let securitySchemes = {}
        let paths = {}

        if (group) {
            let requests = group.getRequests()
            urlInfo = ::this._formatURLInfo(requests)
            securitySchemes = ::this._formatSecuritySchemes(requests)
            paths = ::this._formatPaths(group)
        }

        Object.assign(structure, basicInfo, urlInfo, securitySchemes, paths)

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
            let protocol = protocols[0] || 'http'
            origin = protocol + '://' + host
            let [ _base, _version ] = this._formatURIParameters(
                    url.get('host'),
                    'baseUriParameters'
                )

            base = _base || {}
            version = _version
        }

        if (protocols.length > 0) {
            urlInfo.protocols = protocols
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
        for (let sub of schema['x-sequence']) {
            if (sub['x-title']) {
                if (sub['x-title'] === 'version') {
                    version = param.generate(false, sub)
                }
                else {
                    let named = this._convertJSONSchemaToNamedParameter(sub)
                    Object.assign(result[target], named)
                }
            }
        }

        return [ result, version ]
    }

    _convertJSONSchemaToNamedParameter(schema) {
        if (!schema['x-title']) {
            return null
        }

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
            if (validFields[key]) {
                named[validFields[key]] = schema[key]
            }
        }

        let param = {}

        if (schema['x-title'] === 'schema' && named.default) {
            param.schema = named.default
        }
        else {
            param[schema['x-title']] = named
        }
        return param
    }

    _convertParameterToNamedParameter(param) {
        let schema = param.getJSONSchema(false)
        let named = this._convertJSONSchemaToNamedParameter(schema)

        if (named && Object.keys(named).length > 0) {
            let name = Object.keys(named)[0]
            let content = named[name]

            if (typeof content === 'object') {
                let externalValidFields = {
                    required: 'required',
                    example: 'example',
                    description: 'description'
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

        let settings = {}
        if (authorizationUri) {
            settings.authorizationUri = authorizationUri
        }

        if (accessTokenUri) {
            settings.accessTokenUri = accessTokenUri
        }

        if (authorizationGrants) {
            settings.authorizationGrants = [ authorizationGrants ]
        }

        if (Object.keys(settings).length > 0) {
            formatted.settings = settings
        }

        let result = {
            oauth_2_0: formatted
        }

        return result
    }

    _formatOAuth1(auth) {
        let formatted = {
            type: 'OAuth 1.0'
        }

        let keys = auth.keys()

        let settings = {}
        for (let key of keys) {
            if (auth.get(key)) {
                settings[key] = auth.get(key)
            }
        }

        if (Object.keys(settings).length > 0) {
            formatted.settings = settings
        }

        let result = {
            oauth_1_0: formatted
        }

        return result
    }

    _formatDigest() {
        return {
            digest: {
                type: 'Digest Authentication'
            }
        }
    }

    _formatBasic() {
        return {
            basic: {
                type: 'Basic Authentication'
            }
        }
    }

    _formatPaths(group) {
        if (group instanceof Request) {
            return this._formatRequest(group)
        }

        let result = {}

        let relativeURI = group.get('name')
        let children = group.get('children')

        if (relativeURI === null) {
            return {}
        }

        result[relativeURI] = {}
        children.forEach((child) => {
            Object.assign(result[relativeURI], this._formatPaths(child))
        })

        return result
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

        let url = request.get('url')
        let base = this._formatURIParameters(
            url.get('host'),
            'baseUriParameters'
        )

        let path = this._formatURIParameters(
            url.get('pathname'),
            'uriParameters'
        )

        Object.assign(formatted, params, body, base, path)

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
            Object.assign(result, named)
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
                constraint === 'application/x-www-urlencoded' ||
                constraint === 'multipart/form-data'
            ) {
                _body[constraint] = {
                    formParameters: {}
                }
                let params = filtered.get('body')
                params.forEach(param => {
                    let named = this._convertParameterToNamedParameter(param)
                    Object.assign(_body[constraint].formParameters, named)
                })
            }
            else {
                _body[constraint] = {}
                let params = filtered.get('body')
                params.forEach(param => {
                    let named = this._convertParameterToNamedParameter(param)
                    Object.assign(_body[constraint], named)
                })
            }
        })

        if (Object.keys(_body).length > 0) {
            result.body = _body
        }

        return result
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
}
