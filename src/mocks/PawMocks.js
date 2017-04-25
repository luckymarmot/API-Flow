/**
 * sets up a spy on functions of a object
 * @param {Object} $this: the object to add spies to
 * @param {string} field: the field for which to add a spy
 * @param {string} prefix: the prefix to use for the spy object
 * @returns {Function} a hook function that updates the state of the spy before calling the spied-on
 * function.
 */
const setupFuncSpy = ($this, field, prefix) => {
  return (...args) => {
    $this[prefix + 'spy'][field].count += 1
    $this[prefix + 'spy'][field].calls.push(args)
    return $this[prefix + 'spy'][field].func.apply($this, args)
  }
}

/**
 * creates a spies object that holds all the relevant information for a field
 * @param {Object} spies: the spies object to update
 * @param {Object} obj: the object to spy on
 * @returns {Object} the updated spies object
 */
const createSpies = (spies, obj) => {
  for (const field in obj) {
    if (obj.hasOwnProperty(field) && typeof obj[field] === 'function') {
      spies[field] = {
        count: 0,
        calls: [],
        func: obj[field]
      }
    }
  }

  return spies
}

/**
 * binds spies from an instance to an object methods
 * @param {Object} $this: the instance to which the spies should be bound
 * @param {Object} obj: the object to spy on
 * @param {string} prefix: the prefix to use for the spy methods and fields
 * @returns {void}
 */
const bindSpies = ($this, obj, prefix) => {
  for (const field in obj) {
    // TODO maybe go up the prototype chain to spoof not-owned properties
    if (obj.hasOwnProperty(field)) {
      if (typeof obj[field] === 'function') {
        $this[field] = setupFuncSpy($this, field, prefix)
      }
      else {
        $this[field] = obj[field]
      }
    }
  }
}

/**
 * @class Mock
 * @description wraps an arbitrary object and exposes spies on its methods.
 */
export class Mock {
  /**
   * creates a Mock instance based on an object
   * @constructor
   * @param {Object} obj: the object to spy on
   * @param {string} prefix: the prefix to use for the spy methods and fields.
   */
  constructor(obj, prefix = '$$_') {
    const spies = createSpies({}, obj)
    this[prefix + 'spy'] = spies

    bindSpies(this, obj, prefix)

    this[prefix + 'spyOn'] = (field, func) => {
      this[prefix + 'spy'][field].func = func
      return this
    }

    this[prefix + 'getSpy'] = (field) => {
      return this[prefix + 'spy'][field]
    }
  }
}

/**
 * @class ClassMock
 * @description wraps a class instance and exposes spies on its methods.
 */
export class ClassMock extends Mock {
  /**
   * creates a ClassMock instance based on a class instance
   * @constructor
   * @param {Object} instance: the class instance to spy on
   * @param {string} prefix: the prefix to use for the spy methods and fields.
   */
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

/**
 * @class PawContextMock
 * @description creates a mock of a Paw Context.
 */
export class PawContextMock extends Mock {
  /**
   * creates a fake Paw Context
   * @constructor
   * @param {Object} baseObj: a base object to use for the spies
   * @param {string} prefix: the prefix to use for the spy methods and fields
   */
  constructor(baseObj, prefix) {
    const obj = {
      getCurrentRequest: () => {},
      getRequestByName: () => {},
      getRequestGroupByName: () => {},
      getRootRequestTreeItems: () => {},
      getRootRequests: () => {},
      getAllRequests: () => {},
      getAllGroups: () => {},
      getEnvironmentDomainByName: () => {},
      getEnvironmentVariableByName: () => {},
      getRequestById: () => {},
      getRequestGroupById: () => {},
      getEnvironmentDomainById: () => {},
      getEnvironmentVariableById: () => {},
      getEnvironmentById: () => {},
      createRequest: () => {},
      createRequestGroup: () => {},
      createEnvironmentDomain: () => {}
    }
    Object.assign(obj, baseObj)
    super(obj, prefix)
  }
}

/**
 * @class PawContextMock
 * @description creates a mock of a Paw Request.
 */
export class PawRequestMock extends Mock {
  /**
   * creates a fake Paw Request
   * @constructor
   * @param {Object} baseObj: a base object to use for the spies
   * @param {string} prefix: the prefix to use for the spy methods and fields
   */
  constructor(baseObj, prefix) {
    const obj = {
      id: null,
      name: null,
      order: null,
      parent: null,
      url: null,
      method: null,
      headers: null,
      httpBasicAuth: null,
      oauth1: null,
      oauth2: null,
      body: null,
      urlEncodedBody: null,
      multipartBody: null,
      jsonBody: null,
      timeout: null,
      followRedirects: null,
      redirectAuthorization: null,
      redirectMethod: null,
      sendCookies: null,
      storeCookies: null,
      getUrl: () => {},
      getUrlBase: () => {},
      getUrlParams: () => {},
      getUrlParameters: () => {},
      getHeaders: () => {},
      getHeaderByName: () => {},
      setHeader: () => {},
      getHttpBasicAuth: () => {},
      getOAuth1: () => {},
      getOAuth2: () => {},
      getBody: () => {},
      getUrlEncodedBody: () => {},
      getMultipartBody: () => {},
      getLastExchange: () => {}
    }
    Object.assign(obj, baseObj)
    super(obj, prefix)
  }
}

/**
 * @class DynamicValue
 * @description creates a mock of a DynamicValue.
 */
export class DynamicValue extends Mock {
  /**
   * creates a fake DynamicValue
   * @constructor
   * @param {string} type: the type of the DynamicValue
   * @param {Object} baseObj: a base object to use for the spies
   * @param {string} prefix: the prefix to use for the spy methods and fields
   */
  constructor(type, baseObj, prefix = '$$_') {
    const obj = {
      type: type,
      toString: () => {},
      getEvaluatedString: () => {}
    }
    Object.assign(obj, baseObj)
    super(obj, prefix)
  }
}

/**
 * @class DynamicString
 * @description creates a mock of a DynamicString.
 */
export class DynamicString extends Mock {
  /**
   * creates a fake DynamicString
   * @constructor
   * @param {Array} items: the items in a DynamicString
   */
  constructor(...items) {
    const obj = {
      length: null,
      components: items,
      toString: () => {},
      getComponentAtIndex: () => {},
      getSimpleString: () => {},
      getOnlyString: () => {},
      getOnlyDynamicValue: () => {},
      getEvaluatedString: () => {},
      copy: () => {},
      appendString: () => {},
      appendDynamicValue: () => {},
      appendDynamicString: () => {}
    }
    super(obj, '$$_')
  }
}

/**
 * @class InputField
 * @description creates a mock of an InputField.
 */
export class InputField extends Mock {
  /**
   * creates a fake InputField
   * @constructor
   * @param {string} key: the key of an InputField
   * @param {string} name: the name of an InputField
   * @param {string} type: the type of an InputField
   * @param {Object} options: the options of an InputField
   * @param {string} prefix: the prefix to use for the spy methods and fields
   */
  constructor(key, name, type, options, prefix = '') {
    const obj = {
      key: key,
      name: name,
      type: type,
      options: options
    }
    super(obj, prefix)
  }
}

/**
 * @class NetworkHTTPRequest
 * @description creates a mock of a NetworkHTTPRequest.
 */
export class NetworkHTTPRequest extends Mock {
  /**
   * creates a fake InputField
   * @constructor
   * @param {string} prefix: the prefix to use for the spy methods and fields
   */
  constructor(prefix = '') {
    const obj = {
      requestUrl: null,
      requestMethod: null,
      requestTimeout: null,
      requestBody: null,
      responseStatusCode: null,
      responseHeaders: null,
      responseBody: null,
      setRequestHeader: () => {},
      getRequestHeader: () => {},
      getResponseHeader: () => {},
      send: () => {}
    }
    super(obj, prefix)
  }
}

/**
 * @class RecordParameter
 * @description creates a mock of a RecordParameter.
 */
export class RecordParameter extends Mock {
  /**
   * creates a fake RecordParameter
   * @constructor
   * @param {string} key: the key of an RecordParameter
   * @param {string} value: the value of an RecordParameter
   * @param {boolean?} enabled: whether a RecordParameter is enabled
   * @param {string} prefix: the prefix to use for the spy methods and fields
   */
  constructor(key, value, enabled, prefix = '') {
    const obj = {
      key, value, enabled,
      toString: () => {}
    }

    super(obj, prefix)
  }
}

/**
 * a simple mock around a class that does nothing
 * @param {Object} _class: the class to wrap with nothing
 * @returns {Object} the same _class, with nothing changed
 */
export const registerImporter = (_class) => {
  return _class
}

/**
 * a simple mock around a class that does nothing
 * @param {Object} _class: the class to wrap with nothing
 * @returns {Object} the same _class, with nothing changed
 */
export const registerCodeGenerator = (_class) => {
  return _class
}
