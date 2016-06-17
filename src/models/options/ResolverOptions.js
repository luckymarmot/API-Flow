import Immutable from 'immutable'

export class ResolutionItem extends Immutable.Record({
    uri: null,
    resolve: true,
    value: null
}) {
    constructor(opts) {
        let normalized = ResolutionItem.normalize(opts)
        super(normalized)
    }

    static normalize(_item) {
        let item = _item
        if (!item || typeof item !== 'object') {
            item = {}
        }

        return {
            uri: item.uri ? item.uri : '',
            resolve: typeof item.resolve !== 'boolean' ? true : item.resolve,
            value: typeof item.value === 'undefined' ? null : item.value
        }
    }
}

export class ResolutionOptions extends Immutable.Record({
    remote: true,
    local: true,
    custom: new Immutable.OrderedMap()
}) {
    constructor(opts) {
        let normalized = ResolutionOptions.normalize(opts)
        super(normalized)
    }

    static normalize(_resolution) {
        let resolution = _resolution
        if (!resolution || typeof resolution !== 'object') {
            resolution = {}
        }

        let remote = resolution.remote
        let local = resolution.local
        let custom = resolution.custom

        if (!custom || typeof custom !== 'object') {
            custom = new Immutable.OrderedMap()
        }
        else if (typeof custom[Symbol.iterator] === 'function') {
            let formatted = {}
            for (let res of custom) {
                let _res = new ResolutionItem(res)
                formatted[_res.get('uri')] = _res
            }
            custom = new Immutable.OrderedMap(formatted)
        }
        else {
            let formatted = {}
            let uris = Object.keys(custom)
            for (let uri of uris) {
                custom[uri].uri = uri
                formatted[uri] = new ResolutionItem(custom[uri])
            }
            custom = new Immutable.OrderedMap(formatted)
        }

        return {
            remote: typeof remote !== 'boolean' ? true : remote,
            local: typeof local !== 'boolean' ? true : local,
            custom: custom
        }
    }
}

export default class ResolverOptions extends Immutable.Record({
    base: 'remote',
    resolve: new ResolutionOptions()
}) {
    constructor(opts) {
        let normalized = ResolverOptions.normalize(opts)
        super(normalized)
    }

    static normalize(_resolver) {
        let resolver = _resolver
        if (typeof resolver === 'string') {
            resolver = {
                base: resolver.toLowerCase(),
                resolve: new ResolutionOptions()
            }
        }
        else if (!resolver || typeof resolver !== 'object') {
            resolver = {
                base: 'remote',
                resolve: new ResolutionOptions()
            }
        }
        else {
            if (!resolver.base || typeof resolver.base !== 'string') {
                resolver.base = 'remote'
            }

            if (typeof resolver.resolve === 'boolean') {
                resolver.resolve = new ResolutionOptions({
                    remote: resolver.resolve,
                    local: resolver.resolve
                })
            }
            else if (
                typeof resolver.resolve === 'undefined' ||
                resolver.resolve === null ||
                typeof resolver.resolve !== 'object'
            ) {
                resolver.resolve = new ResolutionOptions()
            }
            else if (typeof resolver.resolve[Symbol.iterator] === 'function') {
                resolver.resolve = new ResolutionOptions({
                    custom: resolver.resolve
                })
            }
            else {
                resolver.resolve = new ResolutionOptions(resolver.resolve)
            }
        }

        return resolver
    }
}
