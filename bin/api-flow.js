var FlowCLI = require('../lib/flow-node.js').default;

var cli = new FlowCLI(process.argv);
cli.run();
