import { UnitTest, registerTest } from '../../../utils/TestUtils'
import Immutable from 'immutable'

import CurlParser from '../Parser'
import Request, {
    KeyValue,
    FileReference
} from '../../../immutables/RESTRequest'
import {
    BasicAuth,
    DigestAuth,
    NTLMAuth,
    NegotiateAuth
} from '../../../immutables/Auth'

@registerTest
class TestCurlParser extends UnitTest {

    // testing simple with no option
    testSimple() {
        this.__testRequest('curl http://httpbin.org/get',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'GET'
            }))
    }

    testSimpleUppercaseCURL() {
        this.__testRequest('curl http://httpbin.org/get',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'GET'
            }))
    }

    testSimpleNoHttp() {
        this.__testRequest('curl httpbin.org/get',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'GET'
            }))
    }

    testSimpleHttps() {
        this.__testRequest('curl https://httpbin.org/get',
            new Request({
                url: 'https://httpbin.org/get',
                method: 'GET'
            }))
    }

    testSimpleQueryParams() {
        this.__testRequest(
            'curl "http://httpbin.org/get?key=value&key2=value2"',
            new Request({
                url: 'http://httpbin.org/get?key=value&key2=value2',
                method: 'GET'
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
                url: 'http://httpbin.org/get',
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
                url: 'http://httpbin.org/get',
                method: 'GET',
                timeout: 3
            })
        )
    }

    testMaxTimeOptionLong() {
        this.__testRequest(
            'curl --max-time 42 http://httpbin.org/get',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'GET',
                timeout: 42
            })
        )
    }

    testMaxTimeOptionLongMilliseconds() {
        this.__testRequest(
            'curl --max-time 0.1 http://httpbin.org/get',
            new Request({
                url: 'http://httpbin.org/get',
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
                url: 'http://httpbin.org/get',
                method: 'GET'
            })
        )
    }

    testMethodPOSTAfter() {
        this.__testRequest('curl http://httpbin.org/get -X POST',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST'
            }))
    }

    testMethodPOSTBefore() {
        this.__testRequest('curl -X POST http://httpbin.org/get',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST'
            }))
    }

    testMethodPOSTOverride() {
        this.__testRequest(
            'curl http://httpbin.org/get -X PATCH -X POST',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST'
            })
        )
    }

    testMethodPOSTLong() {
        this.__testRequest(
            'curl http://httpbin.org/get --request POST',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST'
            })
        )
    }

    testMethodHEAD() {
        this.__testRequest('curl http://httpbin.org/get -X HEAD',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'HEAD'
            }))
    }

    testMethodGETOneToken() {
        this.__testRequest('curl http://httpbin.org/get -XGET',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'GET'
            }))
    }

    testMethodPOSTOneToken() {
        this.__testRequest('curl http://httpbin.org/post -XPOST',
            new Request({
                url: 'http://httpbin.org/post',
                method: 'POST'
            }))
    }

    //
    // testing -I --head options
    //

    testHeadOption() {
        this.__testRequest('curl -I http://httpbin.org/get',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'HEAD'
            }))
    }

    testHeadOptionLong() {
        this.__testRequest('curl --head http://httpbin.org/get',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'HEAD'
            }))
    }

    testHeadOptionOverrideGET() {
        this.__testRequest(
            'curl -I -X GET http://httpbin.org/get',
            new Request({
                url: 'http://httpbin.org/get',
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
                url: 'http://httpbin.org/get',
                method: 'GET',
                headers: Immutable.OrderedMap({
                    'X-Paw': 'value'
                })
            })
        )
    }

    testHeaderMultiple() {
        this.__testRequest(
            `curl http://httpbin.org/get -H X-Paw:value --header \\
            X-Paw-2:\\ my-value'`,
            new Request({
                url: 'http://httpbin.org/get',
                method: 'GET',
                headers: Immutable.OrderedMap({
                    'X-Paw': 'value',
                    'X-Paw-2': 'my-value'
                })
            })
        )
    }

    testHeaderNormalization() {
        this.__testRequest(
            `curl http://httpbin.org/get -H x-paw:value \\
            --header CONTENT-TYPE:application/json`,
            new Request({
                url: 'http://httpbin.org/get',
                method: 'GET',
                headers: Immutable.OrderedMap({
                    'X-Paw': 'value',
                    'Content-Type': 'application/json'
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
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'formData',
                body: Immutable.List([
                    new KeyValue({ key: 'key', value: 'value' })
                ])
            })
        )
    }

    testFormDataSimpleNoSpaceToken() {
        this.__testRequest(
            'curl http://httpbin.org/get -Fkey=value',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'formData',
                body: Immutable.List([
                    new KeyValue({ key: 'key', value: 'value' })
                ])
            }))
    }

    testFormDataEmptyValue() {
        this.__testRequest(
            'curl http://httpbin.org/get -F key=',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'formData',
                body: Immutable.List([
                    new KeyValue({ key: 'key', value: null })
                ])
            }))
    }

    testFormDataMethodOverrideBefore() {
        this.__testRequest(
            'curl http://httpbin.org/get -X PATCH -F key=value',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'PATCH',
                bodyType: 'formData',
                body: Immutable.List([
                    new KeyValue({ key: 'key', value: 'value' })
                ])
            }))
    }

    testFormDataMethodOverrideAfter() {
        this.__testRequest(
            'curl http://httpbin.org/get -F key=value -X PATCH',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'PATCH',
                bodyType: 'formData',
                body: Immutable.List([
                    new KeyValue({ key: 'key', value: 'value' })
                ])
            }))
    }

    testFormDataMultiple() {
        this.__testRequest(
            'curl http://httpbin.org/get -F key=value --form name=Paw',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'formData',
                body: Immutable.List([
                    new KeyValue({ key: 'key', value: 'value' }),
                    new KeyValue({ key: 'name', value: 'Paw' })
                ])
            }))
    }

    testFormDataWithParams() {
        this.__testRequest(
            'curl http://httpbin.org/get -F $\'key=value;type=text/plain\'',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'formData',
                body: Immutable.List([
                    new KeyValue({ key: 'key', value: 'value' })
                ])
            }))
    }

    testFormDataFileAttachedAsFileUpload() {
        this.__testRequest(
            'curl http://httpbin.org/get -F key=@filename.txt',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'formData',
                body: Immutable.List([
                    new KeyValue({
                        key: 'key',
                        value: new FileReference({
                            filepath: 'filename.txt',
                            convert: null
                        })
                    })
                ])
            }))
    }

    testFormDataFileAttachedAsText() {
        this.__testRequest(
            'curl http://httpbin.org/get -F "key=<filename.txt"',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'formData',
                body: Immutable.List([
                    new KeyValue({
                        key: 'key',
                        value: new FileReference({
                            filepath: 'filename.txt',
                            convert: null
                        })
                    })
                ])
            }))
    }

    //
    // testing --form-string option
    //

    testFormStringSimple() {
        this.__testRequest(
            'curl http://httpbin.org/get --form-string key=value',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'formData',
                body: Immutable.List([
                    new KeyValue({ key: 'key', value: 'value' })
                ])
            }))
    }

    testFormStringEmptyValue() {
        this.__testRequest(
            'curl http://httpbin.org/get --form-string key=',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'formData',
                body: Immutable.List([
                    new KeyValue({ key: 'key', value: '' })
                ])
            }))
    }

    testFormStringWithAtSign() {
        this.__testRequest(
            'curl http://httpbin.org/get --form-string key=@value',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'formData',
                body: Immutable.List([
                    new KeyValue({ key: 'key', value: '@value' })
                ])
            }))
    }

    testFormStringWithLessThanSign() {
        this.__testRequest(
            'curl http://httpbin.org/get --form-string $\'key=<value\'',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'formData',
                body: Immutable.List([
                    new KeyValue({ key: 'key', value: '<value' })
                ])
            }))
    }

    testFormStringWithType() {
        this.__testRequest(
            `curl http://httpbin.org/get --form-string \\
            $\'key=value;type=text/plain\'`,
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'formData',
                body: Immutable.List([
                    new KeyValue({ key: 'key', value: 'value;type=text/plain' })
                ])
            }))
    }

    //
    // testing -d --data --data-ascii --data-binary --data-raw options
    //

    testFormDataKeyValue() {
        this.__testRequest(
            'curl http://httpbin.org/get -d key=value',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({ key: 'key', value: 'value' })
                ])
            }))
    }

    testFormDataKeyValueMultiple() {
        this.__testRequest(
            'curl http://httpbin.org/get -d key=value --data key2=value2',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({ key: 'key', value: 'value' }),
                    new KeyValue({ key: 'key2', value: 'value2' })
                ])
            }))
    }

    testFormDataKeyValueOverrideMethodBefore() {
        this.__testRequest(
            'curl http://httpbin.org/get -X PATCH -d key=value',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'PATCH',
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({ key: 'key', value: 'value' })
                ])
            }))
    }

    testFormDataKeyValueOverrideMethodAfter() {
        this.__testRequest(
            'curl http://httpbin.org/get -d key=value -X PATCH',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'PATCH',
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({ key: 'key', value: 'value' })
                ])
            }))
    }

    testFormDataKeyValueUrlEncoded() {
        this.__testRequest(
            'curl http://httpbin.org/get -d ke%20y=val%20ue',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({ key: 'ke y', value: 'val ue' })
                ])
            }))
    }

    testFormDataKeyValueEmptyValue() {
        this.__testRequest(
            'curl http://httpbin.org/get -d key=',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({ key: 'key', value: null })
                ])
            }))
    }

    testFormDataKeyValueNoValue() {
        this.__testRequest(
            'curl http://httpbin.org/get -d key',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({ key: 'key', value: null })
                ])
            }))
    }

    testFormDataKeyValueNoSpaceOneToken() {
        this.__testRequest(
            'curl http://httpbin.org/get -dcontent',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({ key: 'content', value: null })
                ])
            }))
    }

    testFormDataKeyValueMultipleValueInOneOption() {
        this.__testRequest(
            'curl http://httpbin.org/get -d "key=value&key2=value2"',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({ key: 'key', value: 'value' }),
                    new KeyValue({ key: 'key2', value: 'value2' })
                ])
            }))
    }

    testFormDataKeyValueMultipleValueInOneOptionUrlEncoded() {
        this.__testRequest(
            'curl http://httpbin.org/get -d "ke%20y=value&key2=value%2F2"',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({ key: 'ke y', value: 'value' }),
                    new KeyValue({ key: 'key2', value: 'value/2' })
                ])
            }))
    }

    testFormDataKeyValuePlayingWithEscapes() {
        this.__testRequest(
            'curl http://httpbin.org/get -d $\'key=v\\x61lue\'',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({ key: 'key', value: 'value' })
                ])
            }))
    }

    testFormDataKeyValuePlainString() {
        this.__testRequest(
            'curl http://httpbin.org/get -d \'{"key":"va=l&u=e"}\'',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({ key: '{"key":"va', value: 'l' }),
                    new KeyValue({ key: 'u', value: 'e"}' })
                ]),
                bodyString: '{"key":"va=l&u=e"}'
            }), true)
    }

    testFormDataKeyValueDataAscii() {
        this.__testRequest(
            'curl http://httpbin.org/get --data-ascii key=value',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({ key: 'key', value: 'value' })
                ])
            }))
    }

    testFormDataKeyValueDataAsciiPlain() {
        this.__testRequest(
            'curl http://httpbin.org/get --data-ascii sometext',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({ key: 'sometext', value: null })
                ])
            }))
    }

    testFormDataKeyValueDataBinary() {
        this.__testRequest(
            'curl http://httpbin.org/get --data-binary key=value',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({ key: 'key', value: 'value' })
                ])
            }))
    }

    testFormDataKeyValueDataBinaryPlain() {
        this.__testRequest(
            'curl http://httpbin.org/get --data-binary sometext',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({ key: 'sometext', value: null })
                ])
            }))
    }

    testFormDataKeyValueDataRaw() {
        this.__testRequest(
            'curl http://httpbin.org/get --data-raw key=value',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({ key: 'key', value: 'value' })
                ])
            }))
    }

    testFormDataKeyValueDataRawPlain() {
        this.__testRequest(
            'curl http://httpbin.org/get --data-raw sometext',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({ key: 'sometext', value: null })
                ])
            }))
    }

    testFormDataKeyValueFileReference() {
        this.__testRequest(
            'curl http://httpbin.org/get -d @filename.txt',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({
                        key: new FileReference({
                            filepath: 'filename.txt',
                            convert: 'stripNewlines'
                        }),
                        value: null
                    })
                ])
            }))
    }

    testFormDataKeyValueFileReferenceDataAscii() {
        this.__testRequest(
            'curl http://httpbin.org/get --data-ascii @filename.txt',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({
                        key: new FileReference({
                            filepath: 'filename.txt',
                            convert: 'stripNewlines'
                        }),
                        value: null
                    })
                ])
            }))
    }

    testFormDataKeyValueFileReferenceDataBinaryNoStripNewlines() {
        this.__testRequest(
            'curl http://httpbin.org/get --data-binary @filename.txt',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({
                        key: new FileReference({
                            filepath: 'filename.txt',
                            convert: null
                        }),
                        value: null
                    })
                ])
            }))
    }

    testFormDataKeyValueNoFileReferenceInDataRaw() {
        this.__testRequest(
            'curl http://httpbin.org/get --data-raw @filename.txt',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({ key: '@filename.txt', value: null })
                ])
            }))
    }

    testFormDataKeyValueFileReferenceMultiple() {
        this.__testRequest(
            `curl http://httpbin.org/get \\
            -d @filename.txt --data @filename2.txt`,
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
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
                ])
            }))
    }

    testFormDataKeyValueFileReferenceAndParams() {
        this.__testRequest(
            `curl http://httpbin.org/get -d @filename.txt \\
            -d @filename2.txt --data "name=Paw&key2=value2"`,
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
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
                ])
            }))
    }

    testFormDataKeyValueMixOfAll() {
        this.__testRequest(
            `curl http://httpbin.org/get --data $\'toto\\ntiti\' \\
            --data-binary @myfile.txt --data-raw @myfile.txt \\
            --data-ascii @myfile.txt -d @myfile.txt -d name=Paw \\
            -d key2=value2 -H Content-Type:text/plain`,
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                headers: Immutable.OrderedMap({
                    'Content-Type': 'text/plain'
                }),
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({
                        key: 'toto\ntiti',
                        value: null
                    }),
                    new KeyValue({
                        key: new FileReference({
                            filepath: 'myfile.txt',
                            convert: null
                        }),
                        value: null
                    }),
                    new KeyValue({
                        key: '@myfile.txt',
                        value: null
                    }),
                    new KeyValue({
                        key: new FileReference({
                            filepath: 'myfile.txt',
                            convert: 'stripNewlines'
                        }),
                        value: null
                    }),
                    new KeyValue({
                        key: new FileReference({
                            filepath: 'myfile.txt',
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
                ])
            }))
    }

    testFormDataKeyValueNewlineInDollarEscape() {
        this.__testRequest(
            'curl http://httpbin.org/post -d $\'key=val\nue\'',
            new Request({
                url: 'http://httpbin.org/post',
                method: 'POST',
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({ key: 'key', value: 'val\nue' })
                ])
            }))
    }

    testFormDataKeyValueNewlineInSimpleQuoteEscape() {
        this.__testRequest(
            'curl http://httpbin.org/post -d \'key=val\nue\'',
            new Request({
                url: 'http://httpbin.org/post',
                method: 'POST',
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({ key: 'key', value: 'val\nue' })
                ])
            }))
    }

    testFormDataKeyValueNewlineInDoubleQuoteEscape() {
        this.__testRequest(
            'curl http://httpbin.org/post -d "key=val\nue"',
            new Request({
                url: 'http://httpbin.org/post',
                method: 'POST',
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({ key: 'key', value: 'val\nue' })
                ])
            }))
    }

    testFormDataKeyValueNewlineNoQuoteBackslashEscape() {
        // backslash newline (with no quote) ignores the newline
        this.__testRequest(
            'curl http://httpbin.org/post -d key=val\\\nue',
            new Request({
                url: 'http://httpbin.org/post',
                method: 'POST',
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({ key: 'key', value: 'value' })
                ])
            }))
    }

    testFormDataUrlEncodeKeyValueNewlineInDoubleQuoteEscape() {
        this.__testRequest(
            'curl http://httpbin.org/post --data-urlencode "key=val\nue"',
            new Request({
                url: 'http://httpbin.org/post',
                method: 'POST',
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({ key: 'key', value: 'val\nue' })
                ])
            }))
    }

    testFormDataUrlEncodeFileNameKeyValueNewlineInDoubleQuoteEscape() {
        this.__testRequest(
            'curl http://httpbin.org/post --data-urlencode name@"file\nname"',
            new Request({
                url: 'http://httpbin.org/post',
                method: 'POST',
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({
                        key: 'name',
                        value: new FileReference({
                            filepath: 'file\nname',
                            convert: 'urlEncode'
                        })
                    })
                ])
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
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({ key: 'value', value: null })
                ])
            }))
    }

    testFormDataUrlEncodeEqualContent() {
        // =content
        this.__testRequest(
            'curl http://httpbin.org/get --data-urlencode =value',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({ key: 'value', value: null })
                ])
            }))
    }

    testFormDataUrlEncodeNameContent() {
        // name=content
        this.__testRequest(
            'curl http://httpbin.org/get --data-urlencode key=value',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({ key: 'key', value: 'value' })
                ])
            }))
    }

    testFormDataUrlEncodeFilename() {
        // @filename
        this.__testRequest(
            'curl http://httpbin.org/get --data-urlencode @filename.txt',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({
                        key: new FileReference({
                            filepath: 'filename.txt',
                            convert: 'urlEncode'
                        }),
                        value: null
                    })
                ])
            }))
    }

    testFormDataUrlEncodeNameFilename() {
        // name@filename
        this.__testRequest(
            'curl http://httpbin.org/get --data-urlencode name@filename.txt',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({
                        key: 'name',
                        value: new FileReference({
                            filepath: 'filename.txt',
                            convert: 'urlEncode'
                        })
                    })
                ])
            }))
    }

    testFormDataUrlEncodeEqualContentLooksLikeFilename() {
        this.__testRequest(
            'curl http://httpbin.org/get --data-urlencode =@filename',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({ key: '@filename', value: null })
                ])
            }))
    }

    testFormDataUrlEncodeEqualContentSpecialCharacters() {
        this.__testRequest(
            'curl http://httpbin.org/get --data-urlencode =value=more@values',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({ key: 'value=more@values', value: null })
                ])
            }))
    }

    testFormDataUrlEncodeNameContentWithSpecialCharacters() {
        this.__testRequest(
            `curl http://httpbin.org/get \\
            --data-urlencode key=value=more@values`,
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({ key: 'key', value: 'value=more@values' })
                ])
            }))
    }

    testFormDataUrlEncodeNameAmbiguousAtAndEqualWithKey() {
        this.__testRequest(
            'curl http://httpbin.org/get --data-urlencode name@file=path',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({ key: 'name@file', value: 'path' })
                ])
            }))
    }

    testFormDataUrlEncodeNameAmbiguousAtAndEqualNoKey() {
        this.__testRequest(
            'curl http://httpbin.org/get --data-urlencode @file=path',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({ key: '@file', value: 'path' })
                ])
            }))
    }

    testFormDataUrlEncodeNameAmbiguousNameEqualAtValue() {
        this.__testRequest(
            'curl http://httpbin.org/get --data-urlencode name=@value',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({ key: 'name', value: '@value' })
                ])
            }))
    }

    testFormDataUrlEncodeSpaceBefore() {
        // content
        this.__testRequest(
            'curl http://httpbin.org/get --data-urlencode \\ key=value',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'POST',
                bodyType: 'urlEncoded',
                body: Immutable.List([
                    new KeyValue({ key: ' key', value: 'value' })
                ])
            }))
    }

    //
    // testing --compressed option
    //

    testCompressed() {
        this.__testRequest(
            'curl http://httpbin.org/get --compressed',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'GET',
                headers: Immutable.OrderedMap({
                    'Accept-Encoding': 'gzip'
                })
            }))
    }

    testCompressedAnotherEncoding() {
        this.__testRequest(
            'curl http://httpbin.org/get -H Accept-Encoding:bzip2 --compressed',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'GET',
                headers: Immutable.OrderedMap({
                    'Accept-Encoding': 'bzip2;gzip'
                })
            }))
    }

    //
    // testing -A --user-agent option
    //

    testUserAgent() {
        this.__testRequest(
            'curl http://httpbin.org/get --user-agent "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.75.14 (KHTML, like Gecko) Version/7.0.3 Safari/7046A194A"',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'GET',
                headers: Immutable.OrderedMap({
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.75.14 (KHTML, like Gecko) Version/7.0.3 Safari/7046A194A'
                })
            }))
    }

    testUserAgentShort() {
        this.__testRequest(
            'curl http://httpbin.org/get -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.75.14 (KHTML, like Gecko) Version/7.0.3 Safari/7046A194A"',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'GET',
                headers: Immutable.OrderedMap({
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.75.14 (KHTML, like Gecko) Version/7.0.3 Safari/7046A194A'
                })
            }))
    }

    testUserAgentOverride() {
        this.__testRequest(
            'curl http://httpbin.org/get -H "user-agent: Paw/2.2.7" -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.75.14 (KHTML, like Gecko) Version/7.0.3 Safari/7046A194A"',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'GET',
                headers: Immutable.OrderedMap({
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.75.14 (KHTML, like Gecko) Version/7.0.3 Safari/7046A194A'
                })
            }))
    }

    testUserAgentOverridden() {
        this.__testRequest(
            'curl http://httpbin.org/get -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.75.14 (KHTML, like Gecko) Version/7.0.3 Safari/7046A194A" -H "user-agent: Paw/2.2.7"',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'GET',
                headers: Immutable.OrderedMap({
                    'User-Agent': 'Paw/2.2.7'
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
                url: 'http://httpbin.org/get',
                method: 'GET',
                headers: Immutable.OrderedMap({
                    Cookie: 'key=value'
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
                url: 'http://httpbin.org/get',
                method: 'GET',
                headers: Immutable.OrderedMap({
                    Referer: 'http://google.com'
                })
            }))
    }

    testRefererShort() {
        this.__testRequest(
            'curl http://httpbin.org/get -e http://google.com',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'GET',
                headers: Immutable.OrderedMap({
                    Referer: 'http://google.com'
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
                url: 'http://httpbin.org/get',
                method: 'GET',
                auth: new BasicAuth({
                    username: 'foo',
                    password: 'bar'
                })
            }))
    }

    testUserOptionNoPassword() {
        this.__testRequest(
            'curl http://httpbin.org/get -u foo',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'GET',
                auth: new BasicAuth({
                    username: 'foo',
                    password: null
                })
            }))
    }

    testUserOptionAndBasicOption() {
        this.__testRequest(
            'curl http://httpbin.org/get -u foo:bar --basic',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'GET',
                auth: new BasicAuth({
                    username: 'foo',
                    password: 'bar'
                })
            }))
    }

    testUserOptionAndDigestOption() {
        this.__testRequest(
            'curl http://httpbin.org/get -u foo:bar --digest',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'GET',
                auth: new DigestAuth({
                    username: 'foo',
                    password: 'bar'
                })
            }))
    }

    testUserOptionAndNtlmOption() {
        this.__testRequest(
            'curl http://httpbin.org/get -u foo:bar --ntlm',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'GET',
                auth: new NTLMAuth({
                    username: 'foo',
                    password: 'bar'
                })
            }))
    }

    testUserOptionAndNegotiateOption() {
        this.__testRequest(
            'curl http://httpbin.org/get -u foo:bar --negotiate',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'GET',
                auth: new NegotiateAuth({
                    username: 'foo',
                    password: 'bar'
                })
            }))
    }

    //
    // testing http://username:password@domain.com
    //

    testUserInUrl() {
        this.__testRequest(
            'curl https://foo:bar@httpbin.org/get',
            new Request({
                url: 'https://httpbin.org/get',
                method: 'GET',
                auth: new BasicAuth({
                    username: 'foo',
                    password: 'bar'
                })
            }))
    }

    testUserInUrlNoPassword() {
        this.__testRequest(
            'curl https://foo@httpbin.org/get',
            new Request({
                url: 'https://httpbin.org/get',
                method: 'GET',
                auth: new BasicAuth({
                    username: 'foo',
                    password: null
                })
            }))
    }

    testUserInUrlNoHttp() {
        this.__testRequest(
            'curl foo:bar@httpbin.org/get',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'GET',
                auth: new BasicAuth({
                    username: 'foo',
                    password: 'bar'
                })
            }))
    }

    testUserInUrlNoHttpNoPassword() {
        this.__testRequest(
            'curl foo@httpbin.org/get',
            new Request({
                url: 'http://httpbin.org/get',
                method: 'GET',
                auth: new BasicAuth({
                    username: 'foo',
                    password: null
                })
            }))
    }

    testUserInUrlOverriddenAfter() {
        this.__testRequest(
            'curl https://foo:bar@httpbin.org/get -u myuser:mypassword',
            new Request({
                url: 'https://httpbin.org/get',
                method: 'GET',
                auth: new BasicAuth({
                    username: 'myuser',
                    password: 'mypassword'
                })
            }))
    }

    testUserInUrlOverriddenBefore() {
        this.__testRequest(
            'curl -u myuser:mypassword https://foo:bar@httpbin.org/get',
            new Request({
                url: 'https://httpbin.org/get',
                method: 'GET',
                auth: new BasicAuth({
                    username: 'myuser',
                    password: 'mypassword'
                })
            }))
    }

    testUserInUrlWithBasicOptionAfter() {
        this.__testRequest(
            'curl https://foo:bar@httpbin.org/get --basic',
            new Request({
                url: 'https://httpbin.org/get',
                method: 'GET',
                auth: new BasicAuth({
                    username: 'foo',
                    password: 'bar'
                })
            }))
    }

    testUserInUrlWithBasicOptionBefore() {
        this.__testRequest(
            'curl --basic https://foo:bar@httpbin.org/get',
            new Request({
                url: 'https://httpbin.org/get',
                method: 'GET',
                auth: new BasicAuth({
                    username: 'foo',
                    password: 'bar'
                })
            }))
    }

    testUserInUrlWithDigestOption() {
        this.__testRequest(
            'curl https://foo:bar@httpbin.org/get --digest',
            new Request({
                url: 'https://httpbin.org/get',
                method: 'GET',
                auth: new DigestAuth({
                    username: 'foo',
                    password: 'bar'
                })
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
                    url: 'http://httpbin.org/get',
                    method: 'GET'
                }),
                new Request({
                    url: 'http://httpbin.org/post',
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
                    url: 'http://httpbin.org/get',
                    method: 'POST',
                    headers: Immutable.OrderedMap({
                        'X-Paw': 'value'
                    })
                }),
                new Request({
                    url: 'http://httpbin.org/post',
                    method: 'POST',
                    headers: Immutable.OrderedMap({
                        'X-Paw': 'value'
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
                    url: 'http://httpbin.org/get',
                    method: 'POST',
                    headers: Immutable.OrderedMap({
                        'X-Paw': 'value'
                    })
                }),
                new Request({
                    url: 'http://httpbin.org/post',
                    method: 'POST',
                    headers: Immutable.OrderedMap({
                        'X-Paw': 'value'
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
                    url: 'http://httpbin.org/get',
                    method: 'POST',
                    headers: Immutable.OrderedMap({
                        'X-Paw': 'value'
                    })
                }),
                new Request({
                    url: 'http://httpbin.org/post',
                    method: 'POST',
                    headers: Immutable.OrderedMap({
                        'X-Paw': 'value'
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
                    url: 'http://httpbin.org/get',
                    method: 'GET'
                }),
                new Request({
                    url: 'http://httpbin.org/post',
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
                    url: 'http://httpbin.org/post',
                    method: 'POST',
                    headers: Immutable.OrderedMap({
                        'X-Paw2': 'value2'
                    })
                }),
                new Request({
                    url: 'http://httpbin.org/get',
                    method: 'GET',
                    headers: Immutable.OrderedMap({
                        'X-Paw': 'value'
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
                    url: 'https://httpbin.org/get',
                    method: 'GET',
                    headers: Immutable.OrderedMap({
                        'X-Paw2': 'value2'
                    }),
                    auth: new BasicAuth({
                        username: 'foo',
                        password: 'bar'
                    })
                }),
                new Request({
                    url: 'https://httpbin.org/get?key=value',
                    method: 'GET',
                    headers: Immutable.OrderedMap({
                        'X-Paw2': 'value2'
                    }),
                    auth: new BasicAuth({
                        username: 'foo',
                        password: 'bar'
                    })
                }),
                new Request({
                    url: 'http://httpbin.org/post',
                    method: 'POST',
                    headers: Immutable.OrderedMap({
                        'X-Paw': 'value'
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
                url: 'http://httpbin.org/get',
                method: 'GET'
            })
        ]))
    }

    testShellIgnoreShellMarkChevron() {
        this.__testRequests('> curl http://httpbin.org/get', Immutable.List([
            new Request({
                url: 'http://httpbin.org/get',
                method: 'GET'
            })
        ]))
    }

    testShellBreakAfterPipe() {
        this.__testRequests(
            'curl http://httpbin.org/get | cat -X POST',
            Immutable.List([
                new Request({
                    url: 'http://httpbin.org/get',
                    method: 'GET'
                })
            ]))
    }

    testShellBreakAfterPipeNoSpaces() {
        this.__testRequests(
            'curl http://httpbin.org/get|cat -X POST',
            Immutable.List([
                new Request({
                    url: 'http://httpbin.org/get',
                    method: 'GET'
                })
            ]))
    }

    testShellBreakAfterRedirect() {
        this.__testRequests(
            'curl http://httpbin.org/get > filename',
            Immutable.List([
                new Request({
                    url: 'http://httpbin.org/get',
                    method: 'GET'
                })
            ]))
    }

    testShellBreakAfterRedirectNoSpace() {
        this.__testRequests(
            'curl http://httpbin.org/get>filename',
            Immutable.List([
                new Request({
                    url: 'http://httpbin.org/get',
                    method: 'GET'
                })
            ]))
    }

    testShellOptionsAfterRedirect() {
        this.__testRequests(
            'curl httpbin.org/post -d key=value > filename -d key2=value2',
            Immutable.List([
                new Request({
                    url: 'http://httpbin.org/post',
                    method: 'POST',
                    bodyType: 'urlEncoded',
                    body: Immutable.List([
                        new KeyValue({ key: 'key', value: 'value' }),
                        new KeyValue({ key: 'key2', value: 'value2' })
                    ])
                })
            ]))
    }

    testShellChainWithSemiColon() {
        this.__testRequests(
            `curl http://httpbin.org/get ; curl \\
            -X POST http://httpbin.org/post`,
            Immutable.List([
                new Request({
                    url: 'http://httpbin.org/get',
                    method: 'GET'
                }),
                new Request({
                    url: 'http://httpbin.org/post',
                    method: 'POST'
                })
            ]))
    }

    testShellChainWithSemiColonNoSpace() {
        this.__testRequests(
            'curl http://httpbin.org/get;curl -X POST http://httpbin.org/post',
            Immutable.List([
                new Request({
                    url: 'http://httpbin.org/get',
                    method: 'GET'
                }),
                new Request({
                    url: 'http://httpbin.org/post',
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
                    url: 'http://httpbin.org/get',
                    method: 'GET'
                }),
                new Request({
                    url: 'http://httpbin.org/post',
                    method: 'POST'
                })
            ]))
    }

    testShellChainWithSimpleAndNoSpace() {
        this.__testRequests(
            'curl http://httpbin.org/get&curl -X POST http://httpbin.org/post',
            Immutable.List([
                new Request({
                    url: 'http://httpbin.org/get',
                    method: 'GET'
                }),
                new Request({
                    url: 'http://httpbin.org/post',
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
                    url: 'http://httpbin.org/get',
                    method: 'GET'
                }),
                new Request({
                    url: 'http://httpbin.org/post',
                    method: 'POST'
                })
            ]))
    }

    testShellChainWithDoubleAndNoSpace() {
        this.__testRequests(
            'curl http://httpbin.org/get&&curl -X POST http://httpbin.org/post',
            Immutable.List([
                new Request({
                    url: 'http://httpbin.org/get',
                    method: 'GET'
                }),
                new Request({
                    url: 'http://httpbin.org/post',
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
                    url: 'http://httpbin.org/get',
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
                    url: 'http://httpbin.org/get',
                    method: 'POST',
                    headers: Immutable.OrderedMap({
                        'X-Paw': 'value'
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
                    url: 'http://httpbin.org/get',
                    method: 'POST',
                    headers: Immutable.OrderedMap({
                        'X-Paw': 'value',
                        'Content-Type': 'application/json'
                    })
                }),
                new Request({
                    url: 'http://httpbin.org/post',
                    method: 'POST',
                    headers: Immutable.OrderedMap({
                        'X-Paw': 'value',
                        'Content-Type': 'application/json'
                    })
                })
            ]))
    }

    testIgnoreUnknownOptionOutput() {
        this.__testRequests(
            'curl --output outputfile.txt http://httpbin.org/get -X POST',
            Immutable.List([
                new Request({
                    url: 'http://httpbin.org/get',
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
                url: 'https://httpbin.org/post',
                method: 'POST',
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
                url: 'https://httpbin.org/post',
                method: 'POST',
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
                url: 'https://httpbin.org/post',
                method: 'POST',
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
            })
        ]))
    }

    //
    // helpers
    //

    __testRequest(input, expected, compareBodyString = false) {
        this.__testRequests(
            input,
            Immutable.List([ expected ]),
            compareBodyString
        )
    }

    __testRequests(input, expected, compareBodyString = false) {
        const parser = new CurlParser()
        let requests = parser.parse(input)

        // remove bodyString from request if we don't want to compare it here
        requests = requests.map(request => {
            if (!compareBodyString) {
                return request.set('bodyString', null)
            }
            return request
        })

        this.assertTrue(Immutable.is(requests, expected))
    }
}
