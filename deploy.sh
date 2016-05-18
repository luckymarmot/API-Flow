#!/bin/bash
exporters=( $(ls ./src/serializers/paw) )

for line in "${exporters[@]}"; do
	if [ "$line" != "base-importer" ]
	then
		echo "building $line importer";
		if [ -f "./src/serializers/paw/$line/webpack.config.babel.js" ]
		then
			BUILD_ENV=build ./node_modules/.bin/webpack --bail --display-error-details --config="./src/serializers/paw/$line/webpack.config.babel.js"
		fi;
	fi;
done