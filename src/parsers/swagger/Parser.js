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
    URL, Group, Schema
} from '../../models/Utils'

import Auth from '../../models/Auth'

export default class SwaggerParser {
    contructor() {
        this.context = new Context()
    }

    // @NotTested -> assumed valid
    parse(string) {
        const swaggerCollection = this._loadSwaggerCollection(string)
        const valid = this._validateSwaggerCollection(swaggerCollection)

        if (!valid) {
            const m = 'Invalid Swagger File (invalid schema / version < 2.0):\n'
            throw new Error(m + tv4.error)
        }

        if (swaggerCollection) {
            let baseSchema = new Schema()
            baseSchema = baseSchema.mergeSchema(swaggerCollection)

            let rootGroup = new Group()
            rootGroup = rootGroup.set('name', swaggerCollection.info.title)
            let pathLinkedRequests = this._applyFuncOverPathArchitecture(
                swaggerCollection,
                baseSchema,
                ::this._createRequest
            )

            rootGroup = this._createGroupTree(rootGroup, pathLinkedRequests)

            let info = this._extractContextInfo(swaggerCollection)

            let reqContext = new Context()
            reqContext = reqContext
                .set('group', rootGroup)
                .set('schema', baseSchema)
                .set('info', info)

            this.context = reqContext

            return reqContext
        }
    }

    _extractContextInfo(collection) {
        let contact = null
        if (collection.contact) {
            contact = new Contact({
                name: collection.contact.name || null,
                url: collection.contact.url || null,
                email: collection.contact.email || null
            })
        }

        let license = null
        if (collection.license) {
            license = new License({
                name: collection.license.name || null,
                url: collection.license.url || null
            })
        }

        let info = new Info({
            title: collection.title || null,
            description: collection.description || null,
            tos: collection.termsOfServive || null,
            contact: contact,
            license: license,
            version: collection.version || null
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

    _setBasicAuth() {
        return new Auth.Basic()
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
    _applyFuncOverPathArchitecture(collection, schema, func) {
        let architecture = {}
        for (let path in collection.paths) {
            if (collection.paths.hasOwnProperty(path)) {
                architecture[path] = architecture[path] || {}
                let methods = collection.paths[path]
                let _methods = Object.keys(methods)
                if (methods.parameters) {
                    let _params = new Schema()
                    _params = _params
                        .mergeSchema(methods.parameters)
                        .resolve(schema)
                        .toJS()

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
            schemes: schemes,
            host: host,
            path: basePath + subPath
        })

        return url
    }

    _extractResponseExternals(collection, content) {
        let produces = content.produces || collection.produces

        if (!produces) {
            return new Immutable.List()
        }

        return new Immutable.List([
            new Parameter({
                key: 'Content-Type',
                internals: new Immutable.List([
                    new Constraint.Enum(produces)
                ])
            })
        ])
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
                        value: mime
                    })
                ])
            })
        })

        return new Immutable.List(bodies)
    }

    _extractResponses(collection, content) {
        let _collection = collection || {}
        let _content = content || {}

        let result = []

        let responses = _content.responses

        const externals = this._extractResponseExternals(
            _collection, _content
        )

        const bodies = this._extractResponseBodies(
            _collection, _content
        )

        let codes = Object.keys(responses || {})
        for (let code of codes) {
            let body = new Immutable.List()
            if (responses[code].schema) {
                let schema = new Schema()
                schema = schema.mergeSchema(responses[code].schema)

                body = body.push(new Parameter({
                    key: 'schema',
                    value: schema,
                    externals: externals
                }))
            }

            let headers = new Immutable.List()
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

    _extractExternals(collection, content) {
        let consumes = content.consumes || collection.consumes

        if (!consumes) {
            return new Immutable.List()
        }

        return new Immutable.List([
            new Parameter({
                key: 'Content-Type',
                internals: new Immutable.List([
                    new Constraint.Enum(consumes)
                ])
            })
        ])
    }

    _extractContentTypes(collection, content) {
        let _content = content || {}
        let _collection = collection || {}

        let contentTypes = []

        if (_content.consumes && _content.consumes.length > 0) {
            contentTypes = _content.consumes
        }
        else if (
            _collection.consumes &&
            _collection.consumes.length > 0
        ) {
            contentTypes = _collection.consumes
        }
        return contentTypes
    }

    _extractParams(collection, content) {
        let _content = content || {}
        let _collection = collection || {}

        let contentTypes = this._extractContentTypes(_collection, _content)
        let parameters = _content.parameters || []
        let headers = []
        let queries = []
        let body = []
        let externals = this._extractExternals(_collection, _content)

        for (let contentType of contentTypes) {
            headers.push(new Parameter({
                key: 'Content-Type',
                value: contentType,
                externals: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
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
            formData: body
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

                if (param.in === 'body') {
                    if (!param.schema) {
                        const m = 'Expected a schema object in body param'
                        throw new Error(m)
                    }
                    body.push(
                        new Parameter({
                            key: 'body',
                            value: (new Schema())
                                .mergeSchema(param.schema),
                            type: 'schema',
                            description: param.description || null,
                            externals: externals
                        })
                    )
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
                    new Constraint.ExclusiveMinimum(param.maximum)
                )
            }
        }

        let _param = new Parameter({
            key: param.name || null,
            value: value,
            type: param.type || null,
            format: param.format || null,
            description: param.description || null,
            internals: internals,
            externals: externals
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
            if (
                typeMapping[contentType]
            ) {
                bodyType = typeMapping[contentType]
            }
            let body = new Body({
                type: bodyType,
                constraints: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        value: contentType
                    })
                ])
            })

            bodies = bodies.push(body)
        }

        return bodies
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

