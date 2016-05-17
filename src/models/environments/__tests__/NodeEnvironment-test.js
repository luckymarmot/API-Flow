import path from 'path'

import {
    UnitTest,
    registerTest,
    targets,
    against
} from '../../../utils/TestUtils'

import NodeEnvironment, {
    FileResolver,
    URLResolver
} from '../NodeEnvironment'
import Item from '../../Item'


@registerTest
@against(NodeEnvironment)
export class TestNodeEnvironment extends UnitTest {

    @targets('getResolver')
    testGetResolver() {
        let env = this.__init()
        const item = new Item({
            content: 'toto',
            file: {
                path: '/some/absolute/path/',
                name: 'swagger.json'
            }
        })

        let result = env.getResolver(item)
        this.assertEqual(result, null)

        env = env.setIn([ 'cache', '/some/absolute/path/swagger.json' ], 12)

        result = env.getResolver(item)
        this.assertEqual(result, 12)
    }

    @targets('addResolver')
    testAddResolverWithFileResolver() {
        const env = this.__init()
        const item = new Item({
            content: 'toto',
            file: {
                path: '/some/absolute/path/',
                name: 'swagger.json'
            }
        })

        let _env = env.addResolver(item, 'file')

        this.assertEqual(
            _env.get('cache').keySeq(),
            [ '/some/absolute/path/swagger.json' ]
        )
    }

    @targets('addResolver')
    testAddResolverWithURLResolver() {
        const env = this.__init()
        const url =
            'https://apis-guru.github.io/' +
            'api-models/apis-guru.github.io/1.0/' +
            'swagger.json'

        const item = new Item({
            content: 'toto',
            url: url
        })

        let _env = env.addResolver(item, 'url')

        this.assertEqual(
            _env.get('cache').keySeq(),
            [ url ]
        )
    }


    __init() {
        const env = new NodeEnvironment()
        return env
    }
}

@registerTest
@against(FileResolver)
export class TestFileResolver extends UnitTest {

    @targets('resolve')
    testResolveWithLocalData(done) {
        const item = new Item({
            content: 'toto',
            file: {
                path: '/some/absolute/path/',
                name: 'swagger.json'
            }
        })
        let resolver = this.__init(item)

        let result = resolver.resolve('')
        result.then((data) => {
            this.assertEqual(data, 'toto')
            done()
        }, error => {
            throw new Error(error)
        }).catch(error => {
            done(new Error(error))
        })
    }

    @targets('resolve')
    testResolveWithAbsoluteData(done) {
        const _path = path.join(__dirname, '/collections/dummy.json')
        const item = new Item({
            content: 'toto',
            file: {
                path: '/some/absolute/path/',
                name: 'swagger.json'
            }
        })
        let resolver = this.__init(item)

        let result = resolver.resolve(_path)
        result.then(data => {
            let obj = JSON.parse(data)
            this.assertEqual(obj, {
                value: 42
            })
            done()
        }, error => {
            throw new Error(error)
        }).catch(error => {
            done(new Error(error))
        })
    }

    @targets('resolve')
    testResolveWithRelativeData(done) {
        const _path = 'collections/dummy.json'
        const item = new Item({
            content: 'toto',
            file: {
                path: __dirname,
                name: 'swagger.json'
            }
        })
        let resolver = this.__init(item)

        let result = resolver.resolve(_path)
        result.then(data => {
            let obj = JSON.parse(data)
            this.assertEqual(obj, {
                value: 42
            })
            done()
        }, error => {
            throw new Error(error)
        }).catch(error => {
            done(new Error(error))
        })
    }

    __init(item) {
        const resolver = new FileResolver(item)
        return resolver
    }
}

@registerTest
@against(URLResolver)
export class TestURLResolver extends UnitTest {

    @targets('resolve')
    testResolveWithLocalData(done) {
        const item = new Item({
            content: 'toto',
            file: {
                path: '/some/absolute/path/',
                name: 'swagger.json'
            }
        })
        let resolver = this.__init(item)

        let result = resolver.resolve('')
        result.then((data) => {
            this.assertEqual(data, 'toto')
            done()
        }, error => {
            throw new Error(error)
        }).catch(error => {
            done(new Error(error))
        })
    }

    // FIXME: this makes a call to an external url
    // on which we have no control. It would be better to
    // mock the request API
    @targets('resolve')
    testResolveWithAbsoluteURL(done) {
        const url =
            'https://apis-guru.github.io/' +
            'api-models/apis-guru.github.io/1.0/' +
            'swagger.json'
        const item = new Item({
            content: 'toto',
            url:
                'https://apis-guru.github.io/' +
                'api-models/bufferapp.com/1/' +
                'swagger.json'
        })
        let resolver = this.__init(item)

        let result = resolver.resolve(url)
        result.then(data => {
            JSON.parse(data)
            this.assertTrue(true)
            done()
        }, error => {
            throw new Error(error)
        }).catch(error => {
            done(new Error(error))
        })
    }

    __init(item) {
        const resolver = new URLResolver(item)
        return resolver
    }
}
