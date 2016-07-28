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
            ls ./src/serializers/paw/$line
            rm -rf "./build/$line/";
            ./node_modules/webpack/bin/webpack.js --bail --display-error-details --config="./src/serializers/paw/$line/webpack.config.babel.js";
            cd "./build/$line";
            files=./*
            for file in $files
            do
                echo "working on folder -> $file"
                package=$(ls "./$file" | sed s/.js$/.zip/);
                zip -r "$package" "$file/";
            done;
            cd $base;
        fi;
    fi;
done
