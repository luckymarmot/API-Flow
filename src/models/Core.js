// @flow
import { List, OrderedMap, Record } from 'immutable'
import jsf from 'json-schema-faker'

import Model from './ModelInfo'
import { Info } from './Utils'
import Reference from './references/Reference'

import type { SchemaType } from './Utils'
import type { Constraint } from './Constraint'

export type ParameterType = {
  _model: Model,
  key: ?string,
  value: ?any,
  type: ?string,
  format: ?string,
  required: boolean,
  description: ?string,
  example: ?(List<*>),
  internals: List<Constraint>,
  externals: List<*>
};

const ParameterSpec: ParameterType = {
    _model: new Model({
        name: 'parameter.core.models',
        version: '0.1.0'
    }),
    key: null,
    value: null,
    type: null,
    format: null,
    name: null,
    required: false,
    description: null,
    example: null,
    internals: List(),
    externals: List()
}

export class Parameter extends Record(ParameterSpec) {
    getJSONSchema(
        useFaker: boolean = true,
        replaceRefs: boolean = true
    ): SchemaType {
        let type: string = this.get('type') || ''
        let format: string = this.get('format') || ''

        let types: Array<string> = [
            'integer', 'number', 'array', 'string', 'object', 'boolean', 'null'
        ]

        if (types.indexOf(type) === -1) {
            type = this._inferType(type)
        }

        let constraintSet: SchemaType = this.get('internals').reduce((
            set: SchemaType,
            constraint: Constraint
        ): SchemaType => {
            let obj = constraint.toJSONSchema()
            Object.assign(set, obj)
            return set
        }, {
            type: type
        })

        let valueIsValid = true

        if (format === 'sequence') {
            let sequence = this.get('value')
            constraintSet['x-sequence'] = sequence.map((
                param: Parameter
            ): SchemaType => {
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
                    constraintSet.type = 'string'
                    constraintSet.default = ref.get('value')
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

    generate(
        useDefault: boolean,
        _constraintSet: SchemaType
    ): ?any {
        if (useDefault && this.get('value') !== null) {
            return this.get('value')
        }

        let constraintSet = _constraintSet
        if (!_constraintSet) {
            constraintSet = this.getJSONSchema()
        }
        constraintSet = JSON.parse(JSON.stringify(constraintSet))

        constraintSet = this._replaceRefs(constraintSet)

        if (
            constraintSet.type === 'string' &&
            constraintSet.format !== 'sequence' &&
            !constraintSet.faker &&
            !constraintSet['x-faker']
        ) {
            constraintSet['x-faker'] = 'company.bsNoun'
        }

        jsf.format('sequence', (gen: any, schema: SchemaType): any => {
            let result = ''
            for (let item of schema['x-sequence']) {
                if (
                    item.type === 'string' &&
                    item.format !== 'sequence' &&
                    !item.faker &&
                    !item['x-faker']
                ) {
                    item['x-faker'] = 'company.bsNoun'
                }
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

    _inferType(type: string): string {
        if (type.match(/double/) || type.match(/float/)) {
            return 'number'
        }

        if (type.match(/date/)) {
            return 'string'
        }

        return type
    }

    _replaceRefs(obj: any): any {
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
                    obj[key] = this._replaceRefs.call(this, obj[key])
                }
            }
        }

        return obj
    }

    _simplifyRefs(obj: any): any {
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
                    obj[key] = this._simplifyRefs.call(this, obj[key])
                }
            }
        }

        return obj
    }

    _unescapeURIFragment(uriFragment: string): string {
        return uriFragment.replace(/~1/g, '/').replace(/~0/g, '~')
    }

    validate(value: ?any): boolean {
        return this.get('internals').reduce((
        bool: boolean,
        cond: Constraint
        ): boolean => {
            return bool && cond.evaluate(value)
        }, true)
    }

    isValid(param: Parameter): boolean {
        let list = this.get('externals')
        // No external constraint
        if (list.size === 0) {
            return true
        }

        return list.reduce((
            bool: boolean,
            _param: Parameter
        ): boolean => {
            // && has precedence on ||
            return bool ||
                _param.get('key') === param.get('key') &&
                _param.validate(param.get('value'))
        }, false)
    }
}

export class ParameterContainer extends Record({
    _model: new Model({
        name: 'parameter-container.core.models',
        version: '0.1.0'
    }),
    headers: List(),
    queries: List(),
    body: List(),
    path: List()
}) {
    getHeadersSet(): OrderedMap<string, Parameter> {
        let headers = this.get('headers')
        let _set = headers.reduce((set: Object, param: Parameter): Object => {
            set[param.get('key')] = param
            return set
        }, {})
        return new OrderedMap(_set)
    }

    // TODO support uriEncoding
    getUrlParams() {
        let queries = this.get('queries')
        if (typeof queries === 'undefined' || queries === null) {
            return '?'
        }

        if (queries.size > 0) {
            let _query = queries.reduce((
                query: string,
                param: Parameter
            ): string => {
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

    filter(paramList: List<Parameter>): ParameterContainer {
        if (!paramList) {
            return this
        }

        let headers = this.get('headers')
        let queries = this.get('queries')
        let body = this.get('body')
        let path = this.get('path')

        paramList.forEach((param: Parameter) => {
            headers = headers.filter((d: Parameter): boolean => {
                return d.isValid(param)
            })
            queries = queries.filter((d: Parameter): boolean => {
                return d.isValid(param)
            })
            body = body.filter((d: Parameter): boolean => {
                return d.isValid(param)
            })
            path = path.filter((d: Parameter): boolean => {
                return d.isValid(param)
            })
        })
        return this.withMutations((container: ParameterContainer) => {
            container
                .set('headers', headers)
                .set('queries', queries)
                .set('body', body)
                .set('path', path)
        })
    }
}

export class Body extends Record({
    _model: new Model({
        name: 'body.core.models',
        version: '0.1.0'
    }),
    constraints: List(),
    type: null
}) {
    filter(paramContainer: ParameterContainer): ?ParameterContainer {
        if (paramContainer instanceof ParameterContainer) {
            return paramContainer.filter(this.get('constraints'))
        }
    }
}

export class Response extends Record({
    _model: new Model({
        name: 'response.core.models',
        version: '0.1.0'
    }),
    code: null,
    description: null,
    examples: null,
    parameters: new ParameterContainer(),
    bodies: List()
}) { }


export default class Context extends Record({
    _model: new Model({
        name: 'context.core.models',
        version: '0.1.0'
    }),
    requests: new OrderedMap(),
    group: null,
    references: new OrderedMap(),
    info: new Info()
}) { }
