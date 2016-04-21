import CurlParser from './cURL/Parser'
import PostmanParser from './postman/Parser'
import RamlParser from './raml/Parser'
import SwaggerParser from './swagger/Parser'

const Parser = {
    Curl: CurlParser,
    Postman: PostmanParser,
    Raml: RamlParser,
    Swagger: SwaggerParser
}

export default Parser
