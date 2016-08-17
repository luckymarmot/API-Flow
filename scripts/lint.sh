#!/usr/bin/env sh
base=$1
node "$base/node_modules/eslint/bin/eslint.js" -c "$base/linting/prod.yaml" "$base/src/"
