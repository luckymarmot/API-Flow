require('colors')
import fs from 'fs'
import { resolve } from 'path'

import expect from 'expect'
const diff = require('diff')

import ApiFlow from '../../../src/api-flow'

const compare = (actual, expected = '{}') => {
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

const fixDiff = (actual, index) => {
  if (process.env.FIX === 'internal-v1.0--swagger-v2.0') {
    /* eslint-disable no-console */
    console.log('updating spec')
    /* eslint-enable no-console */
    fs.writeFileSync(resolve(__dirname, './test-case-' + index + '/output.json'), actual)
  }
}

describe('internal -> swagger v2', () => {
  for (let index = 0; index < 2; index += 1) {
    it('should match expected output for test case #' + index, (done) => {
      const output = fs.readFileSync(
        resolve(__dirname, './test-case-' + index + '/output.json'),
        'utf-8'
      ).toString()
      // const item = { content: input }
      /* eslint-disable no-console */
      try {
        const options = ApiFlow.setup({
          options: {
            source: { format: 'internal', version: 'v1.0' },
            target: { format: 'swagger', version: 'v2.0' }
          }
        })

        ApiFlow
        .transform({
          options,
          uri: 'file://' + resolve(__dirname, './test-case-' + index + '/input.json')
        })
        .then(serialized => {
          const success = compare(serialized, output)
          if (!success) {
            done(new Error('found differences'))
            return fixDiff(serialized, index)
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
  }
})
