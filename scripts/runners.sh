#!/usr/bin/env sh
base=$1

#ignore first parm1
shift

# iterate
while test ${#} -gt 0
do
    echo "creating $1 lib in dist/$1"
    rm -rf "$base/dist/$1"
    node "$base/node_modules/webpack/bin/webpack.js" --config "$base/configs/$1/webpack.config.babel.js"
    shift
done
