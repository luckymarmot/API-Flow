import Immutable from 'immutable'

import Context, {
    Parameter,
    ParameterContainer
} from '../../models/Core'

import Constraint from '../../models/Constraint'

import ReferenceContainer from '../../models/references/Container'
import LateResolutionReference from '../../models/references/LateResolution'
import ExoticReference from '../../models/references/Exotic'

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
            parameters: new ParameterContainer({
                queries: this._extractQueries(req.parameters),
                headers: this._extractHeaders(req.headers),
                body: this._extractBody(req.body)
            })
        })

        return request
    }

    _extractUrl(urlString) {
        if (!urlString.match(/:\/\//)) {
            return new URL(`http://${urlString}`)
        }
        else {
            return new URL(urlString)
        }
    }

    _extractQueries(parameters) {
        let queries = Immutable.List()
        for (let param of parameters) {
            queries.push(new Parameter({
                key: param.name,
                name: param.name,
                value: param.value,
                type: 'string'
            }))
        }

        return queries
    }

    _extractBody(body) {
        if (body.mimeType === 'multipart/form-data') {
            let params = Immutable.List()
            let enabledParams = body.params.filter(param => !param.disabled)
            for (let param of enabledParams) {
                if (param.fileName) {
                    let ref = new ExoticReference({
                        uri: param.fileName,
                        relative: param.fileName
                    })
                    params.push(new Parameter({
                        key: param.name,
                        name: param.name,
                        value: ref,
                        type: 'reference'
                    }))
                }
                else {
                    params.push(new Parameter({
                        key: param.name,
                        name: param.name,
                        value: param.value,
                        type: 'string'
                    }))
                }
            }

            return params
        }
        else if (body.mimeType === 'application/x-www-form-urlencoded') {
            let params = Immutable.List()
            let enabledParams = body.params.filter(param => !param.disabled)
            for (let param of enabledParams) {
                params.push(new Parameter({
                    key: param.name,
                    name: param.name,
                    value: param.value,
                    type: 'string'
                }))
            }

            return params
        }
        else if (body.fileName) {
            let ref = new ExoticReference({
                uri: body.fileName,
                relative: body.fileName
            })

            return Immutable.List.of(
                new Parameter({
                    key: 'body',
                    name: 'body',
                    type: 'reference',
                    value: ref
                })
            )
        }
        else if (body.text) {
            return Immutable.List.of(
                new Parameter({
                    key: 'body',
                    name: 'body',
                    type: 'string',
                    value: body.text
                })
            )
        }
        else {
            return Immutable.List()
        }
    }

    _extractHeaders(headers) {
        return headers.map(header => new Parameter({
            key: header.name,
            value: header.value,
            type: 'string'
        }))
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

    _findResourcesOfType(root, type) {
        if (!root.resources) {
            return []
        }

        return root.resources.map(resource => resource._type === type)
    }
}
