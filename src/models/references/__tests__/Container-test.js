import Immutable from 'immutable'

import {
    UnitTest,
    registerTest,
    targets,
    against
} from '../../../utils/TestUtils'

import JSONSchemaReference from '../JSONSchema'
import ReferenceCache from '../Cache'
import ReferenceContainer from '../Container'

@registerTest
@against(ReferenceContainer)
export class TestReferenceContainer extends UnitTest {
    __init() {
        return new ReferenceContainer()
    }

    @targets('create')
    testCreateWithSimpleReferences() {
        let container = this.__init()
        let refs = new Immutable.List([
            new JSONSchemaReference({
                uri: '#/definitions/User'
            }),
            new JSONSchemaReference({
                uri: '#/definitions/Product'
            }),
            new JSONSchemaReference({
                uri: '#/definitions/Company'
            }),
            new JSONSchemaReference({
                uri: '#/definitions/Service'
            })
        ])

        const expected = new ReferenceContainer({
            cache: new Immutable.OrderedMap({
                '#/definitions/User': new ReferenceCache({
                    cached: new JSONSchemaReference({
                        uri: '#/definitions/User'
                    })
                }),
                '#/definitions/Product': new ReferenceCache({
                    cached: new JSONSchemaReference({
                        uri: '#/definitions/Product'
                    })
                }),
                '#/definitions/Company': new ReferenceCache({
                    cached: new JSONSchemaReference({
                        uri: '#/definitions/Company'
                    })
                }),
                '#/definitions/Service': new ReferenceCache({
                    cached: new JSONSchemaReference({
                        uri: '#/definitions/Service'
                    })
                })
            })
        })

        const result = container.create(refs)

        this.assertJSONEqual(expected, result)
    }

    @targets('create')
    testCreateDoesNotOverridePreviousDefinitions() {
        let container = this.__init()
        let refs = new Immutable.List([
            new JSONSchemaReference({
                uri: '#/definitions/User',
                value: {
                    dummy: 90
                },
                resolved: true
            }),
            new JSONSchemaReference({
                uri: '#/definitions/Product'
            }),
            new JSONSchemaReference({
                uri: '#/definitions/User'
            }),
            new JSONSchemaReference({
                uri: '#/definitions/Service'
            })
        ])

        const expected = new ReferenceContainer({
            cache: new Immutable.OrderedMap({
                '#/definitions/User': new ReferenceCache({
                    cached: new JSONSchemaReference({
                        uri: '#/definitions/User',
                        value: {
                            dummy: 90
                        },
                        resolved: true
                    })
                }),
                '#/definitions/Product': new ReferenceCache({
                    cached: new JSONSchemaReference({
                        uri: '#/definitions/Product'
                    })
                }),
                '#/definitions/Service': new ReferenceCache({
                    cached: new JSONSchemaReference({
                        uri: '#/definitions/Service'
                    })
                })
            })
        })

        const result = container.create(refs)

        this.assertJSONEqual(expected, result)
    }

    @targets('update')
    testUpdateCreatesRefIfNotExists() {
        let container = this.__init()
        let ref = new JSONSchemaReference({
            uri: '#/definitions/User',
            value: {
                dummy: 90
            },
            resolved: true
        })

        const expected = new ReferenceContainer({
            cache: new Immutable.OrderedMap({
                '#/definitions/User': new ReferenceCache({
                    cached: new JSONSchemaReference({
                        uri: '#/definitions/User',
                        value: {
                            dummy: 90
                        },
                        resolved: true
                    })
                })
            })
        })

        const result = container.update(ref)

        this.assertJSONEqual(expected, result)
    }

    @targets('update')
    testUpdateOverridesRefIfExists() {
        let container = this.__init()

        let _ref = new JSONSchemaReference({
            uri: '#/definitions/User',
            value: {
                some: {
                    definition: {
                        value: 42
                    }
                }
            },
            resolved: true
        })

        container = container.update(_ref)

        let ref = new JSONSchemaReference({
            uri: '#/definitions/User',
            value: {
                dummy: 90
            },
            resolved: true
        })

        const expected = new ReferenceContainer({
            cache: new Immutable.OrderedMap({
                '#/definitions/User': new ReferenceCache({
                    cached: new JSONSchemaReference({
                        uri: '#/definitions/User',
                        value: {
                            dummy: 90
                        },
                        resolved: true
                    })
                })
            })
        })

        const result = container.update(ref)

        this.assertJSONEqual(expected, result)
    }

    @targets('resolve')
    testResolveWithSimpleCase() {
        let container = this.__init()

        let ref = new JSONSchemaReference({
            uri: '#/definitions/User',
            value: {
                some: {
                    definition: {
                        value: 42
                    }
                }
            },
            resolved: true
        })

        container = container.update(ref)

        const expected = ref
        const result = container.resolve('#/definitions/User')

        this.assertJSONEqual(expected, result)
    }

    @targets('resolve')
    testResolveWithUnknownURI() {
        let container = this.__init()

        let ref = new JSONSchemaReference({
            uri: '#/definitions/User',
            value: {
                some: {
                    definition: {
                        value: 42
                    }
                }
            },
            resolved: true
        })

        container = container.update(ref)

        const expected = null
        const result = container.resolve('#/definitions/Missing')

        this.assertJSONEqual(expected, result)
    }

    @targets('getUnresolvedReferences')
    testGetUnresolvedReferences() {
        let container = this.__init()

        let refs = new Immutable.List([
            new JSONSchemaReference({
                uri: '#/definitions/User',
                value: {
                    some: {
                        definition: {
                            value: 42
                        }
                    }
                },
                resolved: true
            }),
            new JSONSchemaReference({
                uri: '#/definitions/Product'
            }),
            new JSONSchemaReference({
                uri: '#/definitions/Company',
                value: {
                    $ref: new JSONSchemaReference({
                        uri: '#/definitions/User'
                    })
                },
                resolved: true
            }),
            new JSONSchemaReference({
                uri: '#/definitions/Service'
            })
        ])

        container = container.create(refs)

        const expected = new Immutable.List([
            '#/definitions/Product',
            '#/definitions/Service'
        ])
        const result = container.getUnresolvedReferences()

        this.assertJSONEqual(expected, result)
    }
}
