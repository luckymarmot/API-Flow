import Immutable from 'immutable'
import BaseSerializer from '../BaseSerializer'
import {
    Parameter
} from '../../models/Core'

import Reference from '../../models/references/Reference'
import JSONSchemaReference from '../../models/references/JSONSchema'
import Auth from '../../models/Auth'

export default class SwaggerSerializer extends BaseSerializer {
  constructor() {
    super()
    this.includeOptional = false
    this.references = null
    this.host = null
  }

  serialize(context) {
    this.references = context.get('references')

    const info = this._formatInfo(context)

    const requests = context.get('requests').valueSeq()
    const [ host, schemes ] = this._formatHost(requests)
    this.host = host
    const [ paths, securityDefs ] = this._formatPaths(
            context, requests, schemes
        )
    const definitions = this._formatDefinitions(context)

    const swagger = {
      swagger: '2.0',
      info: info,
      host: host,
      paths: paths
    }

    Object.assign(swagger, definitions)

    if (schemes !== []) {
      swagger.schemes = schemes
    }

    if (securityDefs) {
      swagger.securityDefinitions = securityDefs
    }

    return JSON.stringify(swagger, null, '  ')
  }

  validate(text) {
    try {
      const swagger = JSON.parse(text)
      if (
                Object.keys(swagger.paths).length === 0 &&
                swagger.schemes.length === 0
            ) {
        return 'generated file of poor quality'
      }
    }
    catch (e) {
      return e
    }

    return null
  }

  _formatInfo(context) {
    const info = context.get('info')

    if (!info) {
      return {
        title: 'API-Flow Swagger Conversion',
        version: '0.0.0'
      }
    }

    const _info = {}

    const infoMap = {
      title: 'title',
      description: 'description',
      tos: 'termsOfService',
      contact: 'contact',
      license: 'license',
      version: 'version'
    }

    for (const key of Object.keys(infoMap)) {
      const value = info.get(key)
      if (value) {
        _info[infoMap[key]] = value
      }
    }

    if (!_info.title) {
      _info.title = 'API-Flow Swagger Conversion'
    }

    if (!_info.version) {
      _info.version = '0.0.0'
    }

    if (_info.contact) {
      const contact = this._formatContactInfo(_info.contact)
      if (Object.keys(contact).length > 0) {
        _info.contact = contact
      }
    }

    if (_info.license) {
      const license = this._formatLicenseInfo(_info.license)
      if (Object.keys(license).length > 0) {
        _info.license = license
      }
    }

    return _info
  }

  _formatContactInfo(contact) {
    const formatted = {}

    if (!contact) {
      return formatted
    }

    for (const key of contact.keys()) {
      if (contact.get(key) && key !== '_model') {
        formatted[key] = contact.get(key)
      }
    }

    return formatted
  }

  _formatLicenseInfo(license) {
    const formatted = {}

    if (!license) {
      return formatted
    }

    for (const key of license.keys()) {
      if (license.get(key) && key !== '_model') {
        formatted[key] = license.get(key)
      }
    }

    if (formatted.url && !formatted.name) {
      formatted.name = 'Missing License Scheme'
    }

    return formatted
  }

  _formatHost(requests) {
    if (!requests || requests.size === 0) {
      return [ 'localhost', [] ]
    }

    const urlMap = {}
    const reducer = (scheme) => {
      return (bool, req) => {
        const generatedHost = req.getIn([ 'url', 'host' ]).generate()
        urlMap[generatedHost] = (urlMap[generatedHost] || 0) + 1
        const value = req
                    .get('url')
                    ._getParamValue('protocol')
                    .indexOf(scheme) >= 0
        return bool && value
      }
    }

    const schemes = [ 'http', 'https', 'ws', 'wss' ]
    const usedSchemes = []
    for (const scheme of schemes) {
      const used = requests.reduce(reducer(scheme), true)

      if (used) {
        usedSchemes.push(scheme)
      }
    }

    const bestHost = Object.keys(urlMap).reduce((best, key) => {
      if (urlMap[key] > (urlMap[best] || -1)) {
        return key
      }
      return best
    }, 'localhost')

    return [ bestHost, usedSchemes ]
  }

  _formatPaths(context, requests, schemes) {
    let securityDefs = new Immutable.Map()
    const paths = {}
    requests.forEach(req => {
      const [ _defs, path, _req ] = this.
                _formatRequest(context, req, schemes)
      const request = paths[path] || {}
      securityDefs = securityDefs.mergeDeep(_defs)
      Object.assign(request, _req)
      paths[path] = request
    })
    return [ paths, securityDefs.toJS() ]
  }

  _formatRequest(context, request, schemes) {
    const req = {}
    const _path = request.getIn([ 'url', 'pathname' ])

    const path = this._formatSequenceParam(_path)

    const [ security, content ] = ::this.
            _formatContent(context, request, schemes)

    req[request.get('method').toLowerCase()] = content
    return [ security, path, req ]
  }

  _formatSequenceParam(_param) {
    if (_param.get('format') !== 'sequence') {
      const schema = _param.getJSONSchema(false, true)
      if (!schema.enum && typeof schema.default !== 'undefined') {
        schema.enum = [ schema.default ]
      }
      const generated = _param.generate(false, schema)
      return generated
    }

    const schema = _param.getJSONSchema()

    if (!schema['x-sequence']) {
      return _param.generate()
    }

    for (const sub of schema['x-sequence']) {
      if (sub['x-title']) {
        sub.enum = [ '{' + sub['x-title'] + '}' ]
      }
    }

    const generated = _param.generate(false, schema)
    return generated
  }

  _formatContent(context, request, schemes) {
    const _content = {}

    const currentHost = request.getIn([ 'url', 'host' ]).generate()
    if (currentHost !== this.host) {
      _content['x-host'] = currentHost
    }

    if (request.get('name')) {
      _content.summary = request.get('name')
    }

    if (request.get('description')) {
      _content.description = request.get('description')
    }

    if (request.get('tags').size > 0) {
      _content.tags = request.get('tags').toJS()
    }

    if (request.get('id')) {
      _content.operationId = request.get('id')
    }

    const _schemes = request.get('url')._getParamValue('protocol')

    if (!Immutable.is(
            Immutable.fromJS(schemes),
            Immutable.fromJS(_schemes)
        )) {
      _content.schemes = _schemes
    }

    const consumes = this._formatConsumes(context, request)
    if (consumes.length > 0) {
      _content.consumes = consumes
    }

    const produces = ::this._formatProduces(context, request)
    if (produces.length > 0) {
      _content.produces = produces
    }

    _content.parameters = ::this._formatParameters(
            context,
            request,
            consumes
        )
    const [ definitions, security ] = ::this._formatSecurity(context, request)
    const responses = ::this._formatResponses(context, request)

    if (Object.keys(responses).length === 0) {
      _content.responses = {
        default: {
          description: 'stub description for swagger compliance'
        }
      }
    }
    else {
      _content.responses = responses
    }

    _content.security = security

    return [ definitions, _content ]
  }

  _formatConsumes(context, request) {
    const bodies = request.get('bodies')
    const consumeMap = {}
    bodies.forEach(body => {
      const constraints = body.get('constraints')
      if (constraints && constraints.size > 0) {
        constraints.forEach(constraint => {
          if (
                        constraint.get('key') === 'Content-Type' &&
                        constraint.get('value')
                    ) {
            consumeMap[constraint.get('value')] = true
          }
        })
      }
    })

    return Object.keys(consumeMap)
  }

  _formatProduces(context, request) {
    const responses = request.get('responses')
    const produceMap = {}
    responses.forEach(response => {
      this._formatConsumes(context, response).reduce((map, produce) => {
        map[produce] = true
        return map
      }, produceMap)
    })

    return Object.keys(produceMap)
  }

  _formatResponses(context, request) {
    const responses = request.get('responses')
    const _responseMap = {}
    responses.forEach(response => {
      Object.assign(
                _responseMap,
                this._formatResponse(context, response)
            )
    })

    return _responseMap
  }

  _formatResponse(context, response) {
    const _responseMap = {}
    const content = {
      description: response.get('description') || 'stub description'
    }

    const examples = response.get('examples')
    if (examples) {
      content.examples = examples
    }

    const container = response.get('parameters')
    const headers = container.get('headers')
    const body = container.get('body')

    if (headers.size > 0) {
      content.headers = {}
      headers.forEach(param => {
        const _param = this._formatParam(null, param)
        const name = _param.name
        delete _param.name
        delete _param.required
        const final = {}
        final[name] = _param

        if (!content.headers) {
          content.headers = {}
        }
        Object.assign(content.headers, final)
      })
    }

    if (body.size > 0) {
      body.forEach(param => {
        let _param = this._formatParam('body', param, false)
        if (_param.type !== 'array') {
          delete _param.type
        }
        delete _param.in
        delete _param.name
        delete _param.required
        delete _param.description

        if (!content.schema) {
          content.schema = {}
        }

        if (typeof _param.$ref === 'object') {
          _param = _param.$ref || {}
        }

        content['x-use-with'] = _param['x-use-with']

        delete _param['x-use-with']
        Object.assign(content.schema, _param)
      })
    }

    _responseMap[response.get('code')] = content

    return _responseMap
  }

  _formatParameters(context, request, consumes) {
    const container = request.get('parameters')

    let headers = container.get('headers')
    const queries = container.get('queries')
    const body = container.get('body')
    const path = container.get('path')

    if (consumes.length > 0) {
      headers = headers.filter(header => {
        return header.get('key') !== 'Content-Type'
      })
    }

    const params = path.map(::this._formatPathParam)
            .concat(headers.map(::this._formatHeaderParam))
            .concat(queries.map(::this._formatQueryParam))
            .concat(body.map(::this._formatBodyParam))

    return this._dropDuplicateParameters(params)
  }

  _formatPathParam(param) {
    return this._formatParam('path', param)
  }

  _formatHeaderParam(param) {
    return this._formatParam('header', param)
  }

  _formatQueryParam(param) {
    return this._formatParam('query', param)
  }

  _formatBodyParam(param) {
    const domain = this._getContentTypeDomain(param)

    if (
            domain.indexOf('application/x-www-form-urlencoded') >= 0 ||
            domain.indexOf('multipart/form-data') >= 0
        ) {
      return this._formatParam('formData', param)
    }

    let schema = {}
    let name

    const stdTypes = {
      string: 'string',
      number: 'number',
      integer: 'integer',
      boolean: 'boolean',
      array: 'array',
      object: 'object'
    }

    if (stdTypes[param.get('type')]) {
      schema.type = param.get('type')
      if (param.get('value')) {
        schema.default = param.get('value')
      }
      name = param.get('key') || 'body'
    }
    else if (param.get('type') === 'reference') {
      const ref = param.get('value')

      const rawName = ref.get('relative') ||
                ref.get('uri') ||
                param.get('key') ||
                'body'

      name = rawName.split('/').slice(-1)[0]

      if (ref instanceof JSONSchemaReference) {
        if (this._isInlineRef(ref)) {
          schema = ref.get('value')
        }
        else {
          schema = {
            $ref: ref.get('relative') || ref.get('uri')
          }
        }
      }
      else if (this._isInlineRef(ref)) {
        let value = ref.get('value')
        if (typeof value !== 'string') {
          value = JSON.stringify(value, null, '  ')
        }
        schema = {
          type: 'string',
          default: value
        }
      }
      else {
        schema = {
          $ref: ref.get('relative') || ref.get('uri')
        }
      }
    }

    const formatted = {
      name: name,
      in: 'body',
      schema: schema
    }

    return formatted
  }

  _isInlineRef(reference) {
    const uri = reference.get('uri')
    if (uri) {
      return this.references.valueSeq().filter(container => {
        return !!container.getIn([ 'cache', uri ])
      }).count() === 0
    }
    return true
  }

  _getContentTypeDomain(param) {
    const externals = param.get('externals')
    let domain = []
    externals.forEach(external => {
      if (external.get('key') === 'Content-Type') {
        domain = external.getIn([ 'internals', 0, 'value' ])
      }
    })

    return domain
  }

  _dropDuplicateParameters(params) {
    const paramMap = {}

    params.forEach(param => {
      if (!paramMap[param.in + '-' + param.name]) {
        paramMap[param.in + '-' + param.name] = param
      }
      else if (
                (param.in === 'formData' || param.in === 'query') &&
                !param.collectionFormat
            ) {
        const _param = paramMap[param.in + '-' + param.name]
        if (
                    _param.enum &&
                    _param.enum.length === 1 &&
                    _param.enum[0] === _param.default
                ) {
          delete _param.enum
        }

        const { name, description } = _param
        const location = _param.in

        delete _param.required
        delete _param.in
        delete _param.name

        const multiParam = {
          in: location,
          name,
          type: 'array',
          items: _param,
          collectionFormat: 'multi',
          'x-title': name
        }

        if (description) {
          multiParam.description = description
        }
        paramMap[param.in + '-' + param.name] = multiParam
      }
    })

    return Object.values(paramMap)
  }

  _formatParam(source, _param, replaceRefs = true) {
    const description = _param.get('description')
    const example = _param.get('example')
    const format = _param.get('format')

    const param = {
      name: _param.get('key'),
      required: _param.get('required')
    }

    if (source) {
      param.in = source
    }

    if (source === 'path') {
      param.required = true
    }

    const stdTypes = {
      string: 'string',
      number: 'number',
      integer: 'integer',
      boolean: 'boolean'
    }

    if (stdTypes[_param.get('type')]) {
      if (_param.get('value')) {
        param.default = _param.get('value')
      }
    }

    const _schema = _param.getJSONSchema(false, replaceRefs)
    if (_param.get('type') === 'reference') {
      const value = _param.get('value')
      if (value.get('relative') || value.get('uri')) {
        param.$ref = {
          $ref: value.get('uri')
        }
      }
      else {
        param.$ref = {}
        Object.assign(param.$ref, _schema)
      }
    }
    else {
      Object.assign(param, _schema)
    }

    if (!stdTypes[param.type] && param.type !== 'array') {
      param.type = 'string'
    }

    if (_param.get('externals').size > 0 && this.includeOptional) {
      param['x-use-with'] = []

      _param.get('externals').forEach(external => {
        const constraint = {
          name: external.get('key')
        }
        const schema = external.getJSONSchema(false, false)
        Object.assign(constraint, schema)
        param['x-use-with'].push(constraint)
      })
    }

    if (description) {
      param.description = description
    }

    if (example) {
      if (example instanceof Reference) {
        const pseudo = new Parameter({
          type: 'reference',
          value: example
        })
        param['x-example'] = this._formatParam(null, pseudo)
        delete param['x-example'].required
      }
      else {
        param['x-example'] = example
      }
    }

    const formatMap = {
      int32: true,
      int64: true,
      float: true,
      double: true,
      byte: true,
      binary: true,
      date: true,
      'date-time': true,
      password: true
    }

    const arrayFormatMap = {
      csv: true,
      ssv: true,
      tsv: true,
      pipes: true,
      multi: true
    }

    if (format) {
      if (param.type === 'array' && arrayFormatMap[format]) {
        param.collectionFormat = format
      }
      else if (param.type !== 'array' && formatMap[format]) {
        param.format = format
      }
      else {
        param['x-format'] = format
      }
    }

    return param
  }

  _formatSecurity(context, request) {
    let _definitions = new Immutable.Map()
    const _security = []

    request.get('auths').forEach(auth => {
      if (!auth) {
        _security.push(null)
      }
      else {
        let rule = null

        if (auth instanceof Auth.Basic) {
          rule = ::this._formatBasicAuth
        }
        else if (auth instanceof Auth.ApiKey) {
          rule = ::this._formatApiKeyAuth
        }
        else if (auth instanceof Auth.OAuth2) {
          rule = :: this._formatOAuth2Auth
        }

        if (rule) {
          const [ definition, security ] = rule(context, auth)
          _security.push(security)
          _definitions = _definitions.mergeDeep(definition)
        }
      }
    })

    return [ _definitions.toJS(), _security ]
  }

  _formatBasicAuth(context, auth) {
    const name = auth.get('authName') || 'basic_auth'
    const securityDefinition = {
      type: 'basic'
    }

    if (auth.get('username')) {
      securityDefinition['x-username'] = auth.get('username')
    }

    if (auth.get('password')) {
      securityDefinition['x-password'] = auth.get('password')
    }

    if (auth.get('description')) {
      securityDefinition.description = auth.get('description')
    }

    const definition = {}
    definition[name] = securityDefinition

    const secured = {}
    secured[name] = []

    return [ definition, secured ]
  }

  _formatApiKeyAuth(context, auth) {
    const name = auth.get('authName') || 'api_key_auth'
    const securityDefinition = {
      type: 'apiKey',
      name: auth.get('name'),
      in: auth.get('in')
    }

    if (auth.get('description')) {
      securityDefinition.description = auth.get('description')
    }

    const definition = {}
    definition[name] = securityDefinition

    const secured = {}
    secured[name] = []

    return [ definition, secured ]
  }

  _formatOAuth2Auth(context, auth) {
    let scopes = auth.get('scopes')
    const name = auth.get('authName') || 'oauth_2_auth'

    const _definition = {
      type: 'oauth2'
    }

    if (auth.get('authorizationUrl')) {
      _definition.authorizationUrl = auth.get('authorizationUrl')
    }

    if (auth.get('tokenUrl')) {
      _definition.tokenUrl = auth.get('tokenUrl')
    }

    if (auth.get('flow')) {
      _definition.flow = auth.get('flow')
    }

    if (auth.get('description')) {
      _definition.description = auth.get('description')
    }

    const definition = {}
    definition[name] = _definition

    const scopeDescriptions = {}
    let security
    if (scopes) {
      scopes = Array.isArray(scopes) ? scopes : scopes.toJS()
      security = {}
      security[name] = scopes

      scopes.forEach(scope => {
        scopeDescriptions[scope] = ''
      })

      definition[name].scopes = scopeDescriptions
    }
    else {
      security = name
    }

    return [ definition, security ]
  }

  _unescapeURIFragment(uriFragment) {
    return uriFragment.replace(/~1/g, '/').replace(/~0/g, '~')
  }

  _formatDefinitions(context) {
    const schemas = {}
    const references = context.get('references')
    references.forEach(container => {
      container.get('cache').forEach((cache, key) => {
        if (key && key.indexOf('#/') === 0) {
          const pathFragments = key
                        .split('/')
                        .slice(1)
                        .map(fragment => {
                          return this._unescapeURIFragment(fragment)
                        })
                    // pointer assignement
                    // we're moving the subTree pointer to modify schemas
          let subTree = schemas
          for (const fragment of pathFragments) {
            subTree[fragment] =
                            typeof subTree[fragment] === 'undefined' ?
                            {} :
                            subTree[fragment]
            subTree = subTree[fragment]
          }

          let ref = container.resolve(key).get('value')

          if (typeof ref === 'undefined' || ref === null) {
            Object.assign(subTree, {
              type: 'string'
            })
          }
          else if (typeof ref === 'string') {
            Object.assign(subTree, {
              type: 'string',
              default: ref
            })
          }
          else {
                        // object assignement
            ref = this._replaceRefs(ref)
            if (typeof ref === 'string') {
              subTree = ref
            }
            else {
              Object.assign(subTree, ref)
            }
          }
        }
      })
    })

    return schemas
  }

  _replaceRefs(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return obj
    }

    if (obj instanceof Reference) {
      return obj.get('relative') || obj.get('uri')
    }

    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i += 1) {
        const content = obj[i]
        obj[i] = this._replaceRefs(content)
      }
    }
    else {
      for (const key of Object.keys(obj)) {
        const replaced = this._replaceRefs(obj[key])
        obj[key] = replaced
      }
    }

    return obj
  }
}
