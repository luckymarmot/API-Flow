var FlowCLI = require('../lib/runners/flow-node.js').default;

var cli = new FlowCLI(process.argv);
var parser = cli._createParser();
cli.processArguments(parser);
cli.run();
