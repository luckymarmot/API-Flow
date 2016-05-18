import {
    UnitTest,
    registerTest,
    targets,
    against
} from '../../../utils/TestUtils'

import JSONSchemaReference from '../JSONSchema'
import ReferenceCache from '../Cache'

@registerTest
@against(ReferenceCache)
export class TestReferenceCache extends UnitTest {
    __init(uriOrReference, value, dependencies) {
        let reference
        if (typeof uriOrReference === 'string') {
            let uri = uriOrReference || null
            reference = new JSONSchemaReference({
                uri: uri
            })
            if (value) {
                reference = reference
                    .set('value', value)
                    .set('resolved', true)
            }

            if (dependencies) {
                reference = reference
                    .set('dependencies', dependencies)
            }
        }
        else {
            reference = uriOrReference
        }
        const cache = new ReferenceCache({
            cached: reference
        })
        return cache
    }

    @targets('isBaseResolved')
    testisBaseResolved() {
        let uri = '#/User'
        let cache = this.__init(uri)
        let result = cache.isBaseResolved()
        this.assertFalse(result)

        let value = {
            dummmy: 42
        }
        uri = '#/User'
        cache = this.__init(uri, value)
        result = cache.isBaseResolved()
        this.assertTrue(result)
    }

    @targets('resolve')
    testResolveWithUnresolvedReference() {
        const uri = '#/User'
        const cache = this.__init(uri)

        const expected = cache

        const result = cache.resolve()

        this.assertJSONEqual(expected, result)
    }

    @targets('resolve')
    testResolveWithFinalSet() {
        const ref = new JSONSchemaReference({
            uri: '#/User',
            value: {
                dummy: 42
            },
            resolved: true
        })
        let cache = this.__init(ref)

        cache = cache
            .setIn([ 'resolved', 0 ], ref)
            .set('final', 0)

        const expected = cache

        const result = cache.resolve(null, 12)
        this.assertJSONEqual(expected, result)
    }

    @targets('resolve')
    testResolveWithDepthAlreadyResolved() {
        const ref = new JSONSchemaReference({
            uri: '#/User',
            value: {
                dummy: 42
            },
            resolved: true
        })
        let cache = this.__init(ref)

        cache = cache
            .setIn([ 'resolved', 2 ], ref)

        const expected = cache

        const result = cache.resolve(null, 2)
        this.assertJSONEqual(expected, result)
    }

    @targets('resolve')
    testResolveWithResolvedReferenceAtLowerDepth() {
        const ref = new JSONSchemaReference({
            uri: '#/User',
            value: {
                dummy: 42
            },
            resolved: true
        })
        let cache = this.__init(ref)

        cache = cache
            .setIn([ 'resolved', -1 ], ref)

        const expected = cache
            .setIn([ 'resolved', 2 ], ref)

        const result = cache.resolve(null, 2)
        this.assertJSONEqual(expected, result)
    }

    @targets('getReference')
    testGetReferenceWithNoPriorResolution() {
        const ref = new JSONSchemaReference({
            uri: '#/User',
            value: {
                dummy: 42
            },
            resolved: true
        })
        let cache = this.__init(ref)

        const expected = null

        const result = cache.getReference()
        this.assertJSONEqual(expected, result)
    }

    @targets('getReference')
    testGetReferenceWithDefaultDepth() {
        const ref = new JSONSchemaReference({
            uri: '#/User',
            value: {
                dummy: 42
            },
            resolved: true
        })
        let cache = this.__init(ref)
            .setIn([ 'resolved', 0 ], ref)

        const expected = ref

        const result = cache.getReference()
        this.assertJSONEqual(expected, result)
    }

    @targets('getReference')
    testGetReferenceWithSetDepth() {
        const ref = new JSONSchemaReference({
            uri: '#/User',
            value: {
                dummy: 42
            },
            resolved: true
        })
        let cache = this.__init(ref)
            .setIn([ 'resolved', 2 ], ref)

        const expected = ref

        const result = cache.getReference(2)
        this.assertJSONEqual(expected, result)
    }
}
