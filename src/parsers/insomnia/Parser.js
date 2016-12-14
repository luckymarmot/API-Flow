import Immutable from 'immutable'

import Context, {
    Parameter,
    ParameterContainer
} from '../../models/Core'

import Constraint from '../../models/Constraint'

import ReferenceContainer from '../../models/references/Container'
import LateResolutionReference from '../../models/references/LateResolution'

import {
    Info
} from '../../models/Utils'

import URL from '../../models/URL'
import Group from '../../models/Group'
import Request from '../../models/Request'

import Auth from '../../models/Auth'

export default class InsomniaParser {
    static format = 'insomnia'
    static version = 3

    static detect(content) {
        let detection = {
            format: InsomniaParser.format,
            version: InsomniaParser.version,
            score: 0
        }

        let insomnia
        try {
            insomnia = JSON.parse(content)
        }
        catch (jsonParseError) {
            return [detection]
        }

        if (insomnia) {
            let score = 0
            score += insomnia._type === 'export' ? 1 / 2 : 0
            score += insomnia.__export_format === 3 ? 1 / 2 : 0
            score = score < 1 ? score : 1
            detection.score = score
        }

        return [detection]
    }

    static getAPIName(content) {
        let insomnia
        try {
            insomnia = JSON.parse(content)
        }
        catch (jsonParseError) {
            return null
        }

        let workspace = insomnia.resources.find(resource => {
            return resource._type === 'workspace'
        })
        return workspace ? workspace.name : null
    }

    constructor() {
        this.context = new Context()
        this.references = new Immutable.List()
    }

    detect() {
        return InsomniaParser.detect(...arguments)
    }

    getAPIName() {
        return InsomniaParser.getAPIName(...arguments)
    }

    parse(item) {
        let obj
        try {
            obj = JSON.parse(item.content)
        }
        catch (e) {
            throw new Error('Invalid Insomnia file (not a valid JSON)')
        }

        this.context = this._createContext(obj.resources || [])
        return this.context
    }

    _createContext(root) {
        let requests = this._extractRequests(root)
        let info = this._extractInfo(root)

        let context = new Context({
            // TODO: references: references,
            // TODO: group: group,
            info: info,
            requests: new Immutable.OrderedMap(requests)
        })

        return context
    }

    _extractInfo() {
        return new Info({
            title: 'Insomnia Import',
            description: null
        })
    }

    _extractRequests(root) {
        let reqs = this._findResourcesOfType(root, 'request')
        let requests = Immutable.List()

        reqs.map(req => {
            requests.push(this._extractRequest(req))
        })

        return requests
    }

    _extractRequest(req) {
        let request = new Request({
            id: req._id || null,
            name: req.name,
            description: req.description || null,
            method: req.method || 'GET',
            url: this._extractUrl(req.url),
            auths: this._extractAuths(req.authentication),
            bodies: this._extractBodies(req.headers),
            parameters: this._extractParameters(req.body)
        })

        return request
    }

    _extractUrl(urlString) {
        let url = new URL(urlString)
        return url
    }

    _extractAuths(authentication) {
        let auths = Immutable.List()

        if (authentication.username) {
            auths.push(
                new Auth.Basic({
                    username: authentication.username,
                    password: authentication.password
                })
            )
        }

        return auths
    }

    _extractBodies() {
        // TODO
        return Immutable.List()
    }

    _extractParameters() {
        // TODO
        return new ParameterContainer()
    }

    _findResourcesOfType(root, type) {
        if (!root.resources) {
            return []
        }

        return root.resources.map(resource => resource._type === type)
    }
}
