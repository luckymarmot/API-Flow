import Immutable from 'immutable'
import Request from '../../../../models/Request'
import Group from '../../../../models/Group'

export default class BaseImporterFixtures {
    static getApplyFuncOverGroupTreeCases() {
        return [
            {
                name: 'SimpleTest',
                inputs: [
                    new Immutable.OrderedMap(),
                    new Group(),
                    null,
                    (currentName, parent) => {
                        return parent
                    }
                ],
                output: []
            },
            {
                name: 'SingleDepthGroupTest',
                inputs: [
                    new Immutable.OrderedMap({
                        1: new Request({
                            name: 1
                        }),
                        2: new Request({
                            name: 2
                        })
                    }),
                    new Group({
                        children: new Immutable.OrderedMap({
                            '/test': '1',
                            '/path': '2'
                        })
                    }),
                    (arg) => {
                        return arg.get('name') * arg.get('name')
                    },
                    (currentName, parent) => {
                        return parent
                    }
                ],
                output: [ 1, 4 ]
            },
            {
                name: 'MultipleDepthGroupTest',
                inputs: [
                    new Immutable.OrderedMap({
                        1: new Request({
                            name: 1
                        }),
                        2: new Request({
                            name: 2
                        })
                    }),
                    new Group({
                        children: new Immutable.OrderedMap({
                            '/test': '1',
                            subTree: new Group({
                                children: new Immutable.OrderedMap({
                                    '/path': '2'
                                })
                            })
                        })
                    }),
                    (arg) => {
                        return arg.get('name') * arg.get('name')
                    },
                    (currentName, parent) => {
                        return parent
                    }
                ],
                output: [ 1, 4 ]
            }
        ]
    }
}
