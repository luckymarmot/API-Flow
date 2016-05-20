import path from 'path'
import fs from 'fs'

import {
    UnitTest,
    registerTest
} from '../utils/TestUtils'

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
            Class.prototype['_test' + forgotten] = () => {}
        }

        for (let valid of done) {
            Class.prototype['test' + valid] = () => {}
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

