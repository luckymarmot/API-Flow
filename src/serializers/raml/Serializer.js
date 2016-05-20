// import Immutable from 'immutable'
import BaseSerializer from '../BaseSerializer'

export default class RAMLSerializer extends BaseSerializer {
    serialize(context) {
        let content = '#%RAML 0.8'
        let structure = this._formatStructure(context)

        content += JSON.stringify(structure)

        return content
    }

    _formatStructure(context) {
        let structure = {}
        let basicInfo = this._formatBasicInfo(context)
        let urlInfo = ::this.formatURLInfo(context)

        Object.assign(structure, basicInfo, urlInfo)

        return structure
    }

    _formatBasicInfo(context) {
        let info = context.get('info')
        let infos = {}

        if (info.get('title')) {
            infos.title = info.get('title')
        }

        let documentation = []

        if (info.get('description')) {
            documentation.push({
                title: 'Description',
                content: info.get('description')
            })
        }

        if (info.get('tos')) {
            documentation.push({
                title: 'Terms of Service',
                content: info.get('tos')
            })
        }

        if (info.get('contact')) {
            documentation.push({
                title: 'Contact',
                content: this._formatContact(info.get('contact'))
            })
        }

        if (info.get('license')) {
            documentation.push({
                title: 'License',
                content: this._formatLicense(info.get('license'))
            })
        }

        if (info.get('version') !== null) {
            infos.version = info.get('version')
        }

        return infos
    }

    _formatContact(contact) {
        let formatted = ''

        if (contact.get('name')) {
            formatted += 'name: ' + contact.get('name')
        }

        if (contact.get('url')) {
            formatted += 'url: ' + contact.get('url')
        }

        if (contact.get('email')) {
            formatted += 'email: ' + contact.get('email')
        }

        return formatted
    }

    _formatLicense(license) {
        let formatted = ''

        if (license.get('name')) {
            formatted += 'name: ' + license.get('name')
        }

        if (license.get('url')) {
            formatted += 'url: ' + license.get('url')
        }

        return formatted
    }

    _formatURLInfo(context) {
        let urlInfo = {}
        let group = context.get('group')

        if (group) {
            let requests = group.getRequests()

            let protocolSet = {}
            let origin = null
            let base = {}
            let path = {}

            let mergedURL = new URL()
            requests.forEach(request => {
                let url = request.get('url')
                protocolSet = this._updateProtocols(protocolSet, url)
                mergedURL = mergedURL.merge(url)
            })

            let protocols = Object.keys(protocolSet)

            if (requests.size > 0) {
                let url = requests.get(0).get('url')
                let host = this._generateSequenceParam(url, 'host')
                let protocol = protocols[0] || 'http'
                origin = protocol + '://' + host
                base = this
                    ._formatURIParameters(
                        url.get('host'),
                        'baseUriParameters'
                    )
                path = this
                    ._formatURIParameters(
                        url.get('pathname'),
                        'uriParameters'
                    )
            }

            if (protocols.length > 0) {
                urlInfo.protocols = protocols
            }

            if (origin) {
                urlInfo.baseURI = origin
            }

            Object.assign(urlInfo, base)
            Object.assign(urlInfo, path)
        }

        return urlInfo
    }

    _updateProtocols(protocols, url) {
        if (Object.keys(protocols).length === 2) {
            // all possible protocols are used
            return protocols
        }

        const validProtocols = {
            http: true,
            https: true
        }

        let protoParam = url.get('protocol')
        let result = protocols || {}

        if (protoParam) {
            let schema = protoParam.getJSONSchema()
            let _protocols = schema.enum
            for (let protocol of _protocols) {
                if (validProtocols[protocol]) {
                    result[protocol] = true
                }
            }
        }

        return result
    }

    _generateSequenceParam(url, key) {
        let param = url.get(key)

        if (param.get('format') !== 'sequence') {
            return param.generate()
        }

        let schema = param.getJSONSchema()

        if (!schema['x-sequence']) {
            return param.generate()
        }

        for (let sub of schema['x-sequence']) {
            if (sub['x-title']) {
                sub.enum = [ '{' + sub['x-title'] + '}' ]
            }
        }

        let generated = param.generate(false, schema)
        return generated
    }

    _formatURIParameters(param, target) {
        let result = {}
        if (param.get('format') !== 'sequence') {
            return result
        }

        let schema = param.getJSONSchema()

        if (!schema['x-sequence']) {
            return result
        }

        result[target] = {}
        for (let sub of schema['x-sequence']) {
            if (sub['x-title']) {
                let named = this._convertJSONSchemaToNamedParameter(sub)
                result[target][sub['x-title']] = named
            }
        }

        return result
    }

    _convertJSONSchemaToNamedParameter(schema) {
        if (!schema['x-title']) {
            return null
        }

        let named = {}

        let validFields = {
            'x-title': 'displayName',
            description: 'description',
            type: 'type',
            enum: 'enum',
            pattern: 'pattern',
            minLength: 'minLength',
            maxLength: 'maxLength',
            minimum: 'minimum',
            maximum: 'maximum'
        }

        let keys = Object.keys(schema)
        for (let key of keys) {
            if (validFields[key]) {
                named[validFields[key]] = schema[key]
            }
        }

        let param = {}
        param[schema['x-title']] = named
        return param
    }

    _convertParameterToNamedParameter(param) {
        let schema = param.getJSONSchema(false)
        let named = this._convertJSONSchemaToNamedParameter(schema)

        let externalValidFields = {
            required: 'required',
            example: 'example'
        }

        let keys = Object.keys(externalValidFields)
        for (let key of keys) {
            if (
                typeof param.get(key) !== 'undefined' &&
                param.get(key) !== null
            ) {
                named[externalValidFields[key]] = param.get(key)
            }
        }
    }
}
