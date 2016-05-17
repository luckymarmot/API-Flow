export default class ContextResolver {
    constructor(environment) {
        this.environment = environment
    }

    resolveAll(item, _references) {
        let references = _references
        let unresolved = references.getUnresolvedReferences()

        if (unresolved.size === 0) {
            return new Promise((resolve) => {
                resolve(references)
            })
        }

        let promises = unresolved.map(uri => {
            let reference = references.resolve(uri)
            return this.resolveReference(item, reference)
        })

        return Promise.all(promises).then(updatedReferences => {
            for (let reference of updatedReferences) {
                references = references.update(reference)
                let dependencies = reference.get('dependencies')
                references = references.create(dependencies)
            }
            return this.resolveAll(item, references)
        })
    }

    resolveReference(item, reference) {
        let dataUri = reference.getDataUri()

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
            })
    }
}
