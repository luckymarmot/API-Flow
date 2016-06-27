import Immutable from 'immutable'

import BaseSerializer from '../BaseSerializer'

import Group from '../../models/Group'
import Request from '../../models/Request'
import Auth from '../../models/Auth'
import Reference from '../../models/references/Reference'

export default class CurlSerializer extends BaseSerializer {
    serialize(context) {
        let content = this._formatContent(context)
        return content
    }

    _formatContent(context) {
        let [ startInfo, endInfo ] = this._formatInfo(context)
        let group = this._formatGroup(context.get('group'))

        let formatted = [ startInfo, group, endInfo ].filter(content => {
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

    _formatGroup(group, depth = 0, path = '') {
        if (group instanceof Request) {
            return this._formatRequest(group)
        }

        if (group instanceof Group) {
            let formatted = []
            let name
            let _path = path

            if (group.get('name')) {
                name = group.get('name')
            }
            else if (group.get('id')) {
                name = 'Group ' + group.get('id')
            }
            else {
                name = 'Unnamed Group'
            }

            if (path) {
                _path = path + ' -> ' + name
            }
            else {
                _path = name
            }

            formatted.push('### ' + _path)

            let children = group.get('children')
            if (children) {
                children.forEach(child => {
                    let formattedChild = this
                        ._formatGroup(child, depth + 1, _path)
                    formatted.push(formattedChild)
                })
            }

            return formatted.join('\n\n')
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

        return formatted.join('\n\n')
    }

    _formatName(req) {
        let method = (req.get('method') || 'GET').toUpperCase()
        let name = req.get('name')

        if (!name) {
            name = req.get('url').href()
        }

        if (name) {
            return '#### **' + method + '** - ' + name
        }

        return '#### **' + method + '** - Unnamed Request'
    }

    _formatDescription(req) {
        let description = req.get('description')

        if (description) {
            return '##### Description\n' + description
        }

        return ''
    }

    _formatCurlCommand(req) {
        let formatted = []
        let offset = '    '

        let url = this._formatURL(req)
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

        return '```sh\n' + formatted.join('\n').slice(0, -2) + '\n```'
    }

    _formatURL(req) {
        let url = req.get('url')
        let protocol = url.generateParam('protocol') || 'http'
        let host = url.generateParam('host') || 'localhost'
        let path = url.generateParam('pathname')

        let queries = this._formatQueries(req)

        let formatted = protocol + '://' + host + path

        if (queries) {
            formatted += queries
        }
        return formatted
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

            let match = v.match(/^{{.*}}$/)
            if (match) {
                content += '{{' + encodeURIComponent(v.slice(2,-2)) + '}}'
            }
            else {
                content += encodeURIComponent(v)
            }
            queries.push(content)
        })

        let formatted = queries.join('&')
        if (formatted) {
            return '&' + formatted
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
            return [ null, '{{unnamed}}' ]
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
            return this._formatSequenceParam(param, separator, dropBodyKeys)
        }

        return this._formatSimpleParam(param, separator, dropBodyKeys)
    }

    _formatReferenceParam(param, separator = '=', dropBodyKeys = false) {
        let key = param.get('key')
        let _key = key ? this._escape(key) : null
        let ref = param.get('value')
        let value

        if (ref instanceof Reference) {
            let uri =
                ref.get('relative') ||
                ref.get('uri') ||
                param.get('name') ||
                '#/missing'

            value = this._escape(uri)
        }
        else {
            value = '#/missing'
        }

        if (dropBodyKeys && (key === 'body' || key === 'schema')) {
            _key = null
        }

        return [ _key, '{{' + value + '}}' ]
    }

    _formatArrayParam(param, separator = '=', dropBodyKeys = false) {
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
            let _value = _key === null ? '{{unnamed}}' : '{{' + _key + '}}'
            return [ _key, _value ]
        }
    }

    _formatMultiParam(param, separator = '=', dropBodyKeys = false) {
        let key = param.get('key')
        let _key = key !== null ? this._escape(key) : null
        let array = param.get('value')

        let formatted = []
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

        return [ _key, '( ' + formatted.join(' OR ') + ' )' ]
    }

    _formatSequenceParam(param, separator = '=', dropBodyKeys = false) {
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
        if (!value) {
            _value = _key === null ? '{{unnamed}}' : '{{' + _key + '}}'
        }
        return [ _key, _value ]
    }

    _formatSimpleParam(param, separator = '=', dropBodyKeys = false) {
        let key = param.get('key')
        let _key = key ? this._escape(key) : null

        if (dropBodyKeys && (key === 'body' || key === 'schema')) {
            _key = null
        }

        let value = param.get('value')
        let _value
        if (!value) {
            _value = _key === null ? '{{unnamed}}' : '{{' + _key + '}}'
        }
        else {
            if (typeof value === 'object') {
                _value = this._escape(JSON.stringify(value))
            }
            else {
                _value = this._escape(value + '')
            }
        }

        return [ _key, _value ]
    }

    _formatBodyParam(option, param) {
        let [ key, value ] = this._formatParam(param, '=', true)

        let _param = key ? '"' + key + '"="' + value + '"' : '"' + value + '"'
        return option + ' ' + _param + ' \\'
    }

    _formatParameterDescriptions(req) {
        let container = req.get('parameters')
        let bodies = req.get('bodies')
        if (bodies.size > 0) {
            container = bodies.get(0).filter(container)
        }

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
        if (pathDescriptions.length > 0) {
            let path = '##### Path Parameters\n\n' +
                pathDescriptions.join('\n')
            formatted.push(path)
        }

        if (queryDescriptions.length > 0) {
            let query = '##### Query Parameters\n\n' +
                queryDescriptions.join('\n')
            formatted.push(query)
        }

        if (headerDescriptions.length > 0) {
            let header = '##### Header Parameters\n\n' +
                headerDescriptions.join('\n')
            formatted.push(header)
        }

        if (bodyDescriptions.length > 0) {
            let body = '##### Body Parameters\n\n' +
                bodyDescriptions.join('\n')
            formatted.push(body)
        }

        return formatted.join('\n\n')
    }

    _formatParamDescription(param) {
        let name = param.get('key') || param.get('name')

        let value = param.getJSONSchema(false, false)

        return '- ' + name + ' should respect the following schema:\n\n' +
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
                    return '-H "' + name + ': ' + key + '" \\'
                }
            }

            return ''
        }
        else {
            return ''
        }
    }

    // NOTE: not sure this works as expected
    _escape(string) {
        return string
            .replace(/\\/, '\\')
            .replace(/\$/, '\$')
            .replace(/"/, '\"')
    }
}
