import Immutable from 'immutable'

import Model from './ModelInfo'

export class Constraint extends Immutable.Record({
  _model: new Model({
    name: 'constraint.constraint.models',
    version: '0.1.0'
  }),
  name: null,
  value: null,
  expression: () => { return false }
}) {
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
  Enum: EnumConstraint
}

export default _Constraint
