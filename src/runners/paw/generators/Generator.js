import { registerCodeGenerator } from '../../../mocks/PawShims'

import { target } from 'api-flow-config'
import ApiFlow from '../../../api-flow'

@registerCodeGenerator
export default class SwaggerGenerator {
  static identifier = target.identifier
  static title = target.humanTitle
  static help =
        'https://github.com/luckymarmot/API-Flow'
  static languageHighlighter = 'json'
  static fileExtension = 'json'

  generate(context, reqs, opts) {
    try {
      const options = { context, reqs, source: { format: 'paw', version: 'v3.0' }, target }
      const serialized = ApiFlow.serialize(ApiFlow.parse({ options }))
      return serialized
    }
    catch (e) {
            /* eslint-disable no-console */
      console.error(
                this.constructor.title,
                'generation failed with error:',
                e,
                e.stack,
                JSON.stringify(e, null, '  ')
            )
            /* eslint-enable no-console */
      throw e
    }
  }
}
