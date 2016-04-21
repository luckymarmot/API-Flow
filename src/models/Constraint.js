import Immutable from 'immutable'

export class Constraint extends Immutable.Record({
    name: null,
    expression: () => { return false }
}) {
    evaluate(d) {
        return this.get('expression')(d)
    }
}

export class MultipleOfConstraint extends Constraint {
    constructor(value) {
        let obj = {
            name: 'multipleOf',
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
            expression: d => {
                return d < value
            }
        }
        super(obj)
    }
}

export class MinimumConstraint extends Constraint {
    constructor(value) {
        let obj = {
            name: 'minimum',
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
            expression: d => {
                return d > value
            }
        }
        super(obj)
    }
}

export class MaximumLengthConstraint extends Constraint {
    constructor(value) {
        let obj = {
            name: 'maximumLength',
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
