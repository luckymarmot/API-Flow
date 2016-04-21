import Immutable from 'immutable'

import { UnitTest, registerTest } from '../../utils/TestUtils'

import { Parameter, ParameterContainer } from '../Core'
import Constraint from '../Constraint'

@registerTest
export class TestParameter extends UnitTest {
    testGenerate() {
        let param = new Parameter({
            key: 'testKey',
            type: 'number',
            name: 'Simple Value',
            description: 'returns a value between 0 and 1',
            example: '0.45890142',
            internal: new Immutable.List([
                new Constraint.Minimum(0),
                new Constraint.ExclusiveMaximum(1)
            ])
        })

        let result = param.generate()

        this.assertEqual(param, result)
    }

    testValidateWithSimpleNumberConstraints() {
        let param = new Parameter({
            key: 'testKey',
            type: 'number',
            name: 'Simple Value',
            description: 'returns a value between 0 and 1',
            example: '0.45890142',
            internal: new Immutable.List([
                new Constraint.Minimum(0),
                new Constraint.ExclusiveMaximum(1)
            ])
        })

        this.assertTrue(param.validate(0.5))
        this.assertFalse(param.validate(1))
        this.assertFalse(param.validate(-1))
        this.assertFalse(param.validate('a'))
    }

    testValidateWithRichNumberConstraints() {
        let param = new Parameter({
            key: 'testKey',
            type: 'number',
            name: 'Simple Value',
            description: 'returns a value between 0 and 1',
            example: '0.45890142',
            internal: new Immutable.List([
                new Constraint.Minimum(0),
                new Constraint.ExclusiveMaximum(10),
                new Constraint.MultipleOf(2),
                new Constraint.Enum([ 2, 3, 5, 7, 8, 12, -14 ])
            ])
        })

        this.assertTrue(param.validate(8))
        this.assertFalse(param.validate(6))
        this.assertFalse(param.validate(12))
        this.assertFalse(param.validate(-14))
        this.assertFalse(param.validate(5))
    }

    testValidateWithSimpleStringConstraints() {
        let param = new Parameter({
            key: 'testKey',
            type: 'string',
            name: 'Simple Value',
            description: 'returns a string of length 6-9, respecting a pattern',
            example: 'hello',
            internal: new Immutable.List([
                new Constraint.MinimumLength(6),
                new Constraint.MaximumLength(9),
                new Constraint.Pattern(/he+llo/)
            ])
        })

        this.assertTrue(param.validate('heeello'))
        this.assertFalse(param.validate('hello'))
        this.assertFalse(param.validate('heeeeeeello'))
        this.assertFalse(param.validate('world!'))
    }
}

@registerTest
export class TestParameterContainer extends UnitTest {
    setUp() {
        this.container = new ParameterContainer({
            headers: new Immutable.List([
                new Parameter({
                    key: 'headerKey',
                    type: 'string',
                    external: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            internal: new Immutable.List([
                                new Constraint.Enum([ 'app/json' ])
                            ])
                        })
                    ])
                }),
                new Parameter({
                    key: 'headerKey',
                    type: 'string',
                    external: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            internal: new Immutable.List([
                                new Constraint.Enum([ 'app/xml' ])
                            ])
                        })
                    ])
                }),
                new Parameter({
                    key: 'headerSecondKey',
                    type: 'string',
                    external: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            internal: new Immutable.List([
                                new Constraint.Enum([ 'app/json' ])
                            ])
                        })
                    ])
                })
            ]),
            queries: new Immutable.List([
                new Parameter({
                    key: 'queryKey',
                    type: 'string',
                    external: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            internal: new Immutable.List([
                                new Constraint.Enum([ 'app/xml' ])
                            ])
                        })
                    ])
                }),
                new Parameter({
                    key: 'secureKey',
                    type: 'string',
                    external: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            internal: new Immutable.List([
                                new Constraint.Enum([ 'oauth2' ])
                            ])
                        }),
                        new Parameter({
                            key: 'Content-Type',
                            internal: new Immutable.List([
                                new Constraint.Enum([ 'app/json' ])
                            ])
                        })
                    ])
                }),
                new Parameter({
                    key: 'querySecondKey',
                    type: 'string',
                    external: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            internal: new Immutable.List([
                                new Constraint.Enum([ 'app/json', 'app/xml' ])
                            ])
                        })
                    ])
                })
            ]),
            body: new Immutable.List([
                new Parameter({
                    key: 'xmlSchemaKey',
                    type: 'schema',
                    external: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            internal: new Immutable.List([
                                new Constraint.Enum([ 'app/xml' ])
                            ])
                        })
                    ])
                }),
                new Parameter({
                    key: 'jsonSchemaKey',
                    type: 'string',
                    external: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            internal: new Immutable.List([
                                new Constraint.Enum([ 'app/json' ])
                            ])
                        })
                    ])
                })
            ])
        })
    }

    testFilterNoFilter() {
        let result = this.container.filter()
        this.assertEqual(this.container, result)
    }

    testFilterSimpleFilter() {
        const expected = new ParameterContainer({
            headers: new Immutable.List([
                new Parameter({
                    key: 'headerKey',
                    type: 'string',
                    external: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            internal: new Immutable.List([
                                new Constraint.Enum([ 'app/json' ])
                            ])
                        })
                    ])
                }),
                new Parameter({
                    key: 'headerSecondKey',
                    type: 'string',
                    external: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            internal: new Immutable.List([
                                new Constraint.Enum([ 'app/json' ])
                            ])
                        })
                    ])
                })
            ]),
            queries: new Immutable.List([
                new Parameter({
                    key: 'secureKey',
                    type: 'string',
                    external: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            internal: new Immutable.List([
                                new Constraint.Enum([ 'oauth2' ])
                            ])
                        }),
                        new Parameter({
                            key: 'Content-Type',
                            internal: new Immutable.List([
                                new Constraint.Enum([ 'app/json' ])
                            ])
                        })
                    ])
                }),
                new Parameter({
                    key: 'querySecondKey',
                    type: 'string',
                    external: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            internal: new Immutable.List([
                                new Constraint.Enum([ 'app/json', 'app/xml' ])
                            ])
                        })
                    ])
                })
            ]),
            body: new Immutable.List([
                new Parameter({
                    key: 'jsonSchemaKey',
                    type: 'string',
                    external: new Immutable.List([
                        new Parameter({
                            key: 'Content-Type',
                            internal: new Immutable.List([
                                new Constraint.Enum([ 'app/json' ])
                            ])
                        })
                    ])
                })
            ])
        })

        let filter = new Immutable.List([
            new Parameter({
                key: 'Content-Type',
                value: 'app/json'
            })
        ])
        let result = this.container.filter(filter)
        this.assertEqual(JSON.stringify(expected), JSON.stringify(result))
    }
}
