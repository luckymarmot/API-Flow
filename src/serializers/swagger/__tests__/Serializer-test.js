import {
    UnitTest,
    registerTest,
    targets,
    against
} from '../../../utils/TestUtils'
import Immutable from 'immutable'

import SwaggerSerializer from '../Serializer'

import ContextResolver from '../../../resolvers/ContextResolver'
import NodeEnvironment from '../../../models/environments/NodeEnvironment'

import Context, {
    Body,
    Response,
    Parameter,
    ParameterContainer
} from '../../../models/Core'

import {
    Info, Contact, License
} from '../../../models/Utils'


import Constraint from '../../../models/Constraint'
import Auth, { OAuth2Scope } from '../../../models/Auth'
import URL from '../../../models/URL'
import Request from '../../../models/Request'

import ReferenceContainer from '../../../models/references/Container'
import ReferenceCache from '../../../models/references/Cache'
import JSONSchemaReference from '../../../models/references/JSONSchema'
import ExoticReference from '../../../models/references/Exotic'

import {
    ClassMock
} from '../../../mocks/PawMocks'

import SwaggerParser from '../../../parsers/swagger/Parser'
import fs from 'fs'

@registerTest
@against(SwaggerSerializer)
export class TestSwaggerSerializer extends UnitTest {

    @targets('serialize')
    testSerializeCallsCoreFormatters() {
        const parser = this.__init()

        parser.spyOn('_formatInfo', function() {
            return 'info block'
        })

        parser.spyOn('_formatHost', function() {
            return [ 'host block', [ 'scheme block' ] ]
        })

        parser.spyOn('_formatPaths', function() {
            return [ 'paths block', 'securityDefs block' ]
        })

        const context = new Context()
        const expected = JSON.stringify({
            swagger: '2.0',
            info: 'info block',
            host: 'host block',
            paths: 'paths block',
            schemes: [ 'scheme block' ],
            securityDefinitions: 'securityDefs block'
        }, null, '  ')

        const result = parser.serialize(context)

        this.assertEqual(expected, result)
    }

    @targets('_formatInfo')
    testFormatInfoWithEmptyInfo() {
        const parser = this.__init()
        const context = new Context()
        const expected = {
            title: 'API-Flow Swagger Conversion',
            version: '0.0.0'
        }

        const result = parser._formatInfo(context)

        this.assertEqual(expected, result)
    }

    @targets('_formatInfo')
    testFormatInfoWithBasicInfo() {
        const parser = this.__init()
        const context = new Context({
            info: new Info({
                title: 'test title',
                description: 'simple description',
                tos: 'simple terms of service',
                version: 'v1.42'
            })
        })
        const expected = {
            title: 'test title',
            description: 'simple description',
            termsOfService: 'simple terms of service',
            version: 'v1.42'
        }

        const result = parser._formatInfo(context)

        this.assertEqual(expected, result)
    }

    @targets('_formatInfo')
    testFormatInfoWithLicenseAndContactInfo() {
        const parser = this.__init()
        const context = new Context({
            info: new Info({
                title: 'test title',
                description: 'simple description',
                tos: 'simple terms of service',
                version: 'v1.42',
                contact: new Contact({
                    name: 'John Smith',
                    email: 'j.smith@test.com',
                    url: 'test.com/contact'
                }),
                license: new License({
                    name: 'BSD',
                    url: 'test.com/license'
                })
            })
        })
        const expected = {
            title: 'test title',
            description: 'simple description',
            termsOfService: 'simple terms of service',
            version: 'v1.42',
            contact: {
                name: 'John Smith',
                email: 'j.smith@test.com',
                url: 'test.com/contact'
            },
            license: {
                name: 'BSD',
                url: 'test.com/license'
            }
        }

        const result = parser._formatInfo(context)

        this.assertEqual(expected, result)
    }

    @targets('_formatHost')
    testFormatHostNoContent() {
        const parser = this.__init()
        const requests = null

        const expected = [
            'localhost',
            []
        ]

        const result = parser._formatHost(requests)

        this.assertEqual(expected, result)
    }

    @targets('_formatHost')
    testFormatHost() {
        const parser = this.__init()
        const requests = new Immutable.List([
            new Request({
                url: new URL({
                    protocol: new Parameter({
                        key: 'protocol',
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'http', 'https', 'weird-scheme'
                            ])
                        ])
                    }),
                    host: new Parameter({
                        key: 'host',
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'test.com'
                            ])
                        ])
                    }),
                    pathname: new Parameter({
                        key: 'pathname',
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                '/path/to/req'
                            ])
                        ])
                    })
                }),
                method: 'GET'
            })
        ])

        const expected = [
            'test.com',
            [ 'http', 'https' ]
        ]

        const result = parser._formatHost(requests)

        this.assertEqual(expected, result)
    }

    @targets('_formatPaths')
    testFormatPathsWithSimpleRequest() {
        const parser = this.__init()
        const context = new Context()
        const requests = new Immutable.List([
            new Request({
                url: new URL({
                    protocol: new Parameter({
                        key: 'protocol',
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'http', 'https', 'weird-scheme'
                            ])
                        ])
                    }),
                    host: new Parameter({
                        key: 'host',
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'test.com'
                            ])
                        ])
                    }),
                    pathname: new Parameter({
                        key: 'pathname',
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                '/path/to/req'
                            ])
                        ])
                    })
                }),
                method: 'GET'
            })
        ])
        const schemes = [ 'http' ]

        parser.spyOn('_formatRequest', () => {
            return [ null, '/path/to/req', { GET: 'test request' } ]
        })

        const expected = [
            {
                '/path/to/req': {
                    GET: 'test request'
                }
            },
            {}
        ]

        const result = parser._formatPaths(context, requests, schemes)

        this.assertEqual(expected, result)
    }

    @targets('_formatPaths')
    testFormatPathsWithMultipleRequests() {
        const parser = this.__init()
        const context = new Context()
        const requests = new Immutable.List([
            new Request({
                url: new URL({
                    protocol: new Parameter({
                        key: 'protocol',
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'http', 'https', 'weird-scheme'
                            ])
                        ])
                    }),
                    host: new Parameter({
                        key: 'host',
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'securityDefs#1'
                            ])
                        ])
                    }),
                    pathname: new Parameter({
                        key: 'pathname',
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                '/path/to/req'
                            ])
                        ])
                    })
                }),
                method: 'GET'
            }),
            new Request({
                url: new URL({
                    protocol: new Parameter({
                        key: 'protocol',
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'http', 'https', 'weird-scheme'
                            ])
                        ])
                    }),
                    host: new Parameter({
                        key: 'host',
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'securityDefs#2'
                            ])
                        ])
                    }),
                    pathname: new Parameter({
                        key: 'pathname',
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                '/path/to/req'
                            ])
                        ])
                    })
                }),
                method: 'POST'
            }),
            new Request({
                url: new URL({
                    protocol: new Parameter({
                        key: 'protocol',
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'http', 'https', 'weird-scheme'
                            ])
                        ])
                    }),
                    host: new Parameter({
                        key: 'host',
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'securityDefs#2'
                            ])
                        ])
                    }),
                    pathname: new Parameter({
                        key: 'pathname',
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                '/path/to/other/req'
                            ])
                        ])
                    })
                }),
                method: 'POST'
            })
        ])
        const schemes = [ 'http' ]

        let count = 0

        parser.spyOn('_formatRequest', (_context, req) => {
            let content = {}
            content[req.get('method')] = 'test request'
            let securityDefs = {}
            let def = req.getIn([ 'url', 'host' ]).generate(true)
            securityDefs[def] = {
                desc: 'test definition',
                scopes: {}
            }

            securityDefs[def].scopes[count] = ''
            count += 1

            return [
                securityDefs,
                req.getIn([ 'url', 'pathname' ]).generate(),
                content
            ]
        })

        const expected = [
            {
                '/path/to/req': {
                    GET: 'test request',
                    POST: 'test request'
                },
                '/path/to/other/req': {
                    POST: 'test request'
                }
            },
            {
                'securityDefs#1': {
                    desc: 'test definition',
                    scopes: {
                        0: ''
                    }
                },
                'securityDefs#2': {
                    desc: 'test definition',
                    scopes: {
                        1: '',
                        2: ''
                    }
                }
            }
        ]

        const result = parser._formatPaths(context, requests, schemes)

        this.assertEqual(expected, result)
    }

    @targets('_formatRequest')
    testFormatRequestWithSimpleRequest() {
        const parser = this.__init()
        const context = new Context()
        const request = new Request({
            url: new URL({
                protocol: new Parameter({
                    key: 'protocol',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            'http', 'https'
                        ])
                    ])
                }),
                host: new Parameter({
                    key: 'host',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            'test.com'
                        ])
                    ])
                }),
                pathname: new Parameter({
                    key: 'pathname',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            '/path/to/req'
                        ])
                    ])
                })
            }),
            method: 'GET'
        })
        const schemes = [ 'http' ]

        parser.spyOn('_formatContent', () => {
            return [ null, 'test content' ]
        })

        const expected = [
            null, '/path/to/req', { get: 'test content' }
        ]

        const result = parser._formatRequest(context, request, schemes)

        this.assertEqual(expected, result)
    }

    @targets('_formatRequest')
    testFormatRequestWithSequenceParameter() {
        const parser = this.__init()
        const context = new Context()
        const request = new Request({
            url: new URL({
                protocol: new Parameter({
                    key: 'protocol',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            'http', 'https'
                        ])
                    ])
                }),
                host: new Parameter({
                    key: 'host',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            'test.com'
                        ])
                    ])
                }),
                pathname: new Parameter({
                    key: 'pathname',
                    type: 'string',
                    format: 'sequence',
                    value: new Immutable.List([
                        new Parameter({
                            key: 'version',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'v1.2', 'v2.0'
                                ])
                            ])
                        }),
                        new Parameter({
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    '/path/to/req'
                                ])
                            ])
                        })
                    ])
                })
            }),
            method: 'GET'
        })
        const schemes = [ 'http' ]

        parser.spyOn('_formatContent', () => {
            return [ null, 'test content' ]
        })

        const expected = [
            null, '{version}/path/to/req', { get: 'test content' }
        ]

        const result = parser._formatRequest(context, request, schemes)

        this.assertEqual(expected, result)
    }

    @targets('_formatSequenceParam')
    testFormatSequenceParamWithSimpleParam() {
        const parser = this.__init()

        const simple = new Parameter({
            key: 'host',
            type: 'string',
            internals: new Immutable.List([
                new Constraint.Enum([
                    'test.com'
                ])
            ])
        })

        const expected = 'test.com'
        const result = parser._formatSequenceParam(simple)

        this.assertEqual(expected, result)
    }

    @targets('_formatSequenceParam')
    testFormatSequenceParamWithSequenceParam() {
        const parser = this.__init()

        const seq = new Parameter({
            key: 'pathname',
            type: 'string',
            format: 'sequence',
            value: new Immutable.List([
                new Parameter({
                    key: 'version',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            'v1.2', 'v2.0'
                        ])
                    ])
                }),
                new Parameter({
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            '/path/to/req'
                        ])
                    ])
                })
            ])
        })

        const expected = '{version}/path/to/req'
        const result = parser._formatSequenceParam(seq)

        this.assertEqual(expected, result)
    }

    @targets('_formatContent')
    testFormatContentWithSimpleContent() {
        const parser = this.__init()
        const context = new Context()
        const request = new Request({
            description: 'simple request description',
            tags: new Immutable.List([ 'first', 'second' ]),
            id: 'ae256',
            url: new URL({
                protocol: new Parameter({
                    key: 'protocol',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            'https', 'ws'
                        ])
                    ])
                }),
                host: new Parameter({
                    key: 'host',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            'test.com'
                        ])
                    ])
                }),
                pathname: new Parameter({
                    key: 'pathname',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            '/path/to/req'
                        ])
                    ])
                })
            })
        })
        const schemes = [ 'http' ]

        parser.spyOn('_formatConsumes', () => {
            return []
        })

        parser.spyOn('_formatProduces', () => {
            return []
        })

        parser.spyOn('_formatParameters', () => {
            return []
        })

        parser.spyOn('_formatSecurity', () => {
            return [ null, null ]
        })

        const expected = [
            null,
            {
                'x-host': 'test.com',
                description: 'simple request description',
                tags: [ 'first', 'second' ],
                operationId: 'ae256',
                schemes: [ 'https', 'ws' ],
                responses: {
                    default: {
                        description: 'stub description for swagger compliance'
                    }
                },
                parameters: [],
                security: null
            }
        ]

        const result = parser._formatContent(context, request, schemes)

        this.assertEqual(expected, result)
    }

    @targets('_formatContent')
    testFormatContentWithRichContent() {
        const parser = this.__init()
        const context = new Context()
        const request = new Request({
            description: 'simple request description',
            tags: new Immutable.List([ 'first', 'second' ]),
            id: 'ae256',
            url: new URL({
                protocol: new Parameter({
                    key: 'protocol',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            'https', 'ws'
                        ])
                    ])
                }),
                host: new Parameter({
                    key: 'host',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            'test.com'
                        ])
                    ])
                }),
                pathname: new Parameter({
                    key: 'pathname',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            '/path/to/req'
                        ])
                    ])
                })
            })
        })
        const schemes = [ 'http' ]

        parser.spyOn('_formatConsumes', () => {
            return [ 'application/json', 'application/xml' ]
        })

        parser.spyOn('_formatProduces', () => {
            return [ 'application/json' ]
        })

        parser.spyOn('_formatParameters', () => {
            return [ 'params' ]
        })

        parser.spyOn('_formatSecurity', () => {
            return [ 'security definitions', 'security scheme' ]
        })

        const expected = [
            'security definitions',
            {
                'x-host': 'test.com',
                description: 'simple request description',
                tags: [ 'first', 'second' ],
                operationId: 'ae256',
                schemes: [ 'https', 'ws' ],
                produces: [ 'application/json' ],
                consumes: [ 'application/json', 'application/xml' ],
                parameters: [ 'params' ],
                responses: {
                    default: {
                        description: 'stub description for swagger compliance'
                    }
                },
                security: 'security scheme'
            }
        ]

        const result = parser._formatContent(context, request, schemes)

        this.assertEqual(expected, result)
    }

    @targets('_getContentTypeDomain')
    testGetContentTypeDomainWithNoExternals() {
        const parser = this.__init()
        const param = new Parameter()

        const expected = []

        const result = parser._getContentTypeDomain(param)

        this.assertEqual(expected, result)
    }

    @targets('_getContentTypeDomain')
    testGetContentTypeDomainWithNoContentTypeExternals() {
        const parser = this.__init()
        const param = new Parameter({
            externals: new Immutable.List([
                new Parameter({
                    key: 'Content-MD5',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            '1129f82efe47'
                        ])
                    ])
                })
            ])
        })

        const expected = []

        const result = parser._getContentTypeDomain(param)

        this.assertEqual(expected, result)
    }

    @targets('_getContentTypeDomain')
    testGetContentTypeDomainWithSingleValueContentTypeExternal() {
        const parser = this.__init()
        const param = new Parameter({
            externals: new Immutable.List([
                new Parameter({
                    key: 'Content-MD5',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            '1129f82efe47'
                        ])
                    ])
                }),
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

        const expected = [ 'application/json' ]

        const result = parser._getContentTypeDomain(param)

        this.assertEqual(expected, result)
    }

    @targets('_getContentTypeDomain')
    testGetContentTypeDomainWithMultipleValuesContentTypeExternal() {
        const parser = this.__init()
        const param = new Parameter({
            externals: new Immutable.List([
                new Parameter({
                    key: 'Content-MD5',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            '1129f82efe47'
                        ])
                    ])
                }),
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

        const expected = [ 'application/json', 'application/xml' ]

        const result = parser._getContentTypeDomain(param)

        this.assertEqual(expected, result)
    }

    @targets('_formatConsumes')
    testFormatConsumesWithSimpleContent() {
        const parser = this.__init()
        const context = new Context()
        const request = new Request()

        const expected = []

        const result = parser._formatConsumes(context, request)

        this.assertEqual(expected, result)
    }

    @targets('_formatConsumes')
    testFormatConsumesWithRichContent() {
        const parser = this.__init()
        const context = new Context()
        const request = new Request({
            bodies: new Immutable.List([
                new Body({
                    constraints: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            value: 'application/json'
                        }),
                        new Parameter({
                            key: 'Content-MD5',
                            value: 'ae256'
                        })
                    ])
                }),
                new Body({
                    constraints: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            value: 'application/xml'
                        }),
                        new Parameter({
                            key: 'Content-MD5',
                            value: 'ae512'
                        })
                    ])
                })
            ])
        })

        const expected = [ 'application/json', 'application/xml' ]

        const result = parser._formatConsumes(context, request)

        this.assertEqual(expected, result)
    }

    @targets('_formatProduces')
    testFormatProducesWithSimpleContent() {
        const parser = this.__init()
        const context = new Context()
        const request = new Request()

        const expected = []

        const result = parser._formatProduces(context, request)

        this.assertEqual(expected, result)
    }

    @targets('_formatProduces')
    testFormatProducesWithRichContent() {
        const parser = this.__init()
        const context = new Context()
        const request = new Request({
            responses: new Immutable.List([
                new Response(),
                new Response(),
                new Response()
            ])
        })

        parser.spyOn('_formatConsumes', () => {
            return [ 'application/json', 'application/xml' ]
        })

        const expected = [ 'application/json', 'application/xml' ]

        const result = parser._formatProduces(context, request)

        this.assertEqual(expected, result)
        this.assertEqual(parser.spy._formatConsumes.count, 3)
    }

    @targets('_formatParameters')
    testFormatParametersWithSimpleContent() {
        const parser = this.__init()
        const context = new Context()
        const request = new Request()

        const expected = []

        const result = parser._formatParameters(context, request, [])

        this.assertEqual(expected, result)
    }

    @targets('_formatParameters')
    testFormatParametersWithRichContent() {
        const parser = this.__init()
        const context = new Context()
        const request = new Request({
            parameters: new ParameterContainer({
                headers: new Immutable.List([
                    new Parameter(),
                    new Parameter(),
                    new Parameter()
                ]),
                queries: new Immutable.List([
                    new Parameter(),
                    new Parameter()
                ]),
                body: new Immutable.List([
                    new Parameter()
                ]),
                path: new Immutable.List([
                    new Parameter(),
                    new Parameter()
                ])
            })
        })

        let count = 0
        parser.spyOn('_formatParam', () => {
            count += 1
            return { c: count }
        })

        // Params with same name and location are discarded
        const expected = [
            { c: 1 },
            {
                in: 'body',
                schema: {}
            }
        ]

        const result = parser._formatParameters(context, request, [])

        this.assertJSONEqual(expected, result)
        this.assertEqual(parser.spy._formatParam.count, 7)
    }

    @targets('_formatParam')
    testFormatParamWithSimpleContent() {
        const parser = this.__init()
        const source = 'query'
        const param = new Parameter()

        const expected = {
            in: 'query',
            name: null,
            type: 'string',
            required: false
        }

        const result = parser._formatParam(source, param)

        this.assertEqual(expected, result)
    }

    @targets('_formatParam')
    testFormatParamWithRichContent() {
        const parser = this.__init()
        const source = 'header'
        const param = new Parameter({
            key: 'Content-Type',
            value: 'default value',
            type: 'string',
            format: 'lowercase',
            name: 'Content Type',
            description: 'the mime type of the request',
            example: [ 'application/json' ],
            internals: new Immutable.List([
                new Constraint.MinimumLength(10),
                new Constraint.MaximumLength(50)
            ]),
            externals: new Immutable.List([
                new Parameter({
                    key: 'Content-MD5',
                    internals: new Immutable.List([
                        new Constraint.Enum([ 'ae256', 'ae512' ])
                    ])
                })
            ])
        })

        const expected = {
            name: 'Content-Type',
            required: false,
            in: 'header',
            default: 'default value',
            type: 'string',
            minimumLength: 10,
            maximumLength: 50,
            'x-title': 'Content-Type',
            /* Optional:
            'x-use-with': [
                {
                    name: 'Content-MD5',
                    type: null,
                    enum: [ 'ae256', 'ae512' ],
                    'x-title': 'Content-MD5'
                }
            ],
            */
            description: 'the mime type of the request',
            'x-example': [ 'application/json' ],
            'x-format': 'lowercase'
        }

        const result = parser._formatParam(source, param)

        this.assertEqual(
            JSON.stringify(expected, null, '  '),
            JSON.stringify(result, null, '  ')
        )
    }

    @targets('_formatParam')
    testFormatParamWithRichTypes() {
        const parser = this.__init()
        const source = 'header'
        const param = new Parameter({
            key: 'Content-Type',
            value: new Parameter({
                key: 'access-type',
                type: 'integer',
                internals: new Immutable.List([
                    new Constraint.Enum([ 1, 2, 3, 4 ])
                ])
            }),
            type: 'array',
            format: 'lowercase',
            name: 'Content Type',
            description: 'the mime type of the request',
            example: [ 'application/json' ],
            internals: new Immutable.List([
                new Constraint.MinimumItems(2),
                new Constraint.MaximumItems(4)
            ]),
            externals: new Immutable.List([
                new Parameter({
                    key: 'Content-MD5',
                    internals: new Immutable.List([
                        new Constraint.Enum([ 'ae256', 'ae512' ])
                    ])
                })
            ])
        })

        const expected = {
            name: 'Content-Type',
            required: false,
            in: 'header',
            type: 'array',
            minimumItems: 2,
            maximumItems: 4,
            items: {
                type: 'integer',
                enum: [ 1, 2, 3, 4 ],
                'x-title': 'access-type'
            },
            'x-title': 'Content-Type',
            /* Optional:
            'x-use-with': [
                {
                    name: 'Content-MD5',
                    type: null,
                    enum: [ 'ae256', 'ae512' ],
                    'x-title': 'Content-MD5'
                }
            ],
            */
            description: 'the mime type of the request',
            'x-example': [ 'application/json' ],
            'x-format': 'lowercase'
        }

        const result = parser._formatParam(source, param)

        this.assertEqual(
            JSON.stringify(expected, null, '  '),
            JSON.stringify(result, null, '  ')
        )
    }

    @targets('_formatSecurity')
    testFormatSecurityWithSimpleContent() {
        const parser = this.__init()
        const context = new Context()
        const request = new Request()

        const expected = [ {}, [] ]

        const result = parser._formatSecurity(context, request)

        this.assertEqual(expected, result)
    }

    @targets('_formatSecurity')
    testFormatSecurityCallsAllAuths() {
        const parser = this.__init()
        const context = new Context()
        const request = new Request({
            auths: new Immutable.List([
                null,
                new Auth.Basic(),
                new Auth.ApiKey(),
                new Auth.OAuth2()
            ])
        })

        parser.spyOn('_formatBasicAuth', () => {
            return [ { basic_auth: 12 }, 1 ]
        })

        parser.spyOn('_formatApiKeyAuth', () => {
            return [ { api_key: 42 }, 2 ]
        })

        parser.spyOn('_formatOAuth2Auth', () => {
            return [ { oauth_2: 90 }, 3 ]
        })

        const expected = [
            {
                basic_auth: 12,
                api_key: 42,
                oauth_2: 90
            },
            [ null, 1, 2, 3 ]
        ]

        const result = parser._formatSecurity(context, request)

        this.assertEqual(
            JSON.stringify(expected, null, '  '),
            JSON.stringify(result, null, '  ')
        )
    }

    @targets('_formatBasicAuth')
    testFormatBasicAuth() {
        const parser = this.__init()
        const context = new Context()
        const auth = new Auth.Basic({
            username: 'admin',
            password: 'paw'
        })

        const expected = [
            {
                basic_auth: {
                    type: 'basic',
                    'x-username': 'admin',
                    'x-password': 'paw'
                }
            },
            {
                basic_auth: []
            }
        ]

        const result = parser._formatBasicAuth(context, auth)

        this.assertEqual(expected, result)
    }

    @targets('_formatApiKeyAuth')
    testFormatApiKeyAuth() {
        const parser = this.__init()
        const context = new Context()
        const auth = new Auth.ApiKey({
            name: 'api-key',
            in: 'query'
        })

        const expected = [
            {
                api_key_auth: {
                    type: 'apiKey',
                    name: 'api-key',
                    in: 'query'
                }
            },
            {
                api_key_auth: []
            }
        ]

        const result = parser._formatApiKeyAuth(context, auth)

        this.assertEqual(expected, result)
    }

    @targets('_formatOAuth2Auth')
    testFormatOAuth2Auth() {
        const parser = this.__init()
        const context = new Context()
        const auth = new Auth.OAuth2({
            authorizationUrl: 'test.com/auth',
            tokenUrl: 'test.com/token',
            flow: 'implicit',
            scopes: new Immutable.List([
                new OAuth2Scope({
                    value: 'write:self'
                }),
                new OAuth2Scope({
                    value: 'read:any'
                })
            ])
        })

        const expected = [
            {
                oauth_2_auth: {
                    type: 'oauth2',
                    authorizationUrl: 'test.com/auth',
                    tokenUrl: 'test.com/token',
                    flow: 'implicit',
                    scopes: {
                        'write:self': '',
                        'read:any': ''
                    }
                }
            },
            {
                oauth_2_auth: [ 'write:self', 'read:any' ]
            }
        ]

        const result = parser._formatOAuth2Auth(context, auth)

        this.assertEqual(
            JSON.stringify(expected, null, '  '),
            JSON.stringify(result, null, '  ')
        )
    }

    @targets('_formatResponses')
    testFormatResponses() {
        const parser = this.__init()
        const context = new Context()
        const request = new Request({
            responses: new Immutable.List([
                new Response(),
                new Response(),
                new Response()
            ])
        })

        let count = 0
        let obj = {
            0: 42,
            1: 12,
            2: 90
        }
        parser.spyOn('_formatResponse', () => {
            let _obj = {}
            _obj[count] = obj[count]
            count += 1
            return _obj
        })

        const result = parser._formatResponses(context, request)

        this.assertEqual(parser.spy._formatResponse.count, 3)
        this.assertEqual(obj, result)
    }

    @targets('_formatResponse')
    testFormatResponsesOnlyCode() {
        const parser = this.__init()
        const context = new Context()
        const response = new Response({
            code: 200
        })

        const expected = {
            200: {
                description: 'stub description'
            }
        }
        const result = parser._formatResponse(context, response)

        this.assertEqual(expected, result)
    }

    @targets('_formatResponse')
    testFormatResponsesCodeAndDescription() {
        const parser = this.__init()
        const context = new Context()
        const response = new Response({
            code: 200,
            description: 'dummy description'
        })

        const expected = {
            200: {
                description: 'dummy description'
            }
        }
        const result = parser._formatResponse(context, response)

        this.assertEqual(expected, result)
    }

    @targets('_formatResponse')
    testFormatResponsesWithHeaders() {
        const parser = this.__init()
        const context = new Context()
        const response = new Response({
            code: 200,
            description: 'dummy description',
            parameters: new ParameterContainer({
                headers: new Immutable.List([
                    new Parameter({
                        key: 'Content-Type',
                        value: 'application/json',
                        type: 'string',
                        externals: new Immutable.List([
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
                    }),
                    new Parameter({
                        key: 'Set-Cookie',
                        type: 'string',
                        value: 'UserID=JohnDoe; Max-Age=3600; Version=1',
                        externals: new Immutable.List([
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
                ])
            })
        })

        const expected = {
            200: {
                description: 'dummy description',
                headers: {
                    'Content-Type': {
                        default: 'application/json',
                        type: 'string',
                        'x-title': 'Content-Type'
                        /* Optional:
                        'x-use-with': [
                            {
                                name: 'Content-Type',
                                type: 'string',
                                enum: [ 'application/json' ],
                                'x-title': 'Content-Type'
                            }
                        ]
                        */
                    },
                    'Set-Cookie': {
                        default: 'UserID=JohnDoe; Max-Age=3600; Version=1',
                        type: 'string',
                        'x-title': 'Set-Cookie'
                        /* Optional:
                        'x-use-with': [
                            {
                                name: 'Content-Type',
                                type: 'string',
                                enum: [ 'application/json' ],
                                'x-title': 'Content-Type'
                            }
                        ]
                        */
                    }
                }
            }
        }
        const result = parser._formatResponse(context, response)

        this.assertJSONEqual(expected, result)
    }

    @targets('_unescapeURIFragment')
    testUnescapeURIFragment() {
        const parser = this.__init()
        const fragments = [
            '#/definitions/User',
            '#/definitions/User~01',
            '#/definitions/User~10',
            '#/definitions/User~0~1',
            '#/definitions/User~1~0'
        ]

        const expected = [
            '#/definitions/User',
            '#/definitions/User~1',
            '#/definitions/User/0',
            '#/definitions/User~/',
            '#/definitions/User/~'
        ]

        for (let i = 0; i < fragments.length; i += 1) {
            let result = parser._unescapeURIFragment(fragments[i])
            this.assertEqual(expected[i], result)
        }
    }

    @targets('_formatDefinitions')
    testFormatDefinitions() {
        const parser = this.__init()

        const container = new ReferenceContainer({
            cache: new Immutable.OrderedMap({
                '#/definitions/User': new ReferenceCache({
                    cached: new JSONSchemaReference({
                        value: {
                            type: 'string',
                            name: 'Content-Type',
                            enum: [ 'application/json', 'application/xml' ]
                        },
                        resolved: true
                    })
                }),
                '#/definitions/API': new ReferenceCache({
                    cached: new JSONSchemaReference({
                        value: {
                            type: 'string'
                        },
                        resolved: true
                    })
                }),
                '#/some/other/ProductReference': new ReferenceCache({
                    cached: new JSONSchemaReference({
                        value: {
                            type: 'integer',
                            minimum: 0,
                            maximum: 100
                        },
                        resolved: true
                    })
                })
            })
        })

        const context = new Context({
            references: new Immutable.OrderedMap({
                schemas: container
            })
        })

        const expected = {
            definitions: {
                User: {
                    type: 'string',
                    name: 'Content-Type',
                    enum: [ 'application/json', 'application/xml' ]
                },
                API: {
                    type: 'string'
                }
            },
            some: {
                other: {
                    ProductReference: {
                        type: 'integer',
                        minimum: 0,
                        maximum: 100
                    }
                }
            }
        }

        const result = parser._formatDefinitions(context)

        this.assertJSONEqual(expected, result)
    }

    _testFull(done) {
        const parser = new SwaggerParser()
        const content = fs
            .readFileSync(__dirname + '/collections/uber.json')
            .toString()

        const context = parser.parse({
            file: {
                name: 'uber.json',
                path: __dirname + '/collections/'
            },
            content: content
        })

        const environment = new NodeEnvironment()
        const resolver = new ContextResolver(environment)
        resolver.resolveAll(
            parser.item,
            context.get('references')
        ).then(references => {
            const serializer = this.__init()
            serializer
                .serialize(context.set('references', references))

            // this.assertEqual(result, '')
            done()
        }, error => {
            throw new Error(error)
        }).catch(error => {
            done(new Error(error))
        })
    }

    @targets('_formatContactInfo')
    testFormatContactInfoWithNull() {
        const parser = this.__init()

        const expected = {}

        const result = parser._formatContactInfo(null)

        this.assertEqual(expected, result)
    }

    @targets('_formatContactInfo')
    testFormatContactInfoWithEmptyContact() {
        const parser = this.__init()
        const contact = new Contact()

        const expected = {}

        const result = parser._formatContactInfo(contact)

        this.assertEqual(expected, result)
    }

    @targets('_formatContactInfo')
    testFormatContactInfoWithName() {
        const parser = this.__init()
        const contact = new Contact({
            name: 'some name'
        })

        const expected = {
            name: 'some name'
        }

        const result = parser._formatContactInfo(contact)

        this.assertEqual(expected, result)
    }

    @targets('_formatContactInfo')
    testFormatContactInfoWithUrl() {
        const parser = this.__init()
        const contact = new Contact({
            url: 'some.url.com'
        })

        const expected = {
            url: 'some.url.com'
        }

        const result = parser._formatContactInfo(contact)

        this.assertEqual(expected, result)
    }

    @targets('_formatContactInfo')
    testFormatContactInfoWithEmail() {
        const parser = this.__init()
        const contact = new Contact({
            email: 'some@email.com'
        })

        const expected = {
            email: 'some@email.com'
        }

        const result = parser._formatContactInfo(contact)

        this.assertEqual(expected, result)
    }

    @targets('_formatLicenseInfo')
    testFormatLicenseInfoWithNull() {
        const parser = this.__init()

        const expected = {}

        const result = parser._formatLicenseInfo(null)

        this.assertEqual(expected, result)
    }

    @targets('_formatLicenseInfo')
    testFormatLicenseInfoWithEmptyLicense() {
        const parser = this.__init()
        const license = new License()

        const expected = {}

        const result = parser._formatLicenseInfo(license)

        this.assertEqual(expected, result)
    }

    @targets('_formatLicenseInfo')
    testFormatLicenseInfoWithName() {
        const parser = this.__init()
        const license = new License({
            name: 'MIT'
        })

        const expected = {
            name: 'MIT'
        }

        const result = parser._formatLicenseInfo(license)

        this.assertEqual(expected, result)
    }

    @targets('_formatLicenseInfo')
    testFormatLicenseInfoWithUrl() {
        const parser = this.__init()
        const license = new License({
            url: 'some.url.com'
        })

        const expected = {
            name: 'Missing License Scheme',
            url: 'some.url.com'
        }

        const result = parser._formatLicenseInfo(license)

        this.assertEqual(expected, result)
    }

    @targets('_dropDuplicateParameters')
    testDropDuplicateParametersWithEmptyList() {
        const parser = this.__init()

        const params = []

        const expected = []

        const result = parser._dropDuplicateParameters(params)

        this.assertEqual(expected, result)
    }

    @targets('_dropDuplicateParameters')
    testDropDuplicateParametersWithListOfUniqueParams() {
        const parser = this.__init()

        const params = [
            {
                name: 'api_key',
                in: 'query'
            },
            {
                name: 'Content-MD5',
                in: 'header'
            }
        ]

        const expected = params

        const result = parser._dropDuplicateParameters(params)

        this.assertEqual(expected, result)
    }

    @targets('_dropDuplicateParameters')
    testDropDuplicateParametersWithListOfDuplParamsWithDifferentLocations() {
        const parser = this.__init()

        const params = [
            {
                name: 'api_key',
                in: 'query'
            },
            {
                name: 'api_key',
                in: 'header'
            },
            {
                name: 'Content-MD5',
                in: 'header'
            }
        ]

        const expected = params

        const result = parser._dropDuplicateParameters(params)

        this.assertEqual(expected, result)
    }

    @targets('_dropDuplicateParameters')
    testDropDuplicateParametersWithListOfDuplParamsWithSameLocation() {
        const parser = this.__init()

        const params = [
            {
                name: 'api_key',
                in: 'query'
            },
            {
                name: 'api_key',
                in: 'query'
            },
            {
                name: 'Content-MD5',
                in: 'header'
            }
        ]

        const expected = [
            {
                name: 'api_key',
                in: 'query',
                type: 'array',
                items: {},
                collectionFormat: 'multi',
                'x-title': 'api_key'
            },
            {
                name: 'Content-MD5',
                in: 'header'
            }
        ]

        const result = parser._dropDuplicateParameters(params)

        this.assertEqual(expected, result)
    }

    @targets('_replaceRefs')
    testReplaceRefsWithNullObject() {
        const parser = this.__init()

        const obj = null

        const expected = null

        const result = parser._replaceRefs(obj)

        this.assertEqual(expected, result)
    }

    @targets('_replaceRefs')
    testReplaceRefsWithSimpleTypeObject() {
        const parser = this.__init()

        const obj = 'simple string'

        const expected = 'simple string'

        const result = parser._replaceRefs(obj)

        this.assertEqual(expected, result)
    }

    @targets('_replaceRefs')
    testReplaceRefsWithReferenceWithRelativeURI() {
        const parser = this.__init()

        const obj = new JSONSchemaReference({
            uri: 'file.json#/path/to/def/User',
            relative: '#/path/to/def/User'
        })

        const expected = '#/path/to/def/User'

        const result = parser._replaceRefs(obj)

        this.assertEqual(expected, result)
    }

    @targets('_replaceRefs')
    testReplaceRefsWithArrayCallsReplaceRefForEachItem() {
        const parser = this.__init()

        const obj = [ 1, 2, 3, 4 ]

        const expected = [ 1, 2, 3, 4 ]

        const result = parser._replaceRefs(obj)

        this.assertEqual(expected, result)
        this.assertEqual(parser.spy._replaceRefs.count, 5)
    }

    @targets('_replaceRefs')
    testReplaceRefsWithObjectCallsReplaceRefForEachKey() {
        const parser = this.__init()

        const obj = {
            a: 12,
            b: 42,
            c: 90,
            d: 36
        }

        const expected = obj

        const result = parser._replaceRefs(obj)

        this.assertEqual(expected, result)
        this.assertEqual(parser.spy._replaceRefs.count, 5)
    }

    @targets('_formatPathParam')
    testFormatPathParamCallsFormatParam() {
        const parser = this.__init()

        parser.spyOn('_formatParam', () => {
            return 42
        })

        const expected = 42
        const result = parser._formatPathParam(null)

        this.assertEqual(parser.spy._formatParam.count, 1)
        this.assertEqual(expected, result)
    }

    @targets('_formatHeaderParam')
    testFormatHeaderParamCallsFormatParam() {
        const parser = this.__init()

        parser.spyOn('_formatParam', () => {
            return 42
        })

        const expected = 42
        const result = parser._formatHeaderParam(null)

        this.assertEqual(parser.spy._formatParam.count, 1)
        this.assertEqual(expected, result)
    }

    @targets('_formatQueryParam')
    testFormatQueryParamCallsFormatParam() {
        const parser = this.__init()

        parser.spyOn('_formatParam', () => {
            return 42
        })

        const expected = 42
        const result = parser._formatQueryParam(null)

        this.assertEqual(parser.spy._formatParam.count, 1)
        this.assertEqual(expected, result)
    }

    @targets('_isInlineRef')
    testIsInlineRefWithEmptyReferenceMap() {
        const parser = this.__init()

        parser.references = new Immutable.OrderedMap()

        const input = new JSONSchemaReference({
            uri: '#/definitions/User'
        })

        const expected = true
        const result = parser._isInlineRef(input)

        this.assertEqual(expected, result)
    }

    @targets('_isInlineRef')
    testIsInlineRefWithEmptyContainer() {
        const parser = this.__init()

        parser.references = new Immutable.OrderedMap({
            paw: new ReferenceContainer()
        })

        const input = new JSONSchemaReference({
            uri: '#/definitions/User'
        })

        const expected = true
        const result = parser._isInlineRef(input)

        this.assertEqual(expected, result)
    }

    @targets('_isInlineRef')
    testIsInlineRefWithNoMatchingReference() {
        const parser = this.__init()

        let references = new Immutable.List([
            new JSONSchemaReference({
                uri: '#/definitions/Team'
            }),
            new JSONSchemaReference({
                uri: '#/definitions/Admin'
            })
        ])

        parser.references = new Immutable.OrderedMap({
            paw: (new ReferenceContainer()).create(references)
        })

        const input = new JSONSchemaReference({
            uri: '#/definitions/User'
        })

        const expected = true
        const result = parser._isInlineRef(input)

        this.assertEqual(expected, result)
    }

    @targets('_isInlineRef')
    testIsInlineRefWithMatchingRef() {
        const parser = this.__init()

        let references = new Immutable.List([
            new JSONSchemaReference({
                uri: '#/definitions/Team'
            }),
            new JSONSchemaReference({
                uri: '#/definitions/User'
            }),
            new JSONSchemaReference({
                uri: '#/definitions/Admin'
            })
        ])

        parser.references = new Immutable.OrderedMap({
            paw: (new ReferenceContainer()).create(references)
        })

        const input = new JSONSchemaReference({
            uri: '#/definitions/User'
        })

        const expected = false
        const result = parser._isInlineRef(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatBodyParam')
    testFormatBodyParamCallsGetContentTypeDomain() {
        const parser = this.__init()

        parser.spyOn('_getContentTypeDomain', () => {
            return 'multipart/form-data'
        })

        parser.spyOn('_formatParam', () => {
            return 12
        })

        const expected = 12
        const result = parser._formatBodyParam()

        this.assertEqual(parser.spy._getContentTypeDomain.count, 1)
        this.assertEqual(expected, result)
    }

    @targets('_formatBodyParam')
    testFormatBodyParamCallsFormatParamIfTypeIsURLEncoded() {
        const parser = this.__init()

        parser.spyOn('_getContentTypeDomain', () => {
            return 'application/x-www-form-urlencoded'
        })

        parser.spyOn('_formatParam', () => {
            return 12
        })

        const expected = 12
        const result = parser._formatBodyParam()

        this.assertEqual(parser.spy._formatParam.count, 1)
        this.assertEqual(expected, result)
    }

    @targets('_formatBodyParam')
    testFormatBodyParamCallsFormatParamIfTypeIsMultipart() {
        const parser = this.__init()

        parser.spyOn('_getContentTypeDomain', () => {
            return 'multipart/form-data'
        })

        parser.spyOn('_formatParam', () => {
            return 12
        })

        const expected = 12
        const result = parser._formatBodyParam()

        this.assertEqual(parser.spy._formatParam.count, 1)
        this.assertEqual(expected, result)
    }

    @targets('_formatBodyParam')
    testFormatBodyParamDoesNotCallFormatParamIfTypeIsText() {
        const parser = this.__init()

        parser.spyOn('_getContentTypeDomain', () => {
            return 'text/plain'
        })

        parser.spyOn('_formatParam', () => {
            return 12
        })

        const input = new Parameter({
            key: 'userId',
            name: 'User Id',
            type: 'string',
            externals: new Immutable.List([
                new Parameter({
                    key: 'Content-Type',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            'text/plain'
                        ])
                    ])
                })
            ])
        })

        parser._formatBodyParam(input)

        this.assertEqual(parser.spy._formatParam.count, 0)
    }

    @targets('_formatBodyParam')
    testFormatBodyParamReturnsExpectedStructureWithSimpleType() {
        const parser = this.__init()

        parser.spyOn('_getContentTypeDomain', () => {
            return 'text/plain'
        })

        const input = new Parameter({
            key: 'userId',
            name: 'User Id',
            type: 'string'
        })

        const expected = {
            name: 'userId',
            in: 'body',
            schema: {
                type: 'string'
            }
        }
        const result = parser._formatBodyParam(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatBodyParam')
    testFormatBodyParamReturnsExpectedStructureWithInlineJSONSchemaReference() {
        const parser = this.__init()

        parser.spyOn('_getContentTypeDomain', () => {
            return 'text/plain'
        })

        parser.spyOn('_isInlineRef', () => {
            return true
        })

        const input = new Parameter({
            key: 'userId',
            name: 'User Id',
            type: 'reference',
            value: new JSONSchemaReference({
                value: {
                    type: 'integer',
                    minimum: 0,
                    maximum: 100
                }
            })
        })

        const expected = {
            name: 'userId',
            in: 'body',
            schema: {
                type: 'integer',
                minimum: 0,
                maximum: 100
            }
        }
        const result = parser._formatBodyParam(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatBodyParam')
    testFormatBodyParamReturnsExpectedStructureWithJSONSchemaReference() {
        const parser = this.__init()

        parser.spyOn('_getContentTypeDomain', () => {
            return 'text/plain'
        })

        parser.spyOn('_isInlineRef', () => {
            return false
        })

        const input = new Parameter({
            key: 'userId',
            name: 'User Id',
            type: 'reference',
            value: new JSONSchemaReference({
                uri: '#/definitions/User',
                relative: '#/definitions/User',
                value: {
                    type: 'integer',
                    minimum: 0,
                    maximum: 100
                }
            })
        })

        const expected = {
            name: 'User',
            in: 'body',
            schema: {
                $ref: '#/definitions/User'
            }
        }
        const result = parser._formatBodyParam(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatBodyParam')
    testFormatBodyParamReturnsExpectedStructureWithInlineExoticReference() {
        const parser = this.__init()

        parser.spyOn('_getContentTypeDomain', () => {
            return 'text/plain'
        })

        parser.spyOn('_isInlineRef', () => {
            return true
        })

        const input = new Parameter({
            key: 'userId',
            name: 'User Id',
            type: 'reference',
            value: new ExoticReference({
                value: 'something'
            })
        })

        const expected = {
            name: 'userId',
            in: 'body',
            schema: {
                type: 'string',
                default: 'something'
            }
        }
        const result = parser._formatBodyParam(input)

        this.assertEqual(expected, result)
    }

    @targets('_formatBodyParam')
    testFormatBodyParamReturnsExpectedStructureWitExoticReference() {
        const parser = this.__init()

        parser.spyOn('_getContentTypeDomain', () => {
            return 'text/plain'
        })

        parser.spyOn('_isInlineRef', () => {
            return false
        })

        const input = new Parameter({
            key: 'userId',
            name: 'User Id',
            type: 'reference',
            value: new ExoticReference({
                uri: '#/definitions/Exotic',
                relative: '#/definitions/Exotic',
                value: {
                    type: 'integer',
                    minimum: 0,
                    maximum: 100
                }
            })
        })

        const expected = {
            name: 'Exotic',
            in: 'body',
            schema: {
                $ref: '#/definitions/Exotic'
            }
        }
        const result = parser._formatBodyParam(input)

        this.assertEqual(expected, result)
    }

    @targets('validate')
    _testValidate() {
        // TODO
    }

    //
    // helpers
    //

    __init(prefix = '') {
        let parser = new SwaggerSerializer()
        let mockedParser = new ClassMock(parser, prefix)

        return mockedParser
    }
}
