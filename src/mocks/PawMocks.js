const setupFuncSpy = ($this, field, prefix) => {
  return (...args) => {
    $this[prefix + 'spy'][field].count += 1
    $this[prefix + 'spy'][field].calls.push(args)
    return $this[prefix + 'spy'][field].func.apply($this, args)
  }
}

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

export class Mock {
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

export class PawContextMock extends Mock {
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

export class PawRequestMock extends Mock {
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

export class DynamicValue extends Mock {
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

export class DynamicString extends Mock {
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

export class InputField extends Mock {
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

export class NetworkHTTPRequest extends Mock {
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

export class RecordParameter extends Mock {
  constructor(key, value, enabled, prefix = '') {
    const obj = {
      key, value, enabled,
      toString: () => {}
    }

    super(obj, prefix)
  }
}

export const registerImporter = (_class) => {
  return _class
}

export const registerCodeGenerator = (_class) => {
  return _class
}
