#!/usr/bin/env babel-node
import raml from 'raml-parser'
import fs from 'fs'
import path from 'path-browserify'

const generatedPath = __dirname
const samplePath = '../samples'
const dir = fs.readdirSync(samplePath)

const ramlFiles = dir.filter(d => {
  const match = d.match(/[yr]a?ml$/)
  return match
})

const items = []

for (const file of dir) {
  const content = fs.readFileSync(path.join(samplePath, file)).toString()
  items.push({
    content: content,
    file: {
      name: file,
      path: samplePath
    }
  })
}

const reader = (_items) => {
  const _reader = {
    readFileAsync: (filePath) => {
      for (const item of _items) {
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
  return _reader
}

const writeRAMLFile = file => {
  const content = fs.readFileSync(path.join(samplePath, file)).toString()
  raml.load(content, path.join(samplePath, file), {
    reader: reader(items)
  }).then(data => {
    const _content = JSON.stringify(data, null, '  ')
        /* eslint-disable no-console */
    console.log('file', file.replace(/\.[yr]a?ml$/, '.json'))
        /* eslint-enable no-console */
    fs.writeFileSync(
            path.join(generatedPath, file.replace(/\.[yr]a?ml$/, '.json')),
            _content
        )
  })
}

for (const file of ramlFiles) {
  writeRAMLFile(file)
}
