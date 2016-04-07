import Immutable from 'immutable'

import ShellTokenizer from '../../utils/ShellTokenizer'
import RequestContext, {
    Request,
    KeyValue,
    FileReference,
    Group
} from '../../immutables/RequestContext'

export default class CurlParser {
    constructor() {
        this.context = new RequestContext()
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

    parse(string) {
        // tokenize
        this.args = this._tokenize(string)

        // parse
        this.idx = 0

        this.context = this.context.set(
            'group',
            new Group({
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
        let request = new Request()

        // assume BasicAuth for cURL requests
        request.setAuthType('basic')

        let urls = Immutable.List()
        let arg
        while ((arg = this._popArg()) !== null) {
            if (arg === '|' ||
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
                request = this._parseMethod(request)
            }
            else if (arg === '-I' || arg === '--head') {
                request = request.set('method', 'HEAD')
            }
            else if (arg === '-H' || arg === '--header') {
                request = this._parseHeader(request)
            }
            else if (arg === '-F' || arg === '--form') {
                request = this._parseMultipartFormData(request)
            }
            else if (arg === '--form-string') {
                request = this._parseMultipartFormString(request)
            }
            else if (
                arg === '-d' ||
                arg === '--data' ||
                arg === '--data-ascii'
            ) {
                request = this._parseUrlEncodedData(request, '--data')
            }
            else if (arg === '--data-binary') {
                request = this._parseUrlEncodedData(request, arg)
            }
            else if (arg === '--data-raw') {
                request = this._parseUrlEncodedData(request, arg)
            }
            else if (arg === '--data-urlencode') {
                request = this._parseUrlEncodedData(request, arg)
            }
            else if (arg === '--compressed') {
                request = this._parseCompressed(request)
            }
            else if (arg === '-A' || arg === '--user-agent') {
                request = this._parseUserAgent(request)
            }
            else if (arg === '-b' || arg === '--cookie') {
                request = this._parseCookie(request)
            }
            else if (arg === '-e' || arg === '--referer') {
                // note: spelling "referer" is a typo in the HTTP spec
                // while correct English is "Referrer", header name if
                // "Referer" (one R)
                request = this._parseReferer(request)
            }
            else if (arg === '-u' || arg === '--user') {
                request = this._parseUser(request)
            }
            else if (arg === '--basic' ||
                             arg === '--digest' ||
                             arg === '--ntlm' ||
                             arg === '--negotiate') {
                request = this._parseAuth(request, arg)
            }
            else if (arg === '-m' || arg === '--max-time') {
                request = this._parseMaxTime(request)
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
                request = this._parseUrl(request, arg)
                urls = urls.push(request.get('url'))
            }
        }
        if (request.get('method') === null) {
            request = request.set('method', 'GET')
        }

        request = this._updateRequest(request)
        requests = urls.map(url => {
            return request.set('url', url)
        })

        return requests
    }

    _updateRequest(request) {
        let _request = request
        const bodyType = request.get('bodyType')
        const body = request.get('body')
        const contentType = request.getIn([ 'headers', 'Content-Type' ])

        if (bodyType === 'urlEncoded') {
            // this is not form url encoded, but a plain body string or file
            if (body.count() === 1 && body.getIn([ 0, 'value' ]) === null) {
                if (body.getIn([ 0, 'key' ]) instanceof FileReference) {
                    _request = _request
                        .set('bodyType', 'file')
                        .set('body', body.getIn([ 0, 'key' ]))
                }
                else {
                    _request = _request
                        .set('bodyType', 'plain')
                        .set('body', body.getIn([ 0, 'key' ]))
                }
            }
            // if no Content-Type is set, or not set to
            // application/x-www-form-urlencoded consider the body as
            // a plain string
            else if (
                contentType &&
                contentType !== 'application/x-www-form-urlencoded'
            ) {
                const bodyString = _request.get('bodyString')
                if (contentType && contentType.indexOf('json') >= 0) {
                    try {
                        let jsonBody = JSON.parse(bodyString)
                        _request = _request
                            .set('bodyType', 'json')
                            .set('body', jsonBody)
                    }
                    catch (e) {
                        const m = 'Request seems to have a JSON body, ' +
                        'but JSON parsing failed'
                        console.error(m) // eslint-disable-line
                        _request = _request
                            .set('bodyType', 'plain')
                            .set('body', bodyString)
                    }
                }
            }
        }

        return _request
    }

    _parseUrl(request, url) {
        const m = url
            .match(/^(\w+\:\/\/)?(?:([^\:\/]+)(?:\:([^\@]+)?)?\@)?([\s\S]*)$/)
        let _request = request
        if (m[2] && !_request.getIn([ 'auth', 0, 'password' ])) {
            _request = _request.setAuthParams({
                username: m[2],
                password: m[3] ? m[3] : null
            })
        }
        _request = _request.set('url', (m[1] ? m[1] : 'http://') + m[4])
        return _request
    }

    _normalizeHeader(string) {
        return string.replace(/[^\-]+/g, (m) => {
            return m[0].toUpperCase() + m.substr(1).toLowerCase()
        })
    }

    _resolveFileReference(string, convert = null, regex = /^\@([\s\S]*)$/) {
        const m = string.match(regex)
        if (m) {
            return new FileReference({
                filepath: m[1],
                convert: convert
            })
        }
        return string
    }

    _parseHeader(request) {
        const arg = this._popArg()
        const m = arg.match(/^([^\:\s]+)\s*\:\s*([\s\S]*)$/)
        if (!m) {
            throw new Error('Invalid -H/--header value: ' + arg)
        }
        return request.setIn([ 'headers', this._normalizeHeader(m[1]) ], m[2])
    }

    _parseMethod(request) {
        return request.set('method', this._popArg())
    }

    _parseCompressed(request) {
        let _request = request
        let acceptEncoding = request.getIn([ 'headers', 'Accept-Encoding' ])
        if (!acceptEncoding) {
            acceptEncoding = ''
        }
        if (acceptEncoding.indexOf('gzip') < 0) {
            if (acceptEncoding.length > 0) {
                acceptEncoding += ';'
            }
            acceptEncoding += 'gzip'
            _request = _request
                .setIn([ 'headers', 'Accept-Encoding' ], acceptEncoding)
        }
        return _request
    }

    _parseUserAgent(request) {
        return request.setIn([ 'headers', 'User-Agent' ], this._popArg())
    }

    _parseCookie(request) {
        return request.setIn([ 'headers', 'Cookie' ], this._popArg())
    }

    _parseReferer(request) {
        // note: spelling "referer" is a typo in the HTTP spec
        // while correct English is "Referrer", header name if "Referer" (one R)
        return request.setIn([ 'headers', 'Referer' ], this._popArg())
    }

    _parseUser(request) {
        const m = this._popArg().match(/([^\:]+)(?:\:([\s\S]*))?/)
        return request.setAuthParams({
            username: m[1],
            password: m[2] ? m[2] : null
        })
    }

    _parseAuth(request, arg) {
        const m = arg.match(/\-{2}(\w+)/)

        let auth = request.get('Auth')
        request.setAuthType(m[1])

        return request.setAuthParams(auth)
    }

    _parseMaxTime(request) {
        const maxTime = this._popArg()
        return request.set('timeout', parseFloat(maxTime))
    }

    _parseMultipartFormData(request) {
        // switch bodyType
        let _request = request
        if (_request.get('bodyType') !== 'formData') {
            if (_request.get('bodyType')) {
                throw new Error('Different body types set in the same request')
            }
            _request = _request.merge({
                bodyType: 'formData',
                body: Immutable.List()
            })
        }
        const arg = this._popArg()
        const m = arg.match(/^([^\=]+)\=([^\;]*)/)
        if (!m) {
            throw new Error('Invalid -F/--form value: ' + arg)
        }

        // set body param
        const value = m[2] ?
            this._resolveFileReference(m[2], null, /^[\@\<]([\s\S]*)$/) :
            null
        _request = _request.set('body', _request.get('body').push(new KeyValue({
            key: m[1],
            value: value
        })))

        // set method if not set
        if (_request.get('method') === null) {
            _request = _request.set('method', 'POST')
        }

        return _request
    }

    _parseMultipartFormString(request) {
        let _request = request
        // switch bodyType
        if (_request.get('bodyType') !== 'formData') {
            if (_request.get('bodyType')) {
                throw new Error('Different body types set in the same request')
            }
            _request = _request.merge({
                bodyType: 'formData',
                body: Immutable.List()
            })
        }
        const arg = this._popArg()
        const m = arg.match(/^([^\=]+)\=([\s\S]*)$/)
        if (!m) {
            throw new Error('Invalid --form-string value: ' + arg)
        }

        // set body param
        _request = _request.set('body', _request.get('body').push(new KeyValue({
            key: m[1],
            value: m[2]
        })))

        // set method if not set
        if (_request.get('method') === null) {
            _request = _request.set('method', 'POST')
        }

        return _request
    }

    _parseUrlEncodedData(request, option) {
        let _request = request
        // switch bodyType
        if (_request.get('bodyType') !== 'urlEncoded') {
            if (_request.get('bodyType')) {
                throw new Error('Different body types set in the same request')
            }
            _request = _request.merge({
                bodyType: 'urlEncoded',
                body: Immutable.List(),
                bodyString: ''
            })
        }

        const arg = this._popArg()

        _request = _request
            .setIn(
                [ 'headers', 'Content-Type' ],
                _request.getIn([ 'headers', 'Content-Type' ]) ||
                'application/x-www-form-urlencoded'
            )

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
            if (value instanceof FileReference) {
                _request = _request
                    .set('body', _request.get('body').push(new KeyValue({
                        key: value
                    })))
            }
            // otherwise, parse the parameters
            else {
                let components = value.split('&')
                for (let component of components) {
                    let m = component.match(/^([^\=]+)(?:\=([\s\S]*))?$/)
                    _request = _request
                        .set('body', _request.get('body').push(new KeyValue({
                            key: decodeURIComponent(m[1]),
                            value: typeof m[2] === 'string' ?
                                decodeURIComponent(m[2]) : null
                        })))
                }
            }
        }
        else if (option === '--data-urlencode') {
            let m = arg.match(/^([^\=]+)?\=([\s\S]*)$/)
            // =content
            // name=content
            if (m) {
                _request = _request
                    .set('body', _request.get('body').push(new KeyValue({
                        key: m[1] ? m[1] : m[2],
                        value: m[1] ? m[2] : ''
                    })))
            }
            // content
            // @filename
            // name@filename
            else {
                m = arg.match(/^([^\@]+)?([\s\S]+)?$/)
                let value = m[2] ?
                    this._resolveFileReference(m[2], 'urlEncode') : ''
                _request = _request
                    .set('body', _request.get('body').push(new KeyValue({
                        key: m[1] ? m[1] : value,
                        value: m[1] ? value : ''
                    })))
            }
        }
        else {
            throw new Error('Invalid option ' + option)
        }

        // add body as string
        let bodyString = _request.get('bodyString')
        if (bodyString.length > 0) {
            bodyString += '&'
        }
        bodyString += arg
        _request = _request.set('bodyString', bodyString)

        // set method if not set
        if (_request.get('method') === null) {
            _request = _request.set('method', 'POST')
        }

        return _request
    }
}
