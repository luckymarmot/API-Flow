import Immutable from 'immutable'
import yaml from 'js-yaml'
import tv4 from 'tv4'
import swaggerSchema from 'swagger-schema-official/schema.json'

import RequestContext, {
    KeyValue,
    Group,
    Schema,
    Request,
    Response
} from '../../models/RequestContext'

export default class SwaggerParser {
    contructor() {
        this.context = new RequestContext()
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

            let reqContext = new RequestContext()
            reqContext = reqContext
                .set('group', rootGroup)
                .set('schema', baseSchema)

            this.context = reqContext

            return reqContext
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
        const headerSet = this._convertKeyValueListToSet(headers)
        return request
            .set('url', url)
            .set('method', method.toUpperCase())
            .set('headers', new Immutable.OrderedMap(headerSet))
            .set('responses', new Immutable.List(responses))
    }

    _extractContentType(swaggerCollection, content) {
        let contentType
        if (content.consumes && content.consumes.length > 0) {
            contentType = content.consumes[0]
        }
        else if (
            swaggerCollection.consumes &&
            swaggerCollection.consumes.length > 0
        ) {
            contentType = swaggerCollection.consumes[0]
        }

        return contentType
    }

    // @NotTested
    _setBody(request, swaggerCollection, body, formData, content) {
        let _request = request
        if (body) {
            if (!(body instanceof Schema)) {
                throw new Error('expected Schema Object as a body')
            }
            _request = _request
                .set('bodyType', 'schema')
                .set('body', body)
        }

        if (formData.length > 0) {
            let contentType = this
                ._extractContentType(swaggerCollection, content)

            const typeMapping = {
                'application/x-www-form-urlencoded': 'urlEncoded',
                'multipart/form-data': 'formData'
            }

            if (
                typeMapping[contentType]
            ) {
                _request = _request.set(
                    'bodyType', typeMapping[contentType]
                )
            }

            _request = _request.set('body', new Immutable.List(formData))
        }

        return _request
    }

    // @Tested
    _setAuth(request, swaggerCollection, content) {
        let _request = request
        if (content.security) {
            if (!swaggerCollection.securityDefinitions) {
                const m = 'Swagger - expected a security definition to exist'
                throw new Error(m)
            }
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
                        _request = _request
                            .setAuthType(definition.get('type'), definition)
                    }
                }
            }
        }

        return _request
    }

    _uriEncodeKeyValueList(kvList) {
        return kvList.map((kv) => {
            return kv
                .set('key', kv.get('key'))
                .set('value', kv.get('value'))
        })
    }

    _setQueries(request, queries) {
        let _queries = this._uriEncodeKeyValueList(queries)
        if (queries.length > 0) {
            return request.set('queries', new Immutable.List(_queries))
        }
        return request
    }

    // @NotTested -> assumed valid
    _createRequest(swaggerCollection, path, method, content) {
        let request = new Request()
        const [ headers, queries, formData, body ] = this._extractParams(
            content.parameters
        )
        const responses = this._extractResponses(content.responses)
        const url = this._generateURL(swaggerCollection, path)

        const contentType = this
            ._extractContentType(swaggerCollection, content)

        if (contentType) {
            headers.push(new KeyValue({
                key: 'Content-Type',
                value: contentType
            }))
        }

        request = this._setSummary(request, path, content)
        request = this._setDescription(request, content)
        request = this._setBasicInfo(
            request,
            url,
            method,
            headers,
            responses
        )
        request = ::this._setQueries(request, queries)
        request = ::this._setBody(
            request,
            swaggerCollection,
            body,
            formData,
            content
        )
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

    // @tested
    _generateURL(swaggerCollection, path) {
        const protocol = (
            swaggerCollection.schemes ?
            swaggerCollection.schemes[0] : 'http'
        ) + '://'
        const domain = swaggerCollection.host || 'localhost'
        let basePath = ''
        let subPath = ''

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

        const url = protocol + domain + basePath + subPath
        return url
    }

    // @tested
    _extractResponses(responses) {
        let result = []

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

                    result.push(response)
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
                    if (!param.schema) {
                        const m = 'Expected a schema object in body param'
                        throw new Error(m)
                    }
                    body = (new Schema()).mergeSchema(param.schema)
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

