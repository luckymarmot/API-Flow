require('colors')
import fs from 'fs'
import { resolve } from 'path'

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
  if (process.env.FIX === 'raml-v1.0--internal-v1.0') {
    /* eslint-disable no-console */
    console.log('updating spec')
    /* eslint-enable no-console */
    fs.writeFileSync(resolve(__dirname, './output.raml'), actual)
  }
}

describe('raml v1 -> internal', () => {
  it('should match expected output', (done) => {
    const output = fs.readFileSync(resolve(__dirname, './output.raml'), 'utf-8').toString()
    // const item = { content: input }
    /* eslint-disable no-console */
    try {
      const options = ApiFlow.setup({
        options: {
          source: { format: 'raml', version: 'v1.0' },
          target: { format: 'internal', version: 'v1.0' }
        }
      })

      console.log('hey there 3')
      ApiFlow
        .transform({ options, uri: 'file://' + resolve(__dirname, './input.raml') })
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
