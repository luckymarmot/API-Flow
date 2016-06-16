import Immutable from 'immutable'
import BaseImporter from '../base-importer/BaseImporter'

import Context, {
    Parameter,
    ParameterContainer
} from '../../../models/Core'

import Auth from '../../../models/Auth'
import Constraint from '../../../models/Constraint'
import URL from '../../../models/URL'
import Group from '../../../models/Group'
import Request from '../../../models/Request'

import JSONSchemaReference from '../../../models/references/JSONSchema'
import ReferenceContainer from '../../../models/references/Container'
import ReferenceCache from '../../../models/references/Cache'

@registerImporter // eslint-disable-line
export default class DummyImporter extends BaseImporter {
    static identifier = 'com.luckymarmot.PawExtensions.DummyImporter';
    static title = 'Dummy Importer';

    static fileExtensions = [];
    static inputs = [];

    constructor() {
        super()
        this.ENVIRONMENT_DOMAIN_NAME = 'Dummy Environments'
    }

    canImport(context, items) {
        let sum = 0
        for (let item of items) {
            sum += ::this._canImportItem(context, item)
        }
        return items.length > 0 ? sum / items.length : 0
    }

    _canImportItem(context, item) {
        if (item.file) {
            let name = item.file.name || ''
            return name.split('.').slice(-1)[0] === '.dummy' ? 1 : 0
        }
        return 0
    }

    /*
      @params:
        - context
        - items
        - options
    */
    createRequestContexts(context, items) {
        let currentReqContext = new Context({
            group: new Group({
                name: 'API-Flow',
                children: new Immutable.OrderedMap({
                    0: new Group({
                        id: '0',
                        name: 'Nested Group',
                        children: new Immutable.OrderedMap({
                            get: new Request({
                                name: 'Simple GET Request',
                                url: new URL(
                                    'https://echo.luckymarmot.com/users'
                                ),
                                method: 'GET',
                                description: 'gets all the users'
                            }),
                            post: new Request({
                                name: 'Simple POST Request',
                                url: new URL(
                                    'https://echo.luckymarmot.com/users/create'
                                ),
                                method: 'GET',
                                parameters: new ParameterContainer({
                                    queries: new Immutable.List([
                                        new Parameter({
                                            key: 'name',
                                            name: 'Username',
                                            type: 'string',
                                            internals: new Immutable.List([
                                                new Constraint.MaximumLength(9),
                                                new Constraint.MinimumLength(4)
                                            ])
                                        })
                                    ])
                                }),
                                description: 'creates a user'
                            })
                        })
                    }),
                    1: new Group({
                        id: '1',
                        name: 'Another Nested Group',
                        children: new Immutable.OrderedMap({
                            123: new Request({
                                id: '123',
                                name: 'get a list of songs',
                                url: new URL(
                                    'https://echo.luckymarmot.com/songs'
                                ),
                                method: 'GET',
                                parameters: new ParameterContainer({
                                    headers: new Immutable.List([
                                        new Parameter({
                                            key: 'Accept',
                                            name: 'Accept',
                                            value: 'utf-8',
                                            type: 'string',
                                            internals: new Immutable.List([
                                                new Constraint.Enum([ 'utf-8' ])
                                            ])
                                        })
                                    ])
                                }),
                                auths: new Immutable.List([
                                    new Auth.Basic({
                                        username: 'username'
                                    })
                                ])
                            })
                        })
                    }),
                    234: new Request({
                        id: '234',
                        name: 'A UrlEncoded Request',
                        method: 'POST',
                        url: new URL(
                            'https://echo.luckymarmot.com/charts'
                        ),
                        parameters: new ParameterContainer({
                            body: new Immutable.List([
                                new Parameter({
                                    key: 'limit',
                                    name: 'Song Limit',
                                    type: 'integer',
                                    internals: new Immutable.List([
                                        new Constraint.Maximum(100)
                                    ])
                                }),
                                new Parameter({
                                    key: 'sequence',
                                    name: 'A sequence param',
                                    type: 'string',
                                    format: 'sequence',
                                    value: new Immutable.List([
                                        new Parameter({
                                            type: 'string',
                                            value: 'a simple ',
                                            internals: new Immutable.List([
                                                new Constraint.Enum([
                                                    'a simple'
                                                ])
                                            ])
                                        }),
                                        new Parameter({
                                            key: 'param',
                                            name: 'Param',
                                            type: 'reference',
                                            value: new JSONSchemaReference({
                                                uri: '#/dummy/param',
                                                relative: '#/dummy/param'
                                            })
                                        })
                                    ])
                                })
                            ])
                        })
                    })
                })
            }),
            references: new Immutable.OrderedMap({
                dummy: new ReferenceContainer({
                    name: 'dummy',
                    cache: new Immutable.OrderedMap({
                        '#/dummy/param': new ReferenceCache({
                            cached: new JSONSchemaReference({
                                uri: '#/dummy/param',
                                relative: '#/dummy/param',
                                resolved: true,
                                value: {
                                    type: 'integer',
                                    minimum: 10,
                                    maximum: 500
                                }
                            })
                        })
                    })
                })
            })
        })

        let current = {
            context: currentReqContext,
            items: [ items ]
        }

        return [ current ]
    }

    import(context, items, options) {
        this.context = context

        let result = this.createRequestContexts(
            context,
            items,
            options
        )

        this._importPawRequests(
            result[0].context,
            items[0],
            options
        )

        if (options && options.order) {
            options.order += 1
        }

        return true
    }
}
