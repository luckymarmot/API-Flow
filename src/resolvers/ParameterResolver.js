import Immutable from 'immutable'

import ResolverOptions, {
    ParameterItem
} from '../models/options/ResolverOptions'

import Group from '../models/Group'
import Constraint from '../models/Constraint'
import Request from '../models/Request'


export default class ParameterResolver {
    resolveAll(context, opts = new ResolverOptions()) {
        let group = context.get('group')
        let values = opts.getIn([ 'resolve', 'custom' ])
            .filter(value => {
                return value instanceof ParameterItem
            })

        if (values.size > 0) {
            group = this._traverseGroup(group, values)
        }

        return context.set('group', group)
    }

    _traverseGroup(group, values) {
        if (group instanceof Request) {
            return this._traverseRequest(group, values)
        }

        if (group instanceof Group) {
            let _group = group

            _group = _group.withMutations(($group) => {
                let children = group.get('children')

                if (children) {
                    children.forEach((child, key) => {
                        $group.setIn(
                            [ 'children', key ],
                            this._traverseGroup(child, values)
                        )
                    })
                }
            })

            return _group
        }
        else {
            return group
        }
    }

    _traverseRequest(request, values) {
        let url = request.get('url')
        let parameters = request.get('parameters')
        let auths = request.get('auths')

        return request
            .set('url', this._updateURL(url, values))
            .set('parameters', this._updateParameters(parameters, values))
            .set('auths', this._updateAuths(auths, values))
    }

    _updateParameter(param, values) {
        let updated = param

        let paramKey = updated.get('key')
        values.forEach((item) => {
            let key = item.get('key')
            let value = item.get('value')
            if (paramKey === key) {
                if (typeof value !== 'string') {
                    value = JSON.stringify(value)
                }
                updated = updated
                    .set('internals', new Immutable.List([
                        new Constraint.Enum([ value ])
                    ]))
                    .set('value', value)
                    .set('format', null)
                    .set('type', 'string')
            }
        })

        let format = updated.get('format')
        let type = updated.get('type')

        if (format === 'sequence' || type === 'multi') {
            let list = updated.get('value')
            list = list.map(seq => {
                return this._updateParameter(seq, values)
            })
            updated = updated.set('value', list)
        }

        return updated
    }

    _updateURL(_url, values) {
        let keyList = _url.keySeq()

        let url = _url.withMutations($url => {
            keyList.forEach(key => {
                $url.set(key, this._updateParameter(key, values))
            })
        })

        return url
    }

    _updateParameters(container, values) {
        let locationList = container.keySeq()

        let _container = container.withMutations($container => {
            locationList.forEach(location => {
                let list = $container.get(location)
                list = list.map(param => {
                    return this._updateParameter(param, values)
                })
                $container.set(location, list)
            })
        })

        return _container
    }

    _getValueFromKey(key, values) {
        let _value = null
        values.forEach(value => {
            if (key === value.get('key')) {
                _value = value
            }
        })

        return _value
    }

    _updateAuths(auths, values) {
        return auths.map(_auth => {
            if (!_auth) {
                return _auth
            }

            let auth = _auth

            for (let key of _auth.keys()) {
                let value = this._getValueFromKey(key, values)
                if (value) {
                    auth = auth.set(key, value.get('value'))
                }
            }

            return auth
        })
    }
}
