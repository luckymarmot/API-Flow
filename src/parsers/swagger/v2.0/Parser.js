import Immutable from 'immutable'
import yaml from 'js-yaml'
import tv4 from 'tv4'
import swaggerSchema from 'swagger-schema-official/schema.json'

import Constraint from '../../../models/Constraint'

import Context, {
    Parameter,
    ParameterContainer,
    Body,
    Response
} from '../../../models/Core'

import {
    Info, Contact, License
} from '../../../models/Utils'

import Group from '../../../models/Group'
import Request from '../../../models/Request'
import Auth from '../../../models/Auth'
import URL from '../../../models/URL'
import Item from '../../../models/Item'

import ReferenceContainer from '../../../models/references/Container'
import JSONSchemaReference from '../../../models/references/JSONSchema'

export default class SwaggerParser {
    static version = 'v2.0'
    static format = 'swagger'

    static detect(content) {
        let parser = SwaggerParser
        let detection = {
            format: parser.format,
            version: parser.version,
            score: 0
        }

        let swag
        try {
            swag = JSON.parse(content)
        }
        catch (jsonParseError) {
            try {
                swag = yaml.safeLoad(content)
            }
            catch (yamlParseError) {
                return [ detection ]
            }
        }

        if (swag) {
            // converting objects to bool to number, fun stuff
            let score = 0
            score += swag.swagger ? 1 / 3 : 0
            score += swag.swagger === '2.0' ? 1 / 3 : 0
            score += swag.info ? 1 / 3 : 0
            score += swag.paths ? 1 / 3 : 0
            score = score > 1 ? 1 : score
            detection.score = score
            return [ detection ]
        }

        return [ detection ]
    }

    static getAPIName(content) {
        let swag
        try {
            swag = JSON.parse(content)
        }
        catch (jsonParseError) {
            try {
                swag = yaml.safeLoad(content)
            }
            catch (yamlParseError) {
                return null
            }
        }

        if (swag && swag.info) {
            return swag.info.title || null
        }

        return null
    }

    constructor() {
        this.context = new Context()
        this.item = new Item()
    }

    detect() {
        return SwaggerParser.detect(...arguments)
    }

    getAPIName() {
        return SwaggerParser.getAPIName(...arguments)
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
            let requests = this._extractRequests(swaggerCollection)

            rootGroup = this._createGroupTree(rootGroup, requests)

            let info = this._extractContextInfo(swaggerCollection.info)

            let reqContext = new Context()
            reqContext = reqContext
                .set('requests', new Immutable.OrderedMap(requests))
                .set('group', rootGroup)
                .setIn([ 'references', 'schemas' ], refs)
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
    _createRequest(swaggerCollection, path, method, content, description) {
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
        request = this._setDescription(request, content, description)
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
        else if (content.operationId) {
            return request.set('name', content.operationId)
        }
        return request.set('name', path)
    }

    // @tested
    _setDescription(request, content, description) {
        let _description = []
        if (content.description) {
            _description.push(content.description)
        }

        if (description) {
            _description.push(description)
        }

        return request.set('description', _description.join('\n\n') || null)
    }

    // @tested
    _setBasicInfo(request, url, method, container, bodies, responses) {
        let _container = container || new ParameterContainer()
        let _bodies = bodies || new Immutable.List()
        let _responses = responses || new Immutable.List()

        return request.withMutations(req => {
            req
                .set('url', url)
                .set('method', method.toUpperCase())
                .set('parameters', _container)
                .set('bodies', _bodies)
                .set('responses', _responses)
        })
    }

    // @Tested
    _setAuth(request, swaggerCollection, content) {
        let _request = request

        let _security = content.security || swaggerCollection.security || []

        const typeMap = {
            basic: this._setBasicAuth,
            apiKey: this._setApiKeyAuth,
            oauth2: this._setOAuth2Auth
        }

        if (_security.length === 0) {
            return _request
        }

        if (!swaggerCollection.securityDefinitions) {
            const m = 'Swagger - expected a security definition to exist'
            throw new Error(m)
        }

        let auths = []
        for (let security of _security) {
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

                    const type = definition.get('type')
                    if (typeMap[type]) {
                        let auth = typeMap[type](key, definition)
                        auths.push(auth)
                    }
                }
            }
        }

        auths = new Immutable.List(auths)
        return _request.set('auths', auths)
    }

    _setBasicAuth(authName = null, definition) {
        let username = null
        let password = null

        if (definition) {
            username = definition['x-username'] || null
            password = definition['x-password'] || null
        }

        return new Auth.Basic({ authName, username, password })
    }

    _setApiKeyAuth(authName = null, definition) {
        return new Auth.ApiKey({
            authName,
            in: definition.get('in'),
            name: definition.get('name')
        })
    }

    _setOAuth2Auth(authName = null, definition) {
        return new Auth.OAuth2({
            authName,
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

    _uuid() {
        let d = new Date().getTime()
        let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
            .replace(/[xy]/g, c => {
                let r = (d + Math.random() * 16) % 16 | 0
                d = Math.floor(d / 16)
                return (c === 'x' ? r : r & 0x3 | 0x8).toString(16)
            })
        return uuid
    }

    // @tested
    _extractRequests(collection) {
        let requests = {}

        let filterOtherFieldsOutFunc = (bool) => {
            return (val) => {
                let _bool = (val || '').toLowerCase().indexOf('x-') === 0
                return bool !== _bool
            }
        }

        let createOtherFieldDescFunc = (methods) => {
            return (str, field) => {
                return str + '\n  - ' + field + ': ' +
                    JSON.stringify(methods[field] || null, null, '  ')
            }
        }

        let pathMap = collection.paths
        const paths = Object.keys(pathMap)
        for (let path of paths) {
            let methodMap = pathMap[path]
            let methods = Object.keys(methodMap)
            if (methodMap.parameters) {
                let _params = this._getParameters(
                    collection,
                    methodMap.parameters
                )

                let paramKey = methods.indexOf('parameters')
                // remove paramKey
                methods.splice(paramKey, 1)

                for (let method of methods) {
                    let params = this._updateParametersInMethod(
                        methodMap[method],
                        _params
                    )
                    methodMap[method].parameters = params
                }
            }

            let validMethods = methods.filter(
                filterOtherFieldsOutFunc(true)
            )

            let description = methods.filter(
                filterOtherFieldsOutFunc(false)
            ).reduce(createOtherFieldDescFunc(methods), '')

            if (description) {
                description = 'The following fields were provided at the ' +
                    'path level:' + description
            }

            for (let method of validMethods) {
                let request = this._createRequest(
                    collection,
                    path,
                    method,
                    methodMap[method],
                    description
                )

                let uuid = this._uuid()

                requests[uuid] = request
            }
        }

        return requests
    }

    _getParameters(collection, params) {
        let _params = []
        for (let param of params) {
            if (param.$ref) {
                let _param = ::this._extractSubTree(
                    collection,
                    param.$ref
                )

                if (_param) {
                    _params.push(_param)
                }
            }
            else {
                _params.push(param)
            }
        }

        return _params
    }

    _unescapeURIFragment(uriFragment) {
        return uriFragment.replace(/~1/g, '/').replace(/~0/g, '~')
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
        let ref = new JSONSchemaReference()
        ref = ref.resolve(JSON.stringify(collection))
        let refs = ref.get('dependencies')
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
            if (!(basePath.indexOf('/') === 0)) {
                basePath = '/' + basePath
            }

            if (basePath.indexOf('/') === basePath.length - 1) {
                basePath = basePath.substr(0, basePath.length - 1)
            }
        }

        if (!path || path.length === 0 || path[0] !== '/') {
            throw new Error('Invalid Swagger, path must begin with a /')
        }
        else {
            subPath = path
        }

        let resolvedParams = this._getParameters(
            collection,
            content.parameters || []
        )

        let pathParams = resolvedParams.filter(param => {
            return param.in === 'path'
        })

        let protocol = new Parameter({
            key: 'protocol',
            type: 'string',
            internals: new Immutable.List([
                new Constraint.Enum(schemes)
            ])
        })

        let hostParam = this._extractSequenceParam(
            host, 'host', pathParams
        )

        let pathnameParam = this._extractSequenceParam(
            basePath + subPath, 'pathname', pathParams
        )

        let url = new URL({
            protocol: protocol,
            host: hostParam,
            pathname: pathnameParam
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
                ).set('name', 'body')

                body = body.push(param)
            }

            let contentTypes = this._extractContentTypes(
                _collection, _content, false
            )

            let headers = new Immutable.List()
            for (let contentType of contentTypes) {
                headers.push(new Parameter({
                    key: 'Content-Type',
                    name: 'Content-Type',
                    type: 'string',
                    value: contentType,
                    internals: new Immutable.List([
                        new Constraint.Enum([ contentType ])
                    ]),
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
                        responses[code].headers[header],
                        externals
                    )
                    headers = headers.push(param)
                }
            }

            let examples = responses[code].examples || null

            let container = new ParameterContainer({
                body: body,
                headers: headers
            })
            let response = new Response({
                code: code,
                description: responses[code].description || null,
                examples: examples,
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

        parameters = this._getParameters(collection, parameters)

        let headers = []
        let queries = []
        let body = []
        let path = []

        let contentTypes = this._extractContentTypes(_collection, _content)
        let externals = this._extractExternals(_collection, _content)

        for (let contentType of contentTypes) {
            headers.push(new Parameter({
                key: 'Content-Type',
                name: 'Content-Type',
                type: 'string',
                value: contentType,
                internals: new Immutable.List([
                    new Constraint.Enum([ contentType ])
                ]),
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

        for (let param of parameters) {
            let fieldList = mapping[param.in]
            if (fieldList) {
                let _param = this._extractParam(param, externals)
                fieldList.push(_param)
            }
        }

        let container = new ParameterContainer({
            headers: new Immutable.List(headers),
            queries: new Immutable.List(queries),
            body: new Immutable.List(body),
            path: new Immutable.List(path)
        })

        return container
    }

    _extractParam(param, externals) {
        let _key = param.name || null
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

        if (param.schema) {
            let currentURI = this.item.getPath()
            let uri = (new URL(param.schema.$ref, currentURI)).href()
            value = new JSONSchemaReference({
                uri: uri,
                relative: param.schema.$ref || ''
            }).resolve(param.schema)
            type = 'reference'
            _key = null
        }

        if (param.type === 'array') {
            if (param.items) {
                value = this._extractParam(param.items, externals)
            }
            else {
                value = new Immutable.List()
            }
            format = param.collectionFormat || null
        }

        if (param['x-use-with']) {
            _externals = new Immutable.List()
            for (let external of param['x-use-with']) {
                _externals = _externals.push(
                    this._extractParam(external, new Immutable.List())
                )
            }
        }

        let _param = new Parameter({
            key: _key,
            name: param.name || null,
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

    _formatSequenceParam(_param) {
        if (_param.get('format') !== 'sequence') {
            let schema = _param.getJSONSchema(false, true)
            if (!schema.enum && typeof schema.default !== 'undefined') {
                schema.enum = [ schema.default ]
            }
            let generated = _param.generate(false, schema)
            return generated
        }

        let schema = _param.getJSONSchema()

        if (!schema['x-sequence']) {
            return _param.generate()
        }

        for (let sub of schema['x-sequence']) {
            if (sub['x-title']) {
                sub.enum = [ '{' + sub['x-title'] + '}' ]
            }
        }

        let generated = _param.generate(false, schema)
        return generated
    }


    _createTagGroupTree(group, tagLists) {
        let _group = group
        if (!group || !(group instanceof Group)) {
            _group = new Group({
                name: 'root'
            })
        }
        const tagGroups = tagLists.reduce((tagGroup, { tags, uuid }) => {
            const firstTag = tags.get(0) || 'Uncategorized'
            tagGroup[firstTag] = tagGroup[firstTag] || new Group({
                name: firstTag
            })

            tagGroup[firstTag] = tagGroup[firstTag]
                .setIn([ 'children', uuid ], uuid)
            return tagGroup
        }, {})

        return _group.set('children', new Immutable.OrderedMap(tagGroups))
    }

    _createPathGroupTree(group, paths) {
        let _group = group
        if (!group || !(group instanceof Group)) {
            _group = new Group({
                name: 'root'
            })
        }
        const pathMap = paths.reduce((_pathMap, { uuid, path, method }) => {
            _pathMap[path] = _pathMap[path] || {}
            _pathMap[path][method] = uuid
            return _pathMap
        }, {})

        for (let path in pathMap) {
            if (pathMap.hasOwnProperty(path)) {
                let nodes = path.split('/')

                if (path.indexOf('/') === 0) {
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
                for (let method in pathMap[path]) {
                    if (pathMap[path].hasOwnProperty(method)) {
                        _group = _group.setIn(
                            keyPath.concat(method),
                            pathMap[path][method]
                        )
                    }
                }
            }
        }

        return _group
    }

    // @tested
    _createGroupTree(group, requestMap) {
        const uuids = Object.keys(requestMap)

        const tagLists = uuids
            .map(uuid => {
                const tags = requestMap[uuid].get('tags')
                return { uuid, tags }
            })

        const countRequestWithTags = tagLists
            .filter(({ tags }) => tags.size > 0)
            .length

        if (countRequestWithTags < uuids.length * 0.5) {
            const paths = uuids.map(uuid => {
                const path = this._formatSequenceParam(
                    requestMap[uuid].getIn([ 'url', 'pathname' ])
                )

                const method = requestMap[uuid].get('method')

                return { uuid, path, method }
            })

            return this._createPathGroupTree(group, paths)
        }
        else {
            return this._createTagGroupTree(group, tagLists)
        }
    }

    _extractSequenceParam(_sequence, _key, parameters) {
        let simpleParam = new Parameter({
            key: _key,
            type: 'string',
            internals: new Immutable.List([
                new Constraint.Enum([
                    _sequence
                ])
            ])
        })

        let groups = _sequence.match(/([^{}]*)(\{[^{}]*\})([^{}]*)/g)
        if (!groups) {
            return simpleParam
        }

        let sequence = new Immutable.List()
        for (let group of groups) {
            let sub = group.match(/([^{}]*)(\{[^{}]*\})([^{}]*)/)
            if (sub[1]) {
                sequence = sequence.push(new Parameter({
                    type: 'string',
                    value: sub[1],
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            sub[1]
                        ])
                    ])
                }))
            }

            if (sub[2]) {
                let key = sub[2].slice(1, -1)
                let _param

                let found = false

                for (let param of parameters || []) {
                    if (param.name === key) {
                        _param = this._extractParam(param, new Immutable.List())
                        found = true
                    }
                }

                if (!found) {
                    _param = new Parameter({
                        key: key,
                        type: 'string',
                        value: sub[2],
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                sub[2]
                            ])
                        ])
                    })
                }

                _param = _param.set('required', true)
                sequence = sequence.push(_param)
            }

            if (sub[3]) {
                sequence = sequence.push(new Parameter({
                    type: 'string',
                    value: sub[3],
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            sub[3]
                        ])
                    ])
                }))
            }
        }

        return new Parameter({
            key: _key,
            type: 'string',
            format: 'sequence',
            value: sequence
        })
    }
}
