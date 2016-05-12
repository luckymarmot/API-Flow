export default class ContextResolver {
    constructor(item, context, environment) {
        this.item = item
        this.context = context
        this.environment = environment
    }

    resolveAll(_references) {
        let references = _references
        let unresolved = references.getUnresolvedReferences()

        if (unresolved.size === 0) {
            return new Promise((resolve) => {
                resolve(references)
            })
        }

        let promises = unresolved.map(reference => {
            return this.resolveReference(reference)
        })

        return Promise.all(promises).then(updatedReferences => {
            for (let reference of updatedReferences) {
                references = references.update(reference)
                let dependencies = reference.get('dependencies')
                references = references.create(dependencies)
            }
            return this.resolveAll(references)
        })
    }

    resolveReference(reference) {
        let dataUri = reference.extractDataUri()

        let dataResolver
        let urlPattern = /^https?:\/\//i
        if (urlPattern.test(dataUri)) {
            dataResolver = this.environment.getURLResolver(reference)
        }
        else {
            dataResolver = this.environment.getFileResolver(reference)
        }

        return dataResolver
            .resolve(dataUri)
            .then(item => {
                return reference.resolve(item)
            })
    }
}
