/* eslint-disable */
var FlowCLI = require('../dist/node/api-flow.js').default;

var cli = new FlowCLI(process.argv);
var parser = cli._createParser();
cli.processArguments(parser);
cli.run().then((data) => {
    console.log(data)
});
