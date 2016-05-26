import Immutable from 'immutable'

import {
    ParameterContainer
} from './Core'

import URL from './URL'


export default class Request extends Immutable.Record({
    id: null,
    name: null,
    description: null,
    url: new URL(),
    method: null,
    parameters: new ParameterContainer(),
    bodies: Immutable.List(),
    auths: Immutable.List(),
    responses: Immutable.List(),
    timeout: null,
    tags: Immutable.List()
}) {
    getUrl(scheme) {
        return this.get('url').getUrl(scheme)
    }

    decomposeUrl(url) {
        return this.get('url').decomposeUrl(url)
    }
}
