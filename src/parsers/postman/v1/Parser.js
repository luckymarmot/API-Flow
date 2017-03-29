import Immutable from 'immutable'

import Context, {
    Parameter,
    ParameterContainer
} from '../../../models/Core'

import Constraint from '../../../models/Constraint'

import ReferenceContainer from '../../../models/references/Container'
import LateResolutionReference from '../../../models/references/LateResolution'

import URL from '../../../models/URL'
import Group from '../../../models/Group'
import Request from '../../../models/Request'

import Auth from '../../../models/Auth'

export default class PostmanParser {
  static format = 'postman'
  static version = 'v1'

  static detect(content) {
    const detection = {
      format: PostmanParser.format,
      version: PostmanParser.version,
      score: 0
    }

    let postman
    try {
      postman = JSON.parse(content)
    }
    catch (jsonParseError) {
      return [ detection ]
    }
    if (typeof postman === 'object') {
      let score = 0
            /* eslint-disable no-extra-paren */
      score += postman.collections ? 1 / 2 : 0
      score += postman.environments ? 1 / 2 : 0
      score +=
                postman.id &&
                postman.name &&
                typeof postman.timestamp !== 'undefined'
             ? 1 / 2 : 0
      score += postman.requests ? 1 / 2 : 0
      score += postman.values ? 1 / 2 : 0
      score = score < 1 ? score : 1
      detection.score = score
      return [ detection ]
            /* eslint-enable no-extra-paren */
    }
    return [ detection ]
  }

  static getAPIName(content) {
    let postman
    try {
      postman = JSON.parse(content)
    }
    catch (jsonParseError) {
      return null
    }

        // Postman Dump
    if (
            postman && postman.collections && postman.collections.length === 1
        ) {
      return postman.collections[0].name || null
    }

        // Postman Environment or Postman Collection
    if (
            postman &&
            postman.id &&
            typeof postman.timestamp !== 'undefined' &&
            postman.name
        ) {
      return postman.name
    }

    return null
  }

  constructor() {
    this.context = new Context()
    this.references = new Immutable.List()
  }

  detect() {
    return this.constructor.detect(...arguments)
  }

  getAPIName() {
    return PostmanParser.getAPIName(...arguments)
  }

    // @tested
  parse(item) {
    const collections = []
    const environments = []

    let obj
    try {
      obj = JSON.parse(item.content)
    }
    catch (e) {
      throw new Error('Invalid Postman file (not a valid JSON)')
    }
        /* .postman_dump */
    if (obj.collections || obj.environments) {
      if (
                obj.collections &&
                (
                    Array.isArray(obj.collections) ||
                    typeof obj.collection[Symbol.iterator] === 'function'
                )
            ) {
        for (const collection of obj.collections) {
          collections.push(collection)
        }
      }
      if (
                obj.environments &&
                (
                    Array.isArray(obj.environments) ||
                    typeof obj.environments[Symbol.iterator] === 'function'
                )
            ) {
        for (const environment of obj.environments) {
          environments.push(environment)
        }
      }
    }
        /* .postman_collection */
    else if (obj.requests) {
      collections.push(obj)
    }
        /* .postman_environment */
    else if (obj.values && obj.name) {
      environments.push(obj)
    }
    else {
      throw new Error('Invalid Postman file (missing required keys)')
    }
    this.context = ::this._createContext(environments, collections)
    return this.context
  }

    // @tested
  _createContext(environments, collections) {
    let envs = new Immutable.OrderedMap()
    environments.forEach(_env => {
      const env = this._importEnvironment(_env)
      envs = envs.set(env.get('id'), env)
    })

    const _requests = {}
    const baseGroup = collections.reduce(
            (rootGroup, collection) => {
              const { group, requests } = this._importCollection(collection)
              Object.assign(_requests, requests)

              return rootGroup.setIn(
                    [ 'children', group.get('id') ], group
                )
            },
            new Group()
        )

    if (this.references) {
      const keys = envs.keySeq()

      if (keys.size === 0) {
        envs = envs.set('defpostmanenv', (new ReferenceContainer({
          name: 'Default Postman Environment'
        })).create(this.references))
      }
      else {
        for (const key of keys) {
          let container = envs.get(key)
          container = container.create(this.references)
          envs = envs.set(key, container)
        }
      }
    }

    const context = new Context({
      references: envs,
      group: baseGroup
    })
    return context
  }

    // @tested
  _importEnvironment(environment) {
    let env = new ReferenceContainer({
      id: environment.id,
      name: environment.name
    })

    if (environment.values) {
      const refs = environment.values.map(value => {
        const ref = new LateResolutionReference({
          uri: '#/x-postman/{{' + value.key + '}}',
          relative: '#/x-postman/{{' + value.key + '}}',
          value: value.value,
          resolved: true
        })
        return ref
      })
      env = env.create(refs)
    }

    return env
  }

    // @tested
  _importCollection(collection) {
    if (!collection.requests) {
      throw new Error('Invalid Postman file (missing data)')
    }

    if (
            !Array.isArray(collection.requests) &&
            typeof collection.requests[Symbol.iterator] !== 'function'
        ) {
      const msg = 'Invalid collection format: collections should have ' +
                'a list of requests - found: ' + typeof collection.requests +
                ' instead for collection ' + collection.name + ' with id ' +
                collection.id
      throw new Error(msg)
    }

    const requestsById = {}
    for (const req of collection.requests) {
      const request = ::this._createRequest(collection, req)
      requestsById[req.id] = request
    }

    const group = this._createGroupFromCollection(
            collection, requestsById
        )

    return { group, requests: requestsById }
  }

    // @tested
  _referenceEnvironmentVariable(string) {
    if (typeof string === 'undefined' || string === null) {
      return null
    }

    if (typeof string === 'string') {
      if (string.match(/{{[^{}]*}}/)) {
        const ref = new LateResolutionReference({
          uri: '#/x-postman/' + this._escapeURIFragment(string),
          relative: '#/x-postman/' + this._escapeURIFragment(string),
          resolved: true
        })
        this.references = this.references.push(ref)
        return ref
      }
      else {
        return string
      }
    }
  }

    // @tested
  _extractBasicAuth(params, helper) {
    const auth = new Auth.Basic()
    if (helper) {
      return auth
                .set(
                    'username',
                    this._referenceEnvironmentVariable(
                        helper.username
                    )
                )
                .set(
                    'password',
                    this._referenceEnvironmentVariable(
                        helper.password
                    )
                )
    }
    else {
      return auth.set('raw', params || null)
    }
  }

  _extractDigestAuth(params, helper) {
    const digestMap = {
      username: true,
      password: true
    }

    let auth = new Auth.Digest()
    if (helper) {
      return auth
                .set(
                    'username',
                    this._referenceEnvironmentVariable(
                        helper.username
                    )
                )
                .set(
                    'password',
                    this._referenceEnvironmentVariable(
                        helper.password
                    )
                )
    }
    else {
      const kvList = params.match(/([^\s,]*="[^"]*")|([^\s,]*='[^']*')/g)
      kvList.forEach((kv) => {
        const kvMatch = kv
                    .match(/([^=]*)=["'](.*)["']/)
        if (kvMatch) {
          const [ key, value ] = kvMatch.slice(1, 3)
          if (digestMap[key]) {
            auth = auth.set(key,
                            this._referenceEnvironmentVariable(value)
                        )
          }
        }
      })

      return auth
    }
  }

  _extractAWSS4Auth(params, helper) {
    const auth = new Auth.AWSSig4()
    if (helper) {
      return auth
                .set(
                    'key',
                    this._referenceEnvironmentVariable(
                        helper.accessKey
                    )
                )
                .set(
                    'secret',
                    this._referenceEnvironmentVariable(
                        helper.secretKey
                    )
                )
                .set(
                    'region',
                    this._referenceEnvironmentVariable(
                        helper.region
                    )
                )
                .set(
                    'service',
                    this._referenceEnvironmentVariable(
                        helper.service
                    )
                )
    }
    return auth
  }

  _extractHawkAuth(params, helper) {
    const auth = new Auth.Hawk()

    if (helper) {
      return auth
            .set(
                'algorithm',
                this._referenceEnvironmentVariable(
                    helper.algorithm
                )
            )
            .set(
                'key',
                this._referenceEnvironmentVariable(
                    helper.hawk_key
                )
            )
            .set(
                'id',
                this._referenceEnvironmentVariable(
                    helper.hawk_id
                )
            )
    }
    return auth
  }

  _extractOAuth1(params) {
    let auth = new Auth.OAuth1()
    if (!params) {
      return auth
    }

    const paramMap = {
      oauth_consumer_key: 'consumerKey',
      oauth_signature_method: 'algorithm',
      oauth_timestamp: 'timestamp',
      oauth_nonce: 'nonce',
      oauth_version: 'version',
      oauth_signature: 'signature'
    }

    const kvList = (params || '').split(',')
    for (const kvStr of kvList) {
      const [ key, value ] = kvStr.split('=')
      const finalKey = key.replace(/(^[\s"']*)|([\s"']*$)/g, '')
      if (paramMap[finalKey]) {
        auth = auth.set(
                    paramMap[finalKey],
                    this._referenceEnvironmentVariable(
                        value.replace(/(^[\s"']*)|([\s"']*$)/g, '')
                    )
                )
      }
    }
    return auth
  }

  _extractAuth(authLine, helperType, helper) {
    const [ , scheme, params ] = authLine.match(/([^\s]+)\s(.*)/) || []

    const helperMap = {
      basicAuth: ::this._extractBasicAuth,
      digestAuth: ::this._extractDigestAuth,
      awsSigV4: ::this._extractAWSS4Auth,
      hawkAuth: ::this._extractHawkAuth
    }

    let _helper = helper
    if (typeof _helper === 'string') {
      try {
        _helper = JSON.parse(_helper)
      }
      catch (e) {
                /* eslint-disable no-console */
        console.error(
                    'We found a weird looking helper that we couldn\'t parse'
                )
                /* eslint-enable no-console */
      }
    }

    const rule = helperMap[helperType]
    if (rule) {
      return rule(params, _helper)
    }

    const schemeSetupMap = {
      Basic: ::this._extractBasicAuth,
      Digest: ::this._extractDigestAuth,
      OAuth: ::this._extractOAuth1,
      'AWS4-HMAC-SHA256': ::this._extractAWSS4Auth,
      Hawk: ::this._extractHawkAuth
    }

    const setup = schemeSetupMap[scheme]
    if (setup) {
      return setup(params, _helper)
    }

    return null
  }

  _createRequest(collection, req) {
    const [ container, url, auths ] = this._extractParameters(req)

    const request = new Request({
      id: req.id,
      name: req.name,
      description: req.description,
      method: req.method,
      url: url,
      parameters: container,
      auths: auths
    })

    return request
  }

  _extractParameters(req) {
    const [ _headers, auths ] = this._extractHeaders(req)
    const [ url, paths, queries ] = this._extractParamsFromUrl(
            req.url, req.pathVariables
        )
    const [ body, headers ] = this._extractBodyParams(req, _headers)

    const container = new ParameterContainer({
      queries: queries,
      headers: headers,
      body: body,
      path: paths
    })

    return [ container, url, auths ]
  }

  _extractHeaders(req) {
    const headerLines = req.headers.split('\n')
    let headerSet = new Immutable.OrderedMap()
    const auths = []
    const headers = []

    for (const headerLine of headerLines) {
      const match = headerLine.match(/^([^\s\:]*)\s*\:\s*(.*)$/)
      if (match) {
        if (match[1] === 'Authorization') {
          const auth = ::this._extractAuth(
                        match[2],
                        req.currentHelper,
                        req.helperAttributes
                    )
          if (auth) {
            auths.push(auth)
          }
        }
        else {
          headerSet = headerSet.set(match[1], match[2])
        }
      }
    }

    headerSet.forEach((value, key) => {
      const param = this._extractParam(key, value)
      headers.push(param)
    })

    return [
      new Immutable.List(headers),
      new Immutable.List(auths)
    ]
  }


  _extractParamsFromUrl(url, pathVariables) {
    let _url = new URL(url)
    const queries = []
    const paths = []

    const protocol = this._extractParam(
            'protocol', _url.generateParam('protocol')
        )
    const host = this._extractParam(
            'host', _url.generateParam('host')
        )

    const path = this._extractParam(
            'pathname',
            this._replacePathVariables(
                _url.generateParam('pathname'),
                pathVariables
            )
        )

    _url = _url
            .set('protocol', protocol)
            .set('host', host)
            .set('pathname', path)

    const match = url.match(/([^?]+)\?(.*)/)
    if (match) {
      const components = match[2].split('&')
      for (const component of components) {
        const query = this._extractQueryFromComponent(component)
        if (query) {
          queries.push(query)
        }
      }
    }

    if (path.get('type') === 'reference') {
      const ref = path.get('value')
      const value = ref.get('relative').split('/').slice(-1)[0]
      const content = this._unescapeURIFragment(value)
      const groups = content.match(/{{.*?}}/g)

            // warning: this only works with simple groups of the form {{ex}}
            // nested groups will produce weird path parameters
      if (groups) {
        for (const group of groups) {
          const param = this._extractParam(group.slice(2, -2), group)
          paths.push(param)
        }
      }
    }

    return [ _url, new Immutable.List(paths), new Immutable.List(queries) ]
  }

  _replacePathVariables(path, vars) {
    const re = /\/:([^:\/{.}]+)/g
    const str = path
    let m
    const lst = []
    let baseIndex = 0
    while ((m = re.exec(str)) !== null) {
      if (
                vars &&
                typeof vars[m[1]] !== 'undefined' &&
                vars[m[1]] !== ''
            ) {
        if (baseIndex !== m.index) {
                    // m.index + 1 to also include the `/`
          lst.push(str.slice(baseIndex, m.index + 1))
        }

        baseIndex = m.index + m[0].length

        lst.push(vars[m[1]])
      }
    }
    lst.push(str.slice(baseIndex))

    return lst.join('')
  }

  _escapeURIFragment(uriFragment) {
    return uriFragment.replace(/~/g, '~0').replace(/\//g, '~1')
  }

  _unescapeURIFragment(uriFragment) {
    return uriFragment.replace(/~1/g, '/').replace(/~0/g, '~')
  }

  _extractQueryFromComponent(component) {
    const m = component.match(/^([^\=]+)(?:\=([\s\S]*))?$/)

    if (!m) {
      return null
    }

    const key = decodeURIComponent(m[1])
    let value = null
    if (typeof m[2] === 'string') {
      value = decodeURIComponent(m[2])
    }

    return this._extractParam(key, value)
  }

  _extractParam(_key, _value) {
    const key = _key
    const name = this._referenceEnvironmentVariable(key)

    let value
    if (typeof _value === 'string') {
      value = this._referenceEnvironmentVariable(
                _value
            )
    }

    let internals = new Immutable.List()
    let type = 'string'
    if (value instanceof LateResolutionReference) {
      type = 'reference'
    }
    else {
      internals = new Immutable.List([
        new Constraint.Enum([ value ])
      ])
    }

    return new Parameter({
      key: key,
      name: name,
      value: value,
      type: type,
      internals: internals
    })
  }

  _extractBodyParams(req, _headers) {
    let headers = _headers
    const params = []
    if (req.dataMode === 'raw') {
      const param = this._extractParam('body', req.rawModeData || req.data)
      params.push(param)
    }
    else if (req.dataMode === 'urlencoded' || req.dataMode === 'params') {
      if (req.data && req.data.length) {
        let contentType = this._extractContentType(headers)
        if (!contentType && req.dataMode === 'urlencoded') {
          const header = this._extractParam(
                        'Content-Type', 'application/x-www-form-urlencoded'
                    )
          contentType = 'application/x-www-form-urlencoded'
          headers = headers.push(header)
        }
        else if (!contentType && req.dataMode === 'params') {
          const header = this._extractParam(
                        'Content-Type', 'multipart/form-data'
                    )
          contentType = 'multipart/form-data'
          headers = headers.push(header)
        }

        for (const _param of req.data) {
          let param = this._extractParam(_param.key, _param.value)
          if (contentType) {
            param = param.set('externals', new Immutable.List([
              new Parameter({
                key: 'Content-Type',
                type: 'string',
                internals: new Immutable.List([
                  new Constraint.Enum([
                    contentType
                  ])
                ])
              })
            ]))
          }
          params.push(param)
        }
      }
    }

    return [ new Immutable.List(params), headers ]
  }

  _extractContentType(headers) {
    let contentType = null
    headers.forEach(header => {
      if (
                header.get('key') === 'Content-Type' &&
                typeof header.get('value') === 'string'
            ) {
        contentType = header.get('value')
      }
    })

    return contentType
  }

  _putRequestsInGroup(group, ids, requests) {
    let _group = group
    for (const id of ids) {
      const req = requests[id]
      if (req) {
        _group = _group.setIn(
          [
            'children', req.get('id')
          ],
                    req.get('id')
                )
      }
    }

    return _group
  }

  _createGroupFromCollection(collection, requests) {
    let rootGroup = new Group({
      id: collection.id,
      name: collection.name
    })
    if (collection.folders || collection.order) {
      if (collection.folders) {
        for (const folder of collection.folders) {
          let group = new Group({
            id: folder.id,
            name: folder.name
          })

          group = this._putRequestsInGroup(
                        group,
                        folder.order || [],
                        requests
                    )

          rootGroup = rootGroup
                        .setIn([ 'children', group.get('id') ], group)
        }
      }

      if (collection.order) {
        for (const id of collection.order) {
          const req = requests[id]
          rootGroup = rootGroup
                        .setIn([ 'children', req.get('id') ], req.get('id'))
        }
      }
    }
    else {
      for (const id in requests) {
        if (requests.hasOwnProperty(id)) {
          const req = requests[id]
          rootGroup = rootGroup
                        .setIn([ 'children', req.get('id') ], req.get('id'))
        }
      }
    }

    return rootGroup
  }
}
