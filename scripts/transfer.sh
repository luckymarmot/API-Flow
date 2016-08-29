#!/usr/bin/env sh
base=$1
dir=$2

# skip base and dir
shift
shift


mkdir -p "$dir"
# iterate
while test ${#} -gt 0
do
    if [ -d "$base/dist/paw/importers/$1" ]
    then
        echo "transferring $1 importer to extension folder"
        cp -r "$base/dist/paw/importers/$1/" "$dir"
    fi;
    if [ -d "$base/dist/paw/generators/$1" ]
    then
        echo "transferring $1 generator to extension folder"
        cp -r "$base/dist/paw/generators/$1/" "$dir"
    fi;
    shift
done
