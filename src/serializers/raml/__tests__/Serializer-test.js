import Immutable from 'immutable'

import {
    UnitTest,
    registerTest,
    against,
    targets
} from '../../../utils/TestUtils'

import { ClassMock } from '../../../mocks/PawMocks'

import {
    Info, Contact, License
} from '../../../models/Utils'

import Group from '../../../models/Group'
import Auth from '../../../models/Auth'
import Constraint from '../../../models/Constraint'
import URL from '../../../models/URL'
import Request from '../../../models/Request'
import Context, {
    Body,
    Response,
    Parameter,
    ParameterContainer
} from '../../../models/Core'
import RAMLSerializer from '../Serializer'

import ReferenceContainer from '../../../models/references/Container'
import ExoticReference from '../../../models/references/Exotic'
import JSONSchemaReference from '../../../models/references/JSONSchema'

@registerTest
@against(RAMLSerializer)
export class TestRAMLSerializer extends UnitTest {

    @targets('serialize')
    testSerializeWithEmptyContext() {
        let s = this.__init()

        s.spyOn('_formatStructure', () => {
            return null
        })

        let input = new Context()

        let result = s.serialize(input)

        let expected =
            '#%RAML 0.8\n' +
            'null\n'

        this.assertEqual(expected, result)
    }

    @targets('_formatStructure')
    testFormatStructureWithEmptyContext() {
        let s = this.__init()

        s.spyOn('_formatBasicInfo', () => {
            return {}
        })

        s.spyOn('_formatURLInfo', () => {

        })

        let input = new Context()

        let result = s._formatStructure(input)

        let expected = null

        this.assertEqual(expected, result)
        this.assertEqual(s.spy._formatBasicInfo.count, 1)
        this.assertEqual(s.spy._formatURLInfo.count, 0)
    }

    @targets('_formatStructure')
    testFormatStructureWithSimpleContext() {
        let s = this.__init()

        s.spyOn('_formatBasicInfo', () => {
            return {
                baseUri: '{version}.uri.com',
                version: 'v1'
            }
        })

        s.spyOn('_formatURLInfo', () => {
            return {
                uriParameters: {
                    value: 12
                }
            }
        })

        s.spyOn('_formatSecuritySchemes', () => {
            return {
                securitySchemes: true
            }
        })

        s.spyOn('_formatPaths', () => {
            return {
                '/a-path': 90
            }
        })

        let input = new Context({
            group: new Group()
        })

        let expected = {
            baseUri: '{version}.uri.com',
            version: 'v1',
            uriParameters: {
                value: 12
            },
            securitySchemes: true,
            '/a-path': 90
        }

        let result = s._formatStructure(input)

        this.assertEqual(expected, result)
        this.assertEqual(s.spy._formatBasicInfo.count, 1)
        this.assertEqual(s.spy._formatURLInfo.count, 1)
        this.assertEqual(s.spy._formatSecuritySchemes.count, 1)
        this.assertEqual(s.spy._formatPaths.count, 1)
    }

    @targets('_formatBasicInfo')
    testFormatBasicInfoWithEmptyContext() {
        let s = this.__init()

        let input = new Context()

        let expected = {}

        let result = s._formatBasicInfo(input)

        this.assertEqual(expected, result)
        this.assertEqual(s.spy._formatContact.count, 0)
        this.assertEqual(s.spy._formatLicense.count, 0)
    }

    @targets('_formatBasicInfo')
    testFormatBasicInfoWithSimpleContextInfo() {
        let s = this.__init()

        let input = new Context({
            info: new Info({
                title: 'Test API',
                description: 'a simple description',
                tos: 'http://tos.api.com',
                version: 'v1'
            })
        })

        let expected = {
            title: 'Test API',
            documentation: [
                {
                    title: 'Description',
                    content: 'a simple description'
                },
                {
                    title: 'Terms of Service',
                    content: 'http://tos.api.com'
                }
            ],
            version: 'v1'
        }

        let result = s._formatBasicInfo(input)

        this.assertEqual(expected, result)
        this.assertEqual(s.spy._formatContact.count, 0)
        this.assertEqual(s.spy._formatLicense.count, 0)
    }

    @targets('_formatBasicInfo')
    testFormatBasicInfoWithContactContextInfo() {
        let s = this.__init()

        s.spyOn('_formatContact', () => {
            return 'name: test\nurl: contact.luckymarmot.com\n'
        })

        let input = new Context({
            info: new Info({
                title: 'Test API',
                description: 'a simple description',
                tos: 'http://tos.api.com',
                version: 'v1',
                contact: new Contact()
            })
        })

        let expected = {
            title: 'Test API',
            documentation: [
                {
                    title: 'Description',
                    content: 'a simple description'
                },
                {
                    title: 'Terms of Service',
                    content: 'http://tos.api.com'
                },
                {
                    title: 'Contact',
                    content: 'name: test\nurl: contact.luckymarmot.com\n'
                }
            ],
            version: 'v1'
        }

        let result = s._formatBasicInfo(input)

        this.assertEqual(expected, result)
        this.assertEqual(s.spy._formatContact.count, 1)
        this.assertEqual(s.spy._formatLicense.count, 0)
    }

    @targets('_formatBasicInfo')
    testFormatBasicInfoWithLicenseContextInfo() {
        let s = this.__init()

        s.spyOn('_formatLicense', () => {
            return 'name: MIT\nurl: license.luckymarmot.com\n'
        })

        let input = new Context({
            info: new Info({
                title: 'Test API',
                description: 'a simple description',
                tos: 'http://tos.api.com',
                version: 'v1',
                license: new License()
            })
        })

        let expected = {
            title: 'Test API',
            documentation: [
                {
                    title: 'Description',
                    content: 'a simple description'
                },
                {
                    title: 'Terms of Service',
                    content: 'http://tos.api.com'
                },
                {
                    title: 'License',
                    content: 'name: MIT\nurl: license.luckymarmot.com\n'
                }
            ],
            version: 'v1'
        }

        let result = s._formatBasicInfo(input)

        this.assertEqual(expected, result)
        this.assertEqual(s.spy._formatContact.count, 0)
        this.assertEqual(s.spy._formatLicense.count, 1)
    }

    @targets('_formatContact')
    testFormatContactWithEmptyContact() {
        let s = this.__init()

        let contact = new Contact()

        let expected = ''
        let result = s._formatContact(contact)

        this.assertEqual(expected, result)
    }

    @targets('_formatContact')
    testFormatContactWithRichContact() {
        let s = this.__init()

        let contact = new Contact({
            name: 'test',
            url: 'test.lucky.com',
            email: 'test@lucky.com'
        })

        let expected =
            'name: test\n' +
            'url: test.lucky.com\n' +
            'email: test@lucky.com\n'

        let result = s._formatContact(contact)

        this.assertEqual(expected, result)
    }

    @targets('_formatLicense')
    testFormatLicenseWithEmptyLicense() {
        let s = this.__init()

        let license = new License()

        let expected = ''
        let result = s._formatLicense(license)

        this.assertEqual(expected, result)
    }

    @targets('_formatLicense')
    testFormatLicenseWithRichLicense() {
        let s = this.__init()

        let license = new License({
            name: 'MIT',
            url: 'license.lucky.com'
        })

        let expected =
            'name: MIT\n' +
            'url: license.lucky.com\n'

        let result = s._formatLicense(license)

        this.assertEqual(expected, result)
    }

    @targets('_formatURLInfo')
    testFormatURLInfoWithEmptyRequestList() {
        let s = this.__init()
        let reqs = new Immutable.List()

        let expected = {}
        let result = s._formatURLInfo(reqs)

        this.assertEqual(expected, result)
        this.assertEqual(s.spy._updateProtocols.count, 0)
        this.assertEqual(s.spy._generateSequenceParam.count, 0)
        this.assertEqual(s.spy._formatURIParameters.count, 0)
    }

    @targets('_formatURLInfo')
    testFormatURLInfoWithTwoRequests() {
        let s = this.__init()

        s.spyOn('_updateProtocols', () => {
            return { http: true, https: true }
        })

        s.spyOn('_generateSequenceParam', () => {
            return 'test.luckymarmot.com'
        })

        s.spyOn('_formatURIParameters', () => {
            return [ { baseUriParameters: 42 }, 'v1' ]
        })

        let reqs = new Immutable.List([
            new Request(),
            new Request()
        ])

        let expected = {
            protocols: [ 'http', 'https' ],
            baseUri: 'http://test.luckymarmot.com',
            version: 'v1',
            baseUriParameters: 42
        }

        let result = s._formatURLInfo(reqs)

        this.assertEqual(expected, result)
        this.assertEqual(s.spy._updateProtocols.count, 2)
        this.assertEqual(s.spy._generateSequenceParam.count, 1)
        this.assertEqual(s.spy._formatURIParameters.count, 1)
    }

    @targets('_updateProtocols')
    testUpdateProtocolsWithEmptyURL() {
        let s = this.__init()

        let protocols = {
            http: true
        }
        let url = new URL()

        let expected = {
            http: true
        }

        let result = s._updateProtocols(protocols, url)

        this.assertEqual(expected, result)
    }

    @targets('_updateProtocols')
    testUpdateProtocolsWithSimpleURL() {
        let s = this.__init()

        let protocols = {
            http: true
        }
        let url = new URL('https://luckymarmot.com')

        let expected = {
            http: true,
            https: true
        }

        let result = s._updateProtocols(protocols, url)

        this.assertEqual(expected, result)
    }

    @targets('_updateProtocols')
    testUpdateProtocolsWithSocketURL() {
        let s = this.__init()

        let protocols = {
            http: true
        }
        let url = new URL('wss://luckymarmot.com')

        let expected = {
            http: true
        }

        let result = s._updateProtocols(protocols, url)

        this.assertEqual(expected, result)
    }

    @targets('_generateSequenceParam')
    testGenerateSequenceParamWithSimpleParam() {
        let s = this.__init()

        let url = new URL({
            host: new Parameter({
                key: 'host',
                type: 'string',
                internals: new Immutable.List([
                    new Constraint.Enum([
                        'luckymarmot.com'
                    ])
                ])
            })
        })

        let expected = 'luckymarmot.com'
        let result = s._generateSequenceParam(url, 'host')

        this.assertEqual(expected, result)
    }

    @targets('_generateSequenceParam')
    testGenerateSequenceParamWithSequenceParam() {
        let s = this.__init()

        let url = new URL({
            host: new Parameter({
                key: 'host',
                type: 'string',
                value: new Immutable.List([
                    new Parameter({
                        key: 'version',
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([ 'v0.8', 'v1' ])
                        ])
                    }),
                    new Parameter({
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([ '.luckymarmot.' ])
                        ])
                    }),
                    new Parameter({
                        key: 'extension',
                        type: 'string',
                        internals: new Immutable.List([
                            new Constraint.Enum([
                                'com', 'co.uk', 'io'
                            ])
                        ])
                    })
                ]),
                format: 'sequence'
            })
        })

        let expected = '{version}.luckymarmot.{extension}'
        let result = s._generateSequenceParam(url, 'host')

        this.assertEqual(expected, result)
    }

    @targets('_formatURIParameters')
    testFormatURIParametersWithSimpleParam() {
        let s = this.__init()

        let param = new Parameter({
            type: 'string',
            internals: new Immutable.List([
                new Constraint.Enum([ 'luckymarmot.com' ])
            ])
        })
        let target = 'baseUriParameters'

        let expected = [ {}, null ]
        let result = s._formatURIParameters(param, target)

        this.assertEqual(expected, result)
        this.assertEqual(s.spy._convertJSONSchemaToNamedParameter.count, 0)
    }

    @targets('_formatURIParameters')
    testFormatURIParametersWithSequenceParam() {
        let s = this.__init()

        s.spyOn('_convertJSONSchemaToNamedParameter', () => {
            return {
                extension: {
                    displayName: 'extension',
                    type: 'string',
                    enum: [ 'com', 'co.uk', 'io' ]
                }
            }
        })

        let param = new Parameter({
            key: 'host',
            type: 'string',
            value: new Immutable.List([
                new Parameter({
                    key: 'version',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([ 'v1' ])
                    ])
                }),
                new Parameter({
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([ '.luckymarmot.' ])
                    ])
                }),
                new Parameter({
                    key: 'extension',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([
                            'com', 'co.uk', 'io'
                        ])
                    ])
                })
            ]),
            format: 'sequence'
        })
        let target = 'baseUriParameters'

        let expected = [ {
            baseUriParameters: {
                extension: {
                    displayName: 'extension',
                    type: 'string',
                    enum: [ 'com', 'co.uk', 'io' ]
                }
            }
        }, 'v1' ]
        let result = s._formatURIParameters(param, target)

        this.assertEqual(expected, result)
        this.assertEqual(s.spy._convertJSONSchemaToNamedParameter.count, 1)
    }

    @targets('_convertJSONSchemaToNamedParameter')
    testConvertJSONToNamedParameterWithSimpleSchema() {
        let s = this.__init()

        let schema = {}

        let expected = null
        let result = s._convertJSONSchemaToNamedParameter(schema)

        this.assertEqual(expected, result)
    }

    @targets('_convertJSONSchemaToNamedParameter')
    testConvertJSONToNamedParameterWithRichSchema() {
        let s = this.__init()

        let schema = {
            'x-title': 'extension',
            type: 'string',
            enum: [ 'com', 'io' ],
            minimumLength: 2,
            maximumLength: 3
        }

        let expected = {
            extension: {
                displayName: 'extension',
                type: 'string',
                enum: [ 'com', 'io' ],
                minLength: 2,
                maxLength: 3
            }
        }
        let result = s._convertJSONSchemaToNamedParameter(schema)

        this.assertEqual(expected, result)
    }

    @targets('_convertJSONSchemaToNamedParameter')
    testConvertJSONToNamedParameterWithNumberSchema() {
        let s = this.__init()

        let schema = {
            'x-title': 'version',
            type: 'integer',
            minimum: 1,
            maximum: 4
        }

        let expected = {
            version: {
                displayName: 'version',
                type: 'integer',
                minimum: 1,
                maximum: 4
            }
        }
        let result = s._convertJSONSchemaToNamedParameter(schema)

        this.assertEqual(expected, result)
    }

    @targets('_convertParameterToNamedParameter')
    testConvertParameterToNamedParameterWithSimpleParam() {
        let s = this.__init()

        let param = new Parameter()

        let expected = null

        let result = s._convertParameterToNamedParameter(param)

        this.assertEqual(expected, result)
    }

    @targets('_convertParameterToNamedParameter')
    testConvertParameterToNamedParameterWithRichParam() {
        let s = this.__init()

        let param = new Parameter({
            key: 'extension',
            type: 'string',
            internals: new Immutable.List([
                new Constraint.Enum([ 'com', 'io' ])
            ]),
            example: 'com',
            description: 'the extension of the domain',
            required: true
        })

        let expected = {
            extension: {
                displayName: 'extension',
                type: 'string',
                enum: [ 'com', 'io' ],
                required: true,
                example: 'com',
                description: 'the extension of the domain'
            }
        }

        let result = s._convertParameterToNamedParameter(param)

        this.assertEqual(expected, result)
    }

    @targets('_formatSecuritySchemes')
    testFormatSecuritySchemesWithEmptyRequestList() {
        let s = this.__init()

        let reqs = new Immutable.List()

        let expected = {}

        let result = s._formatSecuritySchemes(reqs)

        this.assertEqual(expected, result)
    }

    @targets('_formatSecuritySchemes')
    testFormatSecuritySchemesWithTwoRequests() {
        let s = this.__init()

        s.spyOn('_formatBasic', () => {
            return {
                basic: {
                    type: 'Basic Authentication'
                }
            }
        })

        s.spyOn('_formatOAuth2', () => {
            return {
                oauth_2_0: {
                    type: 'OAuth 2.0',
                    settings: {
                        authorizationUri: 'api.com/oauth2/authorize',
                        accessTokenUri: 'api.com/oauth2/token',
                        authorizationGrants: [ 'token' ]
                    }
                }
            }
        })

        let reqs = new Immutable.List([
            new Request({
                auths: new Immutable.List([
                    null,
                    new Auth.OAuth2({
                        flow: 'implicit',
                        authorizationUrl: 'api.com/oauth2/authorize',
                        tokenUrl: 'api.com/oauth2/token',
                        scopes: Immutable.List([ 'read:any', 'write:own' ])
                    })
                ])
            }),
            new Request({
                auths: new Immutable.List([
                    null,
                    new Auth.Basic({
                        username: 'admin'
                    })
                ])
            })
        ])

        let expected = {
            securitySchemes: [
                {
                    oauth_2_0: {
                        type: 'OAuth 2.0',
                        settings: {
                            authorizationUri: 'api.com/oauth2/authorize',
                            accessTokenUri: 'api.com/oauth2/token',
                            authorizationGrants: [ 'token' ]
                        }
                    }
                },
                {
                    basic: {
                        type: 'Basic Authentication'
                    }
                }
            ]
        }

        let result = s._formatSecuritySchemes(reqs)

        this.assertEqual(expected, result)
    }

    @targets('_formatOAuth2')
    testFormatOAuth2WithSimpleAuth() {
        let s = this.__init()

        let auth = new Auth.OAuth2()

        let expected = {
            oauth_2_0: {
                type: 'OAuth 2.0'
            }
        }

        let result = s._formatOAuth2(auth)

        this.assertEqual(expected, result)
    }

    @targets('_formatOAuth2')
    testFormatOAuth2WithRichAuth() {
        let s = this.__init()

        let auth = new Auth.OAuth2({
            flow: 'implicit',
            authorizationUrl: 'api.com/oauth2/authorize',
            tokenUrl: 'api.com/oauth2/token',
            scopes: Immutable.List([ 'read:any', 'write:own' ])
        })

        let expected = {
            oauth_2_0: {
                type: 'OAuth 2.0',
                settings: {
                    authorizationUri: 'api.com/oauth2/authorize',
                    accessTokenUri: 'api.com/oauth2/token',
                    authorizationGrants: [ 'token' ]
                }
            }
        }

        let result = s._formatOAuth2(auth)

        this.assertEqual(expected, result)
    }

    @targets('_formatOAuth1')
    testFormatOAuth1WithSimpleAuth() {
        let s = this.__init()

        let auth = new Auth.OAuth1()

        let expected = {
            oauth_1_0: {
                type: 'OAuth 1.0'
            }
        }

        let result = s._formatOAuth1(auth)

        this.assertEqual(expected, result)
    }

    @targets('_formatOAuth1')
    testFormatOAuth1WithRichAuth() {
        let s = this.__init()

        let auth = new Auth.OAuth1({
            callback: 'http://api.com/oauth1/callback',
            consumerSecret: 'consumer secret',
            tokenSecret: 'token secret',
            consumerKey: 'consumer key',
            algorithm: 'super secret algorithm',
            nonce: '12345',
            additionalParameters: 'none',
            timestamp: 'now',
            token: 'token',
            version: '1.0',
            signature: 'this is signed',
            tokenCredentialsUri: 'http://api.com/oauth1/credentials',
            requestTokenUri: 'http://api.com/oauth1/request',
            authorizationUri: 'http://api.com/oauth1/authorize'
        })

        let expected = {
            oauth_1_0: {
                type: 'OAuth 1.0',
                settings: {
                    callback: 'http://api.com/oauth1/callback',
                    consumerSecret: 'consumer secret',
                    tokenSecret: 'token secret',
                    consumerKey: 'consumer key',
                    algorithm: 'super secret algorithm',
                    nonce: '12345',
                    additionalParameters: 'none',
                    timestamp: 'now',
                    token: 'token',
                    version: '1.0',
                    signature: 'this is signed',
                    tokenCredentialsUri: 'http://api.com/oauth1/credentials',
                    requestTokenUri: 'http://api.com/oauth1/request',
                    authorizationUri: 'http://api.com/oauth1/authorize'
                }
            }
        }

        let result = s._formatOAuth1(auth)

        this.assertEqual(expected, result)
    }

    @targets('_formatDigest')
    testFormatDigest() {
        let s = this.__init()

        let expected = {
            digest: {
                type: 'Digest Authentication'
            }
        }

        let result = s._formatDigest()

        this.assertEqual(expected, result)
    }

    @targets('_formatBasic')
    testFormatBasic() {
        let s = this.__init()

        let expected = {
            basic: {
                type: 'Basic Authentication'
            }
        }

        let result = s._formatBasic()

        this.assertEqual(expected, result)
    }

    @targets('_formatPaths')
    testFormatPathsWithEmptyGroup() {
        let s = this.__init()

        let group = new Group()

        let expected = {}
        let result = s._formatPaths(group)

        this.assertEqual(expected, result)
    }

    @targets('_formatPaths')
    testFormatPathsWithSimpleGroup() {
        let s = this.__init()

        s.spyOn('_formatRequest', (req) => {
            let res = {}
            res[req.get('method')] = true
            return res
        })

        let group = new Group({
            name: '/songs',
            children: new Immutable.OrderedMap({
                get: new Request({ method: 'get' }),
                post: new Request({ method: 'post' }),
                '/{songId}': new Group({
                    name: '/{songId}',
                    children: new Immutable.OrderedMap({
                        get: new Request({ method: 'get' })
                    })
                })
            })
        })

        let expected = {
            '/songs': {
                get: true,
                post: true,
                '/{songId}': {
                    get: true
                }
            }
        }

        let result = s._formatPaths(group)

        this.assertEqual(expected, result)
        this.assertEqual(s.spy._formatRequest.count, 3)
        this.assertEqual(s.spy._formatPaths.count, 5)
    }

    @targets('_formatRequest')
    testFormatRequestWithEmptyRequest() {
        let s = this.__init()
        let req = new Request()

        let expected = {}
        let result = s._formatRequest(req)

        this.assertEqual(expected, result)
    }

    @targets('_formatRequest')
    testFormatRequestWithSimpleRequest() {
        let s = this.__init()

        s.spyOn('_formatParameters', () => {
            return {
                headers: true
            }
        })

        s.spyOn('_formatBody', () => {
            return {
                body: true
            }
        })

        s.spyOn('_formatURIParameters', (_, target) => {
            let res = {}
            res[target] = true
            return [ res, null ]
        })

        let req = new Request({
            method: 'get',
            description: 'a simple description'
        })

        let expected = {
            get: {
                description: 'a simple description',
                headers: true,
                body: true,
                baseUriParameters: true,
                uriParameters: true
            }
        }

        let result = s._formatRequest(req)

        this.assertEqual(expected, result)
        this.assertEqual(s.spy._formatParameters.count, 1)
        this.assertEqual(s.spy._formatBody.count, 1)
        this.assertEqual(s.spy._formatURIParameters.count, 2)
    }

    @targets('_formatParameters')
    testFormatParametersWithEmptyContainer() {
        let s = this.__init()

        let container = new ParameterContainer()

        let expected = {}

        let result = s._formatParameters(container)

        this.assertEqual(expected, result)
        this.assertEqual(s.spy._formatHeaders.count, 0)
        this.assertEqual(s.spy._formatQueries.count, 0)
    }

    @targets('_formatParameters')
    testFormatParametersWithSimpleContainer() {
        let s = this.__init()

        s.spyOn('_formatHeaders', () => {
            return {
                'Content-Type': true
            }
        })

        s.spyOn('_formatQueries', () => {
            return {
                access_token: true
            }
        })

        let container = new ParameterContainer({
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
            queries: new Immutable.List([
                new Parameter({
                    key: 'access_token',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Pattern(/[a-f0-9]{32}/)
                    ])
                })
            ])
        })

        let expected = {
            headers: {
                'Content-Type': true
            },
            queryParameters: {
                access_token: true
            }
        }

        let result = s._formatParameters(container)

        this.assertEqual(expected, result)
    }

    @targets('_formatHeaders')
    testFormatHeadersWithEmptyHeaders() {
        let s = this.__init()

        let headers = new Immutable.List()

        let expected = {}

        let result = s._formatHeaders(headers)

        this.assertEqual(expected, result)
    }

    @targets('_formatHeaders')
    testFormatHeadersWithSimpleHeaders() {
        let s = this.__init()

        let headers = new Immutable.List([
            new Parameter({
                key: 'Content-Type',
                type: 'string',
                internals: new Immutable.List([
                    new Constraint.Enum([
                        'application/json'
                    ])
                ])
            }),
            new Parameter({
                key: 'Expect',
                type: 'string',
                internals: new Immutable.List([
                    new Constraint.Enum([
                        '100-continue'
                    ])
                ])
            })
        ])

        let expected = {
            'Content-Type': {
                displayName: 'Content-Type',
                type: 'string',
                enum: [ 'application/json' ],
                required: false
            },
            Expect: {
                displayName: 'Expect',
                type: 'string',
                enum: [ '100-continue' ],
                required: false
            }
        }

        let result = s._formatHeaders(headers)

        this.assertEqual(expected, result)
        this.assertEqual(s.spy._convertParameterToNamedParameter.count, 2)
    }

        @targets('_formatQueries')
    testFormatQueriesWithEmptyQueries() {
        let s = this.__init()

        let queries = new Immutable.List()

        let expected = {}

        let result = s._formatQueries(queries)

        this.assertEqual(expected, result)
    }

    @targets('_formatQueries')
    testFormatQueriesWithSimpleQueries() {
        let s = this.__init()

        let queries = new Immutable.List([
            new Parameter({
                key: 'access_token',
                type: 'string',
                internals: new Immutable.List([
                    new Constraint.MinimumLength(32)
                ])
            }),
            new Parameter({
                key: 'count',
                type: 'integer',
                internals: new Immutable.List([
                    new Constraint.Minimum(1),
                    new Constraint.Maximum(500)
                ])
            })
        ])

        let expected = {
            access_token: {
                displayName: 'access_token',
                type: 'string',
                minLength: 32,
                required: false
            },
            count: {
                displayName: 'count',
                type: 'integer',
                minimum: 1,
                maximum: 500,
                required: false
            }
        }

        let result = s._formatQueries(queries)

        this.assertEqual(expected, result)
        this.assertEqual(s.spy._convertParameterToNamedParameter.count, 2)
    }

    @targets('_formatBody')
    testFormatBodyWithEmptyBodyList() {
        let s = this.__init()

        let container = new ParameterContainer()
        let bodies = new Immutable.List()

        let expected = {}
        let result = s._formatBody(container, bodies)

        this.assertEqual(expected, result)
    }

    @targets('_formatBody')
    testFormatBodyWithSimpleBodyList() {
        let s = this.__init()

        s.spyOn('_getContentTypeConstraint', () => {
            return 'application/json'
        })

        let container = new ParameterContainer({
            body: new Immutable.List([
                new Parameter({
                    key: 'schema',
                    type: 'string',
                    value: '{ "super": "schema" }',
                    externals: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'application/json' ])
                            ])
                        })
                    ])
                })
            ])
        })

        let bodies = new Immutable.List([
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

        let expected = {
            body: {
                'application/json': {
                    schema: '{ "super": "schema" }'
                }
            }
        }

        let result = s._formatBody(container, bodies)

        this.assertEqual(expected, result)
    }

    @targets('_formatBody')
    testFormatBodyWithFormBodyList() {
        let s = this.__init()

        s.spyOn('_getContentTypeConstraint', () => {
            return 'application/x-www-form-urlencoded'
        })

        let container = new ParameterContainer({
            body: new Immutable.List([
                new Parameter({
                    key: 'count',
                    type: 'integer',
                    internals: new Immutable.List([
                        new Constraint.Minimum(0),
                        new Constraint.Maximum(100)
                    ]),
                    externals: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'application/x-www-form-urlencoded'
                                ])
                            ])
                        })
                    ])
                })
            ])
        })

        let bodies = new Immutable.List([
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

        let expected = {
            body: {
                'application/x-www-form-urlencoded': {
                    formParameters: {
                        count: {
                            displayName: 'count',
                            type: 'integer',
                            minimum: 0,
                            maximum: 100,
                            required: false
                        }
                    }
                }
            }
        }

        let result = s._formatBody(container, bodies)

        this.assertEqual(expected, result)
    }

    @targets('_getContentTypeConstraint')
    testGetContentTypeConstraintWithEmptyBody() {
        let s = this.__init()

        let body = new Body()

        let expected = null

        let result = s._getContentTypeConstraint(body)

        this.assertEqual(expected, result)
    }

    @targets('_getContentTypeConstraint')
    testGetContentTypeConstraintWithSimpleBody() {
        let s = this.__init()
        let body = new Body({
            constraints: new Immutable.List([
                new Parameter({
                    key: 'Content-Type',
                    type: 'string',
                    value: 'application/json'
                })
            ])
        })

        let expected = 'application/json'

        let result = s._getContentTypeConstraint(body)

        this.assertEqual(expected, result)
    }

    @targets('_getContentTypeConstraint')
    testGetContentTypeConstraintWithSimpleBody() {
        let s = this.__init()
        let body = new Body({
            constraints: new Immutable.List([
                new Parameter({
                    key: 'Expect',
                    type: 'string',
                    value: '100-continue'
                }),
                new Parameter({
                    key: 'Content-Type',
                    type: 'string',
                    value: 'application/json'
                }),
                new Parameter({
                    key: 'Warning',
                    type: 'string',
                    value: 'client-load:0.8'
                })
            ])
        })

        let expected = 'application/json'

        let result = s._getContentTypeConstraint(body)

        this.assertEqual(expected, result)
    }

    @targets('_formatSchemas')
    testFormatSchemas() {
        let s = this.__init()
        let references = new ReferenceContainer()
        references = references.update(
            new ExoticReference({
                uri: '/absolute/path/some-song.mp3',
                relative: 'some-song.mp3',
                resolved: true
            })
        ).update(
            new JSONSchemaReference({
                uri: '/absolute/path/current.json#/definitions/User',
                relative: '#/definitions/User',
                value: { test: 12 },
                resolved: true
            })
        ).update(
            new JSONSchemaReference({
                uri: '/absolute/path/other.json',
                relative: 'other.json',
                resolved: true
            })
        )

        const expected = {
            schemas: [
                {
                    'other.json': '!include other.json',
                    '#/definitions/User': { test: 12 }
                }
            ]
        }

        const result = s._formatSchemas(references)

        this.assertEqual(expected, result)
    }

    @targets('_formatResponses')
    testFormatResponsesCallsFormatBody() {
        let s = this.__init()

        let count = 0
        s.spyOn('_formatBody', () => {
            count += 1
            return {
                body: count
            }
        })

        let responses = new Immutable.List([
            new Response({
                code: 200
            }),
            new Response({
                code: 404
            })
        ])

        let expected = {
            responses: {
                200: 1,
                404: 2
            }
        }

        let result = s._formatResponses(responses)

        this.assertEqual(expected, result)
    }

    @targets('_formatResponses')
    testFormatResponsesAddsDescription() {
        let s = this.__init()

        let count = 0
        s.spyOn('_formatBody', () => {
            count += 1
            return {
                body: {
                    count: count
                }
            }
        })

        let responses = new Immutable.List([
            new Response({
                code: 200,
                description: 'basic'
            }),
            new Response({
                code: 404,
                description: 'other'
            })
        ])

        let expected = {
            responses: {
                200: {
                    count: 1,
                    description: 'basic'
                },
                404: {
                    count: 2,
                    description: 'other'
                }
            }
        }

        let result = s._formatResponses(responses)

        this.assertEqual(expected, result)
    }

    __init() {
        let serializer = new RAMLSerializer()
        return new ClassMock(serializer, '')
    }
}
