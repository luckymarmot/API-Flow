import Mocha from 'mocha'
import chokidar from 'chokidar'
import path from 'path'

const configPath = path.join(__dirname, '../src/api-flow-config.js')

const Module = require('module')
const realResolve = Module._resolveFilename
Module._resolveFilename = (request, parent) => {
  if (request === 'api-flow-config') {
    return configPath
  }
  const resolved = realResolve(request, parent)
  return resolved
}
// Let's import and globalize testing tools so
// there's no need to require them in each test

// Environment setup (used by Babel as well, see .babelrc)
process.env.NODE_ENV = 'test'


/**
 * A helper function to run Mocha tests. Since Mocha doesn't support changing
 * tested files dynamically (except for adding), we need to clear require's
 * cache on every run and instantiate a new runner.
 */
const fileList = []
function runSuite() {
  Object.keys(require.cache).forEach(key => delete require.cache[key])
  const mocha = new Mocha({ reporter: 'spec' })
  fileList.forEach(filepath => mocha.addFile(filepath))
  try {
    mocha.run()
    global.gc()
  }
  catch (e) {
    /* eslint-disable no-console */
    console.log('------------')
    console.log('Failed with Error', e)
    console.log('------------')
    /* eslint-enable no-console */
  }
}

/**
 * Chokidar watches all the files for any kind of change and calls the run function
 * from above. Read more: https://github.com/paulmillr/chokidar
 * @param  {string} a glob of files to watch
 * @param  {object} settings
 */
chokidar.watch('testing/e2e/**/*.spec.js', { persistent: true })
  .on('add', $path => fileList.push($path))
  .on('change', () => runSuite())
  .on('ready', () => runSuite())

chokidar.watch('src/**/*.js', {
  ignored: /\.spec\.js/,
  persistent: true
})
  .on('change', () => runSuite())
