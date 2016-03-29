import {UnitTest, registerTest} from '../../../utils/TestUtils'
import Immutable from 'immutable'
import fs from 'fs'

import SwaggerParser from '../Parser'
import Request, { Group, KeyValue, FileReference } from '../../../immutables/RESTRequest'
import { BasicAuth } from '../../../immutables/Auth'

import SwaggerFixtures from './fixtures/Parser-fixtures'

@registerTest
class TestSwaggerParser extends UnitTest {

  testSimpleGroupTree() {
    const parser = new SwaggerParser()

    let request = new Request()
    let pathsLinkedReqs = {
      '/test' : {
        'get' : request
      }
    }

    let inputGroup = new Group({
      name : 'testRoot'
    })

    let expected = new Group({
      name : 'testRoot'
    })
    let pathGroup = new Group({
      name : '/test'
    })
    pathGroup = pathGroup.setIn(['children', 'get'], request)
    expected = expected.setIn(['children', '/test'], pathGroup)

    let result = parser._createGroupTree(inputGroup, pathsLinkedReqs)
    this.assertTrue(Immutable.is(result, expected))  
  }

  testMultipleMethodsGroupTree() {
    const parser = new SwaggerParser()

    let getReq = new Request()
    let postReq = new Request()

    let pathsLinkedReqs = {
      '/test' : {
        'get' : getReq,
        'post' : postReq
      }
    }

    let inputGroup = new Group({
      name : 'testRoot'
    })

    let expected = new Group({
      name : 'testRoot'
    })
    let pathGroup = new Group({
      name : '/test'
    })
    pathGroup = pathGroup
      .setIn(['children', 'get'], getReq)
      .setIn(['children', 'post'], postReq)
    expected = expected
      .setIn(['children', '/test'], pathGroup)

    let result = parser._createGroupTree(inputGroup, pathsLinkedReqs)
    this.assertTrue(Immutable.is(result, expected))  
  }

  testMultiplePathsGroupTree() {
    const parser = new SwaggerParser()

    let firstReq = new Request()
    let secndReq = new Request()

    let pathsLinkedReqs = {
      '/test' : {
        'get' : firstReq
      },
      '/anotherTest' : {
        'post' : secndReq
      },
    }

    let inputGroup = new Group({
      name : 'testRoot'
    })

    let expected = new Group({
      name : 'testRoot'
    })
    let pathGroup = new Group({
      name : '/test'
    })
    pathGroup = pathGroup.setIn(['children', 'get'], firstReq)
    expected = expected.setIn(['children', '/test'], pathGroup)
    pathGroup = new Group({
      name : '/anotherTest'
    })
    pathGroup = pathGroup.setIn(['children', 'post'], secndReq)
    expected = expected.setIn(['children', '/anotherTest'], pathGroup)

    let result = parser._createGroupTree(inputGroup, pathsLinkedReqs)
    this.assertTrue(Immutable.is(result, expected))  
  }  

  testLongPathGroupTree() {
    const parser = new SwaggerParser()

    let req = new Request()

    let pathsLinkedReqs = {
      '/path/to/test' : {
        'get' : req
      }
    }

    let inputGroup = new Group({
      name : 'testRoot'
    })

    let expected = new Group({
      name : 'testRoot'
    })
    let pathGroup = new Group({
      name : '/test'
    })
    pathGroup = pathGroup
      .setIn(['children', 'get'], req)
    let parentGroup = new Group({
      name : '/to'
    })
    pathGroup = parentGroup
      .setIn(['children', '/test'], pathGroup)
    parentGroup = new Group({
      name: '/path'
    })
    parentGroup = parentGroup
      .setIn(['children', '/to'], pathGroup)
    expected = expected.setIn(['children', '/path'], parentGroup)

    let result = parser._createGroupTree(inputGroup, pathsLinkedReqs)
    this.assertTrue(Immutable.is(result, expected))  
  }

  testRequestAndGroupOnSameDepthGroupTree(){
    const parser = new SwaggerParser()

    let firstReq = new Request()
    let secndReq = new Request()

    let pathsLinkedReqs = {
      '/test' : {
        'get' : firstReq
      },
      '/test/nested' : {
        'post' : secndReq
      },
    }

    let inputGroup = new Group({
      name : 'testRoot'
    })

    let expected = new Group({
      name : 'testRoot'
    })
    let pathGroup = new Group({
      name : '/test'
    })
    let subGroup = new Group({
      name : '/nested'
    })
    subGroup = subGroup
      .setIn(['children', 'post'], secndReq)
    pathGroup = pathGroup
      .setIn(['children', 'get'], firstReq)
      .setIn(['children', '/nested'], subGroup)

    expected = expected.setIn(['children', '/test'], pathGroup)

    let result = parser._createGroupTree(inputGroup, pathsLinkedReqs)

    this.assertTrue(Immutable.is(result, expected))
  }

  testPathCanContainMethodKeywords(){
    const parser = new SwaggerParser()

    let req = new Request()

    let pathsLinkedReqs = {
      '/get/post/test' : {
        'get' : req
      }
    }

    let inputGroup = new Group({
      name : 'testRoot'
    })

    let expected = new Group({
      name : 'testRoot'
    })
    let pathGroup = new Group({
      name : '/test'
    })
    pathGroup = pathGroup
      .setIn(['children', 'get'], req)
    let parentGroup = new Group({
      name : '/post'
    })
    pathGroup = parentGroup
      .setIn(['children', '/test'], pathGroup)
    parentGroup = new Group({
      name: '/get'
    })
    parentGroup = parentGroup
      .setIn(['children', '/post'], pathGroup)
    expected = expected.setIn(['children', '/get'], parentGroup)

    let result = parser._createGroupTree(inputGroup, pathsLinkedReqs)
    this.assertTrue(Immutable.is(result, expected))
  }

  testMethodKeywordsDoNotCauseConflict(){
    const parser = new SwaggerParser()

    let firstReq = new Request()
    let secndReq = new Request()

    let pathsLinkedReqs = {
      '/test' : {
        'get' : firstReq
      },
      '/test/get' : {
        'post' : secndReq
      },
    }

    let inputGroup = new Group({
      name : 'testRoot'
    })

    let expected = new Group({
      name : 'testRoot'
    })
    let pathGroup = new Group({
      name : '/test'
    })
    let subGroup = new Group({
      name : '/get'
    })
    subGroup = subGroup
      .setIn(['children', 'post'], secndReq)
    pathGroup = pathGroup
      .setIn(['children', 'get'], firstReq)
      .setIn(['children', '/get'], subGroup)

    expected = expected.setIn(['children', '/test'], pathGroup)

    let result = parser._createGroupTree(inputGroup, pathsLinkedReqs)

    this.assertTrue(Immutable.is(result, expected))  
  }

  testLoadSwaggerCollectionWithValidFiles(){
    const parser = new SwaggerParser()
    const filenames = SwaggerFixtures.getValidFilenames()
    try {
      for(let i = 0, l = filenames.length ; i < l ; i++){
        let content = this.__loadSwaggerFile(filenames[i].name, filenames[i].extension)
        let swaggerCollection = parser._loadSwaggerCollection(content)
      }
    } catch (e){
      this.assertTrue(false)
    }

    this.assertTrue(true)
  }

  testLoadSwaggerCollectionWithInvalidFiles(){
    const parser = new SwaggerParser()
    const filenames = SwaggerFixtures.getMalformedFilenames()

    for(let i = 0, l = filenames.length ; i < l ; i++){
      try {
        let content = this.__loadSwaggerFile(filenames[i].name, filenames[i].extension)
        let swaggerCollection = parser._loadSwaggerCollection(content)
        this.assertTrue(false)
      } catch (e){
        this.assertTrue(true)
      }
    }
  }

  testValidateSwaggerCollectionWithValidCollections(){
    const parser = new SwaggerParser()
    const filenames = SwaggerFixtures.getValidFilenames()
    for(let i = 0, l = filenames.length ; i < l ; i++){
      let content = this.__loadSwaggerFile(filenames[i].name, filenames[i].extension)
      let swaggerCollection = parser._loadSwaggerCollection(content)
      let valid = parser._validateSwaggerCollection(swaggerCollection)
      this.assertTrue(valid)
    }
  }

  testValidateSwaggerCollectionWithInvalidCollections(){
    const parser = new SwaggerParser()
    const filenames = SwaggerFixtures.getNonCompliantFilenames()
    for(let i = 0, l = filenames.length ; i < l ; i++){
      let content = this.__loadSwaggerFile(filenames[i].name, filenames[i].extension)
      let swaggerCollection = parser._loadSwaggerCollection(content)
      let valid = parser._validateSwaggerCollection(swaggerCollection)
      this.assertFalse(valid)
    }
  }

  testParseShouldThrowOnInvalidSwaggerCollection(){
    const parser = new SwaggerParser()
    let content = this.__loadSwaggerFile('bad-schema')
    
    try {
      parser.parse(content)
      //should never be reached
      this.assertTrue(false)
    } catch (e) {
      this.assertTrue(true)
    }
  }

  testApplyFuncOverPathArchitectureIsCalledForEachPathMethodPair(){
    const parser = new SwaggerParser()

    const collection = {
      paths : {
        '/test' : {
          'get' : {
            dummy : 'content'
          },
          'post' : {
            another : 'dummy content'
          }
        },
        '/test/nested' : {
          'get' : {
            useless : 'content'
          }
        }
      }
    }

    let expected = 3
    let count = 0

    parser._applyFuncOverPathArchitecture(collection, () => { count++ })
    this.assertTrue(expected === count)
  }

  testApplyFuncOverPathArchitectureProvidesCorrectArgsToFunction(){
    const parser = new SwaggerParser()

    const collection = {
      paths : {
        '/test' : {
          'get' : {
            dummy : 'content'
          },
          'post' : {
            another : 'dummy content'
          }
        },
        '/test/nested' : {
          'get' : {
            useless : 'content'
          }
        }
      }
    }

    parser._applyFuncOverPathArchitecture(collection, (coll, path, method, content) => {
      this.assertEqual(coll.paths[path][method], content)
    })
  }

  testApplyFuncOverPathArchitectureAppliesFuncToEachPath(){
    const parser = new SwaggerParser()

    const collection = {
      paths : {
        '/test' : {
          'get' : {
            value : 12
          },
          'post' : {
            value : 21
          }
        },
        '/test/nested' : {
          'get' : {
            value : 45
          }
        }
      }
    }

    const expected = {
      '/test' : {
        'get' : {
          value : 24
        },
        'post' : {
          value : 42
        }
      },
      '/test/nested' : {
        'get' : {
          value : 90
        }
      }
    }

    let result = parser._applyFuncOverPathArchitecture(collection, (coll, path, method, content) => {
      return {
        value: content.value * 2
      }
    })

    this.assertEqual(expected, result)
  }

  testSetSummaryWithASummaryContent(){
    const parser = new SwaggerParser()
    let request = new Request()
    let path = '/test/path'
    let content = {
      summary : 'dummy summary'
    }

    let result = parser._setSummary(request, path, content)

    this.assertEqual(result.get('name'), content.summary)
  }

  testSetSummaryWithNoSummaryContent(){
    const parser = new SwaggerParser()
    let request = new Request()
    let path = '/test/path'
    let content = {
      notSummary : 'dummy summary'
    }

    let result = parser._setSummary(request, path, content)

    this.assertEqual(result.get('name'), path)
  }

  testSetDescriptionWithADescriptionContent(){
    const parser = new SwaggerParser()
    let request = new Request()
    let content = {
      description : 'dummy description'
    }

    let result = parser._setDescription(request, content)

    this.assertEqual(result.get('description'), content.description)
  }

  testSetDescriptionWithNoDescriptionContent(){
    const parser = new SwaggerParser()
    let request = new Request()
    let content = {
      notDescription : 'dummy description'
    }

    let result = parser._setDescription(request, content)

    this.assertEqual(result.get('description'), null)
  }

  testConvertKeyValueListToSet(){
    const parser = new SwaggerParser()
    let kvList = [
      new KeyValue({
        key: 'test',
        value: 42
      }),
      new KeyValue({
        key: 'other',
        value: 'text'
      }),
      new KeyValue({
        key: 'final',
        value: true
      })
    ]

    let expected = {
      test : 42,
      other : 'text',
      final : true
    }

    let result = parser._convertKeyValueListToSet(kvList)
    this.assertEqual(expected, result)
  }

  testConvertKeyValueListToSetWithDuplicateKeys(){
    const parser = new SwaggerParser()
    let kvList = [
      new KeyValue({
        key: 'test',
        value: 42
      }),
      new KeyValue({
        key: 'other',
        value: 'text'
      }),
      new KeyValue({
        key: 'final',
        value: true
      }),
      new KeyValue({
        key: 'final',
        value: false
      })
    ]

    let expected = {
      test : 42,
      other : 'text',
      final : false
    }

    let result = parser._convertKeyValueListToSet(kvList)
    this.assertEqual(expected, result)
  }

  testExtractParams(){
    const parser = new SwaggerParser()
    let cases = SwaggerFixtures.getParametersCases()
    this.__warnProgress('ExtractParams', true)
    for (let usecase of cases){
      this.__warnProgress(usecase.name)
      let output = parser._extractParams.apply(parser, usecase.inputs)
      this.assertEqual(output, usecase.output, 'in ' + usecase.name)
    }
  }

  testExtractParamsThrowsOnBadlyFormedParameter(){
    const parser = new SwaggerParser()
    let cases = SwaggerFixtures.getThrowingParametersCases()
    this.__warnProgress('ExtractParamsThrowsOnBadlyFormedParameter', true)
    for (let usecase of cases){
      this.__warnProgress(usecase.name)
      try {
        parser._extractParams.apply(parser, usecase.inputs)
        this.assertTrue(false)
      } catch (e) {
        this.assertTrue(true)
      }
    }
  }

  testExtractResponses(){
    const parser = new SwaggerParser()
    let cases = SwaggerFixtures.getResponsesCases()
    this.__warnProgress('ExtractResponses', true)
    for (let usecase of cases){
      this.__warnProgress(usecase.name)
      let output = parser._extractResponses.apply(parser, usecase.inputs)
      this.assertEqual(output, usecase.output, 'in ' + usecase.name)
    }
  }

  testGenerateURL(){
    const parser = new SwaggerParser()
    let cases = SwaggerFixtures.getURLGenerationCases()
    this.__warnProgress('GenerateURL', true)
    for (let usecase of cases){
      this.__warnProgress(usecase.name)
      let output = parser._generateURL.apply(parser, usecase.inputs)
      this.assertEqual(output, usecase.output, 'in ' + usecase.name)
    }
  }

  testSetBasicInfo(){
    const parser = new SwaggerParser()
    let cases = SwaggerFixtures.getBasicInfoCases()
    this.__warnProgress('SetBasicInfo', true)
    for (let usecase of cases){
      this.__warnProgress(usecase.name)
      let output = parser._setBasicInfo.apply(parser, usecase.inputs)
      this.assertEqual(output, usecase.output, 'in ' + usecase.name)
    }
  }

  testSetBody(){
    const parser = new SwaggerParser()
    let cases = SwaggerFixtures.getSetBodyCases()
    this.__warnProgress('SetBody', true)
    for (let usecase of cases){
      this.__warnProgress(usecase.name)
      let output = parser._setBody.apply(parser, usecase.inputs)
      this.assertEqual(output, usecase.output, 'in ' + usecase.name)
    }
  }

  testSetAuth(){
    const parser = new SwaggerParser()
    let cases = SwaggerFixtures.getSetAuthCases()
    this.__warnProgress('SetAuth', true)
    for (let usecase of cases){
      this.__warnProgress(usecase.name)
      let output = parser._setAuth.apply(parser, usecase.inputs)
      this.assertEqual(output, usecase.output, 'in ' + usecase.name)
    }
  }

  testCreateRequest(){
    const parser = new SwaggerParser()
    let cases = SwaggerFixtures.getCreateRequestCases()
    this.__warnProgress('CreateRequest', true)
    for (let usecase of cases){
      this.__warnProgress(usecase.name)
      let output = parser._createRequest.apply(parser, usecase.inputs)
      this.assertEqual(output, usecase.output, 'in ' + usecase.name)
    }
  }
  // 
  // helpers
  // 

  __warnProgress(string, isTestCase = false){
    let offset = isTestCase ? '    ' : '      '
    let warn = offset + '\x1b[33m\u25CB\x1b[0m \x1b[90m' + string + '\x1b[0m'
    console.log(warn)
  }

  __loadSwaggerFile(fileName, extension = 'json'){
    let path = __dirname + '/collections/' + fileName + '.' + extension
    return fs.readFileSync(path).toString()
  }

  __testRequest(input, expected, compareBodyString = false) {
    this.__testRequests(input, Immutable.List([expected]), compareBodyString)
  }

  __testRequests(input, expected, compareBodyString = false) {
    const parser = new SwaggerParser()
    let requests = parser.parse(input)

    // remove bodyString from request if we don't want to compare it here
    requests = requests.map(request => {
      if (!compareBodyString) {
        return request.set('bodyString', null)
      }
      return request
    })

    console.log('expected:', JSON.stringify(expected), '\nrequests:', JSON.stringify(requests))
    this.assertTrue(Immutable.is(requests, expected))
  }
}
