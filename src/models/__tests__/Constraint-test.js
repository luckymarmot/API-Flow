import { UnitTest, registerTest } from '../../utils/TestUtils'

import Constraint from '../Constraint'

@registerTest
export default class TestConstraint extends UnitTest {
    testMultipleOfConstraint() {
        let mod = new Constraint.MultipleOf(4)

        this.assertTrue(mod.evaluate(4))
        this.assertTrue(mod.evaluate(24))
        this.assertFalse(mod.evaluate(5))
        this.assertFalse(mod.evaluate(5.5))
    }

    testMaximumConstraint() {
        let max = new Constraint.Maximum(4)

        this.assertTrue(max.evaluate(3))
        this.assertTrue(max.evaluate(4))
        this.assertFalse(max.evaluate(5))
    }

    testExclusiveMaximumConstraint() {
        let max = new Constraint.ExclusiveMaximum(4)

        this.assertTrue(max.evaluate(3))
        this.assertFalse(max.evaluate(4))
        this.assertFalse(max.evaluate(5))
    }

    testMinimumConstraint() {
        let min = new Constraint.Minimum(4)

        this.assertTrue(min.evaluate(5))
        this.assertTrue(min.evaluate(4))
        this.assertFalse(min.evaluate(3))
    }

    testExclusiveMinimumConstraint() {
        let min = new Constraint.ExclusiveMinimum(4)

        this.assertTrue(min.evaluate(5))
        this.assertFalse(min.evaluate(4))
        this.assertFalse(min.evaluate(3))
    }

    testMaximumLengthConstraint() {
        let max = new Constraint.MaximumLength(5)

        this.assertTrue(max.evaluate('this'))
        this.assertTrue(max.evaluate('short'))
        this.assertFalse(max.evaluate('too long'))
    }

    testMinimumLengthConstraint() {
        let min = new Constraint.MinimumLength(10)

        this.assertFalse(min.evaluate('too short'))
        this.assertTrue(min.evaluate('just right'))
        this.assertTrue(min.evaluate('long enough'))
    }

    testPatternConstraint() {
        let pattern = new Constraint.Pattern(/.*valid.*/)

        this.assertTrue(pattern.evaluate('this is valid'))
        this.assertFalse(pattern.evaluate('this is not'))
    }

    testMaximumItemsConstraint() {
        let max = new Constraint.MaximumItems(3)

        this.assertTrue(max.evaluate([ 1, 2 ]))
        this.assertTrue(max.evaluate([ 1, 2, 3 ]))
        this.assertFalse(max.evaluate([ 1, 2, 3, 4 ]))
    }

    testMinimumItemsConstraint() {
        let min = new Constraint.MinimumItems(3)

        this.assertFalse(min.evaluate([ 1, 2 ]))
        this.assertTrue(min.evaluate([ 1, 2, 3 ]))
        this.assertTrue(min.evaluate([ 1, 2, 3, 4 ]))
    }

    testUniqueItemsConstraint() {
        let uniq = new Constraint.UniqueItems(true)

        this.assertTrue(uniq.evaluate([ 1, 2 ]))
        this.assertFalse(uniq.evaluate([ 1, 2, 3, 2 ]))
        this.assertTrue(uniq.evaluate([ 1, 2, 3, [ 1, 2, 3 ] ]))
    }

    testMaximumPropertiesConstraint() {
        let max = new Constraint.MaximumProperties(3)

        this.assertTrue(max.evaluate({ a: 1, b: 2 }))
        this.assertTrue(max.evaluate({ a: 1, b: 2, c: 3 }))
        this.assertFalse(max.evaluate({ a: 1, b: 2, c: 3, d: 4 }))
    }

    testMinimumPropertiesConstraint() {
        let min = new Constraint.MinimumProperties(3)

        this.assertFalse(min.evaluate({ a: 1, b: 2 }))
        this.assertTrue(min.evaluate({ a: 1, b: 2, c: 3 }))
        this.assertTrue(min.evaluate({ a: 1, b: 2, c: 3, d: 4 }))
    }

    testEnumConstraint() {
        let num = new Constraint.Enum([ 'one', 'two', 'three' ])

        this.assertFalse(num.evaluate('four'))
        this.assertTrue(num.evaluate('one'))
        this.assertTrue(num.evaluate('three'))
    }
}
