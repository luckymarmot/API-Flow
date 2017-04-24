import Immutable from 'immutable'

import Model from './ModelInfo'

/**
 * Metadata about the Constraint Record.
 * Used for internal serialization and deserialization
 */
const modelInstance = {
  name: 'constraint.constraint.models',
  version: '0.1.0'
}
const model = new Model(modelInstance)

/**
 * Default Spec for the BasicAuth Record.
 * - `name` is the name of the Constraint
 * - `value` is the context used by the `expression` field to validate an object
 * - `expression` is used to test whether an object is valid or not
 */
const ConstraintSpec = {
  _model: model,
  name: null,
  value: null,
  expression: () => { return false }
}

/**
 * The base Constraint class
 */
export class Constraint extends Immutable.Record(ConstraintSpec) {
  evaluate(d) {
    return this.get('expression')(d)
  }

  toJSONSchema() {
    const obj = {}
    const key = this.get('name')
    const value = this.get('value')
    obj[key] = value
    return obj
  }
}

/**
 * A MultipleOf Constraint.
 * evaluate returns true if and only if the object to test is a multiple of
 * the value passed to the constructor
 */
export class MultipleOfConstraint extends Constraint {
  constructor(value) {
    const obj = {
      _model: new Model({
        name: 'multiple-of.constraint.models',
        version: '0.1.0'
      }),
      name: 'multipleOf',
      value: value,
      expression: d => {
        return d % value === 0
      }
    }
    super(obj)
  }
}

/**
 * A Maximum Constraint.
 * evaluate returns true if and only if the object to test is smaller than
 * the value passed to the constructor
 */
export class MaximumConstraint extends Constraint {
  constructor(value) {
    const obj = {
      _model: new Model({
        name: 'maximum.constraint.models',
        version: '0.1.0'
      }),
      name: 'maximum',
      value: value,
      expression: d => {
        return d <= value
      }
    }
    super(obj)
  }
}

/**
 * An ExclusiveMaximum Constraint.
 * evaluate returns true if and only if the object to test is strictly smaller
 * the value passed to the constructor
 */
export class ExclusiveMaximumConstraint extends Constraint {
  constructor(value) {
    const obj = {
      _model: new Model({
        name: 'exclusive-maximum.constraint.models',
        version: '0.1.0'
      }),
      name: 'exclusiveMaximum',
      value: value,
      expression: d => {
        return d < value
      }
    }
    super(obj)
  }

  toJSONSchema() {
    const obj = {}
    const key = this.get('name')
    const value = this.get('value')
    obj.maximum = value
    obj[key] = true
    return obj
  }
}

/**
 * A Minimum Constraint
 * evaluate returns true if and only if the object to test is larger than
 * the value passed to the constructor
 */
export class MinimumConstraint extends Constraint {
  constructor(value) {
    const obj = {
      _model: new Model({
        name: 'minimum.constraint.models',
        version: '0.1.0'
      }),
      name: 'minimum',
      value: value,
      expression: d => {
        return d >= value
      }
    }
    super(obj)
  }
}

/**
 * An ExclusiveMinimum Constraint.
 * evaluate returns true if and only if the object to test is strictly larger than
 * the value passed to the constructor
 */
export class ExclusiveMinimumConstraint extends Constraint {
  constructor(value) {
    const obj = {
      _model: new Model({
        name: 'exclusive-minimum.constraint.models',
        version: '0.1.0'
      }),
      name: 'exclusiveMinimum',
      value: value,
      expression: d => {
        return d > value
      }
    }
    super(obj)
  }

  toJSONSchema() {
    const obj = {}
    const key = this.get('name')
    const value = this.get('value')
    obj.minimum = value
    obj[key] = true
    return obj
  }
}

/**
 * A MaximumLength Constraint.
 * evaluate returns true if and only if the object to test has a length smaller than
 * the value passed to the constructor
 */
export class MaximumLengthConstraint extends Constraint {
  constructor(value) {
    const obj = {
      _model: new Model({
        name: 'maximum-length.constraint.models',
        version: '0.1.0'
      }),
      name: 'maxLength',
      value: value,
      expression: d => {
        return d.length <= value
      }
    }
    super(obj)
  }
}

/**
 * A MinimumLength Constraint.
 * evaluate returns true if and only if the object to test has a length larger than
 * the value passed to the constructor
 */
export class MinimumLengthConstraint extends Constraint {
  constructor(value) {
    const obj = {
      _model: new Model({
        name: 'minimum-length.constraint.models',
        version: '0.1.0'
      }),
      name: 'minLength',
      value: value,
      expression: d => {
        return d.length >= value
      }
    }
    super(obj)
  }
}

/**
 * A Pattern Constraint.
 * evaluate returns true if and only if the object to test matches
 * the pattern passed to the constructor
 */
export class PatternConstraint extends Constraint {
  constructor(value) {
    const obj = {
      _model: new Model({
        name: 'pattern.constraint.models',
        version: '0.1.0'
      }),
      name: 'pattern',
      value: value,
      expression: d => {
        return d.match(value) !== null
      }
    }
    super(obj)
  }
}

/**
 * A MaximumItems Constraint.
 * evaluate returns true if and only if the object to test has less items than
 * the value passed to the constructor
 */
export class MaximumItemsConstraint extends Constraint {
  constructor(value) {
    const obj = {
      _model: new Model({
        name: 'maximum-items.constraint.models',
        version: '0.1.0'
      }),
      name: 'maxItems',
      value: value,
      expression: d => {
        if (typeof value === 'undefined' || value === null) {
          return true
        }
        return (d.length || d.size) <= value
      }
    }
    super(obj)
  }
}

/**
 * A MinimumItems Constraint.
 * evaluate returns true if and only if the object to test has more items than
 * the value passed to the constructor
 */
export class MinimumItemsConstraint extends Constraint {
  constructor(value = 0) {
    const obj = {
      _model: new Model({
        name: 'minimum-items.constraint.models',
        version: '0.1.0'
      }),
      name: 'minItems',
      value: value,
      expression: d => {
        return (d.length || d.size) >= value
      }
    }
    super(obj)
  }
}

/**
 * A UniqueItems Constraint.
 * evaluate returns true if and only if the object to test contains only
 * unique values
 */
export class UniqueItemsConstraint extends Constraint {
  constructor(value = false) {
    const obj = {
      _model: new Model({
        name: 'unique-items.constraint.models',
        version: '0.1.0'
      }),
      name: 'uniqueItems',
      value: value,
      expression: d => {
        if (!value) {
          return true
        }
        const valueSet = d.reduce((_obj, item) => {
          const itemKey = JSON.stringify(item)
          _obj[itemKey] = true
          return _obj
        }, {})
        return (d.length || d.size) === Object.keys(valueSet).length
      }
    }
    super(obj)
  }
}

/**
 * A MaximumProperties Constraint.
 * evaluate returns true if and only if the object to test has less properties than
 * the value passed to the constructor
 */
export class MaximumPropertiesConstraint extends Constraint {
  constructor(value) {
    const obj = {
      _model: new Model({
        name: 'maximum-properties.constraint.models',
        version: '0.1.0'
      }),
      name: 'maxProperties',
      value: value,
      expression: d => {
        if (typeof value === 'undefined' || value === null) {
          return true
        }
        return Object.keys(d).length <= value
      }
    }
    super(obj)
  }
}

/**
 * A MinimumProperties Constraint.
 * evaluate returns true if and only if the object to test has more properties than
 * the value passed to the constructor
 */
export class MinimumPropertiesConstraint extends Constraint {
  constructor(value = 0) {
    const obj = {
      _model: new Model({
        name: 'minimum-properties.constraint.models',
        version: '0.1.0'
      }),
      name: 'minProperties',
      value: value,
      expression: d => {
        return Object.keys(d).length >= value
      }
    }
    super(obj)
  }
}

/**
 * An Enum Constraint.
 * evaluate returns true if and only if the object to test is in
 * the list of values passed to the constructor
 */
export class EnumConstraint extends Constraint {
  constructor(value = []) {
    const obj = {
      _model: new Model({
        name: 'enum.constraint.models',
        version: '0.1.0'
      }),
      name: 'enum',
      value: value,
      expression: d => {
        return value.indexOf(d) >= 0
      }
    }
    super(obj)
  }
}

/**
 * A JSON Schema Constraint.
 * evaluate returns true. (Unimplemented)
 * TODO: implement evaluate
 */
export class JSONSchemaConstraint extends Constraint {
  constructor(value = {}) {
    const obj = {
      _model: new Model({
        name: 'json.constraint.models',
        version: '0.1.0'
      }),
      name: 'json',
      value: value,
      expression: () => {
        return true
      }
    }
    super(obj)
  }

  toJSONSchema() {
    return this.get('value')
  }
}

/**
 * An XML Schema Constraint.
 * evaluate returns true. (Unimplemented)
 * TODO: implement evaluate
 */
export class XMLSchemaConstraint extends Constraint {
  constructor(value = '') {
    const obj = {
      _model: new Model({
        name: 'xml.constraint.models',
        version: '0.1.0'
      }),
      name: 'xml',
      value: value,
      expression: () => {
        return true
      }
    }
    super(obj)
  }

  toJSONSchema() {
    return {
      'x-xml': this.get('value')
    }
  }
}

const _Constraint = {
  Constraint: Constraint,
  MultipleOf: MultipleOfConstraint,
  Maximum: MaximumConstraint,
  ExclusiveMaximum: ExclusiveMaximumConstraint,
  Minimum: MinimumConstraint,
  ExclusiveMinimum: ExclusiveMinimumConstraint,
  MaximumLength: MaximumLengthConstraint,
  MinimumLength: MinimumLengthConstraint,
  Pattern: PatternConstraint,
  MaximumItems: MaximumItemsConstraint,
  MinimumItems: MinimumItemsConstraint,
  UniqueItems: UniqueItemsConstraint,
  MaximumProperties: MaximumPropertiesConstraint,
  MinimumProperties: MinimumPropertiesConstraint,
  Enum: EnumConstraint,
  JSONSchema: JSONSchemaConstraint,
  XMLSchema: XMLSchemaConstraint
}

export default _Constraint
