if (
    typeof registerImporter === 'undefined' ||
    typeof DynamicValue === 'undefined' ||
    typeof DynamicString === 'undefined' ||
    typeof registerCodeGenerator === 'undefined'
) {
    let mocks = require('./PawMocks.js')
    module.exports = {
        registerImporter: mocks.registerImporter,
        DynamicValue: mocks.DynamicValue,
        DynamicString: mocks.DynamicString,
        registerCodeGenerator: mocks.registerCodeGenerator
    }
}
else {
    /* eslint-disable no-undef */
    module.exports = {
        registerImporter: registerImporter,
        DynamicValue: DynamicValue,
        DynamicString: DynamicString,
        registerCodeGenerator: registerCodeGenerator
    }
    /* eslint-enable no-undef */
}
