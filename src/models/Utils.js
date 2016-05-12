import Immutable from 'immutable'

import { Request } from './Core'

export class URL extends Immutable.Record({
    schemes: null,
    host: null,
    path: null
}) {
    getUrl(scheme) {
        let _scheme
        if (
            scheme &&
            this.get('schemes') &&
            this.get('schemes').indexOf(scheme) >= 0
        ) {
            _scheme = scheme
        }
        else {
            _scheme = (this.get('schemes') || [ 'http' ])[0]
        }

        return _scheme + '://' + this.get('host') + this.get('path')
    }

    decomposeUrl(url) {
        let fragments = url.match(/((.*):\/\/)?([^\/]*)(.*)/)
        if (!fragments) {
            const msg = 'failed to decompose ' + url + 'as a url'
            throw new Error(msg)
        }

        // no scheme provided
        if (fragments.length < 3) {
            fragments.unshift('')
        }
        else {
            fragments.shift()
        }

        // clarity
        let [ scheme, host, path ] = fragments
        return [ scheme, host, path ]
    }
}

export class Info extends Immutable.Record({
    title: null,
    description: null,
    tos: null,
    contact: null,
    license: null,
    version: null
}) { }

export class Contact extends Immutable.Record({
    name: null,
    url: null,
    email: null
}) { }

export class License extends Immutable.Record({
    name: null,
    url: null
}) { }

export class ReferenceContainer extends Immutable.Record({
    references: new Immutable.OrderedMap()
}) {
    resolve(referenceURI) {
        let ref = this.get(referenceURI)
        if (ref) {
            return ref.resolve(this)
        }
    }
}

export class Reference extends Immutable.Record({
    reference: null,
    resolved: false,
    value: null
}) {
    resolve() {
        let msg =
            'Reference is an abstract class - ' +
            'Please extend it before using it.'
        throw new Error(msg)
    }
}

export class SchemaReference extends Reference {
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
        if (!schema) {
            return this
        }

        let path = this.get('reference').split('/').map(fragment => {
            return this._unescapeURIFragment(fragment)
        }).slice(1)

        let resolved = schema.getInSchema(path)

        if (!resolved) {
            return this
        }
        return this
            .set('resolved', true)
            .set('value', resolved)
    }

    toJS() {
        if (!this.get('resolved')) {
            return this.get('reference')
        }
        return this.get('value').toJS()
    }
}

export class Schema extends Immutable.Record({
    uri: '#',
    value: null,
    map: null,
    raw: null
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
        let mergedSchema = this.get('map')
        if (typeof schema === 'object') {
            if (
                (
                    !mergedSchema ||
                    mergedSchema instanceof Immutable.List
                ) && (
                    Array.isArray(schema) ||
                    schema instanceof Immutable.List
                )
            ) {
                mergedSchema = mergedSchema || new Immutable.List()
                let index = 0
                for (let prop of schema) {
                    let subSchema = new Schema()
                    let uri = this.get('uri') + '/' + index
                    subSchema = subSchema
                        .set('uri', uri)
                        .mergeSchema(prop)
                    mergedSchema = mergedSchema.push(subSchema)
                }
            }
            else {
                mergedSchema = this.get('map') || new Immutable.OrderedMap()
                for (let prop of Object.keys(schema)) {
                    if (prop === '$ref') {
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

    resolve(depth = 0, baseSchema = this) {
        if (this.get('raw')) {
            return this
        }

        if (this.get('value')) {
            return this
        }

        let subSchema = this.get('map') || new Immutable.OrderedMap()
        let auxSchema
        if (subSchema instanceof Immutable.List) {
            auxSchema = new Immutable.List()
        }
        else {
            auxSchema = new Immutable.OrderedMap()
        }
        subSchema.forEach((value, key) => {
            let _value = value
            if (_value instanceof SchemaReference) {
                _value = _value.resolve(baseSchema)
                if (
                    !Immutable.is(
                        Immutable.fromJS(_value),
                        Immutable.fromJS(value)
                    ) &&
                    depth > 0
                ) {
                    let schema = _value.getResolvedSchema()
                        .resolve(depth - 1, baseSchema)
                    _value = _value.setResolvedSchema(schema)
                }
            }
            else {
                _value = _value.resolve(depth, baseSchema)
            }
            if (auxSchema instanceof Immutable.List) {
                auxSchema = auxSchema.push(_value)
            }
            else {
                auxSchema = auxSchema.set(key, _value)
            }
        })

        return this.set('map', auxSchema)
    }

    getInSchema(array, notSetValue) {
        let path = array.reduce((_path, elt) => {
            return _path.concat([ 'map', elt ])
        }, [])
        return this.getIn(path, notSetValue)
    }

    toJS() {
        if (this.get('raw')) {
            return this.get('raw')
        }
        if (this.get('value')) {
            return this.get('value')
        }

        let subSchema = this.get('map') || Immutable.OrderedMap()
        return subSchema.toJS()
    }
}

export class FileReference extends Reference {
    resolve(fileReader) {
        if (!fileReader) {
            return this
        }
        return fileReader.read(this.get('reference'))
    }
}

export class JSONReference extends Reference {
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
        if (!schema) {
            return this
        }

        let path = this.get('reference').split('/').map(fragment => {
            return this._unescapeURIFragment(fragment)
        }).slice(1)

        let resolved
        if (schema instanceof Schema) {
            resolved = schema.getInSchema(path)
        }
        else if (
            schema instanceof Immutable.Record ||
            schema instanceof Immutable.Iterable
        ) {
            resolved = resolved.getIn(path)
        }
        else if (typeof schema === 'object') {
            resolved = path.reduce((resolution, fragment) => {
                if (typeof resolution === 'undefined') {
                    return resolution
                }
                return resolution[fragment]
            }, schema)
        }


        if (!resolved) {
            return this
        }
        return this
            .set('resolved', true)
            .set('value', resolved)
    }
}

export class RemoteReference extends Reference {
    resolve(ajax) {
        if (!ajax) {
            return this
        }
        return ajax.get(this.get('reference'))
    }
}

export class URIReference extends Reference {
    resolve() {
        return this
    }
}

export class Group extends Immutable.Record({
    id: null,
    name: null,
    children: Immutable.OrderedMap()
}) {
    getRequests() {
        let children = this.get('children')

        let reqs = new Immutable.List()

        children.forEach(child => {
            if (child instanceof Request) {
                reqs = reqs.push(child)
            }
            else {
                reqs = reqs.concat(child.getRequests())
            }
        })

        return reqs
    }

    mergeWithGroup(group) {
        let child = this.getIn([ 'children', group.get('name') ])
        if (child) {
            child = child.mergeDeep(group)
        }
        else {
            child = group
        }
        return this.setIn([ 'children', group.get('name') ], child)
    }
}

export class Environment extends Immutable.Record({
    id: null,
    name: null,
    variables: Immutable.OrderedMap()
}) { }

// TODO change referenceName to a more suited name, like components
export class EnvironmentReference extends Immutable.Record({
    environmentName: null,
    referenceName: Immutable.List()
}) { }
