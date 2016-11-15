import { UnitTest, registerTest } from '../../utils/TestUtils'

import Constraint from '../Constraint'

@registerTest
export class TestConstraint extends UnitTest {
    testConstraintHasExpectedKeys() {
        let mod = new Constraint.Constraint()

        let expected = [
            '_model',
            'name',
            'value',
            'expression'
        ]

        this.assertEqual(expected, mod.keySeq())
    }

    testConstraintEvaluatesToFalse() {
        let mod = new Constraint.Constraint()
        this.assertFalse(mod.evaluate())
    }

    testConstraintToJSONSchemaReturnsSimpleSchema() {
        let mod = new Constraint.Constraint({
            name: 'test',
            value: 28
        })

        let expected = {
            test: 28
        }

        let result = mod.toJSONSchema()

        this.assertEqual(expected, result)
    }
}

@registerTest
export class TestMultipleOfConstraint extends UnitTest {
    testMultipleOfConstraint() {
        let mod = new Constraint.MultipleOf(4)

        this.assertTrue(mod.evaluate(4))
        this.assertTrue(mod.evaluate(24))
        this.assertFalse(mod.evaluate(5))
        this.assertFalse(mod.evaluate(5.5))
    }
}

@registerTest
export class TestMaximumConstraint extends UnitTest {
    testMaximumConstraint() {
        let max = new Constraint.Maximum(4)

        this.assertTrue(max.evaluate(3))
        this.assertTrue(max.evaluate(4))
        this.assertFalse(max.evaluate(5))
    }
}

@registerTest
export class TestExclusiveMaximumConstraint extends UnitTest {
    testExclusiveMaximumConstraint() {
        let max = new Constraint.ExclusiveMaximum(4)

        this.assertTrue(max.evaluate(3))
        this.assertFalse(max.evaluate(4))
        this.assertFalse(max.evaluate(5))
    }

    testExclusiveMaximumConstraintToJSONSchema() {
        let max = new Constraint.ExclusiveMaximum(4)

        let expected = {
            maximum: 4,
            exclusiveMaximum: true
        }

        let result = max.toJSONSchema()

        this.assertEqual(expected, result)
    }
}

@registerTest
export class TestMinimumConstraint extends UnitTest {
    testMinimumConstraint() {
        let min = new Constraint.Minimum(4)

        this.assertTrue(min.evaluate(5))
        this.assertTrue(min.evaluate(4))
        this.assertFalse(min.evaluate(3))
    }
}

@registerTest
export class TestExclusiveMinimumConstraint extends UnitTest {
    testExclusiveMinimumConstraint() {
        let min = new Constraint.ExclusiveMinimum(4)

        this.assertTrue(min.evaluate(5))
        this.assertFalse(min.evaluate(4))
        this.assertFalse(min.evaluate(3))
    }

    testExclusiveMinimumConstraintToJSONSchema() {
        let min = new Constraint.ExclusiveMinimum(4)

        let expected = {
            minimum: 4,
            exclusiveMinimum: true
        }

        let result = min.toJSONSchema()

        this.assertEqual(expected, result)
    }
}

@registerTest
export class TestMaximumLengthConstraint extends UnitTest {
    testMaximumLengthConstraint() {
        let max = new Constraint.MaximumLength(5)

        this.assertTrue(max.evaluate('this'))
        this.assertTrue(max.evaluate('short'))
        this.assertFalse(max.evaluate('too long'))
    }
}

@registerTest
export class TestMinimumLengthConstraint extends UnitTest {
    testMinimumLengthConstraint() {
        let min = new Constraint.MinimumLength(10)

        this.assertFalse(min.evaluate('too short'))
        this.assertTrue(min.evaluate('just right'))
        this.assertTrue(min.evaluate('long enough'))
    }
}

@registerTest
export class TestPatternConstraint extends UnitTest {
    testPatternConstraint() {
        let pattern = new Constraint.Pattern(/.*valid.*/)

        this.assertTrue(pattern.evaluate('this is valid'))
        this.assertFalse(pattern.evaluate('this is not'))
    }
}

@registerTest
export class TestMaximumItemsConstraint extends UnitTest {
    testMaximumItemsConstraint() {
        let max = new Constraint.MaximumItems(3)

        this.assertTrue(max.evaluate([ 1, 2 ]))
        this.assertTrue(max.evaluate([ 1, 2, 3 ]))
        this.assertFalse(max.evaluate([ 1, 2, 3, 4 ]))
    }
}

@registerTest
export class TestMinimumItemsConstraint extends UnitTest {
    testMinimumItemsConstraint() {
        let min = new Constraint.MinimumItems(3)

        this.assertFalse(min.evaluate([ 1, 2 ]))
        this.assertTrue(min.evaluate([ 1, 2, 3 ]))
        this.assertTrue(min.evaluate([ 1, 2, 3, 4 ]))
    }
}

@registerTest
export class TestUniqueItemsConstraint extends UnitTest {
    testUniqueItemsConstraint() {
        let uniq = new Constraint.UniqueItems(true)

        this.assertTrue(uniq.evaluate([ 1, 2 ]))
        this.assertFalse(uniq.evaluate([ 1, 2, 3, 2 ]))
        this.assertTrue(uniq.evaluate([ 1, 2, 3, [ 1, 2, 3 ] ]))
    }
}

@registerTest
export class TestMaximumPropertiesConstraint extends UnitTest {
    testMaximumPropertiesConstraint() {
        let max = new Constraint.MaximumProperties(3)

        this.assertTrue(max.evaluate({ a: 1, b: 2 }))
        this.assertTrue(max.evaluate({ a: 1, b: 2, c: 3 }))
        this.assertFalse(max.evaluate({ a: 1, b: 2, c: 3, d: 4 }))
    }
}

@registerTest
export class TestMinimumPropertiesConstraint extends UnitTest {
    testMinimumPropertiesConstraint() {
        let min = new Constraint.MinimumProperties(3)

        this.assertFalse(min.evaluate({ a: 1, b: 2 }))
        this.assertTrue(min.evaluate({ a: 1, b: 2, c: 3 }))
        this.assertTrue(min.evaluate({ a: 1, b: 2, c: 3, d: 4 }))
    }
}

@registerTest
export class TestEnumConstraint extends UnitTest {
    testEnumConstraint() {
        let num = new Constraint.Enum([ 'one', 'two', 'three' ])

        this.assertFalse(num.evaluate('four'))
        this.assertTrue(num.evaluate('one'))
        this.assertTrue(num.evaluate('three'))
    }
}

@registerTest
export default class TestConstraintHelper extends UnitTest {
    TestConstraintHelperHasAllTheConstraints() {
        let constraints = require('../Constraint.js')

        delete constraints.default

        let values = Object.values(constraints)
        let exported = Object.values(Constraint)

        for (let constraint of values) {
            let found = false
            for (let Present of exported) {
                if (new Present() instanceof constraint) {
                    found = true
                    break
                }
            }

            if (!found) {
                this.assertTrue(false)
            }
        }
    }
}
