base=$1
node "$base/node_modules/.bin/mocha" --require mocha --compilers js:babel-register --reporter spec "$base/src/**/__tests__/*-test.js"
