import Immutable from 'immutable'

import Context, {
    Body,
    Response,
    Parameter,
    ParameterContainer
} from '../../../../models/Core'

import Request from '../../../../models/Core'

import {
    Group,
    Info,
    URL,
    Schema,
    SchemaReference
} from '../../../../models/Utils'

import Constraint from '../../../../models/Constraint'

/* eslint-disable max-len */
const context = new Context({
    schema: new Schema({
        uri: '#',
        value: null,
        map: new Immutable.OrderedMap({
            swagger: new Schema({
                uri: '#/swagger',
                value: '2.0',
                map: null,
                raw: null
            }),
            info: new Schema({
                uri: '#/info',
                value: null,
                map: new Immutable.OrderedMap({
                    title: new Schema({
                        uri: '#/info/title',
                        value: 'Uber API',
                        map: null,
                        raw: null
                    }),
                    description: new Schema({
                        uri: '#/info/description',
                        value: 'Move your app forward with the Uber API',
                        map: null,
                        raw: null
                    }),
                    version: new Schema({
                        uri: '#/info/version',
                        value: '1.0.0',
                        map: null,
                        raw: null
                    })
                }),
                raw: null
            }),
            host: new Schema({
                uri: '#/host',
                value: 'api.uber.com',
                map: null,
                raw: null
            }),
            schemes: new Schema({
                uri: '#/schemes',
                value: null,
                map: new Immutable.List([ new Schema({
                    uri: '#/schemes/0',
                    value: 'https',
                    map: null,
                    raw: null
                }) ]),
                raw: null
            }),
            basePath: new Schema({
                uri: '#/basePath',
                value: '/v1',
                map: null,
                raw: null
            }),
            produces: new Schema({
                uri: '#/produces',
                value: null,
                map: new Immutable.List([ new Schema({
                    uri: '#/produces/0',
                    value: 'application/json',
                    map: null,
                    raw: null
                }) ]),
                raw: null
            }),
            paths: new Schema({
                uri: '#/paths',
                value: null,
                map: new Immutable.OrderedMap({
                    '/products': new Schema({
                        uri: '#/paths/~1products',
                        value: null,
                        map: new Immutable.OrderedMap({
                            get: new Schema({
                                uri: '#/paths/~1products/get',
                                value: null,
                                map: new Immutable.OrderedMap({
                                    summary: new Schema({
                                        uri: '#/paths/~1products/get/summary',
                                        value: 'Product Types',
                                        map: null,
                                        raw: null
                                    }),
                                    description: new Schema({
                                        uri: '#/paths/~1products/get/description',
                                        value: 'The Products endpoint returns information about the *Uber* products\noffered at a given location. The response includes the display name\nand other details about each product, and lists the products in the\nproper display order.\n',
                                        map: null,
                                        raw: null
                                    }),
                                    parameters: new Schema({
                                        uri: '#/paths/~1products/get/parameters',
                                        value: null,
                                        map: new Immutable.List([ new Schema({
                                            uri: '#/paths/~1products/get/parameters/0',
                                            value: null,
                                            map: new Immutable.OrderedMap({
                                                name: new Schema({
                                                    uri: '#/paths/~1products/get/parameters/0/name',
                                                    value: 'latitude',
                                                    map: null,
                                                    raw: null
                                                }),
                                                in: new Schema({
                                                    uri: '#/paths/~1products/get/parameters/0/in',
                                                    value: 'query',
                                                    map: null,
                                                    raw: null
                                                }),
                                                description: new Schema({
                                                    uri: '#/paths/~1products/get/parameters/0/description',
                                                    value: 'Latitude component of location.',
                                                    map: null,
                                                    raw: null
                                                }),
                                                required: new Schema({
                                                    uri: '#/paths/~1products/get/parameters/0/required',
                                                    value: true,
                                                    map: null,
                                                    raw: null
                                                }),
                                                type: new Schema({
                                                    uri: '#/paths/~1products/get/parameters/0/type',
                                                    value: 'number',
                                                    map: null,
                                                    raw: null
                                                }),
                                                format: new Schema({
                                                    uri: '#/paths/~1products/get/parameters/0/format',
                                                    value: 'double',
                                                    map: null,
                                                    raw: null
                                                })
                                            }),
                                            raw: null
                                        }), new Schema({
                                            uri: '#/paths/~1products/get/parameters/0',
                                            value: null,
                                            map: new Immutable.OrderedMap({
                                                name: new Schema({
                                                    uri: '#/paths/~1products/get/parameters/0/name',
                                                    value: 'longitude',
                                                    map: null,
                                                    raw: null
                                                }),
                                                in: new Schema({
                                                    uri: '#/paths/~1products/get/parameters/0/in',
                                                    value: 'query',
                                                    map: null,
                                                    raw: null
                                                }),
                                                description: new Schema({
                                                    uri: '#/paths/~1products/get/parameters/0/description',
                                                    value: 'Longitude component of location.',
                                                    map: null,
                                                    raw: null
                                                }),
                                                required: new Schema({
                                                    uri: '#/paths/~1products/get/parameters/0/required',
                                                    value: true,
                                                    map: null,
                                                    raw: null
                                                }),
                                                type: new Schema({
                                                    uri: '#/paths/~1products/get/parameters/0/type',
                                                    value: 'number',
                                                    map: null,
                                                    raw: null
                                                }),
                                                format: new Schema({
                                                    uri: '#/paths/~1products/get/parameters/0/format',
                                                    value: 'double',
                                                    map: null,
                                                    raw: null
                                                })
                                            }),
                                            raw: null
                                        }) ]),
                                        raw: null
                                    }),
                                    tags: new Schema({
                                        uri: '#/paths/~1products/get/tags',
                                        value: null,
                                        map: new Immutable.List([ new Schema({
                                            uri: '#/paths/~1products/get/tags/0',
                                            value: 'Products',
                                            map: null,
                                            raw: null
                                        }) ]),
                                        raw: null
                                    }),
                                    responses: new Schema({
                                        uri: '#/paths/~1products/get/responses',
                                        value: null,
                                        map: new Immutable.OrderedMap({
                                            200: new Schema({
                                                uri: '#/paths/~1products/get/responses/200',
                                                value: null,
                                                map: new Immutable.OrderedMap({
                                                    description: new Schema({
                                                        uri: '#/paths/~1products/get/responses/200/description',
                                                        value: 'An array of products',
                                                        map: null,
                                                        raw: null
                                                    }),
                                                    schema: new Schema({
                                                        uri: '#/paths/~1products/get/responses/200/schema',
                                                        value: null,
                                                        map: new Immutable.OrderedMap({
                                                            type: new Schema({
                                                                uri: '#/paths/~1products/get/responses/200/schema/type',
                                                                value: 'array',
                                                                map: null,
                                                                raw: null
                                                            }),
                                                            items: new Schema({
                                                                uri: '#/paths/~1products/get/responses/200/schema/items',
                                                                value: null,
                                                                map: new Immutable.OrderedMap({
                                                                    $ref: new SchemaReference({
                                                                        reference: '#/definitions/Product',
                                                                        resolved: false,
                                                                        value: null
                                                                    })
                                                                }),
                                                                raw: null
                                                            })
                                                        }),
                                                        raw: null
                                                    })
                                                }),
                                                raw: null
                                            }),
                                            default: new Schema({
                                                uri: '#/paths/~1products/get/responses/default',
                                                value: null,
                                                map: new Immutable.OrderedMap({
                                                    description: new Schema({
                                                        uri: '#/paths/~1products/get/responses/default/description',
                                                        value: 'Unexpected error',
                                                        map: null,
                                                        raw: null
                                                    }),
                                                    schema: new Schema({
                                                        uri: '#/paths/~1products/get/responses/default/schema',
                                                        value: null,
                                                        map: new Immutable.OrderedMap({
                                                            $ref: new SchemaReference({
                                                                reference: '#/definitions/Error',
                                                                resolved: false,
                                                                value: null
                                                            })
                                                        }),
                                                        raw: null
                                                    })
                                                }),
                                                raw: null
                                            })
                                        }),
                                        raw: null
                                    })
                                }),
                                raw: null
                            })
                        }),
                        raw: null
                    }),
                    '/estimates/price': new Schema({
                        uri: '#/paths/~1estimates/price',
                        value: null,
                        map: new Immutable.OrderedMap({
                            get: new Schema({
                                uri: '#/paths/~1estimates/price/get',
                                value: null,
                                map: new Immutable.OrderedMap({
                                    summary: new Schema({
                                        uri: '#/paths/~1estimates/price/get/summary',
                                        value: 'Price Estimates',
                                        map: null,
                                        raw: null
                                    }),
                                    description: new Schema({
                                        uri: '#/paths/~1estimates/price/get/description',
                                        value: 'The Price Estimates endpoint returns an estimated price range\nfor each product offered at a given location. The price estimate is\nprovided as a formatted string with the full price range and the localized\ncurrency symbol.<br><br>The response also includes low and high estimates,\nand the ([ ISO 4217 ])(http://en.wikipedia.org/wiki/ISO_4217) currency code for\nsituations requiring currency conversion. When surge is active for a particular\nproduct, its surge_multiplier will be greater than 1, but the price estimate\nalready factors in this multiplier.\n',
                                        map: null,
                                        raw: null
                                    }),
                                    parameters: new Schema({
                                        uri: '#/paths/~1estimates/price/get/parameters',
                                        value: null,
                                        map: new Immutable.List([ new Schema({
                                            uri: '#/paths/~1estimates/price/get/parameters/0',
                                            value: null,
                                            map: new Immutable.OrderedMap({
                                                name: new Schema({
                                                    uri: '#/paths/~1estimates/price/get/parameters/0/name',
                                                    value: 'start_latitude',
                                                    map: null,
                                                    raw: null
                                                }),
                                                in: new Schema({
                                                    uri: '#/paths/~1estimates/price/get/parameters/0/in',
                                                    value: 'query',
                                                    map: null,
                                                    raw: null
                                                }),
                                                description: new Schema({
                                                    uri: '#/paths/~1estimates/price/get/parameters/0/description',
                                                    value: 'Latitude component of start location.',
                                                    map: null,
                                                    raw: null
                                                }),
                                                required: new Schema({
                                                    uri: '#/paths/~1estimates/price/get/parameters/0/required',
                                                    value: true,
                                                    map: null,
                                                    raw: null
                                                }),
                                                type: new Schema({
                                                    uri: '#/paths/~1estimates/price/get/parameters/0/type',
                                                    value: 'number',
                                                    map: null,
                                                    raw: null
                                                }),
                                                format: new Schema({
                                                    uri: '#/paths/~1estimates/price/get/parameters/0/format',
                                                    value: 'double',
                                                    map: null,
                                                    raw: null
                                                })
                                            }),
                                            raw: null
                                        }), new Schema({
                                            uri: '#/paths/~1estimates/price/get/parameters/0',
                                            value: null,
                                            map: new Immutable.OrderedMap({
                                                name: new Schema({
                                                    uri: '#/paths/~1estimates/price/get/parameters/0/name',
                                                    value: 'start_longitude',
                                                    map: null,
                                                    raw: null
                                                }),
                                                in: new Schema({
                                                    uri: '#/paths/~1estimates/price/get/parameters/0/in',
                                                    value: 'query',
                                                    map: null,
                                                    raw: null
                                                }),
                                                description: new Schema({
                                                    uri: '#/paths/~1estimates/price/get/parameters/0/description',
                                                    value: 'Longitude component of start location.',
                                                    map: null,
                                                    raw: null
                                                }),
                                                required: new Schema({
                                                    uri: '#/paths/~1estimates/price/get/parameters/0/required',
                                                    value: true,
                                                    map: null,
                                                    raw: null
                                                }),
                                                type: new Schema({
                                                    uri: '#/paths/~1estimates/price/get/parameters/0/type',
                                                    value: 'number',
                                                    map: null,
                                                    raw: null
                                                }),
                                                format: new Schema({
                                                    uri: '#/paths/~1estimates/price/get/parameters/0/format',
                                                    value: 'double',
                                                    map: null,
                                                    raw: null
                                                })
                                            }),
                                            raw: null
                                        }), new Schema({
                                            uri: '#/paths/~1estimates/price/get/parameters/0',
                                            value: null,
                                            map: new Immutable.OrderedMap({
                                                name: new Schema({
                                                    uri: '#/paths/~1estimates/price/get/parameters/0/name',
                                                    value: 'end_latitude',
                                                    map: null,
                                                    raw: null
                                                }),
                                                in: new Schema({
                                                    uri: '#/paths/~1estimates/price/get/parameters/0/in',
                                                    value: 'query',
                                                    map: null,
                                                    raw: null
                                                }),
                                                description: new Schema({
                                                    uri: '#/paths/~1estimates/price/get/parameters/0/description',
                                                    value: 'Latitude component of end location.',
                                                    map: null,
                                                    raw: null
                                                }),
                                                required: new Schema({
                                                    uri: '#/paths/~1estimates/price/get/parameters/0/required',
                                                    value: true,
                                                    map: null,
                                                    raw: null
                                                }),
                                                type: new Schema({
                                                    uri: '#/paths/~1estimates/price/get/parameters/0/type',
                                                    value: 'number',
                                                    map: null,
                                                    raw: null
                                                }),
                                                format: new Schema({
                                                    uri: '#/paths/~1estimates/price/get/parameters/0/format',
                                                    value: 'double',
                                                    map: null,
                                                    raw: null
                                                })
                                            }),
                                            raw: null
                                        }), new Schema({
                                            uri: '#/paths/~1estimates/price/get/parameters/0',
                                            value: null,
                                            map: new Immutable.OrderedMap({
                                                name: new Schema({
                                                    uri: '#/paths/~1estimates/price/get/parameters/0/name',
                                                    value: 'end_longitude',
                                                    map: null,
                                                    raw: null
                                                }),
                                                in: new Schema({
                                                    uri: '#/paths/~1estimates/price/get/parameters/0/in',
                                                    value: 'query',
                                                    map: null,
                                                    raw: null
                                                }),
                                                description: new Schema({
                                                    uri: '#/paths/~1estimates/price/get/parameters/0/description',
                                                    value: 'Longitude component of end location.',
                                                    map: null,
                                                    raw: null
                                                }),
                                                required: new Schema({
                                                    uri: '#/paths/~1estimates/price/get/parameters/0/required',
                                                    value: true,
                                                    map: null,
                                                    raw: null
                                                }),
                                                type: new Schema({
                                                    uri: '#/paths/~1estimates/price/get/parameters/0/type',
                                                    value: 'number',
                                                    map: null,
                                                    raw: null
                                                }),
                                                format: new Schema({
                                                    uri: '#/paths/~1estimates/price/get/parameters/0/format',
                                                    value: 'double',
                                                    map: null,
                                                    raw: null
                                                })
                                            }),
                                            raw: null
                                        }) ]),
                                        raw: null
                                    }),
                                    tags: new Schema({
                                        uri: '#/paths/~1estimates/price/get/tags',
                                        value: null,
                                        map: new Immutable.List([ new Schema({
                                            uri: '#/paths/~1estimates/price/get/tags/0',
                                            value: 'Estimates',
                                            map: null,
                                            raw: null
                                        }) ]),
                                        raw: null
                                    }),
                                    responses: new Schema({
                                        uri: '#/paths/~1estimates/price/get/responses',
                                        value: null,
                                        map: new Immutable.OrderedMap({
                                            200: new Schema({
                                                uri: '#/paths/~1estimates/price/get/responses/200',
                                                value: null,
                                                map: new Immutable.OrderedMap({
                                                    description: new Schema({
                                                        uri: '#/paths/~1estimates/price/get/responses/200/description',
                                                        value: 'An array of price estimates by product',
                                                        map: null,
                                                        raw: null
                                                    }),
                                                    schema: new Schema({
                                                        uri: '#/paths/~1estimates/price/get/responses/200/schema',
                                                        value: null,
                                                        map: new Immutable.OrderedMap({
                                                            type: new Schema({
                                                                uri: '#/paths/~1estimates/price/get/responses/200/schema/type',
                                                                value: 'array',
                                                                map: null,
                                                                raw: null
                                                            }),
                                                            items: new Schema({
                                                                uri: '#/paths/~1estimates/price/get/responses/200/schema/items',
                                                                value: null,
                                                                map: new Immutable.OrderedMap({
                                                                    $ref: new SchemaReference({
                                                                        reference: '#/definitions/PriceEstimate',
                                                                        resolved: false,
                                                                        value: null
                                                                    })
                                                                }),
                                                                raw: null
                                                            })
                                                        }),
                                                        raw: null
                                                    })
                                                }),
                                                raw: null
                                            }),
                                            default: new Schema({
                                                uri: '#/paths/~1estimates/price/get/responses/default',
                                                value: null,
                                                map: new Immutable.OrderedMap({
                                                    description: new Schema({
                                                        uri: '#/paths/~1estimates/price/get/responses/default/description',
                                                        value: 'Unexpected error',
                                                        map: null,
                                                        raw: null
                                                    }),
                                                    schema: new Schema({
                                                        uri: '#/paths/~1estimates/price/get/responses/default/schema',
                                                        value: null,
                                                        map: new Immutable.OrderedMap({
                                                            $ref: new SchemaReference({
                                                                reference: '#/definitions/Error',
                                                                resolved: false,
                                                                value: null
                                                            })
                                                        }),
                                                        raw: null
                                                    })
                                                }),
                                                raw: null
                                            })
                                        }),
                                        raw: null
                                    })
                                }),
                                raw: null
                            })
                        }),
                        raw: null
                    }),
                    '/estimates/time': new Schema({
                        uri: '#/paths/~1estimates/time',
                        value: null,
                        map: new Immutable.OrderedMap({
                            get: new Schema({
                                uri: '#/paths/~1estimates/time/get',
                                value: null,
                                map: new Immutable.OrderedMap({
                                    summary: new Schema({
                                        uri: '#/paths/~1estimates/time/get/summary',
                                        value: 'Time Estimates',
                                        map: null,
                                        raw: null
                                    }),
                                    description: new Schema({
                                        uri: '#/paths/~1estimates/time/get/description',
                                        value: 'The Time Estimates endpoint returns ETAs for all products offered at a given location, with the responses expressed as integers in seconds. We recommend that this endpoint be called every minute to provide the most accurate, up-to-date ETAs.',
                                        map: null,
                                        raw: null
                                    }),
                                    parameters: new Schema({
                                        uri: '#/paths/~1estimates/time/get/parameters',
                                        value: null,
                                        map: new Immutable.List([ new Schema({
                                            uri: '#/paths/~1estimates/time/get/parameters/0',
                                            value: null,
                                            map: new Immutable.OrderedMap({
                                                name: new Schema({
                                                    uri: '#/paths/~1estimates/time/get/parameters/0/name',
                                                    value: 'start_latitude',
                                                    map: null,
                                                    raw: null
                                                }),
                                                in: new Schema({
                                                    uri: '#/paths/~1estimates/time/get/parameters/0/in',
                                                    value: 'query',
                                                    map: null,
                                                    raw: null
                                                }),
                                                description: new Schema({
                                                    uri: '#/paths/~1estimates/time/get/parameters/0/description',
                                                    value: 'Latitude component of start location.',
                                                    map: null,
                                                    raw: null
                                                }),
                                                required: new Schema({
                                                    uri: '#/paths/~1estimates/time/get/parameters/0/required',
                                                    value: true,
                                                    map: null,
                                                    raw: null
                                                }),
                                                type: new Schema({
                                                    uri: '#/paths/~1estimates/time/get/parameters/0/type',
                                                    value: 'number',
                                                    map: null,
                                                    raw: null
                                                }),
                                                format: new Schema({
                                                    uri: '#/paths/~1estimates/time/get/parameters/0/format',
                                                    value: 'double',
                                                    map: null,
                                                    raw: null
                                                })
                                            }),
                                            raw: null
                                        }), new Schema({
                                            uri: '#/paths/~1estimates/time/get/parameters/0',
                                            value: null,
                                            map: new Immutable.OrderedMap({
                                                name: new Schema({
                                                    uri: '#/paths/~1estimates/time/get/parameters/0/name',
                                                    value: 'start_longitude',
                                                    map: null,
                                                    raw: null
                                                }),
                                                in: new Schema({
                                                    uri: '#/paths/~1estimates/time/get/parameters/0/in',
                                                    value: 'query',
                                                    map: null,
                                                    raw: null
                                                }),
                                                description: new Schema({
                                                    uri: '#/paths/~1estimates/time/get/parameters/0/description',
                                                    value: 'Longitude component of start location.',
                                                    map: null,
                                                    raw: null
                                                }),
                                                required: new Schema({
                                                    uri: '#/paths/~1estimates/time/get/parameters/0/required',
                                                    value: true,
                                                    map: null,
                                                    raw: null
                                                }),
                                                type: new Schema({
                                                    uri: '#/paths/~1estimates/time/get/parameters/0/type',
                                                    value: 'number',
                                                    map: null,
                                                    raw: null
                                                }),
                                                format: new Schema({
                                                    uri: '#/paths/~1estimates/time/get/parameters/0/format',
                                                    value: 'double',
                                                    map: null,
                                                    raw: null
                                                })
                                            }),
                                            raw: null
                                        }), new Schema({
                                            uri: '#/paths/~1estimates/time/get/parameters/0',
                                            value: null,
                                            map: new Immutable.OrderedMap({
                                                name: new Schema({
                                                    uri: '#/paths/~1estimates/time/get/parameters/0/name',
                                                    value: 'customer_uuid',
                                                    map: null,
                                                    raw: null
                                                }),
                                                in: new Schema({
                                                    uri: '#/paths/~1estimates/time/get/parameters/0/in',
                                                    value: 'query',
                                                    map: null,
                                                    raw: null
                                                }),
                                                type: new Schema({
                                                    uri: '#/paths/~1estimates/time/get/parameters/0/type',
                                                    value: 'string',
                                                    map: null,
                                                    raw: null
                                                }),
                                                format: new Schema({
                                                    uri: '#/paths/~1estimates/time/get/parameters/0/format',
                                                    value: 'uuid',
                                                    map: null,
                                                    raw: null
                                                }),
                                                description: new Schema({
                                                    uri: '#/paths/~1estimates/time/get/parameters/0/description',
                                                    value: 'Unique customer identifier to be used for experience customization.',
                                                    map: null,
                                                    raw: null
                                                })
                                            }),
                                            raw: null
                                        }), new Schema({
                                            uri: '#/paths/~1estimates/time/get/parameters/0',
                                            value: null,
                                            map: new Immutable.OrderedMap({
                                                name: new Schema({
                                                    uri: '#/paths/~1estimates/time/get/parameters/0/name',
                                                    value: 'product_id',
                                                    map: null,
                                                    raw: null
                                                }),
                                                in: new Schema({
                                                    uri: '#/paths/~1estimates/time/get/parameters/0/in',
                                                    value: 'query',
                                                    map: null,
                                                    raw: null
                                                }),
                                                type: new Schema({
                                                    uri: '#/paths/~1estimates/time/get/parameters/0/type',
                                                    value: 'string',
                                                    map: null,
                                                    raw: null
                                                }),
                                                description: new Schema({
                                                    uri: '#/paths/~1estimates/time/get/parameters/0/description',
                                                    value: 'Unique identifier representing a specific product for a given latitude & longitude.',
                                                    map: null,
                                                    raw: null
                                                })
                                            }),
                                            raw: null
                                        }) ]),
                                        raw: null
                                    }),
                                    tags: new Schema({
                                        uri: '#/paths/~1estimates/time/get/tags',
                                        value: null,
                                        map: new Immutable.List([ new Schema({
                                            uri: '#/paths/~1estimates/time/get/tags/0',
                                            value: 'Estimates',
                                            map: null,
                                            raw: null
                                        }) ]),
                                        raw: null
                                    }),
                                    responses: new Schema({
                                        uri: '#/paths/~1estimates/time/get/responses',
                                        value: null,
                                        map: new Immutable.OrderedMap({
                                            200: new Schema({
                                                uri: '#/paths/~1estimates/time/get/responses/200',
                                                value: null,
                                                map: new Immutable.OrderedMap({
                                                    description: new Schema({
                                                        uri: '#/paths/~1estimates/time/get/responses/200/description',
                                                        value: 'An array of products',
                                                        map: null,
                                                        raw: null
                                                    }),
                                                    schema: new Schema({
                                                        uri: '#/paths/~1estimates/time/get/responses/200/schema',
                                                        value: null,
                                                        map: new Immutable.OrderedMap({
                                                            type: new Schema({
                                                                uri: '#/paths/~1estimates/time/get/responses/200/schema/type',
                                                                value: 'array',
                                                                map: null,
                                                                raw: null
                                                            }),
                                                            items: new Schema({
                                                                uri: '#/paths/~1estimates/time/get/responses/200/schema/items',
                                                                value: null,
                                                                map: new Immutable.OrderedMap({
                                                                    $ref: new SchemaReference({
                                                                        reference: '#/definitions/Product',
                                                                        resolved: false,
                                                                        value: null
                                                                    })
                                                                }),
                                                                raw: null
                                                            })
                                                        }),
                                                        raw: null
                                                    })
                                                }),
                                                raw: null
                                            }),
                                            default: new Schema({
                                                uri: '#/paths/~1estimates/time/get/responses/default',
                                                value: null,
                                                map: new Immutable.OrderedMap({
                                                    description: new Schema({
                                                        uri: '#/paths/~1estimates/time/get/responses/default/description',
                                                        value: 'Unexpected error',
                                                        map: null,
                                                        raw: null
                                                    }),
                                                    schema: new Schema({
                                                        uri: '#/paths/~1estimates/time/get/responses/default/schema',
                                                        value: null,
                                                        map: new Immutable.OrderedMap({
                                                            $ref: new SchemaReference({
                                                                reference: '#/definitions/Error',
                                                                resolved: false,
                                                                value: null
                                                            })
                                                        }),
                                                        raw: null
                                                    })
                                                }),
                                                raw: null
                                            })
                                        }),
                                        raw: null
                                    })
                                }),
                                raw: null
                            })
                        }),
                        raw: null
                    }),
                    '/me': new Schema({
                        uri: '#/paths/~1me',
                        value: null,
                        map: new Immutable.OrderedMap({
                            get: new Schema({
                                uri: '#/paths/~1me/get',
                                value: null,
                                map: new Immutable.OrderedMap({
                                    summary: new Schema({
                                        uri: '#/paths/~1me/get/summary',
                                        value: 'User Profile',
                                        map: null,
                                        raw: null
                                    }),
                                    description: new Schema({
                                        uri: '#/paths/~1me/get/description',
                                        value: 'The User Profile endpoint returns information about the Uber user that has authorized with the application.',
                                        map: null,
                                        raw: null
                                    }),
                                    tags: new Schema({
                                        uri: '#/paths/~1me/get/tags',
                                        value: null,
                                        map: new Immutable.List([ new Schema({
                                            uri: '#/paths/~1me/get/tags/0',
                                            value: 'User',
                                            map: null,
                                            raw: null
                                        }) ]),
                                        raw: null
                                    }),
                                    responses: new Schema({
                                        uri: '#/paths/~1me/get/responses',
                                        value: null,
                                        map: new Immutable.OrderedMap({
                                            200: new Schema({
                                                uri: '#/paths/~1me/get/responses/200',
                                                value: null,
                                                map: new Immutable.OrderedMap({
                                                    description: new Schema({
                                                        uri: '#/paths/~1me/get/responses/200/description',
                                                        value: 'Profile information for a user',
                                                        map: null,
                                                        raw: null
                                                    }),
                                                    schema: new Schema({
                                                        uri: '#/paths/~1me/get/responses/200/schema',
                                                        value: null,
                                                        map: new Immutable.OrderedMap({
                                                            $ref: new SchemaReference({
                                                                reference: '#/definitions/Profile',
                                                                resolved: false,
                                                                value: null
                                                            })
                                                        }),
                                                        raw: null
                                                    })
                                                }),
                                                raw: null
                                            }),
                                            default: new Schema({
                                                uri: '#/paths/~1me/get/responses/default',
                                                value: null,
                                                map: new Immutable.OrderedMap({
                                                    description: new Schema({
                                                        uri: '#/paths/~1me/get/responses/default/description',
                                                        value: 'Unexpected error',
                                                        map: null,
                                                        raw: null
                                                    }),
                                                    schema: new Schema({
                                                        uri: '#/paths/~1me/get/responses/default/schema',
                                                        value: null,
                                                        map: new Immutable.OrderedMap({
                                                            $ref: new SchemaReference({
                                                                reference: '#/definitions/Error',
                                                                resolved: false,
                                                                value: null
                                                            })
                                                        }),
                                                        raw: null
                                                    })
                                                }),
                                                raw: null
                                            })
                                        }),
                                        raw: null
                                    })
                                }),
                                raw: null
                            })
                        }),
                        raw: null
                    }),
                    '/history': new Schema({
                        uri: '#/paths/~1history',
                        value: null,
                        map: new Immutable.OrderedMap({
                            get: new Schema({
                                uri: '#/paths/~1history/get',
                                value: null,
                                map: new Immutable.OrderedMap({
                                    summary: new Schema({
                                        uri: '#/paths/~1history/get/summary',
                                        value: 'User Activity',
                                        map: null,
                                        raw: null
                                    }),
                                    description: new Schema({
                                        uri: '#/paths/~1history/get/description',
                                        value: 'The User Activity endpoint returns data about a user\'s lifetime activity with Uber. The response will include pickup locations and times, dropoff locations and times, the distance of past requests, and information about which products were requested.<br><br>The history array in the response will have a maximum length based on the limit parameter. The response value count may exceed limit, therefore subsequent API requests may be necessary.',
                                        map: null,
                                        raw: null
                                    }),
                                    parameters: new Schema({
                                        uri: '#/paths/~1history/get/parameters',
                                        value: null,
                                        map: new Immutable.List([ new Schema({
                                            uri: '#/paths/~1history/get/parameters/0',
                                            value: null,
                                            map: new Immutable.OrderedMap({
                                                name: new Schema({
                                                    uri: '#/paths/~1history/get/parameters/0/name',
                                                    value: 'offset',
                                                    map: null,
                                                    raw: null
                                                }),
                                                in: new Schema({
                                                    uri: '#/paths/~1history/get/parameters/0/in',
                                                    value: 'query',
                                                    map: null,
                                                    raw: null
                                                }),
                                                type: new Schema({
                                                    uri: '#/paths/~1history/get/parameters/0/type',
                                                    value: 'integer',
                                                    map: null,
                                                    raw: null
                                                }),
                                                format: new Schema({
                                                    uri: '#/paths/~1history/get/parameters/0/format',
                                                    value: 'int32',
                                                    map: null,
                                                    raw: null
                                                }),
                                                description: new Schema({
                                                    uri: '#/paths/~1history/get/parameters/0/description',
                                                    value: 'Offset the list of returned results by this amount. Default is zero.',
                                                    map: null,
                                                    raw: null
                                                })
                                            }),
                                            raw: null
                                        }), new Schema({
                                            uri: '#/paths/~1history/get/parameters/0',
                                            value: null,
                                            map: new Immutable.OrderedMap({
                                                name: new Schema({
                                                    uri: '#/paths/~1history/get/parameters/0/name',
                                                    value: 'limit',
                                                    map: null,
                                                    raw: null
                                                }),
                                                in: new Schema({
                                                    uri: '#/paths/~1history/get/parameters/0/in',
                                                    value: 'query',
                                                    map: null,
                                                    raw: null
                                                }),
                                                type: new Schema({
                                                    uri: '#/paths/~1history/get/parameters/0/type',
                                                    value: 'integer',
                                                    map: null,
                                                    raw: null
                                                }),
                                                format: new Schema({
                                                    uri: '#/paths/~1history/get/parameters/0/format',
                                                    value: 'int32',
                                                    map: null,
                                                    raw: null
                                                }),
                                                description: new Schema({
                                                    uri: '#/paths/~1history/get/parameters/0/description',
                                                    value: 'Number of items to retrieve. Default is 5, maximum is 100.',
                                                    map: null,
                                                    raw: null
                                                })
                                            }),
                                            raw: null
                                        }) ]),
                                        raw: null
                                    }),
                                    tags: new Schema({
                                        uri: '#/paths/~1history/get/tags',
                                        value: null,
                                        map: new Immutable.List([ new Schema({
                                            uri: '#/paths/~1history/get/tags/0',
                                            value: 'User',
                                            map: null,
                                            raw: null
                                        }) ]),
                                        raw: null
                                    }),
                                    responses: new Schema({
                                        uri: '#/paths/~1history/get/responses',
                                        value: null,
                                        map: new Immutable.OrderedMap({
                                            200: new Schema({
                                                uri: '#/paths/~1history/get/responses/200',
                                                value: null,
                                                map: new Immutable.OrderedMap({
                                                    description: new Schema({
                                                        uri: '#/paths/~1history/get/responses/200/description',
                                                        value: 'History information for the given user',
                                                        map: null,
                                                        raw: null
                                                    }),
                                                    schema: new Schema({
                                                        uri: '#/paths/~1history/get/responses/200/schema',
                                                        value: null,
                                                        map: new Immutable.OrderedMap({
                                                            $ref: new SchemaReference({
                                                                reference: '#/definitions/Activities',
                                                                resolved: false,
                                                                value: null
                                                            })
                                                        }),
                                                        raw: null
                                                    })
                                                }),
                                                raw: null
                                            }),
                                            default: new Schema({
                                                uri: '#/paths/~1history/get/responses/default',
                                                value: null,
                                                map: new Immutable.OrderedMap({
                                                    description: new Schema({
                                                        uri: '#/paths/~1history/get/responses/default/description',
                                                        value: 'Unexpected error',
                                                        map: null,
                                                        raw: null
                                                    }),
                                                    schema: new Schema({
                                                        uri: '#/paths/~1history/get/responses/default/schema',
                                                        value: null,
                                                        map: new Immutable.OrderedMap({
                                                            $ref: new SchemaReference({
                                                                reference: '#/definitions/Error',
                                                                resolved: false,
                                                                value: null
                                                            })
                                                        }),
                                                        raw: null
                                                    })
                                                }),
                                                raw: null
                                            })
                                        }),
                                        raw: null
                                    })
                                }),
                                raw: null
                            })
                        }),
                        raw: null
                    })
                }),
                raw: null
            }),
            definitions: new Schema({
                uri: '#/definitions',
                value: null,
                map: new Immutable.OrderedMap({
                    Product: new Schema({
                        uri: '#/definitions/Product',
                        value: null,
                        map: new Immutable.OrderedMap({
                            properties: new Schema({
                                uri: '#/definitions/Product/properties',
                                value: null,
                                map: new Immutable.OrderedMap({
                                    product_id: new Schema({
                                        uri: '#/definitions/Product/properties/product_id',
                                        value: null,
                                        map: new Immutable.OrderedMap({
                                            type: new Schema({
                                                uri: '#/definitions/Product/properties/product_id/type',
                                                value: 'string',
                                                map: null,
                                                raw: null
                                            }),
                                            description: new Schema({
                                                uri: '#/definitions/Product/properties/product_id/description',
                                                value: 'Unique identifier representing a specific product for a given latitude & longitude. For example, uberX in San Francisco will have a different product_id than uberX in Los Angeles.',
                                                map: null,
                                                raw: null
                                            })
                                        }),
                                        raw: null
                                    }),
                                    description: new Schema({
                                        uri: '#/definitions/Product/properties/description',
                                        value: null,
                                        map: new Immutable.OrderedMap({
                                            type: new Schema({
                                                uri: '#/definitions/Product/properties/description/type',
                                                value: 'string',
                                                map: null,
                                                raw: null
                                            }),
                                            description: new Schema({
                                                uri: '#/definitions/Product/properties/description/description',
                                                value: 'Description of product.',
                                                map: null,
                                                raw: null
                                            })
                                        }),
                                        raw: null
                                    }),
                                    display_name: new Schema({
                                        uri: '#/definitions/Product/properties/display_name',
                                        value: null,
                                        map: new Immutable.OrderedMap({
                                            type: new Schema({
                                                uri: '#/definitions/Product/properties/display_name/type',
                                                value: 'string',
                                                map: null,
                                                raw: null
                                            }),
                                            description: new Schema({
                                                uri: '#/definitions/Product/properties/display_name/description',
                                                value: 'Display name of product.',
                                                map: null,
                                                raw: null
                                            })
                                        }),
                                        raw: null
                                    }),
                                    capacity: new Schema({
                                        uri: '#/definitions/Product/properties/capacity',
                                        value: null,
                                        map: new Immutable.OrderedMap({
                                            type: new Schema({
                                                uri: '#/definitions/Product/properties/capacity/type',
                                                value: 'string',
                                                map: null,
                                                raw: null
                                            }),
                                            description: new Schema({
                                                uri: '#/definitions/Product/properties/capacity/description',
                                                value: 'Capacity of product. For example, 4 people.',
                                                map: null,
                                                raw: null
                                            })
                                        }),
                                        raw: null
                                    }),
                                    image: new Schema({
                                        uri: '#/definitions/Product/properties/image',
                                        value: null,
                                        map: new Immutable.OrderedMap({
                                            type: new Schema({
                                                uri: '#/definitions/Product/properties/image/type',
                                                value: 'string',
                                                map: null,
                                                raw: null
                                            }),
                                            description: new Schema({
                                                uri: '#/definitions/Product/properties/image/description',
                                                value: 'Image new URLrepresenting the product.',
                                                map: null,
                                                raw: null
                                            })
                                        }),
                                        raw: null
                                    })
                                }),
                                raw: null
                            })
                        }),
                        raw: null
                    }),
                    PriceEstimate: new Schema({
                        uri: '#/definitions/PriceEstimate',
                        value: null,
                        map: new Immutable.OrderedMap({
                            properties: new Schema({
                                uri: '#/definitions/PriceEstimate/properties',
                                value: null,
                                map: new Immutable.OrderedMap({
                                    product_id: new Schema({
                                        uri: '#/definitions/PriceEstimate/properties/product_id',
                                        value: null,
                                        map: new Immutable.OrderedMap({
                                            type: new Schema({
                                                uri: '#/definitions/PriceEstimate/properties/product_id/type',
                                                value: 'string',
                                                map: null,
                                                raw: null
                                            }),
                                            description: new Schema({
                                                uri: '#/definitions/PriceEstimate/properties/product_id/description',
                                                value: 'Unique identifier representing a specific product for a given latitude & longitude. For example, uberX in San Francisco will have a different product_id than uberX in Los Angeles',
                                                map: null,
                                                raw: null
                                            })
                                        }),
                                        raw: null
                                    }),
                                    currency_code: new Schema({
                                        uri: '#/definitions/PriceEstimate/properties/currency_code',
                                        value: null,
                                        map: new Immutable.OrderedMap({
                                            type: new Schema({
                                                uri: '#/definitions/PriceEstimate/properties/currency_code/type',
                                                value: 'string',
                                                map: null,
                                                raw: null
                                            }),
                                            description: new Schema({
                                                uri: '#/definitions/PriceEstimate/properties/currency_code/description',
                                                value: '([ ISO 4217 ])(http://en.wikipedia.org/wiki/ISO_4217) currency code.',
                                                map: null,
                                                raw: null
                                            })
                                        }),
                                        raw: null
                                    }),
                                    display_name: new Schema({
                                        uri: '#/definitions/PriceEstimate/properties/display_name',
                                        value: null,
                                        map: new Immutable.OrderedMap({
                                            type: new Schema({
                                                uri: '#/definitions/PriceEstimate/properties/display_name/type',
                                                value: 'string',
                                                map: null,
                                                raw: null
                                            }),
                                            description: new Schema({
                                                uri: '#/definitions/PriceEstimate/properties/display_name/description',
                                                value: 'Display name of product.',
                                                map: null,
                                                raw: null
                                            })
                                        }),
                                        raw: null
                                    }),
                                    estimate: new Schema({
                                        uri: '#/definitions/PriceEstimate/properties/estimate',
                                        value: null,
                                        map: new Immutable.OrderedMap({
                                            type: new Schema({
                                                uri: '#/definitions/PriceEstimate/properties/estimate/type',
                                                value: 'string',
                                                map: null,
                                                raw: null
                                            }),
                                            description: new Schema({
                                                uri: '#/definitions/PriceEstimate/properties/estimate/description',
                                                value: 'Formatted string of estimate in local currency of the start location. Estimate could be a range, a single number (flat rate) or \"Metered\" for TAXI.',
                                                map: null,
                                                raw: null
                                            })
                                        }),
                                        raw: null
                                    }),
                                    low_estimate: new Schema({
                                        uri: '#/definitions/PriceEstimate/properties/low_estimate',
                                        value: null,
                                        map: new Immutable.OrderedMap({
                                            type: new Schema({
                                                uri: '#/definitions/PriceEstimate/properties/low_estimate/type',
                                                value: 'number',
                                                map: null,
                                                raw: null
                                            }),
                                            description: new Schema({
                                                uri: '#/definitions/PriceEstimate/properties/low_estimate/description',
                                                value: 'Lower bound of the estimated price.',
                                                map: null,
                                                raw: null
                                            })
                                        }),
                                        raw: null
                                    }),
                                    high_estimate: new Schema({
                                        uri: '#/definitions/PriceEstimate/properties/high_estimate',
                                        value: null,
                                        map: new Immutable.OrderedMap({
                                            type: new Schema({
                                                uri: '#/definitions/PriceEstimate/properties/high_estimate/type',
                                                value: 'number',
                                                map: null,
                                                raw: null
                                            }),
                                            description: new Schema({
                                                uri: '#/definitions/PriceEstimate/properties/high_estimate/description',
                                                value: 'Upper bound of the estimated price.',
                                                map: null,
                                                raw: null
                                            })
                                        }),
                                        raw: null
                                    }),
                                    surge_multiplier: new Schema({
                                        uri: '#/definitions/PriceEstimate/properties/surge_multiplier',
                                        value: null,
                                        map: new Immutable.OrderedMap({
                                            type: new Schema({
                                                uri: '#/definitions/PriceEstimate/properties/surge_multiplier/type',
                                                value: 'number',
                                                map: null,
                                                raw: null
                                            }),
                                            description: new Schema({
                                                uri: '#/definitions/PriceEstimate/properties/surge_multiplier/description',
                                                value: 'Expected surge multiplier. Surge is active if surge_multiplier is greater than 1. Price estimate already factors in the surge multiplier.',
                                                map: null,
                                                raw: null
                                            })
                                        }),
                                        raw: null
                                    })
                                }),
                                raw: null
                            })
                        }),
                        raw: null
                    }),
                    Profile: new Schema({
                        uri: '#/definitions/Profile',
                        value: null,
                        map: new Immutable.OrderedMap({
                            properties: new Schema({
                                uri: '#/definitions/Profile/properties',
                                value: null,
                                map: new Immutable.OrderedMap({
                                    first_name: new Schema({
                                        uri: '#/definitions/Profile/properties/first_name',
                                        value: null,
                                        map: new Immutable.OrderedMap({
                                            type: new Schema({
                                                uri: '#/definitions/Profile/properties/first_name/type',
                                                value: 'string',
                                                map: null,
                                                raw: null
                                            }),
                                            description: new Schema({
                                                uri: '#/definitions/Profile/properties/first_name/description',
                                                value: 'First name of the Uber user.',
                                                map: null,
                                                raw: null
                                            })
                                        }),
                                        raw: null
                                    }),
                                    last_name: new Schema({
                                        uri: '#/definitions/Profile/properties/last_name',
                                        value: null,
                                        map: new Immutable.OrderedMap({
                                            type: new Schema({
                                                uri: '#/definitions/Profile/properties/last_name/type',
                                                value: 'string',
                                                map: null,
                                                raw: null
                                            }),
                                            description: new Schema({
                                                uri: '#/definitions/Profile/properties/last_name/description',
                                                value: 'Last name of the Uber user.',
                                                map: null,
                                                raw: null
                                            })
                                        }),
                                        raw: null
                                    }),
                                    email: new Schema({
                                        uri: '#/definitions/Profile/properties/email',
                                        value: null,
                                        map: new Immutable.OrderedMap({
                                            type: new Schema({
                                                uri: '#/definitions/Profile/properties/email/type',
                                                value: 'string',
                                                map: null,
                                                raw: null
                                            }),
                                            description: new Schema({
                                                uri: '#/definitions/Profile/properties/email/description',
                                                value: 'Email address of the Uber user',
                                                map: null,
                                                raw: null
                                            })
                                        }),
                                        raw: null
                                    }),
                                    picture: new Schema({
                                        uri: '#/definitions/Profile/properties/picture',
                                        value: null,
                                        map: new Immutable.OrderedMap({
                                            type: new Schema({
                                                uri: '#/definitions/Profile/properties/picture/type',
                                                value: 'string',
                                                map: null,
                                                raw: null
                                            }),
                                            description: new Schema({
                                                uri: '#/definitions/Profile/properties/picture/description',
                                                value: 'Image new URLof the Uber user.',
                                                map: null,
                                                raw: null
                                            })
                                        }),
                                        raw: null
                                    }),
                                    promo_code: new Schema({
                                        uri: '#/definitions/Profile/properties/promo_code',
                                        value: null,
                                        map: new Immutable.OrderedMap({
                                            type: new Schema({
                                                uri: '#/definitions/Profile/properties/promo_code/type',
                                                value: 'string',
                                                map: null,
                                                raw: null
                                            }),
                                            description: new Schema({
                                                uri: '#/definitions/Profile/properties/promo_code/description',
                                                value: 'Promo code of the Uber user.',
                                                map: null,
                                                raw: null
                                            })
                                        }),
                                        raw: null
                                    })
                                }),
                                raw: null
                            })
                        }),
                        raw: null
                    }),
                    Activity: new Schema({
                        uri: '#/definitions/Activity',
                        value: null,
                        map: new Immutable.OrderedMap({
                            properties: new Schema({
                                uri: '#/definitions/Activity/properties',
                                value: null,
                                map: new Immutable.OrderedMap({
                                    uuid: new Schema({
                                        uri: '#/definitions/Activity/properties/uuid',
                                        value: null,
                                        map: new Immutable.OrderedMap({
                                            type: new Schema({
                                                uri: '#/definitions/Activity/properties/uuid/type',
                                                value: 'string',
                                                map: null,
                                                raw: null
                                            }),
                                            description: new Schema({
                                                uri: '#/definitions/Activity/properties/uuid/description',
                                                value: 'Unique identifier for the activity',
                                                map: null,
                                                raw: null
                                            })
                                        }),
                                        raw: null
                                    })
                                }),
                                raw: null
                            })
                        }),
                        raw: null
                    }),
                    Activities: new Schema({
                        uri: '#/definitions/Activities',
                        value: null,
                        map: new Immutable.OrderedMap({
                            properties: new Schema({
                                uri: '#/definitions/Activities/properties',
                                value: null,
                                map: new Immutable.OrderedMap({
                                    offset: new Schema({
                                        uri: '#/definitions/Activities/properties/offset',
                                        value: null,
                                        map: new Immutable.OrderedMap({
                                            type: new Schema({
                                                uri: '#/definitions/Activities/properties/offset/type',
                                                value: 'integer',
                                                map: null,
                                                raw: null
                                            }),
                                            format: new Schema({
                                                uri: '#/definitions/Activities/properties/offset/format',
                                                value: 'int32',
                                                map: null,
                                                raw: null
                                            }),
                                            description: new Schema({
                                                uri: '#/definitions/Activities/properties/offset/description',
                                                value: 'Position in pagination.',
                                                map: null,
                                                raw: null
                                            })
                                        }),
                                        raw: null
                                    }),
                                    limit: new Schema({
                                        uri: '#/definitions/Activities/properties/limit',
                                        value: null,
                                        map: new Immutable.OrderedMap({
                                            type: new Schema({
                                                uri: '#/definitions/Activities/properties/limit/type',
                                                value: 'integer',
                                                map: null,
                                                raw: null
                                            }),
                                            format: new Schema({
                                                uri: '#/definitions/Activities/properties/limit/format',
                                                value: 'int32',
                                                map: null,
                                                raw: null
                                            }),
                                            description: new Schema({
                                                uri: '#/definitions/Activities/properties/limit/description',
                                                value: 'Number of items to retrieve (100 max).',
                                                map: null,
                                                raw: null
                                            })
                                        }),
                                        raw: null
                                    }),
                                    count: new Schema({
                                        uri: '#/definitions/Activities/properties/count',
                                        value: null,
                                        map: new Immutable.OrderedMap({
                                            type: new Schema({
                                                uri: '#/definitions/Activities/properties/count/type',
                                                value: 'integer',
                                                map: null,
                                                raw: null
                                            }),
                                            format: new Schema({
                                                uri: '#/definitions/Activities/properties/count/format',
                                                value: 'int32',
                                                map: null,
                                                raw: null
                                            }),
                                            description: new Schema({
                                                uri: '#/definitions/Activities/properties/count/description',
                                                value: 'Total number of items available.',
                                                map: null,
                                                raw: null
                                            })
                                        }),
                                        raw: null
                                    }),
                                    history: new Schema({
                                        uri: '#/definitions/Activities/properties/history',
                                        value: null,
                                        map: new Immutable.OrderedMap({
                                            type: new Schema({
                                                uri: '#/definitions/Activities/properties/history/type',
                                                value: 'array',
                                                map: null,
                                                raw: null
                                            }),
                                            items: new Schema({
                                                uri: '#/definitions/Activities/properties/history/items',
                                                value: null,
                                                map: new Immutable.OrderedMap({
                                                    $ref: new SchemaReference({
                                                        reference: '#/definitions/Activity',
                                                        resolved: false,
                                                        value: null
                                                    })
                                                }),
                                                raw: null
                                            })
                                        }),
                                        raw: null
                                    })
                                }),
                                raw: null
                            })
                        }),
                        raw: null
                    }),
                    Error: new Schema({
                        uri: '#/definitions/Error',
                        value: null,
                        map: new Immutable.OrderedMap({
                            properties: new Schema({
                                uri: '#/definitions/Error/properties',
                                value: null,
                                map: new Immutable.OrderedMap({
                                    code: new Schema({
                                        uri: '#/definitions/Error/properties/code',
                                        value: null,
                                        map: new Immutable.OrderedMap({
                                            type: new Schema({
                                                uri: '#/definitions/Error/properties/code/type',
                                                value: 'integer',
                                                map: null,
                                                raw: null
                                            }),
                                            format: new Schema({
                                                uri: '#/definitions/Error/properties/code/format',
                                                value: 'int32',
                                                map: null,
                                                raw: null
                                            })
                                        }),
                                        raw: null
                                    }),
                                    message: new Schema({
                                        uri: '#/definitions/Error/properties/message',
                                        value: null,
                                        map: new Immutable.OrderedMap({
                                            type: new Schema({
                                                uri: '#/definitions/Error/properties/message/type',
                                                value: 'string',
                                                map: null,
                                                raw: null
                                            })
                                        }),
                                        raw: null
                                    }),
                                    fields: new Schema({
                                        uri: '#/definitions/Error/properties/fields',
                                        value: null,
                                        map: new Immutable.OrderedMap({
                                            type: new Schema({
                                                uri: '#/definitions/Error/properties/fields/type',
                                                value: 'string',
                                                map: null,
                                                raw: null
                                            })
                                        }),
                                        raw: null
                                    })
                                }),
                                raw: null
                            })
                        }),
                        raw: null
                    })
                }),
                raw: null
            })
        }),
        raw: null
    }),
    group: new Group({
        id: null,
        name: 'Uber API',
        children: new Immutable.OrderedMap({
            '/products': new Group({
                id: null,
                name: '/products',
                children: new Immutable.OrderedMap({
                    get: new Request({
                        id: null,
                        name: 'Product Types',
                        description: 'The Products endpoint returns information about the *Uber* products\noffered at a given location. The response includes the display name\nand other details about each product, and lists the products in the\nproper display order.\n',
                        url: new URL({
                            schemes: new Immutable.List([ 'https' ]),
                            host: 'api.uber.com',
                            path: '/v1/products'
                        }),
                        method: 'GET',
                        parameters: new ParameterContainer({
                            headers: new Immutable.List([ ]),
                            queries: new Immutable.List([ new Parameter({
                                key: 'latitude',
                                value: null,
                                type: 'number',
                                format: 'double',
                                name: null,
                                description: 'Latitude component of location.',
                                example: null,
                                internals: new Immutable.List([ ]),
                                externals: new Immutable.List([ ])
                            }), new Parameter({
                                key: 'longitude',
                                value: null,
                                type: 'number',
                                format: 'double',
                                name: null,
                                description: 'Longitude component of location.',
                                example: null,
                                internals: new Immutable.List([ ]),
                                externals: new Immutable.List([ ])
                            }) ]),
                            body: new Immutable.List([ ]),
                            path: new Immutable.List([ ])
                        }),
                        bodies: new Immutable.List([ ]),
                        auths: new Immutable.List([ ]),
                        responses: new Immutable.List([ new Response({
                            code: '200',
                            description: 'An array of products',
                            parameters: new ParameterContainer({
                                headers: new Immutable.List([ ]),
                                queries: new Immutable.List([ ]),
                                body: new Immutable.List([ new Parameter({
                                    key: 'schema',
                                    value: new Schema({
                                        uri: '#',
                                        value: null,
                                        map: new Immutable.OrderedMap({
                                            type: new Schema({
                                                uri: '#/type',
                                                value: 'array',
                                                map: null,
                                                raw: null
                                            }),
                                            items: new Schema({
                                                uri: '#/items',
                                                value: null,
                                                map: new Immutable.OrderedMap({
                                                    $ref: new SchemaReference({
                                                        reference: '#/definitions/Product',
                                                        resolved: false,
                                                        value: null
                                                    })
                                                }),
                                                raw: null
                                            })
                                        }),
                                        raw: null
                                    }),
                                    type: null,
                                    format: null,
                                    name: null,
                                    description: null,
                                    example: null,
                                    internals: new Immutable.List([ ]),
                                    externals: new Immutable.List([ new Parameter({
                                        key: 'Content-Type',
                                        value: null,
                                        type: null,
                                        format: null,
                                        name: null,
                                        description: null,
                                        example: null,
                                        internals: new Immutable.List([ new Constraint.Enum([ 'application/json' ]) ]),
                                        externals: new Immutable.List([ ])
                                    }) ])
                                }) ]),
                                path: new Immutable.List([ ])
                            }),
                            bodies: new Immutable.List([ new Body({
                                constraints: new Immutable.List([ new Parameter({
                                    key: 'Content-Type',
                                    value: 'application/json',
                                    type: null,
                                    format: null,
                                    name: null,
                                    description: null,
                                    example: null,
                                    internals: new Immutable.List([ ]),
                                    externals: new Immutable.List([ ])
                                }) ]),
                                type: null
                            }) ])
                        }), new Response({
                            code: 'default',
                            description: 'Unexpected error',
                            parameters: new ParameterContainer({
                                headers: new Immutable.List([ ]),
                                queries: new Immutable.List([ ]),
                                body: new Immutable.List([ new Parameter({
                                    key: 'schema',
                                    value: new Schema({
                                        uri: '#',
                                        value: null,
                                        map: new Immutable.OrderedMap({
                                            $ref: new SchemaReference({
                                                reference: '#/definitions/Error',
                                                resolved: false,
                                                value: null
                                            })
                                        }),
                                        raw: null
                                    }),
                                    type: null,
                                    format: null,
                                    name: null,
                                    description: null,
                                    example: null,
                                    internals: new Immutable.List([ ]),
                                    externals: new Immutable.List([ new Parameter({
                                        key: 'Content-Type',
                                        value: null,
                                        type: null,
                                        format: null,
                                        name: null,
                                        description: null,
                                        example: null,
                                        internals: new Immutable.List([ new Constraint.Enum([ 'application/json' ]) ]),
                                        externals: new Immutable.List([ ])
                                    }) ])
                                }) ]),
                                path: new Immutable.List([ ])
                            }),
                            bodies: new Immutable.List([ new Body({
                                constraints: new Immutable.List([ new Parameter({
                                    key: 'Content-Type',
                                    value: 'application/json',
                                    type: null,
                                    format: null,
                                    name: null,
                                    description: null,
                                    example: null,
                                    internals: new Immutable.List([ ]),
                                    externals: new Immutable.List([ ])
                                }) ]),
                                type: null
                            }) ])
                        }) ]),
                        timeout: null,
                        tags: new Immutable.List([ 'Products' ])
                    })
                })
            }),
            '/estimates': new Group({
                id: null,
                name: '/estimates',
                children: new Immutable.OrderedMap({
                    '/price': new Group({
                        id: null,
                        name: '/price',
                        children: new Immutable.OrderedMap({
                            get: new Request({
                                id: null,
                                name: 'Price Estimates',
                                description: 'The Price Estimates endpoint returns an estimated price range\nfor each product offered at a given location. The price estimate is\nprovided as a formatted string with the full price range and the localized\ncurrency symbol.<br><br>The response also includes low and high estimates,\nand the ([ ISO 4217 ])(http://en.wikipedia.org/wiki/ISO_4217) currency code for\nsituations requiring currency conversion. When surge is active for a particular\nproduct, its surge_multiplier will be greater than 1, but the price estimate\nalready factors in this multiplier.\n',
                                url: new URL({
                                    schemes: new Immutable.List([ 'https' ]),
                                    host: 'api.uber.com',
                                    path: '/v1/estimates/price'
                                }),
                                method: 'GET',
                                parameters: new ParameterContainer({
                                    headers: new Immutable.List([ ]),
                                    queries: new Immutable.List([ new Parameter({
                                        key: 'start_latitude',
                                        value: null,
                                        type: 'number',
                                        format: 'double',
                                        name: null,
                                        description: 'Latitude component of start location.',
                                        example: null,
                                        internals: new Immutable.List([ ]),
                                        externals: new Immutable.List([ ])
                                    }), new Parameter({
                                        key: 'start_longitude',
                                        value: null,
                                        type: 'number',
                                        format: 'double',
                                        name: null,
                                        description: 'Longitude component of start location.',
                                        example: null,
                                        internals: new Immutable.List([ ]),
                                        externals: new Immutable.List([ ])
                                    }), new Parameter({
                                        key: 'end_latitude',
                                        value: null,
                                        type: 'number',
                                        format: 'double',
                                        name: null,
                                        description: 'Latitude component of end location.',
                                        example: null,
                                        internals: new Immutable.List([ ]),
                                        externals: new Immutable.List([ ])
                                    }), new Parameter({
                                        key: 'end_longitude',
                                        value: null,
                                        type: 'number',
                                        format: 'double',
                                        name: null,
                                        description: 'Longitude component of end location.',
                                        example: null,
                                        internals: new Immutable.List([ ]),
                                        externals: new Immutable.List([ ])
                                    }) ]),
                                    body: new Immutable.List([ ]),
                                    path: new Immutable.List([ ])
                                }),
                                bodies: new Immutable.List([ ]),
                                auths: new Immutable.List([ ]),
                                responses: new Immutable.List([ new Response({
                                    code: '200',
                                    description: 'An array of price estimates by product',
                                    parameters: new ParameterContainer({
                                        headers: new Immutable.List([ ]),
                                        queries: new Immutable.List([ ]),
                                        body: new Immutable.List([ new Parameter({
                                            key: 'schema',
                                            value: new Schema({
                                                uri: '#',
                                                value: null,
                                                map: new Immutable.OrderedMap({
                                                    type: new Schema({
                                                        uri: '#/type',
                                                        value: 'array',
                                                        map: null,
                                                        raw: null
                                                    }),
                                                    items: new Schema({
                                                        uri: '#/items',
                                                        value: null,
                                                        map: new Immutable.OrderedMap({
                                                            $ref: new SchemaReference({
                                                                reference: '#/definitions/PriceEstimate',
                                                                resolved: false,
                                                                value: null
                                                            })
                                                        }),
                                                        raw: null
                                                    })
                                                }),
                                                raw: null
                                            }),
                                            type: null,
                                            format: null,
                                            name: null,
                                            description: null,
                                            example: null,
                                            internals: new Immutable.List([ ]),
                                            externals: new Immutable.List([ new Parameter({
                                                key: 'Content-Type',
                                                value: null,
                                                type: null,
                                                format: null,
                                                name: null,
                                                description: null,
                                                example: null,
                                                internals: new Immutable.List([ new Constraint.Enum([ 'application/json' ]) ]),
                                                externals: new Immutable.List([ ])
                                            }) ])
                                        }) ]),
                                        path: new Immutable.List([ ])
                                    }),
                                    bodies: new Immutable.List([ new Body({
                                        constraints: new Immutable.List([ new Parameter({
                                            key: 'Content-Type',
                                            value: 'application/json',
                                            type: null,
                                            format: null,
                                            name: null,
                                            description: null,
                                            example: null,
                                            internals: new Immutable.List([ ]),
                                            externals: new Immutable.List([ ])
                                        }) ]),
                                        type: null
                                    }) ])
                                }), new Response({
                                    code: 'default',
                                    description: 'Unexpected error',
                                    parameters: new ParameterContainer({
                                        headers: new Immutable.List([ ]),
                                        queries: new Immutable.List([ ]),
                                        body: new Immutable.List([ new Parameter({
                                            key: 'schema',
                                            value: new Schema({
                                                uri: '#',
                                                value: null,
                                                map: new Immutable.OrderedMap({
                                                    $ref: new SchemaReference({
                                                        reference: '#/definitions/Error',
                                                        resolved: false,
                                                        value: null
                                                    })
                                                }),
                                                raw: null
                                            }),
                                            type: null,
                                            format: null,
                                            name: null,
                                            description: null,
                                            example: null,
                                            internals: new Immutable.List([ ]),
                                            externals: new Immutable.List([ new Parameter({
                                                key: 'Content-Type',
                                                value: null,
                                                type: null,
                                                format: null,
                                                name: null,
                                                description: null,
                                                example: null,
                                                internals: new Immutable.List([
                                                    new Constraint.Enum([ 'application/json' ])
                                                ]),
                                                externals: new Immutable.List([ ])
                                            }) ])
                                        }) ]),
                                        path: new Immutable.List([ ])
                                    }),
                                    bodies: new Immutable.List([ new Body({
                                        constraints: new Immutable.List([ new Parameter({
                                            key: 'Content-Type',
                                            value: 'application/json',
                                            type: null,
                                            format: null,
                                            name: null,
                                            description: null,
                                            example: null,
                                            internals: new Immutable.List([ ]),
                                            externals: new Immutable.List([ ])
                                        }) ]),
                                        type: null
                                    }) ])
                                }) ]),
                                timeout: null,
                                tags: new Immutable.List([ 'Estimates' ])
                            })
                        })
                    }),
                    '/time': new Group({
                        id: null,
                        name: '/time',
                        children: new Immutable.OrderedMap({
                            get: new Request({
                                id: null,
                                name: 'Time Estimates',
                                description: 'The Time Estimates endpoint returns ETAs for all products offered at a given location, with the responses expressed as integers in seconds. We recommend that this endpoint be called every minute to provide the most accurate, up-to-date ETAs.',
                                url: new URL({
                                    schemes: new Immutable.List([ 'https' ]),
                                    host: 'api.uber.com',
                                    path: '/v1/estimates/time'
                                }),
                                method: 'GET',
                                parameters: new ParameterContainer({
                                    headers: new Immutable.List([ ]),
                                    queries: new Immutable.List([ new Parameter({
                                        key: 'start_latitude',
                                        value: null,
                                        type: 'number',
                                        format: 'double',
                                        name: null,
                                        description: 'Latitude component of start location.',
                                        example: null,
                                        internals: new Immutable.List([ ]),
                                        externals: new Immutable.List([ ])
                                    }), new Parameter({
                                        key: 'start_longitude',
                                        value: null,
                                        type: 'number',
                                        format: 'double',
                                        name: null,
                                        description: 'Longitude component of start location.',
                                        example: null,
                                        internals: new Immutable.List([ ]),
                                        externals: new Immutable.List([ ])
                                    }), new Parameter({
                                        key: 'customer_uuid',
                                        value: null,
                                        type: 'string',
                                        format: 'uuid',
                                        name: null,
                                        description: 'Unique customer identifier to be used for experience customization.',
                                        example: null,
                                        internals: new Immutable.List([ ]),
                                        externals: new Immutable.List([ ])
                                    }), new Parameter({
                                        key: 'product_id',
                                        value: null,
                                        type: 'string',
                                        format: null,
                                        name: null,
                                        description: 'Unique identifier representing a specific product for a given latitude & longitude.',
                                        example: null,
                                        internals: new Immutable.List([ ]),
                                        externals: new Immutable.List([ ])
                                    }) ]),
                                    body: new Immutable.List([ ]),
                                    path: new Immutable.List([ ])
                                }),
                                bodies: new Immutable.List([ ]),
                                auths: new Immutable.List([ ]),
                                responses: new Immutable.List([ new Response({
                                    code: '200',
                                    description: 'An array of products',
                                    parameters: new ParameterContainer({
                                        headers: new Immutable.List([ ]),
                                        queries: new Immutable.List([ ]),
                                        body: new Immutable.List([ new Parameter({
                                            key: 'schema',
                                            value: new Schema({
                                                uri: '#',
                                                value: null,
                                                map: new Immutable.OrderedMap({
                                                    type: new Schema({
                                                        uri: '#/type',
                                                        value: 'array',
                                                        map: null,
                                                        raw: null
                                                    }),
                                                    items: new Schema({
                                                        uri: '#/items',
                                                        value: null,
                                                        map: new Immutable.OrderedMap({
                                                            $ref: new SchemaReference({
                                                                reference: '#/definitions/Product',
                                                                resolved: false,
                                                                value: null
                                                            })
                                                        }),
                                                        raw: null
                                                    })
                                                }),
                                                raw: null
                                            }),
                                            type: null,
                                            format: null,
                                            name: null,
                                            description: null,
                                            example: null,
                                            internals: new Immutable.List([ ]),
                                            externals: new Immutable.List([ new Parameter({
                                                key: 'Content-Type',
                                                value: null,
                                                type: null,
                                                format: null,
                                                name: null,
                                                description: null,
                                                example: null,
                                                internals: new Immutable.List([ new Constraint.Enum([ 'application/json' ]) ]),
                                                externals: new Immutable.List([ ])
                                            }) ])
                                        }) ]),
                                        path: new Immutable.List([ ])
                                    }),
                                    bodies: new Immutable.List([ new Body({
                                        constraints: new Immutable.List([ new Parameter({
                                            key: 'Content-Type',
                                            value: 'application/json',
                                            type: null,
                                            format: null,
                                            name: null,
                                            description: null,
                                            example: null,
                                            internals: new Immutable.List([ ]),
                                            externals: new Immutable.List([ ])
                                        }) ]),
                                        type: null
                                    }) ])
                                }), new Response({
                                    code: 'default',
                                    description: 'Unexpected error',
                                    parameters: new ParameterContainer({
                                        headers: new Immutable.List([ ]),
                                        queries: new Immutable.List([ ]),
                                        body: new Immutable.List([ new Parameter({
                                            key: 'schema',
                                            value: new Schema({
                                                uri: '#',
                                                value: null,
                                                map: new Immutable.OrderedMap({
                                                    $ref: new SchemaReference({
                                                        reference: '#/definitions/Error',
                                                        resolved: false,
                                                        value: null
                                                    })
                                                }),
                                                raw: null
                                            }),
                                            type: null,
                                            format: null,
                                            name: null,
                                            description: null,
                                            example: null,
                                            internals: new Immutable.List([ ]),
                                            externals: new Immutable.List([ new Parameter({
                                                key: 'Content-Type',
                                                value: null,
                                                type: null,
                                                format: null,
                                                name: null,
                                                description: null,
                                                example: null,
                                                internals: new Immutable.List([ new Constraint.Enum([ 'application/json' ]) ]),
                                                externals: new Immutable.List([ ])
                                            }) ])
                                        }) ]),
                                        path: new Immutable.List([ ])
                                    }),
                                    bodies: new Immutable.List([ new Body({
                                        constraints: new Immutable.List([ new Parameter({
                                            key: 'Content-Type',
                                            value: 'application/json',
                                            type: null,
                                            format: null,
                                            name: null,
                                            description: null,
                                            example: null,
                                            internals: new Immutable.List([ ]),
                                            externals: new Immutable.List([ ])
                                        }) ]),
                                        type: null
                                    }) ])
                                }) ]),
                                timeout: null,
                                tags: new Immutable.List([ 'Estimates' ])
                            })
                        })
                    })
                })
            }),
            '/me': new Group({
                id: null,
                name: '/me',
                children: new Immutable.OrderedMap({
                    get: new Request({
                        id: null,
                        name: 'User Profile',
                        description: 'The User Profile endpoint returns information about the Uber user that has authorized with the application.',
                        url: new URL({
                            schemes: new Immutable.List([ 'https' ]),
                            host: 'api.uber.com',
                            path: '/v1/me'
                        }),
                        method: 'GET',
                        parameters: new ParameterContainer({
                            headers: new Immutable.List([ ]),
                            queries: new Immutable.List([ ]),
                            body: new Immutable.List([ ]),
                            path: new Immutable.List([ ])
                        }),
                        bodies: new Immutable.List([ ]),
                        auths: new Immutable.List([ ]),
                        responses: new Immutable.List([ new Response({
                            code: '200',
                            description: 'Profile information for a user',
                            parameters: new ParameterContainer({
                                headers: new Immutable.List([ ]),
                                queries: new Immutable.List([ ]),
                                body: new Immutable.List([ new Parameter({
                                    key: 'schema',
                                    value: new Schema({
                                        uri: '#',
                                        value: null,
                                        map: new Immutable.OrderedMap({
                                            $ref: new SchemaReference({
                                                reference: '#/definitions/Profile',
                                                resolved: false,
                                                value: null
                                            })
                                        }),
                                        raw: null
                                    }),
                                    type: null,
                                    format: null,
                                    name: null,
                                    description: null,
                                    example: null,
                                    internals: new Immutable.List([ ]),
                                    externals: new Immutable.List([ new Parameter({
                                        key: 'Content-Type',
                                        value: null,
                                        type: null,
                                        format: null,
                                        name: null,
                                        description: null,
                                        example: null,
                                        internals: new Immutable.List([ new Constraint.Enum([ 'application/json' ]) ]),
                                        externals: new Immutable.List([ ])
                                    }) ])
                                }) ]),
                                path: new Immutable.List([ ])
                            }),
                            bodies: new Immutable.List([ new Body({
                                constraints: new Immutable.List([ new Parameter({
                                    key: 'Content-Type',
                                    value: 'application/json',
                                    type: null,
                                    format: null,
                                    name: null,
                                    description: null,
                                    example: null,
                                    internals: new Immutable.List([ ]),
                                    externals: new Immutable.List([ ])
                                }) ]),
                                type: null
                            }) ])
                        }), new Response({
                            code: 'default',
                            description: 'Unexpected error',
                            parameters: new ParameterContainer({
                                headers: new Immutable.List([ ]),
                                queries: new Immutable.List([ ]),
                                body: new Immutable.List([ new Parameter({
                                    key: 'schema',
                                    value: new Schema({
                                        uri: '#',
                                        value: null,
                                        map: new Immutable.OrderedMap({
                                            $ref: new SchemaReference({
                                                reference: '#/definitions/Error',
                                                resolved: false,
                                                value: null
                                            })
                                        }),
                                        raw: null
                                    }),
                                    type: null,
                                    format: null,
                                    name: null,
                                    description: null,
                                    example: null,
                                    internals: new Immutable.List([ ]),
                                    externals: new Immutable.List([ new Parameter({
                                        key: 'Content-Type',
                                        value: null,
                                        type: null,
                                        format: null,
                                        name: null,
                                        description: null,
                                        example: null,
                                        internals: new Immutable.List([ new Constraint.Enum([ 'application/json' ]) ]),
                                        externals: new Immutable.List([ ])
                                    }) ])
                                }) ]),
                                path: new Immutable.List([ ])
                            }),
                            bodies: new Immutable.List([ new Body({
                                constraints: new Immutable.List([ new Parameter({
                                    key: 'Content-Type',
                                    value: 'application/json',
                                    type: null,
                                    format: null,
                                    name: null,
                                    description: null,
                                    example: null,
                                    internals: new Immutable.List([ ]),
                                    externals: new Immutable.List([ ])
                                }) ]),
                                type: null
                            }) ])
                        }) ]),
                        timeout: null,
                        tags: new Immutable.List([ 'User' ])
                    })
                })
            }),
            '/history': new Group({
                id: null,
                name: '/history',
                children: new Immutable.OrderedMap({
                    get: new Request({
                        id: null,
                        name: 'User Activity',
                        description: 'The User Activity endpoint returns data about a user\'s lifetime activity with Uber. The response will include pickup locations and times, dropoff locations and times, the distance of past requests, and information about which products were requested.<br><br>The history array in the response will have a maximum length based on the limit parameter. The response value count may exceed limit, therefore subsequent API requests may be necessary.',
                        url: new URL({
                            schemes: new Immutable.List([ 'https' ]),
                            host: 'api.uber.com',
                            path: '/v1/history'
                        }),
                        method: 'GET',
                        parameters: new ParameterContainer({
                            headers: new Immutable.List([ ]),
                            queries: new Immutable.List([ new Parameter({
                                key: 'offset',
                                value: null,
                                type: 'integer',
                                format: 'int32',
                                name: null,
                                description: 'Offset the list of returned results by this amount. Default is zero.',
                                example: null,
                                internals: new Immutable.List([ ]),
                                externals: new Immutable.List([ ])
                            }), new Parameter({
                                key: 'limit',
                                value: null,
                                type: 'integer',
                                format: 'int32',
                                name: null,
                                description: 'Number of items to retrieve. Default is 5, maximum is 100.',
                                example: null,
                                internals: new Immutable.List([ ]),
                                externals: new Immutable.List([ ])
                            }) ]),
                            body: new Immutable.List([ ]),
                            path: new Immutable.List([ ])
                        }),
                        bodies: new Immutable.List([ ]),
                        auths: new Immutable.List([ ]),
                        responses: new Immutable.List([ new Response({
                            code: '200',
                            description: 'History information for the given user',
                            parameters: new ParameterContainer({
                                headers: new Immutable.List([ ]),
                                queries: new Immutable.List([ ]),
                                body: new Immutable.List([ new Parameter({
                                    key: 'schema',
                                    value: new Schema({
                                        uri: '#',
                                        value: null,
                                        map: new Immutable.OrderedMap({
                                            $ref: new SchemaReference({
                                                reference: '#/definitions/Activities',
                                                resolved: false,
                                                value: null
                                            })
                                        }),
                                        raw: null
                                    }),
                                    type: null,
                                    format: null,
                                    name: null,
                                    description: null,
                                    example: null,
                                    internals: new Immutable.List([ ]),
                                    externals: new Immutable.List([ new Parameter({
                                        key: 'Content-Type',
                                        value: null,
                                        type: null,
                                        format: null,
                                        name: null,
                                        description: null,
                                        example: null,
                                        internals: new Immutable.List([ new Constraint.Enum([ 'application/json' ]) ]),
                                        externals: new Immutable.List([ ])
                                    }) ])
                                }) ]),
                                path: new Immutable.List([ ])
                            }),
                            bodies: new Immutable.List([ new Body({
                                constraints: new Immutable.List([ new Parameter({
                                    key: 'Content-Type',
                                    value: 'application/json',
                                    type: null,
                                    format: null,
                                    name: null,
                                    description: null,
                                    example: null,
                                    internals: new Immutable.List([ ]),
                                    externals: new Immutable.List([ ])
                                }) ]),
                                type: null
                            }) ])
                        }), new Response({
                            code: 'default',
                            description: 'Unexpected error',
                            parameters: new ParameterContainer({
                                headers: new Immutable.List([ ]),
                                queries: new Immutable.List([ ]),
                                body: new Immutable.List([ new Parameter({
                                    key: 'schema',
                                    value: new Schema({
                                        uri: '#',
                                        value: null,
                                        map: new Immutable.OrderedMap({
                                            $ref: new SchemaReference({
                                                reference: '#/definitions/Error',
                                                resolved: false,
                                                value: null
                                            })
                                        }),
                                        raw: null
                                    }),
                                    type: null,
                                    format: null,
                                    name: null,
                                    description: null,
                                    example: null,
                                    internals: new Immutable.List([ ]),
                                    externals: new Immutable.List([ new Parameter({
                                        key: 'Content-Type',
                                        value: null,
                                        type: null,
                                        format: null,
                                        name: null,
                                        description: null,
                                        example: null,
                                        internals: new Immutable.List([ new Constraint.Enum([ 'application/json' ]) ]),
                                        externals: new Immutable.List([ ])
                                    }) ])
                                }) ]),
                                path: new Immutable.List([ ])
                            }),
                            bodies: new Immutable.List([ new Body({
                                constraints: new Immutable.List([ new Parameter({
                                    key: 'Content-Type',
                                    value: 'application/json',
                                    type: null,
                                    format: null,
                                    name: null,
                                    description: null,
                                    example: null,
                                    internals: new Immutable.List([ ]),
                                    externals: new Immutable.List([ ])
                                }) ]),
                                type: null
                            }) ])
                        }) ]),
                        timeout: null,
                        tags: new Immutable.List([ 'User' ])
                    })
                })
            })
        })
    }),
    environments: null,
    info: new Info({
        title: 'Uber API',
        description: 'Move your app forward with the Uber API',
        tos: null,
        contact: null,
        license: null,
        version: '1.0.0'
    })
})

export default context
/* eslint-enable max-len */
