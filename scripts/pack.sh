#!/usr/bin/env sh
base=$1
#ignore first parm1
shift

mkdir -p "$base/releases/paw/importers";
mkdir -p "$base/releases/paw/generators";

# iterate
while test ${#} -gt 0
do
    if [ -d "$base/dist/paw/importers/$1" ]
    then
        cd "$base/dist/paw/importers/$1";
        echo "packing $1 importer"
        files=./*
        for file in $files
        do
            package=$(ls "./$file" | sed s/.js$/.zip/);
            echo "ready to pack $package with $file"
            zip -r "$package" "$file/";
            mv "./$package" "$base/releases/paw/importers/";
        done;
        cd $base;
    fi;

    if [ -d "$base/dist/paw/generators/$1" ]
    then
        cd "$base/dist/paw/generators/$1";
        echo "packing $1 generator"
        files=./*
        for file in $files
        do
            package=$(ls "./$file" | sed s/.js$/.zip/);
            echo "ready to pack $package with $file"
            zip -r "$package" "$file/";
            mv "./$package" "$base/releases/paw/generators/";
        done;
        cd $base;
    fi;
    shift
done
