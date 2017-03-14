import { UnitTest, registerTest } from '../TestUtils'
import Immutable from 'immutable'

import ShellTokenizer from '../ShellTokenizer'

@registerTest
export class TestShellTokenizer extends UnitTest {
  testExample() {
    this.__testSimpleSpaceSplit(
            'toto titi"foo"bar foo\\ bar', [ 'toto', 'titifoobar', 'foo bar' ]
        )
  }

  testSplitOnPipe() {
    this.__testSimpleSpaceSplit(
            'curl my-url|cat', [ 'curl', 'my-url', '|', 'cat' ]
        )
  }

  testSplitOnPipeWithSpaces() {
    this.__testSimpleSpaceSplit(
            'curl my-url | cat', [ 'curl', 'my-url', '|', 'cat' ]
        )
  }

  testSplitOnRedirect() {
    this.__testSimpleSpaceSplit(
            'curl my-url>cat', [ 'curl', 'my-url', '>', 'cat' ]
        )
  }

  testSplitOnRedirectWithSpaces() {
    this.__testSimpleSpaceSplit(
            'curl my-url > cat', [ 'curl', 'my-url', '>', 'cat' ]
        )
  }

  testSplitOnRedirectAppend() {
    this.__testSimpleSpaceSplit(
            'curl my-url>>cat', [ 'curl', 'my-url', '>>', 'cat' ]
        )
  }

  testSplitOnRedirectAppendWithSpaces() {
    this.__testSimpleSpaceSplit(
            'curl my-url >> cat', [ 'curl', 'my-url', '>>', 'cat' ]
        )
  }

  testSplitOnRedirect1() {
    this.__testSimpleSpaceSplit(
            'curl my-url1>cat', [ 'curl', 'my-url1', '>', 'cat' ]
        )
  }

  testSplitOnRedirect1WithSpaces() {
    this.__testSimpleSpaceSplit(
            'curl my-url 1> cat', [ 'curl', 'my-url', '1>', 'cat' ]
        )
  }

  testSplitOnRedirect1Append() {
    this.__testSimpleSpaceSplit(
            'curl my-url1>>cat', [ 'curl', 'my-url1', '>>', 'cat' ]
        )
  }

  testSplitOnRedirect1AppendWithSpaces() {
    this.__testSimpleSpaceSplit(
            'curl my-url 1>> cat', [ 'curl', 'my-url', '1>>', 'cat' ]
        )
  }

  testSplitOnRedirect2() {
    this.__testSimpleSpaceSplit(
            'curl my-url2>cat', [ 'curl', 'my-url2', '>', 'cat' ]
        )
  }

  testSplitOnRedirect2WithSpaces() {
    this.__testSimpleSpaceSplit(
            'curl my-url 2> cat', [ 'curl', 'my-url', '2>', 'cat' ]
        )
  }

  testSplitOnRedirect2Append() {
    this.__testSimpleSpaceSplit(
            'curl my-url2>>cat', [ 'curl', 'my-url2', '>>', 'cat' ]
        )
  }

  testSplitOnRedirect2AppendWithSpaces() {
    this.__testSimpleSpaceSplit(
            'curl my-url 2>> cat', [ 'curl', 'my-url', '2>>', 'cat' ]
        )
  }

  testSplitOnImport() {
    this.__testSimpleSpaceSplit(
            'curl my-url<file', [ 'curl', 'my-url', '<', 'file' ]
        )
  }

  testSplitOnImportWithSpaces() {
    this.__testSimpleSpaceSplit(
            'curl my-url < file', [ 'curl', 'my-url', '<', 'file' ]
        )
  }

  testSplitOnImport0() {
    this.__testSimpleSpaceSplit(
            'curl my-url0<file', [ 'curl', 'my-url0', '<', 'file' ]
        )
  }

  testSplitOnImport0WithSpaces() {
    this.__testSimpleSpaceSplit(
            'curl my-url 0< file', [ 'curl', 'my-url', '0<', 'file' ]
        )
  }

  testSplitOnSemicolon() {
    this.__testSimpleSpaceSplit(
            'curl my-url;curl', [ 'curl', 'my-url', ';', 'curl' ]
        )
  }

  testSplitOnSimpleAnd() {
    this.__testSimpleSpaceSplit(
            'curl my-url&curl', [ 'curl', 'my-url', '&', 'curl' ]
        )
  }

  testSplitOnDoubleAnd() {
    this.__testSimpleSpaceSplit(
            'curl my-url&&curl', [ 'curl', 'my-url', '&&', 'curl' ]
        )
  }

  testUnicodeSimpleOpenQuote() {
    this.__testSimpleSpaceSplit(
            'curl -XPOST https://httpbin.org/post ' +
            '--data-urlencode ‘username=username\'',
      [
        'curl',
        '-XPOST',
        'https://httpbin.org/post',
        '--data-urlencode',
        'username=username'
      ]
        )
  }

  testUnicodeSimpleCloseQuote() {
    this.__testSimpleSpaceSplit(
            'curl -XPOST https://httpbin.org/post ' +
            '--data-urlencode \'username=username’',
      [
        'curl',
        '-XPOST',
        'https://httpbin.org/post',
        '--data-urlencode',
        'username=username'
      ]
        )
  }

  testUnicodeDoubleOpenQuote() {
    this.__testSimpleSpaceSplit(
            'curl -XPOST https://httpbin.org/post ' +
            '--data-urlencode “username=username"',
      [
        'curl',
        '-XPOST',
        'https://httpbin.org/post',
        '--data-urlencode',
        'username=username'
      ]
        )
  }

  testUnicodeDoubleCloseQuote() {
    this.__testSimpleSpaceSplit(
            'curl -XPOST https://httpbin.org/post ' +
            '--data-urlencode "username=username”',
      [
        'curl',
        '-XPOST',
        'https://httpbin.org/post',
        '--data-urlencode',
        'username=username'
      ]
        )
  }

  testUnicodeMixedQuotes() {
    this.__testSimpleSpaceSplit(
            'curl -XPOST "https://httpbin.org/post” ' +
            '--”data”-‘urlencode‘ \'username=username‘',
      [
        'curl',
        '-XPOST',
        'https://httpbin.org/post',
        '--data-urlencode',
        'username=username'
      ]
        )
  }

  testExamplesFromYaml() {
    const tests = JSON.parse(
            require('fs')
                .readFileSync(__dirname + '/generated/tests.json', 'utf8')
        ).tests
    tests.forEach(item => {
      let output = item.output
      if (typeof output === 'string') {
        output = [ output ]
      }
      this.__testSimpleSpaceSplit(item.input, output)
    })
  }

  __testSimpleSpaceSplit(input, output) {
    const tokenizer = new ShellTokenizer()
    const tokens = tokenizer.tokenize(input)
    this.assertEqual(tokens.count(), Immutable.fromJS(output).count())
    this.assertTrue(Immutable.is(tokens, Immutable.fromJS(output)))
  }
}
