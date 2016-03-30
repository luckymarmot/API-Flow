import Immutable from 'immutable'

import Request, {
    KeyValue,
    Schema,
    SchemaReference,
    Response
} from '../../../../immutables/RESTRequest'
import { BasicAuth, ApiKeyAuth, OAuth2Auth } from '../../../../immutables/Auth'

export default class SwaggerFixtures {
    static getValidFilenames() {
        return [
            {
                name: 'basic-auth',
                extension: 'json'
            }, {
                name: 'basic-auth',
                extension: 'yaml'
            }, {
                name: 'pets',
                extension: 'json'
            }, {
                name: 'pets',
                extension: 'yaml'
            }, {
                name: 'security',
                extension: 'json'
            }, {
                name: 'security',
                extension: 'yaml'
            }, {
                name: 'uber',
                extension: 'json'
            }, {
                name: 'uber',
                extension: 'yaml'
            }
        ]
    }

    static getMalformedFilenames() {
        return [
            {
                name: 'badly-formed',
                extension: 'json'
            }, {
                name: 'badly-formed',
                extension: 'yaml'
            }
        ]
    }

    static getNonCompliantFilenames() {
        return [
            {
                name: 'bad-schema',
                extension: 'json'
            }, {
                name: 'bad-schema',
                extension: 'yaml'
            }
        ]
    }

    static getExtractParamsCases() {
        return [
            {
                name: 'NoArgsTest',
                inputs: [],
                output: [ [], [], [], undefined ]
            },
            {
                name: 'UndefinedDefaultValueWithTypeStringQueryFieldTest',
                inputs: [
                    [
                        {
                            in: 'query',
                            name: 'status',
                            description: 'Status values',
                            required: false,
                            type: 'string'
                        }
                    ]
                ],
                output: [
                    [],
                    [
                        new KeyValue({
                            key: 'status',
                            value: 'status',
                            valueType: 'string'
                        })
                    ],
                    [],
                    undefined
                ]
            },
            {
                name: 'DefaultValueSetWithTypeStringQueryFieldTest',
                inputs: [
                    [
                        {
                            in: 'query',
                            name: 'status',
                            description: 'Status values',
                            required: false,
                            type: 'string',
                            default: 'content'
                        }
                    ]
                ],
                output: [
                    [],
                    [
                        new KeyValue({
                            key: 'status',
                            value: 'content',
                            valueType: 'string'
                        })
                    ],
                    [],
                    undefined
                ]
            },
            {
                name: 'MultipleQueryFieldsTest',
                inputs: [
                    [
                        {
                            in: 'query',
                            name: 'status',
                            description: 'Status values',
                            required: false,
                            type: 'string'
                        },
                        {
                            in: 'query',
                            name: 'second',
                            description: 'Status values',
                            required: true,
                            type: 'string',
                            default: 'Ipsum'
                        }
                    ]
                ],
                output: [
                    [],
                    [
                        new KeyValue({
                            key: 'status',
                            value: 'status',
                            valueType: 'string'
                        }),
                        new KeyValue({
                            key: 'second',
                            value: 'Ipsum',
                            valueType: 'string'
                        })
                    ],
                    [],
                    undefined
                ]
            },
            {
                name: 'UndefinedDefaultValueWithTypeStringformDataFieldTest',
                inputs: [
                    [
                        {
                            in: 'formData',
                            name: 'name',
                            description: 'Updated name of the pet',
                            required: true,
                            type: 'string'
                        }
                    ]
                ],
                output: [
                    [],
                    [],
                    [
                        new KeyValue({
                            key: 'name',
                            value: 'name',
                            valueType: 'string'
                        })
                    ],
                    undefined
                ]
            },
            {
                name: 'DefaultValueSetWithTypeStringformDataFieldTest',
                inputs: [
                    [
                        {
                            in: 'formData',
                            name: 'name',
                            description: 'Updated name of the pet',
                            required: true,
                            type: 'string',
                            default: 'content'
                        }
                    ]
                ],
                output: [
                    [],
                    [],
                    [
                        new KeyValue({
                            key: 'name',
                            value: 'content',
                            valueType: 'string'
                        })
                    ],
                    undefined
                ]
            },
            {
                name: 'DefaultValueSetWithTypeNumberformDataFieldTest',
                inputs: [
                    [
                        {
                            in: 'formData',
                            name: 'count',
                            description: 'Updated name of the pet',
                            required: true,
                            type: 'number',
                            default: 1
                        }
                    ]
                ],
                output: [
                    [],
                    [],
                    [
                        new KeyValue({
                            key: 'count',
                            value: 1,
                            valueType: 'number'
                        })
                    ],
                    undefined
                ]
            },
            {
                name: 'SimpleBodyFieldTest',
                inputs: [
                    [
                        {
                            in: 'body',
                            name: 'body',
                            description: 'Pet object',
                            required: false,
                            schema: {
                                $ref: '#/definitions/Pet'
                            }
                        }
                    ]
                ],
                output: [
                    [],
                    [],
                    [],
                    new SchemaReference({
                        reference: '#/definitions/Pet'
                    })
                ]
            },
            {
                name: 'MultipleFormDataFieldsTest',
                inputs: [
                    [
                        {
                            in: 'formData',
                            name: 'status',
                            description: 'Status values',
                            required: false,
                            type: 'string'
                        },
                        {
                            in: 'formData',
                            name: 'second',
                            description: 'Status values',
                            required: true,
                            type: 'string',
                            default: 'Ipsum'
                        }
                    ]
                ],
                output: [
                    [],
                    [],
                    [
                        new KeyValue({
                            key: 'status', value: 'status', valueType: 'string'
                        }),
                        new KeyValue({
                            key: 'second', value: 'Ipsum', valueType: 'string'
                        })
                    ],
                    undefined
                ]
            },
            {
                name: 'UndefinedDefaultValueWithTypeStringHeaderFieldTest',
                inputs: [
                    [
                        {
                            in: 'header',
                            name: 'api_key',
                            description: '',
                            required: true,
                            type: 'string'
                        }
                    ]
                ],
                output: [
                    [
                        new KeyValue({
                            key: 'api_key',
                            value: 'api_key',
                            valueType: 'string'
                        })
                    ],
                    [],
                    [],
                    undefined
                ]
            },
            {
                name: 'DefaultValueSetWithTypeStringHeaderFieldTest',
                inputs: [
                    [
                        {
                            in: 'header',
                            name: 'api_key',
                            description: '',
                            required: true,
                            type: 'string',
                            default: 'content'
                        }
                    ]
                ],
                output: [
                    [
                        new KeyValue({
                            key: 'api_key',
                            value: 'content',
                            valueType: 'string'
                        })
                    ],
                    [],
                    [],
                    undefined
                ]
            },
            {
                name: 'MultipleFormDataFieldsTest',
                inputs: [
                    [
                        {
                            in: 'header',
                            name: 'status',
                            description: 'Status values',
                            required: false,
                            type: 'string'
                        },
                        {
                            in: 'header',
                            name: 'second',
                            description: 'Status values',
                            required: true,
                            type: 'string',
                            default: 'Ipsum'
                        }
                    ]
                ],
                output: [
                    [
                        new KeyValue({
                            key: 'status',
                            value: 'status',
                            valueType: 'string'
                        }),
                        new KeyValue({
                            key: 'second',
                            value: 'Ipsum',
                            valueType: 'string'
                        })
                    ],
                    [],
                    [],
                    undefined
                ]
            },
            {
                name: 'MixedFieldsTest',
                inputs: [
                    [
                        {
                            in: 'header',
                            name: 'api_key',
                            description: '',
                            required: true,
                            type: 'string'
                        },
                        {
                            in: 'formData',
                            name: 'status',
                            description: 'Status values',
                            required: false,
                            type: 'string'
                        },
                        {
                            in: 'query',
                            name: 'second',
                            description: 'Status values',
                            required: true,
                            type: 'string',
                            default: 'Ipsum'
                        }
                    ]
                ],
                output: [
                    [
                        new KeyValue({
                            key: 'api_key',
                            value: 'api_key',
                            valueType: 'string'
                        })
                    ],
                    [
                        new KeyValue({
                            key: 'second',
                            value: 'Ipsum',
                            valueType: 'string'
                        })
                    ],
                    [
                        new KeyValue({
                            key: 'status',
                            value: 'status',
                            valueType: 'string'
                        })
                    ],
                    undefined
                ]
            }
        ]
    }

    static getThrowingParametersCases() {
        return [
            {
                name: 'NoSchemaObjectInBodyFieldTest',
                inputs: [
                    [
                        {
                            in: 'body',
                            name: 'body',
                            description: 'Pet object',
                            required: false
                        }
                    ]
                ],
                output: undefined
            },
            {
                name: 'NoRefObjectInSchemaInBodyFieldTest',
                inputs: [
                    [
                        {
                            in: 'body',
                            name: 'body',
                            description: 'Pet object',
                            required: false,
                            schema: {
                                useless: 'stuff'
                            }
                        }
                    ]
                ],
                output: undefined
            }
        ]
    }

    static getExtractResponsesCases() {
        return [
            {
                name: 'NoArgsTest',
                inputs: [],
                output: []
            },
            {
                name: 'UndefinedResponsesObjectTest',
                inputs: [
                    undefined
                ],
                output: []
            },
            {
                name: 'SingleCodeTest',
                inputs: [
                    {
                        200: {}
                    }
                ],
                output: [
                    new Response({
                        code: '200'
                    })
                ]
            },
            {
                name: 'MultipleCodeTest',
                inputs: [
                    {
                        200: {},
                        400: {}
                    }
                ],
                output: [
                    new Response({
                        code: '200'
                    }),
                    new Response({
                        code: '400'
                    })
                ]
            },
            {
                name: 'DescriptionInResponseTest',
                inputs: [
                    {
                        200: {
                            description: 'dummy description'
                        }
                    }
                ],
                output: [
                    new Response({
                        code: '200',
                        description: 'dummy description'
                    })
                ]
            },
            {
                name: 'SchemaInResponseTest',
                inputs: [
                    {
                        200: {
                            schema: {
                                type: 'array',
                                items: {
                                    $ref: '#/definitions/Pet'
                                }
                            }
                        }
                    }
                ],
                output: [
                    new Response({
                        code: '200',
                        schema: (new Schema()).mergeSchema(
                            {
                                type: 'array',
                                items: {
                                    $ref: '#/definitions/Pet'
                                }
                            }
                        )
                    })
                ]
            }
        ]
    }

    static getGenerateURLCases() {
        return [
            {
                name: 'SimpleTest',
                inputs: [
                    {
                    },
                    '/test/path',
                    []
                ],
                output: 'http://localhost/test/path'
            },
            {
                name: 'DefinedSchemeTest',
                inputs: [
                    {
                        schemes: [
                            'smtp',
                            'https'
                        ]
                    },
                    '/test/path',
                    []
                ],
                output: 'smtp://localhost/test/path'
            },
            {
                name: 'DefinedHostTest',
                inputs: [
                    {
                        host: [
                            'test.luckymarmot.com'
                        ]
                    },
                    '/test/path',
                    []
                ],
                output: 'http://test.luckymarmot.com/test/path'
            },
            {
                name: 'DefinedBasePathWithNoSlashesTest',
                inputs: [
                    {
                        basePath: '~test'
                    },
                    '/simple/path',
                    []
                ],
                output: 'http://localhost/~test/simple/path'
            },
            {
                name: 'DefinedBasePathStartingWithSlashTest',
                inputs: [
                    {
                        basePath: '/~test'
                    },
                    '/simple/path',
                    []
                ],
                output: 'http://localhost/~test/simple/path'
            },
            {
                name: 'DefinedBasePathEndingWithSlashTest',
                inputs: [
                    {
                        basePath: '~test/'
                    },
                    '/simple/path',
                    []
                ],
                output: 'http://localhost/~test/simple/path'
            },
            {
                name: 'DefinedSingleQueryTest',
                inputs: [
                    {},
                    '/simple/path',
                    [
                        new KeyValue({
                            key: 'test',
                            value: 'content'
                        })
                    ]
                ],
                output: 'http://localhost/simple/path?test=content'
            },
            {
                name: 'DefinedMultipleQueryTest',
                inputs: [
                    {},
                    '/simple/path',
                    [
                        new KeyValue({
                            key: 'test',
                            value: 'c'
                        }),
                        new KeyValue({
                            key: 's'
                        }),
                        new KeyValue({
                            key: 'third',
                            value: 'rand'
                        })
                    ]
                ],
                output: 'http://localhost/simple/path?test=c&s=&third=rand'
            }
        ]
    }

    static getSetBasicInfoCases() {
        return [
            {
                name: 'SimpleTest',
                inputs: [
                    new Request(),
                    'http://localhost/test/path',
                    'get',
                    [],
                    []
                ],
                output: new Request({
                    url: 'http://localhost/test/path',
                    method: 'GET'
                })
            },
            {
                name: 'PreservesRequestDataTest',
                inputs: [
                    new Request({
                        name: '/test/path',
                        description: 'dummy description'
                    }),
                    'http://localhost/test/path',
                    'get',
                    [],
                    []
                ],
                output: new Request({
                    name: '/test/path',
                    description: 'dummy description',
                    url: 'http://localhost/test/path',
                    method: 'GET'
                })
            },
            {
                name: 'AddsHeaderTest',
                inputs: [
                    new Request({
                        name: '/test/path',
                        description: 'dummy description'
                    }),
                    'http://localhost/test/path',
                    'get',
                    [
                        new KeyValue({
                            key: 'test',
                            value: 'dummy',
                            valueType: 'string'
                        }),
                        new KeyValue({
                            key: 'second',
                            value: 'Ipsum',
                            valueType: 'string'
                        })
                    ],
                    []
                ],
                output: new Request({
                    name: '/test/path',
                    description: 'dummy description',
                    url: 'http://localhost/test/path',
                    method: 'GET',
                    headers: new Immutable.OrderedMap({
                        test: 'dummy',
                        second: 'Ipsum'
                    })
                })
            },
            {
                name: 'AddsResponsesTest',
                inputs: [
                    new Request({
                        name: '/test/path',
                        description: 'dummy description'
                    }),
                    'http://localhost/test/path',
                    'get',
                    [],
                    [
                        new Response(),
                        new Response({
                            description: 'dummy description'
                        })
                    ]
                ],
                output: new Request({
                    name: '/test/path',
                    description: 'dummy description',
                    url: 'http://localhost/test/path',
                    method: 'GET',
                    responses: new Immutable.List([
                        new Response(),
                        new Response({
                            description: 'dummy description'
                        })
                    ])
                })
            }
        ]
    }

    static getSetBodyCases() {
        return [
            {
                name: 'SimpleTest',
                inputs: [
                    new Request(),
                    {},
                    undefined,
                    [],
                    undefined
                ],
                output: new Request()
            },
            {
                name: 'WithBodyTest',
                inputs: [
                    new Request(),
                    {},
                    new SchemaReference({
                        reference: '#/definitions/Test'
                    }),
                    [],
                    undefined
                ],
                output: new Request({
                    bodyType: 'schema',
                    body: new SchemaReference({
                        reference: '#/definitions/Test'
                    })
                })
            },
            {
                name: 'WithFormDataAsURLEncodedTest',
                inputs: [
                    new Request(),
                    {},
                    undefined,
                    [
                        new KeyValue({
                            key: 'test',
                            value: 'dummy',
                            valueType: 'string'
                        })
                    ],
                    {}
                ],
                output: new Request({
                    body: Immutable.List([
                        new KeyValue({
                            key: 'test',
                            value: 'dummy',
                            valueType: 'string'
                        })
                    ])
                })
            }
        ]
    }

    static getSetAuthCases() {
        return [
            {
                name: 'SimpleTest',
                inputs: [
                    new Request(),
                    {},
                    {}
                ],
                output: new Request()
            },
            {
                name: 'BasicAuthTest',
                inputs: [
                    new Request(),
                    {
                        securityDefinitions: {
                            basicAuth: {
                                type: 'basic',
                                description: 'HTTP Basic Authentication'
                            }
                        }
                    },
                    {
                        security: [
                            {
                                basicAuth: []
                            }
                        ]
                    }
                ],
                output: new Request({
                    auth: new BasicAuth()
                })
            },
            {
                name: 'ApiKeyAuthTest',
                inputs: [
                    new Request(),
                    {
                        securityDefinitions: {
                            api_key: {
                                type: 'apiKey',
                                name: 'api_key',
                                in: 'header'
                            }
                        }
                    },
                    {
                        security: [
                            {
                                api_key: []
                            }
                        ]
                    }
                ],
                output: new Request({
                    auth: new ApiKeyAuth({
                        name: 'api_key',
                        in: 'header'
                    })
                })
            },
            {
                name: 'OAuth2AuthTest',
                inputs: [
                    new Request(),
                    {
                        securityDefinitions: {
                            petstore_auth: {
                                type: 'oauth2',
                                authorizationUrl: 'http://s.com/oauth',
                                flow: 'implicit',
                                scopes: {
                                    write_pets: 'modify pets in your account',
                                    read_pets: 'read your pets'
                                }
                            }
                        }
                    },
                    {
                        security: [
                            {
                                petstore_auth: [
                                    'write_pets',
                                    'read_pets'
                                ]
                            }
                        ]
                    }
                ],
                output: new Request({
                    auth: new OAuth2Auth({
                        flow: 'implicit',
                        authorizationUrl: 'http://s.com/oauth'
                    })
                })
            }
        ]
    }

    static getCreateRequestCases() {
        return [
            {
                name: 'SimpleTest',
                inputs: [
                    {},
                    '/test/path',
                    'get',
                    {}
                ],
                output: new Request({
                    name: '/test/path',
                    url: 'http://localhost/test/path',
                    method: 'GET'
                })
            }
        ]
    }
}
