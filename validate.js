'use strict'

let path = require('path')
let fs = require('fs')

function getFiles(dir, files__) {
    let files_ = files__ || []
    let files = fs.readdirSync(dir)
    for (let file of files) {
        let name = path.join(dir, file)
        if (fs.statSync(name).isDirectory()) {
            getFiles(name, files_)
        }
        else {
            files_.push(name)
        }
    }
    return files_
}

let files = getFiles(path.join(__dirname, 'src'))
let jsFiles = files.filter(_path => {
    return _path.match(/\.jsx?$/) !== null
})

let tests = {}
let standard = {}

for (let _path of jsFiles) {
    if (_path.match(/-test\.jsx?$/)) {
        let key = _path.split('-test').join('').split('/__tests__').join('')
        tests[key] = true
    }
    else if (!_path.match(/__tests__/)) {
        standard[_path] = true
    }
}

let missing = []
for (let key of Object.keys(standard)) {
    if (!tests[key]) {
        missing.push(key)
    }
}

/* eslint-disable no-console */
console.log(
    'missing',
    missing.length,
    'test files\n',
    JSON.stringify(missing, null, '  ')
)
/* eslint-enable no-console */
