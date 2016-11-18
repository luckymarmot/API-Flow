import Immutable from 'immutable'

import Constraint from '../../../../../models/Constraint'

import {
    Context,
    Parameter,
    ParameterContainer,
    Response,
    Body
} from '../../../../../models/Core'

import Request from '../../../../../models/Request'
import Auth from '../../../../../models/Auth'
import URL from '../../../../../models/URL'
import JSONSchemaReference from '../../../../../models/references/JSONSchema'

/* eslint-disable no-undefined */

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
                output: new ParameterContainer()
            },
            {
                name: 'UndefinedDefaultValueWithTypeStringQueryFieldTest',
                inputs: [
                    null,
                    {
                        parameters: [
                            {
                                in: 'query',
                                name: 'status',
                                description: 'Status values',
                                required: false,
                                type: 'string'
                            }
                        ]
                    }
                ],
                output: new ParameterContainer({
                    queries: new Immutable.List([
                        new Parameter({
                            key: 'status',
                            name: 'status',
                            type: 'string',
                            description: 'Status values'
                        })
                    ])
                })
            },
            {
                name: 'DefaultValueSetWithTypeStringQueryFieldTest',
                inputs: [
                    null,
                    {
                        parameters: [
                            {
                                in: 'query',
                                name: 'status',
                                description: 'Status values',
                                required: false,
                                type: 'string',
                                default: 'content'
                            }
                        ]
                    }
                ],
                output: new ParameterContainer({
                    queries: new Immutable.List([
                        new Parameter({
                            key: 'status',
                            name: 'status',
                            value: 'content',
                            type: 'string',
                            description: 'Status values'
                        })
                    ])
                })
            },
            {
                name: 'MultipleQueryFieldsTest',
                inputs: [
                    null,
                    {
                        parameters: [
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
                    }
                ],
                output: new ParameterContainer({
                    queries: new Immutable.List([
                        new Parameter({
                            key: 'status',
                            name: 'status',
                            type: 'string',
                            description: 'Status values'
                        }),
                        new Parameter({
                            key: 'second',
                            name: 'second',
                            value: 'Ipsum',
                            type: 'string',
                            required: true,
                            description: 'Status values'
                        })
                    ])
                })
            },
            {
                name: 'ConsumesValuesCreateHeaders',
                inputs: [
                    null,
                    {
                        consumes: [ 'application/x-www-form-urlencoded' ]
                    }
                ],
                output: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            type: 'string',
                            value: 'application/x-www-form-urlencoded',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'application/x-www-form-urlencoded'
                                ])
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
            },
            {
                name: 'MultipleConsumesValuesCreateMultipleHeaders',
                inputs: [
                    null,
                    {
                        consumes: [
                            'application/x-www-form-urlencoded',
                            'multipart/form-data'
                        ]
                    }
                ],
                output: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            type: 'string',
                            value: 'application/x-www-form-urlencoded',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'application/x-www-form-urlencoded'
                                ])
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
                        }),
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            type: 'string',
                            value: 'multipart/form-data',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'multipart/form-data'
                                ])
                            ]),
                            externals: new Immutable.List([
                                new Parameter({
                                    key: 'Content-Type',
                                    type: 'string',
                                    internals: new Immutable.List([
                                        new Constraint.Enum([
                                            'multipart/form-data'
                                        ])
                                    ])
                                })
                            ])
                        })
                    ])
                })
            },
            {
                name: 'UndefinedDefaultValueWithTypeStringformDataFieldTest',
                inputs: [
                    null,
                    {
                        consumes: [ 'application/x-www-form-urlencoded' ],
                        parameters: [
                            {
                                in: 'formData',
                                name: 'name',
                                description: 'Updated name of the pet',
                                required: true,
                                type: 'string'
                            }
                        ]
                    }
                ],
                output: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            type: 'string',
                            value: 'application/x-www-form-urlencoded',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'application/x-www-form-urlencoded'
                                ])
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
                    ]),
                    body: new Immutable.List([
                        new Parameter({
                            key: 'name',
                            name: 'name',
                            type: 'string',
                            description: 'Updated name of the pet',
                            required: true,
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
            },
            {
                name: 'DefaultValueSetWithTypeStringformDataFieldTest',
                inputs: [
                    null,
                    {
                        consumes: [
                            'application/x-www-form-urlencoded',
                            'multipart/form-data'
                        ],
                        parameters: [
                            {
                                in: 'formData',
                                name: 'name',
                                description: 'Updated name of the pet',
                                required: true,
                                type: 'string',
                                default: 'content'
                            }
                        ]
                    }
                ],
                output: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            type: 'string',
                            value: 'application/x-www-form-urlencoded',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'application/x-www-form-urlencoded'
                                ])
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
                        }),
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            type: 'string',
                            value: 'multipart/form-data',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'multipart/form-data'
                                ])
                            ]),
                            externals: new Immutable.List([
                                new Parameter({
                                    key: 'Content-Type',
                                    type: 'string',
                                    internals: new Immutable.List([
                                        new Constraint.Enum([
                                            'multipart/form-data'
                                        ])
                                    ])
                                })
                            ])
                        })
                    ]),
                    body: new Immutable.List([
                        new Parameter({
                            key: 'name',
                            name: 'name',
                            value: 'content',
                            type: 'string',
                            description: 'Updated name of the pet',
                            required: true,
                            externals: new Immutable.List([
                                new Parameter({
                                    key: 'Content-Type',
                                    type: 'string',
                                    internals: new Immutable.List([
                                        new Constraint.Enum([
                                            'application/x-www-form-urlencoded',
                                            'multipart/form-data'
                                        ])
                                    ])
                                })
                            ])
                        })
                    ])
                })
            },
            {
                name: 'SimpleBodyFieldTest',
                inputs: [
                    null,
                    {
                        parameters: [
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
                    }
                ],
                output: new ParameterContainer({
                    body: new Immutable.List([
                        new Parameter({
                            name: 'body',
                            value: new JSONSchemaReference({
                                uri: '#/definitions/Pet',
                                relative: '#/definitions/Pet',
                                resolved: true,
                                value: null,
                                raw: {
                                    $ref: '#/definitions/Pet'
                                }
                            }),
                            type: 'reference',
                            description: 'Pet object'
                        })
                    ])
                })
            },
            {
                name: 'MultipleFormDataFieldsTest',
                inputs: [
                    null,
                    {
                        consumes: [
                            'application/x-www-form-urlencoded',
                            'multipart/form-data'
                        ],
                        parameters: [
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
                    }
                ],
                output: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            type: 'string',
                            value: 'application/x-www-form-urlencoded',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'application/x-www-form-urlencoded'
                                ])
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
                        }),
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            type: 'string',
                            value: 'multipart/form-data',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'multipart/form-data'
                                ])
                            ]),
                            externals: new Immutable.List([
                                new Parameter({
                                    key: 'Content-Type',
                                    type: 'string',
                                    internals: new Immutable.List([
                                        new Constraint.Enum([
                                            'multipart/form-data'
                                        ])
                                    ])
                                })
                            ])
                        })
                    ]),
                    body: new Immutable.List([
                        new Parameter({
                            key: 'status',
                            name: 'status',
                            type: 'string',
                            description: 'Status values',
                            externals: new Immutable.List([
                                new Parameter({
                                    key: 'Content-Type',
                                    type: 'string',
                                    internals: new Immutable.List([
                                        new Constraint.Enum([
                                            'application/x-www-form-urlencoded',
                                            'multipart/form-data'
                                        ])
                                    ])
                                })
                            ])
                        }),
                        new Parameter({
                            key: 'second',
                            name: 'second',
                            value: 'Ipsum',
                            type: 'string',
                            description: 'Status values',
                            required: true,
                            externals: new Immutable.List([
                                new Parameter({
                                    key: 'Content-Type',
                                    type: 'string',
                                    internals: new Immutable.List([
                                        new Constraint.Enum([
                                            'application/x-www-form-urlencoded',
                                            'multipart/form-data'
                                        ])
                                    ])
                                })
                            ])
                        })
                    ])
                })
            },
            {
                name: 'UndefinedDefaultValueWithTypeStringHeaderFieldTest',
                inputs: [
                    null,
                    {
                        parameters: [
                            {
                                in: 'header',
                                name: 'api_key',
                                description: '',
                                required: true,
                                type: 'string'
                            }
                        ]
                    }
                ],
                output: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'api_key',
                            name: 'api_key',
                            type: 'string',
                            required: true
                        })
                    ])
                })
            },
            {
                name: 'DefaultValueSetWithTypeStringHeaderFieldTest',
                inputs: [
                    null,
                    {
                        parameters: [
                            {
                                in: 'header',
                                name: 'api_key',
                                description: '',
                                required: true,
                                type: 'string',
                                default: 'content'
                            }
                        ]
                    }
                ],
                output: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'api_key',
                            name: 'api_key',
                            value: 'content',
                            type: 'string',
                            required: true
                        })
                    ])
                })
            },
            {
                name: 'ConsumesAreCombinedWithHeaders',
                inputs: [
                    null,
                    {
                        consumes: [ 'application/json' ],
                        parameters: [
                            {
                                in: 'header',
                                name: 'api_key',
                                description: '',
                                required: true,
                                type: 'string',
                                default: 'content'
                            }
                        ]
                    }
                ],
                output: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            type: 'string',
                            value: 'application/json',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'application/json'
                                ])
                            ]),
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
                            key: 'api_key',
                            name: 'api_key',
                            value: 'content',
                            type: 'string',
                            required: true,
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
            },
            {
                name: 'MultipleFormDataFieldsTest',
                inputs: [
                    null,
                    {
                        consumes: [ 'application/json' ],
                        parameters: [
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
                    }
                ],
                output: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            type: 'string',
                            value: 'application/json',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'application/json'
                                ])
                            ]),
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
                            key: 'status',
                            name: 'status',
                            type: 'string',
                            description: 'Status values',
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
                            key: 'second',
                            name: 'second',
                            value: 'Ipsum',
                            type: 'string',
                            description: 'Status values',
                            required: true,
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
            },
            {
                name: 'MixedFieldsTest',
                inputs: [
                    null,
                    {
                        consumes: [
                            'application/x-www-form-urlencoded',
                            'multipart/form-data'
                        ],
                        parameters: [
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
                            },
                            {
                                in: 'path',
                                name: 'userId',
                                description: 'a user Id',
                                required: true,
                                type: 'string'
                            }
                        ]
                    }
                ],
                output: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            type: 'string',
                            value: 'application/x-www-form-urlencoded',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'application/x-www-form-urlencoded'
                                ])
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
                        }),
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            type: 'string',
                            value: 'multipart/form-data',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'multipart/form-data'
                                ])
                            ]),
                            externals: new Immutable.List([
                                new Parameter({
                                    key: 'Content-Type',
                                    type: 'string',
                                    internals: new Immutable.List([
                                        new Constraint.Enum([
                                            'multipart/form-data'
                                        ])
                                    ])
                                })
                            ])
                        }),
                        new Parameter({
                            key: 'api_key',
                            name: 'api_key',
                            type: 'string',
                            required: true,
                            externals: new Immutable.List([
                                new Parameter({
                                    key: 'Content-Type',
                                    type: 'string',
                                    internals: new Immutable.List([
                                        new Constraint.Enum([
                                            'application/x-www-form-urlencoded',
                                            'multipart/form-data'
                                        ])
                                    ])
                                })
                            ])
                        })
                    ]),
                    queries: new Immutable.List([
                        new Parameter({
                            key: 'second',
                            name: 'second',
                            type: 'string',
                            value: 'Ipsum',
                            description: 'Status values',
                            required: true,
                            externals: new Immutable.List([
                                new Parameter({
                                    key: 'Content-Type',
                                    type: 'string',
                                    internals: new Immutable.List([
                                        new Constraint.Enum([
                                            'application/x-www-form-urlencoded',
                                            'multipart/form-data'
                                        ])
                                    ])
                                })
                            ])
                        })
                    ]),
                    body: new Immutable.List([
                        new Parameter({
                            key: 'status',
                            name: 'status',
                            type: 'string',
                            description: 'Status values',
                            externals: new Immutable.List([
                                new Parameter({
                                    key: 'Content-Type',
                                    type: 'string',
                                    internals: new Immutable.List([
                                        new Constraint.Enum([
                                            'application/x-www-form-urlencoded',
                                            'multipart/form-data'
                                        ])
                                    ])
                                })
                            ])
                        })
                    ]),
                    path: new Immutable.List([
                        new Parameter({
                            key: 'userId',
                            name: 'userId',
                            type: 'string',
                            description: 'a user Id',
                            required: true,
                            externals: new Immutable.List([
                                new Parameter({
                                    key: 'Content-Type',
                                    type: 'string',
                                    internals: new Immutable.List([
                                        new Constraint.Enum([
                                            'application/x-www-form-urlencoded',
                                            'multipart/form-data'
                                        ])
                                    ])
                                })
                            ])
                        })
                    ])
                })
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
                    null,
                    {
                        responses: {
                            200: {}
                        }
                    }
                ],
                output: new Immutable.List([
                    new Response({
                        code: '200'
                    })
                ])
            },
            {
                name: 'MultipleCodeTest',
                inputs: [
                    null,
                    {
                        responses: {
                            200: {},
                            400: {}
                        }
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
                    null,
                    {
                        responses: {
                            200: {
                                description: 'dummy description'
                            }
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
                    null,
                    {
                        responses: {
                            200: {
                                schema: {
                                    type: 'array',
                                    items: {
                                        $ref: '#/definitions/Pet'
                                    }
                                }
                            }
                        }
                    }
                ],
                output: [
                    new Response({
                        code: '200',
                        parameters: new ParameterContainer({
                            body: new Immutable.List([
                                new Parameter({
                                    type: 'reference',
                                    name: 'body',
                                    value: new JSONSchemaReference({
                                        uri: '',
                                        relative: '',
                                        resolved: true,
                                        value: {
                                            type: 'array',
                                            items: {
                                                $ref: new JSONSchemaReference({
                                                    uri: '#/definitions/Pet'
                                                })
                                            }
                                        },
                                        dependencies: new Immutable.List([
                                            new JSONSchemaReference({
                                                uri: '#/definitions/Pet',
                                                relative: '#/definitions/Pet'
                                            })
                                        ])
                                    })
                                })
                            ])
                        })
                    })
                ]
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
                    'get'
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
                    new ParameterContainer(),
                    new Immutable.List(),
                    new Immutable.List()
                ],
                output: new Request({
                    name: '/test/path',
                    description: 'dummy description',
                    url: 'http://localhost/test/path',
                    method: 'GET'
                })
            },
            {
                name: 'AddsAllTest',
                inputs: [
                    new Request({
                        name: '/test/path',
                        description: 'dummy description'
                    }),
                    'http://localhost/test/path',
                    'get',
                    new ParameterContainer({
                        headers: new Immutable.List([
                            new Parameter({
                                key: 'api_key',
                                value: 'api_key',
                                type: 'string'
                            })
                        ])
                    }),
                    new Immutable.List([
                        new Body({
                            type: 'urlEncoded',
                            constraints: new Immutable.List([
                                new Parameter({
                                    key: 'Content-Type',
                                    value: 'x-www-form-urlencoded'
                                })
                            ])
                        })
                    ]),
                    new Immutable.List([
                        new Response({
                            code: 200,
                            description: 'standard response'
                        })
                    ])
                ],
                output: new Request({
                    name: '/test/path',
                    description: 'dummy description',
                    url: 'http://localhost/test/path',
                    method: 'GET',
                    parameters: new ParameterContainer({
                        headers: new Immutable.List([
                            new Parameter({
                                key: 'api_key',
                                value: 'api_key',
                                type: 'string'
                            })
                        ])
                    }),
                    bodies: new Immutable.List([
                        new Body({
                            type: 'urlEncoded',
                            constraints: new Immutable.List([
                                new Parameter({
                                    key: 'Content-Type',
                                    value: 'x-www-form-urlencoded'
                                })
                            ])
                        })
                    ]),
                    responses: new Immutable.List([
                        new Response({
                            code: 200,
                            description: 'standard response'
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
                    auths: new Immutable.List([
                        new Auth.Basic({ authName: 'basicAuth' })
                    ])
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
                    auths: new Immutable.List([
                        new Auth.ApiKey({
                            authName: 'api_key',
                            name: 'api_key',
                            in: 'header'
                        })
                    ])
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
                    auths: new Immutable.List([
                        new Auth.OAuth2({
                            authName: 'petstore_auth',
                            flow: 'implicit',
                            authorizationUrl: 'http://s.com/oauth',
                            scopes: new Immutable.List(
                                [ 'write_pets', 'read_pets' ]
                            )
                        })
                    ])
                })
            },
            {
                name: 'MultipleAuthsTest',
                inputs: [
                    new Request(),
                    {
                        securityDefinitions: {
                            api_key: {
                                type: 'apiKey',
                                name: 'api_key',
                                in: 'header'
                            },
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
                            },
                            {
                                api_key: []
                            }
                        ]
                    }
                ],
                output: new Request({
                    auths: new Immutable.List([
                        new Auth.Basic({ authName: 'basicAuth' }),
                        new Auth.ApiKey({
                            authName: 'api_key',
                            name: 'api_key',
                            in: 'header'
                        })
                    ])
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
                    url: new URL({
                        protocol: new Parameter({
                            key: 'protocol',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'http'
                                ])
                            ])
                        }),
                        host: new Parameter({
                            key: 'host',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'localhost'
                                ])
                            ])
                        }),
                        pathname: new Parameter({
                            key: 'pathname',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    '/test/path'
                                ])
                            ])
                        })
                    }),
                    method: 'GET'
                })
            }
        ]
    }

    static parseCase() {
        return new Context({

        })
    }
}

/* eslint-enabled no-undefined */
