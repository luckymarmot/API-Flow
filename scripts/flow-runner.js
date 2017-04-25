const execFile = require('child_process').execFile
const flow = require('flow-bin')
import chokidar from 'chokidar'

/**
 * A helper function to run flow tests. Clears the window and the prints
 * the status of flow.
 * @returns {void} nothing
 */
function runSuite() {
    execFile(flow, [ 'status', '--color', 'always' ], (err, stdout) => {
        process.stdout.write('\x1Bc')
        /* eslint-disable no-console */
        console.log(stdout)
        /* eslint-enable no-console */
    })
}

/**
 * Chokidar watches all the files for any kind of change and calls the run
 * function from above. Read more: https://github.com/paulmillr/chokidar
 * @param  {string} a glob of files to watch
 * @param  {object} settings
 */
chokidar.watch('src/**/*.js', {
    persistent: true
}).on('change', () => runSuite())
