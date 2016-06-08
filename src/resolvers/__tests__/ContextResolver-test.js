import Immutable from 'immutable'

import {
    UnitTest,
    registerTest,
    targets,
    against
} from '../../utils/TestUtils'

import ContextResolver from '../ContextResolver'
import NodeEnvironment from '../../models/environments/NodeEnvironment'
import Item from '../../models/Item'

import ReferenceContainer from '../../models/references/Container'
import JSONSchemaReference from '../../models/references/JSONSchema'

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

        let expected = new Immutable.OrderedMap({
            schemas: expectedContainer
        })

        let promise = resolver.resolveAll(item, references)

        promise.then(refs => {
            this.assertJSONEqual(expected, refs)
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
