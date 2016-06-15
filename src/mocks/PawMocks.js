export class Mock {
    constructor(obj, prefix = '$$_') {
        let spies = {}
        for (let field in obj) {
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
                return this[prefix + 'spy'][field].func.apply(this, args)
            }
        }

        for (let field in obj) {
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
        let properties = Object.getOwnPropertyNames(
            Object.getPrototypeOf(instance)
        )

        let obj = {}
        for (let property of properties) {
            if (property !== 'constructor') {
                obj[property] = ::Object.getPrototypeOf(instance)[property]
            }
        }

        super(obj, prefix)
    }
}

export class PawContextMock extends Mock {
    constructor(baseObj, prefix) {
        let obj = {
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
        let obj = {
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
        let obj = {
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
        let obj = {
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

export const registerImporter = (_class) => {
    return _class
}

export const registerCodeGenerator = (_class) => {
    return _class
}
