import path from 'path'
import fs from 'fs'

import {
    UnitTest,
    registerTest
} from '../utils/TestUtils'

let ignorePatterns = [
    /serializers\/paw/
]

function findNonTestedMethods(file, testFileDefined) {
    let shouldIgnore = ignorePatterns.reduce((bool, pattern) => {
        return bool || file.match(pattern) !== null
    }, false)

    if (shouldIgnore) {
        return {}
    }

    let exposed = {}
    let exposedTests = {}
    try {
        exposed = require(file)
        if (testFileDefined) {
            let match = file.match(/^(.*)\/([^/]*)\.js(x?)$/)
            let _path
            if (match) {
                _path =
                    match[1] +
                    '/__tests__/' +
                    match[2] +
                    '-test.js' +
                    match[3]
            }
            exposedTests = require(_path)
        }

        let classes = {}
        let outstanding = []
        let missing = []

        for (let exp of Object.keys(exposed)) {
            classes[exp] = false
        }

        for (let test of Object.keys(exposedTests)) {
            if (classes[test.slice(4)] === false) {
                classes[test.slice(4)] = true
            }
            else if (classes.default === false) {
                classes.default = true
            }
            else {
                outstanding.push(test)
            }
        }

        for (let exp of Object.keys(classes)) {
            if (classes[exp] === false) {
                missing.push(exp)
            }
        }

        return {
            missing: missing,
            outstanding: outstanding
        }
    }
    catch (e) {
        return {
            failed: file,
            error: e
        }
    }
}

function validateSource() {
    return function(Class) {
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

        let files = getFiles(path.join(__dirname, '..'))
        let jsFiles = files.filter(_path => {
            return _path.match(/\.jsx?$/) !== null
        })

        let tests = {}
        let standard = {}

        for (let _path of jsFiles) {
            if (_path.match(/-test\.jsx?$/)) {
                let key = _path
                    .split('-test')
                    .join('')
                    .split('/__tests__')
                    .join('')
                tests[key] = true
            }
            else if (!_path.match(/__tests__/)) {
                standard[_path] = true
            }
        }

        let missing = []
        let done = []
        for (let key of Object.keys(standard)) {
            if (!tests[key]) {
                missing.push(key)
            }
            else {
                done.push(key)
            }
        }

        for (let forgotten of missing) {
            let methods = findNonTestedMethods(forgotten, false)

            let func = () => {}
            if (methods.failed) {
                func = () => {
                    this.assertEqual(methods.failed, methods.error)
                }
            }

            if (methods.missing && methods.missing.length > 0) {
                func = methods.missing
            }

            Class.prototype['_test' + forgotten] = func
        }

        for (let valid of done) {
            let methods = findNonTestedMethods(valid, true)

            let func = () => {}
            if (methods.failed) {
                /* eslint-disable no-loop-func */
                func = () => {
                    (new UnitTest()).assertEqual(methods.failed, methods.error)
                }
                /* eslint-enable no-loop-func */
            }

            if (methods.missing && methods.missing.length > 0) {
                func = methods.missing
            }

            Class.prototype['test' + valid] = func
        }
    }
}

@registerTest
@validateSource()
export class TestValidateSource extends UnitTest {
    testIsPresent() {
        // TODO
    }
}

