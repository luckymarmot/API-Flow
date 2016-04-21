import Immutable from 'immutable'
import { Request } from '../../../../../models/Core'
import { Group } from '../../../../../models/Utils'

export default class BaseImporterFixtures {
    static getApplyFuncOverGroupTreeCases() {
        return [
            {
                name: 'SimpleTest',
                inputs: [
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
                    new Group({
                        children: new Immutable.OrderedMap({
                            '/test': new Request({
                                name: 1
                            }),
                            '/path': new Request({
                                name: 2
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
            },
            {
                name: 'MultipleDepthGroupTest',
                inputs: [
                    new Group({
                        children: new Immutable.OrderedMap({
                            '/test': new Request({
                                name: 1
                            }),
                            subTree: new Group({
                                children: new Immutable.OrderedMap({
                                    '/path': new Request({
                                        name: 2
                                    })
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
