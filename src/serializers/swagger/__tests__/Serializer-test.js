import {
    UnitTest,
    registerTest,
    targets,
    against
} from '../../../utils/TestUtils'
import Immutable from 'immutable'

import SwaggerSerializer from '../Serializer'

import Context, {
    Body,
    Request,
    Response,
    Parameter,
    ParameterContainer
} from '../../../models/Core'

import {
    URL,
    Info, Contact, License
} from '../../../models/Utils'


import Constraint from '../../../models/Constraint'
import Auth from '../../../models/Auth'

import {
    ClassMock
} from '../../../mocks/PawMocks'

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
                    schemes: [ 'http', 'https', 'weird-scheme' ],
                    host: 'test.com',
                    path: '/path/to/req'
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
                    schemes: [ 'http', 'https', 'weird-scheme' ],
                    host: 'test.com',
                    path: '/path/to/req'
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
                    schemes: [ 'http', 'https', 'weird-scheme' ],
                    host: 'securityDefs#1',
                    path: '/path/to/req'
                }),
                method: 'GET'
            }),
            new Request({
                url: new URL({
                    schemes: [ 'http', 'https', 'weird-scheme' ],
                    host: 'securityDefs#2',
                    path: '/path/to/req'
                }),
                method: 'POST'
            }),
            new Request({
                url: new URL({
                    schemes: [ 'http', 'https', 'weird-scheme' ],
                    host: 'securityDefs#2',
                    path: '/path/to/other/req'
                }),
                method: 'POST'
            })
        ])
        const schemes = [ 'http' ]

        parser.spyOn('_formatRequest', (_context, req) => {
            let content = {}
            content[req.get('method')] = 'test request'
            let securityDefs = {}
            securityDefs[req.getIn([ 'url', 'host' ])] = 'test definition'
            return [ securityDefs, req.getIn([ 'url', 'path' ]), content ]
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
                'securityDefs#1': 'test definition',
                'securityDefs#2': 'test definition'
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
                schemes: [ 'http', 'https' ],
                host: 'test.com',
                path: '/path/to/req'
            }),
            method: 'GET'
        })
        const schemes = [ 'http' ]

        parser.spyOn('_formatContent', () => {
            return [ null, 'test content' ]
        })

        const expected = [
            null, '/path/to/req', { GET: 'test content' }
        ]

        const result = parser._formatRequest(context, request, schemes)

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
                schemes: [ 'https', 'ws' ],
                host: 'test.com',
                path: '/path/to/req'
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
                description: 'simple request description',
                tags: [ 'first', 'second' ],
                operationId: 'ae256',
                schemes: [ 'https', 'ws' ],
                produces: [],
                consumes: [],
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
                schemes: [ 'https', 'ws' ],
                host: 'test.com',
                path: '/path/to/req'
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
                description: 'simple request description',
                tags: [ 'first', 'second' ],
                operationId: 'ae256',
                schemes: [ 'https', 'ws' ],
                produces: [ 'application/json' ],
                consumes: [ 'application/json', 'application/xml' ],
                parameters: [ 'params' ],
                security: 'security scheme'
            }
        ]

        const result = parser._formatContent(context, request, schemes)

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

        const result = parser._formatParameters(context, request)

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
            return count
        })

        const expected = [ 1, 2, 3, 4, 5, 6, 7, 8 ]

        const result = parser._formatParameters(context, request)

        this.assertEqual(expected, result)
        this.assertEqual(parser.spy._formatParam.count, 8)
    }

    @targets('_formatParam')
    testFormatParamWithSimpleContent() {
        const parser = this.__init()
        const source = 'query'
        const param = new Parameter()

        const expected = {
            in: 'query',
            name: null,
            type: null
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
            in: 'header',
            name: 'Content-Type',
            default: 'default value',
            type: 'string',
            minimumLength: 10,
            maximumLength: 50,
            'x-use-with': [
                {
                    name: 'Content-MD5',
                    type: null,
                    enum: [ 'ae256', 'ae512' ]
                }
            ],
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
            in: 'header',
            name: 'Content-Type',
            type: 'array',
            minimumItems: 2,
            maximumItems: 4,
            items: {
                type: 'integer',
                enum: [ 1, 2, 3, 4 ]
            },
            'x-use-with': [
                {
                    name: 'Content-MD5',
                    type: null,
                    enum: [ 'ae256', 'ae512' ]
                }
            ],
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
            'basic_auth'
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
            'api_key_auth'
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
            scopes: new Immutable.List([ 'write:self', 'read:any' ])
        })

        const expected = [
            {
                oauth_2_auth: {
                    type: 'oauth2',
                    authorizationUrl: 'test.com/auth',
                    tokenUrl: 'test.com/token',
                    flow: 'implicit',
                    scopes: [ 'write:self', 'read:any' ]
                }
            },
            'oauth_2_auth'
        ]

        const result = parser._formatOAuth2Auth(context, auth)

        this.assertEqual(
            JSON.stringify(expected, null, '  '),
            JSON.stringify(result, null, '  ')
        )
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
