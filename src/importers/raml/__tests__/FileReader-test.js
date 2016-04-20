import { UnitTest, registerTest } from '../../../utils/TestUtils'

import ShimmingFileReader from '../FileReader'

@registerTest
export class TestFileReader extends UnitTest {
    testConstructor() {
        let items = [ 1, 2, 3, 'test' ]

        let reader = new ShimmingFileReader(items)
        this.assertEqual(reader.items, items)
    }

    testReadFileAsyncWithSimpleFile() {
        const items = [
            {
                content: 'Lorem Ipsum dolor sic amet',
                file: {
                    path: '/some/path',
                    name: 'simpleFile'
                }
            }
        ]

        let reader = new ShimmingFileReader(items)

        reader.readFileAsync('/some/path/simpleFile').then(
            data => {
                this.assertEqual(items[0].content, data)
            }
        ).catch(
            () => {
                this.assertTrue(false)
            }
        )
    }

    testReadFileAsyncWithMissingFile() {
        const items = [
            {
                content: 'Lorem Ipsum dolor sic amet',
                file: {
                    path: '/some/path',
                    name: 'simpleFile'
                }
            }
        ]

        let reader = new ShimmingFileReader(items)

        reader.readFileAsync('/some/path/missingFile').then(
            data => {
                this.assertEqual(data, '::fileRef::/some/path/missingFile')
            }
        ).catch(
            () => {
                this.assertTrue(false)
            }
        )
    }
}
