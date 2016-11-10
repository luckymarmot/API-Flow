import ContextResolver from '../resolvers/ContextResolver'

import Options from '../models/options/Options'

export default class BaseFlow {
    /* Environment and URLResolver MUST be overriden */
    constructor(Environment, URLResolver) {
        this.Environment = Environment
        this.URLResolver = URLResolver
    }

    detectFormat(content) {
        let parserMap = this.getParsers()

        let scores = []

        let parsers = Object.keys(parserMap)
        for (let parser of parsers) {
            scores = scores.concat(parserMap[parser].detect(content))
        }

        return new Promise((resolve) => {
            resolve(scores)
        })
    }

    detectName(content) {
        let parserMap = this.getParsers()

        let name = null
        let parsers = Object.keys(parserMap)
        for (let parser of parsers) {
            let proposed = parserMap[parser].getAPIName(content)
            if (!name) {
                name = proposed
            }
            else if (proposed && proposed.length > name.length) {
                name = proposed
            }
        }

        return new Promise((resolve) => {
            resolve(name)
        })
    }

    load(input, opts) {
        let url = null
        let contentPromise
        const base = opts.getIn([ 'resolver', 'base' ])

        if (base === 'raw') {
            contentPromise = new Promise((resolve) => {
                return resolve(input)
            })
        }
        else {
            contentPromise = (new this.URLResolver()).resolve(input)
            url = input
        }

        return contentPromise.then(content => {
            return {
                url,
                content
            }
        })
    }

    getParsers() {
        throw new Error('BaseFlow.getParsers must be overriden')
    }

    _getBestFormat(scores) {
        let best = {
            format: null,
            version: null,
            score: -1
        }

        scores.forEach(scoreItem => {
            if (scoreItem.score >= best.score) {
                best = scoreItem
            }
        })

        return best
    }

    _guessFormatIfNotAvailable(item, opts) {
        const isDefault = opts.getIn([ 'parser', 'isDefault' ])

        if (isDefault) {
            return this.detectFormat(item.content).then(scores => {
                const formatObj = this._getBestFormat(scores)
                let options = opts
                    .setIn([ 'parser', 'name' ], formatObj.format)
                    .setIn([ 'parser', 'version' ], formatObj.version)

                return {
                    item,
                    options
                }
            })
        }

        const sourceFormat = opts.getIn([ 'parser', 'name' ])
        let sourceVersion = opts.getIn([ 'parser', 'version' ])

        if (!sourceVersion) {
            const parsers = this.getParsers()
            const scores = parsers[sourceFormat].detect(item.content)
            let best = {
                version: 'v1',
                score: -1
            }

            scores.forEach(scoreItem => {
                if (scoreItem.score >= best.score) {
                    best = scoreItem
                }
            })

            sourceVersion = best.version
        }

        return new Promise((resolve) => {
            const options = opts.setIn([ 'parser', 'version' ], sourceVersion)
            resolve({
                item,
                options
            })
        })
    }

    parse(item, opts) {
        const sourceFormat = opts.getIn([ 'parser', 'name' ])
        const sourceVersion = opts.getIn([ 'parser', 'version' ])
        const parsers = this.getParsers()

        const parser = new parsers[sourceFormat](sourceVersion)

        let promise
        try {
            promise = parser.parse(item, opts.get('parser'))
        }
        catch (e) {
            return new Promise((resolve, reject) => {
                reject(e)
            })
        }

        if (typeof promise.then !== 'function') {
            let value = promise
            promise = new Promise((resolve) => {
                resolve(value)
            })
        }

        return promise
    }

    resolve(item, context, opts) {
        const environment = new this.Environment()
        const resolver = new ContextResolver(environment)
        return resolver.resolveAll(
            item,
            context,
            opts.get('resolver')
        )
    }

    getSerializers() {
        throw new Error('BaseFlow.getSerializers must be overriden')
    }

    serialize(context, opts) {
        const target = opts.getIn([ 'serializer', 'name' ])

        const serializers = this.getSerializers()
        const serializer = new serializers[target]()

        try {
            let final = serializer
                .serialize(
                    context,
                    opts.get('serializer')
                )
            let error = serializer.validate(final)
            if (error) {
                throw error
            }
            else {
                return final
            }
        }
        catch (e) {
            throw e
        }
    }

    transform(input, _opts) {
        let opts = null
        if (typeof _opts.set === 'function') {
            opts = _opts
        }
        else {
            opts = new Options(_opts)
        }

        const detectFunc = (($opts) => {
            return item => {
                return this._guessFormatIfNotAvailable(item, $opts)
            }
        })(opts)

        const parseFunc = ({ item, options }) => {
            return this.parse(item, options).then(context => {
                return {
                    item, context
                }
            })
        }

        const resolveFunc = (($opts) => {
            return ({ item, context }) => {
                return this.resolve(item, context, $opts)
            }
        })(opts)

        const serializeFunc = (($opts) => {
            return context => {
                return this.serialize(context, $opts)
            }
        })(opts)

        const errorHandler = (err) => { throw err }

        return this.load(input, opts)
            .then(detectFunc, errorHandler)
            .then(parseFunc, errorHandler)
            .then(resolveFunc, errorHandler)
            .then(serializeFunc, errorHandler)
    }
}
