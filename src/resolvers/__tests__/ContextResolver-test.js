import Immutable from 'immutable'

import {
    UnitTest,
    registerTest,
    targets,
    against
} from '../../utils/TestUtils'

import {
    ClassMock
} from '../../mocks/PawMocks'

import ContextResolver from '../ContextResolver'
import ParameterResolver from '../ParameterResolver'

import NodeEnvironment from '../../models/environments/NodeEnvironment'
import Item from '../../models/Item'

import Context from '../../models/Core'
import ReferenceContainer from '../../models/references/Container'
import JSONSchemaReference from '../../models/references/JSONSchema'

import ResolverOptions from '../../models/options/ResolverOptions'

@registerTest
@against(ContextResolver)
export class TestContextResolver extends UnitTest {

    @targets('resolveReference')
    testSimpleResolveReference(done) {
        const resolver = this.__init()

        const dummyJSON = {
            value: 12,
            references: {
                Friend: {
                    $ref: '#/references/User'
                },
                User: {
                    $ref: '#/references/Friend'
                }
            }
        }

        const item = new Item({
            content: JSON.stringify(dummyJSON),
            file: {
                path: __dirname + 'fixtures/',
                name: 'dummy.json'
            }
        })

        const reference = new JSONSchemaReference({
            uri: '#/references/Friend'
        })

        const expected = new JSONSchemaReference({
            uri: '#/references/Friend',
            value: {
                $ref: new JSONSchemaReference({
                    uri: '#/references/User'
                })
            },
            resolved: true,
            dependencies: new Immutable.List([
                new JSONSchemaReference({
                    uri: '#/references/User',
                    relative: '#/references/User'
                })
            ])
        })

        let promise = resolver.resolveReference(item, reference)

        promise.then(ref => {
            this.assertJSONEqual(expected, ref)
            done()
        }, err => {
            throw new Error(err)
        }).catch(error => {
            done(new Error(error))
        })
    }

    @targets('resolveReference')
    testResolveReferenceWithExternalReferences(done) {
        const resolver = this.__init()

        const item = new Item({
            content: '',
            file: {
                path: __dirname + 'fixtures/',
                name: 'dummy.json'
            }
        })

        const reference = new JSONSchemaReference({
            uri: __dirname + '/fixtures/external.json#/references/User'
        })

        const expected = new JSONSchemaReference({
            uri: __dirname + '/fixtures/external.json#/references/User',
            value: {
                properties: {
                    id: {
                        type: 'string'
                    },
                    friend: {
                        $ref: new JSONSchemaReference({
                            uri: __dirname +
                                '/fixtures/dummy.json#/references/User'
                        })
                    }
                },
                type: 'object'
            },
            resolved: true,
            dependencies: new Immutable.List([
                new JSONSchemaReference({
                    uri: __dirname + '/fixtures/dummy.json#/references/User',
                    relative: 'dummy.json#/references/User'
                })
            ])
        })

        let promise = resolver.resolveReference(item, reference)

        promise.then(ref => {
            this.assertJSONEqual(expected, ref)
            done()
        }, err => {
            throw new Error(err)
        }).catch(error => {
            done(new Error(error))
        })
    }

    @targets('resolveContainer')
    testResolveContainer(done) {
        const resolver = this.__init()

        const dummyJSON = {
            value: 12,
            references: {
                Friend: {
                    $ref: '#/references/User'
                },
                User: {
                    $ref: '#/references/Friend'
                }
            }
        }

        const item = new Item({
            content: JSON.stringify(dummyJSON),
            file: {
                path: __dirname + 'fixtures/',
                name: 'dummy.json'
            }
        })

        const reference = new JSONSchemaReference({
            uri: '#/references/Friend'
        })

        let references = new ReferenceContainer()
        references = references.update(reference)

        let expected = new ReferenceContainer()
        expected = expected.create(new Immutable.List([
            new JSONSchemaReference({
                uri: '#/references/Friend',
                value: {
                    $ref: new JSONSchemaReference({
                        uri: '#/references/User'
                    })
                },
                resolved: true,
                dependencies: new Immutable.List([
                    new JSONSchemaReference({
                        uri: '#/references/User',
                        relative: '#/references/User'
                    })
                ])
            }),
            new JSONSchemaReference({
                uri: '#/references/User',
                relative: '#/references/User',
                value: {
                    $ref: new JSONSchemaReference({
                        uri: '#/references/Friend'
                    })
                },
                resolved: true,
                dependencies: new Immutable.List([
                    new JSONSchemaReference({
                        uri: '#/references/Friend',
                        relative: '#/references/Friend'
                    })
                ])
            })
        ]))

        let promise = resolver.resolveContainer(item, references)

        promise.then(refs => {
            this.assertJSONEqual(expected, refs)
            done()
        }, err => {
            throw new Error(err)
        }).catch(error => {
            done(new Error(error))
        })
    }

    @targets('resolveAll')
    testResolveAll(done) {
        const resolver = this.__init()

        const dummyJSON = {
            value: 12,
            references: {
                Friend: {
                    $ref: '#/references/User'
                },
                User: {
                    $ref: '#/references/Friend'
                }
            }
        }

        const item = new Item({
            content: JSON.stringify(dummyJSON),
            file: {
                path: __dirname + 'fixtures/',
                name: 'dummy.json'
            }
        })

        const reference = new JSONSchemaReference({
            uri: '#/references/Friend'
        })

        let container = new ReferenceContainer()
        container = container.update(reference)

        let references = new Immutable.OrderedMap({
            schemas: container
        })

        let expectedContainer = new ReferenceContainer()
        expectedContainer = expectedContainer.create(new Immutable.List([
            new JSONSchemaReference({
                uri: '#/references/Friend',
                value: {
                    $ref: new JSONSchemaReference({
                        uri: '#/references/User'
                    })
                },
                resolved: true,
                dependencies: new Immutable.List([
                    new JSONSchemaReference({
                        uri: '#/references/User',
                        relative: '#/references/User'
                    })
                ])
            }),
            new JSONSchemaReference({
                uri: '#/references/User',
                relative: '#/references/User',
                value: {
                    $ref: new JSONSchemaReference({
                        uri: '#/references/Friend'
                    })
                },
                resolved: true,
                dependencies: new Immutable.List([
                    new JSONSchemaReference({
                        uri: '#/references/Friend',
                        relative: '#/references/Friend'
                    })
                ])
            })
        ]))

        let expected = new Context({
            references: new Immutable.OrderedMap({
                schemas: expectedContainer
            })
        })

        let promise = resolver.resolveAll(item, new Context({
            references: references
        }))

        promise.then(refs => {
            this.assertJSONEqual(expected, refs)
            done()
        }, err => {
            throw new Error(err)
        }).catch(error => {
            done(new Error(error))
        })
    }

    @targets('resolveAll')
    testResolveAllWithNoResolveOption(done) {
        const resolver = this.__init()

        const options = new ResolverOptions({
            resolve: false
        })

        const dummyJSON = {
            value: 12,
            references: {
                Friend: {
                    $ref: '#/references/User'
                },
                User: {
                    $ref: '#/references/Friend'
                }
            }
        }

        const item = new Item({
            content: JSON.stringify(dummyJSON),
            file: {
                path: __dirname + 'fixtures/',
                name: 'dummy.json'
            }
        })

        const friendReference = new JSONSchemaReference({
            uri: '#/references/Friend'
        })

        let container = new ReferenceContainer()
        container = container.update(friendReference)

        let references = new Immutable.OrderedMap({
            schemas: container
        })

        let expectedContainer = new ReferenceContainer()
        expectedContainer = container.update(
            new JSONSchemaReference({
                uri: '#/references/Friend',
                resolved: true,
                value: {
                    $ref: new JSONSchemaReference({
                        uri: '#/references/User'
                    })
                },
                dependencies: new Immutable.List([
                    new JSONSchemaReference({
                        uri: '#/references/User',
                        relative: '#/references/User'
                    })
                ])
            })
        ).create([
            new JSONSchemaReference({
                uri: '#/references/User',
                relative: '#/references/User',
                resolved: true,
                value: {
                    $ref: new JSONSchemaReference({
                        uri: '#/references/Friend'
                    })
                },
                dependencies: new Immutable.List([
                    new JSONSchemaReference({
                        uri: '#/references/Friend',
                        relative: '#/references/Friend'
                    })
                ])
            })
        ])

        let expected = new Context({
            references: new Immutable.OrderedMap({
                schemas: expectedContainer
            })
        })

        let promise = resolver.resolveAll(item, new Context({
            references: references
        }), options)

        promise.then(refs => {
            this.assertJSONEqual(expected, refs)
            done()
        }, err => {
            throw new Error(err)
        }).catch(error => {
            done(new Error(error))
        })
    }

    @targets('resolveAll')
    testResolveAllWithNoRemoteResolveOption(done) {
        const resolver = this.__init()

        const options = new ResolverOptions({
            resolve: {
                remote: false
            }
        })

        const dummyJSON = {
            value: 12,
            references: {
                Friend: {
                    $ref: 'http://echo.luckymarmot.com/#/references/User'
                },
                User: {
                    $ref: '#/references/Friend'
                }
            }
        }

        const item = new Item({
            content: JSON.stringify(dummyJSON),
            file: {
                path: __dirname + 'fixtures/',
                name: 'dummy.json'
            }
        })

        const reference = new JSONSchemaReference({
            uri: '#/references/User'
        })

        let container = new ReferenceContainer()
        container = container.update(reference)

        let references = new Immutable.OrderedMap({
            schemas: container
        })

        let expectedContainer = new ReferenceContainer()
        expectedContainer = expectedContainer.create(new Immutable.List([
            new JSONSchemaReference({
                uri: '#/references/User',
                value: {
                    $ref: new JSONSchemaReference({
                        uri: '#/references/Friend'
                    })
                },
                resolved: true,
                dependencies: new Immutable.List([
                    new JSONSchemaReference({
                        uri: '#/references/Friend',
                        relative: '#/references/Friend'
                    })
                ])
            }),
            new JSONSchemaReference({
                uri: '#/references/Friend',
                relative: '#/references/Friend',
                value: {
                    $ref: new JSONSchemaReference({
                        uri: 'http://echo.luckymarmot.com/#/references/User'
                    })
                },
                resolved: true,
                dependencies: new Immutable.List([
                    new JSONSchemaReference({
                        uri:
                            'http://echo.luckymarmot.com/#/references/User',
                        relative:
                            'http://echo.luckymarmot.com/#/references/User'
                    })
                ])
            }),
            new JSONSchemaReference({
                uri: 'http://echo.luckymarmot.com/#/references/User',
                relative: 'http://echo.luckymarmot.com/#/references/User',
                value: null,
                resolved: true
            })
        ]))

        let expected = new Context({
            references: new Immutable.OrderedMap({
                schemas: expectedContainer
            })
        })

        let promise = resolver.resolveAll(item, new Context({
            references: references
        }), options)

        promise.then(refs => {
            this.assertJSONEqual(expected, refs)
            done()
        }, err => {
            throw new Error(err)
        }).catch(error => {
            done(new Error(error))
        })
    }

    @targets('resolveAll')
    testResolveAllWithCustomResolveOption(done) {
        const resolver = this.__init()

        const options = new ResolverOptions({
            resolve: [
                {
                    uri: 'http://echo.luckymarmot.com/#/references/User',
                    value: {
                        type: 'string',
                        enum: [ 'custom resolved' ]
                    }
                }
            ]
        })

        const dummyJSON = {
            value: 12,
            references: {
                Friend: {
                    $ref: 'http://echo.luckymarmot.com/#/references/User'
                },
                User: {
                    $ref: '#/references/Friend'
                }
            }
        }

        const item = new Item({
            content: JSON.stringify(dummyJSON),
            file: {
                path: __dirname + 'fixtures/',
                name: 'dummy.json'
            }
        })

        const reference = new JSONSchemaReference({
            uri: '#/references/User'
        })

        let container = new ReferenceContainer()
        container = container.update(reference)

        let references = new Immutable.OrderedMap({
            schemas: container
        })

        let expectedContainer = new ReferenceContainer()
        expectedContainer = expectedContainer.create(new Immutable.List([
            new JSONSchemaReference({
                uri: '#/references/User',
                value: {
                    $ref: new JSONSchemaReference({
                        uri: '#/references/Friend'
                    })
                },
                resolved: true,
                dependencies: new Immutable.List([
                    new JSONSchemaReference({
                        uri: '#/references/Friend',
                        relative: '#/references/Friend'
                    })
                ])
            }),
            new JSONSchemaReference({
                uri: '#/references/Friend',
                relative: '#/references/Friend',
                value: {
                    $ref: new JSONSchemaReference({
                        uri: 'http://echo.luckymarmot.com/#/references/User'
                    })
                },
                resolved: true,
                dependencies: new Immutable.List([
                    new JSONSchemaReference({
                        uri:
                            'http://echo.luckymarmot.com/#/references/User',
                        relative:
                            'http://echo.luckymarmot.com/#/references/User'
                    })
                ])
            }),
            new JSONSchemaReference({
                uri: 'http://echo.luckymarmot.com/#/references/User',
                relative: 'http://echo.luckymarmot.com/#/references/User',
                value: {
                    type: 'string',
                    enum: [ 'custom resolved' ]
                },
                resolved: true
            })
        ]))

        let expected = new Context({
            references: new Immutable.OrderedMap({
                schemas: expectedContainer
            })
        })

        let promise = resolver.resolveAll(item, new Context({
            references: references
        }), options)

        promise.then(refs => {
            this.assertJSONEqual(expected, refs)
            done()
        }, err => {
            throw new Error(err)
        }).catch(error => {
            done(new Error(error))
        })
    }

    @targets('resolveAll')
    testResolveAllWithCustomNoResolveOption(done) {
        const resolver = this.__init()

        const options = new ResolverOptions({
            resolve: [
                {
                    uri: 'http://echo.luckymarmot.com/#/references/User',
                    resolve: false
                }
            ]
        })

        const dummyJSON = {
            value: 12,
            references: {
                Friend: {
                    $ref: 'http://echo.luckymarmot.com/#/references/User'
                },
                User: {
                    $ref: '#/references/Friend'
                }
            }
        }

        const item = new Item({
            content: JSON.stringify(dummyJSON),
            file: {
                path: __dirname + 'fixtures/',
                name: 'dummy.json'
            }
        })

        const reference = new JSONSchemaReference({
            uri: '#/references/User'
        })

        let container = new ReferenceContainer()
        container = container.update(reference)

        let references = new Immutable.OrderedMap({
            schemas: container
        })

        let expectedContainer = new ReferenceContainer()
        expectedContainer = expectedContainer.create(new Immutable.List([
            new JSONSchemaReference({
                uri: '#/references/User',
                value: {
                    $ref: new JSONSchemaReference({
                        uri: '#/references/Friend'
                    })
                },
                resolved: true,
                dependencies: new Immutable.List([
                    new JSONSchemaReference({
                        uri: '#/references/Friend',
                        relative: '#/references/Friend'
                    })
                ])
            }),
            new JSONSchemaReference({
                uri: '#/references/Friend',
                relative: '#/references/Friend',
                value: {
                    $ref: new JSONSchemaReference({
                        uri: 'http://echo.luckymarmot.com/#/references/User'
                    })
                },
                resolved: true,
                dependencies: new Immutable.List([
                    new JSONSchemaReference({
                        uri:
                            'http://echo.luckymarmot.com/#/references/User',
                        relative:
                            'http://echo.luckymarmot.com/#/references/User'
                    })
                ])
            }),
            new JSONSchemaReference({
                uri: 'http://echo.luckymarmot.com/#/references/User',
                relative: 'http://echo.luckymarmot.com/#/references/User',
                value: null,
                resolved: true
            })
        ]))

        let expected = new Context({
            references: new Immutable.OrderedMap({
                schemas: expectedContainer
            })
        })

        let promise = resolver.resolveAll(item, new Context({
            references: references
        }), options)

        promise.then(refs => {
            this.assertJSONEqual(expected, refs)
            done()
        }, err => {
            throw new Error(err)
        }).catch(error => {
            done(new Error(error))
        })
    }

    @targets('resolveAll')
    testResolveAllCallsParameterResolve_resolveAll(done) {
        const resolver = this.__init()

        const paramResolver = new ClassMock(new ParameterResolver(), '')

        paramResolver.spyOn('resolveAll', () => {
            return 12
        })

        const dummyJSON = {
            value: 12,
            references: {
                Friend: {
                    $ref: '#/references/User'
                },
                User: {
                    $ref: '#/references/Friend'
                }
            }
        }

        const item = new Item({
            content: JSON.stringify(dummyJSON),
            file: {
                path: __dirname + 'fixtures/',
                name: 'dummy.json'
            }
        })

        const reference = new JSONSchemaReference({
            uri: '#/references/Friend'
        })

        let container = new ReferenceContainer()
        container = container.update(reference)

        let references = new Immutable.OrderedMap({
            schemas: container
        })

        let expectedContainer = new ReferenceContainer()
        expectedContainer = expectedContainer.create(new Immutable.List([
            new JSONSchemaReference({
                uri: '#/references/Friend',
                value: {
                    $ref: new JSONSchemaReference({
                        uri: '#/references/User'
                    })
                },
                resolved: true,
                dependencies: new Immutable.List([
                    new JSONSchemaReference({
                        uri: '#/references/User',
                        relative: '#/references/User'
                    })
                ])
            }),
            new JSONSchemaReference({
                uri: '#/references/User',
                relative: '#/references/User',
                value: {
                    $ref: new JSONSchemaReference({
                        uri: '#/references/Friend'
                    })
                },
                resolved: true,
                dependencies: new Immutable.List([
                    new JSONSchemaReference({
                        uri: '#/references/Friend',
                        relative: '#/references/Friend'
                    })
                ])
            })
        ]))

        let expected = new Context({
            references: new Immutable.OrderedMap({
                schemas: expectedContainer
            })
        })

        let promise = resolver.resolveAll(item, new Context({
            references: references
        }), new ResolverOptions(), paramResolver)

        promise.then(context => {
            this.assertEqual(12, context)
            this.assertEqual(paramResolver.spy.resolveAll.count, 1)
            this.assertJSONEqual(
                paramResolver.spy.resolveAll.calls[0],
                [ expected, new ResolverOptions() ]
            )
            done()
        }, err => {
            throw new Error(err)
        }).catch(error => {
            done(new Error(error))
        })
    }

    __init() {
        const env = new NodeEnvironment()
        const resolver = new ContextResolver(env)
        return resolver
    }
}
