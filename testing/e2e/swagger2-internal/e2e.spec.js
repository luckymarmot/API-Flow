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

import ApiFlow from '../../../src/api-flow'

const compare = (actual, expected) => {
  const delta = diff.diffJson(actual, expected)
  if (
    delta.length === 1 &&
    typeof delta[0].removed === 'undefined' &&
    typeof delta[0].added === 'undefined'
  ) {
    return true
  }

  /* eslint-disable no-console */
  console.log('\x1b[42m' +
    (new Array(6)).join('-------------\n') + '\x1b[0m')
  delta.forEach(part => {
    let color = 'grey'
    if (part.added) {
      color = 'green'
    }
    else if (part.removed) {
      color = 'red'
    }
    process.stderr.write(part.value[color])
  })
  /* eslint-enable no-console */

  return false
}

const fixDiff = (actual) => {
  if (process.env.FIX === 'swagger-v2.0--internal-v1.0') {
    /* eslint-disable no-console */
    console.log('updating spec')
    /* eslint-enable no-console */
    fs.writeFileSync(resolve(__dirname, './output.json'), actual)
  }
}

describe('swagger v2 -> internal', () => {
  it('should match expected output', (done) => {
    // const input = fs.readFileSync(resolve(__dirname, './input.json'), 'utf-8').toString()
    const output = fs.readFileSync(resolve(__dirname, './output.json'), 'utf-8').toString()
    // const item = { content: input }
    /* eslint-disable no-console */
    try {
      const options = ApiFlow.setup({
        options: {
          source: { format: 'swagger', version: 'v2.0' },
          target: { format: 'internal', version: 'v1.0' }
        }
      })

      ApiFlow
        .transform({ options, uri: 'file://' + resolve(__dirname, './input.json') })
        .then(serialized => {
          const success = compare(serialized, output)
          if (!success) {
            done(new Error('found differences'))
            return fixDiff(serialized)
          }
          done()
        }, e => {
          console.error('got err:\n', e.stack)
          done()
        })
        .catch()
    }
    catch (e) {
      console.error(e.stack)
      expect(true).toEqual(false)
      done()
    }
    /* eslint-enable no-console */
  })
})
