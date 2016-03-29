import Immutable from 'immutable'

import Request, { KeyValue, FileReference, Group, Schema, SchemaReference, Response } from '../../../../immutables/RESTRequest'
import { BasicAuth, ApiKeyAuth, OAuth2Auth } from '../../../../immutables/Auth'

export default class SwaggerFixtures {
  static getValidFilenames(){
    return [
      {
        name :'basic-auth',
        extension : 'json'
      }, {
        name :'basic-auth',
        extension : 'yaml'
      }, {
        name :'pets',
        extension : 'json'
      }, {
        name :'pets',
        extension : 'yaml'
      }, {
        name :'security',
        extension : 'json'
      }, {
        name :'security',
        extension : 'yaml'
      }, {
        name :'uber',
        extension : 'json'
      }, {
        name :'uber',
        extension : 'yaml'
      }
    ]
  }

  static getMalformedFilenames(){
    return [
      {
        name :'badly-formed',
        extension : 'json'
      }, {
        name :'badly-formed',
        extension : 'yaml'
      } 
    ]
  }

  static getNonCompliantFilenames(){
    return [
      {
        name :'bad-schema',
        extension : 'json'
      }, {
        name :'bad-schema',
        extension : 'yaml'
      }
    ]
  }

  static getParametersCases(){
    return [
      {
        name : 'NoArgsTest',
        inputs : [],
        output : [[], [], [], undefined]
      },
      {
        name : 'UndefinedDefaultValueWithTypeStringQueryFieldTest',
        inputs: [
                  [{
                    "in": "query",
                    "name": "status",
                    "description": "Status values that need to be considered for filter",
                    "required": false,
                    "type": "string",
                  }]
                ],
        output: [
          [], //headers
          [ //queries
            new KeyValue({ key : "status", value: "status", valueType: "string"})
          ],
          [], //formData
          undefined //body
        ]
      },
      {
        name : 'DefaultValueSetWithTypeStringQueryFieldTest',
        inputs: [
                  [{
                    "in": "query",
                    "name": "status",
                    "description": "Status values that need to be considered for filter",
                    "required": false,
                    "type": "string",
                    "default" : "content"
                  }]
                ],
        output: [
          [], //headers
          [ //queries
            new KeyValue({ key : "status", value: "content", valueType: "string"})
          ],
          [], //formData
          undefined //body
        ]
      },
      {
        name : 'MultipleQueryFieldsTest',
        inputs: [
                  [
                    {
                      "in": "query",
                      "name": "status",
                      "description": "Status values that need to be considered for filter",
                      "required": false,
                      "type": "string"
                    },
                    {
                      "in": "query",
                      "name": "second",
                      "description": "Status values that need to be considered for filter",
                      "required": true,
                      "type": "string",
                      "default" : "Ipsum"
                    }
                  ]
                ],
        output: [
          [], //headers
          [ //queries
            new KeyValue({ key : "status", value: "status", valueType: "string"}),
            new KeyValue({ key : "second", value: "Ipsum", valueType: "string"})
          ],
          [], //formData
          undefined //body
        ]
      },
      {
        name : 'UndefinedDefaultValueWithTypeStringformDataFieldTest',
        inputs: [
                  [
                    {
                      "in": "formData",
                      "name": "name",
                      "description": "Updated name of the pet",
                      "required": true,
                      "type": "string"
                    }
                  ]
                ],
        output: [
          [], //headers
          [], //queries
          [ //formData
            new KeyValue({ key : "name", value: "name", valueType: "string"})
          ],
          undefined //body
        ]
      },
      {
        name : 'DefaultValueSetWithTypeStringformDataFieldTest',
        inputs: [
                  [
                    {
                      "in": "formData",
                      "name": "name",
                      "description": "Updated name of the pet",
                      "required": true,
                      "type": "string",
                      "default": "content" 
                    }
                  ]
                ],
        output: [
          [], //headers
          [], //queries
          [ //formData
            new KeyValue({ key : "name", value: "content", valueType: "string"})
          ],
          undefined //body
        ]
      },
      {
        name : 'DefaultValueSetWithTypeNumberformDataFieldTest',
        inputs: [
                  [
                    {
                      "in": "formData",
                      "name": "count",
                      "description": "Updated name of the pet",
                      "required": true,
                      "type": "number",
                      "default": 1 
                    }
                  ]
                ],
        output: [
          [], //headers
          [], //queries
          [ //formData
            new KeyValue({ key : "count", value: 1, valueType: "number"})
          ],
          undefined //body
        ]
      },
      {
        name : 'SimpleBodyFieldTest',
        inputs: [
                  [
                    {
                      "in": "body",
                      "name": "body",
                      "description": "Pet object that needs to be added to the store",
                      "required": false,
                      "schema": {
                          "$ref": "#/definitions/Pet"
                      }
                    }
                  ]
                ],
        output: [
          [], //headers
          [], //queries
          [], //formData
          new SchemaReference({
            reference: "#/definitions/Pet"
          }) //body
        ]
      },
      {
        name : 'MultipleFormDataFieldsTest',
        inputs: [
                  [
                    {
                      "in": "formData",
                      "name": "status",
                      "description": "Status values that need to be considered for filter",
                      "required": false,
                      "type": "string"
                    },
                    {
                      "in": "formData",
                      "name": "second",
                      "description": "Status values that need to be considered for filter",
                      "required": true,
                      "type": "string",
                      "default" : "Ipsum"
                    }
                  ]
                ],
        output: [
          [], //headers
          [], //queries
          [ //formData
            new KeyValue({ key : "status", value: "status", valueType: "string"}),
            new KeyValue({ key : "second", value: "Ipsum", valueType: "string"})
          ],
          undefined //body
        ]
      },
      {
        name : 'UndefinedDefaultValueWithTypeStringHeaderFieldTest',
        inputs: [
                  [
                    {
                      "in": "header",
                      "name": "api_key",
                      "description": "",
                      "required": true,
                      "type": "string"
                    }
                  ]
                ],
        output: [
          [ //headers
            new KeyValue({ key : "api_key", value: "api_key", valueType: "string"})
          ],
          [], //queries
          [], //formData
          undefined //body
        ]
      },
      {
        name : 'DefaultValueSetWithTypeStringHeaderFieldTest',
        inputs: [
                  [
                    {
                      "in": "header",
                      "name": "api_key",
                      "description": "",
                      "required": true,
                      "type": "string",
                      "default" : "content"
                    }
                  ]
                ],
        output: [
          [ //headers
            new KeyValue({ key : "api_key", value: "content", valueType: "string"})
          ],
          [], //queries
          [], //formData
          undefined //body
        ]
      },
      {
        name : 'MultipleFormDataFieldsTest',
        inputs: [
                  [
                    {
                      "in": "header",
                      "name": "status",
                      "description": "Status values that need to be considered for filter",
                      "required": false,
                      "type": "string"
                    },
                    {
                      "in": "header",
                      "name": "second",
                      "description": "Status values that need to be considered for filter",
                      "required": true,
                      "type": "string",
                      "default" : "Ipsum"
                    }
                  ]
                ],
        output: [
          [ //headers
            new KeyValue({ key : "status", value: "status", valueType: "string"}),
            new KeyValue({ key : "second", value: "Ipsum", valueType: "string"})
          ],
          [], //queries
          [], //formData
          undefined //body
        ]
      },
      {
        name : 'MixedFieldsTest',
        inputs: [
                  [
                    {
                      "in": "header",
                      "name": "api_key",
                      "description": "",
                      "required": true,
                      "type": "string"
                    },
                    {
                      "in": "formData",
                      "name": "status",
                      "description": "Status values that need to be considered for filter",
                      "required": false,
                      "type": "string"
                    },
                    {
                      "in": "query",
                      "name": "second",
                      "description": "Status values that need to be considered for filter",
                      "required": true,
                      "type": "string",
                      "default" : "Ipsum"
                    }
                  ]
                ],
        output: [
          [
            new KeyValue({ key : "api_key", value: "api_key", valueType: "string"})
          ], //headers
          [ //queries
            new KeyValue({ key : "second", value: "Ipsum", valueType: "string"})
          ],
          [ //formData
            new KeyValue({ key : "status", value: "status", valueType: "string"})
          ],
          undefined //body
        ]
      }
    ]
  }

  static getThrowingParametersCases(){
    return [
      {
        name : 'NoSchemaObjectInBodyFieldTest',
        inputs: [
                  [
                    {
                      "in": "body",
                      "name": "body",
                      "description": "Pet object that needs to be added to the store",
                      "required": false,
                    }
                  ]
                ],
        output: undefined
      },
      {
        name : 'NoRefObjectInSchemaInBodyFieldTest',
        inputs: [
                  [
                    {
                      "in": "body",
                      "name": "body",
                      "description": "Pet object that needs to be added to the store",
                      "required": false,
                      "schema": {
                        "useless": "stuff"
                      }
                    }
                  ]
                ],
        output: undefined
      }
    ]
  }

  static getResponsesCases(){
    return [
      {
        name : 'NoArgsTest',
        inputs: [],
        output: {}
      },
      {
        name : 'UndefinedResponsesObjectTest',
        inputs: [
                  undefined
                ],
        output: {}
      },
      {
        name : 'SingleCodeTest',
        inputs: [
                  {
                    "200" : {}
                  }
                ],
        output: {
          "200" : new Response({
            code : "200"
          })
        }
      },
      {
        name : 'MultipleCodeTest',
        inputs: [
                  {
                    "200" : {},
                    "400" : {}
                  }
                ],
        output: {
          "200" : new Response({
            code : "200"
          }),
          "400" : new Response({
            code : "400"
          })

        }
      },
      {
        name : 'DescriptionInResponseTest',
        inputs: [
                  {
                    "200" : {
                      "description": "dummy description"
                    }
                  }
                ],
        output: {
          "200" : new Response({
            code : "200",
            description: "dummy description"
          })
        }
      },
      {
        name : 'SchemaInResponseTest',
        inputs: [
                  {
                    "200" : {
                      "schema": {
                        "type": "array",
                        "items": {
                            "$ref": "#/definitions/Pet"
                        }
                      }
                    }
                  }
                ],
        output: {
          "200" : new Response({
            code : "200",
            schema: (new Schema()).mergeSchema(
              {
                "type": "array",
                "items": {
                    "$ref": "#/definitions/Pet"
                }
              }
            )
          })
        }
      }
    ]
  }

  static getURLGenerationCases(){
    return [
      {
        name : 'SimpleTest',
        inputs: [
          { //swaggerCollection
          },
          "/test/path",
          []
        ],
        output: "http://localhost/test/path"
      },
      {
        name : 'DefinedSchemeTest',
        inputs: [
          {
            "schemes" : [
              "smtp",
              "https"
            ]
          },
          "/test/path",
          []
        ],
        output: "smtp://localhost/test/path"
      },
      {
        name : 'DefinedHostTest',
        inputs: [
          {
            "host" : [
              "test.luckymarmot.com"
            ]
          },
          "/test/path",
          []
        ],
        output: "http://test.luckymarmot.com/test/path"
      },
      {
        name : 'DefinedBasePathWithNoSlashesTest',
        inputs: [
          {
            "basePath" : "~test"
          },
          "/simple/path",
          []
        ],
        output: "http://localhost/~test/simple/path"
      },
      {
        name : 'DefinedBasePathStartingWithSlashTest',
        inputs: [
          {
            "basePath" : "/~test"
          },
          "/simple/path",
          []
        ],
        output: "http://localhost/~test/simple/path"
      },
      {
        name : 'DefinedBasePathEndingWithSlashTest',
        inputs: [
          {
            "basePath" : "~test/"
          },
          "/simple/path",
          []
        ],
        output: "http://localhost/~test/simple/path"
      },
      {
        name : 'DefinedSingleQueryTest',
        inputs: [
          {},
          "/simple/path",
          [
            new KeyValue({
              key: 'test',
              value: 'content'
            })
          ]
        ],
        output: "http://localhost/simple/path?test=content"
      },
      {
        name : 'DefinedMultipleQueryTest',
        inputs: [
          {},
          "/simple/path",
          [
            new KeyValue({
              key: 'test',
              value: 'content'
            }),
            new KeyValue({
              key: 'second'
            }),
            new KeyValue({
              key: 'third',
              value: 'rand'
            })
          ]
        ],
        output: "http://localhost/simple/path?test=content&second=&third=rand"
      }
    ]
  }

  static getBasicInfoCases(){
    return [
      {
        name : 'SimpleTest',
        inputs: [
          new Request(),
          "http://localhost/test/path", //url
          "get", //method
          [], //headers,
          {}, //responses
        ],
        output: new Request({
          url: "http://localhost/test/path",
          method: "GET"
        })
      },
      {
        name : 'PreservesRequestDataTest',
        inputs: [
          new Request({
            name: "/test/path",
            description: "dummy description",
          }),
          "http://localhost/test/path", //url
          "get", //method
          [], //headers,
          {}, //responses
        ],
        output: new Request({
          name: "/test/path",
          description: "dummy description",
          url: "http://localhost/test/path",
          method: "GET"
        })
      },
      {
        name : 'AddsHeaderTest',
        inputs: [
          new Request({
            name: "/test/path",
            description: "dummy description",
          }),
          "http://localhost/test/path", //url
          "get", //method
          [
            new KeyValue({
              key: "test",
              value: "dummy",
              valueType: "string"
            }),
            new KeyValue({
              key: "second",
              value: "Ipsum",
              valueType: "string"
            })
          ], //headers,
          {}, //responses
        ],
        output: new Request({
          name: "/test/path",
          description: "dummy description",
          url: "http://localhost/test/path",
          method: "GET",
          headers: new Immutable.OrderedMap({
            "test": "dummy",
            "second": "Ipsum"
          })
        })
      },
      {
        name : 'AddsResponsesTest',
        inputs: [
          new Request({
            name: "/test/path",
            description: "dummy description",
          }),
          "http://localhost/test/path", //url
          "get", //method
          [], //headers,
          {
            "200": new Response(),
            "400": new Response({
              description: "dummy description"
            })
          }, //responses
        ],
        output: new Request({
          name: "/test/path",
          description: "dummy description",
          url: "http://localhost/test/path",
          method: "GET",
          responses: new Immutable.OrderedMap({
            "200": new Response(),
            "400": new Response({
              description: "dummy description"
            })
          })
        })
      }
    ]
  }

  static getSetBodyCases(){
    return [
      {
        name : 'SimpleTest',
        inputs: [
          new Request(),
          {}, //swaggerCollection
          undefined, //body
          [], //formData,
          undefined, //content
        ],
        output: new Request()
      },
      {
        name : 'WithBodyTest',
        inputs: [
          new Request(),
          {}, //swaggerCollection
          new SchemaReference({
            reference: "#/definitions/Test"
          }), //body
          [], //formData,
          undefined, //content
        ],
        output: new Request({
          bodyType: "schema",
          body: new SchemaReference({
            reference: "#/definitions/Test"
          })
        })
      },
      {
        name : 'WithFormDataAsURLEncodedTest',
        inputs: [
          new Request(),
          {}, //swaggerCollection
          undefined, //body
          [
            new KeyValue({
              key: "test",
              value: "dummy",
              valueType: "string"
            })
          ], //formData,
          {}, //content
        ],
        output: new Request({
          body: Immutable.List([
            new KeyValue({
              key: "test",
              value: "dummy",
              valueType: "string"
            })
          ])
        })
      }
    ]
  }

  static getSetAuthCases(){
    return [
      {
        name : 'SimpleTest',
        inputs: [
          new Request(),
          {}, //swaggerCollection
          {} //content
        ],
        output: new Request()
      },
      {
        name : 'BasicAuthTest',
        inputs: [
          new Request(),
          {
            securityDefinitions : {
              "basicAuth": {
                "type": "basic",
                "description": "HTTP Basic Authentication. Works over `HTTP` and `HTTPS`"
              }
            }
          }, //swaggerCollection
          {
            "security": [
              {
                "basicAuth": []
              }
            ],
          } //content
        ],
        output: new Request({
          auth: new BasicAuth()
        })
      },
      {
        name : 'ApiKeyAuthTest',
        inputs: [
          new Request(),
          {
            securityDefinitions : {
              "api_key": {
                "type": "apiKey",
                "name": "api_key",
                "in": "header"
              },
            }
          }, //swaggerCollection
          {
            "security": [
              {
                "api_key": []
              }
            ],
          } //content
        ],
        output: new Request({
          auth: new ApiKeyAuth({
            name: "api_key",
            in: "header"
          })
        })
      },
      {
        name : 'OAuth2AuthTest',
        inputs: [
          new Request(),
          {
            securityDefinitions : {
              "petstore_auth": {
                "type": "oauth2",
                "authorizationUrl": "http://petstore.swagger.wordnik.com/api/oauth/dialog",
                "flow": "implicit",
                "scopes": {
                  "write_pets": "modify pets in your account",
                  "read_pets": "read your pets"
                }
              }
            }
          }, //swaggerCollection
          {
            "security": [
              {
                "petstore_auth": [
                  "write_pets",
                  "read_pets"
                ]
              }
            ],
          } //content
        ],
        output: new Request({
          auth: new OAuth2Auth({
            flow: "implicit",
            authorizationUrl: "http://petstore.swagger.wordnik.com/api/oauth/dialog"
          })
        })
      }
    ]
  }

  static getCreateRequestCases(){
    return [
      {
        name : 'SimpleTest',
        inputs: [
          {}, //swaggerCollection
          "/test/path", //path
          "get", //method
          {} //content
        ],
        output: new Request({
          name: "/test/path",
          url: "http://localhost/test/path",
          method: "GET"
        })
      }
    ]
  }
}