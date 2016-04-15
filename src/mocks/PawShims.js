if (
    typeof registerImporter === 'undefined' ||
    typeof DynamicValue === 'undefined' ||
    typeof DynamicString === 'undefined'
) {
    let mocks = require('./PawMocks.js')
    module.exports = {
        registerImporter: mocks.registerImporter,
        DynamicValue: mocks.DynamicValue,
        DynamicString: mocks.DynamicString
    }
}
else {
    /* eslint-disable no-undef */
    module.exports = {
        registerImporter: registerImporter,
        DynamicValue: DynamicValue,
        DynamicString: DynamicString
    }
    /* eslint-enable no-undef */
}
