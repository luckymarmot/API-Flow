import Immutable from 'immutable'
import path from 'path'

export default class Item extends Immutable.Record({
    url: null,
    filename: null,
    filepath: null,
    content: null
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
            filepath: file.path || null,
            content: item.content || null
        }

        super(obj)
        return this
    }

    getPath() {
        let url = this.get('url') || ''
        let _path = path.join(
            this.get('filepath') || '',
            this.get('filename') || ''
        )
        return url || _path
    }
}
