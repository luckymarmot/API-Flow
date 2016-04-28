import Immutable from 'immutable'

export class Constraint extends Immutable.Record({
    name: null,
    value: null,
    expression: () => { return false }
}) {
    evaluate(d) {
        return this.get('expression')(d)
    }

    toJS() {
        let obj = {}
        let key = this.get('name')
        let value = this.get('value')
        obj[key] = value
        return obj
    }
}

export class MultipleOfConstraint extends Constraint {
    constructor(value) {
        let obj = {
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
        let obj = {
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
        let obj = {
            name: 'exclusiveMaximum',
            value: value,
            expression: d => {
                return d < value
            }
        }
        super(obj)
    }

    toJS() {
        let obj = {}
        let key = this.get('name')
        let value = this.get('value')
        obj.maximum = value
        obj[key] = true
        return obj
    }
}

export class MinimumConstraint extends Constraint {
    constructor(value) {
        let obj = {
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
        let obj = {
            name: 'exclusiveMinimum',
            value: value,
            expression: d => {
                return d > value
            }
        }
        super(obj)
    }

    toJS() {
        let obj = {}
        let key = this.get('name')
        let value = this.get('value')
        obj.minimum = value
        obj[key] = true
        return obj
    }
}

export class MaximumLengthConstraint extends Constraint {
    constructor(value) {
        let obj = {
            name: 'maximumLength',
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
        let obj = {
            name: 'minimumLength',
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
        let obj = {
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
        let obj = {
            name: 'maximumItems',
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
        let obj = {
            name: 'maximumItems',
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
        let obj = {
            name: 'uniqueItems',
            value: value,
            expression: d => {
                if (!value) {
                    return true
                }
                let valueSet = d.reduce((_obj, item) => {
                    let itemKey = JSON.stringify(item)
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
        let obj = {
            name: 'maximumProperties',
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
        let obj = {
            name: 'minimumProperties',
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
        let obj = {
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
