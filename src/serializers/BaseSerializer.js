export default class BaseSerializer {
    constructor(stream) {
        this.stream = stream
    }

    write(context, end = true) {
        let serialized = this.seralize(context)
        this.stream.write(serialized)

        if (end) {
            this.stream.end()
        }
    }

    serialize(context) {
        const msg =
            'Method serialize must be implemented ' +
            'by extensions of BaseSerializer'
        throw new Error(msg)
    }
}
