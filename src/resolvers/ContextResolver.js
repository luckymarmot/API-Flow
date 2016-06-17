import ResolverOptions from '../models/options/ResolverOptions'

export default class ContextResolver {
    constructor(environment) {
        this.environment = environment
    }

    resolveAll(item, context, opts = new ResolverOptions()) {
        let references = context.get('references')
        let environments = references.keySeq()

        let promises = []
        for (let env of environments) {
            let promise = this.resolveContainer(item, references.get(env), opts)
            promises.push(promise)
        }

        return Promise.all(promises).then(containers => {
            for (let i = 0; i < environments.size; i += 1) {
                references = references.set(environments.get(i), containers[i])
            }
            return context.set('references', references)
        })
    }

    resolveContainer(item, _container, opts) {
        let container = _container
        let unresolved = container.getUnresolvedReferences()

        if (unresolved.size === 0) {
            return new Promise((resolve) => {
                resolve(container)
            })
        }

        let promises = unresolved.map(uri => {
            let reference = container.resolve(uri)
            return this.resolveReference(item, reference, opts)
        })

        return Promise.all(promises).then(updatedReferences => {
            for (let reference of updatedReferences) {
                container = container.update(reference)
                let dependencies = reference.get('dependencies')
                container = container.create(dependencies)
            }
            return this.resolveContainer(item, container, opts)
        })
    }

    resolveReference(item, reference, opts) {
        let dataUri = reference.getDataUri()

        let type = 'file'
        let urlPattern = /^https?:\/\//i
        if (urlPattern.test(dataUri || '')) {
            type = 'url'
        }

        let resolve = true
        let value = null
        if (opts) {
            let options = opts.getIn([
                'resolve', 'custom', reference.get('relative')
            ])
            if (options) {
                resolve = options.get('resolve')
                value = options.get('value')

                if (resolve && value) {
                    let _reference = reference
                        .set('value', value)
                        .set('resolved', true)

                    return new Promise((_resolve) => {
                        return _resolve(_reference)
                    })
                }
            }

            if (type === 'file' && !opts.getIn([ 'resolve', 'local' ])) {
                resolve = false
            }

            if (type === 'url' && !opts.getIn([ 'resolve', 'remote' ])) {
                resolve = false
            }
        }

        if (!resolve) {
            return new Promise((_resolve) => {
                return _resolve(reference.set('resolved', true))
            })
        }

        if (dataUri === null) {
            return new Promise((_resolve) => {
                _resolve(item)
            }).then(_item => {
                return reference.resolve(_item)
            })
        }

        let dataResolver
        this.environment = this.environment.addResolver(item)
        dataResolver = this.environment.getResolver(item, type)

        return dataResolver
            .resolve(dataUri)
            .then(_item => {
                return reference.resolve(_item)
            }, () => {
                return reference.resolve(null)
            })
    }
}
