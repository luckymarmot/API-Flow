export default class ContextResolver {
    constructor(environment) {
        this.environment = environment
    }

    resolveAll(item, _references) {
        let references = _references
        let environments = references.keySeq()

        let promises = []
        for (let env of environments) {
            let promise = this.resolveContainer(item, references.get(env))
            promises.push(promise)
        }

        return Promise.all(promises).then(containers => {
            for (let i = 0; i < environments.size; i += 1) {
                references = references.set(environments.get(i), containers[i])
            }
            return references
        })
    }

    resolveContainer(item, _container) {
        let container = _container
        let unresolved = container.getUnresolvedReferences()

        if (unresolved.size === 0) {
            return new Promise((resolve) => {
                resolve(container)
            })
        }

        let promises = unresolved.map(uri => {
            let reference = container.resolve(uri)
            return this.resolveReference(item, reference)
        })

        return Promise.all(promises).then(updatedReferences => {
            for (let reference of updatedReferences) {
                container = container.update(reference)
                let dependencies = reference.get('dependencies')
                container = container.create(dependencies)
            }
            return this.resolveContainer(item, container)
        })
    }

    resolveReference(item, reference) {
        let dataUri = reference.getDataUri()

        if (dataUri === null) {
            return new Promise((resolve) => {
                resolve(item)
            }).then(_item => {
                return reference.resolve(_item)
            })
        }

        let dataResolver
        let urlPattern = /^https?:\/\//i
        this.environment = this.environment.addResolver(item)

        let type = 'file'
        if (urlPattern.test(dataUri)) {
            type = 'url'
        }
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
