import path from 'path-browserify'

export default class ShimmingHttpResolver {
  constructor(items) {
    this.baseItem = ''
    this.items = items || []
  }

  readFileAsync(filePath) {
    for (const item of this.items) {
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
                path.relative(path.dirname(this.baseItem), filePath)
            )
    })
  }

  setBaseItem(item) {
    this.baseItem = item.getPath()
  }
}
