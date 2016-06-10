import Immutable from 'immutable'

import Context, {
    Parameter,
    ParameterContainer
} from '../../../models/Core'

import Constraint from '../../../models/Constraint'

import ReferenceContainer from '../../../models/references/Container'
import LateResolutionReference from '../../../models/references/LateResolution'

import {
    Info
} from '../../../models/Utils'

import URL from '../../../models/URL'
import Group from '../../../models/Group'
import Request from '../../../models/Request'

import Auth from '../../../models/Auth'

export default class PostmanParser {
    constructor() {
        this.context = new Context()
        this.references = new Immutable.List()
    }

    // @tested
    parse(string) {
        let obj
        try {
            obj = JSON.parse(string)
        }
        catch (e) {
            throw new Error('Invalid Postman file (not a valid JSON)')
        }

        this.context = ::this._createContext(obj)
        return this.context
    }

    // @tested
    _createContext(collection) {
        let [ info, root ] = this._extractInfo(collection)
        let group = this._extractGroup(collection, root)
        let references = new Immutable.OrderedMap({
            postman: (new ReferenceContainer()).create(this.references)
        })

        let context = new Context({
            references: references,
            group: group,
            info: info
        })

        return context
    }

    _extractInfo(collection) {
        let info = collection.info
        if (!info) {
            return new Info()
        }

        let title = info.name || null
        let root = {
            name: title,
            id: info._postman_id || null
        }

        let description = null
        if (info.description) {
            if (typeof info.description === 'string') {
                description = info.description
            }
            else {
                description = info.description.content || null
            }
        }

        let version = null
        if (info.version) {
            if (typeof info.version === 'string') {
                version = info.version
            }
            else {
                let _v = info.version
                version = 'v' +
                    _v.major + '.' +
                    _v.minor + '.' +
                    _v.patch

                if (_v.identifier) {
                    version += '-' + _v.identifier
                }
            }
        }

        return [
            new Info({
                title: title,
                description: description,
                version: version
            }),
            root
        ]
    }


    _extractGroup(collection, root) {
        let group = new Group({
            id: root.id,
            name: root.name
        })

        let children = collection.item

        let _children = new Immutable.OrderedMap()
        _children = _children.withMutations((_map) => {
            for (let child of children) {
                let _group = this._extractGroupFromItem(child)
                _map.set(
                    _group.get('id') || _group.get('name') || null,
                    _group
                )
            }
        })

        return group.set('children', children)
    }

    _extractGroupFromItem(item) {
        if (item.request) {
            return this._extractRequest(item)
        }

        let group = new Group({
            name: item.id || item.name || null
        })

        if (item.item) {
            let children = new Immutable.OrderedMap()
            children = children.withMutations((_map) => {
                for (let child of item.item) {
                    let content = this._extractGroupFromItem(child)
                    if (content !== null) {
                        _map.set(
                            child.id || child.name || null,
                            content
                        )
                    }
                }
            })

            group = group.set('children', children)
        }

        return group
    }

    _extractRequest(item) {
        if (!item.request || typeof item.request === 'string') {
            return null
        }

        let id = item.id || null
        let name = item.name || null

        let _req = item.request
        let description = _req.description || null
        let [ url, queries, paths ] = this._extractURL(_req.url || null)
        let auths = this._extractAuths(_req.auth || null)
        let method = _req.method || 'GET'
        let params = this._extractParams(_req, queries, paths)
        let responses = this._extractResponses(item.response || null)

        return new Request({
            id: id,
            name: name,
            description: description,
            url: url,
            auths: auths,
            method: method,
            parameters: params,
            responses: responses
        })
    }

    _extractURL(url) {
        if (typeof url === 'string') {
            let [ _url, queries ] = this._extractQueriesFromUrl(url)
            return [ _url, queries, new Immutable.List() ]
        }

        let protocol = url.protocol || 'http'
        let hostname = url.domain || 'localhost'

        let pathname = ''
        if (url.path) {
            if (typeof url.path === 'string') {
                pathname = url.path
            }
            else if (url.path.length) {
                pathname = url.path.map(segment => {
                    if (typeof segment === 'string') {
                        return segment
                    }
                    else {
                        return segment.value
                    }
                })
            }
        }

        let port = url.port || null

        let search = null
        let queries = new Immutable.List()
        if (url.query) {
            let [ _search, _queries ] = this._generateQueries(url.query)
            search = _search
            queries = _queries
        }

        let hash = url.hash || null

        let vars = url.variable || []

        let host = hostname
        if (port) {
            host += ':' + port
        }

        let _url = new URL({
            protocol: this._extractParam('protocol', protocol),
            host: this._extractParam('host', host),
            hostname: this._extractParam('host', hostname),
            port: this._extractParam('port', port),
            pathname: this._extractParam('pathname', pathname),
            search: this._extractParam('search', search),
            hash: this._extractParam('hash', hash)
        })

        let pathParams = this._extractPathsVariables(vars)

        return [ _url, queries, pathParams ]
    }

    _generateQueries(queries) {
        let _queries = []
        let search = ''
        if (queries.length) {
            search = '?'
            for (let query of queries) {
                let param = this._extractParam(
                    decodeURIComponent(query.key),
                    decodeURIComponent(query.value)
                )

                search += query.key
                if (typeof query.value !== 'undefined') {
                    search += '=' + query.value
                }
                search += '&'
                _queries.push(param)
            }
        }

        return [ search.slice(0, -1), new Immutable.List(_queries) ]
    }

    _extractPathsVariables(vars) {
        let params = []
        if (vars.length) {
            for (let param of params) {
                let _param = this._extractParam(
                    param.name,
                    param.value
                )

                params.push(_param)
            }
        }

        return new Immutable.List(params)
    }

    _extractQueriesFromUrl(url) {
        let _url = new URL(url)
        let queries = new Immutable.List()

        let protocol = this._extractParam(
            'protocol', _url.generateParam('protocol')
        )
        let host = this._extractParam(
            'host', _url.generateParam('host')
        )
        let path = this._extractParam(
            'pathname', _url.generateParam('pathname')
        )

        _url = _url
            .set('protocol', protocol)
            .set('host', host)
            .set('pathname', path)

        let match = url.match(/([^?]+)\?(.*)/)
        if (match) {
            let components = match[2].split('&')
            for (let component of components) {
                let query = this._extractQueryFromComponent(component)
                if (query) {
                    queries = queries.push(query)
                }
            }
        }

        return [ _url, queries ]
    }

    _escapeURIFragment(uriFragment) {
        return uriFragment.replace(/~/g, '~0').replace(/\//g, '~1')
    }

    _unescapeURIFragment(uriFragment) {
        return uriFragment.replace(/~1/g, '/').replace(/~0/g, '~')
    }

    _extractQueryFromComponent(component) {
        let m = component.match(/^([^\=]+)(?:\=([\s\S]*))?$/)

        if (!m) {
            return null
        }

        let key = decodeURIComponent(m[1])
        let value = null
        if (typeof m[2] === 'string') {
            value = decodeURIComponent(m[2])
        }

        return this._extractParam(key, value)
    }

    _extractParam(_key, _value) {
        let key = _key
        let name = this._referenceEnvironmentVariable(key)

        let value
        let internals = new Immutable.List()

        if (typeof _value === 'string') {
            value = this._referenceEnvironmentVariable(
                _value
            )
        }
        else if (_value.length) {
            value = _value[0]
            internals = new Immutable.List([
                new Constraint.Enum(_value)
            ])
        }

        let type = 'string'
        if (value instanceof LateResolutionReference) {
            type = 'reference'
        }
        else {
            internals = new Immutable.List([
                new Constraint.Enum([ value ])
            ])
        }

        return new Parameter({
            key: key,
            name: name,
            value: value,
            type: type,
            internals: internals
        })
    }

    _referenceEnvironmentVariable(string) {
        if (typeof string === 'undefined' || string === null) {
            return null
        }

        if (typeof string === 'string') {
            if (string.match(/{{[^{}]*}}/)) {
                let ref = new LateResolutionReference({
                    uri: '#/postman/' + this._escapeURIFragment(string),
                    relative: '#/postman/' + this._escapeURIFragment(string),
                    resolved: true
                })
                this.references = this.references.push(ref)
                return ref
            }
            else {
                return string
            }
        }
    }

    _extractAuths(auth) {
        let type = auth.type || null

        let typeMap = {
            awsv4: this._extractAWSS4Auth,
            basic: this._extractBasicAuth,
            digest: this._extractDigestAuth,
            hawk: this._extractHawkAuth,
            oauth1: this._extractOAuth1,
            oauth2: this._extractOAuth2
        }

        if (typeMap[type]) {
            let _auth = typeMap[type](auth[type])
            return new Immutable.List([ _auth ])
        }
        else {
            return new Immutable.List([ null ])
        }
    }

    // @tested
    _extractBasicAuth(auth) {
        return new Auth.Basic({
            username: this._referenceEnvironmentVariable(
                auth.username
            ),
            password: this._referenceEnvironmentVariable(
                auth.password
            )
        })
    }

    _extractDigestAuth(auth) {
        return new Auth.Digest({
            username: this._referenceEnvironmentVariable(
                auth.username
            ),
            password: this._referenceEnvironmentVariable(
                auth.password
            )
        })
    }

    _extractAWSS4Auth(auth) {
        return new Auth.AWSSig4({
            key: this._referenceEnvironmentVariable(
                auth.accessKey
            ),
            secret: this._referenceEnvironmentVariable(
                auth.secretKey
            ),
            region: this._referenceEnvironmentVariable(
                auth.region
            ),
            service: this._referenceEnvironmentVariable(
                auth.service
            )
        })
    }

    _extractHawkAuth(auth) {
        return new Auth.Hawk({
            algorithm: this._referenceEnvironmentVariable(
                auth.algorithm
            ),
            key: this._referenceEnvironmentVariable(
                auth.hawk_key
            ),
            id: this._referenceEnvironmentVariable(
                auth.hawk_id
            )
        })
    }

    _extractOAuth1(auth) {
        return new Auth.OAuth1({
            consumerKey: this._referenceEnvironmentVariable(
                auth.consumerKey
            ),
            algorithm: this._referenceEnvironmentVariable(
                auth.oauth_signature_method
            ),
            timestamp: this._referenceEnvironmentVariable(
                auth.timeStamp || auth.timestamp
            ),
            nonce: this._referenceEnvironmentVariable(
                auth.nonce
            ),
            version: this._referenceEnvironmentVariable(
                auth.version
            )
        })
    }

    _extractOAuth2(auth) {
        return new Auth.OAuth1({
            authorizationUrl: this._referenceEnvironmentVariable(
                auth.authUrl
            ),
            accessTokenUrl: this._referenceEnvironmentVariable(
                auth.tokenUrl
            ),
            scopes: [ this._referenceEnvironmentVariable(
                auth.scope
            ) ]
        })
    }

    _extractParams(req, queries, paths) {
        let [ _headers ] = this._extractHeaders(req)
        let [ body, headers ] = this._extractBodyParams(req.body, _headers)

        let container = new ParameterContainer({
            queries: queries,
            headers: headers,
            body: body,
            paths: paths
        })

        return container
    }

    _extractHeaders(req) {
        if (typeof req.headers === 'string') {
            return this._extractHeadersFromString(req)
        }
        else {
            return this._extractHeadersFromObject(req.headers)
        }
    }

    _extractHeadersFromObject(headers) {
        let _headers = []
        for (let header of headers) {
            let param = this._extractParam(header.key, header.value)
            _headers.push(param)
        }

        return new Immutable.List(headers)
    }

    _extractHeadersFromString(req) {
        let headerLines = req.headers.split('\n')
        let headerSet = new Immutable.OrderedMap()
        let headers = []

        for (let headerLine of headerLines) {
            let match = headerLine.match(/^([^\s\:]*)\s*\:\s*(.*)$/)
            if (match) {
                headerSet = headerSet.set(match[1],
                    this._referenceEnvironmentVariable(match[2])
                )
            }
        }

        headerSet.forEach((value, key) => {
            let param = this._extractParam(key, value)
            headers.push(param)
        })

        return new Immutable.List(headers)
    }

    _extractBodyParams(body, _headers) {
        let headers = _headers
        let params = []
        let contentType = this._extractContentType(headers)
        if (body.mode === 'raw') {
            let param = this._extractParam('body', body.raw || null)
            params.push(param)
        }
        else if (body.mode === 'urlencoded') {
            if (!contentType) {
                let header = this._extractParam(
                    'Content-Type', 'application/x-www-form-urlencoded'
                )

                headers = headers.push(header)
            }

            for (let _param of body.urlencoded || []) {
                let param = this._extractParam(_param.key, _param.value)
                params.push(param)
            }
        }
        else if (body.mode === 'formdata') {
            if (!contentType) {
                let header = this._extractParam(
                    'Content-Type', 'multipart/form-data'
                )

                headers = headers.push(header)
            }

            for (let _param of body.formdata || []) {
                let param = this._extractParam(_param.key, _param.value)
                params.push(param)
            }
        }

        return [ new Immutable.List(params), headers ]
    }

    _extractContentType(headers) {
        let contentType = null
        headers.forEach(header => {
            if (
                header.get('key') === 'Content-Type' &&
                typeof header.get('value') === 'string'
            ) {
                contentType = header.get('value')
            }
        })

        return contentType
    }
}
