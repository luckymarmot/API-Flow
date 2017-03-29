import { List } from 'immutable'
import BaseSerializer from '../BaseSerializer'

import Group from '../../models/Group'
import JSONSchemaReference from '../../models/references/JSONSchema'

import Auth from '../../models/Auth'

import Base64 from '../../utils/Base64'

export default class PostmanSerializer extends BaseSerializer {
  constructor() {
    super()
    this.references = null
    this.usedReferences = []
  }

  serialize(context) {
    const structure = this._formatStructure(context)

    return JSON.stringify(structure, null, '\t')
  }

  validate(text) {
    try {
      const postman = JSON.parse(text)
      if (
                postman.collections.length === 0 &&
                postman.environments.length === 0
            ) {
        return 'generated file of poor quality'
      }
    }
    catch (e) {
      return e
    }
  }

  _formatStructure(context) {
    this.references = context.get('references')

    const structure = {
      version: 1,
      collections: [
        this._formatCollection(context)
      ]
    }

    structure.environments = [ this._formatEnvironments() ]

    return structure
  }

  _formatCollection(context) {
    const uuid = this._uuid()
    const name = this._formatCollectionName(context)

    const { requests, requestIdsMap } = this._formatRequests(context, uuid)
    const { folders, updatedRequests, orders } = this._formatFolders(
            context, requests, requestIdsMap
        )

    const collection = {
      id: uuid,
      name: name,
      folders,
      requests: updatedRequests,
      order: orders
    }

    return collection
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

  _formatCollectionName(context) {
    const group = context.get('group')
    if (group === null) {
      return 'API-Flow imports'
    }
    else {
      let name = group.get('name')
      const children = group.get('children')

      if (name === null) {
        children.forEach(child => {
          if (child instanceof Group) {
            if (child.get('name') !== null) {
              name = child.get('name')
            }
          }
        })
      }

      if (name === null) {
        return 'API-Flow imports'
      }

      return name
    }
  }

  _formatFolders(context, requests, requestIdsMap) {
    const group = context.get('group')

    if (!group) {
      return []
    }

    const children = group.get('children')

    if (!children) {
      return []
    }

    const orders = []

    const folders = children.valueSeq().map(groupOrId => {
      if (
                typeof groupOrId === 'string' ||
                typeof groupOrId === 'number'
            ) {
        if (requestIdsMap[groupOrId]) {
          orders.push(requestIdsMap[groupOrId])
        }
        return null
      }

      const order = ::this._extractRequestIdsFromGroup(
                groupOrId, requestIdsMap
            ).toJS()

      const uuid = this._uuid()

      const folder = {
        order,
        name: groupOrId.get('name') || '',
        id: uuid,
        collection_name: group.get('name') || '',
        collection_id: group.get('id') || '',
        collection: group.get('id') || '',
        owner: 0
      }

      requests
                .filter(request => order.indexOf(request.id) >= 0)
                .forEach(request => {
                  request.folder = folder.id
                })

      if (!folder.order.length) {
        return null
      }

      return folder
    }).filter(folder => !!folder)

    const updatedRequests = requests
    return { folders, updatedRequests, orders }
  }

  _extractRequestIdsFromGroup(groupOrId, requestIdsMap) {
    if (
            typeof groupOrId === 'string' ||
            typeof groupOrId === 'number') {
      if (requestIdsMap[groupOrId]) {
        return List([ requestIdsMap[groupOrId] ])
      }
      return List()
    }

    const requests = groupOrId
            .get('children')
            .valueSeq()
            .map((_groupOdId) => {
              return ::this._extractRequestIdsFromGroup(
                    _groupOdId, requestIdsMap
                )
            })
            .reduce(::this._flatten, List())

    return requests
  }

  _flatten(final, list) {
    return final.concat(list)
  }

  _formatRequests(context, collectionId) {
    const reqs = []
    const requests = context.get('requests').valueSeq()

    const requestIdsMap = {}

    requests.forEach(request => {
      const {
                formatted,
                mapping
            } = this._formatRequest(request, collectionId)
      reqs.push(formatted)
      Object.assign(requestIdsMap, mapping)
    })

    return { requests: reqs, requestIdsMap }
  }

  _formatRequest(request, collectionId) {
    const name = request.get('name')
    const description = request.get('description')
    const method = request.get('method').toUpperCase()

    const url = request.get('url')
    const origin = url.origin()
    const path = this._formatSequenceParam(url.get('pathname'))

    const parameters = request.get('parameters')
    const queries = this._formatQueries(parameters)
    const headers = this._formatHeaders(parameters, request.get('auths'))
    const bodies = request.get('bodies')
    const [ dataMode, data ] = this._formatBody(parameters, bodies)

    const uuid = this._uuid()
    const req = {
      id: uuid,
      url: origin + path + queries,
      method: method,
      collectionId: collectionId,
      name: name || origin + path,
      description: description || '',
      headers: headers,
      dataMode: dataMode,
      data: data
    }

    const mapping = {}
    mapping[request.get('id')] = uuid

    return { formatted: req, mapping }
  }

  _formatSequenceParam(_param) {
    return _param.generate()
  }

  _formatQueries(parameters) {
    const queries = parameters.get('queries')

    if (queries.size > 0) {
      return '?' + queries.map(this._formatQueryParam).join('&')
    }

    return ''
  }

  _formatQueryParam(param) {
    const key = param.get('key')
    let pair = null

    const validTypes = {
      string: true,
      number: true,
      integer: true,
      boolean: true
    }

    const type = param.get('type')
    const format = param.get('format')
    if (validTypes[type] && !(type === 'string' && format === 'sequence')) {
      const value = param.get('value')
      if (typeof value !== 'undefined' && value !== null) {
        pair = value
      }
      else {
        pair = param.generate()
      }
    }
    else {
      pair = '{{' + key + '}}'
    }

    return key + '=' + pair
  }

  _formatHeaders(parameters, auths) {
    const headers = parameters.get('headers')

    let toJoin = headers.map(header => {
      const generated = header.generate()
      return header.get('key') + ': ' + generated
    })

    toJoin = toJoin.concat(this._formatAuthHeader(auths))
    const formatted = toJoin.join('\n')

    return formatted
  }

  _formatAuthHeader(auths) {
    if (auths.size > 0) {
      const auth = auths.get(0)

      if (auth instanceof Auth.Basic) {
        return this._formatBasicAuthHeader(auth)
      }
      else if (auth instanceof Auth.Digest) {
        return this._formatDigestAuthHeader(auth)
      }
      else if (auth instanceof Auth.OAuth1) {
        return this._formatOAuth1AuthHeader(auth)
      }
      else if (auth instanceof Auth.AWSSig4) {
        return this._formatAWSSig4AuthHeader(auth)
      }
    }

    return []
  }

  _formatBasicAuthHeader(auth) {
    const authBlock = auth.get('username') + ':' + auth.get('password')
    const encoded = Base64.encode(authBlock)
    return [ 'Authorization: Basic ' + encoded ]
  }

  _formatDigestAuthHeader() {
    return [ 'Authorization: Digest' ]
  }

  _formatOAuth1AuthHeader(auth) {
    const oauth1Map = {
      consumer_key: auth.get('consumerKey') || '',
      oauth_signature_method: auth.get('algorithm') || '',
      oauth_version: '1.0'
    }

    const params = Object.keys(oauth1Map).map(key => {
      return key + '="' + oauth1Map[key] + '"'
    }).join(', ')

    return [ 'Authorization: OAuth ' + params ]
  }

  _formatAWSSig4AuthHeader() {
    return [ 'Authorization: AWS4-HMAC-SHA256' ]
  }

  _formatBody(parameters, bodies) {
    let params = parameters.get('body')

    let dataMode = 'params'

    if (bodies.size > 0) {
      const body = bodies.get(0)
      params = body.filter(parameters).get('body')
      const contentType = this._extractContentTypeFromBody(body)

      if (contentType === 'application/x-www-form-urlencoded') {
        dataMode = 'urlencoded'
      }
      else if (contentType === 'multipart/form-data') {
        dataMode = 'params'
      }
      else {
        dataMode = 'raw'
      }
    }

    let data
    if (dataMode === 'raw') {
      data = ''
      params.forEach(_body => {
        if (_body.get('value') instanceof JSONSchemaReference) {
          const ref = _body.get('value')
          if (this._isInlineRef(ref)) {
            const schema = _body.getJSONSchema(false)
            if (schema.type === 'string' && schema.default) {
              data += _body.generate()
            }
            else {
              data += JSON.stringify(
                                _body.getJSONSchema(false),
                                null,
                                '  '
                            )
            }
          }
          else {
            const rawName = ref.get('relative') ||
                            ref.get('uri') ||
                            _body.get('key') ||
                            'body'
            const name = rawName.split('/').slice(-1)[0]
            data += '{{' + name + '}}'
            this.usedReferences.push(ref)
          }
        }
        else {
          data += _body.generate()
        }
      })
    }
    else {
      data = []
      params.forEach(body => {
        data.push(this._formatBodyParam(body))
      })
    }

    return [ dataMode, data ]
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

  _formatBodyParam(param) {
    const key = param.get('key')
    let pair = null

    const validTypes = {
      string: true,
      number: true,
      integer: true,
      boolean: true
    }

    const type = param.get('type')
    const format = param.get('format')
    if (validTypes[type] && !(type === 'string' && format === 'sequence')) {
      const value = param.get('value')
      if (typeof value !== 'undefined' && value !== null) {
        pair = value
      }
      else {
        pair = param.generate()
      }
    }
    else if (type === 'reference') {
      const ref = param.get('value')

      if (this._isInlineRef(ref)) {
        pair = param.generate()
      }
      else {
        const rawName = ref.get('relative') || ref.get('uri') || key
        pair = '{{' + rawName.split('/').slice(-1)[0] + '}}'
      }
    }
    else {
      pair = '{{' + key + '}}'
    }

    return {
      key: param.get('key'),
      value: pair,
      type: 'text',
      enabled: true
    }
  }

  _extractContentTypeFromBody(body) {
    const constraints = body.get('constraints')
    let contentType = null
    constraints.forEach(param => {
      if (param.get('key') === 'Content-Type') {
        contentType = param.get('value')
      }
    })

    return contentType
  }

  _formatEnvironments() {
    const environmentId = this._uuid()

    const values = this.usedReferences.map(ref => {
      const rawName = ref.get('relative') || ref.get('uri')
      const name = rawName.split('/').slice(-1)[0]

      let value = ref.get('value')
      if (typeof value !== 'string') {
        value = JSON.stringify(value)
      }

      const envVariable = {
        key: name,
        value: value,
        type: 'text',
        enabled: true
      }
      return envVariable
    })

    return {
      id: environmentId,
      name: 'API-Flow Imports',
      values: values,
      timestamp: Date.now()
    }
  }
}
