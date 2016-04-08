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
    OAuth1Auth,
    AWSSig4Auth,
    HawkAuth
} from '../../immutables/Auth'

export default class SwaggerParser {
    contructor() {
        this.context = new RequestContext()
    }

    // @NotTested -> assumed valid
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
                    collections.push(environment)
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

    _importEnvironment(environment) {
        let env = new Environment({
            name: environment.name
        })

        if (environment.values) {
            for (let value of environment.values) {
                env = env.set(
                    value.key,
                    new KeyValue({
                        key: value.key,
                        value: value.value,
                        valueType: value.type
                    })
                )
            }
        }

        return env
    }

    _importCollection(collection) {
        if (!collection.requests) {
            throw new Error('Invalid Postman file (missing data)')
        }

        let requestsById = {}
        for (let req of collection.requests) {
            let request = this.createRequest(collection, req)
            requestsById[req.id] = request
        }

        return this._createGroupFromCollection(
            collection, requestsById
        )
    }

    _referenceEnvironmentVariable(string) {
        if (string === null) {
            return null
        }
        else {
            let match = string.match(/^\{\{([^\n\}]+)\}\}$/)
            if (match.length < 2) {
                return string
            }
            else {
                return new EnvironmentReference({
                    referenceName: this._referenceEnvironmentVariable(match[1])
                })
            }
        }
    }

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

    _extractAuth(authLine, helper) {
        let [ scheme, params ] = authLine.match(/([^\s]+) (.*)/)

        const schemeSetupMap = {
            Basic: this._extractBasicAuth,
            OAuth: this._extractOAuth1,
            'AWS4-HMAC-SHA256': this._extractAWSS4Auth,
            Hawk: this._extractHawkAuth
        }

        let setup = schemeSetupMap[scheme] || () => { return null }

        return setup(params, helper)
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
                    auths = auths.push(this._extractAuth(match[2]))
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
        }
        else if (req.dataMode === 'urlencoded' || req.dataMode === 'params') {
            if (req.dataMode === 'urlencoded') {
                bodyType = 'urlEncode'
            }
            else if (req.dataMode === 'params') {
                bodyType = 'formData'
            }
            body = new Immutable.List()
            for (let param of req.data) {
                body = body.push(new KeyValue({
                    key: this._referenceEnvironmentVariable(param.key),
                    value: this._referenceEnvironmentVariable(param.value),
                    valueType: param.type
                }))
            }
        }

        let request = new Request({
            id: req.id,
            name: req.name,
            description: req.description,
            method: req.method,
            url: req.url,
            headers: headers,
            bodyType: bodyType,
            body: body,
            auth: auths
        })

        return request
    }

    _createGroupFromCollection(collection, requests) {
        let rootGroup = new Group({
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
