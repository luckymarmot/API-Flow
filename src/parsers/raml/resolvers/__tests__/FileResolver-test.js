import { UnitTest, registerTest } from '../../../../utils/TestUtils'

import ShimmingFileReader from '../FileResolver'

@registerTest
export class TestFileReader extends UnitTest {
  testConstructor() {
    const items = [ 1, 2, 3, 'test' ]

    const reader = new ShimmingFileReader(items)
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

    const reader = new ShimmingFileReader(items)

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

    const reader = new ShimmingFileReader(items)

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
