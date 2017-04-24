/* istanbul ignore next */
if (
    typeof registerImporter === 'undefined' ||
    typeof DynamicValue === 'undefined' ||
    typeof DynamicString === 'undefined' ||
    typeof registerCodeGenerator === 'undefined' ||
    typeof InputField === 'undefined' ||
    typeof NetworkHTTPRequest === 'undefined'
) {
  const mocks = require('./PawMocks.js')
  module.exports = {
    registerImporter: mocks.registerImporter,
    DynamicValue: mocks.DynamicValue,
    DynamicString: mocks.DynamicString,
    registerCodeGenerator: mocks.registerCodeGenerator,
    InputField: mocks.InputField,
    NetworkHTTPRequest: mocks.NetworkHTTPRequest,
    RecordParameter: mocks.RecordParameter
  }
}
else {
    /* eslint-disable no-undef */
  module.exports = {
    registerImporter: registerImporter,
    DynamicValue: DynamicValue,
    DynamicString: DynamicString,
    registerCodeGenerator: registerCodeGenerator,
    InputField: InputField,
    NetworkHTTPRequest: NetworkHTTPRequest,
    RecordParameter: RecordParameter
  }
    /* eslint-enable no-undef */
}
