import { OrderedMap, List } from 'immutable'

import Api from '../../models/Api'
import Store from '../../models/Store'
import Constraint from '../../models/Constraint'
import Parameter from '../../models/Parameter'
import Auth from '../../models/Auth'
import URL from '../../models/URL'
import Info from '../../models/Info'
import Variable from '../../models/Variable'
import Reference from '../../models/Reference'
import Resource from '../../models/Resource'
import Request from '../../models/Request'

/*
import Contact from '../../../models/Contact'
import License from '../../../models/License'
import Interface from '../../../models/Interface'
import ParameterContainer from '../../../models/ParameterContainer'
import Group from '../../../models/Group'
import Response from '../../../models/Response'
*/

import { genUuid } from '../../utils/gen-utils'

const methods = {
  genUuid
}

export const __meta__ = {
  version: 'v0.0',
  format: 'dummy'
}

export class DummyParser {
  static __meta__ = __meta__

  static detect(content) {
    return methods.detect(content)
  }

  static getAPIName(content) {
    return methods.getAPIName(content)
  }

  static isParsable(item) {
    return methods.isParsable(item)
  }

  detect() {
    return methods.detect(...arguments)
  }

  getAPIName() {
    return methods.getAPIName(...arguments)
  }

  isParsable() {
    return methods.isParsable(...arguments)
  }

  resolve() {
    return methods.resolve(...arguments)
  }

  parse() {
    return methods.parse(...arguments)
  }
}

methods.detect = () => {
  return 0
}

methods.getAPIName = () => {
  return null
}

methods.isParsable = ({ file }) => {
  if (file) {
    const name = file.name || ''
    return name.split('.').slice(-1)[0] === 'dummy' ? true : false
  }

  return false
}

methods.resolve = (items, item) => {
  items.push(item)
  return items
}

methods.createStore = () => {
  return new Store({
    constraint: new OrderedMap({
      User: new Constraint.JSONSchema({
        type: 'object',
        properties: {
          userId: {
            type: 'string',
            pattern: '^[0-9a-f]{16}$'
          },
          pets: {
            type: 'array',
            items: {
              $ref: '#/definitions/Pet'
            }
          }
        },
        required: [ 'userId', 'pets' ]
      }),
      Pet: new Constraint.JSONSchema({
        type: 'object',
        properties: {
          petId: {
            type: 'integer',
            minimum: 0,
            maximum: 1024
          },
          name: { type: 'string' },
          owner: {
            $ref: '#/definitions/User'
          }
        },
        required: [ 'petId', 'name' ]
      })
    }),
    endpoint: new OrderedMap({
      server1: new URL({
        url: 'https://echo.paw.cloud/server1'
      }).set('protocol', List([ 'https:', 'http:' ])),
      server2: new URL({
        url: 'https://echo.paw.cloud/server2'
      })
    }),
    parameter: new OrderedMap({
      token: new Parameter({
        type: 'integer',
        constraints: List([
          new Constraint.Enum([ 'token_1', 'token_2' ])
        ])
      })
    }),
    auth: new OrderedMap({
      basic_auth: new Auth.Basic({
        username: 'johnsmith'
      })
    }),
    variable: new OrderedMap({
      contentType: new Variable({
        values: new OrderedMap({
          'json-env': 'application/json',
          'xml-env': 'application/xml'
        })
      })
    })
  })
}

methods.createInfo = () => {
  return new Info({
    title: 'Dummy Api'
  })
}

methods.createResources = () => {
  return new OrderedMap({
    '/pets': new Resource({
      path: new URL({
        url: '/pets'
      }),
      methods: new OrderedMap({
        get: new Request({
          name: 'getPets',
          description: 'gets the list of pets',
          method: 'get',
          endpoints: new OrderedMap({
            server1: new Reference({
              type: 'endpoint',
              uuid: 'server1'
            }),
            server3: new URL({
              url: 'https://echo.paw.cloud/server3'
            })
          })
        })
      })
    }),
    '/pets/{petId}': new Resource({
      path: new URL({
        url: '/pets/{petId}',
        variableDelimiters: List([ '{', '}' ])
      }),
      methods: new OrderedMap({
        get: new Request({
          name: 'getPet',
          description: 'gets a pet given a petId',
          method: 'get',
          endpoints: new OrderedMap({
            server2: new Reference({
              type: 'endpoint',
              uuid: 'server2'
            })
          })
        }),
        post: new Request({
          name: 'updatePet',
          description: 'updates the pet with given petId',
          method: 'post',
          endpoints: new OrderedMap({
            server3: new URL({
              url: 'https://echo.paw.cloud/server3'
            })
          })
        })
      })
    })
  })
}

methods.parse = () => {
  const info = methods.createInfo()
  const store = methods.createStore()
  const resources = methods.createResources()

  return new Api({
    info,
    store,
    resources
  })
}

export const __internals__ = methods
export default DummyParser
