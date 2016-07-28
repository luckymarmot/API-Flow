var FlowCLI = require('../lib/runners/flow-node.js').default;

var cli = new FlowCLI(process.argv);
cli.run();
