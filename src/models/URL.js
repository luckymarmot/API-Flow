import Immutable from 'immutable'

import {
    Parameter
} from './Core'

import Constraint from './Constraint'

export default class URL extends Immutable.Record({
    protocol: null,
    username: null,
    password: null,
    host: null,
    hostname: null,
    port: null,
    pathname: null,
    search: null,
    hash: null
}) {
    constructor(url, baseURL) {
        if (typeof url === 'string') {
            super()
            return this._constructorFromURL(url, baseURL)
        }
        else {
            super()
            return this._constructorFromObj(url)
        }
    }

    _constructorFromURL(url, baseURL) {
        /* eslint-disable max-len */
        let m = String(url)
            .replace(/^\s+|\s+$/g, '')
            .match(/^([^:\./?#]+:)?(?:\/\/(?:([^:@\/?#]*)(?::([^:@\/?#]*))?@)?(([^:\/?#]*)(?::(\d*))?))?([^?#]*)(\?[^#]*)?(#[\s\S]*)?/)
        /* eslint-enable max-len */

        if (!m) {
            throw new RangeError()
        }

        let protocol = m[1] || ''
        let username = m[2] || ''
        let password = m[3] || ''
        let host = m[4] || ''
        let hostname = m[5] || ''
        let port = m[6] || ''
        let pathname = m[7] || ''
        let search = m[8] || ''
        let hash = m[9] || ''

        if (typeof baseURL !== 'undefined') {
            let base = (new URL(baseURL)).toJS()
            let flag = protocol === '' && host === '' && username === ''

            if (flag && pathname === '' && search === '') {
                search = base.search
            }

            if (flag && pathname.charAt(0) !== '/') {
                pathname = pathname !== '' ?
                    (
                        (
                            base.host !== '' ||
                            base.username !== ''
                        ) &&
                        base.pathname === '' ?
                        '/' : ''
                    ) +
                    base.pathname
                        .slice(0, base.pathname.lastIndexOf('/') + 1) +
                    pathname
                    :
                    base.pathname
            }

            // dot segments removal
            let output = []
            pathname.replace(/^(\.\.?(\/|$))+/, '')
                .replace(/\/(\.(\/|$))+/g, '/')
                .replace(/\/\.\.$/, '/../')
                .replace(/\/?[^\/]*/g, function(p) {
                    if (p === '/..') {
                        output.pop()
                    }
                    else {
                        output.push(p)
                    }
                })
            pathname = output
                .join('')
                .replace(/^\//, pathname.charAt(0) === '/' ? '/' : '')
            if (flag) {
                port = base.port
                hostname = base.hostname
                host = base.host
                password = base.password
                username = base.username
            }
            if (protocol === '') {
                protocol = base.protocol + ':'
            }
        }

        let def = new Immutable.List([
            new Constraint.Enum([ '' ])
        ])

        return this.withMutations(_this => {
            _this
                .set('protocol', new Parameter({
                    key: 'protocol',
                    type: 'string',
                    internals: protocol.slice(0, -1) ? new Immutable.List([
                        new Constraint.Enum([ protocol.slice(0, -1) ])
                    ]) : def
                }))
                .set('username', new Parameter({
                    key: 'username',
                    type: 'string',
                    internals: username ? new Immutable.List([
                        new Constraint.Enum([ username ])
                    ]) : def
                }))
                .set('password', new Parameter({
                    key: 'password',
                    type: 'string',
                    internals: password ? new Immutable.List([
                        new Constraint.Enum([ password ])
                    ]) : def
                }))
                .set('host', new Parameter({
                    key: 'host',
                    type: 'string',
                    internals: host ? new Immutable.List([
                        new Constraint.Enum([ host ])
                    ]) : def
                }))
                .set('hostname', new Parameter({
                    key: 'hostname',
                    type: 'string',
                    internals: hostname ? new Immutable.List([
                        new Constraint.Enum([ hostname ])
                    ]) : def
                }))
                .set('port', new Parameter({
                    key: 'port',
                    type: 'string',
                    internals: port ? new Immutable.List([
                        new Constraint.Enum([ port ])
                    ]) : def
                }))
                .set('pathname', new Parameter({
                    key: 'pathname',
                    type: 'string',
                    internals: pathname ? new Immutable.List([
                        new Constraint.Enum([ pathname ])
                    ]) : def
                }))
                .set('search', new Parameter({
                    key: 'search',
                    type: 'string',
                    internals: search ? new Immutable.List([
                        new Constraint.Enum([ search ])
                    ]) : def
                }))
                .set('hash', new Parameter({
                    key: 'hash',
                    type: 'string',
                    internals: hash ? new Immutable.List([
                        new Constraint.Enum([ hash ])
                    ]) : def
                }))
        })
    }

    _constructorFromObj(obj) {
        if (typeof obj === 'undefined' || obj === null) {
            return this
        }

        let protocol = this._formatParam('protocol', obj.protocol)
        let username = this._formatParam('username', obj.username)
        let password = this._formatParam('password', obj.password)
        let host = this._formatParam('host', obj.host)
        let hostname = this._formatParam('hostname', obj.hostname)
        let port = this._formatParam('port', obj.port)
        let pathname = this._formatParam('pathname', obj.pathname)
        let search = this._formatParam('search', obj.search)
        let hash = this._formatParam('hash', obj.hash)

        return this.withMutations(url => {
            url
                .set('protocol', protocol)
                .set('username', username)
                .set('password', password)
                .set('host', host)
                .set('hostname', hostname)
                .set('port', port)
                .set('pathname', pathname)
                .set('search', search)
                .set('hash', hash)
        })
    }

    _formatParam(name, param) {
        if (param instanceof Parameter) {
            return param
        }
        else if (typeof param === 'undefined' || param === null) {
            return new Parameter({
                key: name,
                type: 'string'
            })
        }
        else if (
            typeof param !== 'string' &&
            typeof param[Symbol.iterator] === 'function'
        ) {
            return new Parameter({
                key: name,
                type: 'string',
                internals: new Immutable.List([
                    new Constraint.Enum(param)
                ])
            })
        }
        else {
            return new Parameter({
                key: name,
                type: 'string',
                internals: param ? new Immutable.List([
                    new Constraint.Enum([ param ])
                ]) : new Immutable.List()
            })
        }
    }

    href() {
        let protocol = this.generateParam('protocol')
        let host = this.generateParam('host')
        let username = this.generateParam('username')
        let password = this.generateParam('password')
        let pathname = this.generateParam('pathname')
        let search = this.generateParam('search')
        let hash = this.generateParam('hash')

        if (host) {
            protocol = protocol || 'http'
        }

        if (protocol) {
            protocol = protocol + ':'
        }

        return protocol +
            (protocol !== '' || host !== '' ? '//' : '') +
            (
                username !== '' ?
                username + (password !== '' ? ':' + password : '') + '@' :
                ''
            ) +
            host +
            pathname +
            search +
            hash
    }

    origin() {
        let protocol = this.generateParam('protocol')
        let host = this.generateParam('host')

        if (host) {
            protocol = protocol || 'http'
        }

        if (protocol) {
            protocol = protocol + ':'
        }

        return protocol +
            (protocol !== '' || host !== '' ? '//' : '') +
            host
    }

    toJS() {
        let protocol = this.generateParam('protocol')
        let host = this.generateParam('host')
        let hostname = this.generateParam('hostname')
        let username = this.generateParam('username')
        let password = this.generateParam('password')
        let pathname = this.generateParam('pathname')
        let search = this.generateParam('search')
        let hash = this.generateParam('hash')

        let _protocol = protocol
        if (host) {
            _protocol = _protocol || 'http'
        }

        if (protocol) {
            _protocol = _protocol + ':'
        }

        let href = _protocol +
            (_protocol !== '' || host !== '' ? '//' : '') +
            (
                username !== '' ?
                username + (password !== '' ? ':' + password : '') + '@' :
                ''
            ) +
            host +
            pathname +
            search +
            hash

        let origin = _protocol +
            (_protocol !== '' || host !== '' ? '//' : '') +
            host

        return {
            protocol: protocol,
            hostname: hostname,
            host: host,
            username: username,
            password: password,
            pathname: pathname,
            search: search,
            hash: hash,
            href: href,
            origin: origin
        }
    }

    _getParamValue(name) {
        return this.getIn([ name, 'internals', 0, 'value' ]) || []
    }

    _mergeParams(paramList) {
        let dict = {}
        for (let param of paramList) {
            dict[param] = true
        }
        let result = Object.keys(dict)
        if (result.length === 1) {
            return result[0]
        }
        else if (result.length === 0) {
            return null
        }
        return result
    }

    generateParam(name) {
        if (
            !this.getIn([ name, 'internals', 0 ]) &&
            this.getIn([ name, 'format' ]) !== 'sequence'
        ) {
            return ''
        }
        else {
            return this.get(name).generate()
        }
    }

    merge(url) {
        let protocol = this._mergeParams(this
            ._getParamValue('protocol')
            .concat(url._getParamValue('protocol')))
        let username = this._mergeParams(this
            ._getParamValue('username')
            .concat(url._getParamValue('username')))
        let password = this._mergeParams(this
            ._getParamValue('password')
            .concat(url._getParamValue('password')))
        let host = this._mergeParams(this
            ._getParamValue('host')
            .concat(url._getParamValue('host')))
        let hostname = this._mergeParams(this
            ._getParamValue('hostname')
            .concat(url._getParamValue('hostname')))
        let port = this._mergeParams(this
            ._getParamValue('port')
            .concat(url._getParamValue('port')))
        let pathname = this._mergeParams(this
            ._getParamValue('pathname')
            .concat(url._getParamValue('pathname')))
        let search = this._mergeParams(this
            ._getParamValue('search')
            .concat(url._getParamValue('search')))
        let hash = this._mergeParams(this
            ._getParamValue('hash')
            .concat(url._getParamValue('hash')))

        return this.withMutations(_this => {
            _this
                .set('protocol', this._formatParam('protocol', protocol))
                .set('username', this._formatParam('username', username))
                .set('password', this._formatParam('password', password))
                .set('host', this._formatParam('host', host))
                .set('hostname', this._formatParam('hostname', hostname))
                .set('port', this._formatParam('port', port))
                .set('pathname', this._formatParam('pathname', pathname))
                .set('search', this._formatParam('search', search))
                .set('hash', this._formatParam('hash', hash))
        })
    }
}
