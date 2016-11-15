import Environment from './Environment'
import URL from '../URL'
import Model from '../ModelInfo'

export class URLResolver {
    static _model = new Model({
        name: 'url-resolver.browser.environments.models',
        version: '0.1.0'
    })

    constructor(item) {
        this.item = item
    }

    resolve(uri) {
        return new Promise((resolve, reject) => {
            if (uri === '') {
                return resolve((this.item || {}).content)
            }
            else {
                let url

                if (!this.item) {
                    url = new URL(uri).href()
                }
                else {
                    url = new URL(uri, this.item.get('url')).href()
                }

                const req = new XMLHttpRequest()

                req.addEventListener('error', (event) => {
                    return reject(new Error(event))
                })

                req.addEventListener('abort', (event) => {
                    return reject(new Error(event))
                })

                req.addEventListener('load', () => {
                    return resolve(req.responseText)
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
            _model: new Model({
                name: 'browser.environments.models',
                version: '0.1.0'
            }),
            type: 'web'
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
