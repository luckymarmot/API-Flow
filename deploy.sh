#!/bin/bash
if [ "$#" -eq 0 ]
then
    exporters=( $(ls ./src/serializers/paw) )
else
    exporters=( $@ )
fi;

base=$(pwd)
echo $base

for line in "${exporters[@]}"; do
    if [ "$line" != "base-importer" ]
    then
        echo "building $line importer";
        if [ -f "./src/serializers/paw/$line/webpack.config.babel.js" ]
        then
            rm -rf "./src/serializers/paw/$line/build/";
            BUILD_ENV=build ./node_modules/.bin/webpack --bail --display-error-details --config="./src/serializers/paw/$line/webpack.config.babel.js";
            cd "./src/serializers/paw/$line/build";
            identifier=$(ls .);
            package=$(ls "./$identifier" | sed s/.js$/.zip/);
            zip -r "$package" "$identifier/";
            cd $base;
        fi;
    fi;
done
