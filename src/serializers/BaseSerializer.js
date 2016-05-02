export default class BaseSerializer {
    constructor(stream) {
        this.stream = stream
    }

    write(context, end = true) {
        let serialized = this.serialize(context)
        this.stream.write(serialized)

        if (end) {
            this.stream.end()
        }
    }

    /*
        @params:
            - context: A Context Object as defined in API-Flow's Core models
    */
    serialize() {
        const msg =
            'Method serialize must be implemented ' +
            'by extensions of BaseSerializer'
        throw new Error(msg)
    }
}
