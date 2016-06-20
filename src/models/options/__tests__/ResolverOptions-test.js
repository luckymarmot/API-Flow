import Immutable from 'immutable'

import {
    UnitTest,
    registerTest,
    targets,
    against
} from '../../../utils/TestUtils'

import ResolverOptions, {
    ResolutionItem,
    ParameterItem,
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
@against(ResolutionOptions)
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

    testNormalizeWithParameterArrayCustom() {
        const expected = {
            remote: true,
            local: true,
            custom: new Immutable.OrderedMap({
                api_key: new ParameterItem({
                    key: 'api_key'
                }),
                userId: new ParameterItem({
                    key: 'userId'
                })
            })
        }

        const result = ResolutionOptions.normalize({
            custom: [
                {
                    key: 'api_key'
                },
                {
                    key: 'userId'
                }
            ]
        })

        this.assertEqual(expected, result)
    }

    testNormalizeWithMixedArrayCustom() {
        const expected = {
            remote: true,
            local: true,
            custom: new Immutable.OrderedMap({
                api_key: new ParameterItem({
                    key: 'api_key'
                }),
                userId: new ParameterItem({
                    key: 'userId'
                }),
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
                    key: 'api_key'
                },
                {
                    key: 'userId'
                },
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

    testNormalizeWithParameterObjectCustom() {
        const expected = {
            remote: true,
            local: true,
            custom: new Immutable.OrderedMap({
                api_key: new ParameterItem({
                    key: 'api_key',
                    value: 102398
                }),
                userId: new ParameterItem({
                    key: 'userId',
                    value: 1039751
                })
            })
        }

        const result = ResolutionOptions.normalize({
            custom: {
                api_key: {
                    key: 'api_key',
                    value: 102398
                },
                someKey: {
                    key: 'userId',
                    value: 1039751
                }
            }
        })

        this.assertEqual(expected, result)
    }

    testNormalizeWithMixedObjectCustom() {
        const expected = {
            remote: true,
            local: true,
            custom: new Immutable.OrderedMap({
                api_key: new ParameterItem({
                    key: 'api_key',
                    value: 102398
                }),
                userId: new ParameterItem({
                    key: 'userId',
                    value: 1039751
                }),
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
                api_key: {
                    key: 'api_key',
                    value: 102398
                },
                someKey: {
                    key: 'userId',
                    value: 1039751
                },
                '#/postman/user': {
                    value: 'use paw'
                }, '#/paw/pets': {
                    resolve: false
                }
            }
        })

        this.assertEqual(expected, result)
    }

    @targets('addCustomResolutions')
    testAddCustomResolutionsWithNoPreviousCustomOptions() {
        const opts = new ResolutionOptions()

        const list = [
            {
                key: 'api_key',
                value: 1029471
            },
            {
                uri: '#/postman/userId',
                resolve: true,
                value: 1251
            }
        ]

        const expected = new ResolutionOptions({
            custom: list
        })

        const result = opts.addCustomResolutions(list)

        this.assertEqual(expected, result)
    }

    @targets('addCustomResolutions')
    testAddCustomResolutionsWithPreviousCustomOptions() {
        const opts = new ResolutionOptions({
            custom: [
                {
                    key: 'password',
                    value: '12dh2498'
                }
            ]
        })

        const list = [
            {
                key: 'api_key',
                value: 1029471
            },
            {
                uri: '#/postman/userId',
                resolve: true,
                value: 1251
            }
        ]

        const expected = new ResolutionOptions({
            custom: [
                {
                    key: 'password',
                    value: '12dh2498'
                },
                {
                    key: 'api_key',
                    value: 1029471
                },
                {
                    uri: '#/postman/userId',
                    resolve: true,
                    value: 1251
                }
            ]
        })

        const result = opts.addCustomResolutions(list)

        this.assertEqual(expected, result)
    }

    @targets('addCustomResolutions')
    testAddCustomResolutionsOverridesPreviousCustomOptions() {
        const opts = new ResolutionOptions({
            custom: [
                {
                    key: 'password',
                    value: '12dh2498'
                },
                {
                    key: 'api_key',
                    value: 92837592
                }
            ]
        })

        const list = [
            {
                key: 'api_key',
                value: 1029471
            },
            {
                uri: '#/postman/userId',
                resolve: true,
                value: 1251
            }
        ]

        const expected = new ResolutionOptions({
            custom: [
                {
                    key: 'password',
                    value: '12dh2498'
                },
                {
                    key: 'api_key',
                    value: 1029471
                },
                {
                    uri: '#/postman/userId',
                    resolve: true,
                    value: 1251
                }
            ]
        })

        const result = opts.addCustomResolutions(list)

        this.assertEqual(expected, result)
    }
}


@registerTest
export class TestParameterItem extends UnitTest {
    testNormalizeWithNoOpts() {
        const expected = {
            key: '',
            value: null
        }

        const result = ParameterItem.normalize()

        this.assertEqual(expected, result)
    }

    testNormalizeWithKey() {
        const expected = {
            key: 'api_key',
            value: null
        }

        const result = ParameterItem.normalize({
            key: 'api_key'
        })

        this.assertEqual(expected, result)
    }

    testNormalizeWithValue() {
        const expected = {
            key: '',
            value: 42
        }

        const result = ParameterItem.normalize({
            value: 42
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
