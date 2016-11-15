import Immutable from 'immutable'

import Model from './ModelInfo'

export class Contact extends Immutable.Record({
    _model: new Model({
        name: 'contact.utils.models',
        version: '0.1.0'
    }),
    name: null,
    url: null,
    email: null
}) { }

export class License extends Immutable.Record({
    _model: new Model({
        name: 'license.utils.models',
        version: '0.1.0'
    }),
    name: null,
    url: null
}) { }

export class Info extends Immutable.Record({
    _model: new Model({
        name: 'info.utils.models',
        version: '0.1.0'
    }),
    title: null,
    description: null,
    tos: null,
    contact: null,
    license: null,
    version: null
}) { }
