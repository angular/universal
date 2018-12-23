#!/usr/bin/env bash
# Build the dist/modules-dist directory in the same fashion as the legacy
# /build.sh script, by building the npm packages with Bazel and copying files.
# This is needed for scripts and tests which are not updated to the Bazel output
# layout (which always matches the input layout).
# Do not add new dependencies on this script, instead adapt scripts to use the
# new layout, and write new tests as Bazel targets.

set -u -e -o pipefail

cd "$(dirname "$0")"

# basedir is the workspace root
readonly basedir=$(pwd)/..
# We need to resolve the Bazel binary in the node modules because running Bazel
# through `yarn bazel` causes additional output that throws off command stdout.
readonly bazelBin=$(yarn bin)/bazel
readonly bin=$(${bazelBin} info bazel-bin)

function buildTargetPackages() {
  targets="$1"
  destPath="$2"
  desc="$3"

  echo "##################################"
  echo "scripts/build-modules-dist.sh:"
  echo "  building @nguniversal/* npm packages"
  echo "  mode: ${desc}"
  echo "##################################"

  # Use --config=release so that snapshot builds get published with embedded version info
  echo "$targets" | xargs ${bazelBin} build

  [ -d "${basedir}/${destPath}" ] || mkdir -p $basedir/${destPath}

  dirs=`echo "$targets" | sed -e 's/\/\/modules\/\(.*\):npm_package/\1/'`

  for pkg in $dirs; do
    # Skip any that don't have an "npm_package" target
    srcDir="${bin}/modules/${pkg}/npm_package"
    destDir="${basedir}/${destPath}/${pkg}"
    if [ -d $srcDir ]; then
      echo "# Copy artifacts to ${destDir}"
      rm -rf $destDir
      cp -R $srcDir $destDir
      chmod -R u+w $destDir
    fi
  done
}

# Ideally these integration tests should run under bazel, and just list the npm
# packages in their deps[].
# Until then, we have to manually run bazel first to create the npm packages we
# want to test.
BAZEL_TARGETS=`${bazelBin} query --output=label 'attr("tags", "\[.*release\]", //modules/...) intersect kind(".*_package", //modules/...)'`
buildTargetPackages "$BAZEL_TARGETS" "dist/modules-dist" "Production"
