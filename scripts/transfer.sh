#!/usr/bin/env sh
base=$1
dir=$2

if [ -d "$base/dist/paw" ]
then
  echo "transfering all paw extensions to extension folder"
  cp -r "$base/dist/paw/" "$dir"
fi;
