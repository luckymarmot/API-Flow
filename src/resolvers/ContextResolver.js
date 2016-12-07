import ResolverOptions from '../models/options/ResolverOptions'

import ParameterResolver from './ParameterResolver'

export default class ContextResolver {
    constructor(environment) {
        this.environment = environment
    }

    resolveAll(
        item,
        context,
        opts = new ResolverOptions(),
        parameterResolver = new ParameterResolver()
    ) {
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


            return parameterResolver.resolveAll(
                context.set('references', references),
                opts
            )
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
            try {
                let promise = this.resolveReference(item, reference, opts)
                return promise
            }
            catch (e) {
                return null
            }
        })


        return Promise.all(promises).then(updatedReferences => {
            for (let reference of updatedReferences) {
                container = container.update(reference)
                let dependencies = reference.get('dependencies')
                container = container.create(dependencies)
            }

            return this.resolveContainer(item, container, opts)
        }, (err, refs) => {
            /* eslint-disable no-console */
            console.error('rejected promise', err, refs)
            /* eslint-enable no-console */
        }).catch((error, something) => {
            /* eslint-disable no-console */
            console.error('got this error', error, something)
            /* eslint-enable no-console */
        })
    }

    resolveReference(item, reference, opts) {
        try {
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

            if (!resolve && dataUri) {
                return new Promise((_resolve) => {
                    return _resolve(reference.set('resolved', true))
                })
            }

            if (dataUri === null || dataUri === '') {
                return new Promise((_resolve) => {
                    _resolve(item)
                }).then(_item => {
                    let resolved = reference.resolve(_item.content)
                    return resolved
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
        catch (e) {
            return new Promise(resolve => resolve(null))
        }
    }
}
