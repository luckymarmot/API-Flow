import Immutable from 'immutable'
import RAML from 'raml-parser'
import __path from 'path'

import Context, {
    Body,
    Response,
    Parameter,
    ParameterContainer
} from '../../../models/Core'

import { Info } from '../../../models/Utils'

import Item from '../../../models/Item'
import Group from '../../../models/Group'
import Request from '../../../models/Request'
import URL from '../../../models/URL'

import ReferenceContainer from '../../../models/references/Container'
import Reference from '../../../models/references/Reference'
import ExoticReference from '../../../models/references/Exotic'
import JSONSchemaReference from '../../../models/references/JSONSchema'

import Constraint from '../../../models/Constraint'
import Auth from '../../../models/Auth'

import ShimmingFileReader from '../FileReader'

export default class RAMLParser {
  static format = 'raml'
  static version = 'v0.8'

  static detect(content) {
    const detection = {
      format: RAMLParser.format,
      version: RAMLParser.version,
      score: 0
    }

    const firstLine = content.split('\n', 1)[0]
    const match = firstLine.match(/#%RAML (0\.8|1\.0)/)
    if (match) {
      detection.score = 1
      return [ detection ]
    }
    return [ detection ]
  }

  static getAPIName(content) {
    const match = content.match(/^title:\s(.*)$/m)
    if (match) {
      return match[1] || null
    }

    return null
  }

  constructor(items) {
    this.reader = new ShimmingFileReader(items)
    this.context = new Context()
    this.item = new Item()
  }

  detect() {
    return RAMLParser.detect(...arguments)
  }

  getAPIName() {
    return RAMLParser.getAPIName(...arguments)
  }

  setFileReader(items, urlResolverClass) {
    this.reader = new ShimmingFileReader(items, urlResolverClass)
  }

  parse(_item) {
    this.item = new Item(_item)
    this.reader.setBaseItem(this.item)
    const string = this.item.get('content')
    const location = this.item.getPath()

    return RAML.load(string, location, {
      reader: this.reader
    }).then(raml => {
      if (raml) {
        const context = this._createContext(raml)
        return context
      }
      return
    }, error => {
      let msg = 'failed to parse RAML file'
      if (error.message) {
        msg += ' with reason: ' + error.message
      }
      throw new Error(msg)
    })
  }

  _createContext(_raml) {
    const references = ::this._findReferences(_raml)
    const raml = ::this._replaceReferences(_raml)

    const { group, requests } = this._createGroupTree(
            raml,
            raml,
            raml.title || null
        )

    let referenceMap = new Immutable.OrderedMap()
    if (references) {
      let container = new ReferenceContainer()
      container = container.create(references)
      if (container.get('cache').size > 0) {
        referenceMap = referenceMap.set(raml.title, container)
      }
    }

    const info = this._extractInfos(_raml)

    const context = new Context({
      requests: new Immutable.OrderedMap(requests),
      group: group,
      references: referenceMap,
      info: info ? info : new Info()
    })

    return context
  }

  _findReferences(obj) {
    let refs = new Immutable.List()

    if (typeof obj === 'string' && obj.indexOf('::fileRef::') === 0) {
      const rel = obj.slice(11)
      const uri = __path.resolve(__path.dirname(
                this.item.getPath()
            ), rel)
      return refs.push(
                new ExoticReference({
                  uri: uri,
                  relative: rel
                })
            )
    }

    if (typeof obj !== 'object') {
      return refs
    }

    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i += 1) {
        const content = obj[i]
        refs = refs.concat(::this._findReferences(content))
      }
    }
    else {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (key === 'schema' && typeof obj.schema === 'string') {
            const ref = this._createJSONSchemaReference(
                            obj.schema, this.item
                        )
            refs = refs.push(ref)
          }
          else {
            refs = refs.concat(::this._findReferences(obj[key]))
          }
        }
      }
    }
    return refs
  }

  _createJSONSchemaReference(_rel, item) {
    let rel = _rel
    if (rel.indexOf('::fileRef::') === 0) {
      rel = rel.slice(11)
      const uri = __path.resolve(__path.dirname(
                item.getPath()
            ), rel)

      return new JSONSchemaReference({
        uri: uri,
        relative: rel
      })
    }

    try {
      const schema = JSON.parse(rel)
      return new JSONSchemaReference({
        value: schema,
        resolved: true
      })
    }
    catch (e) {
      if (rel.match(/[<>]/)) {
        return new JSONSchemaReference({
          value: {
            description:
                            'This schema could not be reliably parsed.\n' +
                            'We have included it as a description to preserve' +
                            ' the information it represents.\n\n' + rel
          },
          resolved: true
        })
      }
      else if (!(rel.indexOf('#/') === 0)) {
        rel = '#/' + _rel
      }
    }


    const uri = item.getPath() + rel

    return new JSONSchemaReference({
      uri: uri,
      relative: rel
    })
  }

  _replaceReferences(obj) {
    if (typeof obj === 'string' && obj.indexOf('::fileRef::') === 0) {
      const rel = obj.slice(11)
      const uri = __path.resolve(__path.dirname(
                this.item.getPath()
            ), rel)
      return new ExoticReference({
        uri: uri,
        relative: rel
      })
    }

    if (typeof obj !== 'object') {
      return obj
    }

    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i += 1) {
        const content = obj[i]
        obj[i] = ::this._replaceReferences(content)
      }
    }
    else {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (key === 'schema' && typeof obj.schema === 'string') {
            obj.schema = this._createJSONSchemaReference(
                            obj.schema, this.item
                        )
          }
          else {
            obj[key] = ::this._replaceReferences(obj[key])
          }
        }
      }
    }

    return obj
  }

  _uuid() {
    let d = new Date().getTime()
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
            .replace(/[xy]/g, c => {
              const r = (d + Math.random() * 16) % 16 | 0
              d = Math.floor(d / 16)
              return (c === 'x' ? r : r & 0x3 | 0x8).toString(16)
            })
    return uuid
  }

  _createGroupTree(baseTree, tree, baseName, url = '') {
    let _url = url
        // ignore the first group name
    _url += tree.relativeUri || ''

    let _group
    const _requests = {}
    if (tree.resources || tree.methods) {
      _group = new Group({
        name: tree.displayName || tree.relativeUri || baseName
      })
    }

    for (const path of tree.resources || []) {
      const { group, requests } =
                this._createGroupTree(baseTree, path, '', _url)
      if (group) {
        _group = _group.setIn(
                    [ 'children', path.relativeUri ],
                    group
                )
      }

      if (requests) {
        Object.assign(_requests, requests)
      }
    }

    (tree.methods || []).forEach(
            data => {
              const request =
                    this._createRequest(baseTree, data, _url, data.method)

              const uuid = this._uuid()
              _requests[uuid] = request
              _group = _group.setIn([ 'children', data.method ], uuid)
            }
        )

    if (_group && _group.get('children').size > 0) {
      return { group: _group, requests: _requests }
    }

    return { group: null, requests: {} }
  }

  _createRequest(raml, req, url, method) {
    const _url = this._extractURL(raml, req, url)
    let container = new ParameterContainer()

    container = this._extractHeaders(raml, req, container)
    container = this._extractQueries(raml, req, container)
    container = this._extractPaths(_url, container)

    const [ updatedContainer, bodies ] = this._extractBodies(
            raml, req, container, new Immutable.List()
        )

    const auths = this._extractAuth(raml, req)
    const responses = this._extractResponses(raml, req)

    const request = new Request({
      url: _url,
      method: method,
      name: _url.href(),
      description: req.description || null,
      parameters: updatedContainer,
      bodies: bodies,
      auths: auths,
      responses: responses
    })
    return request
  }

  _extractURL(raml, req, path) {
    const baseUri = raml.baseUri
    const match = (baseUri || '').match(/(.*):\/\/([^/]*)\/?(.*)/)
    let schemes = []
    let domain
    let basePath

    if (!match) {
      domain = baseUri
    }
    else {
      schemes = [ match[1].toLowerCase() ]
      domain = match[2]
      if (match[3].endsWith('/')) {
        match[3] = match[3].slice(0, -1)
      }
      basePath = match[3] ? '/' + match[3] : ''
    }

    if (req.protocols && req.protocols !== []) {
      schemes = req.protocols.map(protocol => {
        return protocol.toLowerCase()
      })
    }

    const protocol = new Parameter({
      key: 'protocol',
      type: 'string',
      internals: new Immutable.List([
        new Constraint.Enum(schemes)
      ])
    })

    let parameters = Object.assign(
            {},
            raml.baseUriParameters || {},
            req.baseUriParameters || {}
        )
    const host = this._extractSequenceParam(
            raml, domain, 'host', parameters
        )

    parameters = Object.assign(
            {},
            raml.baseUriParameters || {},
            req.baseUriParameters || {},
            req.uriParameters || {}
        )
    const pathname = this._extractSequenceParam(
            raml, basePath + path, 'pathname', parameters
        )

    const _url = new URL({
      protocol: protocol,
      host: host,
      pathname: pathname
    })
    return _url
  }

  _extractSequenceParam(raml, _sequence, _key, parameters) {
    const simpleParam = new Parameter({
      key: _key,
      type: 'string',
      value: _sequence,
      internals: new Immutable.List([
        new Constraint.Enum([
          _sequence
        ])
      ])
    })
    if (!parameters) {
      return simpleParam
    }
    else {
      const groups = _sequence.match(/([^{}]*)(\{[^{}]*\})([^{}]*)/g)
      if (!groups) {
        return simpleParam
      }

      let sequence = new Immutable.List()
      for (const group of groups) {
        const sub = group.match(/([^{}]*)(\{[^{}]*\})([^{}]*)/)
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
          const key = sub[2].slice(1, -1)
          let _param

          if (key === 'version') {
            _param = {
              enum: [ raml.version ]
            }
          }
          else if (parameters[key]) {
            _param = parameters[key]
          }
          else {
            _param = {
              type: 'string'
            }
          }

          if (!_param.type) {
            _param.type = 'string'
          }

          let param = this._extractParam(
                        key, _param
                    )

          if (param === null) {
            param = new Parameter({
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

          param = param.set('required', true)
          sequence = sequence.push(param)
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

  _extractParam(name, param, externals) {
    if (typeof param === 'undefined' || param === null) {
      return null
    }

    let type = param.type
    let value

    let _name = null
    if (typeof name !== 'undefined') {
      _name = name
    }

    const description = param.description || null

    if (param.schema) {
      if (param.schema instanceof Reference) {
        type = 'reference'
      }
      else {
                // FIXME: we are not propagating the fact that it's a schema
        type = 'string'
        _name = 'schema'
      }

      return new Parameter({
        key: _name,
        name: param.displayName || null,
        value: param.schema,
        type: type,
        description: description,
        example: param.example || null,
        externals: externals || new Immutable.List()
      })
    }

    if (param && typeof param[Symbol.iterator] === 'function') {
      value = new Immutable.List()
      type = 'multi'
      for (const subparam of param) {
        value = value.push(this._extractParam(name, subparam))
      }
    }
    else if (typeof param.default !== 'undefined') {
      value = param.default
    }
    else {
      value = null
    }

    const internalsMap = {
      maximum: Constraint.Maximum,
      minimum: Constraint.Minimum,
      maxLength: Constraint.MaximumLength,
      minLength: Constraint.MinimumLength,
      pattern: Constraint.Pattern,
      enum: Constraint.Enum
    }

    let internals = new Immutable.List()
    for (const key of Object.keys(param)) {
      if (internalsMap[key]) {
        const constraint = new internalsMap[key](param[key])
        internals = internals.push(constraint)
      }
    }

    return new Parameter({
      key: _name,
      name: param.displayName || null,
      value: value,
      type: type || null,
      description: description,
      example: param.example || null,
      internals: internals,
      externals: externals || new Immutable.List()
    })
  }

  _extractHeaders(raml, req, container) {
    let headers = container.get('headers')

    for (const header in req.headers || {}) {
      if (req.headers.hasOwnProperty(header)) {
        const param = req.headers[header]
        headers = headers.push(this._extractParam(header, param))
      }
    }

    return container.set('headers', headers)
  }

  _extractQueries(raml, req, container) {
    let queries = container.get('queries')
    for (const paramName in req.queryParameters || {}) {
      if (req.queryParameters.hasOwnProperty(paramName)) {
        const param = req.queryParameters[paramName]
        queries = queries.push(this._extractParam(paramName, param))
      }
    }

    return container.set('queries', queries)
  }

  _extractPaths(url, container) {
    if (url.getIn([ 'pathname', 'format' ]) !== 'sequence') {
      return container
    }

    const param = url.get('pathname')
    let paths = container.get('path')

    const sequence = param.get('value')
    sequence.forEach(_param => {
      if (_param.get('key')) {
        paths = paths.push(_param)
      }
    })

    return container.set('path', paths)
  }

  _extractBodies(raml, req, container, bodies) {
    const _body = req.body || {}
    let _bodies = bodies
    let _container = container
    let headers = container.get('headers')

    let bodyParams = container.get('body')

    if (_body.schema) {
      bodyParams = bodyParams.push(this._extractParam(null, _body))
      _bodies = _bodies.push(new Body())
      _container = _container.set('body', bodyParams)
      return [ _container, _bodies ]
    }

    const bodyTypeMap = {
      'application/x-www-form-urlencoded': 'urlEncoded',
      'multipart/form-data': 'formData'
    }

    for (const contentType of Object.keys(_body)) {
      const externals = new Immutable.List([
        new Parameter({
          key: 'Content-Type',
          type: 'string',
          value: contentType,
          internals: new Immutable.List([
            new Constraint.Enum([ contentType ])
          ])
        })
      ])

      const bodyType = bodyTypeMap[contentType] || null

      const body = new Body({
        type: bodyType,
        constraints: new Immutable.List([
          new Parameter({
            key: 'Content-Type',
            type: 'string',
            value: contentType
          })
        ])
      })

      _bodies = _bodies.push(body)

      const formParameters = (_body[contentType] || {}).formParameters
      if (bodyType && formParameters) {
        for (const param of Object.keys(formParameters)) {
          bodyParams = bodyParams.push(
                        this._extractParam(
                            param,
                            formParameters[param],
                            externals
                        )
                    )
        }
      }

      if (!bodyType && !(_body[contentType] || {}).formParameters) {
        const param = this._extractParam(
                    null, _body[contentType], externals
                )

        if (param) {
          bodyParams = bodyParams.push(param)
        }
      }

      headers = headers.push(new Parameter({
        key: 'Content-Type',
        type: 'string',
        value: contentType,
        internals: new Immutable.List([
          new Constraint.Enum([
            contentType
          ])
        ]),
        externals: externals
      }))
    }

    _container = _container
            .set('body', bodyParams)
            .set('headers', headers)

    return [ _container, _bodies ]
  }

  _extractAuth(raml, req) {
    let auths = new Immutable.List()
    if (!req.securedBy) {
      return auths
    }

    for (const secured of req.securedBy) {
      if (secured === null) {
        auths = auths.push(null)
      }
      let securedName
      let params
      if (typeof secured === 'string' || secured === null) {
        securedName = secured
        params = {}
      }
      else {
        securedName = Object.keys(secured)[0]
        params = secured[securedName]
      }

      for (const scheme of raml.securitySchemes || []) {
        if (Object.keys(scheme)[0] === securedName) {
          const authName = Object.keys(scheme)[0]
          const security = scheme[authName]

          const securityMap = {
            'OAuth 2.0': this._extractOAuth2Auth,
            'OAuth 1.0': this._extractOAuth1Auth,
            'Basic Authentication': this._extractBasicAuth,
            'Digest Authentication': this._extractDigestAuth
          }

          const rule = securityMap[security.type]
          if (rule) {
            auths = auths.push(
                          rule(raml, authName, security, params)
                        )
          }
        }
      }
    }
    return auths
  }

  _extractOAuth2Auth(raml, authName = null, security, params) {
    const flowMap = {
      code: 'accessCode',
      token: 'implicit',
      owner: 'application',
      credentials: 'password'
    }
    const _params = params || {}
    const auth = new Auth.OAuth2({
      authName,
      description: security.description || null,
      flow:
                flowMap[(_params.authorizationGrants || [])[0]] ||
                flowMap[security.settings.authorizationGrants[0]] ||
                null,
      authorizationUrl:
                _params.authorizationUri ||
                security.settings.authorizationUri ||
                null,
      tokenUrl:
                _params.accessTokenUri ||
                security.settings.accessTokenUri ||
                null,
      scopes:
                new Immutable.List(
                    _params.scopes ||
                    security.settings.scopes || []
                )
    })

    return auth
  }

  _extractOAuth1Auth(raml, authName = null, security, params) {
    const _params = params || {}
    const auth = new Auth.OAuth1({
      authName,
      description: security.description || null,
      authorizationUri:
                _params.authorizationUri ||
                security.settings.authorizationUri ||
                null,
      tokenCredentialsUri:
                _params.tokenCredentialsUri ||
                security.settings.tokenCredentialsUri ||
                null,
      requestTokenUri:
                _params.requestTokenUri ||
                security.settings.requestTokenUri ||
                null
    })

    return auth
  }

  _extractBasicAuth(raml, authName = null, security = {}) {
    const auth = new Auth.Basic({
      authName,
      description: security.description || null
    })
    return auth
  }

  _extractDigestAuth(raml, authName = null, security = {}) {
    const auth = new Auth.Digest({
      authName,
      description: security.description || null
    })
    return auth
  }

  _extractResponses(raml, req) {
    let responses = new Immutable.List()

    for (const code of Object.keys(req.responses || {})) {
      const response = req.responses[code] || {}
      const description = response.description || null

      const [ _container, _bodies ] = this._extractBodies(
                raml, response, new ParameterContainer(), new Immutable.List()
            )

      const _response = new Response({
        code: code,
        description: description,
        parameters: _container,
        bodies: _bodies
      })

      responses = responses.push(_response)
    }

    return responses
  }

  _extractInfos(raml) {
    const documentation = raml.documentation || []

    const description = documentation.reduce((desc, doc) => {
      let title = doc.title || ''
      if (title) {
        title = title + ':\n'
      }

      let content = doc.content || ''
      if (content) {
        content = content + '\n'
      }
      const str = title + content + '\n'
      return desc + str
    }, '')

    const info = new Info({
      title: raml.title || null,
      description: description || null,
      version: raml.version || null
    })
    return info
  }
}
