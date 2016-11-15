import BaseSerializer from '../BaseSerializer'

export default class InternalSerializer extends BaseSerializer {
    constructor() {
        super()
        this.references = null
    }

    serialize(context) {
        return JSON.stringify(context.toJS(), null, 2)
    }

    validate() {
        return null
    }
}
