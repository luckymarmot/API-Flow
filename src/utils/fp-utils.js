/**
 * currifies a function with a partial list of arguments
 * @param {Function} uncurried: the function to currify
 * @param {Array<any>} params: a partial list of parameters to use with this function
 * @returns {Function} the currified function
 */
export const currify = (uncurried, ...params) => {
  return (...otherParams) => {
    return uncurried.apply(null, params.concat(otherParams))
  }
}

/**
 * extracts the keys from an object
 * @param {Object|any?} obj: the object to get the keys from
 * @returns {Array<string>} the corresponding keys
 */
export const keys = (obj = {}) => {
  if (typeof obj !== 'object') {
    return []
  }

  return Object.keys(obj)
}

/**
 * extracts the values from an object
 * @param {Object|any?} obj: the object to get the values from
 * @returns {Array<*>} the corresponding values
 */
export const values = (obj) => keys(obj).map(key => obj[key])

/**
 * extracts the key-value pairs from an object
 * @param {Object|any?} obj: the object to get the entries from
 * @returns {Array<{key: string, value: *}>} the corresponding entries
 */
export const entries = (obj) => keys(obj).map(key => ({ key, value: obj[key] }))

/**
 * converts an array of key-value pairs into an Object (as a reducer)
 * @param {Object} obj: the object to update with a new key-value pair
 * @param {Entry} entry: the entry to insert in the object
 * @returns {Object} the updated object
 */
export const convertEntryListInMap = (obj, { key, value } = {}) => {
  if (typeof key === 'undefined' && typeof value === 'undefined') {
    return obj
  }

  obj[key] = value
  return obj
}

/**
 * flattens an array of array into an array (as a reducer)
 * @param {Array<*>} f: the flat list to update with new elements
 * @param {Array<*>} l: the list to append to the flat list
 * @returns {Array<*>} the updated flat list
 */
export const flatten = (f, l) => [ ...f, ...l ]

export const __internals__ = { currify, keys, values, entries, convertEntryListInMap }
