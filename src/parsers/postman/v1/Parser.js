import Immutable from 'immutable'

import Context, {
    Parameter,
    ParameterContainer
} from '../../../models/Core'

import Constraint from '../../../models/Constraint'

import ReferenceContainer from '../../../models/references/Container'
import LateResolutionReference from '../../../models/references/LateResolution'

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
    parse(item) {
        let collections = []
        let environments = []

        let obj
        try {
            obj = JSON.parse(item.content)
        }
        catch (e) {
            throw new Error('Invalid Postman file (not a valid JSON)')
        }
        /* .postman_dump */
        if (obj.collections || obj.environments) {
            if (obj.collections) {
                for (let collection of obj.collections) {
                    collections.push(collection)
                }
            }
            if (obj.environments) {
                for (let environment of obj.environments) {
                    environments.push(environment)
                }
            }
        }
        /* .postman_collection */
        else if (obj.requests) {
            collections.push(obj)
        }
        /* .postman_environment */
        else if (obj.values && obj.name) {
            environments.push(obj)
        }
        else {
            throw new Error('Invalid Postman file (missing required keys)')
        }
        this.context = ::this._createContext(environments, collections)
        return this.context
    }

    // @tested
    _createContext(environments, collections) {
        let envs = new Immutable.OrderedMap()
        environments.forEach(_env => {
            let env = this._importEnvironment(_env)
            envs = envs.set(env.get('id'), env)
        })
        let baseGroup = collections.reduce(
            (rootGroup, collection) => {
                let group = this._importCollection(collection)
                return rootGroup.setIn(
                    [ 'children', group.get('id') ], group
                )
            },
            new Group()
        )

        if (this.references) {
            let keys = envs.keySeq()
            for (let key of keys) {
                let container = envs.get(key)
                container = container.create(this.references)
                envs = envs.set(key, container)
            }
        }

        let context = new Context({
            references: envs,
            group: baseGroup
        })
        return context
    }

    // @tested
    _importEnvironment(environment) {
        let env = new ReferenceContainer({
            id: environment.id,
            name: environment.name
        })

        if (environment.values) {
            let refs = environment.values.map(value => {
                return new LateResolutionReference({
                    uri: '#/x-postman/{{' + value.key + '}}',
                    relative: '#/x-postman/{{' + value.key + '}}',
                    value: value.value,
                    resolved: true
                })
            })
            env = env.create(refs)
        }

        return env
    }

    // @tested
    _importCollection(collection) {
        if (!collection.requests) {
            throw new Error('Invalid Postman file (missing data)')
        }

        let requestsById = {}
        for (let req of collection.requests) {
            let request = ::this._createRequest(collection, req)
            requestsById[req.id] = request
        }

        return this._createGroupFromCollection(
            collection, requestsById
        )
    }

    // @tested
    _referenceEnvironmentVariable(string) {
        if (typeof string === 'undefined' || string === null) {
            return null
        }

        if (typeof string === 'string') {
            if (string.match(/{{[^{}]*}}/)) {
                let ref = new LateResolutionReference({
                    uri: '#/x-postman/' + this._escapeURIFragment(string),
                    relative: '#/x-postman/' + this._escapeURIFragment(string),
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

    // @tested
    _extractBasicAuth(params, helper) {
        let auth = new Auth.Basic()
        if (helper) {
            return auth
                .set(
                    'username',
                    this._referenceEnvironmentVariable(
                        helper.username
                    )
                )
                .set(
                    'password',
                    this._referenceEnvironmentVariable(
                        helper.password
                    )
                )
        }
        else {
            return auth.set('raw', params || null)
        }
    }

    _extractDigestAuth(params, helper) {
        const digestMap = {
            username: true,
            password: true
        }

        let auth = new Auth.Digest()
        if (helper) {
            return auth
                .set(
                    'username',
                    this._referenceEnvironmentVariable(
                        helper.username
                    )
                )
                .set(
                    'password',
                    this._referenceEnvironmentVariable(
                        helper.password
                    )
                )
        }
        else {
            let kvList = params.match(/([^\s,]*="[^"]*")|([^\s,]*='[^']*')/g)
            kvList.forEach((kv) => {
                let kvMatch = kv
                    .match(/([^=]*)=["'](.*)["']/)
                if (kvMatch) {
                    let [ key, value ] = kvMatch.slice(1, 3)
                    if (digestMap[key]) {
                        auth = auth.set(key,
                            this._referenceEnvironmentVariable(value)
                        )
                    }
                }
            })

            return auth
        }

        return null
    }

    _extractAWSS4Auth(params, helper) {
        let auth = new Auth.AWSSig4()
        if (helper) {
            return auth
                .set(
                    'key',
                    this._referenceEnvironmentVariable(
                        helper.accessKey
                    )
                )
                .set(
                    'secret',
                    this._referenceEnvironmentVariable(
                        helper.secretKey
                    )
                )
                .set(
                    'region',
                    this._referenceEnvironmentVariable(
                        helper.region
                    )
                )
                .set(
                    'service',
                    this._referenceEnvironmentVariable(
                        helper.service
                    )
                )
        }
        return auth
    }

    _extractHawkAuth(params, helper) {
        let auth = new Auth.Hawk()

        if (helper) {
            return auth
            .set(
                'algorithm',
                this._referenceEnvironmentVariable(
                    helper.algorithm
                )
            )
            .set(
                'key',
                this._referenceEnvironmentVariable(
                    helper.hawk_key
                )
            )
            .set(
                'id',
                this._referenceEnvironmentVariable(
                    helper.hawk_id
                )
            )
        }
        return auth
    }

    _extractOAuth1(params) {
        let auth = new Auth.OAuth1()
        if (!params) {
            return auth
        }

        const paramMap = {
            oauth_consumer_key: 'consumerKey',
            oauth_signature_method: 'algorithm',
            oauth_timestamp: 'timestamp',
            oauth_nonce: 'nonce',
            oauth_version: 'version',
            oauth_signature: 'signature'
        }

        let kvList = (params || '').split(',')
        for (let kvStr of kvList) {
            let [ key, value ] = kvStr.split('=')
            key = key.replace(/(^[\s"']*)|([\s"']*$)/g, '')
            if (paramMap[key]) {
                auth = auth.set(
                    paramMap[key],
                    this._referenceEnvironmentVariable(
                        value.replace(/(^[\s"']*)|([\s"']*$)/g, '')
                    )
                )
            }
        }
        return auth
    }

    _extractAuth(authLine, helperType, helper) {
        let [ , scheme, params ] = authLine.match(/([^\s]+)\s(.*)/)

        let helperMap = {
            basicAuth: ::this._extractBasicAuth,
            digestAuth: ::this._extractDigestAuth,
            awsSigV4: ::this._extractAWSS4Auth,
            hawkAuth: ::this._extractHawkAuth
        }

        let _helper = helper
        if (typeof _helper === 'string') {
            try {
                _helper = JSON.parse(_helper)
            }
            catch (e) {
                /* eslint-disable no-console */
                console.error(
                    'We found a weird looking helper that we couldn\'t parse'
                )
                /* eslint-enable no-console */
            }
        }

        let rule = helperMap[helperType]
        if (rule) {
            return rule(params, _helper)
        }

        const schemeSetupMap = {
            Basic: ::this._extractBasicAuth,
            Digest: ::this._extractDigestAuth,
            OAuth: ::this._extractOAuth1,
            'AWS4-HMAC-SHA256': ::this._extractAWSS4Auth,
            Hawk: ::this._extractHawkAuth
        }

        let setup = schemeSetupMap[scheme]
        if (setup) {
            return setup(params, _helper)
        }

        return null
    }

    _createRequest(collection, req) {
        let [ container, url, auths ] = this._extractParameters(req)

        let request = new Request({
            id: req.id,
            name: req.name,
            description: req.description,
            method: req.method,
            url: url,
            parameters: container,
            auths: auths
        })

        return request
    }

    _extractParameters(req) {
        let [ _headers, auths ] = this._extractHeaders(req)
        let [ url, paths, queries ] = this._extractParamsFromUrl(req.url)
        let [ body, headers ] = this._extractBodyParams(req, _headers)

        let container = new ParameterContainer({
            queries: queries,
            headers: headers,
            body: body,
            path: paths
        })

        return [ container, url, auths ]
    }

    _extractHeaders(req) {
        let headerLines = req.headers.split('\n')
        let headerSet = new Immutable.OrderedMap()
        let auths = []
        let headers = []

        for (let headerLine of headerLines) {
            let match = headerLine.match(/^([^\s\:]*)\s*\:\s*(.*)$/)
            if (match) {
                if (match[1] === 'Authorization') {
                    let auth = ::this._extractAuth(
                        match[2],
                        req.currentHelper,
                        req.helperAttributes
                    )
                    if (auth) {
                        auths.push(auth)
                    }
                }
                else {
                    headerSet = headerSet.set(match[1],
                        this._referenceEnvironmentVariable(match[2])
                    )
                }
            }
        }

        headerSet.forEach((value, key) => {
            let param = this._extractParam(key, value)
            headers.push(param)
        })

        return [
            new Immutable.List(headers),
            new Immutable.List(auths)
        ]
    }


    _extractParamsFromUrl(url) {
        let _url = new URL(url)
        let queries = []
        let paths = []

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
                    queries.push(query)
                }
            }
        }

        if (path.get('type') === 'reference') {
            let ref = path.get('value')
            let value = ref.get('relative').split('/').slice(-1)[0]
            let content = this._unescapeURIFragment(value)
            let groups = content.match(/{{.*?}}/g)

            // warning: this only works with simple groups of the form {{ex}}
            // nested groups will produce weird path parameters
            if (groups) {
                for (let group of groups) {
                    let param = this._extractParam(group.slice(2, -2), group)
                    paths.push(param)
                }
            }
        }

        return [ _url, new Immutable.List(paths), new Immutable.List(queries) ]
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
        if (typeof _value === 'string') {
            value = this._referenceEnvironmentVariable(
                _value
            )
        }

        let internals = new Immutable.List()
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

    _extractBodyParams(req, _headers) {
        let headers = _headers
        let params = []
        if (req.dataMode === 'raw') {
            let param = this._extractParam('body', req.rawModeData || req.data)
            params.push(param)
        }
        else if (req.dataMode === 'urlencoded' || req.dataMode === 'params') {
            let contentType = this._extractContentType(headers)
            if (!contentType && req.dataMode === 'urlencoded') {
                let header = this._extractParam(
                    'Content-Type', 'application/x-www-form-urlencoded'
                )
                contentType = 'application/x-www-form-urlencoded'
                headers = headers.push(header)
            }
            else if (!contentType && req.dataMode === 'params') {
                let header = this._extractParam(
                    'Content-Type', 'multipart/form-data'
                )
                contentType = 'multipart/form-data'
                headers = headers.push(header)
            }

            if (req.data) {
                for (let _param of req.data) {
                    let param = this._extractParam(_param.key, _param.value)
                    if (contentType) {
                        param = param.set('externals', new Immutable.List([
                            new Parameter({
                                key: 'Content-Type',
                                type: 'string',
                                internals: new Immutable.List([
                                    new Constraint.Enum([
                                        contentType
                                    ])
                                ])
                            })
                        ]))
                    }
                    params.push(param)
                }
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

    _putRequestsInGroup(group, ids, requests) {
        let _group = group
        for (let id of ids) {
            let req = requests[id]
            if (req) {
                _group = _group.setIn(
                    [
                        'children', req.get('id')
                    ],
                    req
                )
            }
        }

        return _group
    }

    _createGroupFromCollection(collection, requests) {
        let rootGroup = new Group({
            id: collection.id,
            name: collection.name
        })
        if (collection.folders || collection.order) {
            if (collection.folders) {
                for (let folder of collection.folders) {
                    let group = new Group({
                        id: folder.id,
                        name: folder.name
                    })

                    group = this._putRequestsInGroup(
                        group,
                        folder.order || [],
                        requests
                    )

                    rootGroup = rootGroup
                        .setIn([ 'children', group.get('id') ], group)
                }
            }

            if (collection.order) {
                for (let id of collection.order) {
                    let req = requests[id]
                    rootGroup = rootGroup
                        .setIn([ 'children', req.get('id') ], req)
                }
            }
        }
        else {
            for (let id in requests) {
                if (requests.hasOwnProperty(id)) {
                    let req = requests[id]
                    rootGroup = rootGroup
                        .setIn([ 'children', req.get('id') ], req)
                }
            }
        }

        return rootGroup
    }
}
