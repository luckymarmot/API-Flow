import Context from '../models/Core'
import ContextResolver from '../resolvers/ContextResolver'
import PawEnvironment from '../models/environments/PawEnvironment'
import PawSerializer from '../serializers/paw/BaseImporter'

export default class BasePawRunner {
    static fileExtensions = [];
    static inputs = [];

    constructor() {
        this.ENVIRONMENT_DOMAIN_NAME = 'Imported Environments'
        this.context = null
    }

    /*
      @params:
        - context
        - string
    */
    createRequestContextFromString(context, string) {
        return this.createRequestContexts(context, { content: string }, {})[0]
    }

    importString(context, string) {
        const requestContext = this.createRequestContextFromString(
            context,
            string
        )
        if (!(requestContext instanceof Context)) {
            throw new Error(
                'createRequestContextFromString ' +
                'did not return an instance of RequestContext'
            )
        }
        this._importPawRequests(requestContext)
        return true
    }

    /*
      @params:
        - context
        - items
        - options
    */
    createRequestContexts() {
        throw new Error('BaseImporter is an abstract class')
    }

    import(context, items, options) {
        this.context = context

        let parsePromiseOrResult = this.createRequestContexts(
            context,
            items,
            options
        )

        if (typeof parsePromiseOrResult.then !== 'function') {
            let value = parsePromiseOrResult
            parsePromiseOrResult = new Promise((resolve) => {
                resolve(value)
            })
        }

        let environment = new PawEnvironment()
        let resolver = new ContextResolver(environment)

        let importPromise = parsePromiseOrResult.then((requestContexts) => {
            let promises = []
            for (let env of requestContexts) {
                promises.push(
                    this._importContext(
                        resolver,
                        env.context,
                        env.items[0],
                        options
                    )
                )
            }

            return Promise.all(promises).then(() => {
                return true
            }, () => {
                return false
            })
        }, () => {
            return false
        }).catch(() => {
            return false
        })

        return importPromise
    }

    _importContext(resolver, reqContext, item, options) {
        if (!(reqContext instanceof Context)) {
            throw new Error(
                'createRequestContext ' +
                'did not return an instance of RequestContext'
            )
        }

        return resolver.resolveAll(
            item,
            reqContext
        ).then(context => {
            try {
                this._importInPaw(
                    context,
                    item,
                    options
                )
                if (options && options.order) {
                    options.order += 1
                }
            }
            catch (e) {
                /* eslint-disable no-console */
                console.error('got error', e.stack)
                /* eslint-enable no-console */
            }
        }).catch(error => {
            /* eslint-disable no-console */
            console.error('got error', error.stack)
            /* eslint-enable no-console */
        })
    }

    _importInPaw(requestContext, item, options) {
        let serializer = new PawSerializer()
        serializer.serialize(requestContext, null, item, options)
    }
}
