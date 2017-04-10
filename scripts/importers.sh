#!/usr/bin/env sh
base=$1

#ignore first parm1
shift
set -e

mkdir -p "$base/dist/paw";

# iterate
while test ${#} -gt 0
do
    echo "creating $1 importer"
    if [ -f "$base/configs/paw/importers/$1/webpack.config.babel.js" ]
    then
        $base/node_modules/webpack/bin/webpack.js --bail --display-error-details --config="$base/configs/paw/importers/$1/webpack.config.babel.js";
    else
        echo "no webpack config file found for $1. skipping..."
    fi;
    shift
done
