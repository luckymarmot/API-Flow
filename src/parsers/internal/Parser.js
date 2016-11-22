import Immutable from 'immutable'

import Model from '../../models/ModelInfo'
import Context, {
    ParameterContainer,
    Parameter,
    Body,
    Response
} from '../../models/Core'
import { Info, License, Contact } from '../../models/Utils'
import Group from '../../models/Group'
import Request from '../../models/Request'
import URL from '../../models/URL'
import Auth from '../../models/Auth'
import Constraint from '../../models/Constraint'

import ReferenceContainer from '../../models/references/Container'
import ReferenceCache from '../../models/references/Cache'
import Reference from '../../models/references/Reference'
import ExoticReference from '../../models/references/Exotic'
import JSONSchemaReference from '../../models/references/JSONSchema'
import LateResolutionReference from '../../models/references/LateResolution'

export default class InternalParser {
    static format = '__internal__'
    static version = 'v0.1.0'

    static detect(content) {
        let detection = {
            format: InternalParser.format,
            version: InternalParser.version,
            score: 0
        }

        let internal
        try {
            internal = JSON.parse(content)
        }
        catch (jsonParseError) {
            return [ detection ]
        }
        if (typeof internal === 'object') {
            let score = 0
            /* eslint-disable no-extra-paren */
            score += internal._model ? 1 / 2 : 0
            score += (internal._model || {}).version === '0.1.0' ? 1 / 2 : 0
            score = score < 1 ? score : 1
            detection.score = score
            return [ detection ]
            /* eslint-enable no-extra-paren */
        }
        return [ detection ]
    }

    static getAPIName(content) {
        let internal
        try {
            internal = JSON.parse(content)
        }
        catch (jsonParseError) {
            return null
        }

        return ((internal || {}).info || {}).title || null
    }

    constructor() {
        this.classMap = {
            'context.core.models': ::this._extractContext,
            'info.utils.models': ::this._extractInfo,
            'license.utils.models': ::this._extractLicense,
            'contact.utils.models': ::this._extractContact,
            'group.models': ::this._extractGroup,
            'request.models': ::this._extractRequest,
            'url.models': ::this._extractURL,
            'parameter-container.core.models':
                ::this._extractParameterContainer,
            'parameter.core.models': ::this._extractParameter,
            'basic.auth.models': ::this._extractBasicAuth,
            'digest.auth.models': ::this._extractDigestAuth,
            'ntlm.auth.models': ::this._extractNTLMAuth,
            'negotiate.auth.models': ::this._extractNegotiateAuth,
            'api-key.auth.models': ::this._extractApiKeyAuth,
            'oauth-1.auth.models': ::this._extractOAuth1Auth,
            'oauth-2.auth.models': ::this._extractOAuth2Auth,
            'aws-sig-4.auth.models': ::this._extractAWSSig4Auth,
            'hawk.auth.models': ::this._extractHawkAuth,
            'body.core.models': ::this._extractBody,
            'response.core.models': ::this._extractResponse,
            'constraint.constraint.models': ::this._extractConstraint,
            'multiple-of.constraint.models':
                ::this._extractMultipleOfConstraint,
            'maximum.constraint.models': ::this._extractMaximumConstraint,
            'exclusive-maximum.constraint.models':
                ::this._extractExclusiveMaximumConstraint,
            'minimum.constraint.models': ::this._extractMinimumConstraint,
            'exclusive-minimum.constraint.models':
                ::this._extractExclusiveMinimumConstraint,
            'maximum-length.constraint.models':
                ::this._extractMaximumLengthConstraint,
            'minimum-length.constraint.models':
                ::this._extractMinimumLengthConstraint,
            'pattern.constraint.models': ::this._extractPatternConstraint,
            'maximum-items.constraint.models':
                ::this._extractMaximumItemsConstraint,
            'minimum-items.constraint.models':
                ::this._extractMinimumItemsConstraint,
            'unique-items.constraint.models':
                ::this._extractUniqueItemsConstraint,
            'maximum-properties.constraint.models':
                ::this._extractMaximumPropertiesConstraint,
            'minimum-properties.constraint.models':
                ::this._extractMinimumPropertiesConstraint,
            'enum.constraint.models': ::this._extractEnumConstraint,
            'reference-container.references.models':
                ::this._extractReferenceContainer,
            'reference-cache.references.models':
                ::this._extractReferenceCache,
            'exotic.references.models': ::this._extractExoticReference,
            'json-schema.references.models': ::this._extractJSONSchemaReference,
            'late-resolution.references.models':
                ::this._extractLateResolutionReference,
            'reference.references.models': ::this._extractReference
        }
    }

    detect() {
        return this.constructor.detect(...arguments)
    }

    getAPIName() {
        return InternalParser.getAPIName(...arguments)
    }

    // @tested
    parse(item) {
        let obj
        try {
            obj = JSON.parse(item.content)
        }
        catch (e) {
            throw new Error('Invalid Internal file (not a valid JSON)')
        }

        let context = this._extract(obj)

        return context
    }

    _extract(obj) {
        const classMap = this.classMap

        if (obj && obj._model && classMap[obj._model.name]) {
            obj._model = new Model(obj._model)
            return classMap[obj._model.name](obj)
        }

        return obj
    }

    _extractContext(obj) {
        let references = {}
        let requests = {}

        if (obj.references) {
            let refs = Object.keys(obj.references || {})
            for (let ref of refs) {
                references[ref] = this._extract(obj.references[ref])
            }
        }

        if (obj.requests) {
            let reqs = Object.keys(obj.requests || {})
            for (let req of reqs) {
                requests[req] = this._extract(obj.requests[req])
            }
        }

        const context = new Context({
            requests: new Immutable.OrderedMap(requests),
            group: this._extract(obj.group),
            references: new Immutable.OrderedMap(references),
            info: this._extract(obj.info)
        })
        return context
    }

    _extractInfo(_obj) {
        let obj = _obj
        obj.contact = this._extract(obj.contact)
        obj.license = this._extract(obj.license)

        const info = new Info(obj)
        return info
    }

    _extractLicense(obj) {
        return new License(obj)
    }

    _extractContact(obj) {
        return new Contact(obj)
    }

    _extractGroup(obj) {
        let children = {}

        if (obj.children) {
            let refs = Object.keys(obj.children || {})
            for (let ref of refs) {
                children[ref] = this._extract(obj.children[ref])
            }
        }

        const group = new Group({
            id: obj.id,
            name: obj.name,
            children: new Immutable.OrderedMap(children)
        })

        return group
    }

    _extractRequest(_obj) {
        let obj = _obj
        obj.url = this._extract(obj.url)
        obj.parameters = this._extract(obj.parameters)

        if (obj.bodies) {
            obj.bodies = new Immutable.List(obj.bodies.map(body => {
                return this._extract(body)
            }))
        }

        if (obj.auths) {
            obj.auths = new Immutable.List(obj.auths.map(auth => {
                return this._extract(auth)
            }))
        }

        if (obj.responses) {
            obj.responses = new Immutable.List(obj.responses.map(res => {
                return this._extract(res)
            }))
        }

        if (obj.tags) {
            obj.tags = new Immutable.List(obj.tags)
        }

        const request = new Request(obj)
        return request
    }

    _extractURL(_obj) {
        let obj = _obj

        let keys = Object.keys(obj)
        for (let key of keys) {
            obj[key] = this._extract(obj[key])
        }

        let url = new URL(obj)
        return url
    }

    _extractParameterContainer(_obj) {
        let obj = _obj

        if (obj.headers) {
            obj.headers = new Immutable.List(obj.headers.map(header => {
                return this._extract(header)
            }))
        }

        if (obj.queries) {
            obj.queries = new Immutable.List(obj.queries.map(query => {
                return this._extract(query)
            }))
        }

        if (obj.body) {
            obj.body = new Immutable.List(obj.body.map(body => {
                return this._extract(body)
            }))
        }

        if (obj.path) {
            obj.path = new Immutable.List(obj.path.map(path => {
                return this._extract(path)
            }))
        }

        let container = new ParameterContainer(obj)
        return container
    }

    _extractParameter(_obj) {
        let obj = _obj
        if (Object.prototype.toString.call(obj.value) === '[object Array]') {
            obj.value = new Immutable.List(obj.value.map(value => {
                return this._extract(value)
            }))
        }
        else {
            obj.value = this._extract(obj.value)
        }

        if (obj.internals) {
            obj.internals = new Immutable.List(obj.internals.map(internal => {
                const _internal = this._extract(internal)
                return _internal
            }))
        }

        if (obj.externals) {
            obj.externals = new Immutable.List(obj.externals.map(external => {
                return this._extract(external)
            }))
        }

        return new Parameter(obj)
    }

    _extractBasicAuth(obj) {
        return new Auth.Basic(obj)
    }

    _extractDigestAuth(obj) {
        return new Auth.Digest(obj)
    }

    _extractNTLMAuth(obj) {
        return new Auth.NTLM(obj)
    }

    _extractNegotiateAuth(obj) {
        return new Auth.Negotiate(obj)
    }

    _extractApiKeyAuth(obj) {
        return new Auth.ApiKey(obj)
    }

    _extractOAuth1Auth(obj) {
        return new Auth.OAuth1(obj)
    }

    _extractOAuth2Auth(_obj) {
        let obj = _obj

        if (obj.scopes) {
            obj.scopes = new Immutable.List(obj.scopes)
        }

        return new Auth.OAuth2(obj)
    }

    _extractAWSSig4Auth(obj) {
        return new Auth.AWSSig4Auth(obj)
    }

    _extractHawkAuth(obj) {
        return new Auth.Hawk(obj)
    }

    _extractBody(_obj) {
        let obj = _obj
        if (obj.constraints) {
            obj.constraints = new Immutable.List(obj.constraints.map(constr => {
                return this._extract(constr)
            }))
        }

        return new Body(obj)
    }

    _extractResponse(_obj) {
        let obj = _obj
        if (obj.parameters) {
            obj.parameters = this._extract(obj.parameters)
        }

        if (obj.bodies) {
            obj.bodies = new Immutable.List(obj.bodies.map(body => {
                return this._extract(body)
            }))
        }

        return new Response(obj)
    }

    _extractConstraint(obj) {
        return new Constraint.Constraint(obj)
    }

    _extractMultipleOfConstraint(obj) {
        return new Constraint.MultipleOf(obj.value)
    }

    _extractMaximumConstraint(obj) {
        return new Constraint.Maximum(obj.value)
    }

    _extractExclusiveMaximumConstraint(obj) {
        return new Constraint.ExclusiveMaximum(obj.value)
    }

    _extractMinimumConstraint(obj) {
        return new Constraint.Minimum(obj.value)
    }

    _extractExclusiveMinimumConstraint(obj) {
        return new Constraint.ExclusiveMinimum(obj.value)
    }

    _extractMaximumLengthConstraint(obj) {
        return new Constraint.MaximumLength(obj.value)
    }

    _extractMinimumLengthConstraint(obj) {
        return new Constraint.MinimumLength(obj.value)
    }

    _extractPatternConstraint(obj) {
        return new Constraint.Pattern(obj.value)
    }

    _extractMaximumItemsConstraint(obj) {
        return new Constraint.MaximumItems(obj.value)
    }

    _extractMinimumItemsConstraint(obj) {
        return new Constraint.MinimumItems(obj.value)
    }

    _extractUniqueItemsConstraint(obj) {
        return new Constraint.UniqueItems(obj.value)
    }

    _extractMaximumPropertiesConstraint(obj) {
        return new Constraint.MaximumProperties(obj.value)
    }

    _extractMinimumPropertiesConstraint(obj) {
        return new Constraint.MinimumProperties(obj.value)
    }

    _extractEnumConstraint(obj) {
        return new Constraint.Enum(obj.value)
    }

    _extractReferenceContainer(_obj) {
        let obj = _obj

        const cache = {}
        if (obj.cache) {
            let keys = Object.keys(obj.cache)
            for (let key of keys) {
                cache[key] = this._extract(obj.cache[key])
            }
        }
        obj.cache = new Immutable.OrderedMap(cache)

        return new ReferenceContainer(obj)
    }

    _extractReferenceCache(_obj) {
        let obj = _obj

        const resolved = {}
        if (obj.resolved) {
            let keys = Object.keys(obj.resolved)
            for (let key of keys) {
                resolved[key] = this._extract(obj.resolved[key])
            }
        }

        if (obj.cached) {
            obj.cached = this._extract(obj.cached)
        }

        return new ReferenceCache(obj)
    }

    _extractReference(_obj) {
        let obj = _obj
        if (obj.dependencies) {
            obj.dependencies = new Immutable.List(obj.dependencies)
        }

        return new Reference(obj)
    }

    _extractExoticReference(_obj) {
        let obj = _obj
        if (obj.dependencies) {
            obj.dependencies = new Immutable.List(obj.dependencies)
        }
        return new ExoticReference(obj)
    }

    _extractJSONSchemaReference(_obj) {
        let obj = _obj
        if (obj.dependencies) {
            obj.dependencies = new Immutable.List(obj.dependencies)
        }
        return new JSONSchemaReference(obj)
    }

    _extractLateResolutionReference(_obj) {
        let obj = _obj
        if (obj.dependencies) {
            obj.dependencies = new Immutable.List(obj.dependencies)
        }

        return new LateResolutionReference(obj)
    }
}
