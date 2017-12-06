PRs are always welcome, and we'll be happy to merge them if the test suite passes.

To run the entire test suite would take a long time, so we've broken it down into various groups:

``` shell
TEST_TARGET=lint make test
TEST_TARGET=unit make test
TEST_TARGET=e2e make test
TEST_TARGET=cov make test
```

All of these will be run by Travis, but you could save the ice caps from melting a little by running at least `unit` and `e2e` before you push.

Our sole requirement is that organizations that want to extend API-Flow to support their format write both a parser and a serializer, and not simply a serializer.
