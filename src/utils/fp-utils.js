export const currify = (uncurried, ...params) => {
  return (...otherParams) => {
    return uncurried.apply(null, params.concat(otherParams))
  }
}

export const keys = (obj = {}) => {
  if (typeof obj !== 'object') {
    return []
  }

  return Object.keys(obj)
}

export const values = (obj) => keys(obj).map(key => obj[key])

export const entries = (obj) => keys(obj).map(key => ({ key, value: obj[key] }))

export const convertEntryListInMap = (obj, { key, value } = {}) => {
  if (typeof key === 'undefined' && typeof value === 'undefined') {
    return obj
  }

  obj[key] = value
  return obj
}

export const flatten = (f, l) => [ ...f, ...l ]

export const __internals__ = { currify, keys, values, entries, convertEntryListInMap }
