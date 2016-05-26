import Immutable from 'immutable'

import {
    UnitTest,
    registerTest,
    targets,
    against
} from '../../../utils/TestUtils'

import JSONSchemaReference from '../JSONSchema'
import ReferenceContainer from '../Container'

@registerTest
@against(JSONSchemaReference)
export class TestJSONSchemaReference extends UnitTest {
    __init(_uri) {
        let uri = _uri || null
        const ref = new JSONSchemaReference({
            uri: uri
        })
        return ref
    }

    @targets('resolve')
    testSimpleResolve() {
        const uri = '#/User'
        const ref = this.__init(uri)

        const value = {
            value: 42,
            type: 'number'
        }
        const input = {
            value: 12,
            type: 'integer',
            User: value
        }

        const expected = new JSONSchemaReference({
            uri: uri,
            value: value,
            resolved: true
        })

        const result = ref.resolve(JSON.stringify(input))

        this.assertJSONEqual(expected, result)
    }

    @targets('resolve')
    testResolveWithReferences() {
        const uri = '#/User'
        const ref = this.__init(uri)

        const value = {
            value: 42,
            type: 'number',
            $ref: '#/Product'
        }
        const input = {
            value: 12,
            type: 'integer',
            User: value
        }

        const expectedValue = {
            value: 42,
            type: 'number',
            $ref: new JSONSchemaReference({
                uri: '#/Product'
            })
        }
        const expected = new JSONSchemaReference({
            uri: uri,
            value: expectedValue,
            resolved: true,
            dependencies: new Immutable.List([
                new JSONSchemaReference({
                    uri: '#/Product',
                    relative: '#/Product'
                })
            ])
        })

        const result = ref.resolve(JSON.stringify(input))

        this.assertJSONEqual(expected, result)
    }

    @targets('resolve')
    testSimpleResolve() {
        const uri = '#/User'
        const ref = this.__init(uri)

        const value = {
            value: 42,
            type: 'number'
        }
        const input = {
            value: 12,
            type: 'integer',
            User: value
        }

        const expected = new JSONSchemaReference({
            uri: uri,
            value: value,
            resolved: true
        })

        const result = ref.resolve(JSON.stringify(input))

        this.assertJSONEqual(expected, result)
    }

    @targets('resolve')
    testResolveWithInvalidBaseReferences() {
        const uri = '#/User'
        const ref = this.__init(uri)

        const input = {
            value: 12,
            type: 'integer'
        }

        const expected = new JSONSchemaReference({
            uri: uri,
            resolved: true,
            raw: JSON.stringify(input)
        })

        const result = ref.resolve(JSON.stringify(input))

        this.assertJSONEqual(expected, result)
    }

    @targets('resolve')
    testResolveWithInvalidJSON() {
        const uri = '#/User'
        const ref = this.__init(uri)

        const input = '{ "error": "right" "here": "missing comma" }'

        const expected = new JSONSchemaReference({
            uri: uri,
            resolved: true,
            raw: input
        })

        const result = ref.resolve(input)

        this.assertJSONEqual(expected, result)
    }

    @targets('evaluate')
    testEvaluateNoDepth() {
        let reference = new JSONSchemaReference({
            uri: '#/definitions/User',
            value: {
                test: true,
                dummy: 12
            },
            resolved: true
        })

        let container = new ReferenceContainer()
        container = container.update(reference)

        let result = reference.evaluate(container)

        this.assertJSONEqual(reference, result)
    }

    @targets('evaluate')
    testEvaluateWithSimpleRefs() {
        let reference = new JSONSchemaReference({
            uri: '#/definitions/User',
            value: {
                test: true,
                $ref: new JSONSchemaReference({
                    uri: '#/definitions/Product'
                })
            },
            resolved: true
        })

        let product = new JSONSchemaReference({
            uri: '#/definitions/Product',
            value: {
                pid: 42,
                type: 'integer'
            }
        })

        let container = new ReferenceContainer()
        container = container
            .update(reference)
            .update(product)

        const expected = new JSONSchemaReference({
            uri: '#/definitions/User',
            value: {
                test: true,
                $ref: {
                    pid: 42,
                    type: 'integer'
                }
            },
            resolved: true
        })

        let result = reference.evaluate(container, 1)

        this.assertJSONEqual(expected, result)
    }

    @targets('evaluate')
    testEvaluateWithCircularRefs() {
        let reference = new JSONSchemaReference({
            uri: '#/definitions/User',
            value: {
                test: true,
                $ref: new JSONSchemaReference({
                    uri: '#/definitions/Product'
                })
            },
            resolved: true
        })

        let product = new JSONSchemaReference({
            uri: '#/definitions/Product',
            value: {
                pid: 42,
                type: 'integer',
                $ref: new JSONSchemaReference({
                    uri: '#/definitions/User'
                })
            },
            resolved: true
        })

        let container = new ReferenceContainer()
        container = container
            .update(reference)
            .update(product)

        const expected = new JSONSchemaReference({
            uri: '#/definitions/User',
            value: {
                test: true,
                $ref: {
                    pid: 42,
                    type: 'integer',
                    $ref: {
                        test: true,
                        $ref: new JSONSchemaReference({
                            uri: '#/definitions/Product'
                        })
                    }
                }
            },
            resolved: true
        })

        let result = reference.evaluate(container, 2)

        this.assertJSONEqual(expected, result)
    }

    @targets('evaluate')
    testEvaluateWithMissingRefs() {
        let reference = new JSONSchemaReference({
            uri: '#/definitions/User',
            value: {
                test: true,
                $ref: new JSONSchemaReference({
                    uri: '#/definitions/Missing'
                })
            },
            resolved: true
        })

        let product = new JSONSchemaReference({
            uri: '#/definitions/Product',
            value: {
                pid: 42,
                type: 'integer',
                $ref: new JSONSchemaReference({
                    uri: '#/definitions/User'
                })
            },
            resolved: true
        })

        let container = new ReferenceContainer()
        container = container
            .update(reference)
            .update(product)

        const expected = new JSONSchemaReference({
            uri: '#/definitions/User',
            value: {
                test: true,
                $ref: new JSONSchemaReference({
                    uri: '#/definitions/Missing'
                })
            },
            resolved: true
        })

        let result = reference.evaluate(container, 2)

        this.assertJSONEqual(expected, result)
    }

    @targets('getDataUri')
    testGetDataUri() {
        let ref = new JSONSchemaReference({
            uri: '#/definitions/User'
        })

        let expected = ''
        let result = ref.getDataUri()

        this.assertEqual(expected, result)

        ref = ref.set('uri', 'anything.json#/path/to/def')
        expected = 'anything.json'
        result = ref.getDataUri()

        this.assertEqual(expected, result)

        ref = ref.set('uri', 'no-fragment.json')
        expected = 'no-fragment.json'
        result = ref.getDataUri()

        this.assertEqual(expected, result)
    }

    @targets('_unescapeURIFragment')
    testUnescapeURIFragment() {
        const ref = this.__init()
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
            let result = ref._unescapeURIFragment(fragments[i])
            this.assertEqual(expected[i], result)
        }
    }

    @targets('_extractSubTree')
    testExtractSubTree() {
        const ref = this.__init()
        const refs = [
            '#/definitions/User',
            '#/definitions/User~01',
            '#/definitions/User/Friend'
        ]

        const collection = {
            definitions: {
                User: {
                    value: 12,
                    Friend: {
                        value: 42
                    }
                },
                'User~1': {
                    value: 90
                }
            }
        }

        const expected = [
            {
                value: 12,
                Friend: {
                    value: 42
                }
            },
            {
                value: 90
            },
            {
                value: 42
            }
        ]

        for (let i = 0; i < refs.length; i += 1) {
            let result = ref._extractSubTree(collection, refs[i])
            this.assertEqual(expected[i], result)
        }
    }

    @targets('_resolveRefs')
    testResolveRefsNoDepth() {
        let reference = new JSONSchemaReference({
            uri: '#/definitions/User',
            value: {
                test: true,
                dummy: 12
            },
            resolved: true
        })

        let container = new ReferenceContainer()
        container = container.update(reference)

        let obj = {
            value: 12
        }

        let result = reference._resolveRefs(container, obj)

        this.assertEqual(obj, result)
    }

    @targets('_resolveRefs')
    testResolveRefsWithSimpleRefs() {
        let reference = new JSONSchemaReference({
            uri: '#/definitions/User',
            value: {
                test: true,
                $ref: new JSONSchemaReference({
                    uri: '#/definitions/Product'
                })
            },
            resolved: true
        })

        let product = new JSONSchemaReference({
            uri: '#/definitions/Product',
            value: {
                pid: 42,
                type: 'integer'
            }
        })

        let container = new ReferenceContainer()
        container = container
            .update(reference)
            .update(product)

        const obj = {
            test: true,
            $ref: new JSONSchemaReference({
                uri: '#/definitions/Product'
            })
        }

        const expected = {
            test: true,
            $ref: {
                pid: 42,
                type: 'integer'
            }
        }

        let result = reference._resolveRefs(container, obj, 1)

        this.assertJSONEqual(expected, result)
    }

    @targets('_resolveRefs')
    testResolveRefsWithCircularRefs() {
        let reference = new JSONSchemaReference({
            uri: '#/definitions/User',
            value: {
                test: true,
                $ref: new JSONSchemaReference({
                    uri: '#/definitions/Product'
                })
            },
            resolved: true
        })

        let product = new JSONSchemaReference({
            uri: '#/definitions/Product',
            value: {
                pid: 42,
                type: 'integer',
                $ref: new JSONSchemaReference({
                    uri: '#/definitions/User'
                })
            },
            resolved: true
        })

        let container = new ReferenceContainer()
        container = container
            .update(reference)
            .update(product)

        const obj = {
            test: true,
            $ref: new JSONSchemaReference({
                uri: '#/definitions/Product'
            })
        }

        const expected = {
            test: true,
            $ref: {
                pid: 42,
                type: 'integer',
                $ref: {
                    test: true,
                    $ref: new JSONSchemaReference({
                        uri: '#/definitions/Product'
                    })
                }
            }
        }

        let result = reference._resolveRefs(container, obj, 2)

        this.assertJSONEqual(expected, result)
    }

    @targets('_resolveRefs')
    testResolveRefsWithMissingRefs() {
        let reference = new JSONSchemaReference({
            uri: '#/definitions/User',
            value: {
                test: true,
                $ref: new JSONSchemaReference({
                    uri: '#/definitions/Missing'
                })
            },
            resolved: true
        })

        let product = new JSONSchemaReference({
            uri: '#/definitions/Product',
            value: {
                pid: 42,
                type: 'integer',
                $ref: new JSONSchemaReference({
                    uri: '#/definitions/User'
                })
            },
            resolved: true
        })

        const obj = {
            test: true,
            $ref: new JSONSchemaReference({
                uri: '#/definitions/Missing'
            })
        }

        let container = new ReferenceContainer()
        container = container
            .update(reference)
            .update(product)

        const expected = {
            test: true,
            $ref: new JSONSchemaReference({
                uri: '#/definitions/Missing'
            })
        }

        let result = reference._resolveRefs(container, obj, 2)

        this.assertJSONEqual(expected, result)
    }

    @targets('_resolveRefs')
    testResolveRefsWithUnresolvedRefs() {
        let reference = new JSONSchemaReference({
            uri: '#/definitions/User',
            value: {
                test: true,
                $ref: new JSONSchemaReference({
                    uri: '#/definitions/Unresolved'
                })
            },
            resolved: true
        })

        let unresolved = new JSONSchemaReference({
            uri: '#/definitions/Unresolved'
        })

        const obj = {
            test: true,
            $ref: new JSONSchemaReference({
                uri: '#/definitions/Unresolved'
            })
        }

        let container = new ReferenceContainer()
        container = container
            .update(reference)
            .update(unresolved)

        const expected = {
            test: true,
            $ref: new JSONSchemaReference({
                uri: '#/definitions/Unresolved'
            })
        }

        let result = reference._resolveRefs(container, obj, 2)

        this.assertJSONEqual(expected, result)
    }

    @targets('_findRefs')
    testFindRefs() {
        let ref = this.__init('#/definitions/Root')

        let obj = {
            user: {
                $ref: '#/definitions/User'
            },
            product: {
                $ref: '/some/absolute/path/#/definitions/Product'
            },
            web: {
                $ref: 'http://www.example.com/some/path#/definitions/Web'
            },
            fragmentless: {
                $ref: 'http://www.example.com/definitions/Fragmentless'
            }
        }

        let expected = new Immutable.List([
            new JSONSchemaReference({
                uri: '#/definitions/User',
                relative: '#/definitions/User'
            }),
            new JSONSchemaReference({
                uri: '/some/absolute/path/#/definitions/Product',
                relative: '/some/absolute/path/#/definitions/Product'
            }),
            new JSONSchemaReference({
                uri: 'http://www.example.com/some/path#/definitions/Web',
                relative: 'http://www.example.com/some/path#/definitions/Web'
            }),
            new JSONSchemaReference({
                uri: 'http://www.example.com/definitions/Fragmentless',
                relative: 'http://www.example.com/definitions/Fragmentless'
            })
        ])

        let result = ref._findRefs(obj)

        this.assertEqual(expected, result)
    }

    @targets('_replaceRefs')
    testReplaceRefs() {
        let ref = this.__init('#/definitions/Root')

        let obj = {
            user: {
                $ref: '#/definitions/User'
            },
            product: {
                $ref: '/some/absolute/path/#/definitions/Product'
            },
            web: {
                $ref: 'http://www.example.com/some/path#/definitions/Web'
            },
            fragmentless: {
                $ref: 'http://www.example.com/definitions/Fragmentless'
            }
        }

        let expected = {
            user: {
                $ref: new JSONSchemaReference({
                    uri: '#/definitions/User'
                })
            },
            product: {
                $ref: new JSONSchemaReference({
                    uri: '/some/absolute/path/#/definitions/Product'
                })
            },
            web: {
                $ref: new JSONSchemaReference({
                    uri: 'http://www.example.com/some/path#/definitions/Web'
                })
            },
            fragmentless: {
                $ref: new JSONSchemaReference({
                    uri: 'http://www.example.com/definitions/Fragmentless'
                })
            }
        }

        let result = ref._replaceRefs(obj)
        this.assertEqual(expected, result)
    }
}
