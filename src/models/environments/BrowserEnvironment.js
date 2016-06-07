import Environment from './Environment'
import URL from '../URL'

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
                const req = new window.XMLHttpRequest()

                req.addEventListener('error', (event) => {
                    reject(new Error(event))
                })

                req.addEventListener('abort', (event) => {
                    reject(new Error(event))
                })

                req.addEventListener('load', () => {
                    resolve(this.responseText)
                })


                req.open('GET', url)
                req.send()
            }
        })
    }
}


export default class BrowserEnvironment extends Environment {
    constructor() {
        super({
            type: 'node'
        })
        return this
    }

    getResolver(item) {
        return this.getIn([ 'cache', item.getPath() ]) || null
    }

    addResolver(item) {
        if (this.getIn([ 'cache', item.getPath() ])) {
            return this
        }

        let resolver = new URLResolver(item)

        return this.setIn([ 'cache', item.getPath() ], resolver)
    }
}
