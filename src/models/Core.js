import Immutable from 'immutable'
import jsf from 'json-schema-faker'

import { Info } from './Utils'
import Reference from './references/Reference'

export class Parameter extends Immutable.Record({
    key: null,
    value: null,
    type: null,
    format: null,
    name: null,
    required: false,
    description: null,
    example: null,
    internals: Immutable.List(),
    externals: Immutable.List()
}) {
    getJSONSchema(useFaker = true, replaceRefs = true) {
        let type = this.get('type')
        let format = this.get('format')

        let types = [
            'integer', 'number', 'array', 'string', 'object', 'boolean', 'null'
        ]

        if (types.indexOf(type) === -1) {
            type = this._inferType(type)
        }

        let constraintSet = this.get('internals').reduce((set, constraint) => {
            let obj = constraint.toJS()
            Object.assign(set, obj)
            return set
        }, {
            type: type
        })

        let valueIsValid = true

        if (format === 'sequence') {
            let sequence = this.get('value')
            constraintSet['x-sequence'] = sequence.map(param => {
                let schema = param.getJSONSchema(useFaker)
                return schema
            })
            valueIsValid = false
        }

        if (type === 'array') {
            let items = this.get('value')
            if (items instanceof Parameter) {
                constraintSet.items = items.getJSONSchema()
            }
            valueIsValid = false
        }

        if (type === 'reference') {
            let ref = this.get('value')
            if (ref instanceof Reference) {
                delete constraintSet.type
                if (typeof ref.get('value') === 'string') {
                    constraintSet.$ref = ref.get('value')
                }
                else if (
                    ref.get('value') &&
                    typeof ref.get('value') === 'object'
                ) {
                    Object.assign(constraintSet, ref.get('value'))
                }
                else {
                    constraintSet.$ref =
                        ref.get('relative') ||
                        ref.get('uri')
                }
            }
            valueIsValid = false
        }

        if (this.get('key')) {
            constraintSet['x-title'] = this.get('key')
        }

        if (this.get('value') && valueIsValid) {
            constraintSet.default = this.get('value')
        }

        const fakerFormatMap = {
            email: {
                faker: 'internet.email'
            },
            // base64 endoded
            byte: {
                pattern: '^(?:[A-Za-z0-9+/]{4})*' +
                         '(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$'
            },
            // not really binary but who cares
            binary: {
                pattern: '^.*$'
            },
            'date-time': {
                faker: 'date.recent'
            },
            password: {
                pattern: '^.*$'
            },
            sequence: {
                format: 'sequence'
            }
        }

        if (useFaker && fakerFormatMap[format]) {
            let constraint = fakerFormatMap[format]
            Object.assign(constraintSet, constraint)
        }

        if (replaceRefs) {
            constraintSet = this._replaceRefs(constraintSet)
        }
        else {
            constraintSet = this._simplifyRefs(constraintSet)
        }

        return constraintSet
    }

    generate(useDefault, _constraintSet) {
        if (useDefault && this.get('value') !== null) {
            return this.get('value')
        }

        let constraintSet = _constraintSet
        if (!_constraintSet) {
            constraintSet = this.getJSONSchema()
        }
        constraintSet = JSON.parse(JSON.stringify(constraintSet))

        constraintSet = this._replaceRefs(constraintSet)

        jsf.format('sequence', function(gen, schema) {
            let result = ''
            for (let item of schema['x-sequence']) {
                result += jsf(item)
            }
            return result
        })

        if (constraintSet.default) {
            constraintSet.enum = [ constraintSet.default ]
        }

        let generated = jsf(constraintSet)
        return generated
    }

    _inferType(type) {
        if (!type) {
            return null
        }

        if (type.match(/double/) || type.match(/float/)) {
            return 'number'
        }

        if (type.match(/date/)) {
            return 'string'
        }

        return type
    }

    _replaceRefs(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return obj
        }

        if (obj.$ref) {
            if (obj.$ref instanceof Reference) {
                obj.$ref = obj.$ref.get('relative') || obj.$ref.get('uri')
            }

            obj.default = this
              ._unescapeURIFragment(obj.$ref.split('/').slice(-1)[0])
            obj.type = 'string'
            delete obj.$ref
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
                    obj[key] = ::this._replaceRefs(obj[key])
                }
            }
        }

        return obj
    }

    _simplifyRefs(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return obj
        }

        if (obj.$ref instanceof Reference) {
            obj.$ref = obj.$ref.get('relative') || obj.$ref.get('uri')
        }

        if (Array.isArray(obj)) {
            for (let i = 0; i < obj.length; i += 1) {
                let content = obj[i]
                obj[i] = this._simplifyRefs(content)
            }
        }
        else {
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    obj[key] = ::this._simplifyRefs(obj[key])
                }
            }
        }

        return obj
    }

    _unescapeURIFragment(uriFragment) {
        return uriFragment.replace(/~1/g, '/').replace(/~0/g, '~')
    }

    validate(value) {
        return this.get('internals').reduce((bool, cond) => {
            return bool && cond.evaluate(value)
        }, true)
    }

    isValid(param) {
        let list = this.get('externals')

        // No external constraint
        if (list.size === 0) {
            return true
        }

        return list.reduce((bool, _param) => {
            // && has precedence on ||
            return bool ||
                _param.get('key') === param.get('key') &&
                _param.validate(param.get('value'))
        }, false)
    }
}

export class ParameterContainer extends Immutable.Record({
    headers: Immutable.List(),
    queries: Immutable.List(),
    body: Immutable.List(),
    path: Immutable.List()
}) {
    getHeadersSet() {
        let headers = this.get('headers')
        let _set = headers.reduce((set, param) => {
            set[param.get('key')] = param
            return set
        }, {})
        return new Immutable.OrderedMap(_set)
    }

    // TODO support uriEncoding
    getUrlParams() {
        let queries = this.get('queries')
        if (typeof queries === 'undefined' || queries === null) {
            return '?'
        }

        if (queries.size > 0) {
            let _query = queries.reduce((query, param) => {
                let fragment = param.get('key')
                if (param.get('value') !== null) {
                    fragment += '=' + param.get('value')
                }
                return query + fragment
            }, '?')
            return _query
        }
        return
    }

    getBody() {
        return
    }

    filter(paramList) {
        if (!paramList) {
            return this
        }

        let headers = this.get('headers')
        let queries = this.get('queries')
        let body = this.get('body')
        let path = this.get('path')

        paramList.forEach(param => {
            headers = headers.filter(d => {
                return d.isValid(param)
            })
            queries = queries.filter(d => {
                return d.isValid(param)
            })
            body = body.filter(d => {
                return d.isValid(param)
            })
            path = path.filter(d => {
                return d.isValid(param)
            })
        })
        return this.withMutations(container => {
            container
                .set('headers', headers)
                .set('queries', queries)
                .set('body', body)
                .set('path', path)
        })
    }
}

export class Body extends Immutable.Record({
    constraints: Immutable.List(),
    type: null
}) {
    filter(paramContainer) {
        if (paramContainer instanceof ParameterContainer) {
            return paramContainer.filter(this.get('constraints'))
        }
    }
}

export class Response extends Immutable.Record({
    code: null,
    description: null,
    examples: null,
    parameters: new ParameterContainer(),
    bodies: Immutable.List()
}) { }


export default class Context extends Immutable.Record({
    group: null,
    references: new Immutable.OrderedMap(),
    info: new Info()
}) {
    getRequests() {
        if (!this.get('group')) {
            return Immutable.List()
        }
        return this.get('group').getRequests()
    }

    mergeEnvironments(environments) {
        let localEnvs = this.get('environments')

        if (!localEnvs) {
            return this.set('environments', environments)
        }

        let envs = environments
        localEnvs.forEach((env) => {
            let localEnv = env
            let merged = false
            environments.forEach((_env) => {
                if (localEnv.get('id') === _env.get('id')) {
                    localEnv = localEnv.mergeDeep(_env)
                    merged = true
                }
            })

            if (!merged) {
                envs = envs.push(env)
            }
        })

        return this.set('environments', envs)
    }

    mergeGroup(group) {
        let localGroup = this.get('group')
        localGroup = localGroup.mergeWithGroup(group)
        return this.set('group', localGroup)
    }
}
