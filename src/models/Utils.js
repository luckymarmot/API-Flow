import Immutable from 'immutable'

import Model from './ModelInfo'

export class Contact extends Immutable.Record({
    _model: new Model({
        name: 'contact.utils.models',
        version: '0.1.0'
    }),
    name: null,
    url: null,
    email: null
}) { }

export class License extends Immutable.Record({
    _model: new Model({
        name: 'license.utils.models',
        version: '0.1.0'
    }),
    name: null,
    url: null
}) { }

export class Info extends Immutable.Record({
    _model: new Model({
        name: 'info.utils.models',
        version: '0.1.0'
    }),
    title: null,
    description: null,
    tos: null,
    contact: null,
    license: null,
    version: null
}) { }

export type SchemaType = {
  type?: string,
  minimum?: number,
  maximum?: number,
  exclusiveMinimum?: boolean,
  exclusiveMaximum?: boolean,
  multipleOf?: number,
  maxLength?: number,
  minLength?: number,
  pattern?: string,
  additionalItems?: (boolean | SchemaType),
  maxItems?: number,
  minItems?: number,
  uniqueItems?: boolean,
  maxProperties?: number,
  minProperties?: number,
  required?: Array<string>,
  properties?: { [key: string]: SchemaType },
  patternProperties?: { [key: string]: SchemaType },
  additionalProperties?: (boolean | SchemaType),
  dependencies?: { [key: string]: (SchemaType | Array<string>) },
  enum?: Array<*>,
  allOf?: Array<SchemaType>,
  anyOf?: Array<SchemaType>,
  oneOf?: Array<SchemaType>,
  not?: SchemaType,
  definitions?: { [key: string]: SchemaType },
  title?: string,
  description?: string,
  default?: any,
  format?: string
};
