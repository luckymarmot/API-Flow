#!/bin/bash
exporters=( $(ls ./src/exporters) )

for line in "${exporters[@]}"; do
	if [ "$line" != "base-importer" ]
	then
		echo "building $line importer";
		if [ -f "./src/exporters/$line/webpack.config.babel.js" ]
		then
			BUILD_ENV=build ./node_modules/.bin/webpack --bail --display-error-details --config="./src/exporters/$line/webpack.config.babel.js"
		fi;
	fi;
done