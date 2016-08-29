#!/usr/bin/env sh
base=$1

#ignore first parm1
shift

# iterate
while test ${#} -gt 0
do
    echo "creating $1 runner"
    rm -rf "$base/dist/$1"
    TARGET_ENV=$1 node "$base/node_modules/webpack/bin/webpack.js"
    shift
done
