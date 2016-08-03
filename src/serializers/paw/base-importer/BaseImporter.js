import Context, {
    Parameter
} from '../../../models/Core'

import Request from '../../../models/Request'

import LateResolutionReference from '../../../models/references/LateResolution'
import JSONSchemaReference from '../../../models/references/JSONSchema'
import Reference from '../../../models/references/Reference'

import {
    ApiKeyAuth
} from '../../../models/Auth'

import Item from '../../../models/Item'
import ContextResolver from '../../../resolvers/ContextResolver'
import PawEnvironment from '../../../models/environments/PawEnvironment'

import {
    DynamicValue,
    DynamicString
} from '../../../mocks/PawShims'

export default class BaseImporter {
    static fileExtensions = [];
    static inputs = [];

    constructor(context) {
        this.ENVIRONMENT_DOMAIN_NAME = 'Imported Environments'
        this.context = context || null
    }

    /*
      @params:
        - context
        - string
    */
    createRequestContextFromString(context, string) {
        return this.createRequestContexts(context, { content: string }, {})[0]
    }

    importString(context, string) {
        const requestContext = this.createRequestContextFromString(
            context,
            string
        )
        if (!(requestContext instanceof Context)) {
            throw new Error(
                'createRequestContextFromString ' +
                'did not return an instance of RequestContext'
            )
        }
        this._importPawRequests(requestContext)
        return true
    }

    /*
      @params:
        - context
        - items
        - options
    */
    createRequestContexts() {
        throw new Error('BaseImporter is an abstract class')
    }

    import(context, items, options) {
        this.context = context

        let parsePromiseOrResult = this.createRequestContexts(
            context,
            items,
            options
        )

        if (typeof parsePromiseOrResult.then !== 'function') {
            let value = parsePromiseOrResult
            parsePromiseOrResult = new Promise((resolve) => {
                resolve(value)
            })
        }

        let environment = new PawEnvironment()
        let resolver = new ContextResolver(environment)

        let importPromise = parsePromiseOrResult.then((requestContexts) => {
            let promises = []
            for (let env of requestContexts) {
                promises.push(
                    this._importContext(
                        resolver,
                        env.context,
                        env.items[0],
                        options
                    )
                )
            }

            return Promise.all(promises).then(() => {
                return true
            }, () => {
                return false
            })
        }, () => {
            return false
        }).catch(() => {
            return false
        })

        return importPromise
    }

    _importContext(resolver, reqContext, _item, options) {
        if (!(reqContext instanceof Context)) {
            throw new Error(
                'createRequestContext ' +
                'did not return an instance of RequestContext'
            )
        }

        let item = new Item(_item)

        return resolver.resolveAll(
            item,
            reqContext
        ).then(context => {
            try {
                this._importPawRequests(
                    context,
                    _item,
                    options
                )
                if (options && options.order) {
                    options.order += 1
                }
            }
            catch (e) {
                /* eslint-disable no-console */
                console.error('got error', e, JSON.stringify(e), e.stack)
                /* eslint-enable no-console */
            }
        }).catch(error => {
            /* eslint-disable no-console */
            console.error(
                'caught error',
                error,
                JSON.stringify(error),
                error.stack
            )
            /* eslint-enable no-console */
        })
    }

    serialize(requestContext, opts = null, item, options) {
        return this._importPawRequests(requestContext, item, options)
    }

    _importPawRequests(requestContext, item, options) {
        const group = requestContext.get('group')
        const references = requestContext.get('references')

        this._importReferences(references)

        const schema = requestContext.get('schema')

        if (group.get('children').size === 0) {
            return
        }

        let parent
        let name
        if (group.get('name')) {
            name = group.get('name')
        }
        else if (item && item.file) {
            name = item.file.name
        }
        else if (item && item.url) {
            name = item.url
        }

        parent = this.context.createRequestGroup(name)

        if (options && options.parent) {
            options.parent.appendChild(parent)
        }

        if (
            options &&
            options.order !== null &&
            typeof options.order !== 'undefined'
        ) {
            parent.order = options.order
        }

        let manageRequestGroups = (current, parentGroup) => {
            if (current === parentGroup.name || current === '') {
                return parentGroup
            }
            let pawGroup = this.context.createRequestGroup(current)
            parentGroup.appendChild(pawGroup)
            return pawGroup
        }

        this._applyFuncOverGroupTree(
            group,
            (request, requestParent) => {
                ::this._importPawRequest(
                    options,
                    requestParent,
                    request,
                    schema
                )
            },
            manageRequestGroups,
            parent
        )
    }

    _importReferences(references) {
        let environmentDomain = this._getEnvironmentDomain()

        let variablesDict = {}

        let environments = references.keySeq()
        for (let env of environments) {
            let pawEnv = this._getEnvironment(environmentDomain, env)
            let container = references.get(env)
            let uris = container.get('cache').keySeq()
            for (let uri of uris) {
                let reference = container.resolve(uri)
                let content = this._setReference(reference)
                let ds
                if (content instanceof DynamicString) {
                    ds = content
                }
                else {
                    ds = new DynamicString(content || '')
                }
                variablesDict[reference.get('relative')] = ds
            }

            pawEnv.setVariablesValues(variablesDict)
        }
    }

    _setReference(reference) {
        if (reference instanceof JSONSchemaReference) {
            return this._setJSONSchemaReference(reference)
        }
        else if (reference instanceof LateResolutionReference) {
            return this._setLateResolutionReference(reference)
        }
        else if (reference.get('value') === null) {
            return this._setExoticReference(reference)
        }
        else {
            return this._setSimpleReference(reference)
        }
    }

    _setJSONSchemaReference(reference) {
        let dv = new DynamicValue(
            'com.luckymarmot.PawExtensions.JSONSchemaFakerDynamicValue',
            {
                schema: JSON.stringify(reference.toJSONSchema() || {})
            }
        )
        return dv
    }

    _setLateResolutionReference(reference) {
        let ref = (reference.get('relative') || reference.get('uri') || '')
            .slice(12)
        let match = ref.match(/({{[^{}]*}})/g)
        if (match) {
            // self reference with null value should return null
            if (ref === match[0]) {
                return ''
            }

            let dvs = match.map(group => {
                let envVariable = this._getEnvironmentVariable(
                    '#/x-postman/' + group
                )
                return new DynamicValue(
                    'com.luckymarmot.EnvironmentVariableDynamicValue',
                    {
                        environmentVariable: envVariable.id
                    }
                )
            })
            let strings = ref.split(/{{[^{}]*}}/)
                .map(seq => {
                    return this._unescapeURIFragment(seq)
                })
            let min = Math.min(strings.length, dvs.length)
            let components = Array.apply(null, Array(min))
                .reduce((result, value, index) => {
                    result.push(strings[index], dvs[index])
                    return result
                }, [])
                .concat((strings.length > min ? strings : dvs).slice(min))

            return new DynamicString(...components)
        }
        else {
            let value = reference.get('value')
            return value || ''
        }
    }

    _unescapeURIFragment(uriFragment) {
        return uriFragment.replace(/~1/g, '/').replace(/~0/g, '~')
    }

    _setExoticReference(reference) {
        if (reference.get('uri').match('://')) {
            return new DynamicValue(
                'com.luckymarmot.PawExtensions.RemoteFileDynamicValue',
                {
                    url: reference.get('uri')
                }
            )
        }
        else {
            return new DynamicValue(
                'com.luckymarmot.FileContentDynamicValue', {
                    filePath: reference.get('uri')
                }
            )
        }
    }

    _setSimpleReference(reference) {
        return reference.get('value')
    }

    _getEnvironmentDomain() {
        let env = this.context.getEnvironmentDomainByName(
            this.ENVIRONMENT_DOMAIN_NAME
        )
        if (typeof env === 'undefined') {
            env = this.context
                .createEnvironmentDomain(this.ENVIRONMENT_DOMAIN_NAME)
        }
        return env
    }

    _getEnvironment(domain, environmentName = 'Default Environment') {
        let env = domain.getEnvironmentByName(environmentName)
        if (typeof env === 'undefined') {
            env = domain.createEnvironment(environmentName)
        }
        return env
    }

    _getEnvironmentVariable(name) {
        let domain = this._getEnvironmentDomain()
        let variable = domain.getVariableByName(name)
        if (typeof variable === 'undefined') {
            let env = this._getEnvironment(domain)
            let varD = {}
            varD[name] = ''
            env.setVariablesValues(varD)
            variable = domain.getVariableByName(name)
        }
        return variable
    }

    _importPawRequest(options, parent, request, schema) {
        let container = request.get('parameters')
        let bodies = request.get('bodies')
        const auths = request.get('auths')
        const timeout = request.get('timeout')

        let contentType
        if (bodies.size > 0) {
            let body
            body = bodies.get(0)
            contentType = this._extractContentTypeFromBody(body)
            container = container.filter(body.get('constraints'))
        }

        // url + method
        let pawRequest = this._createPawRequest(request, container)

        pawRequest.description = request.get('description')

        // headers
        pawRequest = this._setHeaders(pawRequest, container)

        // auth
        pawRequest = ::this._setAuth(pawRequest, auths)

        // body
        pawRequest = this._setBody(
            pawRequest,
            contentType,
            container,
            schema
        )

        // timeout
        if (timeout) {
            pawRequest.timeout = timeout * 1000
        }

        parent.appendChild(pawRequest)

        // order
        if (options && options.order) {
            pawRequest.order = options.order
        }

        return pawRequest
    }

    _applyFuncOverGroupTree(group, leafFunc, nodeFunc, pawGroup) {
        let calls = []
        let currentPawGroup = nodeFunc(group.get('name') || '', pawGroup)
        group.get('children').forEach((child) => {
            if (child instanceof Request) {
                calls.push(leafFunc(child, currentPawGroup))
            }
            else {
                calls = calls.concat(
                    this._applyFuncOverGroupTree(
                        child,
                        leafFunc,
                        nodeFunc,
                        currentPawGroup
                    )
                )
            }
        })
        return calls
    }

    _createPawRequest(request, container) {
        let url = ::this._generateUrl(
            request.get('url'),
            container.get('queries'),
            request.get('auths')
        )
        return this.context.createRequest(
            request.get('name'),
            (request.get('method') || 'get').toUpperCase(),
            url,
        )
    }

    _generateUrl(url, queries, auths) {
        let protocol = this._toDynamicString(url.get('protocol'), true)
        let host = this._toDynamicString(url.get('host'), true)
        let path = this._toDynamicString(url.get('pathname'), true)
        let hash = this._toDynamicString(url.get('hash'), true)

        if (protocol.length > 0) {
            protocol.appendString(':')
        }

        if (protocol.length > 0 || host.length > 0) {
            protocol.appendString('//')
        }

        let _url = new DynamicString(
            ...protocol.components,
            ...host.components,
            ...path.components
        )

        let queryParams = (queries || []).concat(
            this._extractQueryParamsFromAuth(auths)
        )
        if (queryParams.size > 0) {
            _url.appendString('?')
            let _params = queryParams.reduce(
                (params, keyValue) => {
                    let dynKey = this._toDynamicString(
                        keyValue.get('key'), true
                    ).components.map((component) => {
                        if (typeof component === 'string') {
                            return encodeURI(component)
                        }
                        return component
                    })
                    let dynValue = this._toDynamicString(
                        keyValue, true
                    ).components.map((component) => {
                        if (typeof component === 'string') {
                            return encodeURI(component)
                        }
                        return component
                    })
                    let param = []
                    if (params.length !== 0) {
                        param.push('&')
                    }
                    param = param.concat(dynKey)
                    param.push('=')
                    param = param.concat(dynValue)
                    return params.concat(param)
                },
                []
            )
            _url = new DynamicString(
                ..._url.components,
                ..._params,
                ...hash.components
            )
        }
        else {
            _url = new DynamicString(
                ..._url.components,
                ...hash.components
            )
        }

        return _url
    }

    _extractQueryParamsFromAuth(auths) {
        return (auths || []).filter((auth) => {
            return auth instanceof ApiKeyAuth && auth.get('in') === 'query'
        }).map((auth) => {
            return new Parameter({
                key: auth.get('name'),
                value: auth.get('key')
            })
        }).toArray()
    }

    _setHeaders(pawReq, container) {
        let headers = container.getHeadersSet()
        headers.forEach((param) => {
            pawReq.setHeader(
                this._toDynamicString(param.get('key'), true),
                this._toDynamicString(param, true)
            )
        })
        return pawReq
    }

    _setBasicAuth(auth) {
        return new DynamicValue(
            'com.luckymarmot.BasicAuthDynamicValue',
            {
                username: this._toDynamicString(
                    auth.get('username') || '', true
                ),
                password: this._toDynamicString(
                    auth.get('password') || '', true
                )
            }
        )
    }

    _setDigestAuth(auth) {
        return new DynamicValue(
            'com.luckymarmot.PawExtensions.DigestAuthDynamicValue',
            {
                username: this._toDynamicString(
                    auth.get('username'), true
                ),
                password: this._toDynamicString(
                    auth.get('password'), true
                )
            }
        )
    }

    _setOAuth1Auth(auth) {
        return new DynamicValue(
            'com.luckymarmot.OAuth1HeaderDynamicValue',
            {
                callback: this._toDynamicString(
                    auth.get('callback') || '', true
                ),
                consumerKey: this._toDynamicString(
                    auth.get('consumerKey') || '', true
                ),
                consumerSecret: this._toDynamicString(
                    auth.get('consumerSecret') || '', true
                ),
                tokenSecret: this._toDynamicString(
                    auth.get('tokenSecret') || '', true
                ),
                algorithm: auth.get('algorithm') || '',
                nonce: this._toDynamicString(
                    auth.get('nonce') || '', true
                ),
                additionalParamaters: auth
                    .get('additionalParamaters') || '',
                timestamp: this._toDynamicString(
                    auth.get('timestamp') || '', true
                ),
                token: this._toDynamicString(
                    auth.get('token') || '', true
                )
            }
        )
    }

    _setOAuth2Auth(auth) {
        const grantMap = {
            accessCode: 0,
            implicit: 1,
            application: 2,
            password: 3
        }
        return new DynamicValue(
            'com.luckymarmot.OAuth2DynamicValue',
            {
                grantType: grantMap[auth.get('flow')] || 0,
                authorizationUrl: this._toDynamicString(
                    auth.get('authorizationUrl') || '', true
                ),
                accessTokenUrl: this._toDynamicString(
                    auth.get('tokenUrl') || '', true
                ),
                scope: (auth.get('scopes') || []).join(' ')
            }
        )
    }

    _setAWSSig4Auth(auth) {
        return new DynamicValue(
            'com.shigeoka.PawExtensions.AWSSignature4DynamicValue',
            {
                key: this._toDynamicString(
                    auth.get('key') || '', true
                ),
                secret: this._toDynamicString(
                    auth.get('secret') || '', true
                ),
                region: this._toDynamicString(
                    auth.get('region') || '', true
                ),
                service: this._toDynamicString(
                    auth.get('service') || '', true
                )
            }
        )
    }

    _setHawkAuth(auth) {
        return new DynamicValue(
            'uk.co.jalada.PawExtensions.HawkDynamicValue',
            {
                key: this._toDynamicString(
                    auth.get('key') || '', true
                ),
                id: this._toDynamicString(
                    auth.get('id') || '', true
                ),
                algorithm: this._toDynamicString(
                    auth.get('algorithm') || '', true
                )
            }
        )
    }

    _setAuth(pawReq, auths) {
        const authTypeMap = {
            BasicAuth: ::this._setBasicAuth,
            DigestAuth: ::this._setDigestAuth,
            OAuth1Auth: ::this._setOAuth1Auth,
            OAuth2Auth: ::this._setOAuth2Auth,
            AWSSig4Auth: ::this._setAWSSig4Auth,
            HawkAuth: ::this._setHawkAuth
        }

        for (let auth of auths) {
            let rule = authTypeMap[auth.constructor.name]

            if (rule) {
                const dv = rule(auth)
                pawReq.setHeader('Authorization', new DynamicString(dv))
            }
            else if (auth instanceof ApiKeyAuth) {
                if (auth.get('in') === 'header') {
                    pawReq.setHeader(
                        this._toDynamicString(auth.get('name'), true),
                        this._toDynamicString(auth.get('key'), true)
                    )
                }
            }
            else {
                /* eslint-disable no-console */
                console.error(
                    'Auth type ' +
                    auth.constructor.name +
                    ' is not supported in Paw'
                )
                /* eslint-enable no-console */
            }
        }
        return pawReq
    }

    _setBody(pawReq, contentType, container) {
        let body = container.get('body')

        const bodyRules = {
            'multipart/form-data':
                ::this._setFormDataBody,
            'application/x-www-form-urlencoded':
                ::this._setUrlEncodedBody,
            'application/json':
                ::this._setJSONBody
        }

        let _pawReq = pawReq

        const rule = bodyRules[contentType]
        if (rule) {
            _pawReq = rule(pawReq, body)
        }
        else if (body.size > 1) {
            _pawReq = this._setUrlEncodedBody(pawReq, body)
        }
        else {
            this._setPlainBody(pawReq, body)
        }

        return _pawReq
    }

    _extractContentTypeFromBody(body) {
        let constraints = body.get('constraints')
        let contentType = null
        constraints.forEach(param => {
            if (param.get('key') === 'Content-Type') {
                contentType = param.get('value')
            }
        })

        return contentType
    }

    _setFormDataBody(pawReq, body) {
        pawReq.setHeader(
            'Content-Type',
            'multipart/form-data'
        )
        const keyValues = body.map(param => {
            let key = this._toDynamicString(
                param.get('key'), true
            )
            let value = this._toDynamicString(
                param.get, true
            )
            return [ key, value, true ]
        }).toArray()
        const dv = new DynamicValue(
            'com.luckymarmot.BodyMultipartFormDataDynamicValue', {
                keyValues: keyValues
            }
        )
        pawReq.body = new DynamicString(dv)
        return pawReq
    }

    _setUrlEncodedBody(pawReq, body) {
        pawReq.setHeader(
            'Content-Type',
            'application/x-www-form-urlencoded'
        )
        const keyValues = body.map(param => {
            let key = this._toDynamicString(
                param.get('key'), true
            )
            let value = this._toDynamicString(
                param, true
            )
            return [ key, value, true ]
        }).toArray()
        const dv = new DynamicValue(
            'com.luckymarmot.BodyFormKeyValueDynamicValue', {
                keyValues: keyValues
            }
        )
        pawReq.body = new DynamicString(dv)
        return pawReq
    }

    _setPlainBody(pawReq, body) {
        if (body.size > 0) {
            let param = body.get(0)
            pawReq.body = this._toDynamicString(param, true)
        }
        else {
            pawReq.body = ''
        }
        return pawReq
    }

    _setJSONBody(pawReq, body) {
        pawReq.setHeader(
            'Content-Type',
            'application/json'
        )

        if (body.size === 0) {
            return pawReq
        }

        let param = body.get(0)
        let content = this._toDynamicString(param, true)

        let component = content.getComponentAtIndex(0)

        if (
            content.length === 1 &&
            typeof component === 'string'
        ) {
            try {
                pawReq.jsonBody = JSON.parse(component)
            }
            catch (e) {
                /* eslint-disable no-console */
                console.error(
                    'body was set to JSON, but we couldn\'t parse it'
                )
                /* eslint-enable no-console */
                pawReq.body = content
            }
        }
        else {
            pawReq.body = content
        }

        return pawReq
    }

    _toDynamicString(string, defaultToEmpty) {
        if (!string) {
            if (defaultToEmpty) {
                return new DynamicString('')
            }
            return null
        }

        let envComponents = []
        if (string instanceof Parameter) {
            if (string.get('type') === 'reference') {
                envComponents = this._castReferenceToDynamicString(
                    string.get('value')
                ).components
            }
            else {
                envComponents = this._castParameterToDynamicString(
                    string
                ).components
            }
        }
        else if (typeof string === 'string') {
            envComponents.push(string)
        }

        let components = []

        let splitManager = (_isRegular) => {
            let isRegular = _isRegular
            return (split) => {
                if (isRegular) {
                    components.push(split)
                }
                else {
                    components.push(
                        this._escapeSequenceDynamicValue(split)
                    )
                }
                isRegular = !isRegular
            }
        }

        for (let component of envComponents) {
            if (typeof component !== 'string') {
                components.push(component)
            }
            else {
                // split around special characters
                const re = /([^\x00-\x1f]+)|([\x00-\x1f]+)/gm
                let splits = component.match(re)
                if (splits.length > 0 && splits.length < 50) {
                    let isRegular = /([^\x00-\x1f]+)/.test(splits[0])
                    let splitMapper = splitManager(isRegular)
                    splits.forEach(splitMapper)
                }
                else {
                    components.push(component)
                }
            }
        }

        return new DynamicString(...components)
    }

    _convertCharToHex(char) {
        let hexChar = char.charCodeAt(0).toString(16)
        if (hexChar.length === 1) {
            hexChar = '0' + hexChar
        }
        return hexChar
    }

    _escapeCharSequence(seq) {
        const escapedChars = {
            '\n': '\\n',
            '\r': '\\r',
            '\t': '\\t'
        }

        let sequence = []
        for (let char of seq) {
            sequence.push(
                escapedChars[char] ?
                    escapedChars[char] :
                    '\\x' + this._convertCharToHex(char)
            )
        }
        return sequence.join('')
    }

    _escapeSequenceDynamicValue(seq) {
        let escapeSequence = this._escapeCharSequence(seq)
        return new DynamicValue('com.luckymarmot.EscapeSequenceDynamicValue', {
            escapeSequence: escapeSequence
        })
    }

    _castReferenceToDynamicString(reference) {
        let dv = this._extractReferenceComponent(reference)
        if (dv instanceof DynamicString) {
            return dv
        }
        return new DynamicString(dv)
    }

    _castParameterToDynamicString(param) {
        let schema = param.getJSONSchema(false)

        let components = []
        if (schema['x-sequence']) {
            for (let item of schema['x-sequence']) {
                if (item['x-title']) {
                    if (schema.enum && schema.enum.length === 1) {
                        components.push(param.generate())
                    }
                    else {
                        let dv = new DynamicValue(
                            'com.luckymarmot.PawExtensions' +
                            '.JSONSchemaFakerDynamicValue',
                            {
                                schema: JSON.stringify(item)
                            }
                        )
                        components.push(dv)
                    }
                }
                else {
                    components.push(param.generate(false, item))
                }
            }
        }
        else if (schema.enum && schema.enum.length === 1) {
            let generated = param.generate(false, schema)
            if (generated === null) {
                generated = ''
            }
            components.push(generated)
        }
        else {
            let dv = new DynamicValue(
                'com.luckymarmot.PawExtensions' +
                '.JSONSchemaFakerDynamicValue',
                {
                    schema: JSON.stringify(schema)
                }
            )
            components.push(dv)
        }

        return new DynamicString(...components)
    }

    _extractReferenceComponent(component) {
        if (typeof component === 'string') {
            return component
        }

        if (component instanceof Reference) {
            if (!component.get('relative')) {
                return this._setReference(component)
            }

            let envVariable = this._getEnvironmentVariable(
                component.get('relative')
            )
            return new DynamicValue(
                'com.luckymarmot.EnvironmentVariableDynamicValue',
                {
                    environmentVariable: envVariable.id
                }
            )
        }

        return null
    }
}
