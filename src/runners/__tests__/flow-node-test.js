// import fs from 'fs'
import { ArgumentParser } from 'argparse'

import {
    UnitTest,
    registerTest,
    targets,
    against
} from '../../utils/TestUtils'


import {
    ClassMock
} from '../../mocks/PawMocks'

import FlowCLI from '../flow-node'

import Options from '../../models/options/Options'

@registerTest
@against(FlowCLI)
export class TestNodeRunner extends UnitTest {

    @targets('_createParser')
    testCreateParserReturnsArgumentParser() {
        const flow = this.__init()

        const parser = flow._createParser()

        this.assertEqual(parser instanceof ArgumentParser, true)
    }

    @targets('processArguments')
    testProcessArgumentsUpdatesOptions() {
        const flow = this.__init([ 'fake-source.json', '-f', 'raml' ])

        const parser = flow._createParser()
        flow.processArguments(parser)

        const options = flow.options
        const expectedOptions = new Options({
            parser: {
                name: 'raml'
            },
            resolver: {
                base: 'local'
            }
        })

        this.assertEqual(expectedOptions, options)

        const input = flow.input
        const expectedInput = 'fake-source.json'

        this.assertEqual(expectedInput, input)
    }

    @targets('run')
    _testRun() {}

    @targets('detect')
    _testRun() {}

    @targets('transform')
    _testRun() {}

    __init(argv = [ 'fake-source.json' ]) {
        const args = [ 'node', 'api-flow.js' ].concat(argv)
        process.argv = args
        const flow = new ClassMock(new FlowCLI(), '')
        return flow
    }
}
