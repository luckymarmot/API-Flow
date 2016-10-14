import { UnitTest, registerTest } from '../../../utils/TestUtils'
import Immutable from 'immutable'

import CurlParser from '../Parser'

import Request from '../../../models/Request'

import Constraint from '../../../models/Constraint'
import URL from '../../../models/URL'
import {
    Parameter,
    ParameterContainer
} from '../../../models/Core'
import ExoticReference from '../../../models/references/Exotic'
import Auth from '../../../models/Auth'

@registerTest
export class TestCurlParser extends UnitTest {

    // testing simple with no option
    testSimple() {
        this.__testRequest('curl http://httpbin.org/get',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'GET'
            }))
    }

    testSimpleUppercaseCURL() {
        this.__testRequest('curl http://httpbin.org/get',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'GET'
            }))
    }

    testSimpleNoHttp() {
        this.__testRequest('curl httpbin.org/get',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'GET'
            }))
    }

    testSimpleHttps() {
        this.__testRequest('curl https://httpbin.org/get',
            new Request({
                url: new URL('https://httpbin.org/get'),
                name: 'https://httpbin.org/get',
                method: 'GET'
            }))
    }

    testSimpleQueryParams() {
        this.__testRequest(
            'curl "http://httpbin.org/get?key=value&key2=value2"',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'GET',
                parameters: new ParameterContainer({
                    queries: new Immutable.List([
                        new Parameter({
                            key: 'key',
                            name: 'key',
                            value: 'value',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'value' ])
                            ])
                        }),
                        new Parameter({
                            key: 'key2',
                            name: 'key2',
                            value: 'value2',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'value2' ])
                            ])
                        })
                    ])
                })
            })
        )
    }

    //
    // testing --url option
    //

    testUrlOption() {
        this.__testRequest(
            'curl --url http://httpbin.org/get',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'GET'
            })
        )
    }

    //
    // testing -m --max-time options
    //

    testMaxTimeOption() {
        this.__testRequest(
            'curl -m 3 http://httpbin.org/get',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'GET',
                timeout: 3
            })
        )
    }

    testMaxTimeOptionLong() {
        this.__testRequest(
            'curl --max-time 42 http://httpbin.org/get',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'GET',
                timeout: 42
            })
        )
    }

    testMaxTimeOptionLongMilliseconds() {
        this.__testRequest(
            'curl --max-time 0.1 http://httpbin.org/get',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'GET',
                timeout: 0.1
            })
        )
    }

    //
    // testing -X --request options
    //

    testMethodGET() {
        this.__testRequest(
            'curl http://httpbin.org/get -X GET',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'GET'
            })
        )
    }

    testMethodPOSTAfter() {
        this.__testRequest('curl http://httpbin.org/get -X POST',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST'
            }))
    }

    testMethodPOSTBefore() {
        this.__testRequest('curl -X POST http://httpbin.org/get',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST'
            }))
    }

    testMethodPOSTOverride() {
        this.__testRequest(
            'curl http://httpbin.org/get -X PATCH -X POST',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST'
            })
        )
    }

    testMethodPOSTLong() {
        this.__testRequest(
            'curl http://httpbin.org/get --request POST',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST'
            })
        )
    }

    testMethodHEAD() {
        this.__testRequest('curl http://httpbin.org/get -X HEAD',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'HEAD'
            }))
    }

    testMethodGETOneToken() {
        this.__testRequest('curl http://httpbin.org/get -XGET',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'GET'
            }))
    }

    testMethodPOSTOneToken() {
        this.__testRequest('curl http://httpbin.org/post -XPOST',
            new Request({
                url: new URL('http://httpbin.org/post'),
                name: 'http://httpbin.org/post',
                method: 'POST'
            }))
    }

    //
    // testing -I --head options
    //

    testHeadOption() {
        this.__testRequest('curl -I http://httpbin.org/get',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'HEAD'
            }))
    }

    testHeadOptionLong() {
        this.__testRequest('curl --head http://httpbin.org/get',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'HEAD'
            }))
    }

    testHeadOptionOverrideGET() {
        this.__testRequest(
            'curl -I -X GET http://httpbin.org/get',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'GET'
            })
        )
    }

    //
    // testing -H --header options
    //

    testHeaderSimple() {
        this.__testRequest(
            'curl http://httpbin.org/get -H X-Paw:value',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'GET',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'X-Paw',
                            name: 'X-Paw',
                            value: 'value',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'value' ])
                            ])
                        })
                    ])
                })
            })
        )
    }

    testHeaderMultiple() {
        this.__testRequest(
            `curl http://httpbin.org/get -H X-Paw:value --header \\
            X-Paw-2:\\ my-value'`,
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'GET',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'X-Paw',
                            name: 'X-Paw',
                            value: 'value',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'value' ])
                            ])
                        }),
                        new Parameter({
                            key: 'X-Paw-2',
                            name: 'X-Paw-2',
                            value: 'my-value',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'my-value' ])
                            ])
                        })
                    ])
                })
            })
        )
    }

    testHeaderNormalization() {
        this.__testRequest(
            `curl http://httpbin.org/get -H x-paw:value \\
            --header CONTENT-TYPE:application/json`,
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'GET',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'X-Paw',
                            name: 'X-Paw',
                            value: 'value',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'value' ])
                            ])
                        }),
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/json',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'application/json' ])
                            ])
                        })
                    ])
                })
            })
        )
    }

    //
    // testing -F --form options
    //

    testFormDataSimple() {
        this.__testRequest(
            'curl http://httpbin.org/get -F key=value',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'multipart/form-data',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'multipart/form-data' ])
                            ])
                        })
                    ]),
                    body: new Immutable.List([
                        new Parameter({
                            key: 'key',
                            name: 'key',
                            value: 'value',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'value' ])
                            ])
                        })
                    ])
                })
            })
        )
    }

    testFormDataSimpleNoSpaceToken() {
        this.__testRequest(
            'curl http://httpbin.org/get -Fkey=value',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'multipart/form-data',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'multipart/form-data' ])
                            ])
                        })
                    ]),
                    body: new Immutable.List([
                        new Parameter({
                            key: 'key',
                            name: 'key',
                            value: 'value',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'value' ])
                            ])
                        })
                    ])
                })
            }))
    }

    testFormDataEmptyValue() {
        this.__testRequest(
            'curl http://httpbin.org/get -F key=',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'multipart/form-data',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'multipart/form-data' ])
                            ])
                        })
                    ]),
                    body: new Immutable.List([
                        new Parameter({
                            key: 'key',
                            name: 'key',
                            value: null,
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ null ])
                            ])
                        })
                    ])
                })
            }))
    }

    testFormDataMethodOverrideBefore() {
        this.__testRequest(
            'curl http://httpbin.org/get -X PATCH -F key=value',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'PATCH',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'multipart/form-data',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'multipart/form-data' ])
                            ])
                        })
                    ]),
                    body: new Immutable.List([
                        new Parameter({
                            key: 'key',
                            name: 'key',
                            value: 'value',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'value' ])
                            ])
                        })
                    ])
                })
            }))
    }

    testFormDataMethodOverrideAfter() {
        this.__testRequest(
            'curl http://httpbin.org/get -F key=value -X PATCH',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'PATCH',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'multipart/form-data',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'multipart/form-data' ])
                            ])
                        })
                    ]),
                    body: new Immutable.List([
                        new Parameter({
                            key: 'key',
                            name: 'key',
                            value: 'value',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'value' ])
                            ])
                        })
                    ])
                })
            }))
    }

    testFormDataMultiple() {
        this.__testRequest(
            'curl http://httpbin.org/get -F key=value --form name=Paw',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'multipart/form-data',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'multipart/form-data' ])
                            ])
                        })
                    ]),
                    body: new Immutable.List([
                        new Parameter({
                            key: 'key',
                            name: 'key',
                            value: 'value',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'value' ])
                            ])
                        }),
                        new Parameter({
                            key: 'name',
                            name: 'name',
                            value: 'Paw',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'Paw' ])
                            ])
                        })
                    ])
                })
            }))
    }

    testFormDataWithParams() {
        this.__testRequest(
            'curl http://httpbin.org/get -F $\'key=value;type=text/plain\'',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'multipart/form-data',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'multipart/form-data' ])
                            ])
                        })
                    ]),
                    body: new Immutable.List([
                        new Parameter({
                            key: 'key',
                            name: 'key',
                            value: 'value',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'value' ])
                            ])
                        })
                    ])
                })
            }))
    }

    testFormDataFileAttachedAsFileUpload() {
        this.__testRequest(
            'curl http://httpbin.org/get -F key=@filename.txt',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'multipart/form-data',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'multipart/form-data' ])
                            ])
                        })
                    ]),
                    body: new Immutable.List([
                        new Parameter({
                            key: 'key',
                            name: 'key',
                            value: new ExoticReference({
                                uri: 'filename.txt',
                                relative: 'filename.txt'
                            }),
                            type: 'reference'
                        })
                    ])
                })
            }))
    }

    testFormDataFileAttachedAsText() {
        this.__testRequest(
            'curl http://httpbin.org/get -F "key=<filename.txt"',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'multipart/form-data',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'multipart/form-data' ])
                            ])
                        })
                    ]),
                    body: new Immutable.List([
                        new Parameter({
                            key: 'key',
                            name: 'key',
                            value: new ExoticReference({
                                uri: 'filename.txt',
                                relative: 'filename.txt'
                            }),
                            type: 'reference'
                        })
                    ])
                })
            }))
    }

    //
    // testing --form-string option
    //

    testFormStringSimple() {
        this.__testRequest(
            'curl http://httpbin.org/get --form-string key=value',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'multipart/form-data',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'multipart/form-data' ])
                            ])
                        })
                    ]),
                    body: new Immutable.List([
                        new Parameter({
                            key: 'key',
                            name: 'key',
                            value: 'value',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'value' ])
                            ])
                        })
                    ])
                })
            }))
    }

    testFormStringEmptyValue() {
        this.__testRequest(
            'curl http://httpbin.org/get --form-string key=',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'multipart/form-data',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'multipart/form-data' ])
                            ])
                        })
                    ]),
                    body: new Immutable.List([
                        new Parameter({
                            key: 'key',
                            name: 'key',
                            value: '',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ '' ])
                            ])
                        })
                    ])
                })
            }))
    }

    testFormStringWithAtSign() {
        this.__testRequest(
            'curl http://httpbin.org/get --form-string key=@value',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'multipart/form-data',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'multipart/form-data' ])
                            ])
                        })
                    ]),
                    body: new Immutable.List([
                        new Parameter({
                            key: 'key',
                            name: 'key',
                            value: '@value',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ '@value' ])
                            ])
                        })
                    ])
                })
            }))
    }

    testFormStringWithLessThanSign() {
        this.__testRequest(
            'curl http://httpbin.org/get --form-string $\'key=<value\'',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'multipart/form-data',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'multipart/form-data' ])
                            ])
                        })
                    ]),
                    body: new Immutable.List([
                        new Parameter({
                            key: 'key',
                            name: 'key',
                            value: '<value',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ '<value' ])
                            ])
                        })
                    ])
                })
            }))
    }

    testFormStringWithType() {
        this.__testRequest(
            `curl http://httpbin.org/get --form-string \\
            $\'key=value;type=text/plain\'`,
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'multipart/form-data',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'multipart/form-data' ])
                            ])
                        })
                    ]),
                    body: new Immutable.List([
                        new Parameter({
                            key: 'key',
                            name: 'key',
                            value: 'value;type=text/plain',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'value;type=text/plain' ])
                            ])
                        })
                    ])
                })
            }))
    }

    //
    // testing -d --data --data-ascii --data-binary --data-raw options
    //

    testFormDataKeyValue() {
        this.__testRequest(
            'curl http://httpbin.org/get -d key=value',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            key: 'key',
                            name: 'key',
                            value: 'value',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'value' ])
                            ])
                        })
                    ])
                })
            })
        )
    }

    testFormDataKeyValueMultiple() {
        this.__testRequest(
            'curl http://httpbin.org/get -d key=value --data key2=value2',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            key: 'key',
                            name: 'key',
                            value: 'value',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'value' ])
                            ])
                        }),
                        new Parameter({
                            key: 'key2',
                            name: 'key2',
                            value: 'value2',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'value2' ])
                            ])
                        })
                    ])
                })
            }))
    }

    testFormDataKeyValueOverrideMethodBefore() {
        this.__testRequest(
            'curl http://httpbin.org/get -X PATCH -d key=value',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'PATCH',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            key: 'key',
                            name: 'key',
                            value: 'value',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'value' ])
                            ])
                        })
                    ])
                })
            }))
    }

    testFormDataKeyValueOverrideMethodAfter() {
        this.__testRequest(
            'curl http://httpbin.org/get -d key=value -X PATCH',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'PATCH',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            key: 'key',
                            name: 'key',
                            value: 'value',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'value' ])
                            ])
                        })
                    ])
                })
            }))
    }

    testFormDataKeyValueUrlEncoded() {
        this.__testRequest(
            'curl http://httpbin.org/get -d ke%20y=val%20ue',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            key: 'ke y',
                            name: 'ke y',
                            value: 'val ue',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'val ue' ])
                            ])
                        })
                    ])
                })
            }))
    }

    testFormDataKeyValueEmptyValue() {
        this.__testRequest(
            'curl http://httpbin.org/get -d key=',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            key: 'key',
                            name: 'key',
                            value: '',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ '' ])
                            ])
                        })
                    ])
                })
            }))
    }

    // @NOTE(Behavior was changed to match curl http://httpbin.org/post -d key)
    testFormDataKeyValueNoValue() {
        this.__testRequest(
            'curl http://httpbin.org/get -d key',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            value: 'key',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'key' ])
                            ])
                        })
                    ])
                })
            }))
    }

    testFormDataKeyValueNoSpaceOneToken() {
        this.__testRequest(
            'curl http://httpbin.org/get -dcontent',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            value: 'content',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'content' ])
                            ])
                        })
                    ])
                })
                /*
                bodyType: 'plain',
                body: 'content',
                headers: Immutable.OrderedMap({
                    'Content-Type': 'application/x-www-form-urlencoded'
                })
                */
            }))
    }

    testFormDataKeyValueMultipleValueInOneOption() {
        this.__testRequest(
            'curl http://httpbin.org/get -d "key=value&key2=value2"',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            key: 'key',
                            name: 'key',
                            value: 'value',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'value' ])
                            ])
                        }),
                        new Parameter({
                            key: 'key2',
                            name: 'key2',
                            value: 'value2',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'value2' ])
                            ])
                        })
                    ])
                })
            }))
    }

    testFormDataKeyValueMultipleValueInOneOptionUrlEncoded() {
        this.__testRequest(
            'curl http://httpbin.org/get -d "ke%20y=value&key2=value%2F2"',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            key: 'ke y',
                            name: 'ke y',
                            value: 'value',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'value' ])
                            ])
                        }),
                        new Parameter({
                            key: 'key2',
                            name: 'key2',
                            value: 'value/2',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'value/2' ])
                            ])
                        })
                    ])
                })
            }))
    }

    testFormDataKeyValuePlayingWithEscapes() {
        this.__testRequest(
            'curl http://httpbin.org/get -d $\'key=v\\x61lue\'',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            key: 'key',
                            name: 'key',
                            value: 'value',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'value' ])
                            ])
                        })
                    ])
                })
            }))
    }

    testFormDataKeyValuePlainString() {
        this.__testRequest(
            'curl http://httpbin.org/get -d \'{"key":"va=l&u=e"}\'',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            key: '{"key":"va',
                            name: '{"key":"va',
                            value: 'l',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'l' ])
                            ])
                        }),
                        new Parameter({
                            key: 'u',
                            name: 'u',
                            value: 'e"}',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'e"}' ])
                            ])
                        })
                    ])
                })
            }), true)
    }

    testFormDataKeyValueDataAscii() {
        this.__testRequest(
            'curl http://httpbin.org/get --data-ascii key=value',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            key: 'key',
                            name: 'key',
                            value: 'value',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'value' ])
                            ])
                        })
                    ])
                })
            }))
    }

    // @NOTE
    testFormDataKeyValueDataAsciiPlain() {
        this.__testRequest(
            'curl http://httpbin.org/get --data-ascii sometext',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            value: 'sometext',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'sometext' ])
                            ])
                        })
                    ])
                })
                /*
                bodyType: 'plain',
                body: 'sometext',
                headers: Immutable.OrderedMap({
                    'Content-Type': 'application/x-www-form-urlencoded'
                })
                */
            }))
    }

    testFormDataKeyValueDataBinary() {
        this.__testRequest(
            'curl http://httpbin.org/get --data-binary key=value',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            key: 'key',
                            name: 'key',
                            value: 'value',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'value' ])
                            ])
                        })
                    ])
                })
            }))
    }

    // @NOTE
    testFormDataKeyValueDataBinaryPlain() {
        this.__testRequest(
            'curl http://httpbin.org/get --data-binary sometext',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            value: 'sometext',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'sometext' ])
                            ])
                        })
                    ])
                })
                /*
                bodyType: 'plain',
                body: 'sometext',
                headers: Immutable.OrderedMap({
                    'Content-Type': 'application/x-www-form-urlencoded'
                })
                */
            }))
    }

    testFormDataKeyValueDataRaw() {
        this.__testRequest(
            'curl http://httpbin.org/get --data-raw key=value',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            key: 'key',
                            name: 'key',
                            value: 'value',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'value' ])
                            ])
                        })
                    ])
                })
            }))
    }

    // @NOTE
    testFormDataKeyValueDataRawPlain() {
        this.__testRequest(
            'curl http://httpbin.org/get --data-raw sometext',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            value: 'sometext',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'sometext' ])
                            ])
                        })
                    ])
                })
                /*
                bodyType: 'plain',
                body: 'sometext',
                headers: Immutable.OrderedMap({
                    'Content-Type': 'application/x-www-form-urlencoded'
                })
                */
            }))
    }

    // @NOTE
    testFormDataKeyValueFileReference() {
        this.__testRequest(
            'curl http://httpbin.org/get -d @filename.txt',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            key: 'filename.txt',
                            name: 'filename.txt',
                            value: new ExoticReference({
                                uri: 'filename.txt',
                                relative: 'filename.txt'
                            }),
                            type: 'reference'
                        })
                    ])
                })
                /*
                bodyType: 'file',
                body: new FileReference({
                    filepath: 'filename.txt',
                    convert: 'stripNewlines'
                }),
                headers: Immutable.OrderedMap({
                    'Content-Type': 'application/x-www-form-urlencoded'
                })
                */
            }))
    }

    // @NOTE
    testFormDataKeyValueFileReferenceDataAscii() {
        this.__testRequest(
            'curl http://httpbin.org/get --data-ascii @filename.txt',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            key: 'filename.txt',
                            name: 'filename.txt',
                            value: new ExoticReference({
                                uri: 'filename.txt',
                                relative: 'filename.txt'
                            }),
                            type: 'reference'
                        })
                    ])
                })
                /*
                bodyType: 'file',
                body: new FileReference({
                    filepath: 'filename.txt',
                    convert: 'stripNewlines'
                }),
                headers: Immutable.OrderedMap({
                    'Content-Type': 'application/x-www-form-urlencoded'
                })
                */
            }))
    }

    // @NOTE
    testFormDataKeyValueFileReferenceDataBinaryNoStripNewlines() {
        this.__testRequest(
            'curl http://httpbin.org/get --data-binary @filename.txt',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            key: 'filename.txt',
                            name: 'filename.txt',
                            value: new ExoticReference({
                                uri: 'filename.txt',
                                relative: 'filename.txt'
                            }),
                            type: 'reference'
                        })
                    ])
                })
                /*
                bodyType: 'file',
                body: new FileReference({
                    filepath: 'filename.txt',
                    convert: null
                }),
                headers: Immutable.OrderedMap({
                    'Content-Type': 'application/x-www-form-urlencoded'
                })
                */
            }))
    }

    // @NOTE
    testFormDataKeyValueNoFileReferenceInDataRaw() {
        this.__testRequest(
            'curl http://httpbin.org/get --data-raw @filename.txt',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            value: '@filename.txt',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ '@filename.txt' ])
                            ])
                        })
                    ])
                })
                /*
                bodyType: 'plain',
                body: '@filename.txt',
                headers: Immutable.OrderedMap({
                    'Content-Type': 'application/x-www-form-urlencoded'
                })
                */
            }))
    }

    // @NOTE(Maybe use uri instead of 'body' as key?)
    testFormDataKeyValueFileReferenceMultiple() {
        this.__testRequest(
            `curl http://httpbin.org/get \\
            -d @filename.txt --data @filename2.txt`,
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            key: 'filename.txt',
                            name: 'filename.txt',
                            value: new ExoticReference({
                                uri: 'filename.txt',
                                relative: 'filename.txt'
                            }),
                            type: 'reference'
                        }),
                        new Parameter({
                            key: 'filename2.txt',
                            name: 'filename2.txt',
                            value: new ExoticReference({
                                uri: 'filename2.txt',
                                relative: 'filename2.txt'
                            }),
                            type: 'reference'
                        })
                    ])
                })
                /*
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({
                        key: new FileReference({
                            filepath: 'filename.txt',
                            convert: 'stripNewlines'
                        }),
                        value: null
                    }),
                    new KeyValue({
                        key: new FileReference({
                            filepath: 'filename2.txt',
                            convert: 'stripNewlines'
                        }),
                        value: null
                    })
                ]),
                headers: Immutable.OrderedMap({
                    'Content-Type': 'application/x-www-form-urlencoded'
                })
                */
            }))
    }

    testFormDataKeyValueFileReferenceAndParams() {
        this.__testRequest(
            `curl http://httpbin.org/get -d @filename.txt \\
            -d @filename2.txt --data "name=Paw&key2=value2"`,
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            key: 'filename.txt',
                            name: 'filename.txt',
                            value: new ExoticReference({
                                uri: 'filename.txt',
                                relative: 'filename.txt'
                            }),
                            type: 'reference'
                        }),
                        new Parameter({
                            key: 'filename2.txt',
                            name: 'filename2.txt',
                            value: new ExoticReference({
                                uri: 'filename2.txt',
                                relative: 'filename2.txt'
                            }),
                            type: 'reference'
                        }),
                        new Parameter({
                            key: 'name',
                            name: 'name',
                            value: 'Paw',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'Paw' ])
                            ])
                        }),
                        new Parameter({
                            key: 'key2',
                            name: 'key2',
                            value: 'value2',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'value2' ])
                            ])
                        })
                    ])
                })
                /*
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({
                        key: new FileReference({
                            filepath: 'filename.txt',
                            convert: 'stripNewlines'
                        }),
                        value: null
                    }),
                    new KeyValue({
                        key: new FileReference({
                            filepath: 'filename2.txt',
                            convert: 'stripNewlines'
                        }),
                        value: null
                    }),
                    new KeyValue({
                        key: 'name',
                        value: 'Paw'
                    }),
                    new KeyValue({
                        key: 'key2',
                        value: 'value2'
                    })
                ]),
                headers: Immutable.OrderedMap({
                    'Content-Type': 'application/x-www-form-urlencoded'
                })
                */
            }))
    }

    testFormDataKeyValueMixOfAll() {
        this.__testRequest(
            `curl http://httpbin.org/get --data $\'toto\\ntiti\' \\
            --data-binary @myfile.txt --data-raw @myfile.txt \\
            --data-ascii @myfile.txt -d @myfile.txt -d name=Paw \\
            -d key2=value2 -H Content-Type:text/plain`,
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'text/plain',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'text/plain'
                                ])
                            ])
                        })
                    ]),
                    body: new Immutable.List([
                        new Parameter({
                            key: 'toto\ntiti',
                            name: 'toto\ntiti',
                            value: null,
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ null ])
                            ])
                        }),
                        new Parameter({
                            key: 'myfile.txt',
                            name: 'myfile.txt',
                            value: new ExoticReference({
                                uri: 'myfile.txt',
                                relative: 'myfile.txt'
                            }),
                            type: 'reference'
                        }),
                        new Parameter({
                            key: '@myfile.txt',
                            name: '@myfile.txt',
                            value: null,
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ null ])
                            ])
                        }),
                        new Parameter({
                            key: 'myfile.txt',
                            name: 'myfile.txt',
                            value: new ExoticReference({
                                uri: 'myfile.txt',
                                relative: 'myfile.txt'
                            }),
                            type: 'reference'
                        }),
                        new Parameter({
                            key: 'myfile.txt',
                            name: 'myfile.txt',
                            value: new ExoticReference({
                                uri: 'myfile.txt',
                                relative: 'myfile.txt'
                            }),
                            type: 'reference'
                        }),
                        new Parameter({
                            key: 'name',
                            name: 'name',
                            value: 'Paw',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'Paw' ])
                            ])
                        }),
                        new Parameter({
                            key: 'key2',
                            name: 'key2',
                            value: 'value2',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'value2' ])
                            ])
                        })
                    ])
                })
            }))
    }

    testFormDataKeyValueNewlineInDollarEscape() {
        this.__testRequest(
            'curl http://httpbin.org/post -d $\'key=val\nue\'',
            new Request({
                url: new URL('http://httpbin.org/post'),
                name: 'http://httpbin.org/post',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            key: 'key',
                            name: 'key',
                            value: 'val\nue',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'val\nue' ])
                            ])
                        })
                    ])
                })
            }))
    }

    testFormDataKeyValueNewlineInSimpleQuoteEscape() {
        this.__testRequest(
            'curl http://httpbin.org/post -d \'key=val\nue\'',
            new Request({
                url: new URL('http://httpbin.org/post'),
                name: 'http://httpbin.org/post',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            key: 'key',
                            name: 'key',
                            value: 'val\nue',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'val\nue' ])
                            ])
                        })
                    ])
                })
            }))
    }

    testFormDataKeyValueNewlineInDoubleQuoteEscape() {
        this.__testRequest(
            'curl http://httpbin.org/post -d "key=val\nue"',
            new Request({
                url: new URL('http://httpbin.org/post'),
                name: 'http://httpbin.org/post',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            key: 'key',
                            name: 'key',
                            value: 'val\nue',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'val\nue' ])
                            ])
                        })
                    ])
                })
            }))
    }

    testFormDataKeyValueNewlineNoQuoteBackslashEscape() {
        // backslash newline (with no quote) ignores the newline
        this.__testRequest(
            'curl http://httpbin.org/post -d key=val\\\nue',
            new Request({
                url: new URL('http://httpbin.org/post'),
                name: 'http://httpbin.org/post',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            key: 'key',
                            name: 'key',
                            value: 'value',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'value' ])
                            ])
                        })
                    ])
                })
            }))
    }

    testFormDataUrlEncodeKeyValueNewlineInDoubleQuoteEscape() {
        this.__testRequest(
            'curl http://httpbin.org/post --data-urlencode "key=val\nue"',
            new Request({
                url: new URL('http://httpbin.org/post'),
                name: 'http://httpbin.org/post',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            key: 'key',
                            name: 'key',
                            value: 'val\nue',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'val\nue' ])
                            ])
                        })
                    ])
                })
            }))
    }

    // @NOTE
    testFormDataUrlEncodeFileNameKeyValueNewlineInDoubleQuoteEscape() {
        this.__testRequest(
            'curl http://httpbin.org/post --data-urlencode name@"file\nname"',
            new Request({
                url: new URL('http://httpbin.org/post'),
                name: 'http://httpbin.org/post',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            key: 'name',
                            name: 'name',
                            value: new ExoticReference({
                                uri: 'file\nname',
                                relative: 'file\nname'
                            }),
                            type: 'reference'
                        })
                    ])
                })
                /*
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({
                        key: 'name',
                        value: new FileReference({
                            filepath: 'file\nname',
                            convert: 'urlEncode'
                        })
                    })
                ]),
                headers: Immutable.OrderedMap({
                    'Content-Type': 'application/x-www-form-urlencoded'
                })
                */
            }))
    }

    //
    // testing --data-urlencode
    //

    testFormDataUrlEncodeContent() {
        // content
        this.__testRequest(
            'curl http://httpbin.org/get --data-urlencode value',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            key: 'value',
                            name: 'value',
                            value: '',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ '' ])
                            ])
                        })
                    ])
                })
            }))
    }

    testFormDataUrlEncodeEqualContent() {
        // =content
        this.__testRequest(
            'curl http://httpbin.org/get --data-urlencode =value',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            key: 'value',
                            name: 'value',
                            value: '',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ '' ])
                            ])
                        })
                    ])
                })
            }))
    }

    testFormDataUrlEncodeNameContent() {
        // name=content
        this.__testRequest(
            'curl http://httpbin.org/get --data-urlencode key=value',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            key: 'key',
                            name: 'key',
                            value: 'value',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'value' ])
                            ])
                        })
                    ])
                })
            }))
    }

    // NOTE(strong behavior change)
    testFormDataUrlEncodeFilename() {
        // @filename
        this.__testRequest(
            'curl http://httpbin.org/get --data-urlencode @filename.txt',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            key: 'filename.txt',
                            name: 'filename.txt',
                            value: new ExoticReference({
                                uri: 'filename.txt',
                                relative: 'filename.txt'
                            }),
                            type: 'reference'
                        })
                    ])
                })
                /*
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({
                        key: new FileReference({
                            filepath: 'filename.txt',
                            convert: 'urlEncode'
                        }),
                        value: ''
                    })
                ]),
                headers: Immutable.OrderedMap({
                    'Content-Type': 'application/x-www-form-urlencoded'
                })
                */
            }))
    }

    testFormDataUrlEncodeNameFilename() {
        // name@filename
        this.__testRequest(
            'curl http://httpbin.org/get --data-urlencode name@filename.txt',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            key: 'name',
                            name: 'name',
                            value: new ExoticReference({
                                uri: 'filename.txt',
                                relative: 'filename.txt'
                            }),
                            type: 'reference'
                        })
                    ])
                })
            }))
    }

    testFormDataUrlEncodeEqualContentLooksLikeFilename() {
        this.__testRequest(
            'curl http://httpbin.org/get --data-urlencode =@filename',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            key: '@filename',
                            name: '@filename',
                            value: '',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ '' ])
                            ])
                        })
                    ])
                })
            }))
    }

    testFormDataUrlEncodeEqualContentSpecialCharacters() {
        this.__testRequest(
            'curl http://httpbin.org/get --data-urlencode =value=more@values',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            key: 'value=more@values',
                            name: 'value=more@values',
                            value: '',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ '' ])
                            ])
                        })
                    ])
                })
            }))
    }

    testFormDataUrlEncodeNameContentWithSpecialCharacters() {
        this.__testRequest(
            `curl http://httpbin.org/get \\
            --data-urlencode key=value=more@values`,
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            key: 'key',
                            name: 'key',
                            value: 'value=more@values',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'value=more@values' ])
                            ])
                        })
                    ])
                })
            }))
    }

    testFormDataUrlEncodeNameAmbiguousAtAndEqualWithKey() {
        this.__testRequest(
            'curl http://httpbin.org/get --data-urlencode name@file=path',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            key: 'name@file',
                            name: 'name@file',
                            value: 'path',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'path' ])
                            ])
                        })
                    ])
                })
            }))
    }

    testFormDataUrlEncodeNameAmbiguousAtAndEqualNoKey() {
        this.__testRequest(
            'curl http://httpbin.org/get --data-urlencode @file=path',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            key: '@file',
                            name: '@file',
                            value: 'path',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'path' ])
                            ])
                        })
                    ])
                })
            }))
    }

    testFormDataUrlEncodeNameAmbiguousNameEqualAtValue() {
        this.__testRequest(
            'curl http://httpbin.org/get --data-urlencode name=@value',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            key: 'name',
                            name: 'name',
                            value: '@value',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ '@value' ])
                            ])
                        })
                    ])
                })
            }))
    }

    testFormDataUrlEncodeSpaceBefore() {
        // content
        this.__testRequest(
            'curl http://httpbin.org/get --data-urlencode \\ key=value',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
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
                            key: ' key',
                            name: ' key',
                            value: 'value',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([ 'value' ])
                            ])
                        })
                    ])
                })
            }))
    }

    //
    // testing --compressed option
    //

    testCompressed() {
        this.__testRequest(
            'curl http://httpbin.org/get --compressed',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'GET',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Accept-Encoding',
                            name: 'Accept-Encoding',
                            value: 'gzip',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'gzip'
                                ])
                            ])
                        })
                    ])
                })
            }))
    }

    testCompressedAnotherEncoding() {
        this.__testRequest(
            'curl http://httpbin.org/get -H Accept-Encoding:bzip2 --compressed',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'GET',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Accept-Encoding',
                            name: 'Accept-Encoding',
                            value: 'bzip2;gzip',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'bzip2;gzip'
                                ])
                            ])
                        })
                    ])
                })
            }))
    }

    //
    // testing -A --user-agent option
    //

    testUserAgent() {
        this.__testRequest(
            'curl http://httpbin.org/get ' +
            '--user-agent "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) ' +
            'AppleWebKit/537.75.14 (KHTML, like Gecko) Version/7.0.3 ' +
            'Safari/7046A194A"',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'GET',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'User-Agent',
                            name: 'User-Agent',
                            value:
                                'Mozilla/5.0 (Macintosh; ' +
                                'Intel Mac OS X 10_9_3) ' +
                                'AppleWebKit/537.75.14 ' +
                                '(KHTML, like Gecko) ' +
                                'Version/7.0.3 Safari/7046A194A',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'Mozilla/5.0 (Macintosh; ' +
                                    'Intel Mac OS X 10_9_3) ' +
                                    'AppleWebKit/537.75.14 ' +
                                    '(KHTML, like Gecko) ' +
                                    'Version/7.0.3 Safari/7046A194A'
                                ])
                            ])
                        })
                    ])
                })
            }))
    }

    testUserAgentShort() {
        this.__testRequest(
            'curl http://httpbin.org/get -A "Mozilla/5.0 (Macintosh; ' +
            'Intel Mac OS X 10_9_3) AppleWebKit/537.75.14 ' +
            '(KHTML, like Gecko) Version/7.0.3 Safari/7046A194A"',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'GET',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'User-Agent',
                            name: 'User-Agent',
                            value:
                                'Mozilla/5.0 (Macintosh; ' +
                                'Intel Mac OS X 10_9_3) ' +
                                'AppleWebKit/537.75.14 ' +
                                '(KHTML, like Gecko) ' +
                                'Version/7.0.3 Safari/7046A194A',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'Mozilla/5.0 (Macintosh; ' +
                                    'Intel Mac OS X 10_9_3) ' +
                                    'AppleWebKit/537.75.14 ' +
                                    '(KHTML, like Gecko) ' +
                                    'Version/7.0.3 Safari/7046A194A'
                                ])
                            ])
                        })
                    ])
                })
            }))
    }

    testUserAgentOverride() {
        this.__testRequest(
            'curl http://httpbin.org/get -H "user-agent: Paw/2.2.7"' +
            ' -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) ' +
            'AppleWebKit/537.75.14 (KHTML, like Gecko) ' +
            'Version/7.0.3 Safari/7046A194A"',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'GET',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'User-Agent',
                            name: 'User-Agent',
                            value:
                                'Mozilla/5.0 (Macintosh; ' +
                                'Intel Mac OS X 10_9_3) ' +
                                'AppleWebKit/537.75.14 ' +
                                '(KHTML, like Gecko) ' +
                                'Version/7.0.3 Safari/7046A194A',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'Mozilla/5.0 (Macintosh; ' +
                                    'Intel Mac OS X 10_9_3) ' +
                                    'AppleWebKit/537.75.14 ' +
                                    '(KHTML, like Gecko) ' +
                                    'Version/7.0.3 Safari/7046A194A'
                                ])
                            ])
                        })
                    ])
                })
            }))
    }

    testUserAgentOverridden() {
        this.__testRequest(
            'curl http://httpbin.org/get -A "Mozilla/5.0 (Macintosh; ' +
            'Intel Mac OS X 10_9_3) AppleWebKit/537.75.14 (KHTML, ' +
            'like Gecko) Version/7.0.3 Safari/7046A194A" ' +
            '-H "user-agent: Paw/2.2.7"',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'GET',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'User-Agent',
                            name: 'User-Agent',
                            value: 'Paw/2.2.7',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'Paw/2.2.7'
                                ])
                            ])
                        })
                    ])
                })
            }))
    }

    //
    // testing -b --cookie options
    //

    testCookie() {
        this.__testRequest(
            'curl http://httpbin.org/get -b "key=value"',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'GET',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Cookie',
                            name: 'Cookie',
                            value: 'key=value',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'key=value'
                                ])
                            ])
                        })
                    ])
                })
            }))
    }

    //
    // testing -e --referer options
    //

    testReferer() {
        this.__testRequest(
            'curl http://httpbin.org/get --referer http://google.com',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'GET',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Referer',
                            name: 'Referer',
                            value: 'http://google.com',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'http://google.com'
                                ])
                            ])
                        })
                    ])
                })
            }))
    }

    testRefererShort() {
        this.__testRequest(
            'curl http://httpbin.org/get -e http://google.com',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'GET',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Referer',
                            name: 'Referer',
                            value: 'http://google.com',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'http://google.com'
                                ])
                            ])
                        })
                    ])
                })
            }))
    }

    //
    // testing -u --user --basic --digest --ntlm --negotiate options
    //

    testUserOption() {
        this.__testRequest(
            'curl http://httpbin.org/get -u foo:bar',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'GET',
                auths: new Immutable.List([
                    new Auth.Basic({
                        username: 'foo',
                        password: 'bar'
                    })
                ])
            }))
    }

    testUserOptionNoPassword() {
        this.__testRequest(
            'curl http://httpbin.org/get -u foo',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'GET',
                auths: new Immutable.List([
                    new Auth.Basic({
                        username: 'foo',
                        password: null
                    })
                ])
            }))
    }

    testUserOptionAndBasicOption() {
        this.__testRequest(
            'curl http://httpbin.org/get -u foo:bar --basic',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'GET',
                auths: new Immutable.List([
                    new Auth.Basic({
                        username: 'foo',
                        password: 'bar'
                    })
                ])
            }))
    }

    testUserOptionAndDigestOption() {
        this.__testRequest(
            'curl http://httpbin.org/get -u foo:bar --digest',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'GET',
                auths: new Immutable.List([
                    new Auth.Digest({
                        username: 'foo',
                        password: 'bar'
                    })
                ])
            }))
    }

    testUserOptionAndNtlmOption() {
        this.__testRequest(
            'curl http://httpbin.org/get -u foo:bar --ntlm',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'GET',
                auths: new Immutable.List([
                    new Auth.NTLM({
                        username: 'foo',
                        password: 'bar'
                    })
                ])
            }))
    }

    testUserOptionAndNegotiateOption() {
        this.__testRequest(
            'curl http://httpbin.org/get -u foo:bar --negotiate',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'GET',
                auths: new Immutable.List([
                    new Auth.Negotiate({
                        username: 'foo',
                        password: 'bar'
                    })
                ])
            }))
    }

    //
    // testing http://username:password@domain.com
    //

    testUserInUrl() {
        this.__testRequest(
            'curl https://foo:bar@httpbin.org/get',
            new Request({
                url: new URL('https://httpbin.org/get'),
                name: 'https://httpbin.org/get',
                method: 'GET',
                auths: new Immutable.List([
                    new Auth.Basic({
                        username: 'foo',
                        password: 'bar'
                    })
                ])
            }))
    }

    testUserInUrlNoPassword() {
        this.__testRequest(
            'curl https://foo@httpbin.org/get',
            new Request({
                url: new URL('https://httpbin.org/get'),
                name: 'https://httpbin.org/get',
                method: 'GET',
                auths: new Immutable.List([
                    new Auth.Basic({
                        username: 'foo',
                        password: null
                    })
                ])
            }))
    }

    testUserInUrlNoHttp() {
        this.__testRequest(
            'curl foo:bar@httpbin.org/get',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'GET',
                auths: new Immutable.List([
                    new Auth.Basic({
                        username: 'foo',
                        password: 'bar'
                    })
                ])
            }))
    }

    testUserInUrlNoHttpNoPassword() {
        this.__testRequest(
            'curl foo@httpbin.org/get',
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'GET',
                auths: new Immutable.List([
                    new Auth.Basic({
                        username: 'foo',
                        password: null
                    })
                ])
            }))
    }

    testUserInUrlOverriddenAfter() {
        this.__testRequest(
            'curl https://foo:bar@httpbin.org/get -u myuser:mypassword',
            new Request({
                url: new URL('https://httpbin.org/get'),
                name: 'https://httpbin.org/get',
                method: 'GET',
                auths: new Immutable.List([
                    new Auth.Basic({
                        username: 'myuser',
                        password: 'mypassword'
                    })
                ])
            }))
    }

    testUserInUrlOverriddenBefore() {
        this.__testRequest(
            'curl -u myuser:mypassword https://foo:bar@httpbin.org/get',
            new Request({
                url: new URL('https://httpbin.org/get'),
                name: 'https://httpbin.org/get',
                method: 'GET',
                auths: new Immutable.List([
                    new Auth.Basic({
                        username: 'myuser',
                        password: 'mypassword'
                    })
                ])
            }))
    }

    testUserInUrlWithBasicOptionAfter() {
        this.__testRequest(
            'curl https://foo:bar@httpbin.org/get --basic',
            new Request({
                url: new URL('https://httpbin.org/get'),
                name: 'https://httpbin.org/get',
                method: 'GET',
                auths: new Immutable.List([
                    new Auth.Basic({
                        username: 'foo',
                        password: 'bar'
                    })
                ])
            }))
    }

    testUserInUrlWithBasicOptionBefore() {
        this.__testRequest(
            'curl --basic https://foo:bar@httpbin.org/get',
            new Request({
                url: new URL('https://httpbin.org/get'),
                name: 'https://httpbin.org/get',
                method: 'GET',
                auths: new Immutable.List([
                    new Auth.Basic({
                        username: 'foo',
                        password: 'bar'
                    })
                ])
            }))
    }

    testUserInUrlWithDigestOption() {
        this.__testRequest(
            'curl https://foo:bar@httpbin.org/get --digest',
            new Request({
                url: new URL('https://httpbin.org/get'),
                name: 'https://httpbin.org/get',
                method: 'GET',
                auths: new Immutable.List([
                    new Auth.Digest({
                        username: 'foo',
                        password: 'bar'
                    })
                ])
            }))
    }

    //
    // test multiple requests in same curl command / same options
    //

    testMultipleRequestsSimple() {
        this.__testRequests(
            'curl http://httpbin.org/get http://httpbin.org/post',
            Immutable.List([
                new Request({
                    url: new URL('http://httpbin.org/get'),
                    name: 'http://httpbin.org/get',
                    method: 'GET'
                }),
                new Request({
                    url: new URL('http://httpbin.org/post'),
                    name: 'http://httpbin.org/post',
                    method: 'GET'
                })
            ])
        )
    }

    testMultipleRequestsSameOptions() {
        this.__testRequests(
            `curl -X POST http://httpbin.org/get http://httpbin.org/post \\
            -H X-Paw:value`,
            Immutable.List([
                new Request({
                    url: new URL('http://httpbin.org/get'),
                    name: 'http://httpbin.org/get',
                    method: 'POST',
                    parameters: new ParameterContainer({
                        headers: new Immutable.List([
                            new Parameter({
                                key: 'X-Paw',
                                name: 'X-Paw',
                                value: 'value',
                                type: 'string',
                                internals: new Immutable.List([
                                    new Constraint.Enum([
                                        'value'
                                    ])
                                ])
                            })
                        ])
                    })
                }),
                new Request({
                    url: new URL('http://httpbin.org/post'),
                    name: 'http://httpbin.org/post',
                    method: 'POST',
                    parameters: new ParameterContainer({
                        headers: new Immutable.List([
                            new Parameter({
                                key: 'X-Paw',
                                name: 'X-Paw',
                                value: 'value',
                                type: 'string',
                                internals: new Immutable.List([
                                    new Constraint.Enum([
                                        'value'
                                    ])
                                ])
                            })
                        ])
                    })
                })
            ]))
    }

    testMultipleRequestsSameOptionsUrlOption() {
        this.__testRequests(
            `curl -X POST --url http://httpbin.org/get \\
            --url http://httpbin.org/post -H X-Paw:value`,
            Immutable.List([
                new Request({
                    url: new URL('http://httpbin.org/get'),
                    name: 'http://httpbin.org/get',
                    method: 'POST',
                    parameters: new ParameterContainer({
                        headers: new Immutable.List([
                            new Parameter({
                                key: 'X-Paw',
                                name: 'X-Paw',
                                value: 'value',
                                type: 'string',
                                internals: new Immutable.List([
                                    new Constraint.Enum([
                                        'value'
                                    ])
                                ])
                            })
                        ])
                    })
                }),
                new Request({
                    url: new URL('http://httpbin.org/post'),
                    name: 'http://httpbin.org/post',
                    method: 'POST',
                    parameters: new ParameterContainer({
                        headers: new Immutable.List([
                            new Parameter({
                                key: 'X-Paw',
                                name: 'X-Paw',
                                value: 'value',
                                type: 'string',
                                internals: new Immutable.List([
                                    new Constraint.Enum([
                                        'value'
                                    ])
                                ])
                            })
                        ])
                    })
                })
            ]))
    }

    testMultipleRequestsSameOptionsUrlOptionAlternate() {
        this.__testRequests(
            `curl -X POST \\
            --url http://httpbin.org/get http://httpbin.org/post \\
            -H X-Paw:value`,
            Immutable.List([
                new Request({
                    url: new URL('http://httpbin.org/get'),
                    name: 'http://httpbin.org/get',
                    method: 'POST',
                    parameters: new ParameterContainer({
                        headers: new Immutable.List([
                            new Parameter({
                                key: 'X-Paw',
                                name: 'X-Paw',
                                value: 'value',
                                type: 'string',
                                internals: new Immutable.List([
                                    new Constraint.Enum([
                                        'value'
                                    ])
                                ])
                            })
                        ])
                    })
                }),
                new Request({
                    url: new URL('http://httpbin.org/post'),
                    name: 'http://httpbin.org/post',
                    method: 'POST',
                    parameters: new ParameterContainer({
                        headers: new Immutable.List([
                            new Parameter({
                                key: 'X-Paw',
                                name: 'X-Paw',
                                value: 'value',
                                type: 'string',
                                internals: new Immutable.List([
                                    new Constraint.Enum([
                                        'value'
                                    ])
                                ])
                            })
                        ])
                    })
                })
            ]))
    }

    //
    // test multiple requests in same curl command / with different options
    // -: --next option
    //

    testMultipleRequestsDifferentOptionsSimple() {
        this.__testRequests(
            'curl http://httpbin.org/get -: http://httpbin.org/post',
            Immutable.List([
                new Request({
                    url: new URL('http://httpbin.org/get'),
                    name: 'http://httpbin.org/get',
                    method: 'GET'
                }),
                new Request({
                    url: new URL('http://httpbin.org/post'),
                    name: 'http://httpbin.org/post',
                    method: 'GET'
                })
            ]))
    }

    testMultipleRequestsDifferentOptionsChangeHeaders() {
        this.__testRequests(
            `curl -X POST http://httpbin.org/post \\
            -H X-Paw2:value2 -: http://httpbin.org/get \\
            -H X-Paw:value`,
            Immutable.List([
                new Request({
                    url: new URL('http://httpbin.org/post'),
                    name: 'http://httpbin.org/post',
                    method: 'POST',
                    parameters: new ParameterContainer({
                        headers: new Immutable.List([
                            new Parameter({
                                key: 'X-Paw2',
                                name: 'X-Paw2',
                                value: 'value2',
                                type: 'string',
                                internals: new Immutable.List([
                                    new Constraint.Enum([
                                        'value2'
                                    ])
                                ])
                            })
                        ])
                    })
                }),
                new Request({
                    url: new URL('http://httpbin.org/get'),
                    name: 'http://httpbin.org/get',
                    method: 'GET',
                    parameters: new ParameterContainer({
                        headers: new Immutable.List([
                            new Parameter({
                                key: 'X-Paw',
                                name: 'X-Paw',
                                value: 'value',
                                type: 'string',
                                internals: new Immutable.List([
                                    new Constraint.Enum([
                                        'value'
                                    ])
                                ])
                            })
                        ])
                    })
                })
            ]))
    }

    testMultipleRequestsDifferentOptionsMultipleOfEach() {
        this.__testRequests(
            `curl -u foo:bar https://httpbin.org/get \\
            -H X-Paw2:value2 https://httpbin.org/get?key=value --next \\
            -H X-Paw:value http://httpbin.org/post -X POST`,
            Immutable.List([
                new Request({
                    url: new URL('https://httpbin.org/get'),
                    name: 'https://httpbin.org/get',
                    method: 'GET',
                    parameters: new ParameterContainer({
                        headers: new Immutable.List([
                            new Parameter({
                                key: 'X-Paw2',
                                name: 'X-Paw2',
                                value: 'value2',
                                type: 'string',
                                internals: new Immutable.List([
                                    new Constraint.Enum([
                                        'value2'
                                    ])
                                ])
                            })
                        ])
                    }),
                    auths: new Immutable.List([
                        new Auth.Basic({
                            username: 'foo',
                            password: 'bar'
                        })
                    ])
                }),
                new Request({
                    url: new URL('https://httpbin.org/get'),
                    name: 'https://httpbin.org/get',
                    method: 'GET',
                    parameters: new ParameterContainer({
                        headers: new Immutable.List([
                            new Parameter({
                                key: 'X-Paw2',
                                name: 'X-Paw2',
                                value: 'value2',
                                type: 'string',
                                internals: new Immutable.List([
                                    new Constraint.Enum([
                                        'value2'
                                    ])
                                ])
                            })
                        ]),
                        queries: new Immutable.List([
                            new Parameter({
                                key: 'key',
                                name: 'key',
                                value: 'value',
                                type: 'string',
                                internals: new Immutable.List([
                                    new Constraint.Enum([
                                        'value'
                                    ])
                                ])
                            })
                        ])
                    }),
                    auths: new Immutable.List([
                        new Auth.Basic({
                            username: 'foo',
                            password: 'bar'
                        })
                    ])
                }),
                new Request({
                    url: new URL('http://httpbin.org/post'),
                    name: 'http://httpbin.org/post',
                    method: 'POST',
                    parameters: new ParameterContainer({
                        headers: new Immutable.List([
                            new Parameter({
                                key: 'X-Paw',
                                name: 'X-Paw',
                                value: 'value',
                                type: 'string',
                                internals: new Immutable.List([
                                    new Constraint.Enum([
                                        'value'
                                    ])
                                ])
                            })
                        ])
                    })
                })
            ]))
    }

    //
    // test chaining requests with bash/shell separators
    //

    testShellIgnoreShellMarkDollar() {
        this.__testRequests('$ curl http://httpbin.org/get', Immutable.List([
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'GET'
            })
        ]))
    }

    testShellIgnoreShellMarkChevron() {
        this.__testRequests('> curl http://httpbin.org/get', Immutable.List([
            new Request({
                url: new URL('http://httpbin.org/get'),
                name: 'http://httpbin.org/get',
                method: 'GET'
            })
        ]))
    }

    testShellBreakAfterPipe() {
        this.__testRequests(
            'curl http://httpbin.org/get | cat -X POST',
            Immutable.List([
                new Request({
                    url: new URL('http://httpbin.org/get'),
                    name: 'http://httpbin.org/get',
                    method: 'GET'
                })
            ]))
    }

    testShellBreakAfterPipeNoSpaces() {
        this.__testRequests(
            'curl http://httpbin.org/get|cat -X POST',
            Immutable.List([
                new Request({
                    url: new URL('http://httpbin.org/get'),
                    name: 'http://httpbin.org/get',
                    method: 'GET'
                })
            ]))
    }

    testShellBreakAfterRedirect() {
        this.__testRequests(
            'curl http://httpbin.org/get > filename',
            Immutable.List([
                new Request({
                    url: new URL('http://httpbin.org/get'),
                    name: 'http://httpbin.org/get',
                    method: 'GET'
                })
            ]))
    }

    testShellBreakAfterRedirectNoSpace() {
        this.__testRequests(
            'curl http://httpbin.org/get>filename',
            Immutable.List([
                new Request({
                    url: new URL('http://httpbin.org/get'),
                    name: 'http://httpbin.org/get',
                    method: 'GET'
                })
            ]))
    }

    testShellOptionsAfterRedirect() {
        this.__testRequests(
            'curl httpbin.org/post -d key=value > filename -d key2=value2',
            Immutable.List([
                new Request({
                    url: new URL('http://httpbin.org/post'),
                    name: 'http://httpbin.org/post',
                    method: 'POST',
                    parameters: new ParameterContainer({
                        headers: new Immutable.List([
                            new Parameter({
                                key: 'Content-Type',
                                name: 'Content-Type',
                                value: 'application/x-www-form-urlencoded',
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
                                key: 'key',
                                name: 'key',
                                value: 'value',
                                type: 'string',
                                internals: new Immutable.List([
                                    new Constraint.Enum([ 'value' ])
                                ])
                            }),
                            new Parameter({
                                key: 'key2',
                                name: 'key2',
                                value: 'value2',
                                type: 'string',
                                internals: new Immutable.List([
                                    new Constraint.Enum([ 'value2' ])
                                ])
                            })
                        ])
                    })
                })
            ]))
    }

    testShellChainWithSemiColon() {
        this.__testRequests(
            `curl http://httpbin.org/get ; curl \\
            -X POST http://httpbin.org/post`,
            Immutable.List([
                new Request({
                    url: new URL('http://httpbin.org/get'),
                    name: 'http://httpbin.org/get',
                    method: 'GET'
                }),
                new Request({
                    url: new URL('http://httpbin.org/post'),
                    name: 'http://httpbin.org/post',
                    method: 'POST'
                })
            ]))
    }

    testShellChainWithSemiColonNoSpace() {
        this.__testRequests(
            'curl http://httpbin.org/get;curl -X POST http://httpbin.org/post',
            Immutable.List([
                new Request({
                    url: new URL('http://httpbin.org/get'),
                    name: 'http://httpbin.org/get',
                    method: 'GET'
                }),
                new Request({
                    url: new URL('http://httpbin.org/post'),
                    name: 'http://httpbin.org/post',
                    method: 'POST'
                })
            ]))
    }

    testShellChainWithSimpleAnd() {
        this.__testRequests(
            `curl http://httpbin.org/get & curl \\
            -X POST http://httpbin.org/post`,
            Immutable.List([
                new Request({
                    url: new URL('http://httpbin.org/get'),
                    name: 'http://httpbin.org/get',
                    method: 'GET'
                }),
                new Request({
                    url: new URL('http://httpbin.org/post'),
                    name: 'http://httpbin.org/post',
                    method: 'POST'
                })
            ]))
    }

    testShellChainWithSimpleAndNoSpace() {
        this.__testRequests(
            'curl http://httpbin.org/get&curl -X POST http://httpbin.org/post',
            Immutable.List([
                new Request({
                    url: new URL('http://httpbin.org/get'),
                    name: 'http://httpbin.org/get',
                    method: 'GET'
                }),
                new Request({
                    url: new URL('http://httpbin.org/post'),
                    name: 'http://httpbin.org/post',
                    method: 'POST'
                })
            ]))
    }

    testShellChainWithDoubleAnd() {
        this.__testRequests(
            `curl http://httpbin.org/get && curl \\
            -X POST http://httpbin.org/post`,
            Immutable.List([
                new Request({
                    url: new URL('http://httpbin.org/get'),
                    name: 'http://httpbin.org/get',
                    method: 'GET'
                }),
                new Request({
                    url: new URL('http://httpbin.org/post'),
                    name: 'http://httpbin.org/post',
                    method: 'POST'
                })
            ]))
    }

    testShellChainWithDoubleAndNoSpace() {
        this.__testRequests(
            'curl http://httpbin.org/get&&curl -X POST http://httpbin.org/post',
            Immutable.List([
                new Request({
                    url: new URL('http://httpbin.org/get'),
                    name: 'http://httpbin.org/get',
                    method: 'GET'
                }),
                new Request({
                    url: new URL('http://httpbin.org/post'),
                    name: 'http://httpbin.org/post',
                    method: 'POST'
                })
            ]))
    }

    //
    // ignore unknown options
    //

    testIgnoreUnknownOptionsBefore() {
        this.__testRequests(
            'curl --obscure-unknown-option http://httpbin.org/get -X POST',
            Immutable.List([
                new Request({
                    url: new URL('http://httpbin.org/get'),
                    name: 'http://httpbin.org/get',
                    method: 'POST'
                })
            ]))
    }

    testIgnoreUnknownOptionsAfter() {
        this.__testRequests(
            `curl http://httpbin.org/get -X POST --obscure-unknown-option \\
            -H X-Paw:value`,
            Immutable.List([
                new Request({
                    url: new URL('http://httpbin.org/get'),
                    name: 'http://httpbin.org/get',
                    method: 'POST',
                    parameters: new ParameterContainer({
                        headers: new Immutable.List([
                            new Parameter({
                                key: 'X-Paw',
                                name: 'X-Paw',
                                value: 'value',
                                type: 'string',
                                internals: new Immutable.List([
                                    new Constraint.Enum([
                                        'value'
                                    ])
                                ])
                            })
                        ])
                    })
                })
            ]))
    }

    testIgnoreUnknownOptionsMultipleUrls() {
        this.__testRequests(
            `curl http://httpbin.org/get -X POST -H X-Paw:value \\
            --obscure-unknown-option \\
            -H Content-Type:application/json http://httpbin.org/post`,
            Immutable.List([
                new Request({
                    url: new URL('http://httpbin.org/get'),
                    name: 'http://httpbin.org/get',
                    method: 'POST',
                    parameters: new ParameterContainer({
                        headers: new Immutable.List([
                            new Parameter({
                                key: 'X-Paw',
                                name: 'X-Paw',
                                value: 'value',
                                type: 'string',
                                internals: new Immutable.List([
                                    new Constraint.Enum([
                                        'value'
                                    ])
                                ])
                            }),
                            new Parameter({
                                key: 'Content-Type',
                                name: 'Content-Type',
                                value: 'application/json',
                                type: 'string',
                                internals: new Immutable.List([
                                    new Constraint.Enum([
                                        'application/json'
                                    ])
                                ])
                            })
                        ])
                    })
                }),
                new Request({
                    url: new URL('http://httpbin.org/post'),
                    name: 'http://httpbin.org/post',
                    method: 'POST',
                    parameters: new ParameterContainer({
                        headers: new Immutable.List([
                            new Parameter({
                                key: 'X-Paw',
                                name: 'X-Paw',
                                value: 'value',
                                type: 'string',
                                internals: new Immutable.List([
                                    new Constraint.Enum([
                                        'value'
                                    ])
                                ])
                            }),
                            new Parameter({
                                key: 'Content-Type',
                                name: 'Content-Type',
                                value: 'application/json',
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
            ]))
    }

    testIgnoreUnknownOptionOutput() {
        this.__testRequests(
            'curl --output outputfile.txt http://httpbin.org/get -X POST',
            Immutable.List([
                new Request({
                    url: new URL('http://httpbin.org/get'),
                    name: 'http://httpbin.org/get',
                    method: 'POST'
                })
            ]))
    }

    //
    // real examples
    //

    testExamplePOSTHeadersDataUrlEncode() {
        const input = `curl -X "POST" "https://httpbin.org/post" \\
        -H "locale: de_DE" \\
        -H "apikey: MYAPIKEY" \\
        -H "Content-Type: application/x-www-form-urlencoded" \\
        -H "Accept: application/vnd.my-vendor.api+json;version=2.5.0" \\
        --data-urlencode "username=username" \\
        --data-urlencode "password=test12345"`
        this.__testRequests(input, Immutable.List([
            new Request({
                url: new URL('https://httpbin.org/post'),
                name: 'https://httpbin.org/post',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Locale',
                            name: 'Locale',
                            value: 'de_DE',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'de_DE'
                                ])
                            ])
                        }),
                        new Parameter({
                            key: 'Apikey',
                            name: 'Apikey',
                            value: 'MYAPIKEY',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'MYAPIKEY'
                                ])
                            ])
                        }),
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'application/x-www-form-urlencoded'
                                ])
                            ])
                        }),
                        new Parameter({
                            key: 'Accept',
                            name: 'Accept',
                            value: 'application/' +
                                'vnd.my-vendor.api+json;version=2.5.0',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'application/' +
                                    'vnd.my-vendor.api+json;version=2.5.0'
                                ])
                            ])
                        })
                    ]),
                    body: new Immutable.List([
                        new Parameter({
                            key: 'username',
                            name: 'username',
                            value: 'username',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'username'
                                ])
                            ])
                        }),
                        new Parameter({
                            key: 'password',
                            name: 'password',
                            value: 'test12345',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'test12345'
                                ])
                            ])
                        })
                    ])
                })
            })
        ]))
    }

    testExamplePOSTHeadersDataUrlEncodeTokenStartsWithSpace() {
        // note: this input isn't valid normally, but we try to support it as a
        // workaround to this common user mistake
        const input = `curl -X "POST" "https://httpbin.org/post" \\
        -H "locale: de_DE" \\
        -H "apikey: MYAPIKEY" \\
        -H "Content-Type: application/x-www-form-urlencoded" \\
        -H "Accept: application/vnd.my-vendor.api+json;version=2.5.0" \\
        --data-urlencode "username=username" \\
        --data-urlencode "password=test12345"`
        this.__testRequests(input, Immutable.List([
            new Request({
                url: new URL('https://httpbin.org/post'),
                name: 'https://httpbin.org/post',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Locale',
                            name: 'Locale',
                            value: 'de_DE',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'de_DE'
                                ])
                            ])
                        }),
                        new Parameter({
                            key: 'Apikey',
                            name: 'Apikey',
                            value: 'MYAPIKEY',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'MYAPIKEY'
                                ])
                            ])
                        }),
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'application/x-www-form-urlencoded'
                                ])
                            ])
                        }),
                        new Parameter({
                            key: 'Accept',
                            name: 'Accept',
                            value: 'application/' +
                                'vnd.my-vendor.api+json;version=2.5.0',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'application/' +
                                    'vnd.my-vendor.api+json;version=2.5.0'
                                ])
                            ])
                        })
                    ]),
                    body: new Immutable.List([
                        new Parameter({
                            key: 'username',
                            name: 'username',
                            value: 'username',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'username'
                                ])
                            ])
                        }),
                        new Parameter({
                            key: 'password',
                            name: 'password',
                            value: 'test12345',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'test12345'
                                ])
                            ])
                        })
                    ])
                })
            })
        ]))
    }

    testExamplePOSTHeadersDataUrlEncodeMissingNewLine() {
        // note: this input isn't valid normally, but we try to support it as a
        // workaround to this common user mistake
        const input = `curl -X "POST" "https://httpbin.org/post" \\
        -H "locale: de_DE" \\
        -H "apikey: MYAPIKEY" \\
        -H "Content-Type: application/x-www-form-urlencoded" \\
        -H "Accept: application/vnd.my-vendor.api+json;version=2.5.0" \\
        --data-urlencode "username=username" \\
        --data-urlencode "password=test12345"`
        this.__testRequests(input, Immutable.List([
            new Request({
                url: new URL('https://httpbin.org/post'),
                name: 'https://httpbin.org/post',
                method: 'POST',
                parameters: new ParameterContainer({
                    headers: new Immutable.List([
                        new Parameter({
                            key: 'Locale',
                            name: 'Locale',
                            value: 'de_DE',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'de_DE'
                                ])
                            ])
                        }),
                        new Parameter({
                            key: 'Apikey',
                            name: 'Apikey',
                            value: 'MYAPIKEY',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'MYAPIKEY'
                                ])
                            ])
                        }),
                        new Parameter({
                            key: 'Content-Type',
                            name: 'Content-Type',
                            value: 'application/x-www-form-urlencoded',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'application/x-www-form-urlencoded'
                                ])
                            ])
                        }),
                        new Parameter({
                            key: 'Accept',
                            name: 'Accept',
                            value: 'application/' +
                                'vnd.my-vendor.api+json;version=2.5.0',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'application/' +
                                    'vnd.my-vendor.api+json;version=2.5.0'
                                ])
                            ])
                        })
                    ]),
                    body: new Immutable.List([
                        new Parameter({
                            key: 'username',
                            name: 'username',
                            value: 'username',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'username'
                                ])
                            ])
                        }),
                        new Parameter({
                            key: 'password',
                            name: 'password',
                            value: 'test12345',
                            type: 'string',
                            internals: new Immutable.List([
                                new Constraint.Enum([
                                    'test12345'
                                ])
                            ])
                        })
                    ])
                })
                /*
                headers: Immutable.OrderedMap({
                    Locale: 'de_DE',
                    Apikey: 'MYAPIKEY',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Accept: 'application/vnd.my-vendor.api+json;version=2.5.0'
                }),
                body: Immutable.List([
                    new KeyValue({ key: 'username', value: 'username' }),
                    new KeyValue({ key: 'password', value: 'test12345' })
                ]),
                bodyType: 'urlEncoded'
                */
            })
        ]))
    }

    testDetectCurl() {
        const parser = new CurlParser()

        let input = 'curl http:httpbin.org/get -X GET'

        let expected = [ { format: 'curl', version: 'v1', score: 1 } ]
        let result = parser.detect(input)

        this.assertEqual(expected, result)
    }

    testDetectNotACurl() {
        const parser = new CurlParser()

        let input = 'not a c.u.r.l file'

        let expected = [ { format: 'curl', version: 'v1', score: 0 } ]
        let result = parser.detect(input)

        this.assertEqual(expected, result)
    }

    //
    // helpers
    //

    __testRequest(input, expected, compareBodyString = false, verbose = false) {
        this.__testRequests(
            input,
            Immutable.List([ expected ]),
            compareBodyString,
            verbose
        )
    }

    __testRequests(
        input,
        expected,
        compareBodyString = false,
        verbose = false
    ) {
        const parser = new CurlParser()
        let context = parser.parse({
            content: input
        })
        let requests = context.getIn([ 'group', 'children' ])

        // remove bodyString from request if we don't want to compare it here

        /* eslint-disable  no-console */
        if (verbose) {
            console.log(requests)
            console.log(expected)
        }
        /* eslint-enable  no-console */

        this.assertJSONEqual(requests, expected)
    }
}
