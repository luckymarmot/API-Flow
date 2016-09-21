import Immutable from 'immutable'

import BaseSerializer from '../BaseSerializer'

import Auth from '../../models/Auth'

import JSONSchemaReference from '../../models/references/JSONSchema'
import LateResolutionReference from '../../models/references/LateResolution'

export default class CurlSerializer extends BaseSerializer {
    serialize(context) {
        let content = this._formatContent(context)
        return content
    }

    validate(text) {
        if (text.split('\n').length < 10) {
            return 'generated file of poor quality'
        }
    }

    _formatContent(context) {
        let [ startInfo, endInfo ] = this._formatInfo(context)
        let group = this._formatGroup(context.get('group'))
        let references = this._formatReferences(context.get('references'))

        let formatted = [
            startInfo,
            group,
            references,
            endInfo
        ].filter(content => {
            return !!content
        })

        return formatted.join('\n\n')
    }

    _formatInfo(context) {
        let info = context.get('info').toJS()

        let beginFormatted = []
        let endFormatted = []
        if (info.title) {
            beginFormatted.push('# ' + info.title)
        }
        else {
            beginFormatted.push('# API')
        }

        if (info.description) {
            beginFormatted.push('## Description\n' + info.description)
        }

        if (info.tos) {
            endFormatted.push('## Terms of Service\n' + info.tos)
        }

        if (info.contact && Object.keys(info.contact).length > 0) {
            endFormatted.push(
                this._formatContact(info.contact)
            )
        }

        if (info.license && Object.keys(info.license).length > 0) {
            endFormatted.push(
                this._formatLicense(info.license)
            )
        }

        return [ beginFormatted.join('\n\n'), endFormatted.join('\n\n') ]
    }

    _formatContact(contact) {
        let formatted = [ '## Contact' ]
        if (contact.name) {
            formatted.push('- **Name:** ' + contact.name)
        }

        if (contact.url) {
            formatted.push('- **URL:** ' + contact.url)
        }

        if (contact.email) {
            formatted.push('- **Email:** ' + contact.email)
        }

        if (formatted.length < 2) {
            return ''
        }

        return formatted.join('\n')
    }

    _formatLicense(license) {
        let formatted = [ '## License' ]
        if (license.name) {
            formatted.push('- **Name:** ' + license.name)
        }

        if (license.url) {
            formatted.push('- **URL:** ' + license.url)
        }

        if (formatted.length < 2) {
            return ''
        }

        return formatted.join('\n')
    }

    _formatGroup(group) {
        if (!group) {
            return ''
        }

        let requests = group.getRequests()

        let formatted = []
        requests.forEach(request => {
            let formattedReq = this._formatRequest(request)
            formatted.push(formattedReq)
        })

        if (formatted.length > 0) {
            return '## Requests\n\n' + formatted.join('\n\n')
        }

        return ''
    }

    _formatRequest(request) {
        let formatted = []

        let name = this._formatName(request)
        formatted.push(name)

        let description = this._formatDescription(request)
        if (description) {
            formatted.push(description)
        }

        let curl = this._formatCurlCommand(request)
        formatted.push(curl)

        let parameters = this._formatParameterDescriptions(request)
        if (parameters) {
            formatted.push(parameters)
        }

        let authDescription = this._formatAuthDescription(request)
        if (authDescription) {
            formatted.push(authDescription)
        }

        let responses = this._formatResponses(request)
        if (responses) {
            formatted.push(responses)
        }

        return formatted.join('\n\n')
    }

    _formatName(req) {
        let method = (req.get('method') || 'GET').toUpperCase()
        let path = this._formatURLBlock(req.get('url'), 'pathname')

        if (path) {
            return '### **' + method + '** - ' + path
        }

        return '### **' + method + '** - ?'
    }

    _formatDescription(req) {
        let description = req.get('description')

        if (description) {
            return '#### Description\n' + description
        }

        return ''
    }

    _formatCurlCommand(req) {
        let formatted = []
        let offset = '    '

        let url = this._formatURL(req, offset)
        let method = (req.get('method') || 'GET').toUpperCase()

        let curlLine = 'curl -X ' + method + ' ' + url + ' \\'
        formatted.push(curlLine)

        let container = req.get('parameters')
        let bodies = req.get('bodies')
        if (bodies.size > 0) {
            container = bodies.get(0).filter(container)
        }

        let headers = this._formatHeaders(container, offset)
        if (headers) {
            formatted.push(headers)
        }

        let body = this._formatBody(container, offset)
        if (body) {
            formatted.push(body)
        }

        let auths = this._formatAuths(req)
        if (auths) {
            formatted.push(auths)
        }

        return '#### CURL\n\n' +
            '```sh\n' + formatted.join('\n').slice(0, -2) + '\n```'
    }

    _formatURLBlock(url, blockName) {
        let param = url.get(blockName)
        if (
            param &&
            param.get('type') === 'string' &&
            param.get('format') === 'sequence'
        ) {
            let keyValuePair = this._formatParam(param)
            return keyValuePair[1]
        }
        else {
            return url.generateParam(blockName)
        }
    }

    _formatURL(req) {
        let url = req.get('url')
        let formattedList = []
        let blocks = [ 'protocol', 'host', 'pathname' ]
        for (let block of blocks) {
            let formattedBlock = this._formatURLBlock(url, block)
            formattedList.push(formattedBlock)
        }

        let protocol = formattedList[0]
        let host = formattedList[1]
        let path = formattedList[2]

        let origin = ''

        if (protocol || host) {
            origin += protocol + '://' + host
        }

        let formatted = origin + path

        let queries = this._formatQueries(req)
        if (queries) {
            formatted += '\\\n' + queries
        }

        return '"' + formatted + '"'
    }

    _formatQueries(req) {
        let container = req.get('parameters')
        let bodies = req.get('bodies')
        if (bodies.size > 0) {
            container = bodies.get(0).filter(container)
        }

        let queries = []
        container.get('queries').forEach(query => {
            let [ k, v ] = this._formatParam(query, '=', false)

            let content = ''
            if (k) {
                content = encodeURIComponent(k) + '='
            }

            let match = v.match(/^\$.*$/)
            if (match) {
                content += '$' + encodeURIComponent(v.slice(1))
            }
            else {
                content += encodeURIComponent(v)
            }
            queries.push(content)
        })

        let queryLines = []
        let line = ''
        for (let query of queries) {
            let tmp = line + '&' + query
            if (tmp.length > 80) {
                queryLines.push(line)
                line = '&' + query
            }
            else {
                line = tmp
            }
        }

        queryLines.push(line)

        let formatted = queryLines.join('\\\n')

        if (formatted) {
            return '?' + formatted.slice(1)
        }
        return formatted
    }

    _formatHeaders(container, offset) {
        let headers = container.get('headers')

        let formatted = []
        headers.forEach(param => {
            let header = this._formatHeader(param)
            formatted.push(offset + header)
        })

        return formatted.join('\n')
    }

    _formatHeader(param) {
        let [ key, value ] = this._formatParam(param, ': ', false)

        let header
        if (key) {
            header = '"' + key + ': ' + value + '"'
        }
        else {
            header = '": ' + value + '"'
        }

        return '-H ' + header + ' \\'
    }

    _formatBody(container, offset) {
        let headers = container.getHeadersSet()

        let contentType = headers.get('Content-Type')

        let option
        if (contentType === 'multipart/form-data') {
            option = '-F'
        }
        else {
            option = '--data-raw'
        }

        let body = container.get('body')

        let formatted = []
        body.forEach(param => {
            let kv = this._formatBodyParam(option, param)
            formatted.push(offset + kv)
        })

        return formatted.join('\n')
    }

    _formatParam(param, separator = '=', dropBodyKeys = false) {
        if (!param) {
            return [ null, '$unnamed' ]
        }

        let type = param.get('type')

        if (type === 'reference') {
            return this._formatReferenceParam(param, separator, dropBodyKeys)
        }

        if (type === 'array') {
            return this._formatArrayParam(param, separator, dropBodyKeys)
        }

        if (type === 'multi') {
            return this._formatMultiParam(param, separator, dropBodyKeys)
        }

        if (type === 'string' && param.get('format') === 'sequence') {
            let formatted = this
                ._formatSequenceParam(param, separator, dropBodyKeys)
            return formatted
        }

        return this._formatSimpleParam(param, separator, dropBodyKeys)
    }

    _formatReferenceParam(param, separator = '=', dropBodyKeys = false) {
        if (!param) {
            return [ null, '$unnamed' ]
        }

        let key = param.get('key')
        let _key = key ? this._escape(key) : null

        let name = param.get('key') || param.get('name') || 'unnamed'

        if (dropBodyKeys && (key === 'body' || key === 'schema')) {
            _key = null
        }

        return [ _key, '$' + name ]
    }

    _formatArrayParam(param, separator = '=', dropBodyKeys = false) {
        if (!param) {
            return [ null, '$unnamed' ]
        }

        let key = param.get('key')
        let _key = key ? this._escape(key) : null
        let array = param.get('value')

        let formatted = []
        if (array instanceof Immutable.List) {
            array.forEach(sub => {
                let [ k, v ] = this
                ._formatParam(sub, separator, dropBodyKeys)

                let content
                if (k) {
                    content += k + separator
                }

                content += v
                formatted.push(content)
            })

            if (dropBodyKeys && (key === 'body' || key === 'schema')) {
                _key = null
            }

            return [ _key, '[ ' + formatted.join(' AND ') + ' ]' ]
        }
        else {
            let _value = _key === null ? '$unnamed' : '$' + _key
            return [ _key, _value ]
        }
    }

    _formatMultiParam(param, separator = '=', dropBodyKeys = false) {
        if (!param) {
            return [ null, '(  )' ]
        }

        let key = param.get('key')
        let _key = key !== null ? this._escape(key) : null
        let array = param.get('value')

        let formatted = []

        if (!array) {
            array = new Immutable.List()
        }

        array.forEach(sub => {
            let [ k, v ] = this
                ._formatParam(sub, separator, dropBodyKeys)

            let content = ''
            if (k) {
                content += k + separator
            }

            content += v
            formatted.push(content)
        })

        if (dropBodyKeys && (key === 'body' || key === 'schema')) {
            _key = null
        }

        return [ _key, '( ' + formatted.join(' OR ') + ' )' ]
    }

    _formatSequenceParam(param, separator = '=', dropBodyKeys = false) {
        if (!param) {
            return [ null, '$unnamed' ]
        }

        let key = param.get('key')
        let _key = key ? this._escape(key) : null

        if (dropBodyKeys && (key === 'body' || key === 'schema')) {
            _key = null
        }

        let value = param.get('value')
        let formatted = []
        if (value) {
            value.forEach(sub => {
                let kvPair = this._formatParam(sub, separator, dropBodyKeys)

                formatted.push(kvPair[1])
            })
        }

        let _value = formatted.join('')
        if (!_value) {
            _value = _key === null ? '$unnamed' : '$' + _key
        }
        return [ _key, _value ]
    }

    _formatSimpleParam(param, separator = '=', dropBodyKeys = false) {
        if (!param) {
            return [ null, '$unnamed' ]
        }

        let key = param.get('key')
        let _key = key ? this._escape(key) : null

        if (dropBodyKeys && (key === 'body' || key === 'schema')) {
            _key = null
        }

        let value = param.get('value')
        let _value
        if (!value) {
            _value = _key === null ? '$unnamed' : '$' + _key
        }
        else if (typeof value === 'object') {
            _value = this._escape(JSON.stringify(value))
        }
        else {
            _value = this._escape(value + '')
        }

        return [ _key, _value ]
    }

    _formatBodyParam(option, param) {
        let [ key, value ] = this._formatParam(param, '=', true)

        let _param = key ? '"' + key + '"="' + value + '"' : '"' + value + '"'
        return option + ' ' + _param + ' \\'
    }

    _formatParameterDescriptions(req, headerType = 4) {
        let headerStr = ''
        for (let i = 0; i < headerType; i += 1) {
            headerStr += '#'
        }
        let container = req.get('parameters')
        let bodies = req.get('bodies')
        if (bodies.size > 0) {
            container = bodies.get(0).filter(container)
        }

        let hostDescriptions = this._formatHostParams(req)

        let pathDescriptions = []
        container.get('path').forEach(param => {
            let formatted = this._formatParamDescription(param)
            if (formatted) {
                pathDescriptions.push(formatted)
            }
        })

        let queryDescriptions = []
        container.get('queries').forEach(param => {
            let formatted = this._formatParamDescription(param)
            if (formatted) {
                queryDescriptions.push(formatted)
            }
        })

        let headerDescriptions = []
        container.get('headers').forEach(param => {
            let formatted = this._formatParamDescription(param)
            if (formatted) {
                headerDescriptions.push(formatted)
            }
        })

        let bodyDescriptions = []
        container.get('body').forEach(param => {
            let formatted = this._formatParamDescription(param)
            if (formatted) {
                bodyDescriptions.push(formatted)
            }
        })

        let formatted = []
        if (hostDescriptions.length > 0) {
            let host = headerStr + ' Host Parameters\n\n' +
                hostDescriptions.join('\n')
            formatted.push(host)
        }

        if (pathDescriptions.length > 0) {
            let path = headerStr + ' Path Parameters\n\n' +
                pathDescriptions.join('\n')
            formatted.push(path)
        }

        if (queryDescriptions.length > 0) {
            let query = headerStr + ' Query Parameters\n\n' +
                queryDescriptions.join('\n')
            formatted.push(query)
        }

        if (headerDescriptions.length > 0) {
            let header = headerStr + ' Header Parameters\n\n' +
                headerDescriptions.join('\n')
            formatted.push(header)
        }

        if (bodyDescriptions.length > 0) {
            let body = headerStr + ' Body Parameters\n\n' +
                bodyDescriptions.join('\n')
            formatted.push(body)
        }

        return formatted.join('\n\n')
    }

    _formatHostParams(req) {
        let hostParams = []
        let host = req.getIn([ 'url', 'host' ])

        if (
            host &&
            host.get('type') === 'string' &&
            host.get('format') === 'sequence'
        ) {
            let sequence = host.get('value')
            sequence.forEach(sub => {
                if (sub.get('key') !== null) {
                    let formatted = this._formatParamDescription(sub)
                    if (formatted) {
                        hostParams.push(formatted)
                    }
                }
            })
        }

        return hostParams
    }

    _formatParamDescription(param) {
        let name = param.get('key') || param.get('name') || 'unnamed'

        let value = param.getJSONSchema(false, false)
        delete value['x-title']

        return '- **' + name + '** should respect the following schema:\n\n' +
            '```\n' +
            JSON.stringify(value, null, '  ') + '\n' +
            '```'
    }

    _formatAuths(req) {
        let auths = req.get('auths')

        if (auths.size > 0) {
            let auth = auths.get(0)

            if (auth instanceof Auth.Basic) {
                let username = this._escape(auth.get('username')) || '$username'
                let password = this._escape(auth.get('password')) || '$password'
                return '-u "' + username + '":"' + password + '" \\'
            }

            if (auth instanceof Auth.Digest) {
                let username = this._escape(auth.get('username')) || '$username'
                let password = this._escape(auth.get('password')) || '$password'
                return '--digest -u "' + username + '":"' + password + '" \\'
            }

            if (auth instanceof Auth.NTLM) {
                let username = this._escape(auth.get('username')) || '$username'
                let password = this._escape(auth.get('password')) || '$password'
                return '--ntlm -u "' + username + '":"' + password + '" \\'
            }

            if (auth instanceof Auth.Negotiate) {
                let username = this._escape(auth.get('username')) || '$username'
                let password = this._escape(auth.get('password')) || '$password'
                return '--negotiate -u "' + username + '":"' + password + '" \\'
            }

            if (auth instanceof Auth.ApiKey) {
                if (auth.get('in') === 'header') {
                    let name = this._escape(auth.get('name') || '')
                    let key = this._escape(auth.get('key') || '')
                    if (!key) {
                        key = '$' + name
                    }
                    return '-H "' + name + ': ' + key + '" \\'
                }
            }

            return ''
        }
        else {
            return ''
        }
    }

    _formatAuthDescription(req) {
        let auths = req.get('auths')

        if (auths.size > 0) {
            let formatted = [ '#### Security\n' ]
            auths.forEach(auth => {
                let msg
                if (auth === null) {
                    msg = '- No Authentication'
                }
                else if (auth instanceof Auth.Basic) {
                    let username =
                        this._escape(auth.get('username')) || '$username'
                    let password =
                        this._escape(auth.get('password')) || '$password'
                    msg = '- Basic Authentication'
                    msg += '\n  - **username**: ' + username
                    msg += '\n  - **password**: ' + password
                }
                else if (auth instanceof Auth.Digest) {
                    let username =
                        this._escape(auth.get('username')) || '$username'
                    let password =
                        this._escape(auth.get('password')) || '$password'
                    msg = '- Digest Authentication'
                    msg += '\n  - **username**: ' + username
                    msg += '\n  - **password**: ' + password
                }
                else if (auth instanceof Auth.NTLM) {
                    let username =
                        this._escape(auth.get('username')) || '$username'
                    let password =
                        this._escape(auth.get('password')) || '$password'
                    msg = '- NTLM Authentication'
                    msg += '\n  - **username**: ' + username
                    msg += '\n  - **password**: ' + password
                }
                else if (auth instanceof Auth.Negotiate) {
                    let username =
                        this._escape(auth.get('username')) || '$username'
                    let password =
                        this._escape(auth.get('password')) || '$password'
                    msg = '- Negotiate Authentication'
                    msg += '\n  - **username**: ' + username
                    msg += '\n  - **password**: ' + password
                }
                else if (auth instanceof Auth.ApiKey) {
                    let name = auth.get('name') || '$name'
                    let key = auth.get('key') || ''
                    msg = '- API Key Authentication'
                    msg += '\n  - **location**: ' + auth.get('in')
                    msg += '\n  - **name**: ' + name
                    msg += '\n  - **key**: ' + key
                }
                else if (auth instanceof Auth.OAuth1) {
                    let infos = [
                        'tokenCredentialsUri',
                        'requestTokenUri',
                        'authorizationUri'
                    ]

                    msg = '- OAuth1 Authentication'
                    for (let info of infos) {
                        let data = auth.get(info)
                        if (data) {
                            msg += '\n  - **' + info + '**: ' + data
                        }
                    }
                }
                else if (auth instanceof Auth.OAuth2) {
                    let infos = [
                        'flow',
                        'authorizationUrl',
                        'tokenUrl',
                        'scopes'
                    ]

                    msg = '- OAuth2 Authentication'
                    for (let info of infos) {
                        let data = auth.get(info)
                        if (data) {
                            msg += '\n  - **' + info + '**: ' + data
                        }
                    }
                }
                else if (auth instanceof Auth.Hawk) {
                    let infos = [
                        'id',
                        'key',
                        'algorithm'
                    ]

                    msg = '- Hawk Authentication'
                    for (let info of infos) {
                        let data = auth.get(info)
                        if (data) {
                            msg += '\n  - **' + info + '**: ' + data
                        }
                    }
                }
                else if (auth instanceof Auth.AWSSig4) {
                    let infos = [
                        'key',
                        'secret',
                        'region',
                        'service'
                    ]

                    msg = '- AWS Signature 4 Authentication'
                    for (let info of infos) {
                        let data = auth.get(info)
                        if (data) {
                            msg += '\n  - **' + info + '**: ' + data
                        }
                    }
                }
                formatted.push(msg)
            })

            return formatted.join('\n')
        }
        else {
            return ''
        }
    }

    _formatResponses(request) {
        let responses = request.get('responses')

        let formatted = []
        responses.forEach(response => {
            let formattedResponse = this._formatResponse(response)
            formatted.push(formattedResponse)
        })

        if (formatted.length > 0) {
            return '#### Responses\n\n' + formatted.join('\n\n')
        }

        return ''
    }

    _formatResponse(response) {
        let formatted = []

        let code = response.get('code')
        let header = '##### Code\n\n- **' + code + '**'

        let description = response.get('description')
        if (description) {
            header += ': ' + description
        }
        formatted.push(header)

        let headerType = 5
        let parameters = this._formatParameterDescriptions(response, headerType)
        if (parameters) {
            formatted.push(parameters)
        }

        return formatted.join('\n\n')
    }

    _formatReferences(references) {
        let formatted = []

        if (references.size > 0) {
            formatted.push('## References')
        }

        references.forEach((container) => {
            formatted.push(this._formatReferenceContainer(container))
        })

        return formatted.join('\n\n')
    }

    _formatReferenceContainer(container) {
        let formatted = []
        let cache = container.get('cache')

        if (cache.size > 0) {
            let name =
                container.get('name') ||
                container.get('id') ||
                'Container'
            let header = '### ' + name
            formatted.push(header)
        }

        cache.forEach((value, uri) => {
            let resolved = container.resolve(uri)
            formatted.push(this._formatReference(resolved))
        })

        return formatted.join('\n\n')
    }

    _formatReference(reference) {
        let value = reference.get('value')
        let relative = reference.get('relative') || reference.get('uri')

        let content = ''
        if (reference instanceof JSONSchemaReference) {
            value = reference.toJSONSchema()
            content = '```\n' + JSON.stringify(value, null, '  ') + '\n```'
        }
        else if (reference instanceof LateResolutionReference) {
            content =
                'Replace `{{.*}}` by the corresponding ' +
                'reference in this doc.\n' +
                '```\n' + value + '\n```'
        }
        else {
            content = '```\n' + value + '\n```'
        }

        return '#### ' + relative + '\n' + content
    }

    // NOTE: not sure this works as expected
    _escape(string) {
        if (typeof string === 'string') {
            return string
                .replace(/\\/, '\\')
                .replace(/\$/, '\$')
                .replace(/"/, '\"')
        }
        else {
            return string
        }
    }
}
