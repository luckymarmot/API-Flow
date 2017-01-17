/* eslint-disable max-nested-callbacks */
import { Record } from 'immutable'
import expect from 'expect'

import Constraint from '../Constraint'

describe('models/Constraint.js', () => {
  describe('{ Constraint }', () => {
    it('should be a Record', () => {
      const instance = new Constraint.Constraint({})

      expect(instance).toBeA(Record)
    })

    describe('#fields', () => {
      const fields = [
        'name',
        'value',
        'expression'
      ]

      for (const field of fields) {
        it('should have a `' + field + '` field', () => {
          const key = field
          const value = 'test'
          const data = {}

          data[key] = value
          const instance = new Constraint.Constraint(data)

          expect(instance.get(key)).toEqual(value)
        })
      }
    })

    describe('@evaluate', () => {
      it('should return false', () => {
        const mod = new Constraint.Constraint()

        const expected = false
        const actual = mod.evaluate()

        expect(actual).toEqual(expected)
      })
    })

    describe('@toJSONSchema', () => {
      it('should work', () => {
        const mod = new Constraint.Constraint({
          name: 'test',
          value: 28
        })

        const expected = { test: 28 }
        const actual = mod.toJSONSchema()

        expect(actual).toEqual(expected)
      })
    })
  })

  describe('{ MultipleOfConstraint }', () => {
    it('should be a Constraint', () => {
      const mod = new Constraint.MultipleOf(4)

      expect(mod).toBeA(Constraint.Constraint)
    })

    it('should work', () => {
      const mod = new Constraint.MultipleOf(4)

      expect(mod.evaluate(4)).toEqual(true)
      expect(mod.evaluate(24)).toEqual(true)
      expect(mod.evaluate(5)).toEqual(false)
      expect(mod.evaluate(5.5)).toEqual(false)
    })
  })

  describe('{ MaximumConstraint }', () => {
    it('should be a Constraint', () => {
      const mod = new Constraint.Maximum(4)

      expect(mod).toBeA(Constraint.Constraint)
    })

    it('should work', () => {
      const mod = new Constraint.Maximum(4)

      expect(mod.evaluate(3)).toEqual(true)
      expect(mod.evaluate(4)).toEqual(true)
      expect(mod.evaluate(5)).toEqual(false)
    })
  })

  describe('{ ExclusiveMaximumConstraint }', () => {
    it('should be a Constraint', () => {
      const mod = new Constraint.ExclusiveMaximum(4)

      expect(mod).toBeA(Constraint.Constraint)
    })

    it('should work', () => {
      const mod = new Constraint.ExclusiveMaximum(4)

      expect(mod.evaluate(3)).toEqual(true)
      expect(mod.evaluate(4)).toEqual(false)
      expect(mod.evaluate(5)).toEqual(false)
    })

    it('@toJSONSchema works as expected', () => {
      const mod = new Constraint.ExclusiveMaximum(4)

      const expected = {
        maximum: 4,
        exclusiveMaximum: true
      }
      const actual = mod.toJSONSchema()

      expect(actual).toEqual(expected)
    })
  })

  describe('{ MinimumConstraint }', () => {
    it('should be a Constraint', () => {
      const mod = new Constraint.Minimum(4)

      expect(mod).toBeA(Constraint.Constraint)
    })

    it('should work', () => {
      const mod = new Constraint.Minimum(4)

      expect(mod.evaluate(3)).toEqual(false)
      expect(mod.evaluate(4)).toEqual(true)
      expect(mod.evaluate(5)).toEqual(true)
    })
  })

  describe('{ ExclusiveMinimumConstraint }', () => {
    it('should be a Constraint', () => {
      const mod = new Constraint.ExclusiveMinimum(4)

      expect(mod).toBeA(Constraint.Constraint)
    })

    it('should work', () => {
      const mod = new Constraint.ExclusiveMinimum(4)

      expect(mod.evaluate(3)).toEqual(false)
      expect(mod.evaluate(4)).toEqual(false)
      expect(mod.evaluate(5)).toEqual(true)
    })

    it('@toJSONSchema works as expected', () => {
      const mod = new Constraint.ExclusiveMinimum(4)

      const expected = {
        minimum: 4,
        exclusiveMinimum: true
      }

      const actual = mod.toJSONSchema()
      expect(actual).toEqual(expected)
    })
  })

  describe('{ MaximumLengthConstraint }', () => {
    it('should be a Constraint', () => {
      const mod = new Constraint.MaximumLength(4)

      expect(mod).toBeA(Constraint.Constraint)
    })

    it('should work', () => {
      const mod = new Constraint.MaximumLength(5)

      expect(mod.evaluate('this')).toEqual(true)
      expect(mod.evaluate('short')).toEqual(true)
      expect(mod.evaluate('too long')).toEqual(false)
    })
  })

  describe('{ MinimumLengthConstraint }', () => {
    it('should be a Constraint', () => {
      const mod = new Constraint.MinimumLength(4)

      expect(mod).toBeA(Constraint.Constraint)
    })

    it('should work', () => {
      const mod = new Constraint.MinimumLength(10)

      expect(mod.evaluate('too short')).toEqual(false)
      expect(mod.evaluate('just right')).toEqual(true)
      expect(mod.evaluate('long enough')).toEqual(true)
    })
  })

  describe('{ PatternConstraint }', () => {
    it('should be a Constraint', () => {
      const mod = new Constraint.Pattern(/.*valid.*/)

      expect(mod).toBeA(Constraint.Constraint)
    })

    it('should work', () => {
      const mod = new Constraint.Pattern(/.*valid.*/)

      expect(mod.evaluate('this is valid')).toEqual(true)
      expect(mod.evaluate('this is not')).toEqual(false)
    })
  })

  describe('{ MaximumItemsConstraint }', () => {
    it('should be a Constraint', () => {
      const mod = new Constraint.MaximumItems(3)

      expect(mod).toBeA(Constraint.Constraint)
    })

    it('should work', () => {
      const mod = new Constraint.MaximumItems(3)

      expect(mod.evaluate([ 1, 2 ])).toEqual(true)
      expect(mod.evaluate([ 1, 2, 3 ])).toEqual(true)
      expect(mod.evaluate([ 1, 2, 3, 4 ])).toEqual(false)
    })
  })

  describe('{ MinimumItemsConstraint }', () => {
    it('should be a Constraint', () => {
      const mod = new Constraint.MinimumItems(3)

      expect(mod).toBeA(Constraint.Constraint)
    })

    it('should work', () => {
      const mod = new Constraint.MinimumItems(3)

      expect(mod.evaluate([ 1, 2 ])).toEqual(false)
      expect(mod.evaluate([ 1, 2, 3 ])).toEqual(true)
      expect(mod.evaluate([ 1, 2, 3, 4 ])).toEqual(true)
    })
  })

  describe('{ UniqueItemsConstraint }', () => {
    it('should be a Constraint', () => {
      const mod = new Constraint.UniqueItems(true)

      expect(mod).toBeA(Constraint.Constraint)
    })

    it('should work', () => {
      const mod = new Constraint.UniqueItems(true)

      expect(mod.evaluate([ 1, 2 ])).toEqual(true)
      expect(mod.evaluate([ 1, 2, 3, 2 ])).toEqual(false)
      expect(mod.evaluate([ 1, 2, 3, [ 1, 2, 3 ] ])).toEqual(true)
    })
  })

  describe('{ MaximumPropertiesConstraint }', () => {
    it('should be a Constraint', () => {
      const mod = new Constraint.MaximumProperties(3)

      expect(mod).toBeA(Constraint.Constraint)
    })

    it('should work', () => {
      const mod = new Constraint.MaximumProperties(3)

      expect(mod.evaluate({ a: 1, b: 2 })).toEqual(true)
      expect(mod.evaluate({ a: 1, b: 2, c: 3 })).toEqual(true)
      expect(mod.evaluate({ a: 1, b: 2, c: 3, d: 4 })).toEqual(false)
    })
  })

  describe('{ MinimumPropertiesConstraint }', () => {
    it('should be a Constraint', () => {
      const mod = new Constraint.MinimumProperties(3)

      expect(mod).toBeA(Constraint.Constraint)
    })

    it('should work', () => {
      const mod = new Constraint.MinimumProperties(3)

      expect(mod.evaluate({ a: 1, b: 2 })).toEqual(false)
      expect(mod.evaluate({ a: 1, b: 2, c: 3 })).toEqual(true)
      expect(mod.evaluate({ a: 1, b: 2, c: 3, d: 4 })).toEqual(true)
    })
  })

  describe('{ EnumConstraint }', () => {
    it('should be a Constraint', () => {
      const mod = new Constraint.Enum([ 'one', 'two', 'three' ])

      expect(mod).toBeA(Constraint.Constraint)
    })

    it('should work', () => {
      const mod = new Constraint.Enum([ 'one', 'two', 'three' ])

      expect(mod.evaluate('one')).toEqual(true)
      expect(mod.evaluate('two')).toEqual(true)
      expect(mod.evaluate('four')).toEqual(false)
    })
  })

  describe('{ JSONSchemaConstraint }', () => {
    it('should be a Constraint', () => {
      const mod = new Constraint.JSONSchema({
        type: 'integer',
        minimum: 3,
        maximum: 6
      })

      expect(mod).toBeA(Constraint.Constraint)
    })

    xit('should work', () => {
      const mod = new Constraint.JSONSchema({
        type: 'integer',
        minimum: 3,
        maximum: 6
      })

      expect(mod.evaluate(1)).toEqual(true)
      expect(mod.evaluate(4)).toEqual(true)
      expect(mod.evaluate(7)).toEqual(true)
    })
  })

  describe('{ XMLSchemaConstraint }', () => {
    it('should be a Constraint', () => {
      const mod = new Constraint.XMLSchema(
        `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
          <xs:element name="userId" type="xs:string"/>
         </xs:schema>`
      )

      expect(mod).toBeA(Constraint.Constraint)
    })

    xit('should work', () => {
      const mod = new Constraint.XMLSchema(
        `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
          <xs:element name="userId" type="xs:string"/>
         </xs:schema>`
      )

      expect(mod.evaluate('1')).toEqual(true)
      expect(mod.evaluate(4)).toEqual(true)
      expect(mod.evaluate(null)).toEqual(true)
    })
  })
})
