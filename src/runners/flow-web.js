import SwaggerParser from '../parsers/swagger/Parser'
import RAMLParser from '../parsers/raml/Parser'
import PostmanParser from '../parsers/postman/Parser'
import CurlParser from '../parsers/curl/Parser'

import SwaggerSerializer from '../serializers/swagger/Serializer'
import RAMLSerializer from '../serializers/raml/Serializer'
import PostmanSerializer from '../serializers/postman/Serializer'
import CurlSerializer from '../serializers/cURL/Serializer'
import InternalSerializer from '../serializers/internal/Serializer'

import BrowserEnvironment, {
    URLResolver
} from '../models/environments/BrowserEnvironment'

import BaseFlow from './base-runner'

export default class FlowBrowser extends BaseFlow {
    static parsers = {
        swagger: SwaggerParser,
        raml: RAMLParser,
        postman: PostmanParser,
        curl: CurlParser
    }

    static serializers = {
        swagger: SwaggerSerializer,
        raml: RAMLSerializer,
        postman: PostmanSerializer,
        curl: CurlSerializer,
        __internal__: InternalSerializer
    }

    constructor() {
        super(BrowserEnvironment, URLResolver)
    }

    getParsers() {
        return FlowBrowser.parsers
    }

    getSerializers() {
        return FlowBrowser.serializers
    }
}
