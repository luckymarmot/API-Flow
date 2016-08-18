import Immutable from 'immutable'

import ShellTokenizer from '../../utils/ShellTokenizer'

import ExoticReference from '../../models/references/Exotic'
import Constraint from '../../models/Constraint'
import Auth from '../../models/Auth'
import URL from '../../models/URL'
import Context, {
    Parameter,
    ParameterContainer
} from '../../models/Core'
import Request from '../../models/Request'
import Group from '../../models/Group'

import PawParser from '../paw/Parser'

class PawContext extends Immutable.Record({
    _groups: Immutable.Map(),
    _requests: Immutable.Map(),
    _envVariables: Immutable.Map()
}) {
    getRequestGroupById() {
        throw new Error('getRequestGroupById is not yet implemented')
    }
    getEnvironmentVariableById() {
        throw new Error('getEnvironmentVariableById is not yet implemented')
    }
    getEnvironmentVariableById(uuid) {
        return this.getIn([ '_envVariables', uuid ], null)
    }
}

class PawEnvVariable extends Immutable.Record({
    //
}) {
    getCurrentValue() {
        //
    }
}

class PawParameter extends Immutable.Record({
    uuid: null,
    enabled: null,
    name: null,
    value: null
}) {
    constructor(uuid, map) {
        const obj = map.get(uuid)
        super({
            uuid: uuid,
            enabled: obj.get('isEnabled', true),
            name: fromRef(map, obj.get('name')),
            value: fromRef(map, obj.get('value'))
        })
    }
}

class PawDV extends Immutable.Record({
    uuid: null,
    identifier: null,
    props: null
}) {
    constructor(uuid, map) {
        const obj = map.get(uuid)
        const d = { uuid: uuid, identifier: obj.get('identifier') }
        const props = obj.filter(key => key !== 'identifier' &&
                                        key.indexOf('_') !== 0)
                         .map((key, mapItem) => {
            if (mapItem === null ||
                typeof mapItem === 'string' ||
                typeof mapItem === 'number') {
                d.key = mapItem
            } else {
                // @TODO handle arrays
                d.key = fromRef(map, mapItem)
            }
        })
        super(d)
        this._defineProps()
    }
    _defineProps() {
        Object.defineProperty(this, 'type', {
            get: () => {
                return this.get('identifier')
            }
        })
    }
    getEvaluatedString() {
        return ''
    }
}

class PawDS extends Immutable.Record({
    uuid: null,
    strings: null
}) {
    constructor(uuid, map) {
        const obj = map.get(uuid)
        const mapStrings = obj.get('strings')
        const strings = mapStrings.map(mapItem => {
            if (typeof mapItem === 'string') {
                return mapItem
            } else {
                return fromRef(map, mapItem)
            }
        })
        super({
            uuid: uuid,
            strings: strings
        })
        this._defineProps()
    }
    _defineProps() {
        Object.defineProperty(this, 'components', {
            get: () => {
                return this.get('strings')
            }
        })
        Object.defineProperty(this, 'length', {
            get: () => {
                return this.get('strings').size
            }
        })
    }
    getComponentAtIndex(idx) {
        return this.getIn([ 'strings', idx ])
    }
    getEvaluatedString() {
        return this.get('strings').reduce((r, s) => {
            if (typeof s === 'string') {
                return r + s
            } else {
                return r
            }
        }, '')
    }
    getOnlyDynamicValue() {
        const strings = this.get('strings')
        if (strings.size !== 1 ||
            typeof strings.get(0) !== 'object') {
            return null
        }
        return strings.first()
    }
}

class PawGroup extends Immutable.Record({
    children: null
}) {
    constructor(uuid, map) {
        const obj = map.get(uuid)
        const mapChildren = obj.get('children')
        const children = mapChildren.map(mapChild => {
            return fromRef(map, mapChild)
        })
        super({
            children: children
        })
    }
}

class PawRequest extends Immutable.Record({
    uuid: null,
    map: null,
    obj: null
}) {
    constructor(uuid, map) {
        super({
            uuid: uuid,
            map: map,
            obj: map.get(uuid)
        })
        this._defineProps()
    }
    _defineProps() {
        Object.defineProperty(this, 'id', {
            get: () => {
                return this.get('uuid')
            }
        })
    }
    _getProp(prop, returnDynamic) {
        const ds = fromRef(this.get('map'), this.getIn([ 'obj', prop ], null))
        if (ds === null) {
            return null
        }
        if (!returnDynamic) {
            return ds.getEvaluatedString()
        }
        return ds
    }
    getUrlBase(returnDynamic) {
        return this._getProp('urlFull', returnDynamic)
    }
    getBody(returnDynamic) {
        return this._getProp('bodyString', returnDynamic)
    }
    _getKeyValueBody(identifier, returnDynamic) {
        const body = this.getBody()
        if (body === null) {
            return null
        }
        const dv = body.getOnlyDynamicValue()
        if (dv === null) {
            return null
        }
        if (dv.get('identifier') !== identifier) {
            return null
        }
        let d = {}
        d.get('keyValues').forEach(param => {
            if (param.get('enabled')) {
                d[param.get('name')] = param.get('value')
            }
        })
        return d
    }
    getUrlEncodedBody(returnDynamic) {
        return this._getKeyValueBody('com.luckymarmot.BodyFormKeyValueDynamicValue', returnDynamic)
    }
    getMultipartBody(returnDynamic) {
        return this._getKeyValueBody('com.luckymarmot.BodyMultipartFormDataDynamicValue', returnDynamic)
    }
    _getRefMap(key, returnDynamic) {
        const mapHeaders = this.getIn([ 'obj', key ], null)
        let d = {}
        mapHeaders.forEach(headerRef => {
            const param = fromRef(this.get('map'), headerRef)
            if (param.get('enabled')) {
                d[param.get('name')] = param.get('value')
            }
        })
        return d
    }
    getHeaders(returnDynamic) {
        return this._getRefMap('headers', returnDynamic)
    }
    getUrlParameters(returnDynamic) {
        return this._getRefMap('urlParameters', returnDynamic)
    }
    getHttpBasicAuth(returnDynamic) {
        // @TODO
        return null
    }
    getOAuth1(returnDynamic) {
        // @TODO
        return null
    }
    getOAuth2(returnDynamic) {
        // @TODO
        return null
    }
}

function fromRef(map, ref) {
    if (ref === null) {
        return null
    }
    const uuid = ref.get('ref')
    const obj = map.get(uuid, null)
    if (obj === null) {
        throw new Error('Broken reference') // @TODO remove throw and ignore
        return null
    }
    const t = obj.get('_type', null)
    if (t === 'request') {
        return new PawRequest(uuid, map)
    } else if (t === 'group') {
        return new PawGroup(uuid, map)
    } else if (t === 'dynamicString') {
        return new PawDS(uuid, map)
    } else if (t === 'dynamicValue') {
        return new PawDV(uuid, map)
    } else if (t === 'parameter') {
        return new PawParameter(uuid, map)
    } else {
        throw new Error('Reference to an unknown type: ' + t)
        return null
    }
}

export default class PawCloudParser {
    constructor() {
        this.map = null
        this.pawCtx = null
    }
    parse(item) {
        const input = Immutable.fromJS(JSON.parse(item.content))
        const pawCtx = this._generatePawCtx(input)
        const pawParser = new PawParser()
        return pawParser.generate(pawCtx, pawCtx.get('_requests').toArray(), {})
    }

    _generatePawCtx(input) {
        const map = input.getIn([ 'manifest', 'patch', 'add' ], null)
        if (map === null) {
            throw new Error('Invalid Paw Cloud manifest')
        }
        const mapRoot = map.get('root', null)
        if (mapRoot === null) {
            throw new Error('Paw Cloud manifest does not have a root object')
        }
        this.map = map
        this.pawCtx = new PawContext()
        this._addRequests(mapRoot)
        return this.pawCtx
    }

    _addRequests(mapRoot) {
        const mapRequests = mapRoot.get('requests', Immutable.List())
        mapRequests.forEach(ref => {
            this._addGroupItem(ref)
        })
    }

    _addGroupItem(ref) {
        const item = fromRef(this.map, ref)
        if (item.constructor.name === PawRequest.name) {
            this.pawCtx = this.pawCtx.setIn(
                [ '_requests', item.get('uuid') ],
                item
            )
        } else {
            this.pawCtx = this.pawCtx.setIn(
                [ '_groups', item.get('uuid') ],
                item
            )
        }
    }
}
