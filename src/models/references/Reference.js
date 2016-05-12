import Immutable from 'immutable'

export default class Reference extends Immutable.Record({
    uri: null,
    resolved: false,
    value: null,
    dependencies: new Immutable.List(),
    raw: null,
    description: null
}) {
    /*
    * @params:
    *   - references: the list of references to use to resolve the reference
    *   - depth: the recursion depth of the resolution. Default value is 0
    */
    evaluate() {
        let msg =
            'Reference is an abstract class - ' +
            'this function must be implemented by class extending it'
        throw new Error(msg)
    }

    resolve(item) {
        return this
            .set('value', item.content)
            .set('resolved', true)
    }

    getDataUri() {
        return this.get('uri')
    }
}
