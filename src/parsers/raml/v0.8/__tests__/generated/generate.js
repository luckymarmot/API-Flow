#!/usr/bin/env babel-node
import raml from 'raml-parser'
import fs from 'fs'
import path from 'path-browserify'

let generatedPath = __dirname
let samplePath = '../samples'
let dir = fs.readdirSync(samplePath)

let ramlFiles = dir.filter(d => {
    let match = d.match(/[yr]a?ml$/)
    return match
})

let items = []

for (let file of dir) {
    let content = fs.readFileSync(path.join(samplePath, file)).toString()
    items.push({
        content: content,
        file: {
            name: file,
            path: samplePath
        }
    })
}

let reader = (_items) => {
    let _reader = {
        readFileAsync: (filePath) => {
            for (let item of _items) {
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

let writeRAMLFile = file => {
    let content = fs.readFileSync(path.join(samplePath, file)).toString()
    raml.load(content, path.join(samplePath, file), {
        reader: reader(items)
    }).then(data => {
        let _content = JSON.stringify(data, null, '  ')
        /* eslint-disable no-console */
        console.log('file', file.replace(/\.[yr]a?ml$/, '.json'))
        /* eslint-enable no-console */
        fs.writeFileSync(
            path.join(generatedPath, file.replace(/\.[yr]a?ml$/, '.json')),
            _content
        )
    })
}

for (let file of ramlFiles) {
    writeRAMLFile(file)
}
