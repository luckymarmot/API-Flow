export class Mock {
  constructor(obj, prefix = '$$_') {
    const spies = {}
    for (const field in obj) {
      if (
                obj.hasOwnProperty(field) &&
                typeof obj[field] === 'function'
            ) {
        spies[field] = {
          count: 0,
          calls: [],
          func: obj[field]
        }
      }
    }

    this[prefix + 'spy'] = spies

    const setupFuncSpy = (field) => {
      return (...args) => {
        this[prefix + 'spy'][field].count += 1
        this[prefix + 'spy'][field].calls.push(args)
        return this[prefix + 'spy'][field].func(...args)
      }
    }

    for (const field in obj) {
      if (obj.hasOwnProperty(field)) {
        if (typeof obj[field] === 'function') {
          this[field] = setupFuncSpy(field)
        }
        else {
          this[field] = obj[field]
        }
      }
    }

    this[prefix + 'spyOn'] = (field, func) => {
      this[prefix + 'spy'][field].func = func
      return this
    }

    this[prefix + 'getSpy'] = (field) => {
      return this[prefix + 'spy'][field]
    }
  }
}

export class ClassMock extends Mock {
  constructor(instance, prefix = '$$_') {
    const properties = Object.getOwnPropertyNames(
            Object.getPrototypeOf(instance)
        )

    const obj = {}
    for (const property of properties) {
      if (property !== 'constructor') {
        obj[property] = ::Object.getPrototypeOf(instance)[property]
      }
    }

    super(obj, prefix)
  }
}
