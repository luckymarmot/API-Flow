var FlowCLI = require('../lib/flow-node.js').default;

console.error(FlowCLI, process.argv);

var cli = new FlowCLI(process.argv);
cli.run();