import Immutable from 'immutable'
import yaml from 'js-yaml'
import tv4 from 'tv4'
import swaggerSchema from 'swagger-schema-official/schema.json'

import Constraint from '../../models/Constraint'

import Context, {
    Parameter,
    ParameterContainer,
    Body,
    Response,
    Request
} from '../../models/Core'

import {
    Info, Contact, License,
    Group
} from '../../models/Utils'

import Auth from '../../models/Auth'
import URL from '../../models/URL'
import Item from '../../models/Item'

import ReferenceContainer from '../../models/Reference'
import JSONSchemaReference from '../../models/references/JSONSchema'

export default class SwaggerParser {
    constructor() {
        this.context = new Context()
        this.item = new Item()
    }

    // @NotTested -> assumed valid
    parse(item) {
        this.item = new Item(item)
        const string = item.content
        const swaggerCollection = this._loadSwaggerCollection(string)
        const valid = this._validateSwaggerCollection(swaggerCollection)

        if (!valid) {
            const m = 'Invalid Swagger File (invalid schema / version < 2.0):\n'
            throw new Error(m + tv4.error)
        }

        if (swaggerCollection) {
            let refs = new ReferenceContainer()
            refs = refs.create(
                this._extractReferences(this.item, swaggerCollection)
            )

            let rootGroup = new Group()
            rootGroup = rootGroup.set('name', swaggerCollection.info.title)
            let pathLinkedRequests = this._applyFuncOverPathArchitecture(
                swaggerCollection,
                ::this._createRequest
            )

            rootGroup = this._createGroupTree(rootGroup, pathLinkedRequests)

            let info = this._extractContextInfo(swaggerCollection.info)

            let reqContext = new Context()
            reqContext = reqContext
                .set('group', rootGroup)
                .set('references', refs)
                .set('info', info)

            this.context = reqContext

            return reqContext
        }
    }

    _extractContextInfo(_info) {
        if (!_info) {
            return new Info()
        }

        let contact = null
        if (_info.contact) {
            contact = new Contact({
                name: _info.contact.name || null,
                url: _info.contact.url || null,
                email: _info.contact.email || null
            })
        }

        let license = null
        if (_info.license) {
            license = new License({
                name: _info.license.name || null,
                url: _info.license.url || null
            })
        }

        let info = new Info({
            title: _info.title || null,
            description: _info.description || null,
            tos: _info.termsOfService || null,
            contact: contact,
            license: license,
            version: _info.version || null
        })

        return info
    }

    // @NotTested -> assumed valid
    _createRequest(swaggerCollection, path, method, content) {
        const url = this._extractUrlInfo(
            swaggerCollection,
            path,
            content
        )

        const container = this._extractParams(
            swaggerCollection,
            content
        )

        const responses = this._extractResponses(
            swaggerCollection, content
        )

        const bodies = this._extractBodies(swaggerCollection, content)

        let request = new Request()
        request = this._setTagsAndId(request, content)
        request = this._setSummary(request, path, content)
        request = this._setDescription(request, content)
        request = this._setBasicInfo(
            request,
            url,
            method,
            container,
            bodies,
            responses
        )
        request = this._setAuth(request, swaggerCollection, content)

        return request
    }

    _setTagsAndId(_request, content) {
        let request = _request
        if (content.tags) {
            let tags = new Immutable.List(content.tags)
            request = request.set('tags', tags)
        }

        if (content.operationId) {
            request = request.set('id', content.operationId)
        }

        return request
    }

    // @tested
    _setSummary(request, path, content) {
        if (content.summary) {
            return request.set('name', content.summary)
        }
        return request.set('name', path)
    }

    // @tested
    _setDescription(request, content) {
        if (content.description) {
            return request.set('description', content.description)
        }
        return request
    }

    // @tested
    _setBasicInfo(request, url, method, container, bodies, responses) {
        let _container = container || new ParameterContainer()
        let _bodies = bodies || new Immutable.List()
        let _responses = responses || new Immutable.List()

        return request
            .set('url', url)
            .set('method', method.toUpperCase())
            .set('parameters', _container)
            .set('bodies', _bodies)
            .set('responses', _responses)
    }

    // @Tested
    _setAuth(request, swaggerCollection, content) {
        let _request = request

        const typeMap = {
            basic: this._setBasicAuth,
            apiKey: this._setApiKeyAuth,
            oauth2: this._setOAuth2Auth
        }

        if (!content.security) {
            return _request
        }

        if (!swaggerCollection.securityDefinitions) {
            const m = 'Swagger - expected a security definition to exist'
            throw new Error(m)
        }

        let auths = []
        for (let security of content.security) {
            for (let key in security) {
                if (
                    security.hasOwnProperty(key) &&
                    swaggerCollection.securityDefinitions[key]
                ) {
                    let definition = Immutable.fromJS(swaggerCollection
                        .securityDefinitions[key])
                    definition = definition.set(
                        'scopes', new Immutable.List(security[key])
                    )

                    if (typeMap[definition.get('type')]) {
                        let auth = typeMap[definition.get('type')](definition)
                        auths.push(auth)
                    }
                }
            }
        }

        auths = new Immutable.List(auths)
        return _request.set('auths', auths)
    }

    _setBasicAuth(definition) {
        let username = null
        let password = null

        if (definition) {
            username = definition['x-username'] || null
            password = definition['x-password'] || null
        }

        return new Auth.Basic({
            username: username,
            password: password
        })
    }

    _setApiKeyAuth(definition) {
        return new Auth.ApiKey({
            in: definition.get('in'),
            name: definition.get('name')
        })
    }

    _setOAuth2Auth(definition) {
        return new Auth.OAuth2({
            flow: definition.get('flow', null),
            authorizationUrl: definition.get('authorizationUrl', null),
            tokenUrl: definition.get('tokenUrl', null),
            scopes: definition.get('scopes')
        })
    }

    // @tested
    _loadSwaggerCollection(string) {
        let swaggerCollection
        try {
            swaggerCollection = JSON.parse(string)
        }
        catch (jsonParseError) {
            try {
                swaggerCollection = yaml.safeLoad(string)
            }
            catch (yamlParseError) {
                let m = 'Invalid Swagger File format (invalid JSON or YAML)'
                m += '\nJSON Error: ' + jsonParseError
                m += '\nYAML Error: ' + yamlParseError
                throw new Error(m)
            }
        }

        return swaggerCollection
    }

    // @tested
    _validateSwaggerCollection(swag) {
        return tv4.validate(swag, swaggerSchema)
    }

    _updateParametersInMethod(content, baseParams) {
        // shallow copy
        let params = (baseParams || []).map(d => { return d })
        let contentParams = content.parameters || []
        for (let param of contentParams) {
            let name = param.name
            let index = 0
            let used = false
            for (let _param of baseParams || []) {
                let _name = _param.name
                if (name === _name) {
                    params[index] = param
                    used = true
                }
                index += 1
            }
            if (!used) {
                params.push(param)
            }
        }
        return params
    }

    // @tested
    _applyFuncOverPathArchitecture(collection, func) {
        let architecture = {}
        for (let path in collection.paths) {
            if (collection.paths.hasOwnProperty(path)) {
                architecture[path] = architecture[path] || {}
                let methods = collection.paths[path]
                let _methods = Object.keys(methods)
                if (methods.parameters) {
                    let _params = methods.parameters
                    if (methods.parameters.$ref) {
                        _params = ::this._extractSubTree(
                            collection,
                            methods.parameters.$ref
                        )
                    }

                    let paramKey = _methods.indexOf('parameters')
                    // remove paramKey
                    _methods.splice(paramKey, 1)

                    for (let method of _methods) {
                        let params = this._updateParametersInMethod(
                            methods[method],
                            _params
                        )
                        methods[method].parameters = params
                    }
                }
                for (let method of _methods) {
                    architecture[path][method] = func(
                        collection,
                        path,
                        method,
                        methods[method]
                    )
                }
            }
        }

        return architecture
    }

    _unescapeURIFragment(uriFragment) {
        return uriFragment.replace('~1', '/').replace('~0', '~')
    }

    _extractSubTree(collection, ref) {
        let path = ref.split('/').slice(1).map((d) => {
            return this._unescapeURIFragment(d)
        })

        let subTree = collection
        for (let key of path) {
            subTree = subTree[key]
        }

        return subTree
    }

    _extractReferences(item, collection) {
        let ref = new JSONSchemaReference({
            context: item
        })
        let refs = ref
            .resolve(JSON.stringify(collection))
            .get('dependencies')
        return refs
    }

    _extractUrlInfo(collection, path, content) {
        let rootSchemes = collection.schemes || [ 'http' ]
        let schemes = content.schemes || rootSchemes

        let host = collection.host || 'localhost'

        let basePath = ''
        let subPath = ''

        if (
            collection.basePath &&
            collection.basePath.length > 0
        ) {
            basePath = collection.basePath
            if (!basePath.startsWith('/')) {
                basePath = '/' + basePath
            }

            if (basePath.endsWith('/')) {
                basePath = basePath.substr(0, basePath.length - 1)
            }
        }

        if (!path || path.length === 0 || path[0] !== '/') {
            throw new Error('Invalid Swagger, path must begin with a /')
        }
        else {
            subPath = path
        }

        let url = new URL({
            protocol: schemes,
            host: host,
            pathname: basePath + subPath
        })

        return url
    }

    _extractResponses(collection, content) {
        let _collection = collection || {}
        let _content = content || {}

        let result = []

        let responses = _content.responses

        const externals = this._extractExternals(
            _collection, _content, false
        )

        const bodies = this._extractResponseBodies(
            _collection, _content
        )

        let codes = Object.keys(responses || {})
        for (let code of codes) {
            let body = new Immutable.List()
            if (responses[code].schema) {
                let param = this._extractParam(
                    responses[code],
                    externals
                )

                body = body.push(param)
            }

            let contentTypes = this._extractContentTypes(
                _collection, _content, false
            )

            let headers = new Immutable.List()
            for (let contentType of contentTypes) {
                headers.push(new Parameter({
                    key: 'Content-Type',
                    type: 'string',
                    value: contentType,
                    externals: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ contentType ])
                            ])
                        })
                    ])
                }))
            }

            if (responses[code].headers) {
                let headerNames = Object.keys(responses[code].headers)
                for (let header of headerNames) {
                    let param = this._extractParam(
                        responses[code].headers[header]
                    )
                    headers = headers.push(param)
                }
            }

            let container = new ParameterContainer({
                body: body,
                headers: headers
            })
            let response = new Response({
                code: code,
                description: responses[code].description || null,
                parameters: container,
                bodies: bodies
            })

            result.push(response)
        }

        result = new Immutable.List(result)
        return result
    }

    _extractExternals(collection, content, consume = true) {
        let consumes
        if (consume) {
            consumes = content.consumes || collection.consumes
        }
        else {
            consumes = content.produces || collection.produces
        }

        if (!consumes) {
            return new Immutable.List()
        }

        return new Immutable.List([
            new Parameter({
                key: 'Content-Type',
                type: 'string',
                internals: new Immutable.List([
                    new Constraint.Enum(consumes)
                ])
            })
        ])
    }

    _extractContentTypes(collection, content, consume = true) {
        let consumeKey = consume ? 'consumes' : 'produces'
        let _content = content || {}
        let _collection = collection || {}

        let contentTypes = []

        if (_content[consumeKey] && _content[consumeKey].length > 0) {
            contentTypes = _content[consumeKey]
        }
        else if (
            _collection[consumeKey] &&
            _collection[consumeKey].length > 0
        ) {
            contentTypes = _collection[consumeKey]
        }
        return contentTypes
    }

    _extractParams(collection, content) {
        let _content = content || {}
        let _collection = collection || {}
        let parameters = _content.parameters || []

        let headers = []
        let queries = []
        let body = []
        let path = []

        let contentTypes = this._extractContentTypes(_collection, _content)
        let externals = this._extractExternals(_collection, _content)

        for (let contentType of contentTypes) {
            headers.push(new Parameter({
                key: 'Content-Type',
                type: 'string',
                value: contentType,
                externals: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([ contentType ])
                        ])
                    })
                ])
            }))
        }

        const mapping = {
            query: queries,
            header: headers,
            formData: body,
            body: body,
            path: path
        }

        if (
            parameters &&
            typeof parameters[Symbol.iterator] === 'function'
        ) {
            for (let param of parameters) {
                let fieldList = mapping[param.in]
                if (fieldList) {
                    let _param = this._extractParam(param, externals)
                    fieldList.push(_param)
                }
            }
        }

        let container = new ParameterContainer({
            headers: new Immutable.List(headers),
            queries: new Immutable.List(queries),
            body: new Immutable.List(body)
        })
        return container
    }

    _extractParam(param, externals) {
        let value = param.default
        let format = param.format || param['x-format'] || null
        let required = param.required || false
        let _externals = externals

        if (typeof value === 'undefined') {
            value = null
        }

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

        if (param.schema) {
            Object.assign(param, param.schema)
            param.name = param.name || 'schema'
        }

        let type = param.type || null

        let internals = new Immutable.List()
        for (let key of Object.keys(param)) {
            if (internalsMap[key]) {
                let constraint = new internalsMap[key](param[key])
                internals = internals.push(constraint)
            }

            if (key === 'exclusiveMaximum') {
                internals = internals.push(
                    new Constraint.ExclusiveMaximum(param.maximum)
                )
            }

            if (key === 'exclusiveMinimum') {
                internals = internals.push(
                    new Constraint.ExclusiveMinimum(param.minimum)
                )
            }
        }

        if (param.$ref) {
            let currentURI = this.item.getPath()
            let uri = (new URL(param.$ref, currentURI)).href()
            value = new JSONSchemaReference({
                uri: uri
            })
            type = 'reference'
        }

        if (param.type === 'array') {
            value = this._extractParam(param.items, externals)
            format = param.collectionFormat || null
        }

        if (param['x-use-with']) {
            _externals = new Immutable.List()
            for (let external of param['x-use-with']) {
                _externals = _externals.push(this._extractParam(external))
            }
        }

        let _param = new Parameter({
            key: param.name || null,
            value: value,
            type: type,
            format: format,
            required: required,
            description: param.description || null,
            internals: internals,
            externals: _externals,
            example: param['x-example'] || null
        })

        return _param
    }

    _extractBodies(collection, content) {
        let bodies = new Immutable.List()
        let contentTypes = this._extractContentTypes(collection, content)

        const typeMapping = {
            'application/x-www-form-urlencoded': 'urlEncoded',
            'multipart/form-data': 'formData'
        }
        for (let contentType of contentTypes) {
            let bodyType = null

            if (typeMapping[contentType]) {
                bodyType = typeMapping[contentType]
            }

            let body = new Body({
                type: bodyType,
                constraints: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        type: 'string',
                        value: contentType
                    })
                ])
            })

            bodies = bodies.push(body)
        }

        return bodies
    }

    _extractResponseBodies(collection, content) {
        let produces = content.produces || collection.produces

        if (!produces) {
            return new Immutable.List()
        }

        let bodies = produces.map(mime => {
            return new Body({
                constraints: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        type: 'string',
                        value: mime
                    })
                ])
            })
        })

        return new Immutable.List(bodies)
    }

    // @tested
    _createGroupTree(group, paths) {
        let _group = group
        for (let path in paths) {
            if (paths.hasOwnProperty(path)) {
                let nodes = path.split('/')

                if (path.startsWith('/') === true) {
                    nodes.splice(0, 1)
                }

                let keyPath = []
                for (let node of nodes) {
                    keyPath.push('children')
                    keyPath.push('/' + node)

                    let sub = _group.getIn(keyPath)
                    if (!sub) {
                        _group = _group.setIn(keyPath, new Group({
                            name: '/' + node
                        }))
                    }
                }

                keyPath.push('children')
                for (let method in paths[path]) {
                    if (paths[path].hasOwnProperty(method)) {
                        _group = _group.setIn(
                            keyPath.concat(method),
                            paths[path][method]
                        )
                    }
                }
            }
        }

        return _group
    }
}

