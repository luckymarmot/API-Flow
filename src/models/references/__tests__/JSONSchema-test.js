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
                    uri: '#/Product'
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
}
