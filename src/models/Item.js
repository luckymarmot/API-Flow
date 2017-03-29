import { Record } from 'immutable'

import Model from './ModelInfo'

const ItemSpec = {
  _model: new Model({
    name: 'item.models',
    version: '0.1.0'
  }),
  uri: null,
  name: null,
  mediaType: null,
  content: null
}

export class Item extends Record(ItemSpec) { }
