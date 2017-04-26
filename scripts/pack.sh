#!/usr/bin/env sh
base=$1

mkdir -p "$base/releases/paw";

paw_extensions="$base/dist/paw/*"
echo "paw extensions: $paw_extensions"
cd "$base/dist/paw"
for extension in $paw_extensions
do
  echo "extension: $extension"
  if [ -d "$extension" ]
  then
    cd "$extension/.."
    echo "in $extension --- $(ls)"
    package=$(echo "$extension" | sed -E 's-.*/([^/]+)-\1-')
    echo "package --- $package"
    zip -r "$package.zip" "./$package";
    mv "./$package.zip" "$base/releases/paw/";
    cd "$base"
  fi;
done;
cd "$base"
