import Context, {
    Request,
    Parameter
} from '../../../models/Core'

import {
    FileReference,
    EnvironmentReference,
    SchemaReference,
    Schema
} from '../../../models/Utils'

import {
    ApiKeyAuth
} from '../../../models/Auth'

import {
    DynamicValue,
    DynamicString
} from '../../../Mocks/PawShims'

export default class BaseImporter {
    static fileExtensions = [];
    static inputs = [];

    constructor() {
        this.ENVIRONMENT_DOMAIN_NAME = 'Imported Environments'
        this.context = null
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
        let requestContexts = this.createRequestContexts(
            context,
            items,
            options
        )

        this.context = context

        for (let env of requestContexts) {
            let requestContext = env.context

            if (!(requestContext instanceof Context)) {
                throw new Error(
                    'createRequestContext ' +
                    'did not return an instance of Context'
                )
            }
            this._importPawRequests(
                requestContext,
                env.items[0],
                options
            )
            if (options && options.order) {
                options.order += 1
            }
        }

        return true
    }

    __import__(context, items, options) {
        this.context = context

        let parsePromiseOrResult = this.createRequestContexts(
            context,
            items,
            options
        )

        if (typeof parsePromiseOrResult !== 'function') {
            return parsePromiseOrResult
        }

        let importPromise = parsePromiseOrResult.then((requestContexts) => {
            for (let env of requestContexts) {
                let requestContext = env.context

                if (!(requestContext instanceof Context)) {
                    throw new Error(
                        'createRequestContext ' +
                        'did not return an instance of RequestContext'
                    )
                }
                this._importPawRequests(
                    requestContext,
                    env.items[0],
                    options
                )
                if (options && options.order) {
                    options.order += 1
                }
            }
        })

        return importPromise
    }

    _importPawRequests(requestContext, item, options) {
        const group = requestContext.get('group')
        const schema = requestContext.get('schema')
        const environments = requestContext.get('environments')

        if (environments && environments.size > 0) {
            this._importEnvironments(environments)
        }

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

    _importEnvironments(environments) {
        let environmentDomain = this._getEnvironmentDomain()

        for (let env of environments) {
            let pawEnv = environmentDomain.createEnvironment(env.name)
            let variablesDict = {}
            env.get('variables').forEach(
                value => {
                    variablesDict[value.get('key')] = value.get('value')
                }
            )
            pawEnv.setVariablesValues(variablesDict)
        }
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

        let bodyType
        if (bodies.size > 0) {
            let body
            body = bodies.get(0)
            bodyType = body.get('type')
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
            bodyType,
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
            request.get('method'),
            url,
        )
    }

    _generateUrl(url, queries, auths) {
        let _url = this._toDynamicString(url.getUrl(), true, true)

        let queryParams = (queries || []).concat(
            this._extractQueryParamsFromAuth(auths)
        )
        if (queryParams.size > 0) {
            _url.appendString('?')
            let _params = queryParams.reduce(
                (params, keyValue) => {
                    let dynKey = this._toDynamicString(
                        keyValue.get('key'), true, true
                    ).components.map((component) => {
                        if (typeof component === 'string') {
                            return encodeURI(component)
                        }
                        return component
                    })
                    let dynValue = this._toDynamicString(
                        keyValue.get('value'), true, true
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
            _url = new DynamicString(..._url.components, ..._params)
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
                this._toDynamicString(param.get('key'), true, true),
                this._toDynamicString(param.get('value'), true, true)
            )
        })
        return pawReq
    }

    _setBasicAuth(auth) {
        return new DynamicValue(
            'com.luckymarmot.BasicAuthDynamicValue',
            {
                username: this._toDynamicString(
                    auth.get('username') || '', true, true
                ),
                password: this._toDynamicString(
                    auth.get('password') || '', true, true
                )
            }
        )
    }

    _setDigestAuth(auth) {
        return new DynamicValue(
            'com.luckymarmot.PawExtensions.DigestAuthDynamicValue',
            {
                username: this._toDynamicString(
                    auth.get('username'), true, true
                ),
                password: this._toDynamicString(
                    auth.get('password'), true, true
                )
            }
        )
    }

    _setOAuth1Auth(auth) {
        return new DynamicValue(
            'com.luckymarmot.OAuth1HeaderDynamicValue',
            {
                callback: this._toDynamicString(
                    auth.get('callback') || '', true, true
                ),
                consumerKey: this._toDynamicString(
                    auth.get('consumerKey') || '', true, true
                ),
                consumerSecret: this._toDynamicString(
                    auth.get('consumerSecret') || '', true, true
                ),
                tokenSecret: this._toDynamicString(
                    auth.get('tokenSecret') || '', true, true
                ),
                algorithm: auth.get('algorithm') || '',
                nonce: this._toDynamicString(
                    auth.get('nonce') || '', true, true
                ),
                additionalParamaters: auth
                    .get('additionalParamaters') || '',
                timestamp: this._toDynamicString(
                    auth.get('timestamp') || '', true, true
                ),
                token: this._toDynamicString(
                    auth.get('token') || '', true, true
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
                    auth.get('authorizationUrl') || '', true, true
                ),
                accessTokenUrl: this._toDynamicString(
                    auth.get('tokenUrl') || '', true, true
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
                    auth.get('key') || '', true, true
                ),
                secret: this._toDynamicString(
                    auth.get('secret') || '', true, true
                ),
                region: this._toDynamicString(
                    auth.get('region') || '', true, true
                ),
                service: this._toDynamicString(
                    auth.get('service') || '', true, true
                )
            }
        )
    }

    _setHawkAuth(auth) {
        return new DynamicValue(
            'uk.co.jalada.PawExtensions.HawkDynamicValue',
            {
                key: this._toDynamicString(
                    auth.get('key') || '', true, true
                ),
                id: this._toDynamicString(
                    auth.get('id') || '', true, true
                ),
                algorithm: this._toDynamicString(
                    auth.get('algorithm') || '', true, true
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
                        this._toDynamicString(auth.get('name'), true, true),
                        this._toDynamicString(auth.get('key'), true, true)
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

    _setBody(pawReq, bodyType, container, schema) {
        let body = container.get('body')
        const bodyRules = {
            formData: ::this._setFormDataBody,
            urlEncoded: ::this._setUrlEncodedBody,
            json: ::this._setJSONBody,
            plain: ::this._setPlainBody,
            file: ::this._setPlainBody,
            schema: (_pawReq, _body) => {
                return ::this._setSchemaBody(_pawReq, _body, schema)
            },
            null: (_pawReq) => { return _pawReq }
        }

        let _pawReq = pawReq

        const rule = bodyRules[bodyType]
        if (rule) {
            _pawReq = rule(pawReq, body)
        }
        else {
            /* eslint-disable no-console */
            console.error(
                'Body type ' +
                    bodyType +
                ' is not supported in Paw'
            )
            /* eslint-enable no-console */
        }

        return _pawReq
    }

    _setFormDataBody(pawReq, body) {
        if (!pawReq.getHeaderByName('Content-Type')) {
            pawReq.setHeader(
                'Content-Type',
                'multipart/form-data'
            )
        }
        const keyValues = body.map(param => {
            let key = this._toDynamicString(
                param.get('key'), true, true
            )
            let value = this._toDynamicString(
                param.get('value'), true, true
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

    _setPlainBody(pawReq, body) {
        if (body.size > 0) {
            let content = body.getIn([ 0, 'value' ]) || ''
            pawReq.body = content
        }
        else {
            pawReq.body = ''
        }
        return pawReq
    }

    _setJSONBody(pawReq, body) {
        if (!pawReq.getHeaderByName('Content-Type')) {
            pawReq.setHeader(
                'Content-Type',
                'application/json'
            )
        }

        if (body.size === 0) {
            return pawReq
        }

        let content = body.getIn([ 0, 'value' ]) || {}

        if (typeof content === 'string') {
            try {
                pawReq.jsonBody = JSON.parse(content)
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
            pawReq.jsonBody = content
        }

        return pawReq
    }

    _setSchemaBody(pawReq, body, schema) {
        if (body.size === 0) {
            return pawReq
        }

        let description = ''
        body.forEach(param => {
            if (
                param.get('value') instanceof Schema ||
                param.get('value') instanceof SchemaReference
            ) {
                description += '### Schema ###\n\n' + JSON.stringify(
                    param.get('value').resolve(1, schema).toJS(), null, '  '
                )
            }
        })
        let _pawReq = pawReq
        if (description) {
            _pawReq.description = (
                _pawReq.description ? _pawReq.description + '\n\n' : ''
            ) + description
        }
        return _pawReq
    }

    _setUrlEncodedBody(pawReq, body) {
        if (!pawReq.getHeaderByName('Content-Type')) {
            pawReq.setHeader(
                'Content-Type',
                'application/x-www-form-urlencoded'
            )
        }
        const keyValues = body.map(param => {
            let key = this._toDynamicString(
                param.get('key'), true, true
            )
            let value = this._toDynamicString(
                param.get('value'), true, true
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

    _toDynamicString(string, defaultToEmpty, resolveFileRefs) {
        if (!string) {
            if (defaultToEmpty) {
                return new DynamicString('')
            }
            return null
        }

        // resolve file references
        if (resolveFileRefs) {
            const resolvedString = this._resolveFileReference(string)
            if (
                typeof resolvedString !== 'string' &&
                resolvedString instanceof DynamicString
            ) {
                return resolvedString
            }
        }

        let envComponents = []
        if (
            typeof string !== 'string' &&
            string instanceof EnvironmentReference
        ) {
            envComponents = this._castReferenceToDynamicString(
                string
            ).components
        }
        else {
            envComponents.push(string)
        }

        let components = []
        for (let component of envComponents) {
            if (typeof component !== 'string') {
                components.push(component)
            }
            else {
                // split around special characters
                const re = /([^\x00-\x1f]+)|([\x00-\x1f]+)/gm
                let m
                while ((m = re.exec(component)) !== null) {
                    if (m[1]) {
                        components.push(m[1])
                    }
                    else {
                        components.push(this._escapeSequenceDynamicValue(m[2]))
                    }
                }
            }
        }


        return new DynamicString(...components)
    }

    _resolveFileReference(value) {
        if (value instanceof FileReference) {
            const dv = new DynamicValue(
                'com.luckymarmot.FileContentDynamicValue', {}
            )
            const ds = new DynamicString(dv)
            return ds
        }
        return value
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
        let escapeSequence = ''
        for (let char of seq) {
            escapeSequence += escapedChars[char] ?
                escapedChars[char] :
                '\\x' + this._convertCharToHex(char)
        }
        return escapeSequence
    }

    _escapeSequenceDynamicValue(seq) {
        let escapeSequence = this._escapeCharSequence(seq)
        return new DynamicValue('com.luckymarmot.EscapeSequenceDynamicValue', {
            escapeSequence: escapeSequence
        })
    }

    _castReferenceToDynamicString(reference) {
        let components = reference.get('referenceName')
        let dynStr = []

        components.forEach((component) => {
            let value = this._extractReferenceComponent(component)
            if (value) {
                dynStr.push(value)
            }
        })
        return new DynamicString(...dynStr)
    }


    /*
        This does not extract all reference components,
        but only the simple ones. e.g. a {{var1}} will
        be extracted as var1, but {{{{var2}}}} won't.
        {{var{{number}}}} also won't be extracted.

        This is because Paw does not support variable
        environment references: {{var{{number}}}} could
        resolve to {{var1}}, {{var2}}, etc. depending on
        the value {{number}} resolves to, and we can't
        know if they exist, as {{number}} can be changed
        on the fly by the user.
    */
    _extractReferenceComponent(component) {
        if (typeof component === 'string') {
            return component
        }

        if (component instanceof EnvironmentReference &&
            component.get('referenceName').size === 1 &&
            typeof component.getIn([ 'referenceName', 0 ]) === 'string'
        ) {
            let envVariable = this._getEnvironmentVariable(
                component.getIn([ 'referenceName', 0 ])
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
