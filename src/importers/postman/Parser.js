import Immutable from 'immutable'

import RequestContext, {
    KeyValue,
    Group,
    Request,
    Environment,
    EnvironmentReference
} from '../../immutables/RequestContext'

import {
    BasicAuth,
    DigestAuth,
    OAuth1Auth,
    AWSSig4Auth,
    HawkAuth
} from '../../immutables/Auth'

export default class PostmanParser {
    contructor() {
        this.context = new RequestContext()
    }

    // @tested
    parse(string) {
        let collections = []
        let environments = []

        let obj
        try {
            obj = JSON.parse(string)
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

        this.context = this._createContext(environments, collections)
        return this.context
    }

    // @tested
    _createContext(environments, collections) {
        let envs = new Immutable.List(
            environments.map(
                env => {
                    return this._importEnvironment(env)
                }
            )
        )

        let baseGroup = collections.reduce(
            (rootGroup, collection) => {
                let group = this._importCollection(collection)
                return rootGroup.setIn(
                    [ 'children', group.get('id') ], group
                )
            },
            new Group()
        )

        let context = new RequestContext({
            environments: envs,
            group: baseGroup
        })

        return context
    }

    // @tested
    _importEnvironment(environment) {
        let env = new Environment({
            id: environment.id,
            name: environment.name
        })

        if (environment.values) {
            for (let value of environment.values) {
                env = env.setIn(
                    [ 'variables', value.key ],
                    new KeyValue({
                        key: value.key,
                        value: this._referenceEnvironmentVariable(value.value),
                        valueType: value.type || null
                    })
                )
            }
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

        let groups = []
        let stack = [
            {
                start: -1,
                end: string.length,
                depth: 0,
                ref: new EnvironmentReference()
            }
        ]
        let group
        let level = 0
        let prevChar = ''
        let notEvaluatedIndex = 0
        let i = 0
        for (let char of string) {
            if (char === '{' && prevChar === '{') {
                level += 1
                char = ''

                let parentGroup = stack.pop()
                let component = string.substring(parentGroup.start + 1, i - 1)

                if (component.length > 0) {
                    parentGroup.ref = parentGroup.ref
                        .set(
                            'referenceName',
                            parentGroup.ref.referenceName.push(component)
                        )
                }

                stack.push(parentGroup)
                stack.push({
                    start: i,
                    depth: level,
                    components: [],
                    ref: new EnvironmentReference()
                })
            }

            if (char === '}' && prevChar === '}' && level > 0) {
                group = stack.pop()
                group.end = i
                notEvaluatedIndex = i
                group.str = string.substring(group.start + 1, group.end - 1)

                if (group.ref.get('referenceName').size === 0) {
                    group.ref = new EnvironmentReference({
                        referenceName: new Immutable.List([
                            string.substring(group.start + 1, group.end - 1)
                        ])
                    })
                }

                groups.push(group)

                let parentGroup = stack.pop()
                parentGroup.ref = parentGroup.ref
                    .set(
                        'referenceName',
                        parentGroup.ref.referenceName.push(group.ref)
                    )
                parentGroup.start = i
                stack.push(parentGroup)

                char = ''
                level -= 1
            }

            i += 1
            prevChar = char
        }

        if (stack.length > 1) {
            // unbalanced parenthesis -- too weird to work with
            return string
        }

        let result = stack.pop()

        if (result.start < 0 && result.end >= string.length) {
            return string
        }
        else {
            let ref = result.ref
            if (notEvaluatedIndex + 1 < string.length) {
                let trailing = string.substring(notEvaluatedIndex + 1)
                ref = ref.set('referenceName', ref.referenceName.push(trailing))
            }
            return ref
        }
    }

    // @tested
    _extractBasicAuth(params, helper) {
        let auth = new BasicAuth()
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

        let auth = new DigestAuth()
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
            kvList.forEach((set, kv) => {
                let [ key, value ] = kv.match(/([^=]*)="(.*)"/g).slice(1, 3)
                if (digestMap[key]) {
                    auth = auth.set(key, value)
                }
            })

            return auth
        }

        return null
    }

    _extractAWSS4Auth(params, helper) {
        let auth = new AWSSig4Auth()
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
    }

    _extractHawkAuth(params, helper) {
        let auth = new HawkAuth()

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
    }

    _extractOAuth1(params) {
        let auth = new OAuth1Auth()
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
            if (paramMap[key]) {
                auth = auth.set(
                    paramMap[key],
                    this._referenceEnvironmentVariable(
                        value.replace(/(^")|("$)/g, '')
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

        let rule = helperMap[helperType]
        if (rule) {
            return rule(params, helper)
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
            return setup(params, helper)
        }

        return null
    }

    _extractQueriesFromUrl(url) {
        let _url = url
        let queries = []

        let match = _url.match(/([^?]+)\?(.*)/)
        if (match) {
            _url = match[1]
            let components = match[2].split('&')
            for (let component of components) {
                let m = component.match(/^([^\=]+)(?:\=([\s\S]*))?$/)
                queries.push(new KeyValue({
                    key: this._referenceEnvironmentVariable(
                        decodeURIComponent(m[1])
                    ),
                    value: typeof m[2] === 'string' ?
                        this._referenceEnvironmentVariable(
                            decodeURIComponent(m[2])
                        ) : null
                }))
            }
        }

        let _queries = new Immutable.List(queries)
        return [ _url, _queries ]
    }

    _createRequest(collection, req) {
        let bodyType
        let body
        let headerLines = req.headers.split('\n')
        let headers = new Immutable.OrderedMap()
        let auths = new Immutable.List()

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
                        auths = auths.push(auth)
                    }
                }
                else {
                    headers.set(match[1],
                        this._referenceEnvironmentVariable(match[2])
                    )
                }
            }
        }

        if (req.dataMode === 'raw') {
            let contentType = headers.get('Content-Type')
            let rawReqBody = req.rawModeData

            if (
                contentType &&
                contentType.indexOf('json') >= 0 &&
                rawReqBody &&
                rawReqBody.length > 0
            ) {
                if (rawReqBody) {
                    bodyType = 'plain'
                    body = rawReqBody
                }

                try {
                    let jsonObj = JSON.parse(rawReqBody)
                    bodyType = 'json'
                    body = jsonObj
                }
                catch (e) {
                    /* eslint-disable no-console */
                    console.error(
                        'failed to parse JSON ' +
                        'body despite header claiming it is JSON'
                    )
                    /* eslint-enable no-console */
                }
            }
            else {
                bodyType = 'plain'
                if (rawReqBody) {
                    body = rawReqBody
                }
            }
        }
        else if (req.dataMode === 'urlencoded' || req.dataMode === 'params') {
            if (req.dataMode === 'urlencoded') {
                bodyType = 'urlEncode'
            }
            else if (req.dataMode === 'params') {
                bodyType = 'formData'
            }
            body = new Immutable.List()
            if (req.data) {
                for (let param of req.data) {
                    body = body.push(new KeyValue({
                        key: this._referenceEnvironmentVariable(param.key),
                        value: this._referenceEnvironmentVariable(param.value),
                        valueType: param.type
                    }))
                }
            }
        }

        let [ url, queries ] = this._extractQueriesFromUrl(req.url)

        let request = new Request({
            id: req.id,
            name: req.name,
            description: req.description,
            method: req.method,
            url: url,
            queries: queries,
            headers: headers,
            bodyType: bodyType,
            body: body,
            auth: auths
        })

        return request
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

                    for (let id of folder.order || []) {
                        let req = requests[id]
                        group = group.setIn(
                            [ 'children', req.get('name') || req.get('url') ],
                            req
                        )
                    }

                    rootGroup = rootGroup
                        .setIn([ 'children', group.get('name') ], group)
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
