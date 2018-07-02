import { resolve } from 'path'
import { existsSync } from 'fs'
import minimist from 'minimist'
import chalk from 'chalk'
import ApiFlow from '../src/api-flow'

// chalk
const success = chalk.bold.green
const error = chalk.bold.red

// formats
const formats = {
  swagger: {
    format: 'swagger',
    version: 'v2.0',
  },
  raml: {
    format: 'raml',
    version: 'v1.0',
  },
  paw: {
    format: 'paw',
    version: 'v3.0',
  },
  postman: {
    format: 'postman-collection',
    version: 'v2.0',
  },
  internal: {
    format: 'internal',
    version: 'v1.0',
  },
}

// parse CLI
const args = minimist(process.argv.slice(2), {
  string: [ 'from', 'to' ],
  default: {
    to: 'internal'
  },
})
const params = args['_']

if (params.length > 1) {
  console.log(error('too many parameters'))
  process.exit(1)
}
if (params.length === 0) {
  console.log(error('missing input parameter'))
  process.exit(1)
}
if (!formats[args.from]) {
  console.log(error(`unknown format ${args.from}`))
  process.exit(1)
}
if (!formats[args.to]) {
  console.log(error(`unknown format ${args.to}`))
  process.exit(1)
}

const input = resolve(params[0])

if (!existsSync(input)) {
  console.log(error(`file does not exist: ${input}`))
  process.exit(1)
}

const options = ApiFlow.setup({
  options: {
    source: {
      format: formats[args.from].format,
      version: formats[args.from].version,
    },
    target: {
      format: formats[args.to].format,
      version: formats[args.to].version,
    },
  }
})

ApiFlow
  .transform({
    options,
    uri: `file:///${input}`,
  })
  .then(serialized => {
    console.log(serialized)
  })
  .catch(e => {
    console.error('got err:\n', e.stack)
  })
