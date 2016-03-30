import Immutable from 'immutable'
import yaml from 'yaml-js'
import tv4 from 'tv4'
import swaggerSchema from 'swagger-schema-official/schema.json'

import Request, {
    KeyValue,
    Group,
    Schema,
    SchemaReference,
    RequestContext,
    Response
} from '../../immutables/RESTRequest'

export default class SwaggerParser {
    contructor() {
        this.context = new RequestContext()
    }

    // @NotTested -> assumed valid
    parse(string) {
        let swaggerCollection = this._loadSwaggerCollection(string)
        let valid = this._validateSwaggerCollection(swaggerCollection)

        if (!valid) {
            let m = 'Invalid Swagger File (invalid schema / version < 2.0):\n'
            throw new Error(m + tv4.error)
        }

        if (swaggerCollection) {
            let baseSchema = new Schema()
            baseSchema = baseSchema.mergeSchema(swaggerCollection)

            let rootGroup = new Group()
            rootGroup.set('name', swaggerCollection.info.title)
            let pathLinkedRequests = this._applyFuncOverPathArchitecture(
                swaggerCollection,
                this._createRequest
            )

            rootGroup = this._createGroupTree(rootGroup, pathLinkedRequests)
            this.context = this.context
                .set('group', rootGroup)
                .set('schema', baseSchema)

            return this.context
        }
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
    _setBasicInfo(request, url, method, headers, responses) {
        let headerSet = this._convertKeyValueListToSet(headers)
        return request
            .set('url', url)
            .set('method', method.toUpperCase())
            .set('headers', new Immutable.OrderedMap(headerSet))
            .set('responses', new Immutable.OrderedMap(responses))
    }

    // @NotTested
    _setBody(request, swaggerCollection, body, formData, content) {
        let _request = request
        if (body) {
            if (!(body instanceof SchemaReference)) {
                throw new Error('expected SchemaReference Object as a body')
            }
            _request = _request
                .set('bodyType', 'schema')
                .set('body', body)
        }

        if (formData.length > 0) {
            const typeMapping = {
                'application/x-www-form-urlencoded': 'urlEncoded',
                'multipart/form-data': 'formData'
            }

            if (
                !(content.consumes && content.consumes.length > 0) &&
                swaggerCollection.consumes
            ) {
                content.consumes = swaggerCollection.consumes
            }

            if (content.consumes && content.comsumes[0]) {
                let contentType = content.consumes[0]
                if (
                    content.consumes.hasOwnProperty(contentType) &&
                    typeMapping[contentType]
                ) {
                    _request = _request.set('bodyType', contentType)
                }
            }

            _request = _request.set('body', new Immutable.List(formData))
        }

        return _request
    }

    // @Tested
    _setAuth(request, swaggerCollection, content) {
        if (content.security) {
            if (!swaggerCollection.securityDefinitions) {
                let m = 'Swagger - expected a security definition to exist'
                throw new Error(m)
            }
            for (let security of content.security) {
                for (let key in security) {
                    if (
                        security.hasOwnProperty(key) &&
                        swaggerCollection.securityDefinitions[key]
                    ) {
                        let definition = swaggerCollection
                            .securityDefinitions[key]
                        return request
                            .setAuthType(definition.type, definition)
                    }
                }
            }
        }

        return request
    }

    // @NotTested -> assumed valid
    _createRequest(swaggerCollection, path, method, content) {
        let request = new Request()
        let [ headers, queries, formData, body ] = this._extractParams(
            content.parameters
        )
        let responses = this._extractResponses(content.responses)
        let url = this._generateURL(swaggerCollection, path, queries)

        request = this._setSummary(request, path, content)
        request = this._setDescription(request, content)
        request = this._setBasicInfo(
            request,
            url,
            method,
            headers,
            responses
        )
        request = this._setBody(request, swaggerCollection, body, formData)
        request = this._setAuth(request, swaggerCollection, content)

        return request
    }

    // @tested
    _loadSwaggerCollection(string) {
        let swaggerCollection
        try {
            swaggerCollection = JSON.parse(string)
        }
        catch (jsonParseError) {
            try {
                swaggerCollection = yaml.load(string)
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

    // @tested
    _applyFuncOverPathArchitecture(collection, func) {
        let architecture = {}
        for (let path in collection.paths) {
            if (collection.paths.hasOwnProperty(path)) {
                architecture[path] = architecture[path] || {}
                let methods = collection.paths[path]
                for (let method in methods) {
                    if (methods.hasOwnProperty(method)) {
                        architecture[path][method] = func(
                            collection,
                            path,
                            method,
                            methods[method]
                        )
                    }
                }
            }
        }

        return architecture
    }

    // @tested
    _generateURL(swaggerCollection, path, queries) {
        let protocol = (
            swaggerCollection.schemes ?
            swaggerCollection.schemes[0] : 'http'
        ) + '://'
        let domain = swaggerCollection.host || 'localhost'
        let basePath = ''
        let subPath = ''
        let queryPath = ''

        if (
            swaggerCollection.basePath &&
            swaggerCollection.basePath.length > 0
        ) {
            basePath = swaggerCollection.basePath
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

        if (queries.length > 0) {
            queryPath = '?' + queries.map(pair => {
                return pair.get('key') + '=' + (pair.get('value') || '')
            }).join('&')
        }

        let url = protocol + domain + basePath + subPath + queryPath
        return url
    }

    // @tested
    _extractResponses(responses) {
        let result = {}

        if (responses) {
            for (let code in responses) {
                if (responses.hasOwnProperty(code)) {
                    let schema = null
                    if (responses[code].schema) {
                        schema = new Schema()
                        schema = schema.mergeSchema(responses[code].schema)
                    }

                    let response = new Response({
                        code: code,
                        description: responses[code].description || null,
                        schema: schema
                    })

                    result[code] = response
                }
            }
        }

        return result
    }

    // @tested
    _convertKeyValueListToSet(kvList) {
        return kvList.reduce((set, pair) => {
            set[pair.get('key')] = pair.get('value')
            return set
        }, {})
    }

    // @tested
    _extractParams(parameters) {
        let headers = []
        let queries = []
        let formData = []
        let body

        const mapping = {
            query: queries,
            header: headers,
            formData: formData
        }

        if (
            parameters &&
            typeof parameters[Symbol.iterator] === 'function'
        ) {
            for (let param of parameters) {
                let fieldList = mapping[param.in]
                if (fieldList) {
                    let value = param.default ? param.default : param.name
                    fieldList.push(new KeyValue(
                        {
                            key: param.name,
                            value: value,
                            valueType: param.type
                        }
                    ))
                }

                if (param.in === 'body') {
                    if (!param.schema || !param.schema.$ref) {
                        let m = 'Expected a schema.$ref object in body param'
                        throw new Error(m)
                    }
                    body = new SchemaReference({
                        reference: param.schema.$ref
                    })
                }
            }
        }
        return [ headers, queries, formData, body ]
    }

    // @tested
    _createGroupTree(group, paths) {
        let _group = group
        for (let path in paths) {
            if (paths.hasOwnProperty(path)) {
                let nodes = path.split('/')

                let startIndex = 1
                if (path.startsWith('/') === false) {
                    startIndex = 0
                }

                let keyPath = []
                for (let i = startIndex, l = nodes.length; i < l; i++) {
                    let node = nodes[i]

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

