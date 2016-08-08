import Immutable from 'immutable'

import ShellTokenizer from '../../utils/ShellTokenizer'

import ExoticReference from '../../models/references/Exotic'
import Constraint from '../../models/Constraint'
import Auth from '../../models/Auth'
import URL from '../../models/URL'
import Context, {
    Parameter,
    ParameterContainer
} from '../../models/Core'
import Request from '../../models/Request'
import Group from '../../models/Group'

export default class CurlParser {
    constructor() {
        this.context = new Context()
        this.args = null
        this.idx = -1
    }

    _getArg() {
        if (this.idx < this.args.count()) {
            return this.args.get(this.idx)
        }
        return null
    }

    _getLastArg() {
        if (this.idx - 1 < this.args.count()) {
            return this.args.get(this.idx - 1)
        }
        return null
    }

    _popArg() {
        if (this.idx < this.args.count()) {
            let arg = this.args.get(this.idx)
            this.idx += 1
            return arg
        }
        return null
    }

    _tokenize(string) {
        // shell tokenizer gives shell arguments as curl would receive them
        let args = new ShellTokenizer().tokenize(string)

        // clean arguments to make the curl processing easier:
        // * cleanup spaces before -x and --xxx options
        // * separate stuff like -XPOST in two tokens -X POST
        let cleanedArgs = []
        args.forEach(arg => {
            let m
            let _arg = arg
            // cleanup spaces (if before an -x or --xxx option)
            // that is mostly to accept malformed inputs, with normal
            // valid inputs
            // this "cleanup spaces" shouldn't be required
            m = _arg.match(/^\s+(\-[\s\S]*)$/)
            if (m) {
                _arg = m[1]
            }
            if (_arg.match(/^\s*$/)) {
                return
            }

            // try to detect -XPOST style options
            m = _arg.match(/^(\-\w)(.+)$/)
            if (m) {
                cleanedArgs.push(m[1])
                cleanedArgs.push(m[2])
            }
            else {
                cleanedArgs.push(_arg)
            }
        })
        args = Immutable.List(cleanedArgs)

        return args
    }

    parse(item) {
        // tokenize
        this.args = this._tokenize(item.content)

        // parse
        this.idx = 0

        this.context = this.context.set(
            'group',
            new Group({
                name: 'cURL Imports',
                children: this._parseAll()
            })
        )

        return this.context
    }

    _parseAll() {
        let requests = new Immutable.List()
        let arg
        while ((arg = this._popArg()) !== null) {
            if (arg.toLowerCase() === 'curl') {
                requests = requests.concat(this._parseCurlCommand())

                // if last argument was the -: --next option, continue
                // parsing curl
                const lastArg = this._getLastArg()
                if (lastArg === '-:' || lastArg === '--next') {
                    requests = requests.concat(this._parseCurlCommand())
                }
            }
        }
        return requests
    }

    _parseCurlCommand() {
        let requests = []

        let urlEncodeFlag = false
        let method = null
        let auth = new Auth.Basic({
            raw: false
        })
        let headers = new Immutable.OrderedMap()
        let queries = new Immutable.List()
        let body = new Immutable.List()

        let timeout = null

        let urls = Immutable.List()
        let arg
        while ((arg = this._popArg()) !== null) {
            if (arg.toLowerCase() === 'curl') {
                let container = this._createParameterContainer(
                    headers, queries, body
                )
                this.requests = this.requests.concat(
                    this._generateRequests(
                        urls, method, container, auth, timeout
                    )
                )

                this.idx -= 1
                return
            }
            else if (arg === '|' ||
                    arg === ';' ||
                    arg === '&' ||
                    arg === '&&') {
                // shell command break tokens
                break
            }
            else if (arg === '>' ||
                             arg === '1>' ||
                             arg === '2>' ||
                             arg === '&>') {
                // shell redirection tokens (arguments are consumed after)
                this._popArg()
            }
            else if (arg === '-:' || arg === '--next') {
                break
            }
            else if (arg === '-X' || arg === '--request') {
                method = this._parseMethod()
            }
            else if (arg === '-I' || arg === '--head') {
                method = 'HEAD'
            }
            else if (arg === '-H' || arg === '--header') {
                headers = this._parseHeader(headers)
            }
            else if (arg === '-F' || arg === '--form') {
                let out = this._parseMultipartFormData(headers, body, method)
                headers = out[0]
                body = out[1]
                method = out[2]
            }
            else if (arg === '--form-string') {
                let out = this._parseMultipartFormString(headers, body, method)
                headers = out[0]
                body = out[1]
                method = out[2]
            }
            else if (
                arg === '-d' ||
                arg === '--data' ||
                arg === '--data-ascii'
            ) {
                let out = this._parseUrlEncodedData(
                    '--data', urlEncodeFlag, headers, body, method
                )
                urlEncodeFlag = out[0]
                headers = out[1]
                body = out[2]
                method = out[3]
            }
            else if (arg === '--data-binary') {
                let out = this._parseUrlEncodedData(
                    arg, urlEncodeFlag, headers, body, method
                )
                urlEncodeFlag = out[0]
                headers = out[1]
                body = out[2]
                method = out[3]
            }
            else if (arg === '--data-raw') {
                let out = this._parseUrlEncodedData(
                    arg, urlEncodeFlag, headers, body, method
                )
                urlEncodeFlag = out[0]
                headers = out[1]
                body = out[2]
                method = out[3]
            }
            else if (arg === '--data-urlencode') {
                let out = this._parseUrlEncodedData(
                    arg, urlEncodeFlag, headers, body, method
                )
                urlEncodeFlag = out[0]
                headers = out[1]
                body = out[2]
                method = out[3]
            }
            else if (arg === '--compressed') {
                headers = this._parseCompressed(headers)
            }
            else if (arg === '-A' || arg === '--user-agent') {
                headers = this._parseUserAgent(headers)
            }
            else if (arg === '-b' || arg === '--cookie') {
                headers = this._parseCookie(headers)
            }
            else if (arg === '-e' || arg === '--referer') {
                // note: spelling "referer" is a typo in the HTTP spec
                // while correct English is "Referrer", header name if
                // "Referer" (one R)
                headers = this._parseReferer(headers)
            }
            else if (arg === '-u' || arg === '--user') {
                auth = this._parseUser(auth)
            }
            else if (arg === '--basic' ||
                             arg === '--digest' ||
                             arg === '--ntlm' ||
                             arg === '--negotiate') {
                auth = this._parseAuth(arg, auth)
            }
            else if (arg === '-m' || arg === '--max-time') {
                timeout = this._parseMaxTime()
            }
            else if (arg === '-c' || arg === '--cookie-jar' ||
                             arg === '-C' || arg === '--continue-at' ||
                             arg === '-D' || arg === '--dump-header' ||
                             arg === '-E' || arg === '--cert' ||
                             arg === '-K' || arg === '--config' ||
                             arg === '-o' || arg === '--output' ||
                             arg === '-r' || arg === '--range' ||
                             arg === '-t' || arg === '--telnet-option' ||
                             arg === '-T' || arg === '--upload-file' ||
                             arg === '-U' || arg === '--proxy-user' ||
                             arg === '-w' || arg === '--write-out' ||
                             arg === '-x' || arg === '--proxy' ||
                             arg === '-y' || arg === '--speed-time' ||
                             arg === '-Y' || arg === '--speed-limit' ||
                             arg === '-z' || arg === '--time-cond' ||
                             arg === '--ciphers' ||
                             arg === '--connect-timeout' ||
                             arg === '--dns-interface' ||
                             arg === '--dns-ipv4-addr' ||
                             arg === '--dns-ipv6-addr' ||
                             arg === '--dns-servers' ||
                             arg === '--engine' ||
                             arg === '--egd-file' ||
                             arg === '--expect100-timeout' ||
                             arg === '--cert-type' ||
                             arg === '--cacert' ||
                             arg === '--capath' ||
                             arg === '--pinnedpubkey' ||
                             arg === '--hostpubmd5' ||
                             arg === '--interface' ||
                             arg === '--keepalive-time' ||
                             arg === '--key' ||
                             arg === '--key-type' ||
                             arg === '--libcurl' ||
                             arg === '--limit-rate' ||
                             arg === '--local-port' ||
                             arg === '--login-options' ||
                             arg === '--max-filesize' ||
                             arg === '--max-redirs' ||
                             arg === '--noproxy' ||
                             arg === '--proxy-header' ||
                             arg === '--pass' ||
                             arg === '--proto' ||
                             arg === '--proto-default' ||
                             arg === '--proto-redir' ||
                             arg === '--proxy-service-name' ||
                             arg === '--proxy1.0' ||
                             arg === '--pubkey' ||
                             arg === '--random-file' ||
                             arg === '--resolve' ||
                             arg === '--retry' ||
                             arg === '--retry-delay' ||
                             arg === '--retry-max-time' ||
                             arg === '--service-name' ||
                             arg === '--socks4' ||
                             arg === '--socks4a' ||
                             arg === '--socks5-hostname' ||
                             arg === '--socks5' ||
                             arg === '--socks5-gssapi-service' ||
                             arg === '--stderr' ||
                             arg === '--tlsauthtype' ||
                             arg === '--tlspassword' ||
                             arg === '--tlsuser' ||
                             arg === '--trace' ||
                             arg === '--trace-ascii' ||
                             arg === '--unix-socket') {
                // unknown options, but we consume one token
                this._popArg()
            }
            else if (arg.match(/^\-/)) {
                // ignore unknown arguments
                continue
            }
            else {
                let parsed = this._parseUrl(arg, auth, queries)
                urls = urls.push(parsed[0])
                auth = parsed[1]
                queries = parsed[2]
            }
        }

        if (!method) {
            method = 'GET'
        }

        let update = this._updateRequest(urlEncodeFlag, headers, body)
        headers = update[0]
        body = update[1]

        requests = urls.map(_url => {
            let container = this._createParameterContainer(
                headers, queries, body
            )
            return this._createRequest(
                _url, method, container, auth, timeout
            )
        })

        return requests
    }

    _generateRequests(urls, method, container, auth, timeout) {
        return urls.map(url => {
            return this._createRequest(
                url, method, container, auth, timeout
            )
        })
    }

    _createParameterContainer(headers, queries, body) {
        let headerList = []
        let keys = headers.keySeq()
        for (let key of keys) {
            headerList.push(headers.get(key))
        }

        return new ParameterContainer({
            queries: queries,
            body: body,
            headers: new Immutable.List(headerList)
        })
    }

    _createRequest(_url, method, _container, _auth, timeout) {
        let url = _url
        let container = _container
        let auth = _auth

        let name = null
        if (url) {
            let search = url.generateParam('search')
            if (search) {
                let queries = container.get('queries')
                queries = this._parseQueries(search, queries)
                container = container.set('queries', queries)
                url = url.set('search', new Parameter({
                    key: 'search',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([ '' ])
                    ])
                }))
            }

            name = url.href()
        }

        if (auth.get('raw') === false) {
            if (auth.get('username') || auth.get('password')) {
                auth = auth.set('raw', null)
            }
            else {
                auth = null
            }
        }

        let auths
        if (auth) {
            auths = new Immutable.List([ auth ])
        }
        else {
            auths = new Immutable.List()
        }

        return new Request({
            name: name,
            url: url,
            method: method,
            parameters: container,
            auths: auths,
            timeout: timeout
        })
    }

    _formatParameter(key, value) {
        let type
        let internals
        let _key = key
        let _value = value
        if (
            value instanceof ExoticReference ||
            key instanceof ExoticReference
        ) {
            type = 'reference'
            internals = new Immutable.List()

            if (key instanceof ExoticReference) {
                _value = key
                _key = _value.get('uri')
            }
        }
        else {
            type = 'string'
            internals = new Immutable.List([
                new Constraint.Enum([ _value ])
            ])
        }
        return new Parameter({
            key: _key,
            name: _key,
            value: _value,
            type: type,
            internals: internals
        })
    }

    _updateRequest(urlEncodeFlag, _headers, _body) {
        let body = _body
        let headers = _headers
        let contentType = headers.get('Content-Type') || null

        console.log('hey there', urlEncodeFlag, JSON.stringify(body), JSON.stringify(headers))
        if (urlEncodeFlag) {
            // this is not form url encoded, but a plain body string or file
            if (body.count() === 1 && body.getIn([ 0, 'value' ]) === null) {
                if (body.getIn([ 0, 'key' ]) instanceof ExoticReference) {
                    body = new Immutable.List([
                        this._formatParameter('body', body.getIn([ 0, 'key' ]))
                    ])
                }
                else {
                    body = new Immutable.List([
                        this._formatParameter(null, body.getIn([ 0, 'key' ]))
                    ])
                }
            }
            // if no Content-Type is set, or not set to
            // application/x-www-form-urlencoded consider the body as
            // a plain string
            if (!contentType) {
                headers = headers.set(
                    this._normalizeHeader('Content-Type'),
                    this._formatParameter(
                        this._normalizeHeader('Content-Type'),
                        'application/x-www-form-urlencoded'
                    )
                )
            }
        }

        return [ headers, body ]
    }

    _parseUrl(url, _auth, _queries) {
        let queries = _queries
        let auth = _auth
        let _url

        if (!url.match(/:\/\//)) {
            _url = new URL('http://' + url)
        }
        else {
            _url = new URL(url)
        }

        let username = _url.generateParam('username')
        if (username) {
            if (!auth.get('username')) {
                auth = auth.set('username', username)
            }
            _url = _url.set('username', new Parameter({
                key: 'username',
                type: 'string',
                internals: new Immutable.List([
                    new Constraint.Enum([ '' ])
                ])
            }))
        }

        let password = _url.generateParam('password')
        if (password) {
            if (!auth.get('password')) {
                auth = auth.set('password', password)
            }
            _url = _url.set('password', new Parameter({
                key: 'password',
                type: 'string',
                internals: new Immutable.List([
                    new Constraint.Enum([ '' ])
                ])
            }))
        }

        return [ _url, auth, queries ]
    }

    _parseQueries(search, queries) {
        let components = search.slice(1).split('&')
        return queries.concat(components.map(component => {
            let [ key, value ] = component.split('=')
            if (typeof value === 'undefined') {
                value = null
            }
            return this._formatParameter(key, value)
        }))
    }

    _normalizeHeader(string) {
        return string.replace(/[^\-]+/g, (m) => {
            return m[0].toUpperCase() + m.substr(1).toLowerCase()
        })
    }

    _resolveFileReference(string, convert = null, regex = /^\@([\s\S]*)$/) {
        const m = string.match(regex)
        if (m) {
            return new ExoticReference({
                uri: m[1],
                relative: m[1]
            })
        }
        return string
    }

    _parseHeader(headers) {
        const arg = this._popArg()
        const m = arg.match(/^([^\:\s]+)\s*\:\s*([\s\S]*)$/)
        if (!m) {
            throw new Error('Invalid -H/--header value: ' + arg)
        }
        return headers.set(
            this._normalizeHeader(m[1]),
            this._formatParameter(
                this._normalizeHeader(m[1]),
                m[2]
            )
        )
    }

    _parseMethod() {
        return this._popArg()
    }

    _parseCompressed(headers) {
        let header = headers.get('Accept-Encoding') || null
        let acceptEncoding
        if (!header) {
            acceptEncoding = ''
        }
        else {
            acceptEncoding = header.generate()
        }

        if (acceptEncoding.indexOf('gzip') < 0) {
            if (acceptEncoding.length > 0) {
                acceptEncoding += ';'
            }
            acceptEncoding += 'gzip'
            return headers.set(
                'Accept-Encoding',
                this._formatParameter(
                    this._normalizeHeader('Accept-Encoding'),
                    acceptEncoding
                )
            )
        }

        return headers
    }

    _parseUserAgent(headers) {
        return headers.set(
            this._normalizeHeader('User-Agent'),
            this._formatParameter(
                this._normalizeHeader('User-Agent'),
                this._popArg()
            )
        )
    }

    _parseCookie(headers) {
        return headers.set(
            this._normalizeHeader('Cookie'),
            this._formatParameter(
                this._normalizeHeader('Cookie'),
                this._popArg()
            )
        )
    }

    _parseReferer(headers) {
        // note: spelling "referer" is a typo in the HTTP spec
        // while correct English is "Referrer", header name if "Referer" (one R)
        return headers.set(
            this._normalizeHeader('Referer'),
            this._formatParameter(
                this._normalizeHeader('Referer'),
                this._popArg()
            )
        )
    }

    _parseUser(auth) {
        const m = this._popArg().match(/([^\:]+)(?:\:([\s\S]*))?/)
        return auth
            .set('username', m[1])
            .set('password', m[2] ? m[2] : null)
    }

    _parseAuth(arg, auth) {
        let argMap = {
            '--basic': Auth.Basic,
            '--digest': Auth.Digest,
            '--ntlm': Auth.NTLM,
            '--negotiate': Auth.Negotiate
        }

        if (argMap[arg]) {
            return new argMap[arg]({
                username: auth.get('username') || null,
                password: auth.get('password') || null
            })
        }

        return auth
    }

    _parseMaxTime() {
        const maxTime = this._popArg()
        return parseFloat(maxTime)
    }

    _parseMultipartFormData(_headers, _body, _method) {
        let headers = _headers
        let body = _body
        let method = _method

        headers = headers.set(
            this._normalizeHeader('Content-Type'),
            this._formatParameter(
                this._normalizeHeader('Content-Type'),
                'multipart/form-data'
            )
        )

        const arg = this._popArg()
        const m = arg.match(/^([^\=]+)\=([^\;]*)/)
        if (!m) {
            throw new Error('Invalid -F/--form value: ' + arg)
        }

        const value = m[2] ?
            this._resolveFileReference(m[2], null, /^[\@\<]([\s\S]*)$/) :
            null

        // set body param
        body = body.push(this._formatParameter(m[1], value))

        // set method if not set
        if (!method) {
            method = 'POST'
        }

        return [ headers, body, method ]
    }

    _parseMultipartFormString(_headers, _body, _method) {
        let headers = _headers
        let body = _body
        let method = _method
        // switch bodyType
        headers = headers.set(
            this._normalizeHeader('Content-Type'),
            this._formatParameter(
                this._normalizeHeader('Content-Type'),
                'multipart/form-data'
            )
        )


        const arg = this._popArg()
        const m = arg.match(/^([^\=]+)\=([\s\S]*)$/)
        if (!m) {
            throw new Error('Invalid --form-string value: ' + arg)
        }

        // set body param
        body = body.push(this._formatParameter(m[1], m[2]))

        // set method if not set
        if (!method) {
            method = 'POST'
        }

        return [ headers, body, method ]
    }

    _parseUrlEncodedData(option, _urlEncodeFlag, _headers, _body, _method) {
        let headers = _headers
        let body = _body
        let method = _method
        let urlEncodeFlag = _urlEncodeFlag
        // switch bodyType
        const arg = this._popArg()

        if (
            option === '--data' ||
            option === '--data-raw' ||
            option === '--data-binary'
        ) {
            let value = arg

            // resolve file reference @filename
            if (option === '--data' || option === '--data-binary') {
                const convert = option === '--data-binary' ?
                    null : 'stripNewlines'
                value = this._resolveFileReference(value, convert)
            }

            // if file reference
            if (value instanceof ExoticReference) {
                body = body.push(this._formatParameter(value, null))
            }
            // otherwise, parse the parameters
            else {
                let components = value.split('&')
                for (let component of components) {
                    let m = component.match(/^([^\=]+)(?:\=([\s\S]*))?$/)
                    body = body.push(this._formatParameter(
                        decodeURIComponent(m[1]),
                        typeof m[2] === 'string' ?
                            decodeURIComponent(m[2]) : null
                    ))
                }
            }
        }
        else if (option === '--data-urlencode') {
            let m = arg.match(/^([^\=]+)?\=([\s\S]*)$/)
            // =content
            // name=content
            if (m) {
                body = body.push(this._formatParameter(
                    m[1] ? m[1] : m[2],
                    m[1] ? m[2] : ''
                ))
            }
            // content
            // @filename
            // name@filename
            else {
                m = arg.match(/^([^\@]+)?([\s\S]+)?$/)
                let value = m[2] ?
                    this._resolveFileReference(m[2], 'urlEncode') : ''
                body = body.push(this._formatParameter(
                    m[1] ? m[1] : value,
                    m[1] ? value : ''
                ))
            }
        }
        else {
            throw new Error('Invalid option ' + option)
        }

        // set method if not set
        if (!method) {
            method = 'POST'
        }

        urlEncodeFlag = true

        return [ urlEncodeFlag, headers, body, method ]
    }
}
