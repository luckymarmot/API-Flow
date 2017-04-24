import expect from 'expect'

describe('mocks/PawShims.js', () => {
  it('should use mocks if paw objects are not globally defined', () => {
    const $module = require('../PawShims.js')

    expect($module.registerImporter).toExist()
    expect($module.registerCodeGenerator).toExist()
    expect($module.DynamicValue).toExist()
    expect($module.DynamicString).toExist()
    expect($module.InputField).toExist()
    expect($module.NetworkHTTPRequest).toExist()
    expect($module.RecordParameter).toExist()
  })
})
