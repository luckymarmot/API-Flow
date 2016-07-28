import Immutable from 'immutable'
import BaseImporter from '../base-importer/BaseImporter'

import jsf from 'json-schema-faker'

import Context, {
    Body,
    Parameter,
    ParameterContainer
} from '../../../models/Core'

import Auth from '../../../models/Auth'
import Constraint from '../../../models/Constraint'
import URL from '../../../models/URL'
import Group from '../../../models/Group'
import Request from '../../../models/Request'

import LateResolutionReference from '../../../models/references/LateResolution'
import JSONSchemaReference from '../../../models/references/JSONSchema'
import ReferenceContainer from '../../../models/references/Container'
import ReferenceCache from '../../../models/references/Cache'

@registerImporter // eslint-disable-line
export default class DummyImporter extends BaseImporter {
    static identifier = 'com.luckymarmot.PawExtensions.DummyImporter';
    static title = 'Dummy Importer';

    static fileExtensions = [];
    static inputs = [];

    constructor() {
        super()
        this.ENVIRONMENT_DOMAIN_NAME = 'Dummy Environments'
    }

    canImport(context, items) {
        let sum = 0
        for (let item of items) {
            sum += ::this._canImportItem(context, item)
        }
        let score = items.length > 0 ? sum / items.length : 0
        return score
    }

    _canImportItem(context, item) {
        if (item.file) {
            let name = item.file.name || ''
            return name.split('.').slice(-1)[0] === '.dummy' ? 1 : 0
        }
        return 0
    }

    /*
      @params:
        - context
        - items
        - options
    */
    createRequestContexts(context, items) {
        let api = new Context({
            group: new Group({
                name: 'API-Flow Validation'
            })
        })

        /*
        api = this._addEmptyGroupTest(api)
        api = this._addUnnamedGroupTest(api)
        api = this._addSimpleGroupTest(api)
        api = this._addNestedGroupTest(api)

        api = this._addMethodTest(api)
        api = this._addURLTest(api)
        api = this._addParameterTest(api)
        api = this._addBodiesTest(api)
        api = this._addAuthTest(api)
        */

        api = this._addReferenceTest(api)

        /*
        let currentReqContext = new Context({
            group: new Group({
                name: 'API-Flow',
                children: new Immutable.OrderedMap({
                    0: new Group({
                        id: '0',
                        name: 'Nested Group',
                        children: new Immutable.OrderedMap({
                            get: new Request({
                                name: 'Simple GET Request',
                                url: new URL(
                                    'https://echo.luckymarmot.com/users'
                                ),
                                method: 'GET',
                                description: 'gets all the users'
                            }),
                            post: new Request({
                                name: 'Simple POST Request',
                                url: new URL(
                                    'https://echo.luckymarmot.com/users/create'
                                ),
                                method: 'GET',
                                parameters: new ParameterContainer({
                                    queries: new Immutable.List([
                                        new Parameter({
                                            key: 'name',
                                            name: 'Username',
                                            type: 'string',
                                            internals: new Immutable.List([
                                                new Constraint.MaximumLength(9),
                                                new Constraint.MinimumLength(4)
                                            ])
                                        })
                                    ])
                                }),
                                description: 'creates a user'
                            })
                        })
                    }),
                    1: new Group({
                        id: '1',
                        name: 'Another Nested Group',
                        children: new Immutable.OrderedMap({
                            123: new Request({
                                id: '123',
                                name: 'get a list of songs',
                                url: new URL(
                                    'https://echo.luckymarmot.com/songs'
                                ),
                                method: 'GET',
                                parameters: new ParameterContainer({
                                    headers: new Immutable.List([
                                        new Parameter({
                                            key: 'Accept',
                                            name: 'Accept',
                                            value: 'utf-8',
                                            type: 'string',
                                            internals: new Immutable.List([
                                                new Constraint.Enum([ 'utf-8' ])
                                            ])
                                        })
                                    ])
                                }),
                                auths: new Immutable.List([
                                    new Auth.Basic({
                                        username: 'username'
                                    })
                                ])
                            })
                        })
                    }),
                    234: new Request({
                        id: '234',
                        name: 'A UrlEncoded Request',
                        method: 'POST',
                        url: new URL(
                            'https://echo.luckymarmot.com/charts'
                        ),
                        parameters: new ParameterContainer({
                            body: new Immutable.List([
                                new Parameter({
                                    key: 'limit',
                                    name: 'Song Limit',
                                    type: 'integer',
                                    internals: new Immutable.List([
                                        new Constraint.Maximum(100)
                                    ])
                                }),
                                new Parameter({
                                    key: 'sequence',
                                    name: 'A sequence param',
                                    type: 'string',
                                    format: 'sequence',
                                    value: new Immutable.List([
                                        new Parameter({
                                            type: 'string',
                                            value: 'a simple ',
                                            internals: new Immutable.List([
                                                new Constraint.Enum([
                                                    'a simple'
                                                ])
                                            ])
                                        }),
                                        new Parameter({
                                            key: 'param',
                                            name: 'Param',
                                            type: 'reference',
                                            value: new JSONSchemaReference({
                                                uri: '#/dummy/param',
                                                relative: '#/dummy/param'
                                            })
                                        })
                                    ])
                                })
                            ])
                        })
                    })
                })
            }),
            references: new Immutable.OrderedMap({
                dummy: new ReferenceContainer({
                    name: 'dummy',
                    cache: new Immutable.OrderedMap({
                        '#/dummy/param': new ReferenceCache({
                            cached: new JSONSchemaReference({
                                uri: '#/dummy/param',
                                relative: '#/dummy/param',
                                resolved: true,
                                value: {
                                    type: 'integer',
                                    minimum: 10,
                                    maximum: 500
                                }
                            })
                        })
                    })
                })
            })
        })
        */
        let current = {
            context: api,
            items: [ items ]
        }

        return [ current ]
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

    _generateSimpleRequests(count) {
        let map = {}
        for (let i = count; i > 0; i -= 1) {
            let id = this._uuid()
            map[id] = this._generateSimpleRequest()
        }
        return new Immutable.OrderedMap(map)
    }

    _generateSimpleRequest() {
        let id = this._uuid()
        return new Request({
            method: 'GET',
            id: id,
            name: jsf({
                type: 'string',
                faker: 'company.bs'
            }),
            description: jsf({
                type: 'string',
                faker: 'company.bs'
            }),
            url: new URL('http://echo.luckymarmot.com/headers/' + id)
        })
    }

    _addEmptyGroupTest(api) {
        let emptyGroupId = this._uuid()
        let emptyGroup = new Group({
            id: emptyGroupId,
            name: 'Empty Group'
        })
        return api.setIn([ 'group', 'children', emptyGroupId ], emptyGroup)
    }

    _addUnnamedGroupTest(api) {
        let unnamedGroupId = this._uuid()
        let unnamedGroup = new Group({
            id: unnamedGroupId,
            children: this._generateSimpleRequests(5)
        })
        return api.setIn([ 'group', 'children', unnamedGroupId ], unnamedGroup)
    }

    _addSimpleGroupTest(api) {
        let simpleGroupId = this._uuid()
        let simpleGroup = new Group({
            id: simpleGroupId,
            name: 'Simple Group',
            children: this._generateSimpleRequests(3)
        })
        return api.setIn([ 'group', 'children', simpleGroupId ], simpleGroup)
    }

    _addNestedGroupTest(api) {
        let childGroupId_1 = this._uuid()
        let childGroupId_2 = this._uuid()
        let childGroupId_3 = this._uuid()
        let requests = this._generateSimpleRequests(3)

        let nestedGroupId = this._uuid()
        let nestedGroup = new Group({
            id: nestedGroupId,
            name: 'Nested Group',
            children: requests
                .set(childGroupId_1, new Group({
                    id: childGroupId_1,
                    name: 'Child Group 1',
                    children: this._generateSimpleRequests(4)
                }))
                .set(childGroupId_2, new Group({
                    id: childGroupId_2,
                    children: this._generateSimpleRequests(5)
                }))
                .set(childGroupId_3, new Group({
                    id: childGroupId_3,
                    name: 'Empty Child Group'
                }))
        })
        return api.setIn([ 'group', 'children', nestedGroupId ], nestedGroup)
    }

    _addMethodTest(api) {
        let groupId = this._uuid()

        let GetReq = new Request({
            method: 'GET',
            name: 'GET Request',
            url: new URL('http://echo.luckymarmot.com/get')
        })
        let CaseInsensitiveReq = new Request({
            method: 'gEt',
            name: 'Case Insensitive GET Request',
            url: new URL('http://echo.luckymarmot.com/get')
        })
        let PostReq = new Request({
            method: 'POST',
            name: 'POST Request',
            url: new URL('http://echo.luckymarmot.com/post')
        })
        let PutReq = new Request({
            method: 'PUT',
            name: 'PUT Request',
            url: new URL('http://echo.luckymarmot.com/put')
        })
        let DeleteReq = new Request({
            method: 'DELETE',
            name: 'DELETE Request',
            url: new URL('http://echo.luckymarmot.com/delete')
        })
        let InvalidReq = new Request({
            method: 'INVALID',
            name: 'INVALID Request',
            url: new URL('http://echo.luckymarmot.com/invalid')
        })

        let group = new Group({
            name: 'Method Test Group',
            children: new Immutable.OrderedMap({
                get: GetReq,
                post: PostReq,
                put: PutReq,
                delete: DeleteReq,
                gEt: CaseInsensitiveReq,
                invalid: InvalidReq
            })
        })

        return api.setIn([
            'group', 'children', groupId
        ], group)
    }

    _addURLTest(api) {
        let groupId = this._uuid()

        let noURLReq = new Request({
            method: 'get',
            name: 'No URL',
            description: 'There should not be any url set'
        })

        let simpleURLReq = new Request({
            method: 'GET',
            name: 'Simple URL',
            url: new URL('http://echo.luckymarmot.com/get'),
            description: 'The URL should be http://echo.luckymarmot.com/get'
        })

        let hashURLReq = new Request({
            method: 'GET',
            name: 'Simple URL with hash',
            url: new URL('http://echo.luckymarmot.com/get#/some/hash'),
            description: 'The URL should be ' +
                'http://echo.luckymarmot.com/get#/some/hash'
        })

        let queryURLReq = new Request({
            method: 'GET',
            name: 'URL with simple query params',
            url: new URL('http://echo.luckymarmot.com/get?foo=bar&far=boo'),
            description: 'The URL should be http://echo.luckymarmot.com/get\n' +
                'The query params should be ignored as they are not stored in' +
                ' the Parameter Container.'
        })

        let hashAndQueryURLReq = new Request({
            method: 'GET',
            name: 'URL with simple query params and hash',
            url: new URL('http://echo.luckymarmot.com/get?foo=bar&far=boo#has'),
            description: 'The URL should be ' +
                'http://echo.luckymarmot.com/get#has\n' +
                'The query params should be ignored as they are not stored in' +
                ' the Parameter Container.'

        })

        let mildURLReq = new Request({
            method: 'GET',
            name: 'URL from dictionary',
            url: new URL({
                protocol: 'https',
                host: 'echo.luckymarmot.com',
                pathname: '/test',
                hash: '#some-hash'
            }),
            description: 'The URL should be ' +
                'http://echo.luckymarmot.com/test#some-hash\n' +
                'This URL was generated based on a dictionary.'
        })

        let complexURLReq = new Request({
            method: 'GET',
            name: 'Complex URL with Parameter',
            url: new URL({
                protocol: 'https',
                host: 'echo.luckymarmot.com',
                pathname: new Parameter({
                    key: 'pathname',
                    name: 'pathname',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            '/test',
                            '/alt'
                        ])
                    ])
                }),
                hash: '#some-hash'
            }),
            description: 'The URL should be ' +
                'http://echo.luckymarmot.com/test#some-hash\n' +
                'or\n' +
                'http://echo.luckymarmot.com/alt#some-hash\n' +
                'This URL was generated based on a dictionary and a Parameter.'
        })

        let sequenceParamReq = new Request({
            method: 'GET',
            name: 'Complex URL with Sequence Parameter',
            url: new URL({
                protocol: 'https',
                host: 'echo.luckymarmot.com',
                pathname: new Parameter({
                    key: 'pathname',
                    name: 'pathname',
                    type: 'string',
                    format: 'sequence',
                    value: new Immutable.List([
                        new Parameter({
                            type: 'string',
                            value: '/user/',
                            internals: new Immutable.List([
                                new Constraint.Enum([ '/user/' ])
                            ])
                        }),
                        new Parameter({
                            key: 'userId',
                            name: 'userId',
                            type: 'integer',
                            internals: new Immutable.List([
                                new Constraint.Maximum(10000),
                                new Constraint.Minimum(0)
                            ])
                        })
                    ])
                }),
                hash: '#some-hash'
            }),
            description: 'The URL should be ' +
                'http://echo.luckymarmot.com/user/:num:#some-hash\n' +
                'This URL was generated based on a dictionary and a Sequence ' +
                'Parameter.'
        })

        let group = new Group({
            name: 'URL Test Group',
            children: new Immutable.OrderedMap({
                no: noURLReq,
                simple: simpleURLReq,
                hash: hashURLReq,
                simpleQuery: queryURLReq,
                hashAndQuery: hashAndQueryURLReq,
                mild: mildURLReq,
                complex: complexURLReq,
                seq: sequenceParamReq
            })
        })

        return api.setIn([
            'group', 'children', groupId
        ], group)
    }

    _addParameterTest(api) {
        let groupId = this._uuid()

        let headerGroupId = this._uuid()
        let queryGroupId = this._uuid()
        let pathGroupId = this._uuid()
        let bodyGroupId = this._uuid()

        let headerReqs = this._addHeaderRequests()
        let queryReqs = this._addQueryRequests()
        let pathReqs = this._addPathRequests()
        let bodyReqs = this._addBodyRequests()

        let group = new Group({
            id: groupId,
            name: 'Parameters Test',
            children: new Immutable.OrderedMap({
                header: new Group({
                    id: headerGroupId,
                    name: 'Header Parameters Test',
                    children: headerReqs
                }),
                query: new Group({
                    id: queryGroupId,
                    name: 'Query Parameters Test',
                    children: queryReqs
                }),
                path: new Group({
                    id: pathGroupId,
                    name: 'Path Parameters Test',
                    children: pathReqs
                }),
                body: new Group({
                    id: bodyGroupId,
                    name: 'Body Parameters Test',
                    children: bodyReqs
                })
            })
        })

        return api.setIn([
            'group', 'children', groupId
        ], group)
    }

    _addHeaderRequests() {
        let map = {}

        map.simpleHeader = new Request({
            name: 'Simple Header',
            method: 'GET',
            url: new URL('http://echo.luckymarmot.com/test'),
            description: 'Headers should be:\n' +
                'Content-Type: application/json',
            parameters: new ParameterContainer({
                headers: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        type: 'string',
                        value: 'application/json',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'application/json'
                            ])
                        ])
                    })
                ])
            })
        })

        map.noInternalsHeader = new Request({
            name: 'Simple Header with No Internals',
            method: 'GET',
            url: new URL('http://echo.luckymarmot.com/test'),
            description: 'Headers should be:\n' +
                'Content-Type: application/json',
            parameters: new ParameterContainer({
                headers: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        type: 'string',
                        value: 'application/json'
                    })
                ])
            })
        })

        map.noValueHeader = new Request({
            name: 'Simple Header with No Value',
            method: 'GET',
            url: new URL('http://echo.luckymarmot.com/test'),
            description: 'Headers should be:\n' +
                'Content-Type: application/json',
            parameters: new ParameterContainer({
                headers: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'application/json'
                            ])
                        ])
                    })
                ])
            })
        })

        map.multipleHeaders = new Request({
            name: 'Multiple Headers',
            method: 'GET',
            url: new URL('http://echo.luckymarmot.com/test'),
            description: 'Headers should be:\n' +
                'Content-Type: application/json\n' +
                'Accept-Encoding: utf-8',
            parameters: new ParameterContainer({
                headers: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        type: 'string',
                        value: 'application/json',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'application/json'
                            ])
                        ])
                    }),
                    new Parameter({
                        key: 'Accept-Encoding',
                        type: 'string',
                        value: 'utf-8',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'utf-8'
                            ])
                        ])
                    })
                ])
            })
        })

        map.overrideHeaders = new Request({
            name: 'Overriding Headers',
            method: 'GET',
            url: new URL('http://echo.luckymarmot.com/test'),
            description: 'Header should be:\n' +
                'Content-Type: application/xml\n' +
                'There were 2 headers with conflicting values.',
            parameters: new ParameterContainer({
                headers: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        type: 'string',
                        value: 'application/json',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'application/json'
                            ])
                        ])
                    }),
                    new Parameter({
                        key: 'Content-Type',
                        type: 'string',
                        value: 'application/xml',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'application/xml'
                            ])
                        ])
                    })
                ])
            })
        })

        map.jsfHeader = new Request({
            name: 'JSF Header',
            method: 'GET',
            url: new URL('http://echo.luckymarmot.com/test'),
            description: 'Header should be:\n' +
                'Content-Type: application/json\n' +
                'or\n' +
                'Content-Type: application/xml\n',
            parameters: new ParameterContainer({
                headers: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'application/json',
                                'application/xml'
                            ])
                        ])
                    })
                ])
            })
        })

        return new Immutable.OrderedMap(map)
    }

    _addQueryRequests() {
        let map = {}

        map.simpleQuery = new Request({
            name: 'Simple Query',
            method: 'GET',
            url: new URL('http://echo.luckymarmot.com/test'),
            description: 'Query should be:\n' +
                '?foo=bar',
            parameters: new ParameterContainer({
                queries: new Immutable.List([
                    new Parameter({
                        key: 'foo',
                        type: 'string',
                        value: 'bar',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'bar'
                            ])
                        ])
                    })
                ])
            })
        })

        map.noInternalsQuery = new Request({
            name: 'Simple Query with No Internals',
            method: 'GET',
            url: new URL('http://echo.luckymarmot.com/test'),
            description: 'Query should be:\n' +
                '?foo=bar',
            parameters: new ParameterContainer({
                queries: new Immutable.List([
                    new Parameter({
                        key: 'foo',
                        type: 'string',
                        value: 'bar'
                    })
                ])
            })
        })

        map.noValueQuery = new Request({
            name: 'Simple Query with No Value',
            method: 'GET',
            url: new URL('http://echo.luckymarmot.com/test'),
            description: 'Query should be:\n' +
                '?foo=bar',
            parameters: new ParameterContainer({
                queries: new Immutable.List([
                    new Parameter({
                        key: 'foo',
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'bar'
                            ])
                        ])
                    })
                ])
            })
        })

        map.multipleQueries = new Request({
            name: 'Multiple Queries',
            method: 'GET',
            url: new URL('http://echo.luckymarmot.com/test'),
            description: 'Query should be:\n' +
                '?foo=bar&far=boo',
            parameters: new ParameterContainer({
                queries: new Immutable.List([
                    new Parameter({
                        key: 'foo',
                        type: 'string',
                        value: 'bar',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'bar'
                            ])
                        ])
                    }),
                    new Parameter({
                        key: 'far',
                        type: 'string',
                        value: 'boo',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'boo'
                            ])
                        ])
                    })
                ])
            })
        })

        map.overrideQueries = new Request({
            name: 'Overriding Queries',
            method: 'GET',
            url: new URL('http://echo.luckymarmot.com/test'),
            description: 'Query should be:\n' +
                '?foo=bar&foo=baz',
            parameters: new ParameterContainer({
                queries: new Immutable.List([
                    new Parameter({
                        key: 'foo',
                        type: 'string',
                        value: 'bar',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'bar'
                            ])
                        ])
                    }),
                    new Parameter({
                        key: 'foo',
                        type: 'string',
                        value: 'baz',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'baz'
                            ])
                        ])
                    })
                ])
            })
        })

        map.jsfQuery = new Request({
            name: 'JSF Query',
            method: 'GET',
            url: new URL('http://echo.luckymarmot.com/test'),
            description: 'Query should be:\n' +
                '?foo=bar\n' +
                'or\n' +
                '?foo=baz\n',
            parameters: new ParameterContainer({
                queries: new Immutable.List([
                    new Parameter({
                        key: 'foo',
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'bar',
                                'baz'
                            ])
                        ])
                    })
                ])
            })
        })

        return new Immutable.OrderedMap(map)
    }

    _addPathRequests() {
        let map = {}

        map.simplePath = new Request({
            name: 'Path Parameter should be ignored',
            method: 'GET',
            url: new URL('http://echo.luckymarmot.com/test'),
            description: 'Path Parameter should be ignored',
            parameters: new ParameterContainer({
                path: new Immutable.List([
                    new Parameter({
                        key: 'userId',
                        type: 'string'
                    })
                ])
            })
        })

        return new Immutable.OrderedMap(map)
    }

    _addBodyRequests() {
        let SimpleBodyReqs = this._addSimpleBodyReqs()
        let JSONReqs = this._addJSONBodyReqs()
        let UrlEncodedReqs = this._addURLEncodedReqs()
        let MultipartReqs = this._addMultipartReqs()

        let map = {
            simple: new Group({
                name: 'Text Body Requests',
                children: SimpleBodyReqs
            }),
            json: new Group({
                name: 'JSON Body Requests',
                children: JSONReqs
            }),
            encoded: new Group({
                name: 'URLencoded Body Requests',
                children: UrlEncodedReqs
            }),
            multipart: new Group({
                name: 'Multipart Body Requests',
                children: MultipartReqs
            })
        }

        return new Immutable.OrderedMap(map)
    }

    _addSimpleBodyReqs() {
        let map = {}

        map.simpleBody = new Request({
            name: 'Simple Text Body',
            method: 'POST',
            description: 'This request should be considered as a text body.',
            url: new URL('http://echo.luckymarmot.com/body'),
            parameters: new ParameterContainer({
                body: new Immutable.List([
                    new Parameter({
                        name: 'sample body text',
                        type: 'string',
                        value: 'This is the content of the body',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'This is the content of the body'
                            ])
                        ])
                    })
                ])
            })
        })

        map.noInternalsBody = new Request({
            name: 'Simple Text Body with no internals',
            method: 'POST',
            description: 'This request should be considered as a text body.' +
                '\nSince there are no internals, it should be a jsf dv.',
            url: new URL('http://echo.luckymarmot.com/body'),
            parameters: new ParameterContainer({
                body: new Immutable.List([
                    new Parameter({
                        name: 'sample body text',
                        type: 'string',
                        value: 'This is the content of the body'
                    })
                ])
            })
        })

        map.noValueBody = new Request({
            name: 'Simple Text Body with no Value',
            method: 'POST',
            description: 'This request should be considered as a text body.' +
                '\nSince there is a single internal constraint, it should be ' +
                'a simple text.',
            url: new URL('http://echo.luckymarmot.com/body'),
            parameters: new ParameterContainer({
                body: new Immutable.List([
                    new Parameter({
                        name: 'sample body text',
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'This is the content of the body'
                            ])
                        ])
                    })
                ])
            })
        })

        map.simpleKeyedBody = new Request({
            name: 'Simple Keyed Text Body',
            method: 'POST',
            description: 'This request should be considered as a text body.' +
                '\nThere is a keyed parameter in the body. The key should be ' +
                'ignored',
            url: new URL('http://echo.luckymarmot.com/body'),
            parameters: new ParameterContainer({
                body: new Immutable.List([
                    new Parameter({
                        key: 'CriticalKey',
                        name: 'Critical Key',
                        type: 'string',
                        value: 'This is the content of the body',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'This is the content of the body'
                            ])
                        ])
                    })
                ])
            })
        })

        map.multipleBody = new Request({
            name: 'Multiple Text Body',
            method: 'POST',
            description: 'This request should be considered as a text body.' +
                '\nOnly the first body should be taken, which gives:\n' +
                'This is the content of the body',
            url: new URL('http://echo.luckymarmot.com/body'),
            parameters: new ParameterContainer({
                body: new Immutable.List([
                    new Parameter({
                        type: 'string',
                        value: 'This is the content of the body',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'This is the content of the body'
                            ])
                        ])
                    }),
                    new Parameter({
                        type: 'string',
                        value: 'This is another content of the body',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'This is another content of the body'
                            ])
                        ])
                    })
                ])
            })
        })

        map.jsfBody = new Request({
            name: 'Simple JSF DV Text Body',
            method: 'POST',
            url: new URL('http://echo.luckymarmot.com/body'),
            parameters: new ParameterContainer({
                body: new Immutable.List([
                    new Parameter({
                        name: 'sample body text',
                        type: 'string'
                    })
                ])
            })
        })

        return new Immutable.OrderedMap(map)
    }

    _addJSONBodyReqs() {
        let map = {}

        map.simpleTextJSON = new Request({
            name: 'Simple JSON Body',
            method: 'POST',
            url: new URL('http://echo.luckymarmot.com/body'),
            description: 'This request should be considered as JSON body.',
            parameters: new ParameterContainer({
                headers: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'application/json'
                            ])
                        ])
                    })
                ]),
                body: new Immutable.List([
                    new Parameter({
                        name: 'sample body text',
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                '{ "sampleJSON" : "asText" }'
                            ])
                        ])
                    })
                ])
            }),
            bodies: new Immutable.List([
                new Body({
                    constraints: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            type: 'string',
                            value: 'application/json'
                        })
                    ])
                })
            ])
        })

        map.simpleTextJSONWithNoBody = new Request({
            name: 'Simple JSON Body with No Body',
            method: 'POST',
            url: new URL('http://echo.luckymarmot.com/body'),
            description: 'This request should be considered as plain body ' +
                'despite the json header and content.',
            parameters: new ParameterContainer({
                headers: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'application/json'
                            ])
                        ])
                    })
                ]),
                body: new Immutable.List([
                    new Parameter({
                        name: 'sample body text',
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                '{ "sampleJSON" : "asText" }'
                            ])
                        ])
                    })
                ])
            })
        })

        /*
        map.simpleObjJSON = new Request({
            name: 'Simple Text Body',
            method: 'POST',
            url: new URL('http://echo.luckymarmot.com/body'),
            parameters: new ParameterContainer({
                headers: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'application/json'
                            ])
                        ])
                    })
                ]),
                body: new Immutable.List([
                    new Parameter({
                        name: 'sample body text',
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                { sampleJSON : 'asObject' }
                            ])
                        ])
                    })
                ])
            })
        })
        */

        return new Immutable.OrderedMap(map)
    }

    _addURLEncodedReqs() {
        let map = {}

        map.simpleEncoded = new Request({
            name: 'Simple URLencoded Body',
            method: 'POST',
            description: 'This request should be considered as a URLencoded ' +
                'body.',
            url: new URL('http://echo.luckymarmot.com/body'),
            parameters: new ParameterContainer({
                headers: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'application/x-www-form-urlencoded'
                            ])
                        ])
                    })
                ]),
                body: new Immutable.List([
                    new Parameter({
                        key: 'foo',
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'bar'
                            ])
                        ])
                    })
                ])
            }),
            bodies: new Immutable.List([
                new Body({
                    constraints: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            type: 'string',
                            value: 'application/x-www-form-urlencoded'
                        })
                    ])
                })
            ])
        })

        map.simpleEncodedWithNoBodies = new Request({
            name: 'Simple URLencoded Body with No Body',
            method: 'POST',
            description: 'This request should be considered as a plain body ' +
                'despite the URLencoded header and the content of the body.',
            url: new URL('http://echo.luckymarmot.com/body'),
            parameters: new ParameterContainer({
                headers: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'application/x-www-form-urlencoded'
                            ])
                        ])
                    })
                ]),
                body: new Immutable.List([
                    new Parameter({
                        key: 'foo',
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'bar'
                            ])
                        ])
                    })
                ])
            })
        })

        return new Immutable.OrderedMap(map)
    }

    _addMultipartReqs() {
        let map = {}

        map.simpleMultipart = new Request({
            name: 'Simple Multipart Body',
            method: 'POST',
            description: 'This request should be considered as a multipart ' +
                'body.',
            url: new URL('http://echo.luckymarmot.com/body'),
            parameters: new ParameterContainer({
                headers: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'multipart/form-data'
                            ])
                        ])
                    })
                ]),
                body: new Immutable.List([
                    new Parameter({
                        key: 'foo',
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'bar'
                            ])
                        ])
                    })
                ])
            }),
            bodies: new Immutable.List([
                new Body({
                    constraints: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            type: 'string',
                            value: 'multipart/form-data'
                        })
                    ])
                })
            ])
        })

        map.simpleMultipartWithNoBodies = new Request({
            name: 'Simple Multipart Body with No Body',
            method: 'POST',
            description: 'This request should be considered as a plain body ' +
                'despite the Multipart header and the content of the body.',
            url: new URL('http://echo.luckymarmot.com/body'),
            parameters: new ParameterContainer({
                headers: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'multipart/form-data'
                            ])
                        ])
                    })
                ]),
                body: new Immutable.List([
                    new Parameter({
                        key: 'foo',
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'bar'
                            ])
                        ])
                    })
                ])
            })
        })

        return new Immutable.OrderedMap(map)
    }

    _addBodiesTest(api) {
        let bodiesGroupId = this._uuid()

        let map = {}

        map.singleJSONBody = new Request({
            name: 'Single JSON Body',
            method: 'POST',
            description: 'This request should have the header:\n' +
                'Content-Type: application/json',
            bodies: new Immutable.List([
                new Body({
                    constraints: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            value: 'application/json'
                        })
                    ])
                })
            ])
        })

        map.singleURLencodedBody = new Request({
            name: 'Single URLencoded Body',
            method: 'POST',
            description: 'This request should have the header:\n' +
                'Content-Type: application/x-www-form-urlencoded',
            bodies: new Immutable.List([
                new Body({
                    constraints: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            value: 'application/x-www-form-urlencoded'
                        })
                    ])
                })
            ])
        })

        map.singleMultipartBody = new Request({
            name: 'Single Multipart Body',
            method: 'POST',
            description: 'This request should have the header:\n' +
                'Content-Type: multipart/form-data',
            bodies: new Immutable.List([
                new Body({
                    constraints: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            value: 'multipart/form-data'
                        })
                    ])
                })
            ])
        })

        map.singleOtherBody = new Request({
            name: 'Single Body',
            method: 'POST',
            description: 'This request should not have any header',
            bodies: new Immutable.List([
                new Body({
                    constraints: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            value: 'application/xml'
                        })
                    ])
                })
            ])
        })

        map.bodyOverridesHeaders = new Request({
            name: 'Multipart Body Overrides Content-Type Header',
            method: 'POST',
            description: 'This request should have the header:\n' +
                'Content-Type: multipart/form-data\n' +
                'Accept-Encoding: utf-8',
            parameters: new ParameterContainer({
                headers: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'application/xml'
                            ])
                        ])
                    }),
                    new Parameter({
                        key: 'Accept-Encoding',
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'utf-8'
                            ])
                        ])
                    })
                ])
            }),
            bodies: new Immutable.List([
                new Body({
                    constraints: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            value: 'multipart/form-data'
                        })
                    ])
                })
            ])
        })

        let bodiesGroup = new Group({
            id: bodiesGroupId,
            name: 'Bodies Group',
            children: new Immutable.OrderedMap(map)
        })

        return api.setIn([ 'group', 'children', bodiesGroupId ], bodiesGroup)
    }

    _addAuthTest(api) {
        let authGroupId = this._uuid()

        let map = {}

        map.basicAuth = new Request({
            name: 'Basic Auth',
            method: 'get',
            description: 'Request should have a Basic Auth, with user:pass',
            auths: new Immutable.List([
                new Auth.Basic({
                    username: 'user',
                    password: 'pass'
                })
            ])
        })

        map.digestAuth = new Request({
            name: 'Digest Auth',
            method: 'get',
            description: 'Request should have a Digest Auth, with user:pass',
            auths: new Immutable.List([
                new Auth.Digest({
                    username: 'user',
                    password: 'pass'
                })
            ])
        })

        map.OAuth1Auth = new Request({
            name: 'OAuth1 Auth',
            method: 'get',
            description: 'Request should have a OAuth1 Auth',
            auths: new Immutable.List([
                new Auth.OAuth1()
            ])
        })

        map.OAuth2Auth = new Request({
            name: 'OAuth2 Auth',
            method: 'get',
            description: 'Request should have a OAuth2 Auth',
            auths: new Immutable.List([
                new Auth.OAuth2()
            ])
        })

        let authGroup = new Group({
            id: authGroupId,
            name: 'Auths Group',
            children: new Immutable.OrderedMap(map)
        })

        return api.setIn([ 'group', 'children', authGroupId ], authGroup)
    }

    _addReferenceTest(api) {
        let references = this._addReferences()
        let requests = this._addReferenceReqs()

        let refGroupId = this._uuid()
        let refGroup = new Group({
            id: refGroupId,
            name: 'References Group',
            children: requests
        })

        return api.set('references', references)
            .setIn([ 'group', 'children', refGroupId ], refGroup)
    }

    _addReferences() {
        return new Immutable.OrderedMap({
            dummy: new ReferenceContainer({
                name: 'dummy',
                cache: new Immutable.OrderedMap({
                    '#/dummy/userId': new ReferenceCache({
                        cached: new JSONSchemaReference({
                            uri: '#/dummy/userId',
                            relative: '#/dummy/userId',
                            resolved: true,
                            value: {
                                type: 'integer',
                                minimum: 10,
                                maximum: 500
                            }
                        })
                    }),
                    '#/dummy/songId': new ReferenceCache({
                        cached: new JSONSchemaReference({
                            uri: '#/dummy/songId',
                            relative: '#/dummy/songId',
                            resolved: true,
                            value: {
                                type: 'integer',
                                minimum: 0,
                                maximum: 10000
                            }
                        })
                    }),
                    '#/dummy/complex': new ReferenceCache({
                        cached: new JSONSchemaReference({
                            uri: '#/dummy/complex',
                            relative: '#/dummy/complex',
                            resolved: true,
                            value: {
                                type: 'object',
                                properties: {
                                    userId: {
                                        $ref: '#/dummy/userId'
                                    },
                                    songId: {
                                        $ref: '#/dummy/songId'
                                    }
                                },
                                required: [ 'userId', 'songId' ]
                            }
                        })
                    }),
                    '#/x-postman/{{objId}}': new ReferenceCache({
                        cached: new LateResolutionReference({
                            uri: '#/x-postman/{{objId}}',
                            relative: '#/x-postman/{{objId}}',
                            resolved: true,
                            value: 22
                        })
                    }),
                    '#/x-postman/catch-{{objId}}': new ReferenceCache({
                        cached: new LateResolutionReference({
                            uri: '#/x-postman/catch-{{objId}}',
                            relative: '#/x-postman/catch-{{objId}}',
                            resolved: true
                        })
                    })
                })
            })
        })
    }

    _addReferenceReqs() {
        let map = {}

        map.simpleReq = new Request({
            name: 'Simple Reference Request',
            method: 'POST',
            url: new URL('http://echo.luckymarmot.com/references'),
            parameters: new ParameterContainer({
                body: new Immutable.List([
                    new Parameter({
                        name: 'Simple Reference',
                        type: 'reference',
                        value: new JSONSchemaReference({
                            uri: '#/dummy/userId',
                            relative: '#/dummy/userId'
                        })
                    })
                ])
            })
        })

        map.simpleDeepReq = new Request({
            name: 'Simple Deep Reference Request',
            method: 'POST',
            url: new URL('http://echo.luckymarmot.com/references'),
            parameters: new ParameterContainer({
                body: new Immutable.List([
                    new Parameter({
                        name: 'Simple Reference',
                        type: 'reference',
                        value: new JSONSchemaReference({
                            uri: '#/dummy/complex',
                            relative: '#/dummy/complex'
                        })
                    })
                ])
            })
        })

        map.simplePostmanReq = new Request({
            name: 'Simple Postman Type Reference Request',
            method: 'POST',
            url: new URL('http://echo.luckymarmot.com/references'),
            parameters: new ParameterContainer({
                body: new Immutable.List([
                    new Parameter({
                        name: 'Simple Reference',
                        type: 'reference',
                        value: new LateResolutionReference({
                            uri: '#/x-postman/{{objId}}',
                            relative: '#/x-postman/{{objId}}'
                        })
                    })
                ])
            })
        })

        map.simpleDeepPostmanReq = new Request({
            name: 'Simple Deep Postman Type Reference Request',
            method: 'POST',
            url: new URL('http://echo.luckymarmot.com/references'),
            parameters: new ParameterContainer({
                body: new Immutable.List([
                    new Parameter({
                        name: 'Simple Reference',
                        type: 'reference',
                        value: new LateResolutionReference({
                            uri: '#/x-postman/catch-{{objId}}',
                            relative: '#/x-postman/catch-{{objId}}'
                        })
                    })
                ])
            })
        })

        return new Immutable.OrderedMap(map)
    }

    import(context, items, options) {
        this.context = context

        let result = this.createRequestContexts(
            context,
            items,
            options
        )

        this._importPawRequests(
            result[0].context,
            items[0],
            options
        )

        if (options && options.order) {
            options.order += 1
        }

        return true
    }
}
