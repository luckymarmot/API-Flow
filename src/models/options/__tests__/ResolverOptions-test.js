import Immutable from 'immutable'

import {
    UnitTest,
    registerTest
} from '../../../utils/TestUtils'

import ResolverOptions, {
    ResolutionItem,
    ResolutionOptions
} from '../ResolverOptions'

@registerTest
export class TestResolverOptions extends UnitTest {
    testNormalizeWithNoOpts() {
        const expected = {
            base: 'remote',
            resolve: new ResolutionOptions()
        }

        const result = ResolverOptions.normalize()

        this.assertEqual(expected, result)
    }
}

@registerTest
export class TestResolutionOptions extends UnitTest {
    testNormalizeWithNoOpts() {
        const expected = {
            remote: true,
            local: true,
            custom: new Immutable.OrderedMap()
        }

        const result = ResolutionOptions.normalize()

        this.assertEqual(expected, result)
    }

    testNormalizeWithNonObjectOpts() {
        const expected = {
            remote: true,
            local: true,
            custom: new Immutable.OrderedMap()
        }

        const result = ResolutionOptions.normalize(true)

        this.assertEqual(expected, result)
    }

    testNormalizeWithRemote() {
        const expected = {
            remote: false,
            local: true,
            custom: new Immutable.OrderedMap()
        }

        const result = ResolutionOptions.normalize({
            remote: false
        })

        this.assertEqual(expected, result)
    }

    testNormalizeWithNonBooleanRemote() {
        const expected = {
            remote: true,
            local: true,
            custom: new Immutable.OrderedMap()
        }

        const result = ResolutionOptions.normalize({
            remote: 'some'
        })

        this.assertEqual(expected, result)
    }

    testNormalizeWithLocal() {
        const expected = {
            remote: true,
            local: false,
            custom: new Immutable.OrderedMap()
        }

        const result = ResolutionOptions.normalize({
            local: false
        })

        this.assertEqual(expected, result)
    }

    testNormalizeWithNonBooleanLocal() {
        const expected = {
            remote: true,
            local: true,
            custom: new Immutable.OrderedMap()
        }

        const result = ResolutionOptions.normalize({
            local: 'some'
        })

        this.assertEqual(expected, result)
    }

    testNormalizeWithNonObjectCustom() {
        const expected = {
            remote: true,
            local: true,
            custom: new Immutable.OrderedMap()
        }

        const result = ResolutionOptions.normalize({
            custom: false
        })

        this.assertEqual(expected, result)
    }

    testNormalizeWithArrayCustom() {
        const expected = {
            remote: true,
            local: true,
            custom: new Immutable.OrderedMap({
                '#/postman/user': new ResolutionItem({
                    uri: '#/postman/user'
                }),
                '#/paw/pets': new ResolutionItem({
                    uri: '#/paw/pets'
                })
            })
        }

        const result = ResolutionOptions.normalize({
            custom: [
                {
                    uri: '#/postman/user'
                },
                {
                    uri: '#/paw/pets'
                }
            ]
        })

        this.assertEqual(expected, result)
    }

    testNormalizeWithObjectCustom() {
        const expected = {
            remote: true,
            local: true,
            custom: new Immutable.OrderedMap({
                '#/postman/user': new ResolutionItem({
                    uri: '#/postman/user',
                    value: 'use paw'
                }),
                '#/paw/pets': new ResolutionItem({
                    uri: '#/paw/pets',
                    resolve: false
                })
            })
        }

        const result = ResolutionOptions.normalize({
            custom: {
                '#/postman/user': {
                    value: 'use paw'
                }, '#/paw/pets': {
                    resolve: false
                }
            }
        })

        this.assertEqual(expected, result)
    }
}


@registerTest
export class TestResolutionItem extends UnitTest {
    testNormalizeWithNoOpts() {
        const expected = {
            uri: '',
            resolve: true,
            value: null
        }

        const result = ResolutionItem.normalize()

        this.assertEqual(expected, result)
    }

    testNormalizeWithURI() {
        const expected = {
            uri: '#/postman/user',
            resolve: true,
            value: null
        }

        const result = ResolutionItem.normalize({
            uri: '#/postman/user'
        })

        this.assertEqual(expected, result)
    }

    testNormalizeWithResolve() {
        const expected = {
            uri: '',
            resolve: false,
            value: null
        }

        const result = ResolutionItem.normalize({
            resolve: false
        })

        this.assertEqual(expected, result)
    }

    testNormalizeWithValue() {
        const expected = {
            uri: '',
            resolve: true,
            value: 'some value'
        }

        const result = ResolutionItem.normalize({
            value: 'some value'
        })

        this.assertEqual(expected, result)
    }
}
