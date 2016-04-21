import path from 'path-browserify'

export default class ShimmingFileReader {
    constructor(items) {
        this.items = items
    }

    readFileAsync(filePath) {
        for (let item of this.items) {
            if (filePath.indexOf(
                path.join(item.file.path, item.file.name)
            ) === 0) {
                return new Promise((resolve) => {
                    resolve(item.content)
                })
            }
        }
        return new Promise((resolve) => {
            resolve(
                '::fileRef::' +
                filePath
            )
        })
    }
}
