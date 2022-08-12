#!/usr/bin/env bash
set -o errexit -o nounset

# put node on the path
node_path=$(dirname "$1")
if [[ "$node_path" == external/* ]]; then
    node_path="${node_path:9}"
fi
PATH="$PWD/../$node_path:$PATH"

tmpdir=$(mktemp -d)

echo "Copying e2e test files to $tmpdir..."
mkdir -p "$tmpdir/integration/clover"
rsync -av -L integration/clover/ "$tmpdir/integration/clover" --exclude node_modules
ln -s $PWD/integration/clover/node_modules "$tmpdir/integration/clover/node_modules"
ln -s $PWD/integration/node_modules "$tmpdir/integration/node_modules"

cd "$tmpdir/integration/clover"
ls -la .
node --version
./node_modules/.bin/ng run clover:build-static
# node test.sh
