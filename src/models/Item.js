import Immutable from 'immutable'

export default class Item extends Immutable.Record({
    url: null,
    filename: null,
    filepath: null
}) {
    constructor(item) {
        if (!item) {
            super()
            return this
        }

        let file = item.file || {}
        let obj = {
            url: item.url || null,
            filename: file.name || null,
            filepath: file.path || null
        }

        super(obj)
        return this
    }

    getPath() {
        let url = this.get('url') || ''
        let path = (this.get('filepath') || '') + (this.get('filename') || '')
        return url || path
    }
}
