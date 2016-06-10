import Reference from './Reference'

export default class LateResolutionReference extends Reference {
    resolve() {
        return this
            .set('resolved', true)
    }

    evaluate(references) {
        let ref = this.get('uri')
        let match = ref.match(/{{[^{}]*}}/)
        let maxResolutions = 20
        let counter = {
            resolutionCount: 0
        }

        let replacer = this._replaceRef(references, counter)

        while (match && counter.resolutionCount < maxResolutions) {
            ref = ref.replace(/({{[^{}]*}})/, replacer)
            match = ref.match(/{{[^{}]*}}/)
        }

        return this.set('value', ref)
    }

    _replaceRef(references, counter) {
        return (match, group) => {
            let value = references.resolve('#/postman/' + group).get('value')
            counter.resolutionCount += 1
            return value
        }
    }

    getDataUri() {
        return null
    }
}
