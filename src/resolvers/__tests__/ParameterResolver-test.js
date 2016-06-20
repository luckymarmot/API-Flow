import Immutable from 'immutable'

import {
    UnitTest,
    registerTest,
    targets,
    against
} from '../../utils/TestUtils'

import {
    ClassMock
} from '../../mocks/PawMocks'

import ParameterResolver from '../ParameterResolver'

import Context, {
    Parameter,
    ParameterContainer
} from '../../models/Core'

import Auth from '../../models/Auth'
import URL from '../../models/URL'
import Group from '../../models/Group'
import Request from '../../models/Request'
import Constraint from '../../models/Constraint'

import ResolverOptions, {
    ParameterItem
} from '../../models/options/ResolverOptions'

@registerTest
@against(ParameterResolver)
export class TestParameterResolver extends UnitTest {

    @targets('resolveAll')
    testResolveAllWithNoResolutionsReturnsContext() {
        const resolver = this.__init()
        const context = new Context({
            group: new Group({
                name: 'some group',
                children: new Immutable.OrderedMap({
                    12: new Request()
                })
            })
        })

        const expected = context

        const result = resolver.resolveAll(context)

        this.assertEqual(expected, result)
    }

    @targets('resolveAll')
    testResolveAllWithNoParameterResolutionsReturnsContext() {
        const resolver = this.__init()
        const context = new Context({
            group: new Group({
                name: 'some group',
                children: new Immutable.OrderedMap({
                    12: new Request()
                })
            })
        })

        const opts = new ResolverOptions({
            resolve: [
                {
                    uri: '#/postman/userId',
                    value: '129571'
                }
            ]
        })

        const expected = context

        const result = resolver.resolveAll(context, opts)

        this.assertEqual(expected, result)
    }

    @targets('resolveAll')
    testResolveAllWithParameterResolutionsCallsTraverseGroup() {
        const resolver = this.__init()

        resolver.spyOn('_traverseGroup', () => {
            return 12
        })

        const context = new Context({
            group: new Group({
                name: 'some group',
                children: new Immutable.OrderedMap({
                    12: new Request()
                })
            })
        })

        const opts = new ResolverOptions({
            resolve: [
                {
                    key: 'api_key',
                    value: '129571'
                }
            ]
        })

        resolver.resolveAll(context, opts)

        this.assertEqual(resolver.spy._traverseGroup.count, 1)
    }

    @targets('resolveAll')
    testResolveAllWithParameterResolutionsCallsTraverseGroupWithGroupAndOpts() {
        const resolver = this.__init()

        resolver.spyOn('_traverseGroup', () => {
            return 12
        })

        const group = new Group({
            name: 'some group',
            children: new Immutable.OrderedMap({
                12: new Request()
            })
        })

        const context = new Context({
            group: group
        })

        const opts = new ResolverOptions({
            resolve: [
                {
                    key: 'api_key',
                    value: '129571'
                }
            ]
        })

        resolver.resolveAll(context, opts)

        this.assertEqual(resolver.spy._traverseGroup.count, 1)
        this.assertEqual(
            resolver.spy._traverseGroup.calls[0],
            [ group, opts.getIn([ 'resolve', 'custom' ]) ]
        )
    }

    @targets('resolveAll')
    testResolveAllWithParameterResolutionsReturnsExpectedContext() {
        const resolver = this.__init()

        resolver.spyOn('_traverseGroup', () => {
            return 12
        })

        const context = new Context({
            group: new Group({
                name: 'some group',
                children: new Immutable.OrderedMap({
                    12: new Request()
                })
            })
        })

        const opts = new ResolverOptions({
            resolve: [
                {
                    key: 'api_key',
                    value: '129571'
                }
            ]
        })

        const expected = new Context({
            group: 12
        })

        const result = resolver.resolveAll(context, opts)

        this.assertEqual(expected, result)
    }

    @targets('_traverseGroup')
    testTraverseGroupWithSimpleGroup() {
        const resolver = this.__init()

        const group = new Group({
            name: 'some group'
        })

        const expected = group
        const result = resolver._traverseGroup(group, null)

        this.assertEqual(expected, result)
    }

    @targets('_traverseGroup')
    testTraverseGroupWithWeirdObject() {
        const resolver = this.__init()

        const group = {
            some: 12,
            weird: 42,
            object: 90
        }

        const expected = group
        const result = resolver._traverseGroup(group, null)

        this.assertEqual(expected, result)
    }

    @targets('_traverseGroup')
    testTraverseGroupWithChildrenCallsTraverseGroupForEachChildren() {
        const resolver = this.__init()

        const group = new Group({
            name: 'some root group',
            children: new Immutable.OrderedMap({
                12: new Group({
                    id: 12,
                    name: 'sub group #1'
                }),
                42: new Group({
                    id: 42,
                    name: 'sub group #2'
                }),
                90: new Group({
                    id: 90,
                    name: 'sub group #3'
                })
            })
        })

        resolver._traverseGroup(group, null)

        this.assertEqual(resolver.spy._traverseGroup.count, 4)
        this.assertEqual(
            resolver.spy._traverseGroup.calls[0],
            [ group, null ]
        )

        this.assertEqual(
            resolver.spy._traverseGroup.calls[1],
            [
                new Group({
                    id: 12,
                    name: 'sub group #1'
                }),
                null
            ]
        )

        this.assertEqual(
            resolver.spy._traverseGroup.calls[2],
            [
                new Group({
                    id: 42,
                    name: 'sub group #2'
                }),
                null
            ]
        )

        this.assertEqual(
            resolver.spy._traverseGroup.calls[3],
            [
                new Group({
                    id: 90,
                    name: 'sub group #3'
                }),
                null
            ]
        )
    }

    @targets('_traverseGroup')
    testTraverseGroupWithRequestCallsTraverseRequest() {
        const resolver = this.__init()

        resolver.spyOn('_traverseRequest', () => {
            return 12
        })

        const group = new Request()

        resolver._traverseGroup(group, null)

        this.assertEqual(resolver.spy._traverseRequest.count, 1)
    }

    @targets('_traverseGroup')
    testTraverseGroupWithRequestCallsTraverseRequestWithRequestAndOpts() {
        const resolver = this.__init()

        resolver.spyOn('_traverseRequest', () => {
            return 12
        })

        const group = new Request()

        resolver._traverseGroup(group, 42)

        this.assertEqual(resolver.spy._traverseRequest.count, 1)
        this.assertEqual(
            resolver.spy._traverseRequest.calls[0],
            [ group, 42 ]
        )
    }

    @targets('_traverseGroup')
    testTraverseGroupWithRequestReturnsExpectedRequest() {
        const resolver = this.__init()

        resolver.spyOn('_traverseRequest', () => {
            return 12
        })

        const group = new Request()

        const expected = 12
        const result = resolver._traverseGroup(group, null)

        this.assertEqual(expected, result)
    }

    @targets('_traverseGroup')
    testTraverseGroupWithRequestCallsTraverseRequestForEachRequestInTree() {
        const resolver = this.__init()

        resolver.spyOn('_traverseRequest', () => {
            return 42
        })

        const group = new Group({
            name: 'some root group',
            children: new Immutable.OrderedMap({
                12: new Group({
                    id: 12,
                    name: 'sub group #1',
                    children: new Immutable.OrderedMap({
                        1242: new Request(),
                        1290: new Request()
                    })
                }),
                42: new Group({
                    id: 42,
                    name: 'sub group #2'
                }),
                90: new Group({
                    id: 90,
                    name: 'sub group #3'
                }),
                36: new Request()
            })
        })

        resolver._traverseGroup(group, null)

        this.assertEqual(resolver.spy._traverseRequest.count, 3)
    }

    @targets('_traverseGroup')
    testTraversGroupWithStandardGroupReturnsExpectedGroup() {
        const resolver = this.__init()

        resolver.spyOn('_traverseRequest', () => {
            return 42
        })

        const group = new Group({
            name: 'some root group',
            children: new Immutable.OrderedMap({
                12: new Group({
                    id: 12,
                    name: 'sub group #1',
                    children: new Immutable.OrderedMap({
                        1242: new Request(),
                        1290: new Request()
                    })
                }),
                42: new Group({
                    id: 42,
                    name: 'sub group #2'
                }),
                90: new Group({
                    id: 90,
                    name: 'sub group #3'
                }),
                36: new Request()
            })
        })

        const expected = new Group({
            name: 'some root group',
            children: new Immutable.OrderedMap({
                12: new Group({
                    id: 12,
                    name: 'sub group #1',
                    children: new Immutable.OrderedMap({
                        1242: 42,
                        1290: 42
                    })
                }),
                42: new Group({
                    id: 42,
                    name: 'sub group #2'
                }),
                90: new Group({
                    id: 90,
                    name: 'sub group #3'
                }),
                36: 42
            })
        })

        const result = resolver._traverseGroup(group, null)

        this.assertEqual(expected, result)
    }

    @targets('_traverseRequest')
    testTraverseRequestCallsUpdateURL() {
        const resolver = this.__init()

        resolver.spyOn('_updateURL', () => {
            return 12
        })

        resolver.spyOn('_updateParameters', () => {
            return 42
        })

        resolver.spyOn('_updateAuths', () => {
            return 90
        })

        const req = new Request()

        resolver._traverseRequest(req, null)

        this.assertEqual(resolver.spy._updateURL.count, 1)
    }

    @targets('_traverseRequest')
    testTraverseRequestCallsUpdateURLWithCorrectParams() {
        const resolver = this.__init()

        resolver.spyOn('_updateURL', () => {
            return 12
        })

        resolver.spyOn('_updateParameters', () => {
            return 42
        })

        resolver.spyOn('_updateAuths', () => {
            return 90
        })

        const req = new Request({
            url: new URL('https://echo.luckymarmot.com/users/create')
        })

        resolver._traverseRequest(req, 36)

        this.assertEqual(resolver.spy._updateURL.count, 1)
        this.assertJSONEqual(
            resolver.spy._updateURL.calls[0],
            [ new URL('https://echo.luckymarmot.com/users/create'), 36 ]
        )
    }

    @targets('_traverseRequest')
    testTraverseRequestCallsUpdateParameters() {
        const resolver = this.__init()

        resolver.spyOn('_updateURL', () => {
            return 12
        })

        resolver.spyOn('_updateParameters', () => {
            return 42
        })

        resolver.spyOn('_updateAuths', () => {
            return 90
        })

        const req = new Request()

        resolver._traverseRequest(req, null)

        this.assertEqual(resolver.spy._updateParameters.count, 1)
    }

    @targets('_traverseRequest')
    testTraverseRequestCallsUpdateParametersWithCorrectParams() {
        const resolver = this.__init()

        resolver.spyOn('_updateURL', () => {
            return 12
        })

        resolver.spyOn('_updateParameters', () => {
            return 42
        })

        resolver.spyOn('_updateAuths', () => {
            return 90
        })

        const parameters = new ParameterContainer({
            headers: new Immutable.List([
                new Parameter()
            ])
        })

        const req = new Request({
            parameters: parameters
        })

        resolver._traverseRequest(req, 36)

        this.assertEqual(resolver.spy._updateParameters.count, 1)
        this.assertEqual(
            resolver.spy._updateParameters.calls[0],
            [ parameters, 36 ]
        )
    }

    @targets('_traverseRequest')
    testTraverseRequestCallsUpdateAuths() {
        const resolver = this.__init()

        resolver.spyOn('_updateURL', () => {
            return 12
        })

        resolver.spyOn('_updateParameters', () => {
            return 42
        })

        resolver.spyOn('_updateAuths', () => {
            return 90
        })

        const req = new Request()

        resolver._traverseRequest(req, null)

        this.assertEqual(resolver.spy._updateAuths.count, 1)
    }

    @targets('_traverseRequest')
    testTraverseRequestCallsUpdateAuthsWithCorrectParams() {
        const resolver = this.__init()

        resolver.spyOn('_updateURL', () => {
            return 12
        })

        resolver.spyOn('_updateParameters', () => {
            return 42
        })

        resolver.spyOn('_updateAuths', () => {
            return 90
        })

        const auths = new Immutable.List([
            new Auth.Basic(), new Auth.OAuth2()
        ])

        const req = new Request({
            auths: auths
        })

        resolver._traverseRequest(req, 36)

        this.assertEqual(resolver.spy._updateAuths.count, 1)
        this.assertEqual(
            resolver.spy._updateAuths.calls[0],
            [ auths, 36 ]
        )
    }

    @targets('_traverseRequest')
    testTraverseRequestReturnsExpectedRequest() {
        const resolver = this.__init()

        resolver.spyOn('_updateURL', () => {
            return 12
        })

        resolver.spyOn('_updateParameters', () => {
            return 42
        })

        resolver.spyOn('_updateAuths', () => {
            return 90
        })

        const req = new Request()

        const expected = new Request({
            url: 12,
            parameters: 42,
            auths: 90
        })

        const result = resolver._traverseRequest(req, 36)

        this.assertEqual(expected, result)
    }

    @targets('_updateParameter')
    testUpdateParameterWithSimpleParameter() {
        const resolver = this.__init()

        const param = new Parameter()
        const values = new Immutable.OrderedMap({
            api_key: new ParameterItem({
                key: 'api_key',
                value: 123135098
            })
        })

        const expected = param
        const result = resolver._updateParameter(param, values)

        this.assertEqual(expected, result)
    }

    @targets('_updateParameter')
    testUpdateParameterWithNonMatchingParameter() {
        const resolver = this.__init()

        const param = new Parameter({
            key: 'userId',
            name: 'userId',
            value: '124098',
            type: 'string',
            internals: new Immutable.List([
                new Constraint.Enum([ '124098' ])
            ])
        })

        const values = new Immutable.OrderedMap({
            api_key: new ParameterItem({
                key: 'api_key',
                value: 123135098
            })
        })

        const expected = param
        const result = resolver._updateParameter(param, values)

        this.assertEqual(expected, result)
    }

    @targets('_updateParameter')
    testUpdateParameterWithMatchingParameter() {
        const resolver = this.__init()

        const param = new Parameter({
            key: 'api_key',
            name: 'API Key',
            value: '124098',
            type: 'string',
            internals: new Immutable.List([
                new Constraint.Enum([ '124098' ])
            ])
        })

        const values = new Immutable.OrderedMap({
            api_key: new ParameterItem({
                key: 'api_key',
                value: 123135098
            })
        })

        const expected = new Parameter({
            key: 'api_key',
            name: 'API Key',
            value: '123135098',
            type: 'string',
            internals: new Immutable.List([
                new Constraint.Enum([ '123135098' ])
            ])
        })

        const result = resolver._updateParameter(param, values)

        this.assertJSONEqual(expected, result)
    }

    @targets('_updateParameter')
    testUpdateParameterWithSequenceParameterCallsUpdateParameterForEachItem() {
        const resolver = this.__init()

        const param = new Parameter({
            key: 'userId',
            name: 'userId',
            value: new Immutable.List([
                new Parameter({
                    type: 'string',
                    value: '/users/',
                    internals: new Immutable.List([
                        new Constraint.Enum([ '/users/' ])
                    ])
                }),
                new Parameter({
                    key: 'userId',
                    name: 'userId',
                    type: 'integer',
                    internals: new Immutable.List([
                        new Constraint.Minimum(0),
                        new Constraint.Maximum(100)
                    ])
                })
            ]),
            type: 'string',
            format: 'sequence'
        })

        const values = new Immutable.OrderedMap({
            api_key: new ParameterItem({
                key: 'api_key',
                value: 123135098
            })
        })

        resolver._updateParameter(param, values)

        this.assertEqual(resolver.spy._updateParameter.count, 3)
    }

    @targets('_updateParameter')
    testUpdateParameterWithMatchingSequenceParameterDoesNotCallForEachItem() {
        const resolver = this.__init()

        const param = new Parameter({
            key: 'pathname',
            name: 'pathname',
            value: new Immutable.List([
                new Parameter({
                    type: 'string',
                    value: '/users/',
                    internals: new Immutable.List([
                        new Constraint.Enum([ '/users/' ])
                    ])
                }),
                new Parameter({
                    key: 'userId',
                    name: 'userId',
                    type: 'integer',
                    internals: new Immutable.List([
                        new Constraint.Minimum(0),
                        new Constraint.Maximum(100)
                    ])
                })
            ]),
            type: 'string',
            format: 'sequence'
        })

        const values = new Immutable.OrderedMap({
            pathname: new ParameterItem({
                key: 'pathname',
                value: '/users/12'
            })
        })

        resolver._updateParameter(param, values)

        this.assertEqual(resolver.spy._updateParameter.count, 1)
    }

    @targets('_updateParameter')
    testUpdateParameterWithMatchingSequenceParameterReturnsExpectedParam() {
        const resolver = this.__init()

        const param = new Parameter({
            key: 'pathname',
            name: 'pathname',
            value: new Immutable.List([
                new Parameter({
                    type: 'string',
                    value: '/users/',
                    internals: new Immutable.List([
                        new Constraint.Enum([ '/users/' ])
                    ])
                }),
                new Parameter({
                    key: 'userId',
                    name: 'userId',
                    type: 'integer',
                    internals: new Immutable.List([
                        new Constraint.Minimum(0),
                        new Constraint.Maximum(100)
                    ])
                })
            ]),
            type: 'string',
            format: 'sequence'
        })

        const values = new Immutable.OrderedMap({
            pathname: new ParameterItem({
                key: 'pathname',
                value: '/users/12'
            })
        })

        const expected = new Parameter({
            key: 'pathname',
            name: 'pathname',
            value: '/users/12',
            type: 'string',
            internals: new Immutable.List([
                new Constraint.Enum([ '/users/12' ])
            ])
        })

        const result = resolver._updateParameter(param, values)

        this.assertJSONEqual(expected, result)
    }

    @targets('_updateParameter')
    testUpdateParameterWithMatchingSequenceItemsReturnsExpectedParam() {
        const resolver = this.__init()

        const param = new Parameter({
            key: 'pathname',
            name: 'pathname',
            value: new Immutable.List([
                new Parameter({
                    type: 'string',
                    value: '/users/',
                    internals: new Immutable.List([
                        new Constraint.Enum([ '/users/' ])
                    ])
                }),
                new Parameter({
                    key: 'userId',
                    name: 'userId',
                    type: 'integer',
                    internals: new Immutable.List([
                        new Constraint.Minimum(0),
                        new Constraint.Maximum(100)
                    ])
                }),
                new Parameter({
                    type: 'string',
                    value: '/songs/',
                    internals: new Immutable.List([
                        new Constraint.Enum([ '/songs/' ])
                    ])
                }),
                new Parameter({
                    key: 'songId',
                    name: 'songId',
                    type: 'integer',
                    internals: new Immutable.List([
                        new Constraint.Minimum(0),
                        new Constraint.Maximum(100)
                    ])
                })
            ]),
            type: 'string',
            format: 'sequence'
        })

        const values = new Immutable.OrderedMap({
            userId: new ParameterItem({
                key: 'userId',
                value: 12
            }),
            songId: new ParameterItem({
                key: 'songId',
                value: 42
            })
        })

        const expected = new Parameter({
            key: 'pathname',
            name: 'pathname',
            value: new Immutable.List([
                new Parameter({
                    type: 'string',
                    value: '/users/',
                    internals: new Immutable.List([
                        new Constraint.Enum([ '/users/' ])
                    ])
                }),
                new Parameter({
                    key: 'userId',
                    name: 'userId',
                    value: '12',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([ '12' ])
                    ])
                }),
                new Parameter({
                    type: 'string',
                    value: '/songs/',
                    internals: new Immutable.List([
                        new Constraint.Enum([ '/songs/' ])
                    ])
                }),
                new Parameter({
                    key: 'songId',
                    name: 'songId',
                    value: '42',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([ '42' ])
                    ])
                })
            ]),
            type: 'string',
            format: 'sequence'
        })

        const result = resolver._updateParameter(param, values)

        this.assertJSONEqual(expected, result)
    }

    @targets('_updateParameter')
    testUpdateParameterWithMultiParameterCallsUpdateParameterForEachItem() {
        const resolver = this.__init()

        const param = new Parameter({
            key: 'superUserId',
            name: 'superUserId',
            value: new Immutable.List([
                new Parameter({
                    key: 'userId',
                    name: 'userId',
                    type: 'integer',
                    internals: new Immutable.List([
                        new Constraint.Minimum(500),
                        new Constraint.Maximum(5000)
                    ])
                }),
                new Parameter({
                    key: 'userId',
                    name: 'userId',
                    type: 'integer',
                    internals: new Immutable.List([
                        new Constraint.Minimum(0),
                        new Constraint.Maximum(100)
                    ])
                })
            ]),
            type: 'multi'
        })

        const values = new Immutable.OrderedMap({
            api_key: new ParameterItem({
                key: 'api_key',
                value: 123135098
            })
        })

        resolver._updateParameter(param, values)

        this.assertEqual(resolver.spy._updateParameter.count, 3)
    }

    @targets('_updateParameter')
    testUpdateParameterWithMatchingMultiParameterDoesNotCallForEachItem() {
        const resolver = this.__init()

        const param = new Parameter({
            key: 'pathname',
            name: 'pathname',
            value: new Immutable.List([
                new Parameter({
                    type: 'string',
                    value: '/users/',
                    internals: new Immutable.List([
                        new Constraint.Enum([ '/users/' ])
                    ])
                }),
                new Parameter({
                    key: 'userId',
                    name: 'userId',
                    type: 'integer',
                    internals: new Immutable.List([
                        new Constraint.Minimum(0),
                        new Constraint.Maximum(100)
                    ])
                })
            ]),
            type: 'multi'
        })

        const values = new Immutable.OrderedMap({
            pathname: new ParameterItem({
                key: 'pathname',
                value: '/users/12'
            })
        })

        resolver._updateParameter(param, values)

        this.assertEqual(resolver.spy._updateParameter.count, 1)
    }

    @targets('_updateParameter')
    testUpdateParameterWithMatchingMultiParameterReturnsExpectedParam() {
        const resolver = this.__init()

        const param = new Parameter({
            key: 'pathname',
            name: 'pathname',
            value: new Immutable.List([
                new Parameter({
                    type: 'string',
                    value: '/users/',
                    internals: new Immutable.List([
                        new Constraint.Enum([ '/users/' ])
                    ])
                }),
                new Parameter({
                    key: 'userId',
                    name: 'userId',
                    type: 'integer',
                    internals: new Immutable.List([
                        new Constraint.Minimum(0),
                        new Constraint.Maximum(100)
                    ])
                })
            ]),
            type: 'multi'
        })

        const values = new Immutable.OrderedMap({
            pathname: new ParameterItem({
                key: 'pathname',
                value: '/users/12'
            })
        })

        const expected = new Parameter({
            key: 'pathname',
            name: 'pathname',
            value: '/users/12',
            type: 'string',
            internals: new Immutable.List([
                new Constraint.Enum([ '/users/12' ])
            ])
        })

        const result = resolver._updateParameter(param, values)

        this.assertJSONEqual(expected, result)
    }

    @targets('_updateParameter')
    testUpdateParameterWithMatchingMultiParameterItemsReturnsExpectedParam() {
        const resolver = this.__init()

        const param = new Parameter({
            key: 'objectId',
            name: 'objectId',
            value: new Immutable.List([
                new Parameter({
                    key: 'userId',
                    name: 'userId',
                    type: 'integer',
                    internals: new Immutable.List([
                        new Constraint.Minimum(0),
                        new Constraint.Maximum(100)
                    ])
                }),
                new Parameter({
                    key: 'songId',
                    name: 'songId',
                    type: 'integer',
                    internals: new Immutable.List([
                        new Constraint.Minimum(0),
                        new Constraint.Maximum(100)
                    ])
                })
            ]),
            type: 'multi'
        })

        const values = new Immutable.OrderedMap({
            userId: new ParameterItem({
                key: 'userId',
                value: 12
            }),
            songId: new ParameterItem({
                key: 'songId',
                value: 42
            })
        })

        const expected = new Parameter({
            key: 'objectId',
            name: 'objectId',
            value: new Immutable.List([
                new Parameter({
                    key: 'userId',
                    name: 'userId',
                    value: '12',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([ '12' ])
                    ])
                }),
                new Parameter({
                    key: 'songId',
                    name: 'songId',
                    value: '42',
                    type: 'string',
                    internals: new Immutable.List([
                        new Constraint.Enum([ '42' ])
                    ])
                })
            ]),
            type: 'multi'
        })

        const result = resolver._updateParameter(param, values)

        this.assertJSONEqual(expected, result)
    }

    @targets('_updateURL')
    testUpdateURLCallsUpdateParameterForEachKey() {
        const resolver = this.__init()

        resolver.spyOn('_updateParameter', () => {
            return 12
        })

        resolver._updateURL(new URL('https://echo.luckymarmot.com/path'), null)

        this.assertEqual(resolver.spy._updateParameter.count, 9)
    }

    @targets('_updateURL')
    testUpdateURLReturnsExpectedURL() {
        const resolver = this.__init()

        resolver.spyOn('_updateParameter', () => {
            return 12
        })

        const url = new URL('https://echo.luckymarmot.com/path')

        const expected = new URL()
            .set('protocol', 12)
            .set('username', 12)
            .set('password', 12)
            .set('host', 12)
            .set('hostname', 12)
            .set('port', 12)
            .set('pathname', 12)
            .set('search', 12)
            .set('hash', 12)

        const result = resolver._updateURL(url, null)

        this.assertEqual(expected, result)
    }

    @targets('_updateParameters')
    testUpdateParametersWithSimpleContainer() {
        const resolver = this.__init()

        resolver.spyOn('_updateParameter', () => {
            return 12
        })

        const container = new ParameterContainer()

        const expected = container
        const result = resolver._updateParameters(container, null)

        this.assertEqual(expected, result)
    }

    @targets('_updateParameters')
    testUpdateParametersCallsUpdateParameterForEachParamInContainer() {
        const resolver = this.__init()

        resolver.spyOn('_updateParameter', () => {
            return 12
        })

        const container = new ParameterContainer({
            headers: new Immutable.List([
                new Parameter(),
                new Parameter()
            ]),
            queries: new Immutable.List([
                new Parameter()
            ]),
            body: new Immutable.List([
                new Parameter(),
                new Parameter()
            ]),
            path: new Immutable.List([
                new Parameter(),
                new Parameter()
            ])
        })

        resolver._updateParameters(container, null)

        this.assertEqual(resolver.spy._updateParameter.count, 7)
    }

    @targets('_updateParameters')
    testUpdateParametersReturnsExpectedContainer() {
        const resolver = this.__init()

        resolver.spyOn('_updateParameter', () => {
            return 12
        })

        const container = new ParameterContainer({
            headers: new Immutable.List([
                new Parameter(),
                new Parameter()
            ]),
            queries: new Immutable.List([
                new Parameter()
            ]),
            body: new Immutable.List([
                new Parameter(),
                new Parameter()
            ]),
            path: new Immutable.List([
                new Parameter(),
                new Parameter()
            ])
        })

        const expected = new ParameterContainer({
            headers: new Immutable.List([
                12, 12
            ]),
            queries: new Immutable.List([
                12
            ]),
            body: new Immutable.List([
                12, 12
            ]),
            path: new Immutable.List([
                12, 12
            ])
        })

        const result = resolver._updateParameters(container, null)

        this.assertEqual(expected, result)
    }

    @targets('_getValueFromKey')
    testGetValueFromKeyWithNonMatchingKey() {
        const resolver = this.__init()

        const values = new Immutable.OrderedMap({
            secret: new ParameterItem({
                key: 'secret',
                value: 1205971
            }),
            password: new ParameterItem({
                key: 'password',
                value: 2039582
            })
        })

        const key = 'username'

        const expected = null
        const result = resolver._getValueFromKey(key, values)

        this.assertEqual(expected, result)
    }

    @targets('_getValueFromKey')
    testGetValueFromKeyWithMatchingKey() {
        const resolver = this.__init()

        const values = new Immutable.OrderedMap({
            secret: new ParameterItem({
                key: 'secret',
                value: 1205971
            }),
            password: new ParameterItem({
                key: 'password',
                value: 2039582
            })
        })

        const key = 'password'

        const expected = new ParameterItem({
            key: 'password',
            value: 2039582
        })
        const result = resolver._getValueFromKey(key, values)

        this.assertEqual(expected, result)
    }

    @targets('_updateAuths')
    testUpdateAuthsWithEmptyAuthList() {
        const resolver = this.__init()

        resolver.spyOn('_getValueFromKey', () => {
            return 12
        })

        const auths = new Immutable.List()

        const expected = auths
        const result = resolver._updateAuths(auths, null)

        this.assertEqual(expected, result)
    }

    @targets('_updateAuths')
    testUpdateAuthsWithAuthListContainingNullAuth() {
        const resolver = this.__init()

        resolver.spyOn('_getValueFromKey', () => {
            return 12
        })

        const auths = new Immutable.List([ null ])

        const expected = auths
        const result = resolver._updateAuths(auths, null)

        this.assertEqual(expected, result)
    }

    @targets('_updateAuths')
    testUpdateAuthsCallsGetValueFromKeyForEachKeyInEachAuth() {
        const resolver = this.__init()

        resolver.spyOn('_getValueFromKey', () => {
            return new ParameterItem({
                value: 12
            })
        })

        const auths = new Immutable.List([
            new Auth.Basic(),
            new Auth.Digest()
        ])

        resolver._updateAuths(auths, null)

        this.assertEqual(resolver.spy._getValueFromKey.count, 5)
    }

    @targets('_updateAuths')
    testUpdateAuthsReturnsExpectedAuthList() {
        const resolver = this.__init()

        let returnNull = false
        resolver.spyOn('_getValueFromKey', () => {
            if (returnNull) {
                returnNull = false
                return null
            }

            returnNull = true
            return new ParameterItem({
                value: 12
            })
        })

        const auths = new Immutable.List([
            new Auth.Basic(),
            new Auth.Digest()
        ])

        const expected = new Immutable.List([
            new Auth.Basic({
                username: 12,
                raw: 12
            }),
            new Auth.Digest({
                password: 12
            })
        ])

        const result = resolver._updateAuths(auths, null)

        this.assertEqual(expected, result)
    }

    __init() {
        const resolver = new ClassMock(new ParameterResolver(), '')
        return resolver
    }
}
