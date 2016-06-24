import BaseSerializer from '../BaseSerializer'

import Group from '../../models/Group'
import Request from '../../models/Request'
import Auth from '../../models/Auth'

export default class PostmanSerializer extends BaseSerializer {
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

        let name = request.get('name')
        if (!name) {
            name = request.get('url').href()
        }

        formatted.push('#### ' + name)

        let description = this._formatDescription(request)
        if (description) {
            formatted.push(description)
        }

        let curl = this._formatCurlCommand(request)
        formatted.push(curl)

        return formatted.join('\n\n')
    }

    _formatDescription(req) {
        let formatted = []

        let description = req.get('description')
        if (description) {
            formatted = [
                '##### Description',
                description
            ]
        }

        return formatted.join('\n')
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
        return url.href()
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
        let schema = param.getJSONSchema()
        if (schema.default) {
            schema.enum = [ schema.default ]
        }

        if (schema.type === 'string' && !schema.enum) {
            schema.enum = [ schema['x-title'] ]
        }

        let generated = this._escape(param.generate(false, schema))
        let key = this._escape(param.get('key'))

        let header = '"' + key + ': ' + generated + '"'
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

    _formatBodyParam(option, param) {
        let schema = param.getJSONSchema()
        if (schema.default) {
            schema.enum = [ schema.default ]
        }

        if (schema.type === 'string' && !schema.enum) {
            schema.enum = [ schema['x-title'] ]
        }

        let generated = this._escape(param.generate(false, schema))
        let key = this._escape(param.get('key'))

        let _param = '"' + key + '=' + generated + '"'
        return option + ' ' + _param + ' \\'
    }

    _formatAuths(req) {
        let auths = req.get('auths')

        if (auths.size > 0) {
            let auth = auths.get(0)

            if (auth instanceof Auth.Basic) {
                let username = this._escape(auth.get('username')) || '$username'
                let password = this._escape(auth.get('password')) || '$password'
                return '-u "' + username + '":"' + password + '"\\'
            }

            if (auth instanceof Auth.Digest) {
                let username = this._escape(auth.get('username')) || '$username'
                let password = this._escape(auth.get('password')) || '$password'
                return '--digest -u "' + username + '":"' + password + '"\\'
            }

            if (auth instanceof Auth.NTLM) {
                let username = this._escape(auth.get('username')) || '$username'
                let password = this._escape(auth.get('password')) || '$password'
                return '--ntlm -u "' + username + '":"' + password + '"\\'
            }

            if (auth instanceof Auth.Negotiate) {
                let username = this._escape(auth.get('username')) || '$username'
                let password = this._escape(auth.get('password')) || '$password'
                return '--negotiate -u "' + username + '":"' + password + '"\\'
            }

            if (auth instanceof Auth.ApiKey) {
                if (auth.get('in' === 'header')) {
                    let name = this._escape(auth.get('name') || '')
                    let key = this._escape(auth.get('key') || '')
                    return '-H "' + name + '": "' + key + '"\\'
                }
            }

            return ''
        }
        else {
            return ''
        }
    }

    _escape(string) {
        return string
            .replace(/\\/, '\\')
            .replace(/\$/, '\$')
            .replace(/"/, '\"')
    }
}
