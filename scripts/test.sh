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
else
  echo "invalid TEST_TARGET: $2"
fi
