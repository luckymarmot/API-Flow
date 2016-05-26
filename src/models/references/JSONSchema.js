import Immutable from 'immutable'
import yaml from 'js-yaml'

import Reference from './Reference'
import URL from '../URL'

export default class JSONSchemaReference extends Reference {
    resolve(string) {
        let obj
        try {
            obj = JSON.parse(string)
        }
        catch (jsonParseError) {
            try {
                obj = yaml.safeLoad(string)
            }
            catch (yamlParseError) {
                return this
                    .set('dependencies', new Immutable.List())
                    .set('resolved', true)
                    .set('raw', string)
            }
        }

        let value
        let uri = this.get('uri') || ''
        let match = uri.match(/([^#]*)(#.*)/)
        if (!match) {
            value = obj
        }
        else {
            let fragmentPath = match[2]
            value = this._extractSubTree(obj, fragmentPath)
            if (value === null) {
                return this
                    .set('dependencies', new Immutable.List())
                    .set('resolved', true)
                    .set('raw', string)
            }
        }

        let dependencies = this._findRefs(value)
        value = this._replaceRefs(value)

        return this
            .set('resolved', true)
            .set('value', value)
            .set('dependencies', dependencies)
    }

    /*
        evaluate uses references only for resolution of refs
        present in the value of the base reference. It does not
        resolve the current uri against the reference container.
    */
    evaluate(references, depth = 0) {
        let value = this.get('value')
        let newValue = ::this._resolveRefs(references, value, depth)
        // deep copy to avoid circular references
        return this.set('value', Immutable.fromJS(newValue).toJS())
    }

    getDataUri() {
        let uri = this.get('uri')
        let match = uri.match(/^([^#]*)(#.*)/)

        if (!match) {
            return uri
        }
        else {
            return match[1]
        }
    }

    _unescapeURIFragment(uriFragment) {
        return uriFragment.replace('~1', '/').replace('~0', '~')
    }

    _extractSubTree(obj, ref) {
        let path = ref.split('/').slice(1).map((d) => {
            return this._unescapeURIFragment(d)
        })

        let subTree = obj
        for (let key of path) {
            subTree = subTree[key]
            if (typeof subTree === 'undefined') {
                return null
            }
        }

        return subTree
    }

    _resolveRefs(references, obj, depth = 0) {
        if (typeof obj !== 'object' || depth === 0) {
            return obj
        }

        if (Array.isArray(obj)) {
            for (let i = 0; i < obj.length; i += 1) {
                let content = obj[i]
                obj[i] = this._resolveRefs(references, content, depth)
            }
        }
        else {
            for (let key of Object.keys(obj)) {
                if (
                    key === '$ref' &&
                    obj.$ref instanceof Reference
                ) {
                    let reference = references.resolve(
                        obj.$ref.get('uri'), depth - 1
                    )
                    if (reference !== null && reference.get('value')) {
                        obj.$ref = reference.get('value')
                    }
                }
                else {
                    obj[key] = this._resolveRefs(references, obj[key], depth)
                }
            }
        }
        return obj
    }

    _findRefs(obj) {
        let refs = new Immutable.List()
        if (typeof obj !== 'object') {
            return refs
        }

        if (Array.isArray(obj)) {
            for (let i = 0; i < obj.length; i += 1) {
                let content = obj[i]
                refs = refs.concat(this._findRefs(content))
            }
        }
        else {
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (key === '$ref') {
                        let uri = this.get('uri')
                        let reference = new JSONSchemaReference({
                            uri: (new URL(obj.$ref, uri)).href(),
                            relative: obj.$ref
                        })
                        refs = refs.push(reference)
                    }
                    else {
                        refs = refs.concat(this._findRefs(obj[key]))
                    }
                }
            }
        }
        return refs
    }

    _replaceRefs(obj) {
        if (typeof obj !== 'object') {
            return obj
        }

        if (Array.isArray(obj)) {
            for (let i = 0; i < obj.length; i += 1) {
                let content = obj[i]
                obj[i] = this._replaceRefs(content)
            }
        }
        else {
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (key === '$ref') {
                        let uri = this.get('uri')
                        let reference = new JSONSchemaReference({
                            uri: (new URL(obj.$ref, uri)).href()
                        })
                        obj.$ref = reference
                    }
                    else {
                        obj[key] = ::this._replaceRefs(obj[key])
                    }
                }
            }
        }

        return obj
    }
}
