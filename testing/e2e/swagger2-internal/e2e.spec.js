require('colors')
import fs from 'fs'
import { resolve } from 'path'

/* gen-utils normalization */
import seedrandom from 'seedrandom'
seedrandom('swagger-e2e-seed', { global: true })
import { __internals__ } from '../../../src/utils/gen-utils'
__internals__.date = new Date(1).getTime()
/* end of gen-utils normalization */

import expect from 'expect'
const diff = require('diff')

import SwaggerParser from '../../../src/parsers/swagger/v2.0/Parser'
import InternalSerializer from '../../../src/serializers/internal/Serializer'

describe('swagger v2 -> internal', () => {
  it('should match expected output', () => {
    const input = fs.readFileSync(resolve(__dirname, './input.json'), 'utf-8').toString()
    const output = fs.readFileSync(resolve(__dirname, './output.json'), 'utf-8').toString()
    const item = { content: input }

    const parser = new SwaggerParser()
    const serializer = new InternalSerializer()

    try {
      const api = parser.parse(item)
      const actual = serializer.serialize(api)
      if (actual + '\n' === output) {
        expect(true).toEqual(true)
      }
      else {
        console.log(actual)
        console.log('----------------------------------------------')
        console.log(output)
        expect(true).toEqual(false)
      }
    }
    catch (e) {
      console.error(e.stack)
      expect(true).toEqual(false)
    }
  })
})
