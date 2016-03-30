import Immutable from 'immutable'

import {
    BasicAuth,
    DigestAuth,
    NTLMAuth,
    NegotiateAuth,
    ApiKeyAuth,
    OAuth1Auth,
    OAuth2Auth
} from './Auth'

export class FileReference extends Immutable.Record({
    filepath: null,
    convert: null
}) { }

export class KeyValue extends Immutable.Record({
    key: null,
    value: null,
    valueType: null
}) { }

export class SchemaReference extends Immutable.Record({
    reference: null,
    resolved: false,
    value: null
}) {
    _escapeURIFragment(uriFragment) {
        return uriFragment.replace('~', '~0').replace('/', '~1')
    }

    _unescapeURIFragment(uriFragment) {
        return uriFragment.replace('~1', '/').replace('~0', '~')
    }

    /*
        resolve assumes locally defined schemas.
        uri should respect the following format:
            #/some/path/to/definition
    */
    resolve(schema) {
        let path = this.get('reference').split('/').map(fragment => {
            return this._unescapeURIFragment(fragment)
        }).slice(1)

        let resolved = schema.getInSchema(path)
        return this
            .set('resolved', true)
            .set('value', resolved)
    }

    getResolvedSchema() {
        return this.get('value')
    }

    setResolvedSchema(schema) {
        return this.set('value', schema)
    }
}

export class Schema extends Immutable.Record({
    uri: '#',
    value: null,
    map: null
}) {

    /*
        [RFC:](http://tools.ietf.org/html/draft-ietf-appsawg-json-pointer-07)
        The RFC specifies that '/' have to be replaced by '~1', and therefore
        '~' has to be replaced by '~0'.

        This RFC is referenced by the version of the RFC draft of JSON Schema
        [JSON Schema RFC:](https://tools.ietf.org/html/draft-zyp-json-schema-04)
    */
    _escapeURIFragment(uriFragment) {
        return uriFragment.replace('~', '~0').replace('/', '~1')
    }

    _unescapeURIFragment(uriFragment) {
        return uriFragment.replace('~1', '/').replace('~0', '~')
    }

    mergeSchema(schema) {
        let mergedSchema = this.get('map') || Immutable.OrderedMap()
        if (typeof schema === 'object') {
            for (let prop in schema) {
                if (schema.hasOwnProperty(prop)) {
                    if (prop === '$ref') {
                        // TODO update schema
                        let schemaReference = new SchemaReference({
                            reference: schema[prop]
                        })
                        mergedSchema = mergedSchema.set(prop, schemaReference)
                    }
                    else {
                        let subSchema = new Schema()
                        let uri = this.get('uri') + '/' +
                            this._escapeURIFragment(prop)
                        subSchema = subSchema
                            .set('uri', uri)
                            .mergeSchema(schema[prop])
                        mergedSchema = mergedSchema.set(prop, subSchema)
                    }
                }
            }
            return this.set('map', mergedSchema)
        }
        else {
            return this.set('value', schema)
        }
    }

    resolveReferences(depth = 0, baseSchema = this) {
        if (this.get('value')) {
            return this
        }

        let subSchema = this.get('map') || Immutable.OrderedMap()
        let auxSchema = Immutable.OrderedMap()
        subSchema.forEach((value, key) => {
            let _value = value
            if (_value instanceof SchemaReference) {
                _value = _value.resolve(baseSchema)
                if (depth > 0) {
                    let schema = _value.getResolvedSchema()
                        .resolveReferences(depth - 1, baseSchema)
                    _value = _value.setResolvedSchema(schema)
                }
            }
            else {
                _value = _value.resolveReferences(depth, baseSchema)
            }
            auxSchema = auxSchema.set(key, _value)
        })

        return this.set('map', auxSchema)
    }

    getInSchema(array, notSetValue) {
        let path = array.reduce((_path, elt) => {
            return _path.concat([ 'map', elt ])
        }, [])
        return this.getIn(path, notSetValue)
    }
}

export default class RequestContext extends Immutable.Record({
    schema: null,
    group: null
}) { }

export class Response extends Immutable.Record({
    code: null,
    description: null,
    schema: null,
    headers: Immutable.OrderedMap()
}) { }

export class Request extends Immutable.Record({
    name: null,
    description: null,
    url: null,
    method: null,
    headers: Immutable.OrderedMap(),
    bodyType: null,
    bodyString: null,
    body: null,
    auth: null,
    responses: Immutable.List(),
    timeout: null
}) {

    setAuthType(authType, params) {
        const authMethods = {
            basic: BasicAuth,
            digest: DigestAuth,
            ntlm: NTLMAuth,
            negotiate: NegotiateAuth,
            apiKey: ApiKeyAuth,
            oauth1: OAuth1Auth,
            oauth2: OAuth2Auth
        }

        let auth = this.get('auth')

        if (!authMethods[authType]) {
            throw new Error('Unsupported Authentication Method : ' + authType)
        }

        auth = new authMethods[authType](params)
        return this.set('auth', auth)
    }

    setAuthParams(authParams) {
        let auth = this.get('auth')

        // If AuthType was not set beforehand, assume BasicAuth
        if (auth === null) {
            auth = new BasicAuth()
        }

        auth = auth.merge(authParams)
        return this.set('auth', auth)
    }
}

export class Group extends Immutable.Record({
    name: null,
    children: Immutable.OrderedMap()
}) { }
