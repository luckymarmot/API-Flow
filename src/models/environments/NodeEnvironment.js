import fs from 'fs'
import path from 'path'
import request from 'request'

import Environment from './Environment'
import URL from '../URL'

export class FileResolver {
    constructor(item) {
        this.item = item
    }

    resolve(uri) {
        return new Promise((resolve, reject) => {
            if (uri === '') {
                return resolve(this.item.content)
            }
            else {
                let _path = path.resolve(this.item.get('filepath'), uri)
                fs.readFile(_path, function(err, data) {
                    if (err) {
                        return reject(new Error(err))
                    }
                    else {
                        return resolve(data.toString())
                    }
                })
            }
        })
    }
}

export class URLResolver {
    constructor(item) {
        this.item = item
    }

    resolve(uri) {
        return new Promise((resolve, reject) => {
            if (uri === '') {
                return resolve(this.item.content)
            }
            else {
                let url = new URL(uri, this.item.get('url')).href()
                request.get(url, (error, response, body) => {
                    if (error) {
                        return reject(new Error(error))
                    }
                    else {
                        return resolve(body)
                    }
                })
            }
        })
    }
}


export default class NodeEnvironment extends Environment {
    constructor() {
        super({
            type: 'node'
        })
        return this
    }

    getResolver(item) {
        return this.getIn([ 'cache', item.getPath() ]) || null
    }

    addResolver(item, type) {
        if (this.getIn([ 'cache', item.getPath() ])) {
            return this
        }

        let resolver
        if (type === 'url') {
            resolver = new URLResolver(item)
        }
        else {
            resolver = new FileResolver(item)
        }
        return this.setIn([ 'cache', item.getPath() ], resolver)
    }
}
