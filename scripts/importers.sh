#!/usr/bin/env sh
base=$1

#ignore first parm1
shift
set -e
# iterate
while test ${#} -gt 0
do
    echo "creating $1 importer"
    if [ -f "$base/src/serializers/paw/$1/webpack.config.babel.js" ]
    then
        rm -rf "$base/dist/paw/importers/$1/";
        $base/node_modules/webpack/bin/webpack.js --bail --display-error-details --config="./src/serializers/paw/$1/webpack.config.babel.js";
    else
        echo "no webpack config file found for $1. skipping..."
    fi;
    shift
done
