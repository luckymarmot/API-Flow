#!/usr/bin/env sh
base=$1

#ignore first parm1
shift
set -e
# iterate
while test ${#} -gt 0
do
    echo "creating $1 generator"
    if [ -f "$base/src/runners/paw-generator/$1/webpack.config.babel.js" ]
    then
        rm -rf "$base/dist/paw/generators/$1/";
        $base/node_modules/webpack/bin/webpack.js --bail --display-error-details --config="$base/src/runners/paw-generator/$1/webpack.config.babel.js";
    else
        echo "no webpack config file found for $1. skipping..."
    fi;
    shift
done
