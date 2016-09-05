import Immutable from 'immutable'

import DynamicValueManager from './dv/DVManager'

import Context, {
    Body,
    Parameter,
    ParameterContainer
} from '../../models/Core'

import URL from '../../models/URL'
import Request from '../../models/Request'
import Constraint from '../../models/Constraint'
import Group from '../../models/Group'
import Auth from '../../models/Auth'
import Reference from '../../models/references/Reference'
import ReferenceContainer from '../../models/references/Container'
import JSONSchemaReference from '../../models/references/JSONSchema'

import {
    Info
} from '../../models/Utils'

export default class PawParser {
    static identifier =
        'com.luckymarmot.PawExtensions.API-Flow'
    static title = 'Api-Flow'
    static help =
        'https://github.com/luckymarmot/API-Flow'
    static languageHighlighter = null
    static fileExtension = null

    constructor() {
        this.references = new Immutable.List()
        this.dvManager = null
    }

    generate(ctx, reqs, opts) {
        this.dvManager = new DynamicValueManager(ctx)
        let group = this._parseGroup(ctx, reqs, opts)
        let references = this._parseDomains(ctx, reqs, opts)
        let info = this._parseInfo(ctx, reqs, opts)

        let context = new Context({
            group: group,
            references: references,
            info: info
        })

        return context
    }

    _parseGroup(ctx, reqs, opts) {
        if (!reqs) {
            return null
        }

        let groupMap = {}
        reqs.forEach(req => {
            let request = this._parseRequest(ctx, req, opts)
            let gid = (req.parent || {}).id || null
            if (!groupMap[gid]) {
                let name = (req.parent || {}).name || null
                groupMap[gid] = new Group({
                    id: gid,
                    name: name
                })
            }

            groupMap[gid] = groupMap[gid]
                .setIn([ 'children', req.id ], request)
        })

        let keys = Object.keys(groupMap)
        while (keys.length > 1) {
            let id = keys[0]

            if (id === 'null') {
                id = keys[1]
            }

            let group = groupMap[id]
            delete groupMap[id]

            let _group = ctx.getRequestGroupById(id)

            let gid = (_group.parent || {}).id || null
            if (!groupMap[gid]) {
                let name = (_group.parent || {}).name || null
                groupMap[gid] = new Group({
                    id: gid,
                    name: name
                })
            }

            groupMap[gid] = groupMap[gid]
                .setIn([ 'children', _group.id ], group)

            keys = Object.keys(groupMap)
        }

        let id = keys[0]

        return groupMap[id] || null
    }

    _parseRequest(ctx, req) {
        let id = req.id || null
        let name = req.name || null
        let [ body, contentType, externals ] = this._formatBody(req)
        let bodies = this._formatBodies(contentType)
        let [ url, pathParams ] = this._formatURL(req, externals)
        let method = req.method || 'get'
        let description = req.description || null

        let [ headers, auths ] = this._formatHeaders(
            req.getHeaders(true), contentType, new Immutable.List(), externals
        )

        let queries = this._formatQueries(
            req.getUrlParameters(true),
            externals
        )

        let auth = this._formatAuth(req)
        if (auth) {
            auths = auths.push(auth)
        }

        let request = new Request({
            id: id,
            name: name,
            url: new URL(url),
            method: method,
            description: description,
            parameters: new ParameterContainer({
                path: pathParams,
                headers: headers,
                queries: queries,
                body: body
            }),
            bodies: bodies,
            auths: auths
        })

        return request
    }

    _formatBodies(contentType) {
        return new Immutable.List([
            new Body({
                constraints: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        type: 'string',
                        value: contentType
                    })
                ])
            })
        ])
    }

    _formatURL(req, externals) {
        let ds = req.getUrlBase(true)

        if (!ds || !ds.length) {
            return [
                {
                    protocol: 'http',
                    host: 'localhost',
                    pathname: '/'
                },
                new Immutable.List()
            ]
        }

        let stepOrder = [ 'protocol', 'host', 'pathname' ]
        let stepMarkers = {
            protocol: '://',
            host: '/',
            pathname: '\\?'
        }
        let currentStepIndex = 0
        let currentStepString = ''

        let url = {}

        let parameters = {
            protocol: {},
            host: {},
            pathname: {}
        }

        let dvNames = {}

        let evaluatedHost = ds.getEvaluatedString()
        if (
            typeof evaluatedHost === 'string' &&
            !evaluatedHost.match('://')
        ) {
            currentStepIndex = 1
        }

        for (let index = 0; index < ds.length; index += 1) {
            let component = ds.getComponentAtIndex(index)
            if (typeof component === 'string' ||
                component.type
                ===
                'com.luckymarmot.EnvironmentVariableDynamicValue'
            ) {
                let content
                if (typeof component === 'string') {
                    content = component
                }
                else {
                    content = component.getEvaluatedString()
                }

                let step = stepOrder[currentStepIndex]
                let marker = stepMarkers[step]
                let m = content.match(marker)

                while (m) {
                    currentStepString += content.slice(0, m.index)
                    content = content.slice(m.index + marker.length)
                    url[step] = currentStepString

                    currentStepString = ''
                    currentStepIndex += 1
                    step = stepOrder[currentStepIndex]
                    marker = stepMarkers[step]
                    m = content.match(marker)
                }

                if (!m) {
                    currentStepString += content
                }
            }
            else {
                /*
                    FIXME: If the JSONSchemaReference generates more than one
                    block of the url, the code generators will output garbage.

                    Possible Fix, check if the JSF generates more than one block
                    and act accordingly (use getEvaluatedString)
                */
                let val = this.dvManager.convert(component)
                if (val instanceof JSONSchemaReference) {
                    let title = val.get('value')['x-title']
                    if (title) {
                        currentStepString += '{' + title + '}'

                        let param = this._formatParamWithConstraints(
                            title,
                            val.get('value'),
                            title,
                            externals
                        )
                        let step = stepOrder[currentStepIndex]
                        parameters[step][title] = param
                    }
                    else {
                        let identifier = 'Object'
                        identifier = dvNames[identifier] ?
                            identifier + '_' + dvNames :
                            identifier

                        dvNames[identifier] = (dvNames[identifier] || 0) + 1

                        currentStepString += '{' + identifier + '}'

                        let param = this._formatParamWithConstraints(
                            identifier,
                            val.get('value'),
                            identifier,
                            externals
                        )

                        let step = stepOrder[currentStepIndex]
                        parameters[step][identifier] = param
                    }
                }
                else {
                    let identifier = component.type
                        .match('\.([^.]+)$')[1]
                        .replace('DynamicValue', '')
                    if (dvNames[identifier]) {
                        dvNames[identifier] += 1
                        identifier += '_' + dvNames[identifier]
                    }
                    else {
                        dvNames[identifier] = 1
                    }
                    currentStepString += '{' + identifier + '}'

                    let param = new Parameter({
                        key: identifier,
                        name: identifier,
                        value: component.getEvaluatedString(),
                        type: 'string',
                        externals: externals
                    })

                    let step = stepOrder[currentStepIndex]
                    parameters[step][identifier] = param
                }
            }
        }

        let step = stepOrder[currentStepIndex]
        url[step] = currentStepString

        if (typeof url.protocol === 'undefined') {
            url.protocol = 'http'
        }

        if (typeof url.host === 'undefined') {
            url.host = 'localhost'
        }

        if (typeof url.pathname === 'undefined' || url.pathname === '') {
            url.pathname = '/'
        }
        else {
            url.pathname = '/' + url.pathname
        }

        url.protocol = this._formatURIComponent(
            'protocol',
            url.protocol,
            parameters.protocol
        )

        url.host = this._formatURIComponent(
            'host',
            url.host,
            parameters.host
        )

        url.pathname = this._formatURIComponent(
            'pathname',
            url.pathname,
            parameters.pathname
        )

        let pathParams = Object.values(parameters.pathname)

        return [ url, new Immutable.List(pathParams) ]
    }

    _formatURIComponent(source, content, parameters) {
        let re = /{([^{}]*)}/g
        let m

        let currentIndex = 0
        let sequence = []

        while ((m = re.exec(content)) !== null) {
            if (currentIndex !== m.index) {
                let substr = content.slice(currentIndex, m.index)
                let param = new Parameter({
                    type: 'string',
                    value: substr,
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            substr
                        ])
                    ])
                })
                sequence.push(param)
            }

            let _param = parameters[m[1]]
            if (!_param) {
                _param = new Parameter({
                    key: m[1],
                    name: m[1],
                    type: 'string',
                    value: m[1],
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            m[1]
                        ])
                    ])
                })
            }

            sequence.push(_param)

            currentIndex = m.index + m[0].length
        }

        if (currentIndex < content.length) {
            let substr = content.slice(currentIndex, content.length)
            let param = new Parameter({
                type: 'string',
                value: substr,
                internals: new Immutable.List([
                    new Constraint.Enum([
                        substr
                    ])
                ])
            })
            sequence.push(param)
        }

        if (sequence.length > 1) {
            return new Parameter({
                key: source,
                name: source,
                type: 'string',
                format: 'sequence',
                value: new Immutable.List(sequence)
            })
        }

        return sequence[0]
    }

    _formatParamWithConstraints(_key, schema, _name, externals) {
        let name = _name ? _name : _key

        let internalsMap = {
            maximum: Constraint.Maximum,
            minimum: Constraint.Minimum,
            maxLength: Constraint.MaxLength,
            minLength: Constraint.MinLength,
            pattern: Constraint.Pattern,
            maxItems: Constraint.MaxItems,
            minItems: Constraint.MinItems,
            uniqueItems: Constraint.UniqueItems,
            enum: Constraint.Enum,
            multipleOf: Constraint.MultipleOf
        }

        let type = schema.type || null

        let internals = []
        let keys = Object.keys(schema)
        for (let key of keys) {
            if (internalsMap[key]) {
                let constraint = new internalsMap[key](schema[key])
                internals.push(constraint)
            }

            if (key === 'exclusiveMaximum') {
                internals.push(
                    new Constraint.ExclusiveMaximum(schema.maximum)
                )
            }

            if (key === 'exclusiveMinimum') {
                internals.push(
                    new Constraint.ExclusiveMinimum(schema.minimum)
                )
            }
        }

        let param = new Parameter({
            key: _key,
            name: name,
            type: type,
            internals: new Immutable.List(internals),
            externals: externals
        })

        return param
    }

    _formatParam(key, value, externals) {
        let name = key ? key : 'body'
        let param = new Parameter({
            key: key,
            name: name,
            value: value,
            type: 'string',
            internals: new Immutable.List([
                new Constraint.Enum([ value ])
            ]),
            externals: externals
        })

        return param
    }

    _formatReferenceParam(_key, ref, externals) {
        let key = _key
        if (!key) {
            key = this._unescapeURIFragment(
                ref.get('uri').split('/').slice(-1)[0]
            )
        }

        let param = new Parameter({
            key: key,
            name: key,
            value: ref,
            type: 'reference',
            externals: externals
        })

        return param
    }

    _unescapeURIFragment(uriFragment) {
        return uriFragment.replace(/~1/g, '/').replace(/~0/g, '~')
    }

    _formatHeaderParam(key, ds, _auths, externals) {
        let param = null
        let auths = _auths

        if (ds.length > 1) {
            let value = new Immutable.List()
            for (let component of ds.components) {
                let [ _param, auth ] = this
                    ._formatHeaderComponent(
                        null,
                        component,
                        this.dvManager,
                        externals
                    )

                if (_param) {
                    value = value.push(_param)
                }

                if (auth) {
                    auths = auths.push(auth)
                }
            }

            param = new Parameter({
                key: key,
                name: key,
                type: 'string',
                format: 'sequence',
                value: value,
                externals: externals
            })
        }
        else {
            let [ _param, auth ] = this
                ._formatHeaderComponent(
                    key,
                    ds.getComponentAtIndex(0) || '',
                    this.dvManager,
                    externals
                )

            if (_param) {
                param = _param
            }

            if (auth) {
                auths = auths.push(auth)
            }
        }

        return [ param, auths ]
    }

    _formatHeaderComponent(key, component, dvManager, externals) {
        let param = null
        let auth = null

        let val = dvManager.convert(component)

        if (typeof component === 'string') {
            param = this._formatParam(key, component, externals)
        }
        else if (
            val instanceof Auth.Digest ||
            val instanceof Auth.AWSSig4 ||
            val instanceof Auth.Hawk ||
            val instanceof Auth.OAuth2
        ) {
            auth = val
        }
        else if (val instanceof JSONSchemaReference) {
            param = this._formatParamWithConstraints(
                key,
                val.get('value'),
                key,
                externals
            )
        }
        else if (val instanceof Reference) {
            param = this._formatReferenceParam(key, val, externals)
            this.references = this.references.push(val)
        }
        else {
            param = this._formatParam(
                key,
                component.getEvaluatedString(),
                externals
            )
        }

        return [ param, auth ]
    }

    _formatHeaders(headers, contentType, _auths, externals) {
        let auths = _auths
        let keys = Object.keys(headers)

        let params = []
        for (let key of keys) {
            let header = this._formatHeaderParam(
                key, headers[key], auths, externals
            )

            let param = header[0]
            if (param) {
                params.push(param)
            }

            auths = header[1]
        }

        if (!headers['Content-Type'] && contentType) {
            let param = this._formatParam(
                'Content-Type',
                contentType,
                externals)
            params.push(param)
        }

        return [ new Immutable.List(params), auths ]
    }

    _formatQueryParam(key, ds, externals) {
        let param = null

        if (ds.length > 1) {
            let value = new Immutable.List()
            for (let component of ds.components) {
                let _param = this._formatQueryComponent(
                    null, component, this.dvManager, externals
                )
                value = value.push(_param)
            }

            param = new Parameter({
                key: key,
                name: key,
                type: 'string',
                format: 'sequence',
                value: value,
                externals: externals
            })
        }
        else {
            let _param = this._formatQueryComponent(
                key,
                ds.getComponentAtIndex(0) || '',
                this.dvManager,
                externals
            )
            param = _param
        }

        return param
    }

    _formatQueryComponent(key, component, dvManager, externals) {
        let param = null

        let val = dvManager.convert(component)

        if (typeof component === 'string') {
            param = this._formatParam(key, component, externals)
        }
        else if (val instanceof JSONSchemaReference) {
            param = this._formatParamWithConstraints(
                key, val.get('value'), key, externals
            )
        }
        else if (val instanceof Reference) {
            param = this._formatReferenceParam(key, val, externals)
            this.references = this.references.push(val)
        }
        else {
            param = this._formatParam(
                key, component.getEvaluatedString(), externals
            )
        }

        return param
    }

    _formatQueries(queries, externals) {
        let keys = Object.keys(queries)

        let params = []
        for (let key of keys) {
            let query = this._formatQueryParam(key, queries[key], externals)
            params.push(query)
        }

        return new Immutable.List(params)
    }

    _formatPlainBody(content, externals) {
        let param = null
        if (typeof content === 'string') {
            let schema = {
                type: 'string',
                default: content
            }

            let ref = new JSONSchemaReference({
                uri: null,
                relative: null,
                value: schema,
                // TODO fix this, not correct atm
                resolved: true
            })

            param = new Parameter({
                key: null,
                name: 'body',
                value: ref,
                type: 'reference',
                externals: externals
            })
        }

        if (content.length > 1) {
            let schema = {
                type: 'string',
                default: content.getEvaluatedString()
            }

            let ref = new JSONSchemaReference({
                uri: null,
                relative: null,
                value: schema,
                // TODO fix this, not correct atm
                resolved: true
            })

            param = new Parameter({
                key: null,
                name: 'body',
                value: ref,
                type: 'reference',
                externals: externals
            })
        }
        else if (content.length === 1) {
            let val = this.dvManager.convert(content.getComponentAtIndex(0))
            param = null

            if (val instanceof JSONSchemaReference) {
                param = new Parameter({
                    key: null,
                    name: 'body',
                    value: val,
                    type: 'reference',
                    externals: externals
                })

                this.references = this.references.push(val)
            }
            else if (val instanceof Reference) {
                param = this._formatReferenceParam(null, val, externals)
                this.references = this.references.push(val)
            }
            else {
                let schema = {
                    type: 'string',
                    default: val
                }

                let ref = new JSONSchemaReference({
                    uri: null,
                    relative: null,
                    value: schema,
                    // TODO fix this, not correct atm
                    resolved: true
                })

                param = new Parameter({
                    key: null,
                    name: 'body',
                    value: ref,
                    type: 'reference',
                    externals: externals
                })
            }

            return param
        }

        // DynamicString had no content, returning null
        return null
    }

    _formatBody(req) {
        let params = []
        let contentType

        let body = req.getBody(true)
        let urlEncoded = req.getUrlEncodedBody(true)
        let formData = req.getMultipartBody(true)

        let external = null

        if (body && body.length === 1) {
            if (
                urlEncoded &&
                urlEncoded !== null
            ) {
                contentType = 'application/x-www-form-urlencoded'
                external = new Parameter({
                    key: 'Content-Type',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([ contentType ])
                    ])
                })

                let keys = Object.keys(urlEncoded)
                for (let key of keys) {
                    let param = this._formatQueryParam(
                        key,
                        urlEncoded[key],
                        new Immutable.List([ external ])
                    )
                    params.push(param)
                }
            }
            else if (
                formData &&
                formData !== null
            ) {
                contentType = 'multipart/form-data'
                external = new Parameter({
                    key: 'Content-Type',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([ contentType ])
                    ])
                })

                let keys = Object.keys(formData)
                for (let key of keys) {
                    let param = this._formatQueryParam(
                        key,
                        formData[key],
                        new Immutable.List([ external ])
                    )
                    params.push(param)
                }
            }
        }

        if (body && params.length === 0) {
            contentType = 'text/plain'
            external = new Parameter({
                key: 'Content-Type',
                type: 'string',
                internals: new Immutable.List([
                    new Constraint.Enum([ contentType ])
                ])
            })

            let param = this._formatPlainBody(
                body,
                new Immutable.List([ external ])
            )

            if (param) {
                params.push(param)
            }
        }

        let externals = []
        if (external) {
            externals.push(external)
        }

        return [
            new Immutable.List(params),
            contentType,
            new Immutable.List(externals)
        ]
    }

    _formatAuth(req) {
        let basic = req.getHttpBasicAuth(false)
        let oauth1 = req.getOAuth1(false)
        let oauth2 = req.getOAuth2(false)

        let auths = []
        if (basic) {
            let auth = new Auth.Basic({
                username: basic.username || null,
                password: basic.password || null
            })
            auths.push(auth)
        }

        if (oauth1) {
            let auth = new Auth.OAuth1({
                callback: oauth1.callback || null,
                consumerKey: oauth1.consumerKey || null,
                consumerSecret: oauth1.consumerSecret || null,
                tokenSecret: oauth1.tokenSecret || null,
                algorithm: oauth1.algorithm || null,
                nonce: oauth1.nonce || null,
                additionalParameters: oauth1.additionalParameters || null,
                timestamp: oauth1.timestamp || null,
                token: oauth1.token || null
            })
            auths.push(auth)
        }

        if (oauth2) {
            let grantMap = {
                0: 'accessCode',
                1: 'implicit',
                2: 'application',
                3: 'password'
            }
            let scopes = (oauth2.scope || '').split(' ')

            if (scopes.length === 1 && scopes[0] === '') {
                scopes = null
            }

            let auth = new Auth.OAuth2({
                flow: grantMap[oauth2.grantType] || null,
                authorizationUrl: oauth2.authorizationUrl || null,
                tokenUrl: oauth2.tokenUrl || null,
                scopes: scopes
            })
            auths.push(auth)
        }

        return new Immutable.List(auths)
    }

    _parseDomains() {
        let references = this.references
        let container = new ReferenceContainer()

        container = container.create(references)

        return new Immutable.OrderedMap({
            paw: container
        })
    }

    _parseInfo() {
        return new Info()
    }
}
