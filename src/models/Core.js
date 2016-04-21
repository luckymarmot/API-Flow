import Immutable from 'immutable'

export class Parameter extends Immutable.Record({
    key: null,
    value: null,
    type: null,
    name: null,
    description: null,
    example: null,
    internal: Immutable.List(),
    external: Immutable.List()
}) {
    generate() {
        return this
    }

    validate(value) {
        return this.get('internal').reduce((bool, cond) => {
            return bool && cond.evaluate(value)
        }, true)
    }

    isValid(param) {
        let list = this.get('external')
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
    body: Immutable.List()
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
        })
        return this
            .set('headers', headers)
            .set('queries', queries)
            .set('body', body)
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

export class Request extends Immutable.Record({
    id: null,
    name: null,
    description: null,
    url: null,
    method: null,
    parameters: new ParameterContainer(),
    bodies: Immutable.List(),
    auths: Immutable.List(),
    responses: Immutable.List(),
    timeout: null
}) { }

export default class Context extends Immutable.Record({
    schema: null,
    group: null,
    environments: null
}) {
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
