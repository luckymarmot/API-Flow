import path from 'path-browserify'

import Item from '../../models/Item'

export default class ShimmingFileReader {
  constructor(items, UrlResolverClass) {
    this.baseItem = ''
    this.items = items || []
    this.urlResolver = null

    if (UrlResolverClass) {
      this.urlResolver = new UrlResolverClass(new Item())
    }
  }

  readFileAsync(filePath) {
    if (/^https?/i.test(filePath) && this.urlResolver) {
      return this.urlResolver.resolve(filePath)
                .then(content => content, () => {
                  return '::fileRef::' +
                        path.relative(path.dirname(this.baseItem), filePath)
                })
    }

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
