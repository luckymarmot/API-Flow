#!/usr/bin/env sh
base=$1
action=$2

echo "starting to watch"

if hash fswatch 2>/dev/null; then
    fswatch -l 5 -0 "$base/src" | xargs -0 -n1 -I{} make $action
fi
