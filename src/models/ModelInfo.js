import { Record } from 'immutable'

/**
 * Default Spec for the Model Record.
 */
const ModelSpec = {
  name: '',
  version: ''
}

export const Model = Record(ModelSpec)

export default Model
