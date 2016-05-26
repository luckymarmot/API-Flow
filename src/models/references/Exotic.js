import Reference from './Reference'

export default class ExoticReference extends Reference {
    resolve() {
        return this
            .set('resolved', true)
    }

    evaluate() {
        return this
    }

    getDataUri() {
        return null
    }
}
