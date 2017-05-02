base=$1
if [ "$2" = "lint" ]
then
  node "$base/node_modules/eslint/bin/eslint.js" -c "$base/linting/prod.yaml" "$base/src/"
elif [ "$2" = "unit" ]
then
  node "$base/node_modules/.bin/mocha" --require mocha --compilers js:babel-register --reporter spec "$base/src/**/__tests__/*.spec.js"
elif [ "$2" = "e2e" ]
then
  node "$base/node_modules/.bin/mocha" --require mocha --compilers js:babel-register --require "$base/testing/test-require-patch.js" --reporter spec "$base/testing/**/*.spec.js"
elif [ "$2" = "cov" ]
then
  NODE_ENV=test node "$base/node_modules/.bin/nyc" "$base/node_modules/.bin/mocha" "$base/src/**/__tests__/*.spec.js" &&
  CODECLIMATE_REPO_TOKEN=b05fe54c72e82d5ec82bd3d44c43af6a6aa13792e4769c6d6b4bfeee72256dcb "$base/node_modules/.bin/codeclimate-test-reporter" < "$base/coverage/lcov.info"
else
  echo "invalid TEST_TARGET: $2"
fi
