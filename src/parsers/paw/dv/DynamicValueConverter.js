export default class DynamicValueConverter {
    static identifier = null

    convert() {
        throw new Error(
            'DynamicValue is an abstract class. This method must be ' +
            'implemented by classes extending it'
        )
    }

    _extractValueFromDV(dvOrString) {
        if (typeof dvOrString === 'undefined') {
            return null
        }

        if (typeof dvOrString !== 'string' && dvOrString.getEvaluatedString) {
            return dvOrString.getEvaluatedString()
        }

        return dvOrString
    }
}
