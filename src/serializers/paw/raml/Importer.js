import BaseImporter from '../base-importer/BaseImporter'
import RAMLParser from '../../../parsers/raml/Parser'

@registerImporter // eslint-disable-line
export default class RAMLImporter extends BaseImporter {
    static identifier = 'com.luckymarmot.PawExtensions.RAMLImporter';
    static title = 'RAML Importer';

    static fileExtensions = [];
    static inputs = [];

    canImport(context, items) {
        let hasRootFile = 0
        for (let item of items) {
            hasRootFile += this._startsWithRAMLVersion(item)
        }
        return hasRootFile > 0 ? 1 : 0
    }

    /*
        Only root files starts with RAML version.
    */
    _startsWithRAMLVersion(item) {
        let firstLine = item.content.split('\n', 1)[0]
        let match = firstLine.match(/#%RAML (0\.8|1\.0)/)
        if (match) {
            return 1
        }
        return 0
    }

    /*
      @params:
        - context
        - items
        - options
    */
    createRequestContexts(context, items) {
        const parser = new RAMLParser()

        let reqPromises = []
        for (let item of items) {
            if (this._startsWithRAMLVersion(item)) {
                reqPromises.push(
                    parser.parse(item)
                ).then(reqContext => {
                    return {
                        context: reqContext,
                        items: [ item ]
                    }
                })
            }
        }
        return Promise.all(reqPromises)
    }
}
