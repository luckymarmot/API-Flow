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
import ParameterContainer from '../../models/ParameterContainer'
import Context from '../../models/Context'
import Group from '../../models/Group'

import { genUuid } from '../../utils/gen-utils'

const methods = {
  genUuid
}

export const __meta__ = {
  version: 'v0.0',
  format: 'dummy'
}

/**
 * a DummyParser. It contains a static Api Record.
 */
export class DummyParser {
  static __meta__ = __meta__

  /**
   * evaluates if the file is parsable by giving a score to the file depending on a few criteria.
   * @param {string} content: the content of the file to evaluate
   * @returns {number} the corresponding score, between 0 and 1
   */
  static detect(content) {
    return methods.detect(content)
  }

  /**
   * tries to extract a title from a RAML file
   * @param {string} content: the file to get the api title from
   * @returns {string?} the title, if it was found
   */
  static getAPIName(content) {
    return methods.getAPIName(content)
  }

  /**
   * evaluates if the file is parsable by giving a score to the file depending on a few criteria.
   * @param {Object} item: the content of the file to evaluate
   * @returns {boolean} true if parsable, false otherwise
   */
  static isParsable(item) {
    return methods.isParsable(item)
  }

  /**
   * converts an item into an intermediate model representation
   * @returns {Api} the corresponding Api Record
   */
  static parse() {
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
        key: 'Token',
        type: 'integer',
        constraints: List([
          new Constraint.Enum([ 'token_1', 'token_2' ])
        ])
      }),
      offset: new Parameter({
        key: 'offset',
        type: 'integer',
        description: 'the offset from which to start searching'
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
          }),
          auths: List([
            new Reference({
              type: 'auth',
              uuid: 'basic_auth'
            })
          ]),
          parameters: new ParameterContainer({
            headers: new OrderedMap({
              '1234': new Parameter({
                uuid: '1234',
                key: 'Accept',
                type: 'string',
                default: 'application/json',
                constraints: List([
                  new Constraint.Enum([
                    'application/json',
                    'application/xml'
                  ])
                ])
              }),
              '4321': new Reference({
                type: 'parameter',
                uuid: 'token'
              })
            }),
            queries: new OrderedMap({
              '2345': new Parameter({
                uuid: '2345',
                key: 'limit',
                type: 'integer',
                description: 'the number of pets to return with this query. if this is set to 0, ' +
                  'it returns all pets.',
                default: 100,
                constraints: List([
                  new Constraint.Minimum(0)
                ])
              }),
              '5432': new Reference({
                type: 'parameter',
                uuid: 'offset'
              })
            })
          })
        }),
        post: new Request({
          name: 'createPet',
          description: 'adds a Pet',
          method: 'post',
          endpoints: new OrderedMap({
            server1: new Reference({
              type: 'endpoint',
              uuid: 'server1'
            })
          }),
          parameters: new ParameterContainer({
            headers: new OrderedMap({
              '1234': new Parameter({
                uuid: '1234',
                key: 'Accept',
                type: 'string',
                default: 'application/json',
                constraints: List([
                  new Constraint.Enum([
                    'application/json',
                    'application/xml'
                  ])
                ])
              }),
              '4321': new Reference({
                type: 'parameter',
                uuid: 'token'
              }),
              '567': new Parameter({
                uuid: '1234',
                key: 'Content-Type',
                type: 'string',
                default: 'application/json',
                constraints: List([
                  new Constraint.Enum([
                    'application/json',
                    'application/xml'
                  ])
                ])
              })
            }),
            body: new OrderedMap({
              '765': new Parameter({
                uuid: '765',
                key: null,
                in: 'body',
                constraints: List([
                  new Constraint.JSONSchema({
                    type: 'object',
                    properties: {
                      name: {
                        type: 'string'
                      }
                    }
                  })
                ])
              })
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
          }),
          auths: List([
            new Auth.Basic({
              username: 'user',
              password: 'pass'
            })
          ])
        }),
        post: new Request({
          name: 'updatePet',
          description: 'updates the pet with given petId',
          method: 'post',
          endpoints: OrderedMap({
            server3: new URL({
              url: 'https://echo.paw.cloud/server3'
            })
          }),
          parameters: new ParameterContainer({
            headers: OrderedMap({
              '456': new Parameter({
                uuid: '456',
                key: 'Content-Type',
                description: 'the MIME type of the body of this request',
                default: 'application/x-www-form-urlencoded',
                applicableContexts: List([
                  new Parameter({
                    key: 'Content-Type',
                    type: 'string',
                    constraints: List([
                      new Constraint.Enum([ 'application/x-www-form-urlencoded' ])
                    ])
                  })
                ])
              }),
              '654': new Parameter({
                uuid: '654',
                key: 'Content-Type',
                description: 'the MIME type of the body of this request',
                default: 'multipart/form-data',
                applicableContexts: List([
                  new Parameter({
                    key: 'Content-Type',
                    type: 'string',
                    constraints: List([
                      new Constraint.Enum([ 'multipart/form-data' ])
                    ])
                  })
                ])
              })
            }),
            body: OrderedMap({
              '345': new Parameter({
                uuid: '345',
                key: 'ownerId',
                in: 'body',
                description: 'the id of the owner',
                type: 'string',
                constraints: List([ new Constraint.Pattern('^[0-9a-f]{15}$') ]),
                applicableContexts: List([
                  new Parameter({
                    key: 'Content-Type',
                    type: 'string',
                    constraints: List([
                      new Constraint.Enum([
                        'application/x-www-form-urlencoded',
                        'multipart/form-data'
                      ])
                    ])
                  })
                ])
              }),
              '543': new Parameter({
                uuid: '543',
                key: 'name',
                in: 'body',
                description: 'the name of the pet',
                type: 'string',
                applicableContexts: List([
                  new Parameter({
                    key: 'Content-Type',
                    type: 'string',
                    constraints: List([
                      new Constraint.Enum([
                        'application/x-www-form-urlencoded',
                        'multipart/form-data'
                      ])
                    ])
                  })
                ])
              })
            })
          }),
          contexts: new List([
            new Context({
              constraints: List([
                new Parameter({
                  key: 'Content-Type',
                  in: 'headers',
                  type: 'string',
                  default: 'application/x-www-form-urlencoded'
                })
              ])
            }),
            new Context({
              constraints: List([
                new Parameter({
                  key: 'Content-Type',
                  in: 'headers',
                  type: 'string',
                  default: 'multipart/form-data'
                })
              ])
            })
          ])
        })
      })
    })
  })
}

methods.createGroup = () => {
  return new Group({
    name: 'Root Group',
    children: OrderedMap({
      '/pets': '/pets',
      nested: new Group({
        name: 'Nested Group',
        children: OrderedMap({
          '/pets/{petId}': '/pets/{petId}'
        })
      })
    })
  })
}

methods.parse = () => {
  const info = methods.createInfo()
  const store = methods.createStore()
  const resources = methods.createResources()
  const group = methods.createGroup()

  return new Api({
    info,
    store,
    resources,
    group
  })
}

export const __internals__ = methods
export default DummyParser
